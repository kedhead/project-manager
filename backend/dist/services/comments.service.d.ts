interface Comment {
    id: number;
    task_id: number;
    user_id: number;
    content: string;
    created_at: Date;
    updated_at: Date;
    is_edited: boolean;
}
interface CommentWithUser extends Comment {
    user_name: string;
    user_email: string;
}
interface ActivityLog {
    id: number;
    project_id: number;
    user_id: number;
    entity_type: string;
    entity_id: number | null;
    action: string;
    changes: any;
    created_at: Date;
}
interface ActivityLogWithUser extends ActivityLog {
    user_name: string;
    user_email: string;
}
export declare class CommentsService {
    static createComment(taskId: number, userId: number, content: string): Promise<CommentWithUser>;
    static listComments(taskId: number, userId: number): Promise<CommentWithUser[]>;
    static getCommentById(commentId: number, userId: number): Promise<CommentWithUser>;
    static updateComment(commentId: number, userId: number, content: string): Promise<CommentWithUser>;
    static deleteComment(commentId: number, userId: number): Promise<void>;
    static getProjectActivity(projectId: number, userId: number, filters?: {
        entityType?: string;
        action?: string;
        limit?: number;
        offset?: number;
    }): Promise<{
        activities: ActivityLogWithUser[];
        total: number;
    }>;
    static getTaskActivity(taskId: number, userId: number, limit?: number): Promise<ActivityLogWithUser[]>;
    static getUserActivity(userId: number, limit?: number): Promise<ActivityLogWithUser[]>;
}
export default CommentsService;
//# sourceMappingURL=comments.service.d.ts.map