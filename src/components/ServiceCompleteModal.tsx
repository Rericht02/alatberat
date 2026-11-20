import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import { PM_PACKAGES } from '../data/presets';
import type { HeavyUnit } from '../types/fleet';
import { formatHM, safeNum } from '../utils/calculations';

export interface ServiceCompletePayload {
  execHM: number;
  pkg: string;
  note: string;
}

interface ServiceCompleteModalProps {
  unit: HeavyUnit | null;
  onClose: () => void;
  onSubmit: (unitId: string, payload: ServiceCompletePayload) => void;
}

export function ServiceCompleteModal({ unit, onClose, onSubmit }: ServiceCompleteModalProps) {
  const [execHM, setExecHM] = useState('0');
  const [pkg, setPkg] = useState('PM-250');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!unit) return;
    setExecHM(String(unit.hmAkhir));
    const matchesKnown = PM_PACKAGES.some((item) => item.value === unit.jenisPM);
    setPkg(matchesKnown ? unit.jenisPM : 'PM-250');
    setNote('');
  }, [unit]);

  useEffect(() => {
    if (!unit) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [unit, onClose]);

  if (!unit) return null;

  const numericExecHM = Math.max(0, safeNum(execHM, unit.hmAkhir));
  const nextDueHM = numericExecHM + unit.interval;

  const handleSubmit = () => {
    onSubmit(unit.id, {
      execHM: numericExecHM,
      pkg,
      note: note.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pm-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-warm-border shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-forest px-5 py-3.5 text-white flex items-center justify-between">
          <div>
            <h3 id="pm-modal-title" className="font-mono font-bold text-sm sm:text-base">
              Catat Servis Berkala Selesai
            </h3>
            <p className="text-xs text-emerald-200 mt-0.5">
              {unit.kodeUnit} — {unit.modelUnit}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-white/10 text-emerald-100 cursor-pointer transition-colors"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3 bg-warm-panel p-3 rounded-xl border border-warm-border font-mono text-xs tabular-nums">
            <div>
              <span className="text-warm-muted block text-[11px]">HM Saat Ini</span>
              <span className="font-bold text-sm text-warm-text">
                {formatHM(unit.hmAkhir)} HM
              </span>
            </div>
            <div>
              <span className="text-warm-muted block text-[11px]">HM Servis Sebelumnya</span>
              <span className="font-bold text-sm text-warm-muted">
                {formatHM(unit.hmServis)} HM
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="pmExecutionHM"
                className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
              >
                HM Pelaksanaan Servis *
              </label>
              <input
                type="number"
                id="pmExecutionHM"
                min="0"
                step="any"
                value={execHM}
                onChange={(e) => setExecHM(e.target.value)}
                className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <label
                htmlFor="pmPackageType"
                className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
              >
                Jenis Paket Servis
              </label>
              <select
                id="pmPackageType"
                value={pkg}
                onChange={(e) => setPkg(e.target.value)}
                className="w-full font-mono font-semibold text-xs bg-warm-input border border-warm-border rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-forest cursor-pointer"
              >
                {PM_PACKAGES.map((item) => (
                  <option key={item.value} value={item.value}>
                    {item.label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5 flex items-center justify-between font-mono text-xs tabular-nums">
            <span className="text-emerald-900">Jadwal Due Servis Berikutnya:</span>
            <span className="font-bold text-emerald-800 text-sm">HM {formatHM(nextDueHM)}</span>
          </div>

          <div>
            <label
              htmlFor="pmMechanicNote"
              className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
            >
              Catatan Mekanik &amp; Penggantian Part
            </label>
            <input
              type="text"
              id="pmMechanicNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Ganti oli mesin 15W-40, filter oli, filter solar & grease"
              className="w-full font-sans text-xs bg-warm-input border border-warm-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-forest"
            />
          </div>
        </div>

        <div className="px-5 py-3.5 bg-warm-panel border-t border-warm-border flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-warm-muted hover:bg-white border border-warm-border cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            className="px-4 py-2 rounded-xl text-xs font-bold text-white bg-forest hover:bg-forest-light shadow-sm cursor-pointer whitespace-nowrap shrink-0 transition-colors"
          >
            Simpan &amp; Reset Jadwal PM
          </button>
        </div>
      </div>
    </div>
  );
}
