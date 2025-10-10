"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var _a;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const files_service_1 = require("../services/files.service");
const errorHandler_1 = require("../middleware/errorHandler");
const path_1 = __importDefault(require("path"));
class FilesController {
}
exports.FilesController = FilesController;
_a = FilesController;
// Upload file to task
FilesController.uploadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    if (!req.file) {
        throw new errorHandler_1.AppError('No file uploaded', 400);
    }
    const fileAttachment = await files_service_1.FilesService.uploadFile(taskId, userId, req.file);
    res.status(201).json({
        status: 'success',
        data: { file: fileAttachment },
        message: 'File uploaded successfully',
    });
});
// List files for a task
FilesController.listTaskFiles = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const taskId = parseInt(req.params.taskId);
    if (isNaN(taskId)) {
        throw new errorHandler_1.AppError('Invalid task ID', 400);
    }
    const files = await files_service_1.FilesService.listTaskFiles(taskId, userId);
    res.status(200).json({
        status: 'success',
        data: {
            files,
            count: files.length,
        },
    });
});
// Get file details
FilesController.getFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
        throw new errorHandler_1.AppError('Invalid file ID', 400);
    }
    const file = await files_service_1.FilesService.getFileById(fileId, userId);
    res.status(200).json({
        status: 'success',
        data: { file },
    });
});
// Download file
FilesController.downloadFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
        throw new errorHandler_1.AppError('Invalid file ID', 400);
    }
    const file = await files_service_1.FilesService.downloadFile(fileId, userId);
    // Set headers for file download
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.setHeader('Content-Length', file.file_size);
    // Send file
    res.sendFile(path_1.default.resolve(file.file_path));
});
// Delete file
FilesController.deleteFile = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const fileId = parseInt(req.params.id);
    if (isNaN(fileId)) {
        throw new errorHandler_1.AppError('Invalid file ID', 400);
    }
    await files_service_1.FilesService.deleteFile(fileId, userId);
    res.status(200).json({
        status: 'success',
        message: 'File deleted successfully',
    });
});
// Get project storage usage
FilesController.getProjectStorage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
        throw new errorHandler_1.AppError('Invalid project ID', 400);
    }
    const totalBytes = await files_service_1.FilesService.getProjectStorageUsage(projectId, userId);
    res.status(200).json({
        status: 'success',
        data: {
            totalBytes,
            totalMB: (totalBytes / 1024 / 1024).toFixed(2),
        },
    });
});
// Get user storage usage
FilesController.getUserStorage = (0, errorHandler_1.asyncHandler)(async (req, res) => {
    const userId = req.user.userId;
    const totalBytes = await files_service_1.FilesService.getUserStorageUsage(userId);
    res.status(200).json({
        status: 'success',
        data: {
            totalBytes,
            totalMB: (totalBytes / 1024 / 1024).toFixed(2),
        },
    });
});
exports.default = FilesController;
//# sourceMappingURL=files.controller.js.map