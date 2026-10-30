import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  hoverable = false,
  ...props
}) => {
  return (
    <div
      className={`bg-slate-900/70 border border-slate-800/80 rounded-2xl p-5 shadow-sm backdrop-blur-sm transition-all duration-200 ${
        hoverable ? 'hover:border-slate-700 hover:shadow-md hover:bg-slate-900/90' : ''
      } ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
