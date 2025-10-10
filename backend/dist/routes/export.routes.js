"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_middleware_1 = require("../middleware/auth.middleware");
const permissions_middleware_1 = require("../middleware/permissions.middleware");
const export_controller_1 = __importDefault(require("../controllers/export.controller"));
const router = (0, express_1.Router)();
// Export project tasks to Excel
router.get('/projects/:projectId/export/excel', auth_middleware_1.authenticate, permissions_middleware_1.hasProjectAccess, export_controller_1.default.exportToExcel);
// Export project tasks to CSV
router.get('/projects/:projectId/export/csv', auth_middleware_1.authenticate, permissions_middleware_1.hasProjectAccess, export_controller_1.default.exportToCSV);
// Export project tasks to PDF
router.get('/projects/:projectId/export/pdf', auth_middleware_1.authenticate, permissions_middleware_1.hasProjectAccess, export_controller_1.default.exportToPDF);
// Export project tasks to Google Sheets (returns Excel that can be uploaded)
router.get('/projects/:projectId/export/google-sheets', auth_middleware_1.authenticate, permissions_middleware_1.hasProjectAccess, export_controller_1.default.exportToGoogleSheets);
exports.default = router;
//# sourceMappingURL=export.routes.js.map