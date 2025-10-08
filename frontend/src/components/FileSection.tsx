import { useState, useEffect } from 'react';
import { Paperclip } from 'lucide-react';
import { filesApi, FileAttachment } from '../api/files';
import FileUpload from './FileUpload';
import FileList from './FileList';
import toast from 'react-hot-toast';

interface FileSectionProps {
  taskId: number;
  currentUserId: number;
}

export const FileSection: React.FC<FileSectionProps> = ({
  taskId,
  currentUserId,
}) => {
  const [files, setFiles] = useState<FileAttachment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadFiles();
  }, [taskId]);

  const loadFiles = async () => {
    try {
      setIsLoading(true);
      const data = await filesApi.list(taskId);
      setFiles(data);
    } catch (error) {
      toast.error('Failed to load files');
    } finally {
      setIsLoading(false);
    }
  };

  const handleUploadSuccess = () => {
    loadFiles();
  };

  const handleDelete = (fileId: number) => {
    setFiles(files.filter(f => f.id !== fileId));
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 text-gray-700">
        <Paperclip size={18} />
        <h3 className="font-medium">
          Attachments ({files.length})
        </h3>
      </div>

      {/* Upload Area */}
      <FileUpload
        taskId={taskId}
        onUploadSuccess={handleUploadSuccess}
        maxSize={10}
      />

      {/* Files List */}
      <div>
        {isLoading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
          </div>
        ) : (
          <FileList
            files={files}
            currentUserId={currentUserId}
            onDelete={handleDelete}
          />
        )}
      </div>
    </div>
  );
};

export default FileSection;
