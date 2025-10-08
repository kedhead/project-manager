import api from './client';

export interface Comment {
  id: number;
  task_id: number;
  user_id: number;
  content: string;
  created_at: string;
  updated_at: string;
  user_name: string;
  user_email: string;
}

export interface CreateCommentData {
  content: string;
}

export interface UpdateCommentData {
  content: string;
}

export interface ActivityLog {
  id: number;
  project_id: number;
  user_id: number;
  action_type: string;
  entity_type: string;
  entity_id: number;
  details: any;
  created_at: string;
  user_name: string;
}

export const commentsApi = {
  // List comments for a task
  list: async (taskId: number): Promise<Comment[]> => {
    const response = await api.get(`/tasks/${taskId}/comments`);
    return response.data.data.comments;
  },

  // Create comment
  create: async (taskId: number, data: CreateCommentData): Promise<Comment> => {
    const response = await api.post(`/tasks/${taskId}/comments`, data);
    return response.data.data.comment;
  },

  // Update comment
  update: async (commentId: number, data: UpdateCommentData): Promise<Comment> => {
    const response = await api.put(`/comments/${commentId}`, data);
    return response.data.data.comment;
  },

  // Delete comment
  delete: async (commentId: number): Promise<void> => {
    await api.delete(`/comments/${commentId}`);
  },

  // Get project activity feed
  getProjectActivity: async (projectId: number, limit: number = 50): Promise<ActivityLog[]> => {
    const response = await api.get(`/projects/${projectId}/activity?limit=${limit}`);
    return response.data.data.activities;
  },

  // Get task activity feed
  getTaskActivity: async (taskId: number, limit: number = 50): Promise<ActivityLog[]> => {
    const response = await api.get(`/tasks/${taskId}/activity?limit=${limit}`);
    return response.data.data.activities;
  },

  // Get user activity feed
  getUserActivity: async (limit: number = 50): Promise<ActivityLog[]> => {
    const response = await api.get(`/activity?limit=${limit}`);
    return response.data.data.activities;
  },
};

export default commentsApi;
