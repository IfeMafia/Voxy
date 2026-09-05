import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
if (process.env.CLOUDINARY_URL) {
  cloudinary.config({
    secure: true,
  });
} else {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true,
  });
}

/**
 * Upload a Buffer to Cloudinary
 * @param {Buffer} buffer 
 * @param {object} options 
 * @returns {Promise<import('cloudinary').UploadApiResponse>}
 */
export async function uploadBufferToCloudinary(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder || 'voxy-uploads',
        resource_type: options.resource_type || 'image',
        ...options,
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      }
    );

    uploadStream.end(buffer);
  });
}

export default cloudinary;
