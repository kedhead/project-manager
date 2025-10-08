import { Router } from 'express';
import { FilesController } from '../controllers/files.controller';
import { authenticate } from '../middleware/auth.middleware';
import { upload, handleUploadError } from '../middleware/upload.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// File upload routes (task-scoped)
router.post(
  '/tasks/:taskId/files',
  upload.single('file'),
  handleUploadError,
  FilesController.uploadFile
);

router.get(
  '/tasks/:taskId/files',
  FilesController.listTaskFiles
);

// Individual file routes
router.get(
  '/files/:id',
  FilesController.getFile
);

router.get(
  '/files/:id/download',
  FilesController.downloadFile
);

router.delete(
  '/files/:id',
  FilesController.deleteFile
);

// Storage usage routes
router.get(
  '/projects/:projectId/storage',
  FilesController.getProjectStorage
);

router.get(
  '/storage',
  FilesController.getUserStorage
);

export default router;
