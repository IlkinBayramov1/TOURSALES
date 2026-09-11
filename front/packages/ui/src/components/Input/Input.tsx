import React from 'react';
import './Input.css';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  helperText,
  leftIcon,
  rightIcon,
  className = '',
  id,
  ...props
}) => {
  const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

  return (
    <div className={`ui-input-group ${error ? 'ui-input-has-error' : ''} ${className}`}>
      {label && (
        <label htmlFor={inputId} className="ui-input-label">
          {label}
        </label>
      )}
      <div className="ui-input-wrapper">
        {leftIcon && <span className="ui-input-icon-left">{leftIcon}</span>}
        <input
          id={inputId}
          className={`ui-input ${leftIcon ? 'ui-input-with-left-icon' : ''} ${rightIcon ? 'ui-input-with-right-icon' : ''}`}
          {...props}
        />
        {rightIcon && <span className="ui-input-icon-right">{rightIcon}</span>}
      </div>
      {error ? (
        <span className="ui-input-error">{error}</span>
      ) : helperText ? (
        <span className="ui-input-helper">{helperText}</span>
      ) : null}
    </div>
  );
};
