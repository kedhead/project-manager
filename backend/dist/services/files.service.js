"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
const fs_1 = __importDefault(require("fs"));
const util_1 = require("util");
const unlinkAsync = (0, util_1.promisify)(fs_1.default.unlink);
class FilesService {
    // Upload file to task
    static async uploadFile(taskId, userId, file) {
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
            const role = taskCheck.rows[0].role;
            // Viewers cannot upload files
            if (role === 'viewer') {
                throw new errorHandler_1.AppError('Viewers cannot upload files', 403);
            }
            // Create file attachment record
            const result = await client.query(`INSERT INTO file_attachments (task_id, uploaded_by, file_name, file_path, file_size, mime_type)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`, [
                taskId,
                userId,
                file.originalname,
                file.path,
                file.size,
                file.mimetype,
            ]);
            const attachment = result.rows[0];
            // Log activity
            await client.query(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                projectId,
                userId,
                'file_attachment',
                attachment.id,
                'created',
                JSON.stringify({ task_id: taskId, file_name: file.originalname }),
            ]);
            // Get attachment with user details
            const attachmentWithUser = await client.query(`SELECT
          fa.*,
          u.first_name || ' ' || u.last_name as uploader_name,
          u.email as uploader_email
         FROM file_attachments fa
         INNER JOIN users u ON fa.uploaded_by = u.id
         WHERE fa.id = $1`, [attachment.id]);
            return attachmentWithUser.rows[0];
        });
    }
    // List files for a task
    static async listTaskFiles(taskId, userId) {
        // Verify user has access to task
        const accessCheck = await (0, database_1.query)(`SELECT t.id
       FROM tasks t
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE t.id = $1 AND pm.user_id = $2 AND t.deleted_at IS NULL`, [taskId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Task not found or access denied', 404);
        }
        // Get file attachments with user details
        const result = await (0, database_1.query)(`SELECT
        fa.*,
        u.first_name || ' ' || u.last_name as uploader_name,
        u.email as uploader_email
       FROM file_attachments fa
       INNER JOIN users u ON fa.uploaded_by = u.id
       WHERE fa.task_id = $1 AND fa.deleted_at IS NULL
       ORDER BY fa.uploaded_at DESC`, [taskId]);
        return result.rows;
    }
    // Get file by ID
    static async getFileById(fileId, userId) {
        const result = await (0, database_1.query)(`SELECT
        fa.*,
        u.first_name || ' ' || u.last_name as uploader_name,
        u.email as uploader_email
       FROM file_attachments fa
       INNER JOIN users u ON fa.uploaded_by = u.id
       INNER JOIN tasks t ON fa.task_id = t.id
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE fa.id = $1 AND pm.user_id = $2 AND fa.deleted_at IS NULL AND t.deleted_at IS NULL`, [fileId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('File not found or access denied', 404);
        }
        return result.rows[0];
    }
    // Download file
    static async downloadFile(fileId, userId) {
        const file = await this.getFileById(fileId, userId);
        // Check if file exists on disk
        if (!fs_1.default.existsSync(file.file_path)) {
            throw new errorHandler_1.AppError('File not found on server', 404);
        }
        return file;
    }
    // Delete file
    static async deleteFile(fileId, userId) {
        return (0, database_1.transaction)(async (client) => {
            // Get file and verify ownership or project manager/owner
            const fileCheck = await client.query(`SELECT fa.*, t.project_id, pm.role
         FROM file_attachments fa
         INNER JOIN tasks t ON fa.task_id = t.id
         INNER JOIN project_members pm ON t.project_id = pm.project_id
         WHERE fa.id = $1 AND pm.user_id = $2 AND fa.deleted_at IS NULL AND t.deleted_at IS NULL`, [fileId, userId]);
            if (fileCheck.rows.length === 0) {
                throw new errorHandler_1.AppError('File not found or access denied', 404);
            }
            const file = fileCheck.rows[0];
            const role = file.role;
            // Can delete if: uploader OR project owner/manager
            const canDelete = file.uploaded_by === userId || role === 'owner' || role === 'manager';
            if (!canDelete) {
                throw new errorHandler_1.AppError('You can only delete your own files', 403);
            }
            // Soft delete file record
            await client.query(`UPDATE file_attachments
         SET deleted_at = NOW()
         WHERE id = $1`, [fileId]);
            // Log activity
            await client.query(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
         VALUES ($1, $2, $3, $4, $5, $6)`, [
                file.project_id,
                userId,
                'file_attachment',
                fileId,
                'deleted',
                JSON.stringify({ file_name: file.file_name }),
            ]);
            // Delete physical file from disk (async, don't wait for it)
            unlinkAsync(file.file_path).catch((err) => {
                console.error('Error deleting file from disk:', err);
            });
        });
    }
    // Get total storage used by a project
    static async getProjectStorageUsage(projectId, userId) {
        // Verify user has access to project
        const accessCheck = await (0, database_1.query)(`SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2`, [projectId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        // Calculate total storage
        const result = await (0, database_1.query)(`SELECT COALESCE(SUM(fa.file_size), 0) as total_bytes
       FROM file_attachments fa
       INNER JOIN tasks t ON fa.task_id = t.id
       WHERE t.project_id = $1 AND fa.deleted_at IS NULL AND t.deleted_at IS NULL`, [projectId]);
        return parseInt(result.rows[0].total_bytes);
    }
    // Get user's total storage usage
    static async getUserStorageUsage(userId) {
        const result = await (0, database_1.query)(`SELECT COALESCE(SUM(fa.file_size), 0) as total_bytes
       FROM file_attachments fa
       INNER JOIN tasks t ON fa.task_id = t.id
       INNER JOIN project_members pm ON t.project_id = pm.project_id
       WHERE pm.user_id = $1 AND fa.deleted_at IS NULL AND t.deleted_at IS NULL`, [userId]);
        return parseInt(result.rows[0].total_bytes);
    }
}
exports.FilesService = FilesService;
exports.default = FilesService;
//# sourceMappingURL=files.service.js.map