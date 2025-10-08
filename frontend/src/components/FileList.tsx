import { useState } from 'react';
import { Download, Trash2, FileText } from 'lucide-react';
import { FileAttachment, filesApi } from '../api/files';
import { formatDistanceToNow } from 'date-fns';
import toast from 'react-hot-toast';

interface FileListProps {
  files: FileAttachment[];
  currentUserId: number;
  onDelete: (fileId: number) => void;
}

export const FileList: React.FC<FileListProps> = ({
  files,
  currentUserId,
  onDelete,
}) => {
  const [deletingFileId, setDeletingFileId] = useState<number | null>(null);
  const [downloadingFileId, setDownloadingFileId] = useState<number | null>(null);

  const handleDownload = async (file: FileAttachment) => {
    setDownloadingFileId(file.id);
    try {
      const blob = await filesApi.download(file.id);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = file.file_name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('File downloaded');
    } catch (error: any) {
      toast.error('Failed to download file');
    } finally {
      setDownloadingFileId(null);
    }
  };

  const handleDelete = async (file: FileAttachment) => {
    if (!confirm(`Delete ${file.file_name}?`)) return;

    setDeletingFileId(file.id);
    try {
      await filesApi.delete(file.id);
      onDelete(file.id);
      toast.success('File deleted');
    } catch (error: any) {
      toast.error('Failed to delete file');
    } finally {
      setDeletingFileId(null);
    }
  };

  const canDelete = (file: FileAttachment) => {
    return file.uploaded_by === currentUserId;
  };

  if (files.length === 0) {
    return (
      <div className="text-center py-8 bg-gray-50 rounded-lg">
        <FileText size={32} className="mx-auto text-gray-400 mb-2" />
        <p className="text-sm text-gray-600">No files attached</p>
        <p className="text-xs text-gray-500 mt-1">Upload files to share with your team</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {files.map((file) => (
        <div
          key={file.id}
          className="flex items-center justify-between bg-gray-50 rounded-lg p-3 hover:bg-gray-100 transition-colors"
        >
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="text-2xl flex-shrink-0">
              {filesApi.getFileIcon(file.mime_type)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {file.file_name}
              </p>
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <span>{filesApi.formatFileSize(file.file_size)}</span>
                <span>•</span>
                <span>{file.uploader_name}</span>
                <span>•</span>
                <span>{formatDistanceToNow(new Date(file.created_at), { addSuffix: true })}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => handleDownload(file)}
              disabled={downloadingFileId === file.id}
              className="p-2 text-gray-600 hover:text-primary-600 hover:bg-white rounded transition-colors"
              title="Download"
            >
              {downloadingFileId === file.id ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-600"></div>
              ) : (
                <Download size={16} />
              )}
            </button>

            {canDelete(file) && (
              <button
                onClick={() => handleDelete(file)}
                disabled={deletingFileId === file.id}
                className="p-2 text-gray-600 hover:text-red-600 hover:bg-white rounded transition-colors"
                title="Delete"
              >
                {deletingFileId === file.id ? (
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                ) : (
                  <Trash2 size={16} />
                )}
              </button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default FileList;
