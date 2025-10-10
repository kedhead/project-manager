import { Request, Response } from 'express';
export declare class CommentsController {
    static createComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listComments: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteComment: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getProjectActivity: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTaskActivity: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getUserActivity: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export default CommentsController;
//# sourceMappingURL=comments.controller.d.ts.map