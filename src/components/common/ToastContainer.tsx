import React from 'react';
import { useApp } from '../../context/AppContext';
import { CheckCircle2, AlertTriangle, AlertCircle, Info, X } from 'lucide-react';

export const ToastContainer: React.FC = () => {
  const { toasts, removeToast } = useApp();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0">
      {toasts.map((toast) => {
        let Icon = CheckCircle2;
        let iconColor = 'text-[#34C759]';
        let borderColor = 'border-[#34C759]/30';

        if (toast.type === 'error') {
          Icon = AlertCircle;
          iconColor = 'text-[#FF3B30]';
          borderColor = 'border-[#FF3B30]/30';
        } else if (toast.type === 'warning') {
          Icon = AlertTriangle;
          iconColor = 'text-[#FF9500]';
          borderColor = 'border-[#FF9500]/30';
        } else if (toast.type === 'info') {
          Icon = Info;
          iconColor = 'text-[#0071E3]';
          borderColor = 'border-[#0071E3]/30';
        }

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-3.5 bg-white/95 backdrop-blur-md rounded-2xl shadow-lg border ${borderColor} transition-all`}
          >
            <Icon className={`w-5 h-5 shrink-0 ${iconColor} mt-0.5`} />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-[#1D1D1F]">{toast.title}</p>
              <p className="text-[11px] text-[#707070] mt-0.5 leading-relaxed">{toast.message}</p>
            </div>
            <button
              onClick={() => removeToast(toast.id)}
              className="text-[#86868B] hover:text-[#1D1D1F] p-0.5 rounded-md"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
};
