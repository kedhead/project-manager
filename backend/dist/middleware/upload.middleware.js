"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.handleUploadError = exports.upload = void 0;
const multer_1 = __importDefault(require("multer"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
const errorHandler_1 = require("./errorHandler");
const config_1 = require("../config");
// Ensure upload directory exists
const uploadDir = config_1.config.uploads.dir;
if (!fs_1.default.existsSync(uploadDir)) {
    fs_1.default.mkdirSync(uploadDir, { recursive: true });
}
// Configure storage
const storage = multer_1.default.diskStorage({
    destination: (req, file, cb) => {
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        // Generate unique filename: timestamp-random-originalname
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = path_1.default.extname(file.originalname);
        const nameWithoutExt = path_1.default.basename(file.originalname, ext);
        const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
        cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
    },
});
// File filter - only allow specific file types
const fileFilter = (req, file, cb) => {
    const ext = path_1.default.extname(file.originalname).toLowerCase();
    const allowedTypes = config_1.config.uploads.allowedTypes;
    if (allowedTypes.includes(ext)) {
        cb(null, true);
    }
    else {
        cb(new errorHandler_1.AppError(`File type ${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400));
    }
};
// Create multer upload instance
exports.upload = (0, multer_1.default)({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: config_1.config.uploads.maxFileSize, // 10MB default
    },
});
// Middleware to handle upload errors
const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer_1.default.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                status: 'error',
                message: `File too large. Maximum size is ${config_1.config.uploads.maxFileSize / 1024 / 1024}MB`,
            });
        }
        return res.status(400).json({
            status: 'error',
            message: `Upload error: ${err.message}`,
        });
    }
    next(err);
};
exports.handleUploadError = handleUploadError;
exports.default = exports.upload;
//# sourceMappingURL=upload.middleware.js.map