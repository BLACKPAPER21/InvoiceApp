import { useState } from 'react';
import { Database, Download, Info, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';

const API_URL = 'http://localhost:5000/api';

const DatabaseTools = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportStatus, setExportStatus] = useState(null); // { type: 'success' | 'error', mode?: 'full' | 'lite' }
  const [showInfo, setShowInfo] = useState(false);

  const handleExportDatabase = async (stripImages = false) => {
    try {
      setIsExporting(true);
      setExportStatus(null);

      // Trigger download
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
      const filename = stripImages
        ? `invoiceapp-backup-lite-${timestamp}.sql`
        : `invoiceapp-backup-${timestamp}.sql`;
      const exportUrl = stripImages
        ? `${API_URL}/database/export?stripImages=1`
        : `${API_URL}/database/export`;

      // Create download link
      const link = document.createElement('a');
      link.href = exportUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportStatus({ type: 'success', mode: stripImages ? 'lite' : 'full' });

      // Clear success message after 5 seconds
      setTimeout(() => setExportStatus(null), 5000);
    } catch (error) {
      console.error('Export error:', error);
      setExportStatus({ type: 'error' });

      // Clear error message after 5 seconds
      setTimeout(() => setExportStatus(null), 5000);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="glass-card p-6 border border-gray-200">
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-500/10 rounded-xl">
            <Database className="w-6 h-6 text-indigo-600" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Database Backup</h3>
            <p className="text-sm text-gray-600">Export database with proper formatting</p>
          </div>
        </div>

        <button
          onClick={() => setShowInfo(!showInfo)}
          className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          title="Show info"
        >
          <Info className="w-5 h-5 text-gray-500" />
        </button>
      </div>

      {/* Info Panel */}
      {showInfo && (
        <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm space-y-2">
          <p className="font-semibold text-blue-900">✨ Export Improvements:</p>
          <ul className="space-y-1 text-blue-800">
            <li>• Split INSERT statements per row (no more huge lines!)</li>
            <li>• MySQL-friendly format for easy import</li>
            <li>• Auto backup saved to <code className="bg-blue-100 px-1 rounded">backend/backups/</code></li>
            <li>• Export tanpa gambar untuk file yang lebih kecil</li>
          </ul>
          <p className="font-semibold text-blue-900 mt-3">📥 Import Instructions:</p>
          <code className="block bg-blue-900 text-blue-50 p-2 rounded mt-1 font-mono text-xs">
            mysql --max_allowed_packet=64M -u root -p invoiceapp &lt; backup.sql
          </code>
        </div>
      )}

      {/* Status Messages */}
      {exportStatus?.type === 'success' && (
        <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-2">
          <CheckCircle className="w-5 h-5 text-emerald-600" />
          <span className="text-sm text-emerald-800 font-medium">
            ✅ Export {exportStatus.mode === 'lite' ? 'tanpa gambar' : 'lengkap'} berhasil! Cek folder downloads.
          </span>
        </div>
      )}

      {exportStatus?.type === 'error' && (
        <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-lg flex items-center gap-2">
          <AlertCircle className="w-5 h-5 text-rose-600" />
          <span className="text-sm text-rose-800 font-medium">
            ❌ Export failed. Make sure backend server is running.
          </span>
        </div>
      )}

      {/* Export Buttons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <button
          onClick={() => handleExportDatabase(false)}
          disabled={isExporting}
          className="w-full btn-primary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isExporting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Exporting...</span>
            </>
          ) : (
            <>
              <Download className="w-5 h-5" />
              <span>Export Lengkap</span>
            </>
          )}
        </button>

        <button
          onClick={() => handleExportDatabase(true)}
          disabled={isExporting}
          className="w-full btn-secondary flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Download className="w-5 h-5" />
          <span>Export Tanpa Gambar</span>
        </button>
      </div>

      {/* Quick Info */}
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-xs text-gray-600">
          <strong>💡 Tip:</strong> Jika masih ada baris super panjang karena base64 gambar, gunakan "Export Tanpa Gambar".
        </p>
      </div>
    </div>
  );
};

export default DatabaseTools;
