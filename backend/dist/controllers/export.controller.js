"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const export_service_1 = __importDefault(require("../services/export.service"));
class ExportController {
    // Export tasks to Excel
    static async exportToExcel(req, res) {
        try {
            const projectId = parseInt(req.params.projectId);
            const userId = req.user.userId;
            const buffer = await export_service_1.default.exportToExcel(projectId, userId);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks.xlsx`);
            res.send(buffer);
        }
        catch (error) {
            console.error('Export to Excel error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to export to Excel',
            });
        }
    }
    // Export tasks to CSV
    static async exportToCSV(req, res) {
        try {
            const projectId = parseInt(req.params.projectId);
            const userId = req.user.userId;
            const csv = await export_service_1.default.exportToCSV(projectId, userId);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks.csv`);
            res.send(csv);
        }
        catch (error) {
            console.error('Export to CSV error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to export to CSV',
            });
        }
    }
    // Export tasks to PDF
    static async exportToPDF(req, res) {
        try {
            const projectId = parseInt(req.params.projectId);
            const userId = req.user.userId;
            const buffer = await export_service_1.default.exportToPDF(projectId, userId);
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks.pdf`);
            res.send(buffer);
        }
        catch (error) {
            console.error('Export to PDF error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to export to PDF',
            });
        }
    }
    // Export tasks to Google Sheets format (Excel that can be imported)
    static async exportToGoogleSheets(req, res) {
        try {
            const projectId = parseInt(req.params.projectId);
            const userId = req.user.userId;
            const buffer = await export_service_1.default.exportToGoogleSheets(projectId, userId);
            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', `attachment; filename=project-${projectId}-tasks-google-sheets.xlsx`);
            res.send(buffer);
        }
        catch (error) {
            console.error('Export to Google Sheets error:', error);
            res.status(500).json({
                success: false,
                message: error.message || 'Failed to export for Google Sheets',
            });
        }
    }
}
exports.default = ExportController;
//# sourceMappingURL=export.controller.js.map