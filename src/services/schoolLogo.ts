const MAX_LOGO_FILE_SIZE = 10 * 1024 * 1024;
const MAX_COMPRESSED_LOGO_SIZE = 350 * 1024;
const MAX_LOGO_DIMENSION = 512;

export async function compressSchoolLogo(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) {
    throw new Error('Pilih berkas gambar yang valid.');
  }
  if (file.size > MAX_LOGO_FILE_SIZE) {
    throw new Error('Ukuran logo maksimal 10 MB.');
  }

  const bitmap = await createImageBitmap(file);
  try {
    let scale = Math.min(1, MAX_LOGO_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement('canvas');

    for (let attempt = 0; attempt < 8; attempt += 1) {
      canvas.width = Math.max(1, Math.round(bitmap.width * scale));
      canvas.height = Math.max(1, Math.round(bitmap.height * scale));
      const context = canvas.getContext('2d');
      if (!context) throw new Error('Logo tidak dapat diproses pada perangkat ini.');
      context.drawImage(bitmap, 0, 0, canvas.width, canvas.height);

      const blob = await new Promise<Blob | null>((resolve) =>
        canvas.toBlob(resolve, 'image/webp', Math.max(0.5, 0.88 - attempt * 0.05))
      );
      if (!blob) throw new Error('Gagal mengolah logo. Silakan pilih gambar lain.');
      if (blob.size <= MAX_COMPRESSED_LOGO_SIZE) {
        return await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () =>
            typeof reader.result === 'string'
              ? resolve(reader.result)
              : reject(new Error('Gagal membaca hasil logo.'));
          reader.onerror = () => reject(new Error('Gagal membaca hasil logo.'));
          reader.readAsDataURL(blob);
        });
      }
      scale *= 0.8;
    }

    throw new Error('Logo terlalu besar setelah dikompres. Pilih gambar dengan resolusi lebih kecil.');
  } finally {
    bitmap.close();
  }
}
