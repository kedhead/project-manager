import { Request, Response } from 'express';
import { FilesService } from '../services/files.service';
import { AppError, asyncHandler } from '../middleware/errorHandler';
import path from 'path';

export class FilesController {
  // Upload file to task
  static uploadFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.taskId);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const fileAttachment = await FilesService.uploadFile(taskId, userId, req.file);

    res.status(201).json({
      status: 'success',
      data: { file: fileAttachment },
      message: 'File uploaded successfully',
    });
  });

  // List files for a task
  static listTaskFiles = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const taskId = parseInt(req.params.taskId);

    if (isNaN(taskId)) {
      throw new AppError('Invalid task ID', 400);
    }

    const files = await FilesService.listTaskFiles(taskId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        files,
        count: files.length,
      },
    });
  });

  // Get file details
  static getFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      throw new AppError('Invalid file ID', 400);
    }

    const file = await FilesService.getFileById(fileId, userId);

    res.status(200).json({
      status: 'success',
      data: { file },
    });
  });

  // Download file
  static downloadFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      throw new AppError('Invalid file ID', 400);
    }

    const file = await FilesService.downloadFile(fileId, userId);

    // Set headers for file download
    res.setHeader('Content-Type', file.mime_type);
    res.setHeader('Content-Disposition', `attachment; filename="${file.file_name}"`);
    res.setHeader('Content-Length', file.file_size);

    // Send file
    res.sendFile(path.resolve(file.file_path));
  });

  // Delete file
  static deleteFile = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const fileId = parseInt(req.params.id);

    if (isNaN(fileId)) {
      throw new AppError('Invalid file ID', 400);
    }

    await FilesService.deleteFile(fileId, userId);

    res.status(200).json({
      status: 'success',
      message: 'File deleted successfully',
    });
  });

  // Get project storage usage
  static getProjectStorage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;
    const projectId = parseInt(req.params.projectId);

    if (isNaN(projectId)) {
      throw new AppError('Invalid project ID', 400);
    }

    const totalBytes = await FilesService.getProjectStorageUsage(projectId, userId);

    res.status(200).json({
      status: 'success',
      data: {
        totalBytes,
        totalMB: (totalBytes / 1024 / 1024).toFixed(2),
      },
    });
  });

  // Get user storage usage
  static getUserStorage = asyncHandler(async (req: Request, res: Response) => {
    const userId = req.user!.userId;

    const totalBytes = await FilesService.getUserStorageUsage(userId);

    res.status(200).json({
      status: 'success',
      data: {
        totalBytes,
        totalMB: (totalBytes / 1024 / 1024).toFixed(2),
      },
    });
  });
}

export default FilesController;
