const MAX_BYTES = 380 * 1024; // the API accepts up to 400 KB

/**
 * Shrinks a photo in the browser before upload: scales it down and re-encodes (WebP where supported, else JPEG),
 * trying smaller sizes and lower quality until it fits. Phone photos of several MB become well under 400 KB.
 */
export async function shrinkImage(file: File): Promise<Blob> {
  if (!/^image\/(jpeg|png|webp)$/.test(file.type)) throw new Error('Choose a JPEG, PNG or WebP photo');
  const bitmap = await createImageBitmap(file);
  try {
    for (const edge of [1200, 1000, 800, 640]) {
      const scale = Math.min(1, edge / Math.max(bitmap.width, bitmap.height));
      const canvas = document.createElement('canvas');
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Could not process the photo');
      ctx.fillStyle = '#ffffff'; // transparent PNGs get a white background
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
      for (const quality of [0.85, 0.72, 0.6]) {
        const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, 'image/webp', quality));
        // a browser without WebP encoding hands back a PNG, which is too big: use JPEG instead
        const out = blob && blob.type === 'image/webp' ? blob : await new Promise<Blob | null>((r) => canvas.toBlob(r, 'image/jpeg', quality));
        if (out && out.size <= MAX_BYTES) return out;
      }
    }
  } finally {
    bitmap.close();
  }
  throw new Error('That photo is too detailed to shrink enough. Try a different one.');
}
