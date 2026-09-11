import React from 'react';
import './Button.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  leftIcon,
  rightIcon,
  disabled,
  className = '',
  ...props
}) => {
  return (
    <button
      className={`ui-btn ui-btn-${variant} ui-btn-${size} ${isLoading ? 'ui-btn-loading' : ''} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading ? (
        <span className="ui-btn-spinner" />
      ) : (
        <>
          {leftIcon && <span className="ui-btn-icon-left">{leftIcon}</span>}
          <span>{children}</span>
          {rightIcon && <span className="ui-btn-icon-right">{rightIcon}</span>}
        </>
      )}
    </button>
  );
};
