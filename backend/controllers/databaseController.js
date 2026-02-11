import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

dotenv.config();

const execPromise = promisify(exec);

const splitValues = (valuesRaw) => {
  const values = [];
  let current = '';
  let inString = false;
  let stringChar = null;
  let escaped = false;

  for (let i = 0; i < valuesRaw.length; i++) {
    const char = valuesRaw[i];

    if (escaped) {
      current += char;
      escaped = false;
      continue;
    }

    if (char === '\\') {
      current += char;
      escaped = true;
      continue;
    }

    if ((char === '"' || char === "'") && !escaped) {
      if (!inString) {
        inString = true;
        stringChar = char;
      } else if (char === stringChar) {
        inString = false;
        stringChar = null;
      }
      current += char;
      continue;
    }

    if (char === ',' && !inString) {
      values.push(current.trim());
      current = '';
      continue;
    }

    current += char;
  }

  if (current.length > 0) {
    values.push(current.trim());
  }

  return values;
};

const sanitizeInvoiceInsertLine = (line) => {
  if (!line.startsWith('INSERT INTO `invoices` ')) {
    return line;
  }

  const columnsStart = line.indexOf('(');
  const columnsEnd = line.indexOf(') VALUES');
  if (columnsStart === -1 || columnsEnd === -1) {
    return line;
  }

  const columnsRaw = line.slice(columnsStart + 1, columnsEnd);
  const valuesStart = line.indexOf('VALUES', columnsEnd);
  const valuesOpen = line.indexOf('(', valuesStart);
  const valuesClose = line.lastIndexOf(');');

  if (valuesStart === -1 || valuesOpen === -1 || valuesClose === -1) {
    return line;
  }

  const valuesRaw = line.slice(valuesOpen + 1, valuesClose);
  const columns = columnsRaw.split(',').map((col) => col.trim().replace(/`/g, ''));
  const values = splitValues(valuesRaw);

  const signatureIndex = columns.indexOf('signatureImage');
  const stampIndex = columns.indexOf('stampImage');

  if (signatureIndex !== -1) {
    values[signatureIndex] = 'NULL';
  }
  if (stampIndex !== -1) {
    values[stampIndex] = 'NULL';
  }

  return `INSERT INTO \`invoices\` (${columnsRaw}) VALUES (${values.join(', ')});`;
};

/**
 * Export database dengan format yang MySQL-friendly
 * - Split INSERT statements per row (--skip-extended-insert)
 * - Increase max_allowed_packet untuk handle data besar
 */
export const exportDatabase = async (req, res) => {
  try {
    // Check if we are using MySQL
    const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'mysql');

    if (dialect !== 'mysql') {
      return res.status(501).json({
        success: false,
        message: 'Database export is currently only supported for MySQL. PostgreSQL support coming soon.',
      });
    }

    const stripImages = req.query.stripImages === '1' || req.query.stripImages === 'true';
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
    const filename = `invoiceapp-backup-${timestamp}.sql`;
    const outputPath = path.join(process.cwd(), 'backups', filename);

    // Create backups directory if not exists
    const backupsDir = path.join(process.cwd(), 'backups');
    if (!fs.existsSync(backupsDir)) {
      fs.mkdirSync(backupsDir, { recursive: true });
    }

    const dbHost = process.env.DB_HOST || '127.0.0.1';
    const dbPort = process.env.DB_PORT || 3306;
    const dbName = process.env.DB_NAME || 'invoiceapp';
    const dbUser = process.env.DB_USER || 'root';
    const dbPass = process.env.DB_PASS || '';
    const mysqldumpPath = process.env.MYSQLDUMP_PATH || 'mysqldump';
    const mysqldumpBin = mysqldumpPath.startsWith('"') && mysqldumpPath.endsWith('"')
      ? mysqldumpPath
      : (mysqldumpPath.includes(' ') ? `"${mysqldumpPath}"` : mysqldumpPath);

    // Build mysqldump command with options to avoid huge single-line INSERTs
    const mysqldumpCmd = [
      mysqldumpBin,
      '--skip-extended-insert',  // IMPORTANT: One INSERT per row
      '--single-transaction',     // Consistent backup
      '--quick',                  // Don't buffer entire table in memory
      '--lock-tables=false',      // Don't lock tables
      `--host=${dbHost}`,
      `--port=${dbPort}`,
      `--user=${dbUser}`,
      dbPass ? `--password=${dbPass}` : '',
      dbName,
      `> "${outputPath}"`
    ].filter(Boolean).join(' ');

    console.log(`📦 Exporting database: ${dbName}`);
    console.log(`📁 Output: ${outputPath}`);

    // Execute mysqldump
    await execPromise(mysqldumpCmd, { maxBuffer: 50 * 1024 * 1024 }); // 50MB buffer

    // Check if file was created
    if (!fs.existsSync(outputPath)) {
      throw new Error('Export file was not created');
    }

    if (stripImages) {
      const content = fs.readFileSync(outputPath, 'utf8');
      const updated = content
        .split('\n')
        .map((line) => sanitizeInvoiceInsertLine(line))
        .join('\n');
      fs.writeFileSync(outputPath, updated, 'utf8');
      console.log('✅ Export sanitized: signatureImage & stampImage set to NULL');
    }

    const stats = fs.statSync(outputPath);
    console.log(`✅ Export completed: ${(stats.size / 1024 / 1024).toFixed(2)} MB`);

    // Send file for download
    res.download(outputPath, filename, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            message: 'Error downloading file',
            error: err.message
          });
        }
      }

      // Optional: Clean up old backups (keep last 5)
      setTimeout(() => {
        try {
          const files = fs.readdirSync(backupsDir)
            .filter(f => f.startsWith('invoiceapp-backup-'))
            .map(f => ({
              name: f,
              path: path.join(backupsDir, f),
              time: fs.statSync(path.join(backupsDir, f)).mtime.getTime()
            }))
            .sort((a, b) => b.time - a.time);

          // Keep only last 5 backups
          if (files.length > 5) {
            files.slice(5).forEach(file => {
              fs.unlinkSync(file.path);
              console.log(`🗑️  Deleted old backup: ${file.name}`);
            });
          }
        } catch (err) {
          console.error('Error cleaning up old backups:', err);
        }
      }, 5000);
    });

  } catch (error) {
    console.error('❌ Export database error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to export database',
      error: error.message,
      hint: 'Make sure mysqldump is installed and accessible in PATH'
    });
  }
};

