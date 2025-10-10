"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const files_controller_1 = require("../controllers/files.controller");
const auth_middleware_1 = require("../middleware/auth.middleware");
const upload_middleware_1 = require("../middleware/upload.middleware");
const router = (0, express_1.Router)();
// All routes require authentication
router.use(auth_middleware_1.authenticate);
// File upload routes (task-scoped)
router.post('/tasks/:taskId/files', upload_middleware_1.upload.single('file'), upload_middleware_1.handleUploadError, files_controller_1.FilesController.uploadFile);
router.get('/tasks/:taskId/files', files_controller_1.FilesController.listTaskFiles);
// Individual file routes
router.get('/files/:id', files_controller_1.FilesController.getFile);
router.get('/files/:id/download', files_controller_1.FilesController.downloadFile);
router.delete('/files/:id', files_controller_1.FilesController.deleteFile);
// Storage usage routes
router.get('/projects/:projectId/storage', files_controller_1.FilesController.getProjectStorage);
router.get('/storage', files_controller_1.FilesController.getUserStorage);
exports.default = router;
//# sourceMappingURL=files.routes.js.map