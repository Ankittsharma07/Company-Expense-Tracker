import multer from "multer";

// File upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_AVATAR_SIZE = 2 * 1024 * 1024; // 2MB

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
];

const ALLOWED_AVATAR_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "image/webp",
];

// Use memory storage to stream directly to Cloudinary
const storage = multer.memoryStorage();

// File filter to validate file types
const fileFilter = (req, file, cb) => {
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(
            new Error(
                "Invalid file type. Only JPEG, PNG, and PDF files are allowed."
            ),
            false
        );
    }
};

// Configure multer
const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: MAX_FILE_SIZE,
    },
});

// Middleware for single file upload
export const uploadReceipt = upload.single("receipt");

const avatarUpload = multer({
    storage,
    fileFilter: (req, file, cb) => {
        if (ALLOWED_AVATAR_MIME_TYPES.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(
                new Error(
                    "Invalid file type. Only JPEG, PNG, and WEBP files are allowed."
                ),
                false
            );
        }
    },
    limits: {
        fileSize: MAX_AVATAR_SIZE,
    },
});

export const uploadAvatar = avatarUpload.single("avatar");

// Error handler middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "File size exceeds limit",
            });
        }
        return res.status(400).json({
            message: `Upload error: ${err.message}`,
        });
    }

    if (err) {
        return res.status(400).json({
            message: err.message || "File upload failed",
        });
    }

    next();
};
