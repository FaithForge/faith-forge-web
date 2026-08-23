import React from 'react';
import clsx from 'clsx';

/**
 * Returns specific theme styling (background & text color) for each church kid group.
 */
export const getKidGroupStyle = (kidGroup?: string) => {
  let backgroundColor = '#004C6D';
  let color = '#FFFFFF';

  switch (kidGroup?.trim()) {
    case 'Bebes':
    case 'Bebés':
      backgroundColor = '#78B2DA';
      break;
    case 'Caminadores':
      backgroundColor = '#5E97BE';
      break;
    case 'Zaqueos':
      backgroundColor = '#427DA3';
      break;
    case 'Jeremias':
    case 'Jeremías':
      backgroundColor = '#236488';
      break;
    case 'Timoteos':
      backgroundColor = '#004C6D';
      break;
    case 'Titos':
      backgroundColor = '#00344D';
      break;
    case 'Yo Soy Iglekids':
      backgroundColor = '#EFCB68';
      color = '#1F2937'; // Dark text for high contrast on gold
      break;
    default:
      backgroundColor = '#004C6D';
      break;
  }

  return { backgroundColor, color };
};

interface TagKidGroupProps {
  kidGroup?: string;
  staticGroup?: boolean;
  className?: string;
}

export const TagKidGroup: React.FC<TagKidGroupProps> = ({ kidGroup, staticGroup, className }) => {
  const style = getKidGroupStyle(kidGroup);
  const text = kidGroup || 'Sin salón';

  return (
    <span
      style={style}
      className={clsx(
        "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold shadow-sm tracking-wide",
        className
      )}
    >
      {text} {staticGroup ? '(Estático)' : ''}
    </span>
  );
};

export default TagKidGroup;
