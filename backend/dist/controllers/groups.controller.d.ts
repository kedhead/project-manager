import { Request, Response } from 'express';
export declare class GroupsController {
    static createGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listGroups: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteGroup: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static removeMember: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export default GroupsController;
//# sourceMappingURL=groups.controller.d.ts.map