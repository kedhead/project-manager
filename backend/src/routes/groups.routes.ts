import { Router } from 'express';
import { body } from 'express-validator';
import { GroupsController } from '../controllers/groups.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createGroupValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Group name is required')
    .isLength({ max: 100 })
    .withMessage('Group name must be less than 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
];

const updateGroupValidation = [
  body('name')
    .optional()
    .trim()
    .notEmpty()
    .withMessage('Group name cannot be empty')
    .isLength({ max: 100 })
    .withMessage('Group name must be less than 100 characters'),
  body('description')
    .optional()
    .trim(),
  body('color')
    .optional()
    .matches(/^#[0-9A-Fa-f]{6}$/)
    .withMessage('Color must be a valid hex color code'),
];

const addMemberValidation = [
  body('userId')
    .isInt()
    .withMessage('User ID is required and must be valid'),
];

// Group routes (project-scoped)
router.post(
  '/projects/:projectId/groups',
  createGroupValidation,
  GroupsController.createGroup
);

router.get(
  '/projects/:projectId/groups',
  GroupsController.listGroups
);

// Individual group routes
router.get(
  '/groups/:id',
  GroupsController.getGroup
);

router.put(
  '/groups/:id',
  updateGroupValidation,
  GroupsController.updateGroup
);

router.delete(
  '/groups/:id',
  GroupsController.deleteGroup
);

// Group member routes
router.post(
  '/groups/:id/members',
  addMemberValidation,
  GroupsController.addMember
);

router.delete(
  '/groups/:id/members/:membershipId',
  GroupsController.removeMember
);

export default router;
