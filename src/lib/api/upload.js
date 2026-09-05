/**
 * Upload an image file to Cloudinary via backend /api/v1/upload
 * @param {File|Blob} file 
 * @param {string} [folder='products'] 
 * @returns {Promise<{ url: string, publicId: string, format: string, width: number, height: number, bytes: number }>}
 */
export async function uploadImage(file, folder = 'products') {
  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const formData = new FormData();
  formData.append('file', file);
  if (folder) {
    formData.append('folder', folder);
  }

  const res = await fetch('/api/v1/upload', {
    method: 'POST',
    headers: {
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    credentials: 'include',
    body: formData,
  });

  let json;
  try {
    json = await res.json();
  } catch {
    throw new Error(`Invalid response from server (${res.status})`);
  }

  if (!json.success) {
    throw new Error(json.error?.message || json.error || 'Failed to upload image');
  }

  return json.data;
}
