// FloatingBubble.tsx
import { PRIMARY_COLOR_APP } from '@/libs/utils/theme';
import React from 'react';

type FloatingBubbleProps = {
  icon: React.ReactNode;
  bottom: number;
  right: number;
  onClick: () => void;
  size?: number;
  backgroundColor?: string;
};

const FloatingBubbleApp: React.FC<FloatingBubbleProps> = ({
  icon,
  bottom,
  right,
  onClick,
  size = 60,
  backgroundColor = PRIMARY_COLOR_APP,
}) => {
  return (
    <div
      onClick={onClick}
      style={{
        position: 'fixed',
        width: size,
        height: size,
        borderRadius: '50%',
        backgroundColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0px 4px 8px rgba(0, 0, 0, 0.2)',
        cursor: 'pointer',
        userSelect: 'none',
        bottom,
        right,
      }}
    >
      {icon}
    </div>
  );
};

export default FloatingBubbleApp;
