import React from 'react';
import './Badge.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'primary' | 'success' | 'warning' | 'error' | 'info' | 'gold' | 'neutral';
  size?: 'sm' | 'md';
  pill?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'primary',
  size = 'sm',
  pill = false,
  className = '',
  ...props
}) => {
  return (
    <span
      className={`ui-badge ui-badge-${variant} ui-badge-${size} ${pill ? 'ui-badge-pill' : ''} ${className}`}
      {...props}
    >
      {children}
    </span>
  );
};
