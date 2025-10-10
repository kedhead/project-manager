"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const projects_controller_1 = require("../controllers/projects.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_middleware_1 = require("../middleware/permissions.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Validation rules
const createProjectValidation = [
    (0, express_validator_1.body)('name')
        .trim()
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ max: 255 })
        .withMessage('Project name must be less than 255 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim(),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
];
const updateProjectValidation = [
    (0, express_validator_1.body)('name')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Project name cannot be empty')
        .isLength({ max: 255 })
        .withMessage('Project name must be less than 255 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim(),
    (0, express_validator_1.body)('startDate')
        .optional()
        .isISO8601()
        .withMessage('Start date must be a valid date'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .isISO8601()
        .withMessage('End date must be a valid date'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
        .withMessage('Invalid project status'),
];
const addMemberValidation = [
    (0, express_validator_1.body)('email')
        .isEmail()
        .normalizeEmail()
        .withMessage('Valid email is required'),
    (0, express_validator_1.body)('role')
        .optional()
        .isIn(['owner', 'manager', 'member', 'viewer'])
        .withMessage('Invalid role'),
];
const updateMemberRoleValidation = [
    (0, express_validator_1.body)('role')
        .isIn(['owner', 'manager', 'member', 'viewer'])
        .withMessage('Invalid role'),
];
// Project routes
router.post('/', createProjectValidation, projects_controller_1.ProjectsController.createProject);
router.get('/', projects_controller_1.ProjectsController.listProjects);
router.get('/:id', permissions_middleware_1.hasProjectAccess, projects_controller_1.ProjectsController.getProject);
router.put('/:id', permissions_middleware_1.canManageProject, updateProjectValidation, projects_controller_1.ProjectsController.updateProject);
router.delete('/:id', permissions_middleware_1.isProjectOwner, projects_controller_1.ProjectsController.deleteProject);
// Member management routes
router.get('/:id/members', permissions_middleware_1.hasProjectAccess, projects_controller_1.ProjectsController.getMembers);
router.post('/:id/members', permissions_middleware_1.canManageProject, addMemberValidation, projects_controller_1.ProjectsController.addMember);
router.put('/:id/members/:memberId', permissions_middleware_1.isProjectOwner, updateMemberRoleValidation, projects_controller_1.ProjectsController.updateMemberRole);
router.delete('/:id/members/:memberId', permissions_middleware_1.canManageProject, projects_controller_1.ProjectsController.removeMember);
exports.default = router;
//# sourceMappingURL=projects.routes.js.map