import fs from 'fs';
import path from 'path';

// Script untuk fix SQL export yang memiliki INSERT statement terlalu panjang
// Split menjadi multiple INSERT statements (satu per row)

const fixSQLExport = (inputFile, outputFile) => {
  console.log('🔧 Fixing SQL export file...');

  try {
    // Read the SQL file
    const content = fs.readFileSync(inputFile, 'utf8');

    // Split by lines
    const lines = content.split('\n');
    let fixedContent = [];

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Check if this is an INSERT statement with VALUES
      if (line.includes('INSERT INTO') && line.includes('VALUES')) {
        console.log(`📝 Found INSERT statement at line ${i + 1}`);

        // Extract table name and columns
        const insertMatch = line.match(/INSERT INTO `(\w+)` \((.*?)\) VALUES/);
        if (insertMatch) {
          const tableName = insertMatch[1];
          const columns = insertMatch[2];

          // Extract all value tuples - handle nested parentheses and JSON
          const valuesStart = line.indexOf('VALUES') + 6;
          const valuesString = line.substring(valuesStart).trim();

          // Parse values tuples carefully
          const valueTuples = [];
          let depth = 0;
          let currentTuple = '';
          let inString = false;
          let stringChar = null;
          let escaped = false;

          for (let j = 0; j < valuesString.length; j++) {
            const char = valuesString[j];

            // Handle escape sequences
            if (escaped) {
              currentTuple += char;
              escaped = false;
              continue;
            }

            if (char === '\\') {
              escaped = true;
              currentTuple += char;
              continue;
            }

            // Handle strings
            if ((char === '"' || char === "'") && !escaped) {
              if (!inString) {
                inString = true;
                stringChar = char;
              } else if (char === stringChar) {
                inString = false;
                stringChar = null;
              }
              currentTuple += char;
              continue;
            }

            if (!inString) {
              if (char === '(') {
                depth++;
                currentTuple += char;
              } else if (char === ')') {
                depth--;
                currentTuple += char;

                // If we're back to depth 0, we've completed a tuple
                if (depth === 0) {
                  valueTuples.push(currentTuple.trim());
                  currentTuple = '';
                  // Skip comma and whitespace
                  while (j + 1 < valuesString.length &&
                         (valuesString[j + 1] === ',' ||
                          valuesString[j + 1] === ' ' ||
                          valuesString[j + 1] === '\n')) {
                    j++;
                  }
                }
              } else {
                currentTuple += char;
              }
            } else {
              currentTuple += char;
            }
          }

          console.log(`   Found ${valueTuples.length} value tuple(s)`);

          // Create separate INSERT statement for each tuple
          if (valueTuples.length > 0) {
            fixedContent.push(`-- Split INSERT statements for ${tableName} (original line ${i + 1})`);
            valueTuples.forEach((tuple, idx) => {
              const singleInsert = `INSERT INTO \`${tableName}\` (${columns}) VALUES ${tuple};`;
              fixedContent.push(singleInsert);
              if (idx < valueTuples.length - 1) {
                fixedContent.push(''); // Empty line for readability
              }
            });
          }
        }
      } else {
        // Keep other lines as is
        fixedContent.push(line);
      }
    }

    // Write fixed content
    const output = fixedContent.join('\n');
    fs.writeFileSync(outputFile, output, 'utf8');

    console.log(`✅ Fixed SQL saved to: ${outputFile}`);
    console.log(`   Original size: ${content.length} bytes`);
    console.log(`   Fixed size: ${output.length} bytes`);

  } catch (error) {
    console.error('❌ Error fixing SQL:', error.message);
    throw error;
  }
};

// Usage
const inputFile = process.argv[2];
const outputFile = process.argv[3];

if (!inputFile || !outputFile) {
  console.log('Usage: node fix-sql-export.js <input.sql> <output.sql>');
  console.log('Example: node fix-sql-export.js invoiceapp.sql invoiceapp-fixed.sql');
  process.exit(1);
}

fixSQLExport(inputFile, outputFile);
