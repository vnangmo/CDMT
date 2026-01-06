import React, { createContext, useContext, useState, useCallback } from 'react';
import AlertModal, { AlertType } from '../components/common/AlertModal';

interface AlertOptions {
  title?: string;
  confirmText?: string;
  cancelText?: string;
}

interface AlertContextType {
  showAlert: (message: string, type?: AlertType, options?: AlertOptions) => Promise<boolean>;
  showSuccess: (message: string, title?: string) => Promise<boolean>;
  showError: (message: string, title?: string) => Promise<boolean>;
  showWarning: (message: string, title?: string) => Promise<boolean>;
  showInfo: (message: string, title?: string) => Promise<boolean>;
  showConfirm: (message: string, title?: string) => Promise<boolean>;
}

const AlertContext = createContext<AlertContextType | null>(null);

interface AlertState {
  isOpen: boolean;
  type: AlertType;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  resolve: ((value: boolean) => void) | null;
}

export const AlertProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [alertState, setAlertState] = useState<AlertState>({
    isOpen: false,
    type: 'info',
    title: '',
    message: '',
    confirmText: 'OK',
    cancelText: 'Annuler',
    resolve: null
  });

  const showAlert = useCallback((
    message: string,
    type: AlertType = 'info',
    options: AlertOptions = {}
  ): Promise<boolean> => {
    return new Promise((resolve) => {
      const defaultTitles: Record<AlertType, string> = {
        info: 'Information',
        success: 'Succes',
        warning: 'Attention',
        error: 'Erreur',
        confirm: 'Confirmation'
      };

      setAlertState({
        isOpen: true,
        type,
        title: options.title || defaultTitles[type],
        message,
        confirmText: options.confirmText || (type === 'confirm' ? 'Confirmer' : 'OK'),
        cancelText: options.cancelText || 'Annuler',
        resolve
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    alertState.resolve?.(true);
    setAlertState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [alertState.resolve]);

  const handleCancel = useCallback(() => {
    alertState.resolve?.(false);
    setAlertState(prev => ({ ...prev, isOpen: false, resolve: null }));
  }, [alertState.resolve]);

  const showSuccess = useCallback((message: string, title?: string) =>
    showAlert(message, 'success', { title }), [showAlert]);

  const showError = useCallback((message: string, title?: string) =>
    showAlert(message, 'error', { title }), [showAlert]);

  const showWarning = useCallback((message: string, title?: string) =>
    showAlert(message, 'warning', { title }), [showAlert]);

  const showInfo = useCallback((message: string, title?: string) =>
    showAlert(message, 'info', { title }), [showAlert]);

  const showConfirm = useCallback((message: string, title?: string) =>
    showAlert(message, 'confirm', { title: title || 'Confirmation' }), [showAlert]);

  return (
    <AlertContext.Provider value={{
      showAlert,
      showSuccess,
      showError,
      showWarning,
      showInfo,
      showConfirm
    }}>
      {children}
      <AlertModal
        isOpen={alertState.isOpen}
        type={alertState.type}
        title={alertState.title}
        message={alertState.message}
        confirmText={alertState.confirmText}
        cancelText={alertState.cancelText}
        onConfirm={handleConfirm}
        onCancel={alertState.type === 'confirm' ? handleCancel : undefined}
      />
    </AlertContext.Provider>
  );
};

export const useAlert = (): AlertContextType => {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within an AlertProvider');
  }
  return context;
};

export default AlertContext;
