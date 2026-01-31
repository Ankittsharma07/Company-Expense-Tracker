import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";

// Configure Cloudinary with credentials from environment
cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

const folderBase = "expense-tracker";

/**
 * Determines the Cloudinary resource type based on MIME type
 * @param {string} mimeType - The MIME type of the file
 * @returns {string} - 'raw' for PDFs, 'image' for images
 */
const getResourceType = (mimeType) => (mimeType === "application/pdf" ? "raw" : "image");

/**
 * Uploads a receipt file to Cloudinary
 * @param {Object} params - Upload parameters
 * @param {Buffer} params.buffer - File buffer
 * @param {string} params.mimeType - MIME type of the file
 * @param {string} params.companyId - Company ID for folder structure
 * @param {string} params.expenseId - Expense ID for folder structure
 * @param {string} params.originalName - Original filename
 * @returns {Promise<Object>} - Upload result with url, publicId, and receiptType
 * @throws {Error} - If upload fails
 */
export const uploadReceipt = async ({ buffer, mimeType, companyId, expenseId, originalName }) => {
  try {
    const resourceType = getResourceType(mimeType);
    const folder = `${folderBase}/${companyId}/${expenseId}`;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: resourceType,
          use_filename: true,
          unique_filename: true,
          filename_override: originalName,
        },
        (error, uploadResult) => {
          if (error) {
            reject(error);
            return;
          }
          resolve(uploadResult);
        }
      );

      stream.end(buffer);
    });

    return {
      url: result.secure_url || result.url,
      publicId: result.public_id,
      receiptType: resourceType === "raw" ? "pdf" : "image",
      resourceType,
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};

/**
 * Deletes a receipt file from Cloudinary
 * @param {Object} params - Delete parameters
 * @param {string} params.publicId - Cloudinary public ID
 * @param {string} params.receiptType - Type of receipt ('pdf' or 'image')
 * @returns {Promise<Object|null>} - Deletion result or null if no publicId
 * @throws {Error} - If deletion fails
 */
export const deleteReceipt = async ({ publicId, receiptType }) => {
  if (!publicId) {
    return null;
  }

  try {
    const resourceType = receiptType === "pdf" ? "raw" : "image";
    return await cloudinary.uploader.destroy(publicId, { resource_type: resourceType });
  } catch (error) {
    // Log error but don't throw - we don't want to block expense deletion if Cloudinary cleanup fails
    console.error(`Cloudinary deletion failed for ${publicId}:`, error.message);
    return null;
  }
};

