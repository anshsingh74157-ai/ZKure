import React from 'react';

export interface CardProps {
  children: React.ReactNode;
  className?: string;
  onClick?: () => void;
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  className = '',
  onClick,
  hoverable = false
}) => {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200/80 rounded-xl shadow-[0_1px_3px_0_rgba(15,23,42,0.03),0_1px_2px_-1px_rgba(15,23,42,0.02)] ${
        hoverable || onClick
          ? 'cursor-pointer hover:border-slate-300 hover:shadow-[0_4px_12px_0_rgba(15,23,42,0.05)] transition-all duration-150'
          : ''
      } ${className}`}
    >
      {children}
    </div>
  );
};
