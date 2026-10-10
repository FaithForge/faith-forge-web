import React, { useState, useRef } from 'react';
import { Camera, Image as ImageIcon, Plus, Loader2, X } from 'lucide-react';
import { toast } from 'sonner';
import clsx from 'clsx';
import { compressPhoto, CompressPhotoOptions } from '@/libs/utils/image';

export interface PhotoUploadZoneProps {
  /** Array of image URLs or base64 data URLs */
  value: string[];
  /** Handler invoked when images are added or removed */
  onChange: (photos: string[]) => void;
  /** Maximum number of photos allowed (default: 3) */
  maxPhotos?: number;
  /** Whether multiple photo uploads are supported (default: true) */
  multiple?: boolean;
  /** Main section title */
  title?: string;
  /** Explanatory subtitle below the title */
  subtitle?: string;
  /** Optional custom compression options */
  compressOptions?: CompressPhotoOptions;
  /** Whether at least one photo is required */
  required?: boolean;
  /** Optional validation error message */
  error?: string;
  /** Container custom classes */
  className?: string;
  /** Disable interaction */
  disabled?: boolean;
}

/**
 * Reusable photo upload zone matching the exact visual structure:
 * - Header with title, optional badge, and counter pill (e.g. "● 1 de 3 fotos").
 * - Previews row with uploaded photos (top-right X button, bottom-left "Foto N" badge)
 *   and a single dashed "+ Añadir foto" card with remaining counter.
 * - Bottom action buttons: "Tomar Foto" (primary) and "Galería / Archivos" (secondary).
 *
 * @param {PhotoUploadZoneProps} props - Component configuration and image handlers.
 * @returns {JSX.Element} Rendered photo upload zone.
 */
