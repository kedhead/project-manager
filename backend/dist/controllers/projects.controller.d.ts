import { Request, Response } from 'express';
export declare class ProjectsController {
    static createProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listProjects: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteProject: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getMembers: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateMemberRole: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static removeMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export default ProjectsController;
//# sourceMappingURL=projects.controller.d.ts.map