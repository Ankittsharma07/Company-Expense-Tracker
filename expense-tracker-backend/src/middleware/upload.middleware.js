import multer from "multer";

// File upload configuration
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const ALLOWED_MIME_TYPES = [
    "image/jpeg",
    "image/png",
    "application/pdf",
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

// Error handler middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        if (err.code === "LIMIT_FILE_SIZE") {
            return res.status(400).json({
                message: "File size exceeds 5MB limit",
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
