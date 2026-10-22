import React, { useState } from 'react';
import clsx from 'clsx';

export interface AvatarProps {
  src?: string | null;
  name?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeClasses = {
  xs: 'w-6 h-6 text-[10px] rounded-lg',
  sm: 'w-8 h-8 text-xs rounded-xl',
  md: 'w-10 h-10 text-sm rounded-xl',
  lg: 'w-12 h-12 text-base rounded-2xl',
};

/**
 * Centralized Avatar primitive displaying a photo with graceful initials fallback.
 *
 * @param {AvatarProps} props - Avatar visual properties.
 * @returns {JSX.Element} Rendered avatar image or initials placeholder.
 */
export const Avatar: React.FC<AvatarProps> = ({
  src,
  name = '?',
  size = 'md',
  className,
}) => {
  const [imageError, setImageError] = useState(false);

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part.charAt(0).toUpperCase())
      .join('') || '?';

  if (src && !imageError) {
    return (
      <img
        src={src}
        alt={name}
        onError={() => setImageError(true)}
        className={clsx(
          sizeClasses[size],
          'object-cover shrink-0 border border-slate-200/80 bg-slate-100',
          className,
        )}
      />
    );
  }

  return (
    <div
      className={clsx(
        sizeClasses[size],
        'flex items-center justify-center font-bold shrink-0 bg-sky-100 text-sky-800 border border-sky-200/80 select-none',
        className,
      )}
    >
      {initials}
    </div>
  );
};

export default Avatar;
