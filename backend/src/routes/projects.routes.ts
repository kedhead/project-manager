import { Router } from 'express';
import { body, param } from 'express-validator';
import { ProjectsController } from '../controllers/projects.controller';
import { authenticate } from '../middleware/auth.middleware';
import {
  hasProjectAccess,
  isProjectOwner,
  canManageProject,
} from '../middleware/permissions.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createProjectValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Project name is required')
    .isLength({ max: 255 })
    .withMessage('Project name must be less than 255 characters'),
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
];

const updateProjectValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Project name cannot be empty')
    .isLength({ max: 255 })
    .withMessage('Project name must be less than 255 characters'),
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
  body('status')
    .optional()
    .isIn(['planning', 'active', 'on_hold', 'completed', 'cancelled'])
    .withMessage('Invalid project status'),
];

const addMemberValidation = [
  body('email')
    .isEmail()
    .normalizeEmail()
    .withMessage('Valid email is required'),
  body('role')
    .optional()
    .isIn(['owner', 'manager', 'member', 'viewer'])
    .withMessage('Invalid role'),
];

const updateMemberRoleValidation = [
  body('role')
    .isIn(['owner', 'manager', 'member', 'viewer'])
    .withMessage('Invalid role'),
];

// Project routes
router.post(
  '/',
  createProjectValidation,
  ProjectsController.createProject
);

router.get(
  '/',
  ProjectsController.listProjects
);

router.get(
  '/:id',
  hasProjectAccess,
  ProjectsController.getProject
);

router.put(
  '/:id',
  canManageProject,
  updateProjectValidation,
  ProjectsController.updateProject
);

router.delete(
  '/:id',
  isProjectOwner,
  ProjectsController.deleteProject
);

// Member management routes
router.get(
  '/:id/members',
  hasProjectAccess,
  ProjectsController.getMembers
);

router.post(
  '/:id/members',
  canManageProject,
  addMemberValidation,
  ProjectsController.addMember
);

router.put(
  '/:id/members/:memberId',
  isProjectOwner,
  updateMemberRoleValidation,
  ProjectsController.updateMemberRole
);

router.delete(
  '/:id/members/:memberId',
  canManageProject,
  ProjectsController.removeMember
);

export default router;
