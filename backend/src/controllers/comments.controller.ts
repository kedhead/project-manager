import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { CommentsService } from '../services/comments.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class CommentsController {
  // Create comment
  static createComment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const taskId = parseInt(req.params.taskId);
    const { content } = req.body;

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const comment = await CommentsService.createComment(taskId, userId, content);

    res.status(201).json({
      status: 'success',
      data: { comment },
    });
  });

  // List comments for a task
  static listComments = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.taskId);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const comments = await CommentsService.listComments(taskId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        comments,
        count: comments.length,
      },
    });
  });

  // Get comment by ID
  static getComment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      throw new AppError('Invalid comment ID', 400);
    }

    const comment = await CommentsService.getCommentById(commentId, userId);

    res.status(200).json({
      status: 'success',
      data: { comment },
    });
  });

  // Update comment
  static updateComment = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const commentId = parseInt(req.params.id);
    const { content } = req.body;

    if (isNaN(commentId)) {
      throw new AppError('Invalid comment ID', 400);
    }

    const comment = await CommentsService.updateComment(commentId, userId, content);

    res.status(200).json({
      status: 'success',
      data: { comment },
    });
  });

  // Delete comment
  static deleteComment = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const commentId = parseInt(req.params.id);

    if (isNaN(commentId)) {
      throw new AppError('Invalid comment ID', 400);
    }

    await CommentsService.deleteComment(commentId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Comment deleted successfully',
    });
  });

  // Get project activity
  static getProjectActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const { entityType, action, limit, offset } = req.query;

    const filters: any = {};
    if (entityType) filters.entityType = entityType as string;
    if (action) filters.action = action as string;
    if (limit) filters.limit = parseInt(limit as string);
    if (offset) filters.offset = parseInt(offset as string);

    const result = await CommentsService.getProjectActivity(projectId, userId, filters);

    res.status(200).json({
      status: 'success',
      data: {
        activities: result.activities,
        count: result.activities.length,
        total: result.total,
      },
    });
  });

  // Get task activity
  static getTaskActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.taskId);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : undefined;

    const activities = await CommentsService.getTaskActivity(taskId, userId, limitNum);

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        count: activities.length,
      },
    });
  });

  // Get user activity (recent activity across all projects)
  static getUserActivity = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit as string) : 50;

    const activities = await CommentsService.getUserActivity(userId, limitNum);

    res.status(200).json({
      status: 'success',
      data: {
        activities,
        count: activities.length,
      },
    });
  });
}

export default CommentsController;
