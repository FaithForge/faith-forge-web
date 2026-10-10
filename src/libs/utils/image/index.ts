import Pica from 'pica';
const pica = new (Pica as any)();

/**
 * Resize an image file to a maximum width and return a Blob.
 *
 * @param {File} file - The image file to resize.
 * @returns {Promise<Blob>} A promise that resolves with the resized image blob.
 */
export const resizeImage = async (file: File): Promise<Blob> => {
  const img = document.createElement('img');
  const canvas = document.createElement('canvas');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = async () => {
        const maxWidth = 500; // Ancho máximo deseado
        const aspectRatio = img.height / img.width;
        canvas.width = maxWidth;
        canvas.height = maxWidth * aspectRatio;

        try {
          const resizedCanvas = await pica.resize(img, canvas);
          resizedCanvas.toBlob(
            (blob: Blob) => {
              if (blob) resolve(blob);
              else reject(new Error('Error al crear el blob'));
            },
            file.type || 'image/jpeg',
            0.1, // Calidad de compresión (0.8 = 80%)
          );
        } catch (err) {
          reject(err);
        }
      };
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

/**
 * Crop an image to a centered square, resize to the target size and compress to fit max size.
 *
 * @param {File} file - The input image file.
 * @param {number} [targetSizeInPixels=800] - Final width/height in pixels.
 * @param {number} [maxSizeInBytes=500*1024] - Maximum allowed blob size in bytes.
 * @returns {Promise<Blob>} A promise that resolves with the resulting image blob.
 */
export const resizeAndCropImageToSquare = async (
  file: File,
  targetSizeInPixels = 800, // Tamaño final (ancho y alto)
  maxSizeInBytes: number = 500 * 1024, // Maximum size in bytes
): Promise<Blob> => {
  const img = document.createElement('img');
  const canvas = document.createElement('canvas');
  const tempCanvas = document.createElement('canvas');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = async () => {
        // Define square crop size based on the shorter side
        const size = Math.min(img.width, img.height);
        tempCanvas.width = size;
        tempCanvas.height = size;

        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          reject(new Error('Error al obtener el contexto del lienzo'));
          return;
        }

        // Crop centered square
        tempCtx.drawImage(
          img,
          (img.width - size) / 2, // Offset X
          (img.height - size) / 2, // Offset Y
          size, // Ancho de recorte
          size, // Alto de recorte
          0,
          0,
          size,
          size,
        );

        // Redimensiona el cuadrado al tamaño deseado
        canvas.width = targetSizeInPixels;
        canvas.height = targetSizeInPixels;

        let quality = 0.9;
        let currentBlob: Blob | null = null;

        try {
          do {
            const resizedCanvas = await pica.resize(tempCanvas, canvas);
            const blob = await new Promise<Blob | null>((resolveBlob) =>
              resizedCanvas.toBlob(resolveBlob, file.type || 'image/jpeg', quality),
            );

            if (!blob) {
              reject(new Error('Error al crear el blob'));
              return;
            }

            currentBlob = blob;
            if (blob.size <= maxSizeInBytes) {
              resolve(blob);
              return;
            }

            quality -= 0.1;
          } while (quality > 0);

          resolve(currentBlob!);
        } catch (err) {
          reject(err);
        }
      };
    };
    reader.onerror = () => reject(new Error('Error al leer el archivo'));
    reader.readAsDataURL(file);
  });
};

export interface CompressPhotoOptions {
  maxWidth?: number;
  maxHeight?: number;
  quality?: number;
  maxSizeInBytes?: number;
  mimeType?: string;
}

export interface CompressedPhotoResult {
  file: File;
  dataUrl: string;
  blob: Blob;
  originalSize: number;
  compressedSize: number;
}

/**
 * Compresses an image file before uploading or storing to avoid saturating memory and cloud storage.
 * Downscales dimensions if they exceed maxWidth/maxHeight and compresses quality to stay under maxSizeInBytes.
 *
 * @param {File} file - Original raw image file.
 * @param {CompressPhotoOptions} [options] - Compression configuration options.
 * @returns {Promise<CompressedPhotoResult>} Compressed file, dataURL, and compression statistics.
 */
export const compressPhoto = async (
  file: File,
  options: CompressPhotoOptions = {},
): Promise<CompressedPhotoResult> => {
  const {
    maxWidth = 1280,
    maxHeight = 1280,
    quality = 0.75,
    maxSizeInBytes = 350 * 1024,
    mimeType = 'image/jpeg',
  } = options;

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error('Error al leer el archivo de imagen'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error('Error al cargar los datos de imagen'));
      img.onload = async () => {
        let width = img.width;
        let height = img.height;

        if (width > maxWidth || height > maxHeight) {
          if (width / height > maxWidth / maxHeight) {
            height = Math.round((height * maxWidth) / width);
            width = maxWidth;
          } else {
            width = Math.round((width * maxHeight) / height);
            height = maxHeight;
          }
        }

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('No se pudo inicializar el contexto 2D para compresión'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);

        let currentQuality = quality;
        let currentBlob: Blob | null = null;

        try {
          do {
            const blob = await new Promise<Blob | null>((resolveBlob) => {
              canvas.toBlob(resolveBlob, mimeType, currentQuality);
            });

            if (!blob) {
              reject(new Error('Error al generar blob comprimido'));
              return;
            }

            currentBlob = blob;
            if (blob.size <= maxSizeInBytes || currentQuality <= 0.3) {
              break;
            }
            currentQuality -= 0.1;
          } while (currentQuality > 0.2);

          const finalBlob = currentBlob!;
          const finalDataUrl = await new Promise<string>((resolveUrl, rejectUrl) => {
            const r = new FileReader();
            r.onload = () => resolveUrl(r.result as string);
            r.onerror = () => rejectUrl(new Error('Error al generar dataUrl comprimido'));
            r.readAsDataURL(finalBlob);
          });

          const newFileName = file.name.replace(/\.[^/.]+$/, '') + '.jpg';
          const compressedFile = new File([finalBlob], newFileName, {
            type: mimeType,
            lastModified: Date.now(),
          });

          resolve({
            file: compressedFile,
            dataUrl: finalDataUrl,
            blob: finalBlob,
            originalSize: file.size,
            compressedSize: finalBlob.size,
          });
        } catch (err) {
          reject(err);
        }
      };
      img.src = reader.result as string;
    };
    reader.readAsDataURL(file);
  });
};
