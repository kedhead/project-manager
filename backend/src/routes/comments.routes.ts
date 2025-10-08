import { Router } from 'express';
import { body } from 'express-validator';
import { CommentsController } from '../controllers/comments.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Validation rules
const createCommentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 5000 })
    .withMessage('Comment must be less than 5000 characters'),
];

const updateCommentValidation = [
  body('content')
    .trim()
    .notEmpty()
    .withMessage('Comment content is required')
    .isLength({ max: 5000 })
    .withMessage('Comment must be less than 5000 characters'),
];

// Comment routes (task-scoped)
router.post(
  '/tasks/:taskId/comments',
  createCommentValidation,
  CommentsController.createComment
);

router.get(
  '/tasks/:taskId/comments',
  CommentsController.listComments
);

// Individual comment routes
router.get(
  '/comments/:id',
  CommentsController.getComment
);

router.put(
  '/comments/:id',
  updateCommentValidation,
  CommentsController.updateComment
);

router.delete(
  '/comments/:id',
  CommentsController.deleteComment
);

// Activity log routes
router.get(
  '/projects/:projectId/activity',
  CommentsController.getProjectActivity
);

router.get(
  '/tasks/:taskId/activity',
  CommentsController.getTaskActivity
);

router.get(
  '/activity',
  CommentsController.getUserActivity
);

export default router;
