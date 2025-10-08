import { query, transaction } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface Project {
  id: number;
  name: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  status: string;
  created_by: number;
  created_at: Date;
  updated_at: Date;
}

interface ProjectMember {
  id: number;
  project_id: number;
  user_id: number;
  role: string;
  joined_at: Date;
}

interface ProjectWithRole extends Project {
  user_role: string;
  member_count: number;
  task_count: number;
}

export class ProjectsService {
  // Create new project
  static async createProject(
    userId: number,
    name: string,
    description: string | null = null,
    startDate: Date | null = null,
    endDate: Date | null = null
  ): Promise<ProjectWithRole> {
    return transaction(async (client) => {
      // Validate dates
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
      }

      // Create project
      const projectResult = await client.query(
        `INSERT INTO projects (name, description, start_date, end_date, created_by)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING *`,
        [name, description, startDate, endDate, userId]
      );

      const project = projectResult.rows[0];

      // Add creator as project owner
      await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)`,
        [project.id, userId, 'owner']
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [project.id, userId, 'project', project.id, 'created', JSON.stringify({ name, description })]
      );

      return {
        ...project,
        user_role: 'owner',
        member_count: 1,
        task_count: 0,
      };
    });
  }

  // List user's projects
  static async listProjects(
    userId: number,
    filters?: { status?: string; search?: string }
  ): Promise<ProjectWithRole[]> {
    let queryText = `
      SELECT
        p.*,
        pm.role as user_role,
        COUNT(DISTINCT pm2.id) as member_count,
        COUNT(DISTINCT t.id) as task_count
      FROM projects p
      INNER JOIN project_members pm ON p.id = pm.project_id
      LEFT JOIN project_members pm2 ON p.id = pm2.project_id
      LEFT JOIN tasks t ON p.id = t.project_id AND t.deleted_at IS NULL
      WHERE pm.user_id = $1 AND p.deleted_at IS NULL
    `;

    const params: any[] = [userId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.status) {
      queryText += ` AND p.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.search) {
      queryText += ` AND (p.name ILIKE $${paramIndex} OR p.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY p.id, pm.role
      ORDER BY p.updated_at DESC
    `;

    const result = await query(queryText, params);
    return result.rows;
  }

  // Get project by ID
  static async getProjectById(projectId: number, userId: number): Promise<ProjectWithRole> {
    const result = await query(
      `SELECT
        p.*,
        pm.role as user_role,
        COUNT(DISTINCT pm2.id) as member_count,
        COUNT(DISTINCT t.id) as task_count
       FROM projects p
       INNER JOIN project_members pm ON p.id = pm.project_id
       LEFT JOIN project_members pm2 ON p.id = pm2.project_id
       LEFT JOIN tasks t ON p.id = t.project_id AND t.deleted_at IS NULL
       WHERE p.id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL
       GROUP BY p.id, pm.role`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found or access denied', 404);
    }

    return result.rows[0];
  }

