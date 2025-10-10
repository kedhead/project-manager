"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProjectsController = void 0;
const express_validator_1 = require("express-validator");
const projects_service_1 = require("../services/projects.service");
const errorHandler_1 = require("../middleware/errorHandler");
class ProjectsController {
}
exports.ProjectsController = ProjectsController;
_a = ProjectsController;
// Create new project
ProjectsController.createProject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const { name, description, startDate, endDate } = req.body;
    const project = await projects_service_1.ProjectsService.createProject(userId, name, description, startDate, endDate);
    res.status(201).json({
        status: 'success',
        data: { project },
    });
});
// List user's projects
ProjectsController.listProjects = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const { status, search } = req.query;
    const filters = {};
    if (status)
        filters.status = status;
    if (search)
        filters.search = search;
    const projects = await projects_service_1.ProjectsService.listProjects(userId, filters);
    res.status(200).json({
        status: 'success',
        data: {
            projects,
            count: projects.length,
        },
    });
});
// Get project by ID
ProjectsController.getProject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const project = await projects_service_1.ProjectsService.getProjectById(projectId, userId);
    res.status(200).json({
        status: 'success',
        data: { project },
    });
});
// Update project
ProjectsController.updateProject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const { name, description, startDate, endDate, status } = req.body;
    const project = await projects_service_1.ProjectsService.updateProject(projectId, userId, {
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
ProjectsController.deleteProject = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    await projects_service_1.ProjectsService.deleteProject(projectId, userId);
    res.status(200).json({
        status: 'success',
        message: 'Project deleted successfully',
    });
});
// Get project members
ProjectsController.getMembers = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const members = await projects_service_1.ProjectsService.getProjectMembers(projectId, userId);
    res.status(200).json({
        status: 'success',
        data: {
            members,
            count: members.length,
        },
    });
});
// Add member to project
ProjectsController.addMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const projectId = parseInt(req.params.id);
    const { email, role } = req.body;
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const member = await projects_service_1.ProjectsService.addProjectMember(projectId, userId, email, role || 'member');
    res.status(201).json({
        status: 'success',
        data: { member },
        message: 'Member added successfully',
    });
});
// Update member role
ProjectsController.updateMemberRole = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const projectId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    const { role } = req.body;
    if (isNaN(projectId) || isNaN(memberId)) {
        throw new errorHandler_1.AppError('Invalid project or member ID', 400);
    }
    const member = await projects_service_1.ProjectsService.updateMemberRole(projectId, userId, memberId, role);
    res.status(200).json({
        status: 'success',
        data: { member },
        message: 'Member role updated successfully',
    });
});
// Remove member from project
ProjectsController.removeMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.id);
    const memberId = parseInt(req.params.memberId);
    if (isNaN(projectId) || isNaN(memberId)) {
        throw new errorHandler_1.AppError('Invalid project or member ID', 400);
    }
    await projects_service_1.ProjectsService.removeMember(projectId, userId, memberId);
    res.status(200).json({
        status: 'success',
        message: 'Member removed successfully',
    });
});
exports.default = ProjectsController;
//# sourceMappingURL=projects.controller.js.map