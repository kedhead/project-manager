"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const comments_controller_1 = require("../controllers/comments.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// Validation rules
const createCommentValidation = [
    (0, express_validator_1.body)('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 5000 })
        .withMessage('Comment must be less than 5000 characters'),
];
const updateCommentValidation = [
    (0, express_validator_1.body)('content')
        .trim()
        .notEmpty()
        .withMessage('Comment content is required')
        .isLength({ max: 5000 })
        .withMessage('Comment must be less than 5000 characters'),
];
// Comment routes (task-scoped)
router.post('/tasks/:taskId/comments', createCommentValidation, comments_controller_1.CommentsController.createComment);
router.get('/tasks/:taskId/comments', comments_controller_1.CommentsController.listComments);
// Individual comment routes
router.get('/comments/:id', comments_controller_1.CommentsController.getComment);
router.put('/comments/:id', updateCommentValidation, comments_controller_1.CommentsController.updateComment);
router.delete('/comments/:id', comments_controller_1.CommentsController.deleteComment);
// Activity log routes
router.get('/projects/:projectId/activity', comments_controller_1.CommentsController.getProjectActivity);
router.get('/tasks/:taskId/activity', comments_controller_1.CommentsController.getTaskActivity);
router.get('/activity', comments_controller_1.CommentsController.getUserActivity);
exports.default = router;
//# sourceMappingURL=comments.routes.js.map