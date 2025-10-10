"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
class CommentsService {
    // Create comment
    static async createComment(taskId, userId, content) {
        return (0, database_1.transaction)(async (client) => {
            // Verify user has access to task's project
            const taskCheck = await client.query(`SELECT t.id, t.project_id, pm.role
         FROM tasks t
         INNER JOIN project_members pm ON t.project_id = pm.project_id
         WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`, [taskId, userId]);
            if (taskCheck.rows.length === 0) {
                throw new errorHandler_1.AppError('Task not found or access denied', 404);
            }
            const projectId = taskCheck.rows[0].project_id;
            // Create comment
            const result = await client.query(`INSERT INTO comments (task_id, user_id, content)
         VALUES ($1, $2, $3)
         RETURNING *`, [taskId, userId, content]);
            const comment = result.rows[0];
            // Log activity
            await client.query(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`, [projectId, userId, 'comment', comment.id, 'created', JSON.stringify({ task_id: taskId })]);
            // Get comment with user details
            const commentWithUser = await client.query(`SELECT
          c.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email
         FROM comments c
         INNER JOIN users u ON c.user_id = u.id
         WHERE c.id = $1`, [comment.id]);
            return commentWithUser.rows[0];
        });
    }
    // List comments for a task
    static async listComments(taskId, userId) {
        // Verify user has access to task
        const accessCheck = await (0, database_1.query)(`SELECT t.id
       FROM tasks t
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`, [taskId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Task not found or access denied', 404);
        }
        // Get comments with user details
        const result = await (0, database_1.query)(`SELECT
        c.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       WHERE c.task_id = $1 AND c.deleted_at IS NULL
       ORDER BY c.created_at ASC`, [taskId]);
        return result.rows;
    }
    // Get comment by ID
    static async getCommentById(commentId, userId) {
        const result = await (0, database_1.query)(`SELECT
        c.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
       FROM comments c
       INNER JOIN users u ON c.user_id = u.id
       INNER JOIN tasks t ON c.task_id = t.id
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE c.id = $1 AND pm.user_id = $2 AND c.deleted_at IS NULL AND t.deleted_at IS NULL`, [commentId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Comment not found or access denied', 404);
        }
        return result.rows[0];
    }
    // Update comment
    static async updateComment(commentId, userId, content) {
        return (0, database_1.transaction)(async (client) => {
            // Get comment and verify ownership
            const commentCheck = await client.query(`SELECT c.*, t.project_id
         FROM comments c
         INNER JOIN tasks t ON c.task_id = t.id
         WHERE c.id = $1 AND c.deleted_at IS NULL AND t.deleted_at IS NULL`, [commentId]);
            if (commentCheck.rows.length === 0) {
                throw new errorHandler_1.AppError('Comment not found', 404);
            }
            const comment = commentCheck.rows[0];
            // Only comment owner can edit (not even project owners)
            if (comment.user_id !== userId) {
                throw new errorHandler_1.AppError('You can only edit your own comments', 403);
            }
            // Update comment
            const result = await client.query(`UPDATE comments
         SET content = $1, updated_at = NOW()
         WHERE id = $2 AND deleted_at IS NULL
         RETURNING *`, [content, commentId]);
            // Log activity
            await client.query(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`, [comment.project_id, userId, 'comment', commentId, 'updated', JSON.stringify({ content })]);
            // Get comment with user details
            const updatedComment = await client.query(`SELECT
          c.*,
          u.first_name || ' ' || u.last_name as user_name,
          u.email as user_email
         FROM comments c
         INNER JOIN users u ON c.user_id = u.id
         WHERE c.id = $1`, [commentId]);
            return updatedComment.rows[0];
        });
    }
    // Delete comment
    static async deleteComment(commentId, userId) {
        return (0, database_1.transaction)(async (client) => {
            // Get comment and verify ownership or project manager/owner
            const commentCheck = await client.query(`SELECT c.*, t.project_id, pm.role
         FROM comments c
         INNER JOIN tasks t ON c.task_id = t.id
         INNER JOIN project_members pm ON t.project_id = pm.project_id
         WHERE c.id = $1 AND pm.user_id = $2 AND c.deleted_at IS NULL AND t.deleted_at IS NULL`, [commentId, userId]);
            if (commentCheck.rows.length === 0) {
                throw new errorHandler_1.AppError('Comment not found or access denied', 404);
            }
            const comment = commentCheck.rows[0];
            const role = comment.role;
            // Can delete if: owner of comment OR project owner/manager
            const canDelete = comment.user_id === userId || role === 'owner' || role === 'manager';
            if (!canDelete) {
                throw new errorHandler_1.AppError('You can only delete your own comments', 403);
            }
            // Soft delete comment
            await client.query(`UPDATE comments
         SET deleted_at = NOW(), updated_at = NOW()
         WHERE id = $1`, [commentId]);
            // Log activity
            await client.query(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action)
         VALUES ($1, $2, $3, $4, $5)`, [comment.project_id, userId, 'comment', commentId, 'deleted']);
        });
    }
    // Get activity logs for a project
    static async getProjectActivity(projectId, userId, filters) {
        // Verify user has access to project
        const accessCheck = await (0, database_1.query)(`SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`, [projectId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        // Build query
        let queryText = `
      SELECT
        al.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM activity_logs al
      INNER JOIN users u ON al.user_id = u.id
      WHERE al.project_id = $1
    `;
        const params = [projectId];
        let paramIndex = 2;
        // Apply filters
        if (filters?.entityType) {
            queryText += ` AND al.entity_type = $${paramIndex}`;
            params.push(filters.entityType);
            paramIndex++;
        }
        if (filters?.action) {
            queryText += ` AND al.action = $${paramIndex}`;
            params.push(filters.action);
            paramIndex++;
        }
        // Get total count
        const countResult = await (0, database_1.query)(`SELECT COUNT(*) as total FROM (${queryText}) as filtered`, params);
        const total = parseInt(countResult.rows[0].total);
        // Add ordering and pagination
        queryText += ` ORDER BY al.created_at DESC`;
        if (filters?.limit) {
            queryText += ` LIMIT $${paramIndex}`;
            params.push(filters.limit);
            paramIndex++;
        }
        if (filters?.offset) {
            queryText += ` OFFSET $${paramIndex}`;
            params.push(filters.offset);
            paramIndex++;
        }
        // Get activities
        const result = await (0, database_1.query)(queryText, params);
        return {
            activities: result.rows,
            total,
        };
    }
    // Get activity logs for a task
    static async getTaskActivity(taskId, userId, limit) {
        // Verify user has access to task
        const accessCheck = await (0, database_1.query)(`SELECT t.project_id
       FROM tasks t
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`, [taskId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Task not found or access denied', 404);
        }
        const projectId = accessCheck.rows[0].project_id;
        // Get activities related to this task
        let queryText = `
      SELECT
        al.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
      FROM activity_logs al
      INNER JOIN users u ON al.user_id = u.id
      WHERE al.project_id = $1
        AND (
          (al.entity_type = 'task' AND al.entity_id = $2)
          OR (al.entity_type = 'comment' AND al.entity_id IN (
            SELECT id FROM comments WHERE task_id = $2 AND deleted_at IS NULL
          ))
        )
      ORDER BY al.created_at DESC
    `;
        const params = [projectId, taskId];
        if (limit) {
            queryText += ` LIMIT $3`;
            params.push(limit);
        }
        const result = await (0, database_1.query)(queryText, params);
        return result.rows;
    }
    // Get recent activity across all user's projects
    static async getUserActivity(userId, limit = 50) {
        const result = await (0, database_1.query)(`SELECT
        al.*,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email,
        p.name as project_name
       FROM activity_logs al
       INNER JOIN users u ON al.user_id = u.id
       INNER JOIN projects p ON al.project_id = p.id
       INNER JOIN project_members pm ON p.id = pm.project_id
       WHERE pm.user_id = $1 AND p.deleted_at IS NULL
       ORDER BY al.created_at DESC
       LIMIT $2`, [userId, limit]);
        return result.rows;
    }
}
exports.CommentsService = CommentsService;
exports.default = CommentsService;
//# sourceMappingURL=comments.service.js.map