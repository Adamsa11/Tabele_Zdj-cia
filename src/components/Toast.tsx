import React from 'react';
import { ToastMessage } from '../types';
import { CheckCircle2, AlertTriangle, Info, X } from 'lucide-react';

interface ToastProps {
  toasts: ToastMessage[];
  onDismiss: (id: string) => void;
}

export const ToastContainer: React.FC<ToastProps> = ({ toasts, onDismiss }) => {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-md w-full pointer-events-none">
      {toasts.map(toast => {
        let icon = <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />;
        let borderClass = 'border-emerald-200 bg-white text-gray-900 shadow-lg';

        if (toast.type === 'error') {
          icon = <AlertTriangle className="w-5 h-5 text-[#CC0000] shrink-0" />;
          borderClass = 'border-rose-200 bg-white text-gray-900 shadow-lg';
        } else if (toast.type === 'info') {
          icon = <Info className="w-5 h-5 text-[#F36F21] shrink-0" />;
          borderClass = 'border-orange-200 bg-white text-gray-900 shadow-lg';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 rounded-xl border backdrop-blur-md transition-all duration-200 ${borderClass}`}
          >
            {icon}
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold tracking-tight leading-snug text-[#161616]">{toast.title}</p>
              {toast.message && (
                <p className="text-xs text-gray-600 mt-0.5 leading-relaxed break-words">{toast.message}</p>
              )}
            </div>
            <button
              onClick={() => onDismiss(toast.id)}
              className="text-gray-400 hover:text-gray-900 p-1 rounded-md transition-colors"
              aria-label="Zamknij"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
