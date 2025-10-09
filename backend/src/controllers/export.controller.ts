import { Request, Response } from 'express';
import ExportService from '../services/export.service';

class ExportController {
  // Export tasks to Excel
  static async exportToExcel(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user!.userId;

      const buffer = await ExportService.exportToExcel(projectId, userId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks.xlsx`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Export to Excel error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export to Excel',
      });
    }
  }

  // Export tasks to CSV
  static async exportToCSV(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user!.userId;

      const csv = await ExportService.exportToCSV(projectId, userId);

      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks.csv`);
      res.send(csv);
    } catch (error: any) {
      console.error('Export to CSV error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export to CSV',
      });
    }
  }

  // Export tasks to PDF
  static async exportToPDF(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user!.userId;

      const buffer = await ExportService.exportToPDF(projectId, userId);

      res.setHeader('Content-Type', 'application/pdf');
      res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks.pdf`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Export to PDF error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export to PDF',
      });
    }
  }

  // Export tasks to Google Sheets format (Excel that can be imported)
  static async exportToGoogleSheets(req: Request, res: Response) {
    try {
      const projectId = parseInt(req.params.projectId);
      const userId = req.user!.userId;

      const buffer = await ExportService.exportToGoogleSheets(projectId, userId);

      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks-google-sheets.xlsx`);
      res.send(buffer);
    } catch (error: any) {
      console.error('Export to Google Sheets error:', error);
      res.status(500).json({
        success: false,
        message: error.message || 'Failed to export for Google Sheets',
      });
    }
  }
}

export default ExportController;
