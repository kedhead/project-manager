declare class ExportService {
    static getTasksForExport(projectId: number, userId: number): Promise<any[]>;
    static getProjectDetails(projectId: number): Promise<any>;
    static exportToExcel(projectId: number, userId: number): Promise<Buffer>;
    static exportToCSV(projectId: number, userId: number): Promise<string>;
    static exportToPDF(projectId: number, userId: number): Promise<Buffer>;
    static exportToGoogleSheets(projectId: number, userId: number): Promise<Buffer>;
}
export default ExportService;
//# sourceMappingURL=export.service.d.ts.map