/**
 * Get MySQL configuration recommendations
 */
export const getMySQLConfig = async (req, res) => {
  try {
     // Check if we are using MySQL
    const dialect = process.env.DB_DIALECT || (process.env.DATABASE_URL ? 'postgres' : 'mysql');

    if (dialect !== 'mysql') {
      return res.status(200).json({
        success: true,
        message: 'Configuration checks are only relevant for MySQL.',
        recommendations: {}
      });
    }

    res.json({
      success: true,
      message: 'MySQL Configuration Recommendations',
      recommendations: {
        max_allowed_packet: {
          current: 'Run: SHOW VARIABLES LIKE "max_allowed_packet"',
          recommended: '64M or higher',
          reason: 'To handle large base64 images in invoices',
          howToSet: [
            'In my.cnf or my.ini file, add:',
            '[mysqld]',
            'max_allowed_packet=64M',
            '',
            'Or run SQL command:',
            'SET GLOBAL max_allowed_packet=67108864; -- 64MB'
          ]
        },
        import_tips: [
          '1. Use --max_allowed_packet option:',
          '   mysql --max_allowed_packet=64M -u root -p database_name < backup.sql',
          '',
          '2. Or import via PHP MyAdmin with increased limits',
          '',
          '3. For very large files, use mysql command line instead of GUI tools'
        ]
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Error getting MySQL config',
      error: error.message
    });
  }
};
