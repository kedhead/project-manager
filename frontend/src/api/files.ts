import api from './client';

export interface FileAttachment {
  id: number;
  task_id: number;
  uploaded_by: number;
  file_name: string;
  file_path: string;
  file_size: number;
  file_type: string;
  created_at: string;
  uploader_name: string;
  uploader_email: string;
}

export interface StorageUsage {
  total_size: number;
  file_count: number;
  max_size: number;
}

export const filesApi = {
  // List files for a task
  list: async (taskId: number): Promise<FileAttachment[]> => {
    const response = await api.get(`/tasks/${taskId}/files`);
    return response.data.data.files;
  },

  // Upload file
  upload: async (taskId: number, file: File, onProgress?: (progress: number) => void): Promise<FileAttachment> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await api.post(`/tasks/${taskId}/files`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percentCompleted);
        }
      },
    });

    return response.data.data.file;
  },

  // Download file
  download: async (fileId: number): Promise<Blob> => {
    const response = await api.get(`/files/${fileId}/download`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Delete file
  delete: async (fileId: number): Promise<void> => {
    await api.delete(`/files/${fileId}`);
  },

  // Get storage usage
  getStorageUsage: async (): Promise<StorageUsage> => {
    const response = await api.get('/files/storage-usage');
    return response.data.data.usage;
  },

  // Helper to format file size
  formatFileSize: (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  },

  // Helper to get file icon based on type
  getFileIcon: (fileType: string): string => {
    if (!fileType) return '📎';
    const type = fileType.toLowerCase();
    if (type.startsWith('image/')) return '🖼️';
    if (type.startsWith('video/')) return '🎥';
    if (type.startsWith('audio/')) return '🎵';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word') || type.includes('document')) return '📝';
    if (type.includes('excel') || type.includes('spreadsheet')) return '📊';
    if (type.includes('powerpoint') || type.includes('presentation')) return '📽️';
    if (type.includes('zip') || type.includes('compressed')) return '🗜️';
    if (type.includes('text')) return '📃';
    return '📎';
  },
};

export default filesApi;