  // Update project
  static async updateProject(
    projectId: number,
    userId: number,
    updates: {
      name?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      status?: string;
    }
  ): Promise<Project> {
    return transaction(async (client) => {
      // Check user has permission (manager or owner)
      const memberCheck = await client.query(
        `SELECT role FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (memberCheck.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const role = memberCheck.rows[0].role;
      if (role !== 'owner' && role !== 'manager') {
        throw new AppError('Only project owners and managers can update projects', 403);
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex}`);
        values.push(updates.name);
        paramIndex++;
      }

      if (updates.description !== undefined) {
        updateFields.push(`description = $${paramIndex}`);
        values.push(updates.description);
        paramIndex++;
      }

      if (updates.startDate !== undefined) {
        updateFields.push(`start_date = $${paramIndex}`);
        values.push(updates.startDate);
        paramIndex++;
      }

      if (updates.endDate !== undefined) {
        updateFields.push(`end_date = $${paramIndex}`);
        values.push(updates.endDate);
        paramIndex++;
      }

      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        values.push(updates.status);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(projectId);

      // Update project
      const result = await client.query(
        `UPDATE projects
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND deleted_at IS NULL
         RETURNING *`,
        values
      );

      if (result.rows.length === 0) {
        throw new AppError('Project not found', 404);
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, userId, 'project', projectId, 'updated', JSON.stringify(updates)]
      );

      return result.rows[0];
    });
  }

  // Delete project (soft delete)
  static async deleteProject(projectId: number, userId: number): Promise<void> {
    return transaction(async (client) => {
      // Check user is project owner
      const memberCheck = await client.query(
        `SELECT role FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (memberCheck.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const role = memberCheck.rows[0].role;
      if (role !== 'owner') {
        throw new AppError('Only project owners can delete projects', 403);
      }

      // Soft delete project
      const result = await client.query(
        `UPDATE projects
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1 AND deleted_at IS NULL
         RETURNING id`,
        [projectId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Project not found', 404);
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action)
         VALUES ($1, $2, $3, $4, $5)`,
        [projectId, userId, 'project', projectId, 'deleted']
      );
    });
  }

  // Get project members
  static async getProjectMembers(projectId: number, userId: number) {
    // Verify user has access to project
    const accessCheck = await query(
      `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new AppError('Project not found or access denied', 404);
    }

    // Get all members with user details
    const result = await query(
      `SELECT
        pm.id,
        pm.project_id,
        pm.user_id,
        pm.role,
        pm.joined_at,
        u.email,
        u.first_name,
        u.last_name
       FROM project_members pm
       INNER JOIN users u ON pm.user_id = u.id
       WHERE pm.project_id = $1
       ORDER BY
         CASE pm.role
           WHEN 'owner' THEN 1
           WHEN 'manager' THEN 2
           WHEN 'member' THEN 3
           WHEN 'viewer' THEN 4
         END,
         pm.joined_at`,
      [projectId]
    );

    return result.rows;
  }

  // Add member to project
  static async addProjectMember(
    projectId: number,
    userId: number,
    newMemberEmail: string,
    role: string = 'member'
  ): Promise<ProjectMember> {
    return transaction(async (client) => {
      // Check requester has permission (owner or manager)
      const requesterCheck = await client.query(
        `SELECT role FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (requesterCheck.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const requesterRole = requesterCheck.rows[0].role;
      if (requesterRole !== 'owner' && requesterRole !== 'manager') {
        throw new AppError('Only owners and managers can add members', 403);
      }

      // Can't add owners unless requester is owner
      if (role === 'owner' && requesterRole !== 'owner') {
        throw new AppError('Only project owners can add other owners', 403);
      }

      // Find user by email
      const userResult = await client.query(
        `SELECT id FROM users WHERE email = $1 AND deleted_at IS NULL`,
        [newMemberEmail.toLowerCase()]
      );

      if (userResult.rows.length === 0) {
        throw new AppError('User not found', 404);
      }

      const newMemberId = userResult.rows[0].id;

      // Check if already a member
      const existingMember = await client.query(
        `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
        [projectId, newMemberId]
      );

      if (existingMember.rows.length > 0) {
        throw new AppError('User is already a member of this project', 409);
      }

      // Add member
      const result = await client.query(
        `INSERT INTO project_members (project_id, user_id, role)
         VALUES ($1, $2, $3)
         RETURNING *`,
        [projectId, newMemberId, role]
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, userId, 'project_member', result.rows[0].id, 'created',
         JSON.stringify({ added_user_id: newMemberId, role })]
      );

      return result.rows[0];
    });
  }

  // Update member role
  static async updateMemberRole(
    projectId: number,
    userId: number,
    memberId: number,
    newRole: string
  ): Promise<ProjectMember> {
    return transaction(async (client) => {
      // Check requester has permission (owner)
      const requesterCheck = await client.query(
        `SELECT role FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (requesterCheck.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const requesterRole = requesterCheck.rows[0].role;
      if (requesterRole !== 'owner') {
        throw new AppError('Only project owners can change member roles', 403);
      }

      // Can't change own role if you're the only owner
      if (memberId === userId && newRole !== 'owner') {
        const ownerCount = await client.query(
          `SELECT COUNT(*) as count FROM project_members
           WHERE project_id = $1 AND role = 'owner'`,
          [projectId]
        );

        if (parseInt(ownerCount.rows[0].count) === 1) {
          throw new AppError('Cannot change role: you are the only owner', 400);
        }
      }

      // Update role
      const result = await client.query(
        `UPDATE project_members
         SET role = $1
         WHERE project_id = $2 AND user_id = $3
         RETURNING *`,
        [newRole, projectId, memberId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Member not found', 404);
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, userId, 'project_member', result.rows[0].id, 'updated',
         JSON.stringify({ user_id: memberId, new_role: newRole })]
      );

      return result.rows[0];
    });
  }

  // Remove member from project
  static async removeMember(projectId: number, userId: number, memberId: number): Promise<void> {
    return transaction(async (client) => {
      // Check requester has permission (owner or manager)
      const requesterCheck = await client.query(
        `SELECT role FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (requesterCheck.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const requesterRole = requesterCheck.rows[0].role;
      if (requesterRole !== 'owner' && requesterRole !== 'manager') {
        throw new AppError('Only owners and managers can remove members', 403);
      }

      // Get member to be removed
      const memberCheck = await client.query(
        `SELECT role FROM project_members
         WHERE project_id = $1 AND user_id = $2`,
        [projectId, memberId]
      );

      if (memberCheck.rows.length === 0) {
        throw new AppError('Member not found', 404);
      }

      const memberRole = memberCheck.rows[0].role;

      // Can't remove owners unless requester is owner
      if (memberRole === 'owner' && requesterRole !== 'owner') {
        throw new AppError('Only owners can remove other owners', 403);
      }

      // Can't remove yourself if you're the only owner
      if (memberId === userId && memberRole === 'owner') {
        const ownerCount = await client.query(
          `SELECT COUNT(*) as count FROM project_members
           WHERE project_id = $1 AND role = 'owner'`,
          [projectId]
        );

        if (parseInt(ownerCount.rows[0].count) === 1) {
          throw new AppError('Cannot leave: you are the only owner', 400);
        }
      }

      // Remove member
      const result = await client.query(
        `DELETE FROM project_members
         WHERE project_id = $1 AND user_id = $2
         RETURNING id`,
        [projectId, memberId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Member not found', 404);
      }

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, userId, 'project_member', result.rows[0].id, 'deleted',
         JSON.stringify({ removed_user_id: memberId })]
      );
    });
  }
}

export default ProjectsService;
