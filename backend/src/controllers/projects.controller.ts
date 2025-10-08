import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { ProjectsService } from '../services/projects.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class ProjectsController {
  // Create new project
  static createProject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const { name, description, startDate, endDate } = req.body;

    const project = await ProjectsService.createProject(
      userId,
      name,
      description,
      startDate,
      endDate
    );

    res.status(201).json({
      status: 'success',
      data: { project },
    });
  });

  // List user's projects
  static listProjects = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { status, search } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (search) filters.search = search as string;

    const projects = await ProjectsService.listProjects(userId, filters);

    res.status(200).json({
      status: 'success',
      data: {
        projects,
        count: projects.length,
      },
    });
  });

  // Get project by ID
  static getProject = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const project = await ProjectsService.getProjectById(projectId, userId);

    res.status(200).json({
      status: 'success',
      data: { project },
    });
  });

  // Update project
  static updateProject = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const { name, description, startDate, endDate, status } = req.body;

    const project = await ProjectsService.updateProject(projectId, userId, {
      name,
      description,
      startDate,
      endDate,
      status,
    });

    res.status(200).json({
      status: 'success',
      data: { project },
    });
  });

  // Delete project
  static deleteProject = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    await ProjectsService.deleteProject(projectId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Project deleted successfully',
    });
  });

  // Get project members
  static getMembers = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.id);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const members = await ProjectsService.getProjectMembers(projectId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        members,
        count: members.length,
      },
    });
  });

  // Add member to project
  static addMember = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const projectId = parseInt(req.params.id);
    const { email, role } = req.body;

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const member = await ProjectsService.addProjectMember(
      projectId,
      userId,
      email,
      role || 'member'
    );

    res.status(201).json({
      status: 'success',
      data: { member },
      message: 'Member added successfully',
    });
  });

  // Update member role
  static updateMemberRole = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const projectId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const { role } = req.body;

    if (isNaN(projectId) || isNaN(memberId)) {
      throw new AppError('Invalid project or member ID', 400);
    }

    const member = await ProjectsService.updateMemberRole(
      projectId,
      userId,
      memberId,
      role
    );

    res.status(200).json({
      status: 'success',
      data: { member },
      message: 'Member role updated successfully',
    });
  });

  // Remove member from project
  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);

    if (isNaN(projectId) || isNaN(memberId)) {
      throw new AppError('Invalid project or member ID', 400);
    }

    await ProjectsService.removeMember(projectId, userId, memberId);

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully',
    });
  });
}

export default ProjectsController;
