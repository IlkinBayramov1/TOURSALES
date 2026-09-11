import React from 'react';
import './Card.css';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'glass' | 'elevated' | 'outline' | 'gold';
  hoverable?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  variant = 'default',
  hoverable = false,
  className = '',
  ...props
}) => {
  return (
    <div
      className={`ui-card ui-card-${variant} ${hoverable ? 'ui-card-hoverable' : ''} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
};
