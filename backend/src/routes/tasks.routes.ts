import { Router } from 'express';
import { body } from 'express-validator';
import { TasksController } from '../controllers/tasks.controller';
import { authenticate } from '../middleware/auth.middleware';
import { hasProjectAccess } from '../middleware/permissions.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createTaskValidation = [
  body('title')
    .trim()
    .notEmpty()
    .withMessage('Task title is required')
    .isLength({ max: 500 })
    .withMessage('Task title must be less than 500 characters'),
  body('description')
    .optional()
    .trim(),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  body('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .withMessage('Invalid task status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid task priority'),
  body('assignedTo')
    .optional()
    .isInt()
    .withMessage('Assigned user must be a valid user ID'),
  body('assignedGroupId')
    .optional()
    .isInt()
    .withMessage('Assigned group must be a valid group ID'),
  body('parentTaskId')
    .optional()
    .isInt()
    .withMessage('Parent task must be a valid task ID'),
];

const updateTaskValidation = [
  body('title')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Task title cannot be empty')
    .isLength({ max: 500 })
    .withMessage('Task title must be less than 500 characters'),
  body('description')
    .optional()
    .trim(),
  body('startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be a valid date'),
  body('endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be a valid date'),
  body('duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be a positive integer'),
  body('progress')
    .optional()
    .isFloat({ min: 0 })
    .withMessage('Progress must be a number')
    .customSanitizer(value => {
      const num = Number(value);
      // If value is 0-1 (decimal), convert to 0-100
      if (num >= 0 && num <= 1) return Math.round(num * 100);
      // If value is already 0-100, round it
      if (num > 1 && num <= 100) return Math.round(num);
      // Otherwise clamp to 0-100
      return Math.max(0, Math.min(100, Math.round(num)));
    }),
  body('status')
    .optional()
    .isIn(['not_started', 'in_progress', 'completed', 'blocked', 'cancelled'])
    .withMessage('Invalid task status'),
  body('priority')
    .optional()
    .isIn(['low', 'medium', 'high', 'critical'])
    .withMessage('Invalid task priority'),
  body('assignedTo')
    .optional()
    .isInt()
    .withMessage('Assigned user must be a valid user ID'),
  body('assignedGroupId')
    .optional()
    .isInt()
    .withMessage('Assigned group must be a valid group ID'),
  body('parentTaskId')
    .optional()
    .isInt()
    .withMessage('Parent task must be a valid task ID'),
];

const addDependencyValidation = [
  body('dependsOnTaskId')
    .isInt()
    .withMessage('Depends on task ID is required and must be valid'),
  body('dependencyType')
    .optional()
    .isIn(['finish_to_start', 'start_to_start', 'finish_to_finish', 'start_to_finish'])
    .withMessage('Invalid dependency type'),
  body('lagTime')
    .optional()
    .isInt()
    .withMessage('Lag time must be an integer'),
];

const bulkUpdateValidation = [
  body('updates')
    .isArray({ min: 1 })
    .withMessage('Updates must be a non-empty array'),
  body('updates.*.id')
    .isInt()
    .withMessage('Each update must have a valid task ID'),
  body('updates.*.startDate')
    .optional()
    .isISO8601()
    .withMessage('Start date must be valid'),
  body('updates.*.endDate')
    .optional()
    .isISO8601()
    .withMessage('End date must be valid'),
  body('updates.*.duration')
    .optional()
    .isInt({ min: 0 })
    .withMessage('Duration must be positive'),
  body('updates.*.progress')
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage('Progress must be 0-100'),
];

// Task routes (project-scoped)
router.post(
  '/projects/:projectId/tasks',
  createTaskValidation,
  TasksController.createTask
);

router.get(
  '/projects/:projectId/tasks',
  TasksController.listTasks
);

router.post(
  '/projects/:projectId/tasks/bulk-update',
  bulkUpdateValidation,
  TasksController.bulkUpdateTasks
);

// Individual task routes
router.get(
  '/tasks/:id',
  TasksController.getTask
);

router.put(
  '/tasks/:id',
  updateTaskValidation,
  TasksController.updateTask
);

router.delete(
  '/tasks/:id',
  TasksController.deleteTask
);

// Dependency routes
router.post(
  '/tasks/:id/dependencies',
  addDependencyValidation,
  TasksController.addDependency
);

router.get(
  '/tasks/:id/dependencies',
  TasksController.getDependencies
);

router.delete(
  '/tasks/:id/dependencies/:dependencyId',
  TasksController.removeDependency
);

export default router;
