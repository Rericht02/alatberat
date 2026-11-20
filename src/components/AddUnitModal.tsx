import { useEffect, useMemo, useRef, useState } from 'react';
import { Plus, X } from 'lucide-react';
import { PRESET_LIST, UNIT_CATEGORIES, UNIT_PRESETS } from '../data/presets';
import type { HeavyUnit, OperationStatus, PresetKey, UnitCategory } from '../types/fleet';
import {
  clampPercent,
  computeUnitMetrics,
  fmtDec1,
  fmtDec2,
  formatHM,
  generateNextUnitCode,
  safeNum,
} from '../utils/calculations';

interface AddUnitModalProps {
  open: boolean;
  fleet: HeavyUnit[];
  hargaSolarGlobal: number;
  onClose: () => void;
  onSave: (unit: HeavyUnit, keepOpen: boolean) => void;
  onToastError: (msg: string) => void;
}

interface DraftForm {
  kodeUnit: string;
  statusOperasi: OperationStatus;
  modelUnit: string;
  kategori: UnitCategory;
  operator: string;
  site: string;
  hmAwal: string;
  hmAkhir: string;
  solar: string;
  stdFuel: string;
  autoSyncW: boolean;
  W: string;
  S: string;
  R: string;
  hmServis: string;
  interval: string;
  batasSegera: string;
  targetPA: string;
  jenisPM: string;
}

function buildPresetForm(fleet: HeavyUnit[], presetKey: PresetKey): DraftForm {
  const p = UNIT_PRESETS[presetKey];
  return {
    kodeUnit: generateNextUnitCode(fleet, p.prefix),
    statusOperasi: 'Aktif',
    modelUnit: p.model,
    kategori: p.kategori,
    operator: '',
    site: 'Pit Utara - Blok B',
    hmAwal: '1000',
    hmAkhir: '1180',
    solar: '2700',
    stdFuel: String(p.stdFuel),
    autoSyncW: true,
    W: '180',
    S: '30',
    R: '15',
    hmServis: '1000',
    interval: String(p.interval),
    batasSegera: String(p.batasSegera),
    targetPA: String(p.targetPA),
    jenisPM: p.jenisPM,
  };
}

