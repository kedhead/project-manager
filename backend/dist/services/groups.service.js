"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsService = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("../middleware/errorHandler");
class GroupsService {
    // Create a new group
    static async createGroup(projectId, userId, data) {
        // Verify user has access to project
        const accessCheck = await (0, database_1.query)('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        const result = await (0, database_1.query)(`INSERT INTO groups (project_id, name, description, color, created_by)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`, [
            projectId,
            data.name,
            data.description || null,
            data.color || '#3B82F6',
            userId,
        ]);
        // Log activity
        await (0, database_1.query)(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`, [projectId, userId, 'group', result.rows[0].id, 'created', JSON.stringify({ name: data.name })]);
        return result.rows[0];
    }
    // List groups for a project
    static async listGroups(projectId, userId) {
        // Verify user has access to project
        const accessCheck = await (0, database_1.query)('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [projectId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        const result = await (0, database_1.query)(`SELECT
        g.*,
        u.first_name || ' ' || u.last_name as created_by_name,
        COUNT(DISTINCT gm.user_id) as member_count
       FROM groups g
       INNER JOIN users u ON g.created_by = u.id
       LEFT JOIN group_members gm ON g.id = gm.group_id
       WHERE g.project_id = $1 AND g.deleted_at IS NULL
       GROUP BY g.id, u.first_name, u.last_name
       ORDER BY g.created_at DESC`, [projectId]);
        return result.rows;
    }
    // Get group by ID with members
    static async getGroupById(groupId, userId) {
        const result = await (0, database_1.query)(`SELECT
        g.*,
        u.first_name || ' ' || u.last_name as created_by_name
       FROM groups g
       INNER JOIN users u ON g.created_by = u.id
       INNER JOIN project_members pm ON g.project_id = pm.project_id
       WHERE g.id = $1 AND g.deleted_at IS NULL AND pm.user_id = $2`, [groupId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Group not found or access denied', 404);
        }
        const group = result.rows[0];
        // Get members
        const membersResult = await (0, database_1.query)(`SELECT
        gm.id,
        gm.user_id,
        gm.added_at,
        u.first_name || ' ' || u.last_name as user_name,
        u.email as user_email
       FROM group_members gm
       INNER JOIN users u ON gm.user_id = u.id
       WHERE gm.group_id = $1
       ORDER BY gm.added_at ASC`, [groupId]);
        group.members = membersResult.rows;
        return group;
    }
    // Update group
    static async updateGroup(groupId, userId, data) {
        // Verify user has access
        const accessCheck = await (0, database_1.query)(`SELECT g.project_id
       FROM groups g
       INNER JOIN project_members pm ON g.project_id = pm.project_id
       WHERE g.id = $1 AND g.deleted_at IS NULL AND pm.user_id = $2`, [groupId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Group not found or access denied', 404);
        }
        const updates = [];
        const values = [];
        let paramCount = 1;
        if (data.name !== undefined) {
            updates.push(`name = $${paramCount++}`);
            values.push(data.name);
        }
        if (data.description !== undefined) {
            updates.push(`description = $${paramCount++}`);
            values.push(data.description);
        }
        if (data.color !== undefined) {
            updates.push(`color = $${paramCount++}`);
            values.push(data.color);
        }
        if (updates.length === 0) {
            throw new errorHandler_1.AppError('No fields to update', 400);
        }
        values.push(groupId);
        const result = await (0, database_1.query)(`UPDATE groups
       SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP
       WHERE id = $${paramCount}
       RETURNING *`, values);
        // Log activity
        await (0, database_1.query)(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`, [accessCheck.rows[0].project_id, userId, 'group', groupId, 'updated', JSON.stringify(data)]);
        return result.rows[0];
    }
    // Delete group (soft delete)
    static async deleteGroup(groupId, userId) {
        // Verify user has access
        const accessCheck = await (0, database_1.query)(`SELECT g.project_id
       FROM groups g
       INNER JOIN project_members pm ON g.project_id = pm.project_id
       WHERE g.id = $1 AND g.deleted_at IS NULL AND pm.user_id = $2`, [groupId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Group not found or access denied', 404);
        }
        await (0, database_1.query)('UPDATE groups SET deleted_at = CURRENT_TIMESTAMP WHERE id = $1', [groupId]);
        // Unassign from tasks
        await (0, database_1.query)('UPDATE tasks SET assigned_group_id = NULL WHERE assigned_group_id = $1', [groupId]);
        // Log activity
        await (0, database_1.query)(`INSERT INTO activity_logs (project_id, user_id, entity_type, entity_id, action, changes)
       VALUES ($1, $2, $3, $4, $5, $6)`, [accessCheck.rows[0].project_id, userId, 'group', groupId, 'deleted', JSON.stringify({})]);
    }
    // Add member to group
    static async addMember(groupId, userId, memberUserId) {
        // Verify user has access to group
        const accessCheck = await (0, database_1.query)(`SELECT g.project_id
       FROM groups g
       INNER JOIN project_members pm ON g.project_id = pm.project_id
       WHERE g.id = $1 AND g.deleted_at IS NULL AND pm.user_id = $2`, [groupId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Group not found or access denied', 404);
        }
        // Verify the member to add is part of the project
        const memberCheck = await (0, database_1.query)('SELECT id FROM project_members WHERE project_id = $1 AND user_id = $2', [accessCheck.rows[0].project_id, memberUserId]);
        if (memberCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('User is not a member of this project', 400);
        }
        // Add member (ON CONFLICT DO NOTHING handles duplicates)
        const result = await (0, database_1.query)(`INSERT INTO group_members (group_id, user_id, added_by)
       VALUES ($1, $2, $3)
       ON CONFLICT (group_id, user_id) DO NOTHING
       RETURNING *`, [groupId, memberUserId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('User is already a member of this group', 400);
        }
        return result.rows[0];
    }
    // Remove member from group
    static async removeMember(groupId, userId, membershipId) {
        // Verify user has access
        const accessCheck = await (0, database_1.query)(`SELECT g.project_id
       FROM groups g
       INNER JOIN project_members pm ON g.project_id = pm.project_id
       WHERE g.id = $1 AND g.deleted_at IS NULL AND pm.user_id = $2`, [groupId, userId]);
        if (accessCheck.rows.length === 0) {
            throw new errorHandler_1.AppError('Group not found or access denied', 404);
        }
        const result = await (0, database_1.query)('DELETE FROM group_members WHERE id = $1 AND group_id = $2 RETURNING *', [membershipId, groupId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Membership not found', 404);
        }
    }
}
exports.GroupsService = GroupsService;
exports.default = GroupsService;
//# sourceMappingURL=groups.service.js.map