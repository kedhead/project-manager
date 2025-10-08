import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { Request } from 'express';
import { AppError } from './errorHandler';
import { config } from '../config';

// Ensure upload directory exists
const uploadDir = config.uploads.dir;
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req: Request, file: Express.Multer.File, cb) => {
    cb(null, uploadDir);
  },
  filename: (req: Request, file: Express.Multer.File, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    const nameWithoutExt = path.basename(file.originalname, ext);
    const sanitizedName = nameWithoutExt.replace(/[^a-zA-Z0-9]/g, '_');
    cb(null, `${uniqueSuffix}-${sanitizedName}${ext}`);
  },
});

// File filter - only allow specific file types
const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();
  const allowedTypes = config.uploads.allowedTypes;

  if (allowedTypes.includes(ext)) {
    cb(null, true);
  } else {
    cb(new AppError(`File type ${ext} is not allowed. Allowed types: ${allowedTypes.join(', ')}`, 400));
  }
};

// Create multer upload instance
export const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.uploads.maxFileSize, // 10MB default
  },
});

// Middleware to handle upload errors
export const handleUploadError = (err: any, req: Request, res: any, next: any) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        status: 'error',
        message: `File too large. Maximum size is ${config.uploads.maxFileSize / 1024 / 1024}MB`,
      });
    }
    return res.status(400).json({
      status: 'error',
      message: `Upload error: ${err.message}`,
    });
  }
  next(err);
};

export default upload;
