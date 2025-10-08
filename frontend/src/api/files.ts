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
    if (fileType.startsWith('image/')) return '🖼️';
    if (fileType.startsWith('video/')) return '🎥';
    if (fileType.startsWith('audio/')) return '🎵';
    if (fileType.includes('pdf')) return '📄';
    if (fileType.includes('word') || fileType.includes('document')) return '📝';
    if (fileType.includes('excel') || fileType.includes('spreadsheet')) return '📊';
    if (fileType.includes('powerpoint') || fileType.includes('presentation')) return '📽️';
    if (fileType.includes('zip') || fileType.includes('compressed')) return '🗜️';
    if (fileType.includes('text')) return '📃';
    return '📎';
  },
};

export default filesApi;
