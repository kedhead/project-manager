"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const tasks_controller_1 = require("../controllers/tasks.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Validation rules
const createTaskValidation = [
    (0, express_validator_1.body)('title')
        .trim()
        .notEmpty()
        .withMessage('Task title is required')
        .isLength({ max: 500 })
        .withMessage('Task title must be less than 500 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim(),
    (0, express_validator_1.body)('startDate')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}/)
        .withMessage('Start date must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}/)
        .withMessage('End date must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('duration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Duration must be a positive integer'),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['not_started', 'in_progress', 'completed', 'blocked', 'cancelled'])
        .withMessage('Invalid task status'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid task priority'),
    (0, express_validator_1.body)('assignedTo')
        .optional({ nullable: true })
        .custom((value) => value === null || value === undefined || Number.isInteger(Number(value)))
        .withMessage('Assigned user must be a valid user ID'),
    (0, express_validator_1.body)('assignedGroupId')
        .optional({ nullable: true })
        .custom((value) => value === null || value === undefined || Number.isInteger(Number(value)))
        .withMessage('Assigned group must be a valid group ID'),
    (0, express_validator_1.body)('parentTaskId')
        .optional()
        .isInt()
        .withMessage('Parent task must be a valid task ID'),
];
const updateTaskValidation = [
    (0, express_validator_1.body)('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Task title cannot be empty')
        .isLength({ max: 500 })
        .withMessage('Task title must be less than 500 characters'),
    (0, express_validator_1.body)('description')
        .optional()
        .trim(),
    (0, express_validator_1.body)('startDate')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}/)
        .withMessage('Start date must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('endDate')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}/)
        .withMessage('End date must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('duration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Duration must be a positive integer'),
    (0, express_validator_1.body)('progress')
        .optional()
        .isFloat({ min: 0 })
        .withMessage('Progress must be a number')
        .customSanitizer(value => {
        const num = Number(value);
        // If value is 0-1 (decimal), convert to 0-100
        if (num >= 0 && num <= 1)
            return Math.round(num * 100);
        // If value is already 0-100, round it
        if (num > 1 && num <= 100)
            return Math.round(num);
        // Otherwise clamp to 0-100
        return Math.max(0, Math.min(100, Math.round(num)));
    }),
    (0, express_validator_1.body)('status')
        .optional()
        .isIn(['not_started', 'in_progress', 'completed', 'blocked', 'cancelled'])
        .withMessage('Invalid task status'),
    (0, express_validator_1.body)('priority')
        .optional()
        .isIn(['low', 'medium', 'high', 'critical'])
        .withMessage('Invalid task priority'),
    (0, express_validator_1.body)('assignedTo')
        .optional({ nullable: true })
        .custom((value) => value === null || value === undefined || Number.isInteger(Number(value)))
        .withMessage('Assigned user must be a valid user ID'),
    (0, express_validator_1.body)('assignedGroupId')
        .optional({ nullable: true })
        .custom((value) => value === null || value === undefined || Number.isInteger(Number(value)))
        .withMessage('Assigned group must be a valid group ID'),
    (0, express_validator_1.body)('parentTaskId')
        .optional()
        .isInt()
        .withMessage('Parent task must be a valid task ID'),
];
const addDependencyValidation = [
    (0, express_validator_1.body)('dependsOnTaskId')
        .isInt()
        .withMessage('Depends on task ID is required and must be valid'),
    (0, express_validator_1.body)('dependencyType')
        .optional()
        .isIn(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])
        .withMessage('Invalid dependency type'),
    (0, express_validator_1.body)('lagTime')
        .optional()
        .isInt()
        .withMessage('Lag time must be an integer'),
];
const bulkUpdateValidation = [
    (0, express_validator_1.body)('updates')
        .isArray({ min: 1 })
        .withMessage('Updates must be a non-empty array'),
    (0, express_validator_1.body)('updates.*.id')
        .isInt()
        .withMessage('Each update must have a valid task ID'),
    (0, express_validator_1.body)('updates.*.startDate')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}/)
        .withMessage('Start date must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('updates.*.endDate')
        .optional()
        .matches(/^\d{4}-\d{2}-\d{2}/)
        .withMessage('End date must be in YYYY-MM-DD format'),
    (0, express_validator_1.body)('updates.*.duration')
        .optional()
        .isInt({ min: 0 })
        .withMessage('Duration must be positive'),
    (0, express_validator_1.body)('updates.*.progress')
        .optional()
        .isInt({ min: 0, max: 100 })
        .withMessage('Progress must be 0-100'),
];
// Task routes (project-scoped)
router.post('/projects/:projectId/tasks', createTaskValidation, tasks_controller_1.TasksController.createTask);
router.get('/projects/:projectId/tasks', tasks_controller_1.TasksController.listTasks);
router.post('/projects/:projectId/tasks/bulk-update', bulkUpdateValidation, tasks_controller_1.TasksController.bulkUpdateTasks);
// Individual task routes
router.get('/tasks/:id', tasks_controller_1.TasksController.getTask);
router.put('/tasks/:id', updateTaskValidation, tasks_controller_1.TasksController.updateTask);
router.delete('/tasks/:id', tasks_controller_1.TasksController.deleteTask);
// Dependency routes
router.post('/tasks/:id/dependencies', addDependencyValidation, tasks_controller_1.TasksController.addDependency);
router.get('/tasks/:id/dependencies', tasks_controller_1.TasksController.getDependencies);
router.delete('/tasks/:id/dependencies/:dependencyId', tasks_controller_1.TasksController.removeDependency);
exports.default = router;
//# sourceMappingURL=tasks.routes.js.map