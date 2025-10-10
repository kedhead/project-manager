"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const express_validator_1 = require("express-validator");
const auth_controller_1 = require("../controllers/auth.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const router = (0, express_1.Router)();
// Validation rules
const registerValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters long'),
    (0, express_validator_1.body)('firstName').trim().notEmpty().withMessage('First name is required'),
    (0, express_validator_1.body)('lastName').trim().notEmpty().withMessage('Last name is required'),
];
const loginValidation = [
    (0, express_validator_1.body)('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    (0, express_validator_1.body)('password').notEmpty().withMessage('Password is required'),
];
// Public routes
router.post('/register', registerValidation, auth_controller_1.AuthController.register);
router.post('/login', loginValidation, auth_controller_1.AuthController.login);
router.post('/refresh', auth_controller_1.AuthController.refresh);
router.post('/request-password-reset', auth_controller_1.AuthController.requestPasswordReset);
router.post('/reset-password', auth_controller_1.AuthController.resetPassword);
// Protected routes (require authentication)
router.get('/profile', auth_middleware_1.authenticate, auth_controller_1.AuthController.getProfile);
router.put('/profile', auth_middleware_1.authenticate, auth_controller_1.AuthController.updateProfile);
router.post('/change-password', auth_middleware_1.authenticate, auth_controller_1.AuthController.changePassword);
router.post('/logout', auth_middleware_1.authenticate, auth_controller_1.AuthController.logout);
exports.default = router;
//# sourceMappingURL=auth.routes.js.map