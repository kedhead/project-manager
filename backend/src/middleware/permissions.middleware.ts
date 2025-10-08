import { Request, Response, NextFunction } from 'express';
import { query } from '../config/database';
import { AppError } from './errorHandler';

// Extend Request to include project role
declare global {
  namespace Express {
    interface Request {
      projectRole?: string;
      projectId?: number;
    }
  }
}

// Check if user has access to project (any role)
export const hasProjectAccess = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const projectId = parseInt(req.params.projectId || req.params.id);

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!projectId || isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    // Check if user is a member of the project
    const result = await query(
      `SELECT pm.role, p.id
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found or access denied', 404);
    }

    // Attach project role and ID to request
    req.projectRole = result.rows[0].role;
    req.projectId = projectId;

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is project owner
export const isProjectOwner = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const projectId = parseInt(req.params.projectId || req.params.id);

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!projectId || isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const result = await query(
      `SELECT pm.role
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found or access denied', 404);
    }

    if (result.rows[0].role !== 'owner') {
      throw new AppError('Only project owners can perform this action', 403);
    }

    req.projectRole = result.rows[0].role;
    req.projectId = projectId;

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user is owner or manager
export const canManageProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const projectId = parseInt(req.params.projectId || req.params.id);

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!projectId || isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const result = await query(
      `SELECT pm.role
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found or access denied', 404);
    }

    const role = result.rows[0].role;
    if (role !== 'owner' && role !== 'manager') {
      throw new AppError('Only project owners and managers can perform this action', 403);
    }

    req.projectRole = role;
    req.projectId = projectId;

    next();
  } catch (error) {
    next(error);
  }
};

// Check if user can edit (owner, manager, or member - not viewer)
export const canEditProject = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user?.userId;
    const projectId = parseInt(req.params.projectId || req.params.id);

    if (!userId) {
      throw new AppError('Authentication required', 401);
    }

    if (!projectId || isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const result = await query(
      `SELECT pm.role
       FROM project_members pm
       INNER JOIN projects p ON pm.project_id = p.id
       WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`,
      [projectId, userId]
    );

    if (result.rows.length === 0) {
      throw new AppError('Project not found or access denied', 404);
    }

    const role = result.rows[0].role;
    if (role === 'viewer') {
      throw new AppError('Viewers cannot edit project content', 403);
    }

    req.projectRole = role;
    req.projectId = projectId;

    next();
  } catch (error) {
    next(error);
  }
};

// Factory function to check specific roles
export const requireRole = (...allowedRoles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = req.user?.userId;
      const projectId = parseInt(req.params.projectId || req.params.id);

      if (!userId) {
        throw new AppError('Authentication required', 401);
      }

      if (!projectId || isNaN(projectId)) {
        throw new AppError('Invalid project ID', 400);
      }

      const result = await query(
        `SELECT pm.role
         FROM project_members pm
         INNER JOIN projects p ON pm.project_id = p.id
         WHERE pm.project_id = $1 AND pm.user_id = $2 AND p.deleted_at IS NULL`,
        [projectId, userId]
      );

      if (result.rows.length === 0) {
        throw new AppError('Project not found or access denied', 404);
      }

      const role = result.rows[0].role;
      if (!allowedRoles.includes(role)) {
        throw new AppError(`This action requires one of the following roles: ${allowedRoles.join(', ')}`, 403);
      }

      req.projectRole = role;
      req.projectId = projectId;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default {
  hasProjectAccess,
  isProjectOwner,
  canManageProject,
  canEditProject,
  requireRole,
};
