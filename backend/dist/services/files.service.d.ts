interface FileAttachment {
    id: number;
    task_id: number;
    uploaded_by: number;
    file_name: string;
    file_path: string;
    file_size: number;
    mime_type: string;
    uploaded_at: Date;
}
interface FileAttachmentWithUser extends FileAttachment {
    uploader_name: string;
    uploader_email: string;
}
export declare class FilesService {
    static uploadFile(taskId: number, userId: number, file: Express.Multer.File): Promise<FileAttachmentWithUser>;
    static listTaskFiles(taskId: number, userId: number): Promise<FileAttachmentWithUser[]>;
    static getFileById(fileId: number, userId: number): Promise<FileAttachmentWithUser>;
    static downloadFile(fileId: number, userId: number): Promise<FileAttachment>;
    static deleteFile(fileId: number, userId: number): Promise<void>;
    static getProjectStorageUsage(projectId: number, userId: number): Promise<number>;
    static getUserStorageUsage(userId: number): Promise<number>;
}
export default FilesService;
//# sourceMappingURL=files.service.d.ts.map