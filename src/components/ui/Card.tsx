'use client';

import { type ReactNode } from 'react';

interface CardProps {
  ribbonTitle?: string;
  ribbonVariant?: 'primary' | 'secondary' | 'tertiary';
  children: ReactNode;
  className?: string;
}

const ribbonClasses = {
  primary: 'quest-ribbon-main',
  secondary: 'quest-ribbon-daily',
  tertiary: 'quest-ribbon-side',
};

export function Card({ ribbonTitle, ribbonVariant = 'primary', children, className = '' }: CardProps) {
  return (
    <div className={`border-2 border-outline-variant bg-surface-container shadow-md ${className}`}>
      {ribbonTitle && (
        <div className={`px-4 py-2 font-display text-xs uppercase tracking-wider ${ribbonClasses[ribbonVariant]}`}>
          {ribbonTitle}
        </div>
      )}
      <div className="p-4">
        {children}
      </div>
    </div>
  );
}
