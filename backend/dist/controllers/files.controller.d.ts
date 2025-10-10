import { Request, Response } from 'express';
export declare class FilesController {
    static uploadFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listTaskFiles: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static downloadFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteFile: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getProjectStorage: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserStorage: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export default FilesController;
//# sourceMappingURL=files.controller.d.ts.map