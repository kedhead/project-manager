"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.TasksController = void 0;
const express_validator_1 = require("express-validator");
const tasks_service_1 = require("../services/tasks.service");
const errorHandler_1 = require("../middleware/errorHandler");
class TasksController {
}
exports.TasksController = TasksController;
_a = TasksController;
// Create new task
TasksController.createTask = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const { title, description, startDate, endDate, duration, status, priority, assignedTo, assignedGroupId, parentTaskId, } = req.body;
    const task = await tasks_service_1.TasksService.createTask(projectId, userId, {
        title,
        description,
        startDate,
        endDate,
        duration,
        status,
        priority,
        assignedTo,
        assignedGroupId,
        parentTaskId,
    });
    res.status(201).json({
        status: 'success',
        data: { task },
    });
});
// List tasks
TasksController.listTasks = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const { status, priority, assignedTo, parentTaskId, search } = req.query;
    const filters = {};
    if (status)
        filters.status = status;
    if (priority)
        filters.priority = priority;
    if (assignedTo)
        filters.assignedTo = parseInt(assignedTo);
    if (parentTaskId !== undefined) {
        filters.parentTaskId = parentTaskId === 'null' ? null : parseInt(parentTaskId);
    }
    if (search)
        filters.search = search;
    const tasks = await tasks_service_1.TasksService.listTasks(projectId, userId, filters);
    res.status(200).json({
        status: 'success',
        data: {
            tasks,
            count: tasks.length,
        },
    });
});
// Get task by ID
TasksController.getTask = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const task = await tasks_service_1.TasksService.getTaskById(taskId, userId);
    res.status(200).json({
        status: 'success',
        data: { task },
    });
});
// Update task
TasksController.updateTask = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        console.log('❌ Validation error for task update:', req.body);
        console.log('❌ Validation errors:', errors.array());
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const { title, description, startDate, endDate, duration, progress, status, priority, assignedTo, assignedGroupId, parentTaskId, } = req.body;
    const task = await tasks_service_1.TasksService.updateTask(taskId, userId, {
        title,
        description,
        startDate,
        endDate,
        duration,
        progress,
        status,
        priority,
        assignedTo,
        assignedGroupId,
        parentTaskId,
    });
    res.status(200).json({
        status: 'success',
        data: { task },
    });
});
// Delete task
TasksController.deleteTask = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    await tasks_service_1.TasksService.deleteTask(taskId, userId);
    res.status(200).json({
        status: 'success',
        message: 'Task deleted successfully',
    });
});
// Add task dependency
TasksController.addDependency = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id);
    const { dependsOnTaskId, dependencyType, lagTime } = req.body;
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const dependency = await tasks_service_1.TasksService.addDependency(taskId, userId, dependsOnTaskId, dependencyType || 'finish_to_start', lagTime || 0);
    res.status(201).json({
        status: 'success',
        data: { dependency },
        message: 'Dependency added successfully',
    });
});
// Get task dependencies
TasksController.getDependencies = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.id);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const dependencies = await tasks_service_1.TasksService.getTaskDependencies(taskId, userId);
    res.status(200).json({
        status: 'success',
        data: {
            dependencies,
            count: dependencies.length,
        },
    });
});
// Remove task dependency
TasksController.removeDependency = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const dependencyId = parseInt(req.params.dependencyId);
    if (isNaN(dependencyId)) {
        throw new errorHandler_1.AppError('Invalid dependency ID', 400);
    }
    await tasks_service_1.TasksService.removeDependency(dependencyId, userId);
    res.status(200).json({
        status: 'success',
        message: 'Dependency removed successfully',
    });
});
// Bulk update tasks
TasksController.bulkUpdateTasks = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);
    const { updates } = req.body;
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    if (!Array.isArray(updates)) {
        throw new errorHandler_1.AppError('Updates must be an array', 400);
    }
    await tasks_service_1.TasksService.bulkUpdateTasks(projectId, userId, updates);
    res.status(200).json({
        status: 'success',
        message: `${updates.length} tasks updated successfully`,
    });
});
exports.default = TasksController;
//# sourceMappingURL=tasks.controller.js.map