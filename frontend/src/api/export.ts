import api from './client';

export const exportApi = {
  // Export project tasks to Excel
  exportToExcel: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/export/excel`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export project tasks to CSV
  exportToCSV: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/export/csv`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export project tasks to PDF
  exportToPDF: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/export/pdf`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Export project tasks to Google Sheets
  exportToGoogleSheets: async (projectId: number): Promise<Blob> => {
    const response = await api.get(`/projects/${projectId}/export/google-sheets`, {
      responseType: 'blob',
    });
    return response.data;
  },

  // Helper to download blob as file
  downloadBlob: (blob: Blob, filename: string) => {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default exportApi;
