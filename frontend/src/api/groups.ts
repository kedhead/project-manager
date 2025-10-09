import api from './client';

export interface Group {
  id: number;
  project_id: number;
  name: string;
  description: string | null;
  color: string;
  created_by: number;
  created_at: string;
  updated_at: string;
  created_by_name: string;
  member_count: number;
  members?: GroupMember[];
}

export interface GroupMember {
  id: number;
  user_id: number;
  user_name: string;
  user_email: string;
  added_at: string;
}

export interface CreateGroupData {
  name: string;
  description?: string;
  color?: string;
}

export interface UpdateGroupData {
  name?: string;
  description?: string;
  color?: string;
}

export const groupsApi = {
  // List groups for a project
  list: async (projectId: number): Promise<Group[]> => {
    const response = await api.get(`/projects/${projectId}/groups`);
    return response.data.data.groups;
  },

  // Get group by ID
  get: async (id: number): Promise<Group> => {
    const response = await api.get(`/groups/${id}`);
    return response.data.data.group;
  },

  // Create group
  create: async (projectId: number, data: CreateGroupData): Promise<Group> => {
    const response = await api.post(`/projects/${projectId}/groups`, data);
    return response.data.data.group;
  },

  // Update group
  update: async (id: number, data: UpdateGroupData): Promise<Group> => {
    const response = await api.put(`/groups/${id}`, data);
    return response.data.data.group;
  },

  // Delete group
  delete: async (id: number): Promise<void> => {
    await api.delete(`/groups/${id}`);
  },

  // Add member to group
  addMember: async (groupId: number, userId: number): Promise<GroupMember> => {
    const response = await api.post(`/groups/${groupId}/members`, { userId });
    return response.data.data.membership;
  },

  // Remove member from group
  removeMember: async (groupId: number, membershipId: number): Promise<void> => {
    await api.delete(`/groups/${groupId}/members/${membershipId}`);
  },

  // Helper to get default colors for groups
  getDefaultColors: () => [
    '#3B82F6', // Blue
    '#10B981', // Green
    '#F59E0B', // Amber
    '#EF4444', // Red
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#06B6D4', // Cyan
    '#F97316', // Orange
  ],
};

export default groupsApi;
