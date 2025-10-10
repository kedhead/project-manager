import { Request, Response } from 'express';
export declare class TasksController {
    static createTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static listTasks: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static updateTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static deleteTask: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static addDependency: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static getDependencies: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static removeDependency: (req: Request, res: Response, next: import("express").NextFunction) => void;
    static bulkUpdateTasks: (req: Request, res: Response, next: import("express").NextFunction) => void;
}
export default TasksController;
//# sourceMappingURL=tasks.controller.d.ts.map