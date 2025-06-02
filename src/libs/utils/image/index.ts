const pica = require('pica')();

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

export const resizeAndCropImageToSquare = async (
  file: File,
  targetSizeInPixels = 800, // Tamaño final (ancho y alto)
  maxSizeInBytes: number = 500 * 1024, // Tamaño máximo en bytes
): Promise<Blob> => {
  const img = document.createElement('img');
  const canvas = document.createElement('canvas');
  const tempCanvas = document.createElement('canvas');

  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      img.src = e.target?.result as string;
      img.onload = async () => {
        // Define el tamaño del cuadrado basado en el lado más corto
        const size = Math.min(img.width, img.height);
        tempCanvas.width = size;
        tempCanvas.height = size;

        const tempCtx = tempCanvas.getContext('2d');
        if (!tempCtx) {
          reject(new Error('Error al obtener el contexto del lienzo'));
          return;
        }

        // Recorta el cuadrado centrado
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
              resizedCanvas.toBlob(
                resolveBlob,
                file.type || 'image/jpeg',
                quality,
              ),
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
