import React from 'react';

/**
 * Skeleton placeholder for KidCheckInView while kid details are loading.
 */
export const KidCheckInSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col gap-4 animate-pulse">
      {/* 1. Cabecera Principal del Niño (Avatar + Nombre + Tag) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-0">
        <div className="flex gap-4 items-center">
          <div className="w-20 h-20 rounded-full bg-gray-200 shrink-0 shadow-inner" />
          <div className="flex-1 min-w-0 flex flex-col gap-2">
            <div className="h-6 w-3/4 bg-gray-200 rounded-lg" />
            <div className="h-4 w-1/2 bg-gray-200 rounded" />
            <div className="flex items-center gap-2 mt-1">
              <div className="h-6 w-24 bg-gray-200 rounded-full" />
              <div className="h-6 w-16 bg-gray-200 rounded-full" />
            </div>
          </div>
        </div>
      </div>

      {/* 2. Tarjeta con Información Detallada del Niño (Datos del Niño) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-0">
        <div className="h-4 w-28 bg-gray-200 rounded mb-4 pb-2 border-b border-gray-100" />
        <div className="flex flex-col gap-y-3">
          <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
            <div className="h-4 w-14 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
            <div className="h-4 w-32 bg-gray-200 rounded" />
            <div className="h-4 w-28 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
            <div className="h-4 w-16 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
            <div className="h-4 w-12 bg-gray-200 rounded" />
            <div className="h-4 w-20 bg-gray-200 rounded" />
          </div>
          <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
            <div className="h-4 w-28 bg-gray-200 rounded" />
            <div className="h-4 w-24 bg-gray-200 rounded" />
          </div>
        </div>
      </div>

      {/* 3. Formulario de Check-in (¿Quién lo entrega? + Observaciones) */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 mb-2">
        <div className="mb-5">
          <div className="h-3.5 w-32 bg-gray-200 rounded mb-3" />
          <div className="flex flex-col gap-2.5">
            <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-3.5 w-44 bg-gray-200 rounded" />
                <div className="h-3 w-28 bg-gray-200 rounded" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
            </div>
            <div className="flex items-center gap-2.5 p-2.5 bg-gray-50 rounded-xl border border-gray-100">
              <div className="w-4 h-4 rounded-full bg-gray-200 shrink-0" />
              <div className="flex-1 flex flex-col gap-1">
                <div className="h-3.5 w-36 bg-gray-200 rounded" />
                <div className="h-3 w-24 bg-gray-200 rounded" />
              </div>
              <div className="w-6 h-6 rounded-full bg-gray-200 shrink-0" />
            </div>
          </div>
        </div>

        <div>
          <div className="h-3.5 w-48 bg-gray-200 rounded mb-2" />
          <div className="h-11 w-full bg-gray-100 rounded-xl border border-gray-200" />
        </div>
      </div>

      {/* 4. Botón de Acción Principal */}
      <div className="h-12 w-full bg-gray-200 rounded-xl" />
    </div>
  );
};

/**
 * Skeleton placeholder for UpdateKidView while kid data is loading into form.
 */
export const UpdateKidSkeleton: React.FC = () => {
  return (
    <div className="p-4 flex flex-col gap-4 max-w-lg mx-auto animate-pulse">
      {/* Profile Photo Skeleton */}
      <div className="flex flex-col items-center justify-center my-3">
        <div className="w-32 h-32 rounded-full bg-gray-200 border-4 border-white shadow-lg" />
      </div>

      {/* Form Fields Skeletons */}
      <div className="bg-white p-5 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4">
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-11 w-full bg-gray-100 rounded-xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-20 bg-gray-200 rounded" />
          <div className="h-11 w-full bg-gray-100 rounded-xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-36 bg-gray-200 rounded" />
          <div className="h-11 w-full bg-gray-100 rounded-xl" />
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="h-3 w-16 bg-gray-200 rounded" />
          <div className="h-11 w-full bg-gray-100 rounded-xl" />
        </div>
      </div>

      <div className="h-12 w-full bg-gray-200 rounded-xl" />
    </div>
  );
};
