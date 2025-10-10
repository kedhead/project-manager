import { Request, Response, NextFunction } from 'express';
declare global {
    namespace Express {
        interface Request {
            projectRole?: string;
            projectId?: number;
        }
    }
}
export declare const hasProjectAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const isProjectOwner: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const canManageProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const canEditProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
export declare const requireRole: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
declare const _default: {
    hasProjectAccess: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    isProjectOwner: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    canManageProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    canEditProject: (req: Request, res: Response, next: NextFunction) => Promise<void>;
    requireRole: (...allowedRoles: string[]) => (req: Request, res: Response, next: NextFunction) => Promise<void>;
};
export default _default;
//# sourceMappingURL=permissions.middleware.d.ts.map