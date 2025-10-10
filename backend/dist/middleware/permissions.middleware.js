"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = exports.canEditProject = exports.canManageProject = exports.isProjectOwner = exports.hasProjectAccess = void 0;
const database_1 = require("../config/database");
const errorHandler_1 = require("./errorHandler");
// Check if user has access to project (any role)
const hasProjectAccess = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const projectId = parseInt(req.params.projectId || req.params.id);
        if (!userId) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        if (!projectId || isNaN(projectId)) {
            throw new errorHandler_1.AppError('Invalid project ID', 400);
        }
        // Check if user is a member of the project
        const result = await (0, database_1.query)(`SELECT pm.role, p.id
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`, [projectId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        // Attach project role and ID to request
        req.projectRole = result.rows[0].role;
        req.projectId = projectId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.hasProjectAccess = hasProjectAccess;
// Check if user is project owner
const isProjectOwner = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const projectId = parseInt(req.params.projectId || req.params.id);
        if (!userId) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        if (!projectId || isNaN(projectId)) {
            throw new errorHandler_1.AppError('Invalid project ID', 400);
        }
        const result = await (0, database_1.query)(`SELECT pm.role
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`, [projectId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        if (result.rows[0].role !== 'owner') {
            throw new errorHandler_1.AppError('Only project owners can perform this action', 403);
        }
        req.projectRole = result.rows[0].role;
        req.projectId = projectId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.isProjectOwner = isProjectOwner;
// Check if user is owner or manager
const canManageProject = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const projectId = parseInt(req.params.projectId || req.params.id);
        if (!userId) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        if (!projectId || isNaN(projectId)) {
            throw new errorHandler_1.AppError('Invalid project ID', 400);
        }
        const result = await (0, database_1.query)(`SELECT pm.role
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`, [projectId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        const role = result.rows[0].role;
        if (role !== 'owner' && role !== 'manager') {
            throw new errorHandler_1.AppError('Only project owners and managers can perform this action', 403);
        }
        req.projectRole = role;
        req.projectId = projectId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.canManageProject = canManageProject;
// Check if user can edit (owner, manager, or member - not viewer)
const canEditProject = async (req, res, next) => {
    try {
        const userId = req.user?.userId;
        const projectId = parseInt(req.params.projectId || req.params.id);
        if (!userId) {
            throw new errorHandler_1.AppError('Authentication required', 401);
        }
        if (!projectId || isNaN(projectId)) {
            throw new errorHandler_1.AppError('Invalid project ID', 400);
        }
        const result = await (0, database_1.query)(`SELECT pm.role
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`, [projectId, userId]);
        if (result.rows.length === 0) {
            throw new errorHandler_1.AppError('Project not found or access denied', 404);
        }
        const role = result.rows[0].role;
        if (role === 'viewer') {
            throw new errorHandler_1.AppError('Viewers cannot edit project content', 403);
        }
        req.projectRole = role;
        req.projectId = projectId;
        next();
    }
    catch (error) {
        next(error);
    }
};
exports.canEditProject = canEditProject;
// Factory function to check specific roles
const requireRole = (...allowedRoles) => {
    return async (req, res, next) => {
        try {
            const userId = req.user?.userId;
            const projectId = parseInt(req.params.projectId || req.params.id);
            if (!userId) {
                throw new errorHandler_1.AppError('Authentication required', 401);
            }
            if (!projectId || isNaN(projectId)) {
                throw new errorHandler_1.AppError('Invalid project ID', 400);
            }
            const result = await (0, database_1.query)(`SELECT pm.role
         FROM project_members pm
         INNER JOIN projects p ON pm.project_id = p.id
         WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`, [projectId, userId]);
            if (result.rows.length === 0) {
                throw new errorHandler_1.AppError('Project not found or access denied', 404);
            }
            const role = result.rows[0].role;
            if (!allowedRoles.includes(role)) {
                throw new errorHandler_1.AppError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`, 403);
            }
            req.projectRole = role;
            req.projectId = projectId;
            next();
        }
        catch (error) {
            next(error);
        }
    };
};
exports.requireRole = requireRole;
exports.default = {
    hasProjectAccess: exports.hasProjectAccess,
    isProjectOwner: exports.isProjectOwner,
    canManageProject: exports.canManageProject,
    canEditProject: exports.canEditProject,
    requireRole: exports.requireRole,
};
//# sourceMappingURL=permissions.middleware.js.map