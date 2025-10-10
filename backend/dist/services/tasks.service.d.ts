interface Task {
    id: number;
    project_id: number;
    title: string;
    description: string | null;
    start_date: Date | null;
    end_date: Date | null;
    duration: number | null;
    progress: number;
    status: string;
    priority: string;
    assigned_to: number | null;
    created_by: number;
    parent_task_id: number | null;
    color: string | null;
    created_at: Date;
    updated_at: Date;
    completed_at: Date | null;
}
interface TaskWithDetails extends Task {
    assigned_user_name: string | null;
    assigned_user_email: string | null;
    created_user_name: string;
    subtask_count: number;
    dependency_count: number;
    dependencies?: TaskDependency[];
}
interface TaskDependency {
    id: number;
    task_id: number;
    depends_on_task_id: number;
    dependency_type: string;
    lag_time: number;
}
export declare class TasksService {
    static createTask(projectId: number, userId: number, data: {
        title: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        duration?: number;
        status?: string;
        priority?: string;
        assignedTo?: number;
        assignedGroupId?: number;
        parentTaskId?: number;
    }): Promise<TaskWithDetails>;
    static listTasks(projectId: number, userId: number, filters?: {
        status?: string;
        priority?: string;
        assignedTo?: number;
        parentTaskId?: number | null;
        search?: string;
    }): Promise<TaskWithDetails[]>;
    static getTaskById(taskId: number, userId: number): Promise<TaskWithDetails>;
    private static getTaskByIdInternal;
    static updateTask(taskId: number, userId: number, updates: {
        title?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        duration?: number;
        progress?: number;
        status?: string;
        priority?: string;
        assignedTo?: number | null;
        assignedGroupId?: number | null;
        parentTaskId?: number | null;
        color?: string | null;
    }): Promise<TaskWithDetails>;
    static deleteTask(taskId: number, userId: number): Promise<void>;
    static addDependency(taskId: number, userId: number, dependsOnTaskId: number, dependencyType?: string, lagTime?: number): Promise<TaskDependency>;
    static removeDependency(dependencyId: number, userId: number): Promise<void>;
    static getTaskDependencies(taskId: number, userId: number): Promise<any[]>;
    static bulkUpdateTasks(projectId: number, userId: number, updates: Array<{
        id: number;
        startDate?: Date;
        endDate?: Date;
        duration?: number;
        progress?: number;
    }>): Promise<void>;
}
export default TasksService;
//# sourceMappingURL=tasks.service.d.ts.map