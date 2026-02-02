import { v2 as cloudinary } from "cloudinary";
import { env } from "../../config/env.js";

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret,
});

const folderBase = "expense-tracker/avatars";

export const uploadAvatar = async ({ buffer, mimeType, companyId, userId, originalName }) => {
  try {
    const folder = `${folderBase}/${companyId}/${userId}`;

    const result = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        {
          folder,
          resource_type: "image",
          use_filename: true,
          unique_filename: true,
          filename_override: originalName,
          transformation: [{ width: 256, height: 256, crop: "fill", gravity: "face" }],
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
      resourceType: "image",
    };
  } catch (error) {
    throw new Error(`Cloudinary upload failed: ${error.message}`);
  }
};
