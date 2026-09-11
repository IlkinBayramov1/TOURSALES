import React from 'react';
import { CheckCircle2, AlertCircle, Info, XCircle, X } from 'lucide-react';
import './Toast.css';

export interface ToastProps {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title?: string;
  message: string;
  onDismiss: (id: string) => void;
}

export const Toast: React.FC<ToastProps> = ({
  id,
  type,
  title,
  message,
  onDismiss,
}) => {
  const renderIcon = () => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="ui-toast-icon ui-toast-success" size={20} />;
      case 'error':
        return <XCircle className="ui-toast-icon ui-toast-error" size={20} />;
      case 'warning':
        return <AlertCircle className="ui-toast-icon ui-toast-warning" size={20} />;
      case 'info':
      default:
        return <Info className="ui-toast-icon ui-toast-info" size={20} />;
    }
  };

  return (
    <div className={`ui-toast ui-toast-${type}`}>
      {renderIcon()}
      <div className="ui-toast-content">
        {title && <h4 className="ui-toast-title">{title}</h4>}
        <p className="ui-toast-message">{message}</p>
      </div>
      <button
        onClick={() => onDismiss(id)}
        className="ui-toast-close"
        aria-label="Close notification"
      >
        <X size={16} />
      </button>
    </div>
  );
};
