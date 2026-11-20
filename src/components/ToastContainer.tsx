import { AlertTriangle, CheckCircle2, X, XCircle } from 'lucide-react';
import type { ToastItem } from '../types/fleet';

interface ToastContainerProps {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}

export function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div
      className="fixed bottom-4 right-4 z-[60] flex flex-col gap-2 max-w-sm w-full pointer-events-none px-4 sm:px-0 no-print"
      aria-live="polite"
    >
      {toasts.map((toast) => {
        const styleMap = {
          success: 'bg-forest text-white border-emerald-400/40',
          warning: 'bg-amber-800 text-white border-amber-400/40',
          error: 'bg-red-800 text-white border-red-400/40',
        };
        const Icon =
          toast.type === 'error'
            ? XCircle
            : toast.type === 'warning'
              ? AlertTriangle
              : CheckCircle2;

        return (
          <div
            key={toast.id}
            className={`pointer-events-auto flex items-center justify-between gap-2.5 px-4 py-3 rounded-xl border shadow-xl font-mono text-xs font-medium ${styleMap[toast.type]}`}
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <Icon className="w-4 h-4 shrink-0 opacity-90" />
              <span className="leading-snug">{toast.message}</span>
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              className="p-1 rounded-md hover:bg-white/15 shrink-0 cursor-pointer transition-colors"
              aria-label="Tutup notifikasi"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
