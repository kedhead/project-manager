import { useState } from 'react';
import { Download, FileSpreadsheet, FileText, File } from 'lucide-react';
import { exportApi } from '../api/export';
import toast from 'react-hot-toast';

interface ExportMenuProps {
  projectId: number;
  projectName: string;
}

export const ExportMenu: React.FC<ExportMenuProps> = ({ projectId, projectName }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [exportingFormat, setExportingFormat] = useState<string | null>(null);

  const handleExport = async (format: 'excel' | 'csv' | 'pdf') => {
    setExportingFormat(format);
    try {
      let blob: Blob;
      let filename: string;

      switch (format) {
        case 'excel':
          blob = await exportApi.exportToExcel(projectId);
          filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tasks.xlsx`;
          break;
        case 'csv':
          blob = await exportApi.exportToCSV(projectId);
          filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tasks.csv`;
          break;
        case 'pdf':
          blob = await exportApi.exportToPDF(projectId);
          filename = `${projectName.replace(/[^a-z0-9]/gi, '_').toLowerCase()}_tasks.pdf`;
          break;
        default:
          throw new Error('Invalid format');
      }

      exportApi.downloadBlob(blob, filename);
      toast.success(`Exported to ${format.toUpperCase()} successfully`);
      setIsOpen(false);
    } catch (error: any) {
      toast.error(`Failed to export to ${format.toUpperCase()}`);
    } finally {
      setExportingFormat(null);
    }
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-secondary flex items-center gap-2"
      >
        <Download size={20} />
        Export
      </button>

      {isOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 z-10"
            onClick={() => setIsOpen(false)}
          />

          {/* Dropdown Menu */}
          <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 z-20">
            <div className="p-2 border-b border-gray-200">
              <p className="text-xs font-medium text-gray-700 px-2 py-1">
                Export Tasks
              </p>
            </div>

            <div className="p-2 space-y-1">
              <button
                onClick={() => handleExport('excel')}
                disabled={exportingFormat !== null}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <FileSpreadsheet size={18} className="text-green-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium">Excel (.xlsx)</div>
                  <div className="text-xs text-gray-500">Formatted spreadsheet</div>
                </div>
                {exportingFormat === 'excel' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                )}
              </button>

              <button
                onClick={() => handleExport('csv')}
                disabled={exportingFormat !== null}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <FileText size={18} className="text-blue-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium">CSV (.csv)</div>
                  <div className="text-xs text-gray-500">Comma-separated values</div>
                </div>
                {exportingFormat === 'csv' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                )}
              </button>

              <button
                onClick={() => handleExport('pdf')}
                disabled={exportingFormat !== null}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
              >
                <File size={18} className="text-red-600" />
                <div className="flex-1 text-left">
                  <div className="font-medium">PDF (.pdf)</div>
                  <div className="text-xs text-gray-500">Printable document</div>
                </div>
                {exportingFormat === 'pdf' && (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
                )}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default ExportMenu;
