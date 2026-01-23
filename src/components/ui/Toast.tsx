import React, { useEffect } from 'react';
import { CheckCircle, XCircle, X } from 'lucide-react';
import { cn } from '../../lib/utils';

export type ToastType = 'success' | 'error';

interface ToastProps {
  message: string;
  type: ToastType;
  onClose: () => void;
  duration?: number;
}

export const Toast = ({ message, type, onClose, duration = 4000 }: ToastProps) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);

    return () => clearTimeout(timer);
  }, [duration, onClose]);

  return (
    <div
      className={cn(
        "fixed top-4 right-4 z-50 flex items-start gap-3 p-4 rounded-xl shadow-[0_20px_50px_rgba(15,23,42,0.15)] border backdrop-blur-xl animate-slide-in-right max-w-md",
        type === 'success'
          ? "bg-emerald-50/95 border-emerald-200/60 text-emerald-900"
          : "bg-rose-50/95 border-rose-200/60 text-rose-900"
      )}
    >
      {type === 'success' ? (
        <CheckCircle className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
      ) : (
        <XCircle className="w-5 h-5 text-rose-600 flex-shrink-0 mt-0.5" />
      )}
      <p className="text-sm font-medium flex-1">{message}</p>
      <button
        onClick={onClose}
        className={cn(
          "p-1 rounded-lg transition-colors flex-shrink-0",
          type === 'success'
            ? "hover:bg-emerald-100/80 text-emerald-600"
            : "hover:bg-rose-100/80 text-rose-600"
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
};

// Hook for managing toasts
export const useToast = () => {
  const [toast, setToast] = React.useState<{ message: string; type: ToastType } | null>(null);

  const showToast = React.useCallback((message: string, type: ToastType) => {
    setToast({ message, type });
  }, []);

  const hideToast = React.useCallback(() => {
    setToast(null);
  }, []);

  const ToastComponent = toast ? (
    <Toast message={toast.message} type={toast.type} onClose={hideToast} />
  ) : null;

  return { showToast, ToastComponent };
};