export function AddUnitModal({
  open,
  fleet,
  hargaSolarGlobal,
  onClose,
  onSave,
  onToastError,
}: AddUnitModalProps) {
  const [selectedPreset, setSelectedPreset] = useState<PresetKey>('EXCAVATOR');
  const [form, setForm] = useState<DraftForm>(() => buildPresetForm(fleet, 'EXCAVATOR'));
  const codeInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) {
      setSelectedPreset('EXCAVATOR');
      setForm(buildPresetForm(fleet, 'EXCAVATOR'));
      const timer = setTimeout(() => {
        codeInputRef.current?.focus();
        codeInputRef.current?.select();
      }, 40);
      return () => clearTimeout(timer);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const applyPreset = (presetKey: PresetKey) => {
    const p = UNIT_PRESETS[presetKey];
    setSelectedPreset(presetKey);
    setForm((prev) => ({
      ...prev,
      kategori: p.kategori,
      kodeUnit: generateNextUnitCode(fleet, p.prefix),
      modelUnit: p.model,
      interval: String(p.interval),
      batasSegera: String(p.batasSegera),
      stdFuel: String(p.stdFuel),
      targetPA: String(p.targetPA),
      jenisPM: p.jenisPM,
    }));
  };

  const updateField = <K extends keyof DraftForm>(key: K, value: DraftForm[K]) => {
    setForm((prev) => {
      const next = { ...prev, [key]: value };
      if (
        (key === 'hmAwal' || key === 'hmAkhir' || key === 'autoSyncW') &&
        next.autoSyncW
      ) {
        const awal = Math.max(0, safeNum(next.hmAwal, 0));
        const akhir = Math.max(0, safeNum(next.hmAkhir, 0));
        next.W = String(Math.max(0, akhir - awal));
      }
      return next;
    });
  };

  const draftUnit: HeavyUnit = useMemo(() => {
    const hmAwal = Math.max(0, safeNum(form.hmAwal, 0));
    const hmAkhir = Math.max(0, safeNum(form.hmAkhir, 0));
    const computedW = form.autoSyncW
      ? Math.max(0, hmAkhir - hmAwal)
      : Math.max(0, safeNum(form.W, 0));

    return {
      id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      kodeUnit: form.kodeUnit.trim().toUpperCase(),
      statusOperasi: form.statusOperasi,
      modelUnit: form.modelUnit.trim() || 'Alat Berat',
      kategori: form.kategori,
      operator: form.operator.trim() || '-',
      site: form.site.trim() || 'Site Utama',
      W: computedW,
      S: Math.max(0, safeNum(form.S, 0)),
      R: Math.max(0, safeNum(form.R, 0)),
      targetPA: clampPercent(safeNum(form.targetPA, 85)),
      hmAwal,
      hmAkhir,
      solar: Math.max(0, safeNum(form.solar, 0)),
      stdFuel: Math.max(0.1, safeNum(form.stdFuel, 15)),
      hmServis: Math.max(0, safeNum(form.hmServis, 0)),
      interval: Math.max(1, safeNum(form.interval, 250)),
      batasSegera: Math.max(0, safeNum(form.batasSegera, 50)),
      jenisPM: form.jenisPM.trim() || 'PM-250',
      logs: [],
    };
  }, [form]);

  const previewMetrics = useMemo(
    () => computeUnitMetrics(draftUnit, hargaSolarGlobal),
    [draftUnit, hargaSolarGlobal]
  );

  const duplicateExists = useMemo(
    () =>
      Boolean(draftUnit.kodeUnit) &&
      fleet.some((u) => u.kodeUnit.toUpperCase() === draftUnit.kodeUnit),
    [fleet, draftUnit.kodeUnit]
  );

  const validationMsg = useMemo(() => {
    if (!draftUnit.kodeUnit) return 'Kode Unit tidak boleh kosong.';
    if (duplicateExists) return `Kode "${draftUnit.kodeUnit}" sudah digunakan.`;
    if (draftUnit.hmAkhir < draftUnit.hmAwal) return 'HM Saat Ini lebih kecil dari HM Awal.';
    return '';
  }, [draftUnit.kodeUnit, draftUnit.hmAkhir, draftUnit.hmAwal, duplicateExists]);

  if (!open) return null;

  const handleSave = (keepOpen: boolean) => {
    if (!draftUnit.kodeUnit) {
      onToastError('Kode Unit wajib diisi!');
      codeInputRef.current?.focus();
      return;
    }
    if (duplicateExists) {
      onToastError(`Kode unit "${draftUnit.kodeUnit}" sudah terdaftar! Gunakan kode unik.`);
      codeInputRef.current?.focus();
      return;
    }

    const finalUnit: HeavyUnit = {
      ...draftUnit,
      id: `unit-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    };
    onSave(finalUnit, keepOpen);

    if (keepOpen) {
      const prefixMatch = finalUnit.kodeUnit.match(/^([A-Z0-9]+)-/i);
      const nextPrefix = prefixMatch ? prefixMatch[1] : 'UN';
      const nextCode = generateNextUnitCode([finalUnit, ...fleet], nextPrefix);
      setForm((prev) => ({ ...prev, kodeUnit: nextCode }));
      setTimeout(() => {
        codeInputRef.current?.focus();
        codeInputRef.current?.select();
      }, 30);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-[2px] p-0 sm:p-5 overflow-y-auto no-print"
      role="dialog"
      aria-modal="true"
      aria-labelledby="add-unit-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-warm-card rounded-t-3xl sm:rounded-2xl border border-warm-border shadow-2xl max-w-4xl w-full sm:my-auto overflow-hidden flex flex-col max-h-[92dvh]">
        {/* Header Modal */}
        <div className="bg-forest px-5 py-4 sm:px-6 flex items-center justify-between text-white shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-safety-orange text-white flex items-center justify-center shrink-0">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h3
                id="add-unit-modal-title"
                className="font-mono font-bold text-base sm:text-lg tracking-tight"
              >
                Tambah Unit Alat Berat Baru
              </h3>
              <p className="text-xs text-emerald-100/80">
                Pilih preset kategori untuk pengisian standar teknis otomatis
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl text-emerald-100 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Tutup"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Modal */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-warm-panel/60">
          {/* 1-Klik Preset Kategori */}
          <div className="bg-white border border-warm-border rounded-xl p-4">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2.5">
              <span className="font-mono text-xs font-bold text-forest">
                1. Preset Kategori Alat (1-Klik Auto-Fill)
              </span>
              <span className="font-mono text-[11px] text-warm-muted">
                Menyarankan Kode Unit unik, Interval PM &amp; Standar BBM
              </span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
              {PRESET_LIST.map((preset) => {
                const isActive = selectedPreset === preset.key;
                return (
                  <button
                    key={preset.key}
                    type="button"
                    onClick={() => applyPreset(preset.key)}
                    className={`px-2.5 py-2 rounded-xl border font-mono text-xs font-bold text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'border-forest bg-emerald-50 text-forest'
                        : 'border-warm-border bg-warm-input text-warm-text hover:border-forest'
                    }`}
                  >
                    <div className="truncate">{preset.label}</div>
                    <div
                      className={`text-[10px] font-normal tabular-nums ${
                        isActive ? 'opacity-85' : 'text-warm-muted'
                      }`}
                    >
                      {preset.fuelHint}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Form 3 Kolom Terstruktur */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Kolom A */}
            <div className="bg-white border border-warm-border rounded-xl p-4 space-y-3">
              <h4 className="font-mono font-bold text-xs text-warm-text border-b border-warm-border pb-2">
                A. Identitas &amp; Status Unit
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="newKodeUnit"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Kode Unit *
                  </label>
                  <input
                    ref={codeInputRef}
                    type="text"
                    id="newKodeUnit"
                    value={form.kodeUnit}
                    onChange={(e) => updateField('kodeUnit', e.target.value)}
                    placeholder="EX-02"
                    className="w-full font-mono font-bold text-sm uppercase bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newStatusOperasi"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Status Operasi
                  </label>
                  <select
                    id="newStatusOperasi"
                    value={form.statusOperasi}
                    onChange={(e) =>
                      updateField('statusOperasi', e.target.value as OperationStatus)
                    }
                    className="w-full font-mono text-xs font-bold bg-warm-input border border-warm-border rounded-xl px-2.5 py-2.5 focus:outline-none focus:border-forest cursor-pointer"
                  >
                    <option value="Aktif">Aktif</option>
                    <option value="Standby">Standby</option>
                    <option value="Breakdown">Breakdown</option>
                  </select>
                </div>
              </div>

              <div>
                <label
                  htmlFor="newModelUnit"
                  className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                >
                  Model / Merek Alat *
                </label>
                <input
                  type="text"
                  id="newModelUnit"
                  value={form.modelUnit}
                  onChange={(e) => updateField('modelUnit', e.target.value)}
                  placeholder="Komatsu PC200-8"
                  className="w-full font-sans font-semibold text-sm bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="newKategori"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Kategori
                  </label>
                  <select
                    id="newKategori"
                    value={form.kategori}
                    onChange={(e) => updateField('kategori', e.target.value as UnitCategory)}
                    className="w-full font-mono text-xs font-semibold bg-warm-input border border-warm-border rounded-xl px-2.5 py-2 focus:outline-none focus:border-forest cursor-pointer"
                  >
                    {UNIT_CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label
                    htmlFor="newOperator"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Operator / PIC
                  </label>
                  <input
                    type="text"
                    id="newOperator"
                    value={form.operator}
                    onChange={(e) => updateField('operator', e.target.value)}
                    placeholder="Nama Operator"
                    className="w-full font-sans text-xs bg-warm-input border border-warm-border rounded-xl px-2.5 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newSite"
                  className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                >
                  Lokasi / Site Kerja
                </label>
                <input
                  type="text"
                  id="newSite"
                  value={form.site}
                  onChange={(e) => updateField('site', e.target.value)}
                  className="w-full font-sans text-xs bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                />
              </div>
            </div>

            {/* Kolom B */}
            <div className="bg-white border border-warm-border rounded-xl p-4 space-y-3">
              <h4 className="font-mono font-bold text-xs text-warm-text border-b border-warm-border pb-2">
                B. Hour Meter &amp; Solar
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="newHMAwal"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    HM Awal
                  </label>
                  <input
                    type="number"
                    id="newHMAwal"
                    min="0"
                    step="any"
                    value={form.hmAwal}
                    onChange={(e) => updateField('hmAwal', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newHMAkhir"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    HM Saat Ini
                  </label>
                  <input
                    type="number"
                    id="newHMAkhir"
                    min="0"
                    step="any"
                    value={form.hmAkhir}
                    onChange={(e) => updateField('hmAkhir', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="newSolar"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Solar Terisi (L)
                  </label>
                  <input
                    type="number"
                    id="newSolar"
                    min="0"
                    step="any"
                    value={form.solar}
                    onChange={(e) => updateField('solar', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newStdFuel"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Std Solar (L/HM)
                  </label>
                  <input
                    type="number"
                    id="newStdFuel"
                    min="0.1"
                    step="any"
                    value={form.stdFuel}
                    onChange={(e) => updateField('stdFuel', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="pt-1 border-t border-warm-border/70">
                <div className="flex items-center justify-between gap-2 mb-1.5">
                  <span className="font-mono text-[11px] font-bold text-warm-text">
                    Jam Operasi Bulan Ini
                  </span>
                  <label className="inline-flex items-center gap-1.5 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={form.autoSyncW}
                      onChange={(e) => updateField('autoSyncW', e.target.checked)}
                      className="rounded border-warm-border accent-forest"
                    />
                    <span className="font-mono text-[10px] font-semibold text-forest">
                      Samakan W dengan selisih HM
                    </span>
                  </label>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <div>
                    <label
                      htmlFor="newW"
                      className="block font-mono text-[10px] font-semibold text-warm-muted mb-1"
                    >
                      Working W
                    </label>
                    <input
                      type="number"
                      id="newW"
                      min="0"
                      step="any"
                      value={form.W}
                      onChange={(e) => {
                        setForm((prev) => ({ ...prev, autoSyncW: false, W: e.target.value }));
                      }}
                      className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-2.5 py-2 focus:outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="newS"
                      className="block font-mono text-[10px] font-semibold text-warm-muted mb-1"
                    >
                      Standby S
                    </label>
                    <input
                      type="number"
                      id="newS"
                      min="0"
                      step="any"
                      value={form.S}
                      onChange={(e) => updateField('S', e.target.value)}
                      className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-2.5 py-2 focus:outline-none focus:border-forest"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="newR"
                      className="block font-mono text-[10px] font-semibold text-warm-muted mb-1"
                    >
                      Repair R
                    </label>
                    <input
                      type="number"
                      id="newR"
                      min="0"
                      step="any"
                      value={form.R}
                      onChange={(e) => updateField('R', e.target.value)}
                      className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-2.5 py-2 focus:outline-none focus:border-forest"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Kolom C */}
            <div className="bg-white border border-warm-border rounded-xl p-4 space-y-3">
              <h4 className="font-mono font-bold text-xs text-warm-text border-b border-warm-border pb-2">
                C. Servis Berkala (PM) &amp; Target
              </h4>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="newHMServis"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    HM Servis Terakhir
                  </label>
                  <input
                    type="number"
                    id="newHMServis"
                    min="0"
                    step="any"
                    value={form.hmServis}
                    onChange={(e) => updateField('hmServis', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newInterval"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Interval PM (Jam)
                  </label>
                  <input
                    type="number"
                    id="newInterval"
                    min="1"
                    step="any"
                    value={form.interval}
                    onChange={(e) => updateField('interval', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label
                    htmlFor="newBatasSegera"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Batas &quot;Segera&quot; (Jam)
                  </label>
                  <input
                    type="number"
                    id="newBatasSegera"
                    min="0"
                    step="any"
                    value={form.batasSegera}
                    onChange={(e) => updateField('batasSegera', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
                <div>
                  <label
                    htmlFor="newTargetPA"
                    className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                  >
                    Target PA (%)
                  </label>
                  <input
                    type="number"
                    id="newTargetPA"
                    min="0"
                    max="100"
                    step="any"
                    value={form.targetPA}
                    onChange={(e) => updateField('targetPA', e.target.value)}
                    className="w-full font-mono font-bold text-sm tabular-nums bg-warm-input border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-forest"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="newJenisPM"
                  className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
                >
                  Paket PM Berikutnya
                </label>
                <input
                  type="text"
                  id="newJenisPM"
                  value={form.jenisPM}
                  onChange={(e) => updateField('jenisPM', e.target.value)}
                  className="w-full font-mono font-semibold text-xs bg-warm-input border border-warm-border rounded-xl px-3 py-2.5 focus:outline-none focus:border-forest"
                />
              </div>
            </div>
          </div>

          {/* Live Preview Strip */}
          <div className="bg-white border border-warm-border rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-4 font-mono text-xs tabular-nums">
              <div>
                <span className="text-warm-muted block text-[11px]">Live Preview PA</span>
                <span
                  className={`font-bold text-base ${
                    previewMetrics.pa < previewMetrics.targetPA
                      ? 'text-red-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {fmtDec1.format(previewMetrics.pa)}%
                </span>
              </div>
              <div className="h-7 w-px bg-warm-border" />
              <div>
                <span className="text-warm-muted block text-[11px]">Fuel Ratio</span>
                <span className="font-bold text-base text-warm-text">
                  {fmtDec2.format(previewMetrics.fuelRatio)} L/HM
                </span>
              </div>
              <div className="h-7 w-px bg-warm-border" />
              <div>
                <span className="text-warm-muted block text-[11px]">Status Servis</span>
                <span
                  className={`font-bold text-sm ${
                    previewMetrics.serviceState === 'OVERDUE'
                      ? 'text-red-700'
                      : previewMetrics.serviceState === 'SOON'
                        ? 'text-amber-700'
                        : 'text-emerald-700'
                  }`}
                >
                  {previewMetrics.serviceState === 'OVERDUE'
                    ? `LEWAT ${formatHM(Math.abs(previewMetrics.selisih))} jam`
                    : previewMetrics.serviceState === 'SOON'
                      ? `SEGERA dalam ${formatHM(previewMetrics.selisih)} jam`
                      : `AMAN — sisa ${formatHM(previewMetrics.selisih)} jam`}
                </span>
              </div>
            </div>
            {validationMsg && (
              <div className="font-mono text-xs text-red-700 font-semibold">{validationMsg}</div>
            )}
          </div>
        </div>

        {/* Footer Modal */}
        <div className="bg-white px-4 py-3 sm:px-6 sm:py-3.5 border-t border-warm-border grid grid-cols-2 sm:flex sm:flex-wrap items-center justify-end gap-2 shrink-0 pb-safe">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] sm:min-h-0 px-4 py-2.5 rounded-xl text-xs font-semibold text-warm-muted hover:bg-warm-panel border border-warm-border transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={() => handleSave(true)}
            className="min-h-[44px] sm:min-h-0 px-4 py-2.5 rounded-xl text-xs font-bold text-forest bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Simpan &amp; Lagi
          </button>
          <button
            type="button"
            onClick={() => handleSave(false)}
            className="col-span-2 sm:col-span-1 min-h-[44px] sm:min-h-0 px-5 py-2.5 rounded-xl text-xs font-bold text-white bg-safety-orange hover:bg-safety-orange-hover shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
          >
            Simpan Unit
          </button>
        </div>
      </div>
    </div>
  );
}
