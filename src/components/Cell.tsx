import { ColorType } from '@/libs/common-types/constants/theme';
import React from 'react';

type AlertProps = {
  title: string;
  disable?: boolean;
  bgColorClass?: string;
  bgHoverColorClass?: string;
  label?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: () => void;
};

const Cell: React.FC<AlertProps> = ({
  bgColorClass,
  bgHoverColorClass,
  disable = false,
  title,
  label,
  icon,
  iconRight,
  onClick,
}) => {
  const cellTheme = bgColorClass ?? 'bg-white';
  const cellHoverTheme = bgHoverColorClass ?? 'hover:bg-neutral-100';

  const classList = disable
    ? `list-row ${cellTheme} rounded-none opacity-50 cursor-not-allowed select-none`
    : `list-row ${cellTheme} rounded-none cursor-pointer ${cellHoverTheme}`;

  return (
    <li className={classList} onClick={disable ? undefined : onClick}>
      <div>{icon}</div>
      <div>
        <div>{title}</div>
        {label && <div className="text-xs opacity-60">{label}</div>}
      </div>
      <button
        className="btn btn-square btn-ghost"
        onClick={disable ? undefined : onClick}
      >
        {iconRight}
      </button>
    </li>
  );
};

export default Cell;
