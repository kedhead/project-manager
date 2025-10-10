"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CommentsController = void 0;
const express_validator_1 = require("express-validator");
const comments_service_1 = require("../services/comments.service");
const errorHandler_1 = require("../middleware/errorHandler");
class CommentsController {
}
exports.CommentsController = CommentsController;
_a = CommentsController;
// Create comment
CommentsController.createComment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const taskId = parseInt(req.params.taskId);
    const { content } = req.body;
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const comment = await comments_service_1.CommentsService.createComment(taskId, userId, content);
    res.status(201).json({
        status: 'success',
        data: { comment },
    });
});
// List comments for a task
CommentsController.listComments = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const comments = await comments_service_1.CommentsService.listComments(taskId, userId);
    res.status(200).json({
        status: 'success',
        data: {
            comments,
            count: comments.length,
        },
    });
});
// Get comment by ID
CommentsController.getComment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
        throw new errorHandler_1.AppError('Invalid comment ID', 400);
    }
    const comment = await comments_service_1.CommentsService.getCommentById(commentId, userId);
    res.status(200).json({
        status: 'success',
        data: { comment },
    });
});
// Update comment
CommentsController.updateComment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const commentId = parseInt(req.params.id);
    const { content } = req.body;
    if (isNaN(commentId)) {
        throw new errorHandler_1.AppError('Invalid comment ID', 400);
    }
    const comment = await comments_service_1.CommentsService.updateComment(commentId, userId, content);
    res.status(200).json({
        status: 'success',
        data: { comment },
    });
});
// Delete comment
CommentsController.deleteComment = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const commentId = parseInt(req.params.id);
    if (isNaN(commentId)) {
        throw new errorHandler_1.AppError('Invalid comment ID', 400);
    }
    await comments_service_1.CommentsService.deleteComment(commentId, userId);
    res.status(200).json({
        status: 'success',
        message: 'Comment deleted successfully',
    });
});
// Get project activity
CommentsController.getProjectActivity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const { entityType, action, limit, offset } = req.query;
    const filters = {};
    if (entityType)
        filters.entityType = entityType;
    if (action)
        filters.action = action;
    if (limit)
        filters.limit = parseInt(limit);
    if (offset)
        filters.offset = parseInt(offset);
    const result = await comments_service_1.CommentsService.getProjectActivity(projectId, userId, filters);
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
CommentsController.getTaskActivity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit) : undefined;
    const activities = await comments_service_1.CommentsService.getTaskActivity(taskId, userId, limitNum);
    res.status(200).json({
        status: 'success',
        data: {
            activities,
            count: activities.length,
        },
    });
});
// Get user activity (recent activity across all projects)
CommentsController.getUserActivity = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { limit } = req.query;
    const limitNum = limit ? parseInt(limit) : 50;
    const activities = await comments_service_1.CommentsService.getUserActivity(userId, limitNum);
    res.status(200).json({
        status: 'success',
        data: {
            activities,
            count: activities.length,
        },
    });
});
exports.default = CommentsController;
//# sourceMappingURL=comments.controller.js.map