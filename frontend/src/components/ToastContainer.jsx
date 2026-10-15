import React from 'react';
import { CheckCircle2, AlertOctagon, Info, X } from 'lucide-react';

export const ToastContainer = ({ toasts = [], onDismiss }) => {
  if (!toasts || toasts.length === 0) return null;

  return (
    <div className="toast-container" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const icon =
          toast.type === 'success' ? (
            <CheckCircle2 size={18} className="toast-icon" />
          ) : toast.type === 'error' ? (
            <AlertOctagon size={18} className="toast-icon" />
          ) : (
            <Info size={18} className="toast-icon" />
          );

        return (
          <div
            key={toast.id}
            className={`toast ${toast.type || 'info'}`}
            role="alert"
          >
            {icon}
            <div className="toast-content">
              {toast.title && <div className="toast-title">{toast.title}</div>}
              <div className="toast-message">{toast.message}</div>
            </div>
            <button
              className="toast-close-btn"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
            >
              <X size={14} />
            </button>
          </div>
        );
      })}
    </div>
  );
};

export default ToastContainer;
