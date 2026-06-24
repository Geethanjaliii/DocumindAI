import React from 'react';

interface SkeletonProps {
  variant?: 'text' | 'circular' | 'rectangular';
  width?: string | number;
  height?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  variant = 'rectangular',
  width,
  height,
  className = '',
  style: customStyle = {},
}) => {
  const style: React.CSSProperties = {
    width: width,
    height: height,
    ...customStyle
  };

  const skeletonClass = `skeleton-pulse ${className}`;
  
  const borderStyle = 
    variant === 'circular' 
      ? { borderRadius: '50%' } 
      : variant === 'text' 
      ? { borderRadius: '4px', height: height || '12px' } 
      : {};

  return (
    <div 
      className={skeletonClass} 
      style={{ ...style, ...borderStyle }} 
    />
  );
};

export const TableSkeleton: React.FC<{ rows?: number; cols?: number }> = ({ 
  rows = 5, 
  cols = 4 
}) => {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', width: '100%' }}>
      {Array.from({ length: rows }).map((_, rIdx) => (
        <div key={rIdx} style={{ display: 'flex', gap: '16px', width: '100%', padding: '12px 0' }}>
          {Array.from({ length: cols }).map((_, cIdx) => (
            <Skeleton 
              key={cIdx} 
              variant="rectangular" 
              width={cIdx === 0 ? '40%' : '15%'} 
              height="18px" 
            />
          ))}
        </div>
      ))}
    </div>
  );
};
