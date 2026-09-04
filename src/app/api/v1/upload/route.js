import { successResponse, errorResponse } from '@/lib/response';
import { getAuthUser } from '@/lib/auth';
import { uploadBufferToCloudinary } from '@/lib/cloudinary';
import { logRequest } from '@/lib/logger';

export const dynamic = 'force-dynamic';

export async function POST(req) {
  const startTime = Date.now();

  try {
    const auth = getAuthUser(req);
    if (!auth) {
      logRequest({
        method: 'POST',
        path: '/api/v1/upload',
        status: 401,
        latencyMs: Date.now() - startTime,
        error: 'Unauthorized',
      });
      return errorResponse('UNAUTHORIZED', 'Authentication required to upload files', 401);
    }

    const formData = await req.formData();
    const file = formData.get('file');
    const folder = formData.get('folder') || 'voxy-products';

    if (!file || typeof file === 'string') {
      return errorResponse('INVALID_FILE', 'No valid file provided for upload', 400);
    }

    // Validate mime type
    if (!file.type || !file.type.startsWith('image/')) {
      return errorResponse('INVALID_FILE_TYPE', 'Only image files are supported', 400);
    }

    // Limit size to 10MB
    const MAX_SIZE = 10 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      return errorResponse('FILE_TOO_LARGE', 'Image size must not exceed 10MB', 400);
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const result = await uploadBufferToCloudinary(buffer, {
      folder: `voxy/${folder}`,
      resource_type: 'image',
    });

    logRequest({
      method: 'POST',
      path: '/api/v1/upload',
      status: 200,
      latencyMs: Date.now() - startTime,
    });

    return successResponse({
      url: result.secure_url,
      publicId: result.public_id,
      format: result.format,
      width: result.width,
      height: result.height,
      bytes: result.bytes,
    });
  } catch (err) {
    logRequest({
      method: 'POST',
      path: '/api/v1/upload',
      status: 500,
      latencyMs: Date.now() - startTime,
      error: err.message,
    });

    return errorResponse('UPLOAD_FAILED', err.message || 'Failed to upload image to Cloudinary', 500);
  }
}