export const PhotoUploadZone: React.FC<PhotoUploadZoneProps> = ({
  value = [],
  onChange,
  maxPhotos = 3,
  multiple = true,
  title = 'Fotos de soporte',
  subtitle,
  compressOptions,
  required = false,
  error,
  className,
  disabled = false,
}) => {
  const [isCompressing, setIsCompressing] = useState(false);
  const [compressProgress, setCompressProgress] = useState(0);
  const [previewPhoto, setPreviewPhoto] = useState<string | null>(null);

  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);

  const effectiveMaxPhotos = multiple ? maxPhotos : 1;
  const remainingSlots = Math.max(0, effectiveMaxPhotos - value.length);
  const isFull = remainingSlots === 0;

  /**
   * Processes selected files, downscaling and compressing each client-side
   * before updating the photos array.
   *
   * @param {FileList | null} files - Selected file list from camera or gallery input.
   */
  const processFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || isFull || disabled) return;

    const filesToProcess = Array.from(files)
      .filter((file) => file.type.startsWith('image/'))
      .slice(0, remainingSlots);

    if (filesToProcess.length === 0) return;

    setIsCompressing(true);
    setCompressProgress(15);

    try {
      const compressedResults: string[] = [];
      const total = filesToProcess.length;

      for (let i = 0; i < total; i++) {
        const file = filesToProcess[i];
        setCompressProgress(Math.round(((i + 0.3) / total) * 100));

        const compressed = await compressPhoto(file, compressOptions);
        compressedResults.push(compressed.dataUrl);

        setCompressProgress(Math.round(((i + 1) / total) * 100));
      }

      if (multiple) {
        onChange([...value, ...compressedResults]);
      } else {
        onChange(compressedResults.slice(0, 1));
      }
    } catch {
      toast.error('Ocurrió un error al procesar y comprimir la imagen.');
    } finally {
      setIsCompressing(false);
      setCompressProgress(0);
      if (cameraInputRef.current) cameraInputRef.current.value = '';
      if (galleryInputRef.current) galleryInputRef.current.value = '';
    }
  };

  /**
   * Removes a photo from the current collection by its index.
   *
   * @param {number} indexToRemove - Index of the photo to remove.
   */
  const handleRemovePhoto = (indexToRemove: number) => {
    if (disabled) return;
    const updated = value.filter((_, idx) => idx !== indexToRemove);
    onChange(updated);
  };

  /**
   * Triggers the mobile native camera input capture.
   */
  const handleTriggerCamera = () => {
    if (isFull) {
      toast.info(`Ya alcanzaste el límite de ${effectiveMaxPhotos} foto(s).`);
      return;
    }
    cameraInputRef.current?.click();
  };

  /**
   * Triggers the gallery / file manager input.
   */
  const handleTriggerGallery = () => {
    if (isFull) {
      toast.info(`Ya alcanzaste el límite de ${effectiveMaxPhotos} foto(s).`);
      return;
    }
    galleryInputRef.current?.click();
  };

  return (
    <div className={clsx('space-y-3.5', className)}>
      {/* Hidden file inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
        disabled={disabled}
      />
      <input
        ref={galleryInputRef}
        type="file"
        accept="image/*"
        multiple={multiple && remainingSlots > 1}
        className="hidden"
        onChange={(e) => processFiles(e.target.files)}
        disabled={disabled}
      />

      {/* Header section: Title + Opcional pill | ● X de Y fotos badge */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <h4 className="text-sm font-bold text-gray-900 tracking-tight">
            {title}
          </h4>
          {required ? (
            <span className="text-rose-500 font-black text-xs">*</span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-500 border border-gray-200/60">
              Opcional
            </span>
          )}
        </div>

        {/* Counter pill with role-primary bullet */}
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 shrink-0">
          <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
          <span>
            {value.length} de {effectiveMaxPhotos} {effectiveMaxPhotos === 1 ? 'foto' : 'fotos'}
          </span>
        </span>
      </div>

      {subtitle && <p className="text-xs text-gray-500 -mt-1">{subtitle}</p>}

      {/* Previews and Add Photo row */}
      <div className="flex items-center gap-3 overflow-x-auto no-scrollbar py-0.5">
        {/* Uploaded photos list */}
        {value.map((photoUrl, idx) => (
          <div
            key={`photo-${idx}`}
            className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-2xl overflow-hidden border border-gray-200 shadow-2xs group shrink-0 aspect-square bg-gray-50"
          >
            <img
              src={photoUrl}
              alt={`Foto ${idx + 1}`}
              className="w-full h-full object-cover cursor-pointer transition-transform duration-300 group-hover:scale-105"
              onClick={() => setPreviewPhoto(photoUrl)}
            />

            {/* Top right close / delete button */}
            {!disabled && (
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemovePhoto(idx);
                }}
                className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/60 hover:bg-black/80 text-white flex items-center justify-center transition-colors cursor-pointer shadow-xs active:scale-90"
                aria-label={`Eliminar foto ${idx + 1}`}
              >
                <X size={14} strokeWidth={2.5} />
              </button>
            )}

            {/* Bottom left badge: Foto 1, Foto 2 */}
            <div className="absolute bottom-1.5 left-1.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md pointer-events-none">
              Foto {idx + 1}
            </div>
          </div>
        ))}

        {/* Compressing placeholder */}
        {isCompressing && (
          <div className="h-24 sm:h-28 px-5 rounded-2xl border-2 border-dashed border-primary/40 bg-primary/5 flex items-center gap-3 shrink-0 animate-pulse">
            <Loader2 size={24} className="animate-spin text-primary" />
            <div className="text-left">
              <span className="text-xs font-bold text-primary block">Procesando...</span>
              <span className="text-[11px] text-gray-500 font-medium">
                {compressProgress > 0 ? `${compressProgress}%` : 'Comprimiendo'}
              </span>
            </div>
          </div>
        )}

        {/* Single dashed "+ Añadir foto" card (when not full and not compressing) */}
        {!isFull && !isCompressing && (
          <button
            type="button"
            disabled={disabled}
            onClick={handleTriggerGallery}
            className={clsx(
              'h-24 sm:h-28 px-4 rounded-2xl border-2 border-dashed bg-white flex items-center gap-3.5 transition-all cursor-pointer shrink-0 text-left group',
              disabled
                ? 'border-gray-200 bg-gray-50 opacity-60 cursor-not-allowed'
                : 'border-gray-300 hover:border-primary hover:bg-primary/[0.03] active:scale-[0.99]',
            )}
          >
            {/* Primary circular icon with Camera/Plus */}
            <div className="w-11 h-11 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 shadow-xs group-hover:scale-105 transition-transform">
              <div className="relative">
                <Camera size={20} />
                <Plus size={11} strokeWidth={3} className="absolute -top-1 -right-1 bg-primary text-primary-foreground rounded-full" />
              </div>
            </div>

            {/* Text details */}
            <div className="space-y-0.5">
              <span className="text-sm font-bold text-primary transition-colors block">
                + Añadir foto
              </span>
              <span className="text-xs text-gray-500 font-medium block">
                Hasta {remainingSlots} {remainingSlots === 1 ? 'foto más' : 'fotos más'}
              </span>
            </div>
          </button>
        )}
      </div>

      {/* Error feedback if provided */}
      {error && <p className="text-xs text-rose-600 font-semibold pl-0.5">{error}</p>}

      {/* Bottom dual action buttons */}
      <div className="grid grid-cols-2 gap-3 pt-1">
        {/* Tomar Foto button (primary solid) */}
        <button
          type="button"
          onClick={handleTriggerCamera}
          disabled={disabled || isFull}
          className={clsx(
            'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm shadow-2xs transition-all select-none cursor-pointer group active:scale-[0.98]',
            isFull || disabled
              ? 'bg-gray-200 text-gray-400 opacity-60 cursor-not-allowed'
              : 'bg-primary hover:bg-primary/90 text-primary-foreground',
          )}
        >
          <Camera size={19} className="shrink-0 transition-transform group-hover:scale-105" />
          <span>Tomar Foto</span>
        </button>

        {/* Galería / Archivos button (secondary soft primary) */}
        <button
          type="button"
          onClick={handleTriggerGallery}
          disabled={disabled || isFull}
          className={clsx(
            'flex items-center justify-center gap-2 py-3 px-4 rounded-xl font-bold text-sm transition-all select-none cursor-pointer group active:scale-[0.98]',
            isFull || disabled
              ? 'bg-gray-100 text-gray-400 opacity-60 cursor-not-allowed'
              : 'bg-primary/10 hover:bg-primary/15 text-primary border border-primary/20',
          )}
        >
          <ImageIcon size={19} className="text-primary shrink-0 transition-transform group-hover:scale-105" />
          <span>Galería / Archivos</span>
        </button>
      </div>

      {/* Lightbox Preview Modal */}
      {previewPhoto && (
        <div
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200"
          onClick={() => setPreviewPhoto(null)}
        >
          <div className="relative max-w-lg w-full max-h-[85vh] flex items-center justify-center">
            <button
              type="button"
              onClick={() => setPreviewPhoto(null)}
              className="absolute -top-10 right-0 w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center cursor-pointer transition-colors"
            >
              <X size={18} />
            </button>
            <img
              src={previewPhoto}
              alt="Vista previa"
              className="max-w-full max-h-[80vh] rounded-2xl object-contain shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        </div>
      )}
    </div>
  );
};
