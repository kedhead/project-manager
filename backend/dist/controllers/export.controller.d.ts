import { Request, Response } from 'express';
declare class ExportController {
    static exportToExcel(req: Request, res: Response): Promise<void>;
    static exportToCSV(req: Request, res: Response): Promise<void>;
    static exportToPDF(req: Request, res: Response): Promise<void>;
    static exportToGoogleSheets(req: Request, res: Response): Promise<void>;
}
export default ExportController;
//# sourceMappingURL=export.controller.d.ts.map