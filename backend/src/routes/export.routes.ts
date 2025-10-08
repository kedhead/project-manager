import { Router } from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { hasProjectAccess } from '../middleware/permissions.middleware';
import ExportController from '../controllers/export.controller';

const router = Router();

// Export project tasks to Excel
router.get(
  '/projects/:projectId/export/excel',
  authenticate,
  hasProjectAccess,
  ExportController.exportToExcel
);

// Export project tasks to CSV
router.get(
  '/projects/:projectId/export/csv',
  authenticate,
  hasProjectAccess,
  ExportController.exportToCSV
);

// Export project tasks to PDF
router.get(
  '/projects/:projectId/export/pdf',
  authenticate,
  hasProjectAccess,
  ExportController.exportToPDF
);

export default router;
