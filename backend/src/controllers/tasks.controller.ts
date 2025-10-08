import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { TasksService } from '../services/tasks.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class TasksController {
  // Create new task
  static createTask = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const {
      title,
      description,
      startDate,
      endDate,
      duration,
      status,
      priority,
      assignedTo,
      parentTaskId,
    } = req.body;

    const task = await TasksService.createTask(projectId, userId, {
      title,
      description,
      startDate,
      endDate,
      duration,
      status,
      priority,
      assignedTo,
      parentTaskId,
    });

    res.status(201).json({
      status: 'success',
      data: { task },
    });
  });

  // List tasks
  static listTasks = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const { status, priority, assignedTo, parentTaskId, search } = req.query;

    const filters: any = {};
    if (status) filters.status = status as string;
    if (priority) filters.priority = priority as string;
    if (assignedTo) filters.assignedTo = parseInt(assignedTo as string);
    if (parentTaskId !== undefined) {
      filters.parentTaskId = parentTaskId === 'null' ? null : parseInt(parentTaskId as string);
    }
    if (search) filters.search = search as string;

    const tasks = await TasksService.listTasks(projectId, userId, filters);

    res.status(200).json({
      status: 'success',
      data: {
        tasks,
        count: tasks.length,
      },
    });
  });

  // Get task by ID
  static getTask = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const task = await TasksService.getTaskById(taskId, userId);

    res.status(200).json({
      status: 'success',
      data: { task },
    });
  });

  // Update task
  static updateTask = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const {
      title,
      description,
      startDate,
      endDate,
      duration,
      progress,
      status,
      priority,
      assignedTo,
      parentTaskId,
    } = req.body;

    const task = await TasksService.updateTask(taskId, userId, {
      title,
      description,
      startDate,
      endDate,
      duration,
      progress,
      status,
      priority,
      assignedTo,
      parentTaskId,
    });

    res.status(200).json({
      status: 'success',
      data: { task },
    });
  });

  // Delete task
  static deleteTask = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    await TasksService.deleteTask(taskId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Task deleted successfully',
    });
  });

  // Add task dependency
  static addDependency = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const taskId = parseInt(req.params.id);
    const { dependsOnTaskId, dependencyType, lagTime } = req.body;

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const dependency = await TasksService.addDependency(
      taskId,
      userId,
      dependsOnTaskId,
      dependencyType || 'finish_to_start',
      lagTime || 0
    );

    res.status(201).json({
      status: 'success',
      data: { dependency },
      message: 'Dependency added successfully',
    });
  });

  // Get task dependencies
  static getDependencies = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.id);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const dependencies = await TasksService.getTaskDependencies(taskId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        dependencies,
        count: dependencies.length,
      },
    });
  });

  // Remove task dependency
  static removeDependency = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const dependencyId = parseInt(req.params.dependencyId);

    if (isNaN(dependencyId)) {
      throw new AppError('Invalid dependency ID', 400);
    }

    await TasksService.removeDependency(dependencyId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Dependency removed successfully',
    });
  });

  // Bulk update tasks
  static bulkUpdateTasks = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId);
    const { updates } = req.body;

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    if (!Array.isArray(updates)) {
      throw new AppError('Updates must be an array', 400);
    }

    await TasksService.bulkUpdateTasks(projectId, userId, updates);

    res.status(200).json({
      status: 'success',
      message: `${updates.length} tasks updated successfully`,
    });
  });
}

export default TasksController;
