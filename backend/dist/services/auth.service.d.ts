interface User {
    id: number;
    email: string;
    password_hash: string;
    first_name: string;
    last_name: string;
    is_active: boolean;
    created_at: Date;
}
interface TokenPayload {
    userId: number;
    email: string;
}
export declare class AuthService {
    static hashPassword(password: string): Promise<string>;
    static comparePassword(password: string, hash: string): Promise<boolean>;
    static generateAccessToken(payload: TokenPayload): string;
    static generateRefreshToken(payload: TokenPayload): string;
    static verifyAccessToken(token: string): TokenPayload;
    static verifyRefreshToken(token: string): TokenPayload;
    static register(email: string, password: string, firstName: string, lastName: string): Promise<{
        user: Omit<User, 'password_hash'>;
        accessToken: string;
        refreshToken: string;
    }>;
    static login(email: string, password: string): Promise<{
        user: Omit<User, 'password_hash'>;
        accessToken: string;
        refreshToken: string;
    }>;
    static refreshAccessToken(refreshToken: string): Promise<{
        accessToken: string;
        refreshToken: string;
    }>;
    static getUserById(userId: number): Promise<Omit<User, 'password_hash'>>;
    static updateProfile(userId: number, updates: {
        firstName?: string;
        lastName?: string;
        email?: string;
    }): Promise<Omit<User, 'password_hash'>>;
    static changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void>;
    static requestPasswordReset(email: string): Promise<string>;
    static resetPassword(token: string, newPassword: string): Promise<void>;
}
export default AuthService;
//# sourceMappingURL=auth.service.d.ts.map