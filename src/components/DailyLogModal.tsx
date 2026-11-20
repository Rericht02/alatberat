import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { HeavyUnit } from '../types/fleet';
import { formatHM, safeNum } from '../utils/calculations';

export interface DailyLogPayload {
  date: string;
  addW: number;
  addS: number;
  addR: number;
  addSolar: number;
  newHMAkhir: number;
  note: string;
}

interface DailyLogModalProps {
  unit: HeavyUnit | null;
  onClose: () => void;
  onSubmit: (unitId: string, payload: DailyLogPayload) => void;
}

export function DailyLogModal({ unit, onClose, onSubmit }: DailyLogModalProps) {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [addW, setAddW] = useState('8');
  const [addS, setAddS] = useState('2');
  const [addR, setAddR] = useState('0');
  const [addSolar, setAddSolar] = useState('120');
  const [autoSyncHM, setAutoSyncHM] = useState(true);
  const [manualHM, setManualHM] = useState('0');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (!unit) return;
    setDate(new Date().toISOString().slice(0, 10));
    setAddW('8');
    setAddS('2');
    setAddR('0');
    setAddSolar(String(Math.round(unit.stdFuel * 8)));
    setAutoSyncHM(true);
    setManualHM(String(unit.hmAkhir + 8));
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

  const numW = Math.max(0, safeNum(addW, 0));
  const effectiveHM = autoSyncHM
    ? unit.hmAkhir + numW
    : Math.max(0, safeNum(manualHM, unit.hmAkhir + numW));

  const handleAddWChange = (val: string) => {
    setAddW(val);
    if (autoSyncHM) {
      setManualHM(String(unit.hmAkhir + Math.max(0, safeNum(val, 0))));
    }
  };

  const handleToggleAutoSync = (checked: boolean) => {
    setAutoSyncHM(checked);
    if (checked) {
      setManualHM(String(unit.hmAkhir + numW));
    }
  };

  const handleSubmit = () => {
    onSubmit(unit.id, {
      date: date || new Date().toISOString().slice(0, 10),
      addW: Math.max(0, safeNum(addW, 0)),
      addS: Math.max(0, safeNum(addS, 0)),
      addR: Math.max(0, safeNum(addR, 0)),
      addSolar: Math.max(0, safeNum(addSolar, 0)),
      newHMAkhir: effectiveHM,
      note: note.trim(),
    });
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-[2px] p-4 no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="daily-log-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-warm-border shadow-2xl max-w-lg w-full overflow-hidden">
        <div className="bg-forest px-5 py-3.5 text-white flex items-center justify-between">
          <div>
            <h3 id="daily-log-modal-title" className="font-mono font-bold text-sm sm:text-base">
              Input Log Harian Unit
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="dailyLogDate"
                className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
              >
                Tanggal Operasi
              </label>
              <input
                type="date"
                id="dailyLogDate"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full font-mono font-semibold text-xs bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
              />
            </div>
            <div className="bg-warm-panel rounded-xl px-3 py-2 border border-warm-border flex items-center justify-between tabular-nums">
              <div>
                <span className="font-mono text-[10px] text-warm-muted block">HM Sebelumnya</span>
                <span className="font-mono font-bold text-xs text-warm-text">
                  {formatHM(unit.hmAkhir)} HM
                </span>
              </div>
              <div className="text-right">
                <span className="font-mono text-[10px] text-forest font-bold block">HM Baru</span>
                <span className="font-mono font-bold text-sm text-forest">
                  {formatHM(effectiveHM)} HM
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2.5">
            <div>
              <label
                htmlFor="dailyAddW"
                className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
              >
                +Working W (jam)
              </label>
              <input
                type="number"
                id="dailyAddW"
                min="0"
                step="any"
                value={addW}
                onChange={(e) => handleAddWChange(e.target.value)}
                className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <label
                htmlFor="dailyAddS"
                className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
              >
                +Standby S (jam)
              </label>
              <input
                type="number"
                id="dailyAddS"
                min="0"
                step="any"
                value={addS}
                onChange={(e) => setAddS(e.target.value)}
                className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <label
                htmlFor="dailyAddR"
                className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
              >
                +Repair R (jam)
              </label>
              <input
                type="number"
                id="dailyAddR"
                min="0"
                step="any"
                value={addR}
                onChange={(e) => setAddR(e.target.value)}
                className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label
                htmlFor="dailyAddSolar"
                className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
              >
                +Solar Refuel (Liter)
              </label>
              <input
                type="number"
                id="dailyAddSolar"
                min="0"
                step="any"
                value={addSolar}
                onChange={(e) => setAddSolar(e.target.value)}
                className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1">
                <label
                  htmlFor="dailyManualHMAkhir"
                  className="font-mono text-[11px] font-semibold text-warm-muted"
                >
                  HM Akhir Baru
                </label>
                <label className="inline-flex items-center gap-1 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={autoSyncHM}
                    onChange={(e) => handleToggleAutoSync(e.target.checked)}
                    className="rounded border-warm-border accent-forest"
                  />
                  <span className="font-mono text-[10px] text-forest font-semibold">Auto +W</span>
                </label>
              </div>
              <input
                type="number"
                id="dailyManualHMAkhir"
                min="0"
                step="any"
                value={autoSyncHM ? String(effectiveHM) : manualHM}
                onChange={(e) => {
                  setAutoSyncHM(false);
                  setManualHM(e.target.value);
                }}
                className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
              />
            </div>
          </div>

          <div>
            <label
              htmlFor="dailyNote"
              className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
            >
              Catatan Aktivitas / Shift
            </label>
            <input
              type="text"
              id="dailyNote"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="Contoh: Shift 1 - Stripping OB & loading DT"
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
            Simpan Log Harian
          </button>
        </div>
      </div>
    </div>
  );
}
