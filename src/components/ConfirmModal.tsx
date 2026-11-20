import { useEffect } from 'react';
import { AlertTriangle, CheckCircle2 } from 'lucide-react';
import type { ConfirmDialogState } from '../types/fleet';

interface ConfirmModalProps {
  dialog: ConfirmDialogState | null;
  onClose: () => void;
}

export function ConfirmModal({ dialog, onClose }: ConfirmModalProps) {
  useEffect(() => {
    if (!dialog?.open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [dialog?.open, onClose]);

  if (!dialog?.open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-warm-border shadow-2xl max-w-md w-full p-6 space-y-4">
        <div className="flex items-start gap-3.5">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
              dialog.isDanger
                ? 'bg-red-100 text-red-700'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {dialog.isDanger ? (
              <AlertTriangle className="w-5 h-5" />
            ) : (
              <CheckCircle2 className="w-5 h-5" />
            )}
          </div>
          <div>
            <h3 id="confirm-modal-title" className="font-bold text-base text-warm-text">
              {dialog.title}
            </h3>
            <p className="text-sm text-warm-muted mt-1 leading-relaxed">{dialog.message}</p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl text-xs font-semibold text-warm-muted hover:bg-warm-panel border border-warm-border transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => {
              const fn = dialog.onConfirm;
              onClose();
              fn();
            }}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold text-white shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
              dialog.isDanger
                ? 'bg-red-600 hover:bg-red-700'
                : 'bg-forest hover:bg-forest-light'
            }`}
          >
            {dialog.confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
