/**
 * imageUtils.ts
 * Client-side image compression using the Canvas API.
 * Resizes and re-encodes images before upload to reduce bandwidth and storage cost.
 */

/**
 * Compress and optionally resize an image File before uploading.
 *
 * @param file      The original File object from an <input type="file"> or drop zone.
 * @param maxWidth  Maximum output width in pixels (default 800). Height is scaled proportionally.
 * @param quality   JPEG quality, 0–1 (default 0.8).
 * @returns         A new File with the same name but re-encoded as JPEG.
 *                  If the canvas API is unavailable or encoding fails, the original file is returned unchanged.
 */
export async function compressImage(
  file: File,
  maxWidth = 800,
  quality = 0.8,
): Promise<File> {
  return new Promise((resolve) => {
    // Safety: if running in an environment without canvas (SSR / old WebView), pass through.
    if (typeof document === 'undefined') {
      resolve(file);
      return;
    }

    const objectUrl = URL.createObjectURL(file);
    const img = new Image();

    img.onload = () => {
      URL.revokeObjectURL(objectUrl);

      const scale = Math.min(1, maxWidth / img.width);
      const targetWidth = Math.round(img.width * scale);
      const targetHeight = Math.round(img.height * scale);

      const canvas = document.createElement('canvas');
      canvas.width = targetWidth;
      canvas.height = targetHeight;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        // Canvas context unavailable — return original.
        resolve(file);
        return;
      }

      ctx.drawImage(img, 0, 0, targetWidth, targetHeight);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            // Encoding failed — return original.
            resolve(file);
            return;
          }
          // Preserve the original filename; force JPEG extension.
          const baseName = file.name.replace(/\.[^.]+$/, '');
          resolve(new File([blob], `${baseName}.jpg`, { type: 'image/jpeg' }));
        },
        'image/jpeg',
        quality,
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      // Cannot decode image — return original.
      resolve(file);
    };

    img.src = objectUrl;
  });
}
