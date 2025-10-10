"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const groups_controller_1 = require("../controllers/groups.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Validation rules
const createGroupValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Group name is required')
        .isLength({ max: 100 })
        .withMessage('Group name must be less than 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim(),
    (0, express_validator_1.body)('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color code'),
];
const updateGroupValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Group name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Group name must be less than 100 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim(),
    (0, express_validator_1.body)('color')
        .optional()
        .matches(/^#[0-9A-Fa-f]{6}$/)
        .withMessage('Color must be a valid hex color code'),
];
const addMemberValidation = [
    (0, express_validator_1.body)('userId')
        .isInt()
        .withMessage('User ID is required and must be valid'),
];
// Group routes (project-scoped)
router.post('/projects/:projectId/groups', createGroupValidation, groups_controller_1.GroupsController.createGroup);
router.get('/projects/:projectId/groups', groups_controller_1.GroupsController.listGroups);
// Individual group routes
router.get('/groups/:id', groups_controller_1.GroupsController.getGroup);
router.put('/groups/:id', updateGroupValidation, groups_controller_1.GroupsController.updateGroup);
router.delete('/groups/:id', groups_controller_1.GroupsController.deleteGroup);
// Group member routes
router.post('/groups/:id/members', addMemberValidation, groups_controller_1.GroupsController.addMember);
router.delete('/groups/:id/members/:membershipId', groups_controller_1.GroupsController.removeMember);
exports.default = router;
//# sourceMappingURL=groups.routes.js.map