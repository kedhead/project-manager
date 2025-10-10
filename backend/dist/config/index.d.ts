export declare const config: {
    nodeEnv: string;
    port: number;
    database: {
        host: string;
        port: number;
        name: string;
        user: string;
        password: string;
    };
    jwt: {
        secret: string;
        refreshSecret: string;
        expiresIn: string;
        refreshExpiresIn: string;
    };
    smtp: {
        host: string;
        port: number;
        secure: boolean;
        user: string;
        password: string;
        from: string;
    };
    appUrl: string;
    frontendUrl: string;
    uploads: {
        dir: string;
        maxFileSize: number;
        allowedTypes: string[];
    };
    rateLimit: {
        windowMs: number;
        maxRequests: number;
    };
};
export default config;
//# sourceMappingURL=index.d.ts.map