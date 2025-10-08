import api from './client';

export interface Project {
  id: number;
  name: string;
  description: string | null;
  start_date: string | null;
  end_date: string | null;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  created_by: number;
  created_at: string;
  updated_at: string;
  user_role: 'owner' | 'manager' | 'member' | 'viewer';
  member_count: number;
  task_count: number;
}

export interface CreateProjectData {
  name: string;
  description?: string;
  startDate?: string;
  endDate?: string;
}

export interface UpdateProjectData {
  name?: string;
  description?: string;
  startDate?: string;
  endDate?: string;
  status?: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
}

export interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: 'owner' | 'manager' | 'member' | 'viewer';
  joined_at: string;
  user_email: string;
  user_name: string;
  email?: string; // Deprecated, use user_email
  first_name?: string; // Deprecated, use user_name
  last_name?: string; // Deprecated, use user_name
}

export const projectsApi = {
  // List all projects
  list: async (filters?: { status?: string; search?: string }): Promise<Project[]> => {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.search) params.append('search', filters.search);

    const response = await api.get(`/projects?${params.toString()}`);
    return response.data.data.projects;
  },

  // Get project by ID
  get: async (id: number): Promise<Project> => {
    const response = await api.get(`/projects/${id}`);
    return response.data.data.project;
  },

  // Create project
  create: async (data: CreateProjectData): Promise<Project> => {
    const response = await api.post('/projects', data);
    return response.data.data.project;
  },

  // Update project
  update: async (id: number, data: UpdateProjectData): Promise<Project> => {
    const response = await api.put(`/projects/${id}`, data);
    return response.data.data.project;
  },

  // Delete project
  delete: async (id: number): Promise<void> => {
    await api.delete(`/projects/${id}`);
  },

  // Get project members
  getMembers: async (id: number): Promise<ProjectMember[]> => {
    const response = await api.get(`/projects/${id}/members`);
    return response.data.data.members;
  },

  // Add member to project
  addMember: async (
    id: number,
    email: string,
    role: 'owner' | 'manager' | 'member' | 'viewer' = 'member'
  ): Promise<ProjectMember> => {
    const response = await api.post(`/projects/${id}/members`, { email, role });
    return response.data.data.member;
  },

  // Update member role
  updateMemberRole: async (
    id: number,
    memberId: number,
    role: 'owner' | 'manager' | 'member' | 'viewer'
  ): Promise<ProjectMember> => {
    const response = await api.put(`/projects/${id}/members/${memberId}`, { role });
    return response.data.data.member;
  },

  // Remove member
  removeMember: async (id: number, memberId: number): Promise<void> => {
    await api.delete(`/projects/${id}/members/${memberId}`);
  },
};

export default projectsApi;
