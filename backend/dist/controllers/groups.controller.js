"use strict";
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GroupsController = void 0;
const express_validator_1 = require("express-validator");
const groups_service_1 = require("../services/groups.service");
const errorHandler_1 = require("../middleware/errorHandler");
class GroupsController {
}
exports.GroupsController = GroupsController;
_a = GroupsController;
// Create new group
GroupsController.createGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const { name, description, color } = req.body;
    const group = await groups_service_1.GroupsService.createGroup(projectId, userId, {
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
GroupsController.listGroups = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const groups = await groups_service_1.GroupsService.listGroups(projectId, userId);
    res.status(200).json({
        status: 'success',
        data: {
            groups,
            count: groups.length,
        },
    });
});
// Get group by ID
GroupsController.getGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) {
        throw new errorHandler_1.AppError('Invalid group ID', 400);
    }
    const group = await groups_service_1.GroupsService.getGroupById(groupId, userId);
    res.status(200).json({
        status: 'success',
        data: { group },
    });
});
// Update group
GroupsController.updateGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) {
        throw new errorHandler_1.AppError('Invalid group ID', 400);
    }
    const { name, description, color } = req.body;
    const group = await groups_service_1.GroupsService.updateGroup(groupId, userId, {
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
GroupsController.deleteGroup = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);
    if (isNaN(groupId)) {
        throw new errorHandler_1.AppError('Invalid group ID', 400);
    }
    await groups_service_1.GroupsService.deleteGroup(groupId, userId);
    res.status(200).json({
        status: 'success',
        message: 'Group deleted successfully',
    });
});
// Add member to group
GroupsController.addMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const errors = (0, express_validator_1.validationResult)(req);
    if (!errors.isEmpty()) {
        throw new errorHandler_1.AppError('Validation error: ' + errors.array().map(e => e.msg).join(', '), 400);
    }
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);
    const { userId: memberUserId } = req.body;
    if (isNaN(groupId)) {
        throw new errorHandler_1.AppError('Invalid group ID', 400);
    }
    const membership = await groups_service_1.GroupsService.addMember(groupId, userId, memberUserId);
    res.status(201).json({
        status: 'success',
        data: { membership },
        message: 'Member added successfully',
    });
});
// Remove member from group
GroupsController.removeMember = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const groupId = parseInt(req.params.id);
    const membershipId = parseInt(req.params.membershipId);
    if (isNaN(groupId) || isNaN(membershipId)) {
        throw new errorHandler_1.AppError('Invalid group or membership ID', 400);
    }
    await groups_service_1.GroupsService.removeMember(groupId, userId, membershipId);
    res.status(200).json({
        status: 'success',
        message: 'Member removed successfully',
    });
});
exports.default = GroupsController;
//# sourceMappingURL=groups.controller.js.map