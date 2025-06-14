import _ from 'lodash';
import React from 'react';

export enum SkeletonType {
  AVATAR = 'avatar',
  CELL = 'cell',
  TAG = 'tag',
  TEXT = 'text',
  SECTION = 'section',
}

type SkeletonProps = {
  type: SkeletonType;
  width?: string;
  height?: string;
  rows?: number;
};

const Skeleton: React.FC<SkeletonProps> = ({ type, width = 'full', height = '4', rows = 1 }) => {
  const widthClass = width.startsWith('w-') ? width : `w-${width}`;
  const heightClass = height.startsWith('h-') ? height : `h-${height}`;

  switch (type) {
    case SkeletonType.AVATAR:
      return <div className={`skeleton ${heightClass} ${widthClass}`} />;

    case SkeletonType.CELL:
      return (
        <div className="flex items-center gap-4 p-2">
          <div className="skeleton h-10 w-10 shrink-0 rounded-full" />
          <div className="flex flex-col gap-2 flex-1">
            <div className={`skeleton ${heightClass} ${widthClass}`} />
            <div className={`skeleton ${heightClass} w-32`} />
          </div>
        </div>
      );

    case SkeletonType.TAG:
      return <div className="skeleton h-4 w-16" />;

    case SkeletonType.TEXT:
      return (
        <>
          {_.times(rows, (index) => (
            <div key={index} className={`skeleton ${heightClass} ${widthClass} m-2`} />
          ))}
        </>
      );

    case SkeletonType.SECTION:
      return <div className={`skeleton ${heightClass} ${widthClass}`} />;

    default:
      return null;
  }
};

export default Skeleton;
