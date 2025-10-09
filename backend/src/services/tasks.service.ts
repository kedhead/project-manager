import { query, transaction } from '../config/database';
import { AppError } from '../middleware/errorHandler';

interface Task {
  id: number;
  project_id: number;
  title: string;
  description: string | null;
  start_date: Date | null;
  end_date: Date | null;
  duration: number | null;
  progress: number;
  status: string;
  priority: string;
  assigned_to: number | null;
  created_by: number;
  parent_task_id: number | null;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
}

interface TaskWithDetails extends Task {
  assigned_user_name: string | null;
  assigned_user_email: string | null;
  created_user_name: string;
  subtask_count: number;
  dependency_count: number;
  dependencies?: TaskDependency[];
}

interface TaskDependency {
  id: number;
  task_id: number;
  depends_on_task_id: number;
  dependency_type: string;
  lag_time: number;
}

export class TasksService {
  // Create new task
  static async createTask(
    projectId: number,
    userId: number,
    data: {
      title: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      duration?: number;
      status?: string;
      priority?: string;
      assignedTo?: number;
      assignedGroupId?: number;
      parentTaskId?: number;
    }
  ): Promise<TaskWithDetails> {
    return transaction(async (client) => {
      // Verify user has project access
      const accessCheck = await client.query(
        `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (accessCheck.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const role = accessCheck.rows[0].role;
      if (role === 'viewer') {
        throw new AppError('Viewers cannot create tasks', 403);
      }

      // Validate dates
      if (data.startDate && data.endDate && new Date(data.startDate) > new Date(data.endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
      }

      // If parent task specified, verify it exists and belongs to same project
      if (data.parentTaskId) {
        const parentCheck = await client.query(
          `SELECT id FROM tasks WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
          [data.parentTaskId, projectId]
        );

        if (parentCheck.rows.length === 0) {
          throw new AppError('Parent task not found in this project', 404);
        }
      }

      // If assigned user specified, verify they are a project member
      if (data.assignedTo) {
        const memberCheck = await client.query(
          `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
          [projectId, data.assignedTo]
        );

        if (memberCheck.rows.length === 0) {
          throw new AppError('Assigned user is not a project member', 400);
        }
      }

      // Create task
      const result = await client.query(
        `INSERT INTO tasks (
          project_id, title, description, start_date, end_date, duration,
          status, priority, assigned_to, assigned_group_id, created_by, parent_task_id
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
        RETURNING *`,
        [
          projectId,
          data.title,
          data.description || null,
          data.startDate || null,
          data.endDate || null,
          data.duration || null,
          data.status || 'not_started',
          data.priority || 'medium',
          data.assignedTo || null,
          data.assignedGroupId || null,
          userId,
          data.parentTaskId || null,
        ]
      );

      const task = result.rows[0];

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, userId, 'task', task.id, 'created', JSON.stringify({ title: data.title })]
      );

      // Get task with details
      return this.getTaskByIdInternal(client, task.id, userId);
    });
  }

  // List tasks for a project
  static async listTasks(
    projectId: number,
    userId: number,
    filters?: {
      status?: string;
      priority?: string;
      assignedTo?: number;
      parentTaskId?: number | null;
      search?: string;
    }
  ): Promise<TaskWithDetails[]> {
    // Verify user has project access
    const accessCheck = await query(
      `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
      [projectId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new AppError('Project not found or access denied', 404);
    }

    let queryText = `
      SELECT
        t.*,
        u1.first_name || ' ' || u1.last_name as assigned_user_name,
        u1.email as assigned_user_email,
        u2.first_name || ' ' || u2.last_name as created_user_name,
        g.name as assigned_group_name,
        g.color as assigned_group_color,
        COUNT(DISTINCT st.id) as subtask_count,
        COUNT(DISTINCT td.id) as dependency_count
      FROM tasks t
      LEFT JOIN users u1 ON t.assigned_to = u1.id
      INNER JOIN users u2 ON t.created_by = u2.id
      LEFT JOIN groups g ON t.assigned_group_id = g.id AND g.deleted_at IS NULL
      LEFT JOIN tasks st ON st.parent_task_id = t.id AND st.deleted_at IS NULL
      LEFT JOIN task_dependencies td ON td.task_id = t.id
      WHERE t.project_id = $1 AND t.deleted_at IS NULL
    `;

    const params: any[] = [projectId];
    let paramIndex = 2;

    // Apply filters
    if (filters?.status) {
      queryText += ` AND t.status = $${paramIndex}`;
      params.push(filters.status);
      paramIndex++;
    }

    if (filters?.priority) {
      queryText += ` AND t.priority = $${paramIndex}`;
      params.push(filters.priority);
      paramIndex++;
    }

    if (filters?.assignedTo !== undefined) {
      if (filters.assignedTo === null) {
        queryText += ` AND t.assigned_to IS NULL`;
      } else {
        queryText += ` AND t.assigned_to = $${paramIndex}`;
        params.push(filters.assignedTo);
        paramIndex++;
      }
    }

    if (filters?.parentTaskId !== undefined) {
      if (filters.parentTaskId === null) {
        queryText += ` AND t.parent_task_id IS NULL`;
      } else {
        queryText += ` AND t.parent_task_id = $${paramIndex}`;
        params.push(filters.parentTaskId);
        paramIndex++;
      }
    }

    if (filters?.search) {
      queryText += ` AND (t.title ILIKE $${paramIndex} OR t.description ILIKE $${paramIndex})`;
      params.push(`%${filters.search}%`);
      paramIndex++;
    }

    queryText += `
      GROUP BY t.id, u1.first_name, u1.last_name, u1.email, u2.first_name, u2.last_name, g.name, g.color
      ORDER BY t.start_date ASC NULLS LAST, t.created_at DESC
    `;

    const result = await query(queryText, params);
    return result.rows;
  }

  // Get task by ID
  static async getTaskById(taskId: number, userId: number): Promise<TaskWithDetails> {
    const result = await query(
      `SELECT
        t.*,
        u1.first_name || ' ' || u1.last_name as assigned_user_name,
        u1.email as assigned_user_email,
        u2.first_name || ' ' || u2.last_name as created_user_name,
        g.name as assigned_group_name,
        g.color as assigned_group_color,
        COUNT(DISTINCT st.id) as subtask_count,
        COUNT(DISTINCT td.id) as dependency_count
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       INNER JOIN users u2 ON t.created_by = u2.id
       LEFT JOIN groups g ON t.assigned_group_id = g.id AND g.deleted_at IS NULL
       LEFT JOIN tasks st ON st.parent_task_id = t.id AND st.deleted_at IS NULL
       LEFT JOIN task_dependencies td ON td.task_id = t.id
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL
       GROUP BY t.id, u1.first_name, u1.last_name, u1.email, u2.first_name, u2.last_name, g.name, g.color`,
      [taskId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Task not found or access denied', 404);
    }

    const task = result.rows[0];

    // Get dependencies
    const depsResult = await query(
      `SELECT td.*, t.title as depends_on_title
       FROM task_dependencies td
       INNER JOIN tasks t ON td.depends_on_task_id = t.id
       WHERE td.task_id = $1`,
      [taskId]
    );

    task.dependencies = depsResult.rows;

    return task;
  }

  // Internal method for getting task within a transaction
  private static async getTaskByIdInternal(client: any, taskId: number, userId: number): Promise<TaskWithDetails> {
    const result = await client.query(
      `SELECT
        t.*,
        u1.first_name || ' ' || u1.last_name as assigned_user_name,
        u1.email as assigned_user_email,
        u2.first_name || ' ' || u2.last_name as created_user_name,
        0 as subtask_count,
        0 as dependency_count
       FROM tasks t
       LEFT JOIN users u1 ON t.assigned_to = u1.id
       INNER JOIN users u2 ON t.created_by = u2.id
       WHERE t.id = $1 AND t.deleted_at IS NULL`,
      [taskId]
    );

    return result.rows[0];
  }

  // Update task
  static async updateTask(
    taskId: number,
    userId: number,
    updates: {
      title?: string;
      description?: string;
      startDate?: Date;
      endDate?: Date;
      duration?: number;
      progress?: number;
      status?: string;
      priority?: string;
      assignedTo?: number | null;
      assignedGroupId?: number | null;
      parentTaskId?: number | null;
    }
  ): Promise<TaskWithDetails> {
    return transaction(async (client) => {
      // Get task and verify access
      const taskCheck = await client.query(
        `SELECT t.*, pm.role
         FROM tasks t
         INNER JOIN project_members pm ON t.project_id = pm.project_id
         WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`,
        [taskId, userId]
      );

      if (taskCheck.rows.length === 0) {
        throw new AppError('Task not found or access denied', 404);
      }

      const task = taskCheck.rows[0];
      const role = task.role;

      if (role === 'viewer') {
        throw new AppError('Viewers cannot update tasks', 403);
      }

      // Validate dates
      if (updates.startDate && updates.endDate && new Date(updates.startDate) > new Date(updates.endDate)) {
        throw new AppError('Start date cannot be after end date', 400);
      }

      // Validate progress
      if (updates.progress !== undefined && (updates.progress < 0 || updates.progress > 100)) {
        throw new AppError('Progress must be between 0 and 100', 400);
      }

      // If parent task changed, verify it exists
      if (updates.parentTaskId !== undefined && updates.parentTaskId !== null) {
        const parentCheck = await client.query(
          `SELECT id FROM tasks WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
          [updates.parentTaskId, task.project_id]
        );

        if (parentCheck.rows.length === 0) {
          throw new AppError('Parent task not found in this project', 404);
        }

        // Prevent circular parent relationships
        if (updates.parentTaskId === taskId) {
          throw new AppError('Task cannot be its own parent', 400);
        }
      }

      // If assigned user changed, verify they are a project member
      if (updates.assignedTo !== undefined && updates.assignedTo !== null) {
        const memberCheck = await client.query(
          `SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`,
          [task.project_id, updates.assignedTo]
        );

        if (memberCheck.rows.length === 0) {
          throw new AppError('Assigned user is not a project member', 400);
        }
      }

      // Build update query
      const updateFields: string[] = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (updates.title !== undefined) {
        updateFields.push(`title = $${paramIndex}`);
        values.push(updates.title);
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

      if (updates.duration !== undefined) {
        updateFields.push(`duration = $${paramIndex}`);
        values.push(updates.duration);
        paramIndex++;
      }

      if (updates.progress !== undefined) {
        updateFields.push(`progress = $${paramIndex}`);
        values.push(updates.progress);
        paramIndex++;
      }

      if (updates.status !== undefined) {
        updateFields.push(`status = $${paramIndex}`);
        values.push(updates.status);
        paramIndex++;
      }

      if (updates.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex}`);
        values.push(updates.priority);
        paramIndex++;
      }

      if (updates.assignedTo !== undefined) {
        updateFields.push(`assigned_to = $${paramIndex}`);
        values.push(updates.assignedTo);
        paramIndex++;
      }

      if (updates.assignedGroupId !== undefined) {
        updateFields.push(`assigned_group_id = $${paramIndex}`);
        values.push(updates.assignedGroupId);
        paramIndex++;
      }

      if (updates.parentTaskId !== undefined) {
        updateFields.push(`parent_task_id = $${paramIndex}`);
        values.push(updates.parentTaskId);
        paramIndex++;
      }

      if (updateFields.length === 0) {
        throw new AppError('No fields to update', 400);
      }

      updateFields.push(`updated_at = NOW()`);
      values.push(taskId);

      // Update task
      const result = await client.query(
        `UPDATE tasks
         SET ${updateFields.join(', ')}
         WHERE id = $${paramIndex} AND deleted_at IS NULL
         RETURNING *`,
        values
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [task.project_id, userId, 'task', taskId, 'updated', JSON.stringify(updates)]
      );

      return this.getTaskByIdInternal(client, taskId, userId);
    });
  }

  // Delete task
  static async deleteTask(taskId: number, userId: number): Promise<void> {
    return transaction(async (client) => {
      // Get task and verify access
      const taskCheck = await client.query(
        `SELECT t.*, pm.role
         FROM tasks t
         INNER JOIN project_members pm ON t.project_id = pm.project_id
         WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`,
        [taskId, userId]
      );

      if (taskCheck.rows.length === 0) {
        throw new AppError('Task not found or access denied', 404);
      }

      const task = taskCheck.rows[0];
      const role = task.role;

      if (role === 'viewer') {
        throw new AppError('Viewers cannot delete tasks', 403);
      }

      // Soft delete task
      await client.query(
        `UPDATE tasks
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1`,
        [taskId]
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action)
         VALUES ($1, $2, $3, $4, $5)`,
        [task.project_id, userId, 'task', taskId, 'deleted']
      );
    });
  }

  // Add task dependency
  static async addDependency(
    taskId: number,
    userId: number,
    dependsOnTaskId: number,
    dependencyType: string = 'finish_to_start',
    lagTime: number = 0
  ): Promise<TaskDependency> {
    return transaction(async (client) => {
      // Verify user has access to the task
      const taskCheck = await client.query(
        `SELECT t.project_id, pm.role
         FROM tasks t
         INNER JOIN project_members pm ON t.project_id = pm.project_id
         WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`,
        [taskId, userId]
      );

      if (taskCheck.rows.length === 0) {
        throw new AppError('Task not found or access denied', 404);
      }

      const projectId = taskCheck.rows[0].project_id;
      const role = taskCheck.rows[0].role;

      if (role === 'viewer') {
        throw new AppError('Viewers cannot add dependencies', 403);
      }

      // Verify depends-on task exists in same project
      const dependsOnCheck = await client.query(
        `SELECT id FROM tasks WHERE id = $1 AND project_id = $2 AND deleted_at IS NULL`,
        [dependsOnTaskId, projectId]
      );

      if (dependsOnCheck.rows.length === 0) {
        throw new AppError('Dependent task not found in this project', 404);
      }

      // Prevent self-dependency
      if (taskId === dependsOnTaskId) {
        throw new AppError('Task cannot depend on itself', 400);
      }

      // Check for existing dependency
      const existingCheck = await client.query(
        `SELECT id FROM task_dependencies WHERE task_id = $1 AND depends_on_task_id = $2`,
        [taskId, dependsOnTaskId]
      );

      if (existingCheck.rows.length > 0) {
        throw new AppError('Dependency already exists', 409);
      }

      // TODO: Check for circular dependencies (more complex - implement later if needed)

      // Create dependency
      const result = await client.query(
        `INSERT INTO task_dependencies (task_id, depends_on_task_id, dependency_type, lag_time)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [taskId, dependsOnTaskId, dependencyType, lagTime]
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [projectId, userId, 'task_dependency', result.rows[0].id, 'created',
         JSON.stringify({ task_id: taskId, depends_on_task_id: dependsOnTaskId, type: dependencyType })]
      );

      return result.rows[0];
    });
  }

  // Remove task dependency
  static async removeDependency(dependencyId: number, userId: number): Promise<void> {
    return transaction(async (client) => {
      // Get dependency and verify access
      const depCheck = await client.query(
        `SELECT td.*, t.project_id, pm.role
         FROM task_dependencies td
         INNER JOIN tasks t ON td.task_id = t.id
         INNER JOIN project_members pm ON t.project_id = pm.project_id
         WHERE td.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`,
        [dependencyId, userId]
      );

      if (depCheck.rows.length === 0) {
        throw new AppError('Dependency not found or access denied', 404);
      }

      const dependency = depCheck.rows[0];
      const role = dependency.role;

      if (role === 'viewer') {
        throw new AppError('Viewers cannot remove dependencies', 403);
      }

      // Delete dependency
      await client.query(
        `DELETE FROM task_dependencies WHERE id = $1`,
        [dependencyId]
      );

      // Log activity
      await client.query(
        `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action)
         VALUES ($1, $2, $3, $4, $5)`,
        [dependency.project_id, userId, 'task_dependency', dependencyId, 'deleted']
      );
    });
  }

  // Get task dependencies
  static async getTaskDependencies(taskId: number, userId: number): Promise<any[]> {
    // Verify access
    const accessCheck = await query(
      `SELECT t.id
       FROM tasks t
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`,
      [taskId, userId]
    );

    if (accessCheck.rows.length === 0) {
      throw new AppError('Task not found or access denied', 404);
    }

    // Get dependencies with task details
    const result = await query(
      `SELECT
        td.*,
        t.title as depends_on_title,
        t.status as depends_on_status,
        t.progress as depends_on_progress
       FROM task_dependencies td
       INNER JOIN tasks t ON td.depends_on_task_id = t.id
       WHERE td.task_id = $1 AND t.deleted_at IS NULL
       ORDER BY td.created_at`,
      [taskId]
    );

    return result.rows;
  }

  // Bulk update tasks (useful for Gantt drag-and-drop)
  static async bulkUpdateTasks(
    projectId: number,
    userId: number,
    updates: Array<{ id: number; startDate?: Date; endDate?: Date; duration?: number; progress?: number }>
  ): Promise<void> {
    return transaction(async (client) => {
      // Verify user has project access
      const accessCheck = await client.query(
        `SELECT role FROM project_members WHERE project_id = $1 AND user_id = $2`,
        [projectId, userId]
      );

      if (accessCheck.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const role = accessCheck.rows[0].role;
      if (role === 'viewer') {
        throw new AppError('Viewers cannot update tasks', 403);
      }

      // Update each task
      for (const update of updates) {
        const updateFields: string[] = [];
        const values: any[] = [];
        let paramIndex = 1;

        if (update.startDate !== undefined) {
          updateFields.push(`start_date = $${paramIndex}`);
          values.push(update.startDate);
          paramIndex++;
        }

        if (update.endDate !== undefined) {
          updateFields.push(`end_date = $${paramIndex}`);
          values.push(update.endDate);
          paramIndex++;
        }

        if (update.duration !== undefined) {
          updateFields.push(`duration = $${paramIndex}`);
          values.push(update.duration);
          paramIndex++;
        }

        if (update.progress !== undefined) {
          updateFields.push(`progress = $${paramIndex}`);
          values.push(update.progress);
          paramIndex++;
        }

        if (updateFields.length > 0) {
          updateFields.push(`updated_at = NOW()`);
          values.push(update.id);
          values.push(projectId);

          await client.query(
            `UPDATE tasks
             SET ${updateFields.join(', ')}
             WHERE id = $${paramIndex} AND project_id = $${paramIndex + 1} AND deleted_at IS NULL`,
            values
          );
        }
      }

      // Log activity (use first task ID from updates as entity_id)
      if (updates.length > 0) {
        await client.query(
          `INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [projectId, userId, 'task', updates[0].id, 'updated', JSON.stringify({ count: updates.length })]
        );
      }
    });
  }
}

export default TasksService;
