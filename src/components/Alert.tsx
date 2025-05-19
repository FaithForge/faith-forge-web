import { ColorType } from '@/libs/common-types/constants/theme';
import React from 'react';

type AlertProps = {
  type: ColorType;
  title: string;
  subtitle?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  onClick?: () => void;
};

const Alert: React.FC<AlertProps> = ({
  type,
  title,
  subtitle,
  icon,
  iconRight,
  onClick,
}) => {
  const confirmAlertTheme = `alert-${type}`;

  return (
    <div
      onClick={onClick}
      role="alert"
      className={`alert ${confirmAlertTheme} m-2`}
    >
      {icon}
      {subtitle ? (
        <div>
          <h3 className="font-bold">{title}</h3>
          <div className="text-xs">{subtitle}</div>
        </div>
      ) : (
        <span>{title}</span>
      )}
      {iconRight}
    </div>
  );
};

export default Alert;
