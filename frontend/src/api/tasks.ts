import api from './client';

export interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  duration: number | null;
  progress: number;
  status: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'critical';
  assigned_to: number | null;
  created_by: number;
  parent_task_id: number | null;
  created_at: string;
  updated_at: string;
  assigned_user_name: string | null;
  assigned_user_email: string | null;
  created_user_name: string;
  subtask_count: number;
  dependency_count: number;
  dependencies?: TaskDependency[];
}

export interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  dependency_type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish';
  lag_time: number;
  depends_on_title?: string;
  depends_on_status?: string;
  depends_on_progress?: number;
}

export interface CreateTaskData {
  title: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: number;
  parentTaskId?: number;
}

export interface UpdateTaskData {
  title?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  duration?: number;
  progress?: number;
  status?: 'not_started' | 'in_progress' | 'completed' | 'blocked' | 'cancelled';
  priority?: 'low' | 'medium' | 'high' | 'critical';
  assignedTo?: number | null;
  parentTaskId?: number | null;
}

export const tasksApi = {
  // List tasks for a project
  list: async (projectId: number, filters?: { status?: string; priority?: string }): Promise<Task[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.priority) params.append('priority', filters.priority);

    const response = await api.get(`/projects/${projectId}/tasks?${params.toString()}`);
    return response.data.data.tasks;
  },

  // Get task by ID
  get: async (id: number): Promise<Task> => {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data.task;
  },

  // Create task
  create: async (projectId: number, data: CreateTaskData): Promise<Task> => {
    const response = await api.post(`/projects/${projectId}/tasks`, data);
    return response.data.data.task;
  },

  // Update task
  update: async (id: number, data: UpdateTaskData): Promise<Task> => {
    const response = await api.put(`/tasks/${id}`, data);
    return response.data.data.task;
  },

  // Delete task
  delete: async (id: number): Promise<void> => {
    await api.delete(`/tasks/${id}`);
  },

  // Add dependency
  addDependency: async (
    taskId: number,
    dependsOnTaskId: number,
    type: 'finish_to_start' | 'start_to_start' | 'finish_to_finish' | 'start_to_finish' = 'finish_to_start',
    lagTime: number = 0
  ): Promise<TaskDependency> => {
    const response = await api.post(`/tasks/${taskId}/dependencies`, {
      dependsOnTaskId,
      dependencyType: type,
      lagTime,
    });
    return response.data.data.dependency;
  },

  // Get task dependencies
  getDependencies: async (taskId: number): Promise<TaskDependency[]> => {
    const response = await api.get(`/tasks/${taskId}/dependencies`);
    return response.data.data.dependencies;
  },

  // Remove dependency
  removeDependency: async (taskId: number, dependencyId: number): Promise<void> => {
    await api.delete(`/tasks/${taskId}/dependencies/${dependencyId}`);
  },

  // Bulk update tasks (for Gantt drag-and-drop)
  bulkUpdate: async (
    projectId: number,
    updates: Array<{ id: number; startDate?: string; endDate?: string; duration?: number; progress?: number }>
  ): Promise<void> => {
    await api.post(`/projects/${projectId}/tasks/bulk-update`, { updates });
  },
};

export default tasksApi;
