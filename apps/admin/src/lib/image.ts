/**
 * Resizes an image in the browser to WebP (max 1400 px) before upload.
 * Doing this client-side keeps the API Worker well inside the free-plan CPU limit.
 */
export async function toWebp(file: File, maxSize = 1400, quality = 0.82): Promise<Blob> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSize / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext('2d')?.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return new Promise((resolve, reject) =>
    canvas.toBlob(
      (b) => (b ? resolve(b) : reject(new Error('Could not encode image'))),
      'image/webp',
      quality,
    ),
  );
}
