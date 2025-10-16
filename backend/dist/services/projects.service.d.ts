interface Project {
    id: number;
    name: string;
    description: string | null;
    start_date: Date | null;
    end_date: Date | null;
    status: string;
    auto_scheduling: boolean;
    created_by: number;
    created_at: Date;
    updated_at: Date;
}
interface ProjectMember {
    id: number;
    project_id: number;
    user_id: number;
    role: string;
    joined_at: Date;
}
interface ProjectWithRole extends Project {
    user_role: string;
    member_count: number;
    task_count: number;
}
export declare class ProjectsService {
    static createProject(userId: number, name: string, description?: string | null, startDate?: Date | null, endDate?: Date | null, autoScheduling?: boolean): Promise<ProjectWithRole>;
    static listProjects(userId: number, filters?: {
        status?: string;
        search?: string;
    }): Promise<ProjectWithRole[]>;
    static getProjectById(projectId: number, userId: number): Promise<ProjectWithRole>;
    static updateProject(projectId: number, userId: number, updates: {
        name?: string;
        description?: string;
        startDate?: Date;
        endDate?: Date;
        status?: string;
        autoScheduling?: boolean;
    }): Promise<Project>;
    static deleteProject(projectId: number, userId: number): Promise<void>;
    static getProjectMembers(projectId: number, userId: number): Promise<any[]>;
    static addProjectMember(projectId: number, userId: number, newMemberEmail: string, role?: string): Promise<ProjectMember>;
    static updateMemberRole(projectId: number, userId: number, memberId: number, newRole: string): Promise<ProjectMember>;
    static removeMember(projectId: number, userId: number, memberId: number): Promise<void>;
}
export default ProjectsService;
//# sourceMappingURL=projects.service.d.ts.map