import React from 'react';
import './AlertModal.css';

export type AlertType = 'info' | 'success' | 'warning' | 'error' | 'confirm';

interface AlertModalProps {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel?: () => void;
}

const AlertModal: React.FC<AlertModalProps> = ({
  isOpen,
  type,
  title,
  message,
  confirmText = 'OK',
  cancelText = 'Annuler',
  onConfirm,
  onCancel
}) => {
  if (!isOpen) return null;

  const getIcon = () => {
    switch (type) {
      case 'success':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <path d="M9 12l2 2 4-4"/>
          </svg>
        );
      case 'error':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="15" y1="9" x2="9" y2="15"/>
            <line x1="9" y1="9" x2="15" y2="15"/>
          </svg>
        );
      case 'warning':
      case 'confirm':
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/>
            <line x1="12" y1="9" x2="12" y2="13"/>
            <line x1="12" y1="17" x2="12.01" y2="17"/>
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="16" x2="12" y2="12"/>
            <line x1="12" y1="8" x2="12.01" y2="8"/>
          </svg>
        );
    }
  };

  return (
    <div className="alert-modal-overlay">
      <div className={`alert-modal-container alert-modal-${type}`}>
        <div className={`alert-modal-icon alert-icon-${type}`}>
          {getIcon()}
        </div>
        <h3 className="alert-modal-title">{title}</h3>
        <p className="alert-modal-message">{message}</p>
        <div className="alert-modal-actions">
          {type === 'confirm' && onCancel && (
            <button className="alert-btn alert-btn-cancel" onClick={onCancel}>
              {cancelText}
            </button>
          )}
          <button className={`alert-btn alert-btn-${type}`} onClick={onConfirm}>
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AlertModal;
