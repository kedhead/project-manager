export interface CreateGroupData {
    name: string;
    description?: string;
    color?: string;
}
export interface UpdateGroupData {
    name?: string;
    description?: string;
    color?: string;
}
export declare class GroupsService {
    static createGroup(projectId: number, userId: number, data: CreateGroupData): Promise<any>;
    static listGroups(projectId: number, userId: number): Promise<any[]>;
    static getGroupById(groupId: number, userId: number): Promise<any>;
    static updateGroup(groupId: number, userId: number, data: UpdateGroupData): Promise<any>;
    static deleteGroup(groupId: number, userId: number): Promise<void>;
    static addMember(groupId: number, userId: number, memberUserId: number): Promise<any>;
    static removeMember(groupId: number, userId: number, membershipId: number): Promise<void>;
}
export default GroupsService;
//# sourceMappingURL=groups.service.d.ts.map