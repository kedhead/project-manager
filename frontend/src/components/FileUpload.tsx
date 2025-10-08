import { useState, useRef, DragEvent } from 'react';
import { Upload, X } from 'lucide-react';
import { filesApi } from '../api/files';
import toast from 'react-hot-toast';

interface FileUploadProps {
  taskId: number;
  onUploadSuccess: () => void;
  maxSize?: number; // in MB
  acceptedTypes?: string[];
}

export const FileUpload: React.FC<FileUploadProps> = ({
  taskId,
  onUploadSuccess,
  maxSize = 10, // 10MB default
  acceptedTypes = [],
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [uploadingFiles, setUploadingFiles] = useState<Map<string, number>>(new Map());
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    handleFiles(files);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      handleFiles(files);
    }
  };

  const handleFiles = async (files: File[]) => {
    for (const file of files) {
      // Validate file size
      if (file.size > maxSize * 1024 * 1024) {
        toast.error(`${file.name} is too large. Max size is ${maxSize}MB`);
        continue;
      }

      // Validate file type
      if (acceptedTypes.length > 0 && !acceptedTypes.some(type => file.type.includes(type))) {
        toast.error(`${file.name} is not an accepted file type`);
        continue;
      }

      await uploadFile(file);
    }

    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File) => {
    const fileKey = `${file.name}-${Date.now()}`;

    try {
      // Add to uploading files with 0% progress
      setUploadingFiles(prev => new Map(prev).set(fileKey, 0));

      await filesApi.upload(taskId, file, (progress) => {
        setUploadingFiles(prev => new Map(prev).set(fileKey, progress));
      });

      // Remove from uploading files
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileKey);
        return newMap;
      });

      toast.success(`${file.name} uploaded successfully`);
      onUploadSuccess();
    } catch (error: any) {
      // Remove from uploading files
      setUploadingFiles(prev => {
        const newMap = new Map(prev);
        newMap.delete(fileKey);
        return newMap;
      });

      const message = error.response?.data?.message || `Failed to upload ${file.name}`;
      toast.error(message);
    }
  };

  const cancelUpload = (fileKey: string) => {
    setUploadingFiles(prev => {
      const newMap = new Map(prev);
      newMap.delete(fileKey);
      return newMap;
    });
  };

  return (
    <div className="space-y-3">
      {/* Drop Zone */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
          isDragging
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <Upload className="mx-auto mb-2 text-gray-400" size={32} />
        <p className="text-sm text-gray-600 mb-1">
          <span className="text-primary-600 font-medium">Click to upload</span> or drag and drop
        </p>
        <p className="text-xs text-gray-500">
          {acceptedTypes.length > 0
            ? `Accepted types: ${acceptedTypes.join(', ')}`
            : 'Any file type accepted'
          }
          {' • '}
          Max {maxSize}MB
        </p>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          className="hidden"
          onChange={handleFileSelect}
          accept={acceptedTypes.join(',')}
        />
      </div>

      {/* Upload Progress */}
      {uploadingFiles.size > 0 && (
        <div className="space-y-2">
          {Array.from(uploadingFiles.entries()).map(([fileKey, progress]) => {
            const fileName = fileKey.split('-').slice(0, -1).join('-');
            return (
              <div key={fileKey} className="bg-gray-50 rounded-lg p-3">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-gray-700 truncate flex-1">{fileName}</span>
                  <button
                    onClick={() => cancelUpload(fileKey)}
                    className="text-gray-400 hover:text-gray-600 ml-2"
                  >
                    <X size={16} />
                  </button>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full transition-all"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-1">{progress}%</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default FileUpload;
