import { Request, Response } from 'express';
import { validationResult } from 'express-validator';
import { GroupsService } from '../services/groups.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';

export class GroupsController {
  // Create new group
  static createGroup = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const { name, description, color } = req.body;

    const group = await GroupsService.createGroup(projectId, userId, {
      name,
      description,
      color,
    });

    res.status(201).json({
      status: 'success',
      data: { group },
    });
  });

  // List groups
  static listGroups = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const groups = await GroupsService.listGroups(projectId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        groups,
        count: groups.length,
      },
    });
  });

  // Get group by ID
  static getGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const groupId = parseInt(req.params.id);

    if (isNaN(groupId)) {
      throw new AppError('Invalid group ID', 400);
    }

    const group = await GroupsService.getGroupById(groupId, userId);

    res.status(200).json({
      status: 'success',
      data: { group },
    });
  });

  // Update group
  static updateGroup = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const groupId = parseInt(req.params.id);

    if (isNaN(groupId)) {
      throw new AppError('Invalid group ID', 400);
    }

    const { name, description, color } = req.body;

    const group = await GroupsService.updateGroup(groupId, userId, {
      name,
      description,
      color,
    });

    res.status(200).json({
      status: 'success',
      data: { group },
    });
  });

  // Delete group
  static deleteGroup = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const groupId = parseInt(req.params.id);

    if (isNaN(groupId)) {
      throw new AppError('Invalid group ID', 400);
    }

    await GroupsService.deleteGroup(groupId, userId);

    res.status(200).json({
      status: 'success',
      message: 'Group deleted successfully',
    });
  });

  // Add member to group
  static addMember = asyncHandler(async (req: Request, res: Response) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }

    const userId = req.user!.userId;
    const groupId = parseInt(req.params.id);
    const { userId: memberUserId } = req.body;

    if (isNaN(groupId)) {
      throw new AppError('Invalid group ID', 400);
    }

    const membership = await GroupsService.addMember(groupId, userId, memberUserId);

    res.status(201).json({
      status: 'success',
      data: { membership },
      message: 'Member added successfully',
    });
  });

  // Remove member from group
  static removeMember = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const groupId = parseInt(req.params.id);
    const membershipId = parseInt(req.params.membershipId);

    if (isNaN(groupId) || isNaN(membershipId)) {
      throw new AppError('Invalid group or membership ID', 400);
    }

    await GroupsService.removeMember(groupId, userId, membershipId);

    res.status(200).json({
      status: 'success',
      message: 'Member removed successfully',
    });
  });
}

export default GroupsController;
