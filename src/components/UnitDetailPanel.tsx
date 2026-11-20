import { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CalendarPlus,
  CheckCircle2,
  Copy,
  Trash2,
  Wrench,
} from 'lucide-react';
import { UNIT_CATEGORIES } from '../data/presets';
import type { HeavyUnit, OperationStatus, UnitCategory } from '../types/fleet';
import {
  clampPercent,
  computeUnitMetrics,
  fmtDec1,
  fmtDec2,
  fmtInt,
  formatHM,
  formatRupiah,
  safeNum,
} from '../utils/calculations';

interface UnitDetailPanelProps {
  unit: HeavyUnit;
  hargaSolarGlobal: number;
  onUpdateUnit: (unitId: string, patch: Partial<HeavyUnit>) => void;
  onOpenDailyLog: (unitId: string) => void;
  onOpenServiceComplete: (unitId: string) => void;
  onDuplicateUnit: (unitId: string) => void;
  onDeleteUnit: (unitId: string) => void;
}

interface NumericInputProps {
  id: string;
  value: number;
  min?: number;
  max?: number;
  onCommit: (num: number) => void;
  className?: string;
}

function NumericInput({ id, value, min = 0, max, onCommit, className = '' }: NumericInputProps) {
  const [text, setText] = useState(String(value));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) {
      setText(String(value));
    }
  }, [value, focused]);

  return (
    <input
      id={id}
      type="number"
      min={min}
      max={max}
      step="any"
      value={text}
      onFocus={() => setFocused(true)}
      onBlur={() => {
        setFocused(false);
        const parsed = safeNum(text, min);
        const clamped =
          max !== undefined ? Math.min(max, Math.max(min, parsed)) : Math.max(min, parsed);
        setText(String(clamped));
        onCommit(clamped);
      }}
      onChange={(e) => {
        const raw = e.target.value;
        setText(raw);
        if (raw === '' || raw === '-') {
          onCommit(min);
          return;
        }
        const parsed = parseFloat(raw);
        if (Number.isFinite(parsed)) {
          const clamped =
            max !== undefined ? Math.min(max, Math.max(min, parsed)) : Math.max(min, parsed);
          onCommit(clamped);
        }
      }}
      className={className}
    />
  );
}

export function UnitDetailPanel({
  unit,
  hargaSolarGlobal,
  onUpdateUnit,
  onOpenDailyLog,
  onOpenServiceComplete,
  onDuplicateUnit,
  onDeleteUnit,
}: UnitDetailPanelProps) {
  const m = computeUnitMetrics(unit, hargaSolarGlobal);

  const inputBaseClass =
    'w-full font-mono font-bold text-base tabular-nums text-warm-text bg-warm-input border border-warm-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-gold-focus focus:ring-2 focus:ring-gold-focus/20';

  const identityInputClass =
    'w-full text-sm bg-white border border-warm-border rounded-xl px-3 py-2 focus:outline-none focus:border-gold-focus focus:ring-2 focus:ring-gold-focus/20';

  const fuelBadgeConfig = {
    HEMAT: {
      text: `HEMAT (Std ${fmtDec1.format(m.stdFuel)})`,
      cls: 'bg-emerald-100 text-emerald-800',
    },
    BOROS: {
      text: `BOROS (Std ${fmtDec1.format(m.stdFuel)})`,
      cls: 'bg-red-100 text-red-800',
    },
    STANDBY: {
      text: `STANDBY (Std ${fmtDec1.format(m.stdFuel)})`,
      cls: 'bg-slate-100 text-slate-700',
    },
    NORMAL: {
      text: `NORMAL (Std ${fmtDec1.format(m.stdFuel)})`,
      cls: 'bg-amber-100 text-amber-800',
    },
  }[m.fuelEfficiency];

  const serviceStyle =
    m.serviceState === 'OVERDUE'
      ? {
          card: 'bg-red-50 border-red-300',
          label: 'text-red-900/80',
          headline: 'text-red-700',
          sub: 'text-red-900/85',
          bar: 'bg-red-600',
          title: `LEWAT ${formatHM(Math.abs(m.selisih))} jam`,
        }
      : m.serviceState === 'SOON'
        ? {
            card: 'bg-amber-50 border-amber-300',
            label: 'text-amber-900/80',
            headline: 'text-amber-700',
            sub: 'text-amber-900/85',
            bar: 'bg-amber-500',
            title: `SEGERA dalam ${formatHM(m.selisih)} jam`,
          }
        : {
            card: 'bg-emerald-50 border-emerald-300',
            label: 'text-emerald-900/80',
            headline: 'text-emerald-700',
            sub: 'text-emerald-900/85',
            bar: 'bg-emerald-600',
            title: `AMAN — sisa ${formatHM(m.selisih)} jam`,
          };

  return (
    <section
      aria-label="Panel Kalkulator dan Detail Unit Aktif"
      className="bg-warm-card rounded-2xl border border-warm-border overflow-hidden print-break-inside"
    >
      {/* Header Panel Unit Aktif */}
      <div className="bg-forest px-5 py-4 sm:px-6 text-white flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-3 min-w-0">
          <div className="px-3 py-1.5 rounded-xl bg-white/15 border border-white/25 font-mono font-bold text-base sm:text-lg tracking-wide text-emerald-200 shrink-0">
            {unit.kodeUnit}
          </div>
          <div className="min-w-0">
            <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
              <h2 className="font-sans font-bold text-base sm:text-lg text-white">
                {unit.modelUnit}
              </h2>
              <span className="font-mono text-xs text-emerald-200/90">
                · {unit.kategori}
              </span>
            </div>
            <p className="font-mono text-xs text-emerald-100/80 mt-0.5">
              Lokasi: <span className="text-white font-semibold">{unit.site || '-'}</span> ·
              Operator/PIC:{' '}
              <span className="text-white font-semibold">{unit.operator || '-'}</span>
            </p>
          </div>
        </div>

        {/* Tombol Aksi Cepat Unit Aktif */}
        <div className="flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={() => onOpenDailyLog(unit.id)}
            className="px-3.5 py-2 rounded-xl font-mono text-xs font-bold bg-emerald-400 hover:bg-emerald-300 text-forest-dark transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <CalendarPlus className="w-3.5 h-3.5 shrink-0" />
            <span>Input Log Harian</span>
          </button>
          <button
            type="button"
            onClick={() => onOpenServiceComplete(unit.id)}
            className="px-3.5 py-2 rounded-xl font-mono text-xs font-bold bg-white/15 hover:bg-white/25 text-white border border-white/25 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Wrench className="w-3.5 h-3.5 shrink-0" />
            <span>Catat Servis Selesai</span>
          </button>
          <button
            type="button"
            onClick={() => onDuplicateUnit(unit.id)}
            className="px-3 py-2 rounded-xl font-mono text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Copy className="w-3.5 h-3.5 shrink-0" />
            <span>Duplikat</span>
          </button>
          <button
            type="button"
            onClick={() => onDeleteUnit(unit.id)}
            className="px-3 py-2 rounded-xl font-mono text-xs font-semibold bg-red-500/25 hover:bg-red-500/40 text-red-100 border border-red-400/30 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Trash2 className="w-3.5 h-3.5 shrink-0" />
            <span>Hapus</span>
          </button>
        </div>
      </div>

      {/* Bar Edit Identitas Unit Aktif */}
      <div className="bg-warm-panel px-5 py-3.5 sm:px-6 border-b border-warm-border grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div>
          <label
            htmlFor="inputKodeUnit"
            className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
          >
            Kode Unit
          </label>
          <input
            type="text"
            id="inputKodeUnit"
            value={unit.kodeUnit}
            onChange={(e) => {
              const cleaned = e.target.value.toUpperCase();
              onUpdateUnit(unit.id, { kodeUnit: cleaned });
            }}
            className={`${identityInputClass} font-mono font-bold uppercase`}
          />
        </div>
        <div>
          <label
            htmlFor="inputModelUnit"
            className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
          >
            Nama / Model Unit
          </label>
          <input
            type="text"
            id="inputModelUnit"
            value={unit.modelUnit}
            onChange={(e) => onUpdateUnit(unit.id, { modelUnit: e.target.value })}
            className={`${identityInputClass} font-sans font-semibold`}
          />
        </div>
        <div>
          <label
            htmlFor="inputKategoriUnit"
            className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
          >
            Kategori
          </label>
          <select
            id="inputKategoriUnit"
            value={unit.kategori}
            onChange={(e) =>
              onUpdateUnit(unit.id, { kategori: e.target.value as UnitCategory })
            }
            className={`${identityInputClass} font-mono font-semibold cursor-pointer`}
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
            htmlFor="inputSite"
            className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
          >
            Lokasi / Site
          </label>
          <input
            type="text"
            id="inputSite"
            value={unit.site}
            onChange={(e) => onUpdateUnit(unit.id, { site: e.target.value })}
            className={`${identityInputClass} font-sans font-medium`}
          />
        </div>
        <div>
          <label
            htmlFor="inputOperator"
            className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
          >
            Operator / PIC
          </label>
          <input
            type="text"
            id="inputOperator"
            value={unit.operator}
            onChange={(e) => onUpdateUnit(unit.id, { operator: e.target.value })}
            className={`${identityInputClass} font-sans font-medium`}
          />
        </div>
        <div>
          <label
            htmlFor="inputStatusOperasi"
            className="block font-mono text-[11px] font-semibold text-warm-muted mb-1"
          >
            Status Operasi
          </label>
          <select
            id="inputStatusOperasi"
            value={unit.statusOperasi}
            onChange={(e) =>
              onUpdateUnit(unit.id, { statusOperasi: e.target.value as OperationStatus })
            }
            className={`${identityInputClass} font-mono font-bold cursor-pointer`}
          >
            <option value="Aktif">Aktif</option>
            <option value="Standby">Standby</option>
            <option value="Breakdown">Breakdown</option>
          </select>
        </div>
      </div>

      {/* 3 Kolom Input Real-Time */}
      <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-warm-border bg-white">
        {/* Kolom 1: Jam Bulan Ini */}
        <div className="p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between border-b border-warm-border pb-2">
            <h3 className="font-mono font-bold text-sm text-warm-text">Jam bulan ini</h3>
            <span className="font-mono text-[11px] text-warm-muted">W / S / R</span>
          </div>

          <div>
            <label
              htmlFor="inputW"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Working W (jam)
            </label>
            <NumericInput
              id="inputW"
              value={unit.W}
              onCommit={(val) => onUpdateUnit(unit.id, { W: val })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="inputS"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Standby S (jam)
            </label>
            <NumericInput
              id="inputS"
              value={unit.S}
              onCommit={(val) => onUpdateUnit(unit.id, { S: val })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="inputR"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Repair R (jam)
            </label>
            <NumericInput
              id="inputR"
              value={unit.R}
              onCommit={(val) => onUpdateUnit(unit.id, { R: val })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="inputTargetPA"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Target PA (%)
            </label>
            <NumericInput
              id="inputTargetPA"
              value={unit.targetPA}
              min={0}
              max={100}
              onCommit={(val) => onUpdateUnit(unit.id, { targetPA: clampPercent(val) })}
              className={inputBaseClass}
            />
          </div>
        </div>

        {/* Kolom 2: Hour Meter & Solar */}
        <div className="p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between border-b border-warm-border pb-2">
            <h3 className="font-mono font-bold text-sm text-warm-text">Hour meter &amp; solar</h3>
            <span className="font-mono text-[11px] text-warm-muted">HM &amp; BBM</span>
          </div>

          <div>
            <label
              htmlFor="inputHMAwal"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              HM awal
            </label>
            <NumericInput
              id="inputHMAwal"
              value={unit.hmAwal}
              onCommit={(val) => onUpdateUnit(unit.id, { hmAwal: val })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <div className="flex items-center justify-between gap-2 mb-1">
              <label
                htmlFor="inputHMAkhir"
                className="font-mono text-xs font-semibold text-warm-muted"
              >
                HM akhir / saat ini
              </label>
              {m.isHMInvalid && (
                <span className="inline-flex items-center gap-1 font-mono text-[10px] font-bold text-red-700">
                  <AlertTriangle className="w-3 h-3" />
                  HM Akhir &lt; HM Awal
                </span>
              )}
            </div>
            <NumericInput
              id="inputHMAkhir"
              value={unit.hmAkhir}
              onCommit={(val) => onUpdateUnit(unit.id, { hmAkhir: val })}
              className={`${inputBaseClass} ${
                m.isHMInvalid ? 'border-red-500 bg-red-50/40' : ''
              }`}
            />
          </div>

          <div>
            <label
              htmlFor="inputSolar"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Solar terisi (liter)
            </label>
            <NumericInput
              id="inputSolar"
              value={unit.solar}
              onCommit={(val) => onUpdateUnit(unit.id, { solar: val })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="inputStdFuel"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Standar Solar Unit (L/HM)
            </label>
            <NumericInput
              id="inputStdFuel"
              value={unit.stdFuel}
              min={0.1}
              onCommit={(val) => onUpdateUnit(unit.id, { stdFuel: Math.max(0.1, val) })}
              className={inputBaseClass}
            />
          </div>
        </div>

        {/* Kolom 3: Servis Berkala (PM) */}
        <div className="p-5 sm:p-6 space-y-3.5">
          <div className="flex items-center justify-between border-b border-warm-border pb-2">
            <h3 className="font-mono font-bold text-sm text-warm-text">Servis berkala (PM)</h3>
            <span className="font-mono text-[11px] text-warm-muted">Maintenance</span>
          </div>

          <div>
            <label
              htmlFor="inputHMServis"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              HM servis terakhir
            </label>
            <NumericInput
              id="inputHMServis"
              value={unit.hmServis}
              onCommit={(val) => onUpdateUnit(unit.id, { hmServis: val })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="inputInterval"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Interval servis (jam)
            </label>
            <NumericInput
              id="inputInterval"
              value={unit.interval}
              min={1}
              onCommit={(val) => onUpdateUnit(unit.id, { interval: Math.max(1, val) })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="inputBatasSegera"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Batas &quot;segera&quot; (jam)
            </label>
            <NumericInput
              id="inputBatasSegera"
              value={unit.batasSegera}
              onCommit={(val) => onUpdateUnit(unit.id, { batasSegera: val })}
              className={inputBaseClass}
            />
          </div>

          <div>
            <label
              htmlFor="inputJenisPM"
              className="block font-mono text-xs font-semibold text-warm-muted mb-1"
            >
              Paket PM Berikutnya
            </label>
            <input
              type="text"
              id="inputJenisPM"
              value={unit.jenisPM}
              onChange={(e) => onUpdateUnit(unit.id, { jenisPM: e.target.value })}
              className="w-full font-mono font-semibold text-sm text-warm-text bg-warm-input border border-warm-border rounded-xl px-3.5 py-2.5 focus:outline-none focus:border-gold-focus focus:ring-2 focus:ring-gold-focus/20"
            />
          </div>
        </div>
      </div>

      {/* Panel Output & Visualisasi */}
      <div className="p-5 sm:p-6 bg-warm-panel border-t border-warm-border space-y-5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-stretch">
          {/* Kiri (7 cols): Grafik Horizontal Bar PA, MA, UA, EU */}
          <div className="lg:col-span-7 bg-white border border-warm-border rounded-2xl p-5 flex flex-col justify-between">
            <div>
              <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
                <h4 className="font-mono font-bold text-xs text-warm-text">
                  Ketersediaan &amp; Utilisasi Unit (PA / MA / UA / EU)
                </h4>
                <span
                  className={`inline-flex items-center gap-1 font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md ${
                    m.pa < m.targetPA
                      ? 'bg-red-100 text-red-800'
                      : 'bg-emerald-100 text-emerald-800'
                  }`}
                >
                  {m.pa < m.targetPA ? (
                    <>
                      <AlertTriangle className="w-3 h-3" />
                      PA di bawah target
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-3 h-3" />
                      PA memenuhi target
                    </>
                  )}
                </span>
              </div>

              <div className="space-y-4">
                {/* PA */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-warm-text">
                      PA{' '}
                      <span className="font-normal text-warm-muted">(Physical Availability)</span>
                    </span>
                    <span className="font-bold text-sm text-warm-text tabular-nums">
                      {fmtDec1.format(m.pa)}%
                    </span>
                  </div>
                  <div className="relative h-4 bg-slate-200 rounded-full overflow-visible">
                    <div
                      className={`progress-fill h-full rounded-full ${
                        m.pa < m.targetPA ? 'bg-red-600' : 'bg-forest-bar'
                      }`}
                      style={{ width: `${clampPercent(m.pa)}%` }}
                    />
                    <div
                      className="target-marker absolute -top-1 -bottom-1 w-[3px] bg-zinc-900 rounded-full z-10"
                      style={{ left: `${m.targetPA}%` }}
                      title={`Target PA: ${fmtInt.format(m.targetPA)}%`}
                    />
                  </div>
                </div>

                {/* MA */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-warm-text">
                      MA{' '}
                      <span className="font-normal text-warm-muted">
                        (Mechanical Availability)
                      </span>
                    </span>
                    <span className="font-bold text-sm text-warm-text tabular-nums">
                      {fmtDec1.format(m.ma)}%
                    </span>
                  </div>
                  <div className="relative h-3.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="progress-fill h-full bg-slate-600 rounded-full"
                      style={{ width: `${clampPercent(m.ma)}%` }}
                    />
                  </div>
                </div>

                {/* UA */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-warm-text">
                      UA <span className="font-normal text-warm-muted">(Use of Availability)</span>
                    </span>
                    <span className="font-bold text-sm text-warm-text tabular-nums">
                      {fmtDec1.format(m.ua)}%
                    </span>
                  </div>
                  <div className="relative h-3.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="progress-fill h-full bg-slate-600 rounded-full"
                      style={{ width: `${clampPercent(m.ua)}%` }}
                    />
                  </div>
                </div>

                {/* EU */}
                <div>
                  <div className="flex items-center justify-between font-mono text-xs mb-1">
                    <span className="font-bold text-warm-text">
                      EU{' '}
                      <span className="font-normal text-warm-muted">(Effective Utilization)</span>
                    </span>
                    <span className="font-bold text-sm text-warm-text tabular-nums">
                      {fmtDec1.format(m.eu)}%
                    </span>
                  </div>
                  <div className="relative h-3.5 bg-slate-200 rounded-full overflow-hidden">
                    <div
                      className="progress-fill h-full bg-slate-600 rounded-full"
                      style={{ width: `${clampPercent(m.eu)}%` }}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-5 pt-3 border-t border-warm-border space-y-1 font-mono text-[11px] text-warm-muted">
              <div className="flex flex-wrap items-center justify-between gap-2 tabular-nums">
                <span>
                  Garis vertikal = target PA (
                  <strong className="text-warm-text">{fmtInt.format(m.targetPA)}%</strong>). Bar
                  merah jika PA di bawah target.
                </span>
                <span className="font-bold text-warm-text">
                  Total W+S+R: {formatHM(m.totalWSR)} jam
                </span>
              </div>
              <div className="text-[10px] text-warm-muted/90">
                Rumus: PA = (W+S)/(W+S+R) · MA = W/(W+R) · UA = W/(W+S) · EU = W/(W+S+R)
              </div>
            </div>
          </div>

          {/* Kanan (5 cols): Fuel Ratio Card & Status Servis Berkala Card */}
          <div className="lg:col-span-5 flex flex-col justify-between gap-4">
            {/* Kartu Fuel Ratio & Biaya BBM */}
            <div className="bg-white border border-warm-border rounded-2xl p-5 flex-1 flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-semibold text-warm-muted">
                    Fuel ratio
                  </span>
                  <span
                    className={`font-mono text-[11px] font-bold px-2.5 py-0.5 rounded-md tabular-nums ${fuelBadgeConfig.cls}`}
                  >
                    {fuelBadgeConfig.text}
                  </span>
                </div>
                <div className="mt-1.5">
                  <span className="font-mono font-bold text-2xl sm:text-3xl text-warm-text tracking-tight tabular-nums">
                    {fmtDec2.format(m.fuelRatio)} L/HM
                  </span>
                </div>
                <p className="font-mono text-xs text-warm-muted mt-0.5 tabular-nums">
                  {formatHM(m.hmTerpakai)} HM terpakai (HM {formatHM(m.hmAwal)} →{' '}
                  {formatHM(m.hmAkhir)})
                </p>
              </div>

              <div className="mt-3 pt-3 border-t border-warm-border grid grid-cols-2 gap-2 font-mono text-xs tabular-nums">
                <div>
                  <span className="text-warm-muted block text-[11px]">Total Biaya Solar</span>
                  <span className="font-bold text-warm-text">{formatRupiah(m.totalFuelCost)}</span>
                </div>
                <div className="text-right">
                  <span className="text-warm-muted block text-[11px]">Biaya BBM / Jam</span>
                  <span className="font-bold text-warm-text">{formatRupiah(m.costPerHM)}/HM</span>
                </div>
              </div>
            </div>

            {/* Kartu Status Servis Berkala */}
            <div
              className={`service-status-card status-card-transition rounded-2xl p-5 flex-1 flex flex-col justify-between border ${serviceStyle.card}`}
            >
              <div>
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-mono text-xs font-semibold ${serviceStyle.label}`}>
                    Status servis
                  </span>
                  <span className="font-mono text-[11px] font-bold text-warm-text">
                    {unit.jenisPM || 'PM Berkala'}
                  </span>
                </div>
                <div
                  className={`font-mono font-bold text-2xl sm:text-3xl tracking-tight mt-1 tabular-nums ${serviceStyle.headline}`}
                >
                  {serviceStyle.title}
                </div>
                <div className={`font-mono text-xs mt-0.5 tabular-nums ${serviceStyle.sub}`}>
                  due di HM {formatHM(m.dueHM)} (Saat ini: HM {formatHM(m.hmAkhir)})
                </div>
              </div>

              <div className="mt-3 pt-2">
                <div className="flex justify-between font-mono text-[10px] mb-1 opacity-85 tabular-nums">
                  <span>HM {formatHM(m.hmServis)}</span>
                  <span>{fmtInt.format(m.intervalProgressPct)}% siklus</span>
                  <span>HM {formatHM(m.dueHM)}</span>
                </div>
                <div className="h-2.5 bg-black/10 rounded-full overflow-hidden">
                  <div
                    className={`progress-fill h-full rounded-full ${serviceStyle.bar}`}
                    style={{ width: `${clampPercent(m.intervalProgressPct)}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Riwayat Log Harian & Servis PM */}
        <div className="bg-white border border-warm-border rounded-2xl p-4 sm:p-5">
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warm-border pb-3 mb-3">
            <div>
              <h4 className="font-mono font-bold text-xs text-warm-text">
                Riwayat Log Harian &amp; Servis PM ({unit.kodeUnit})
              </h4>
              <p className="text-[11px] text-warm-muted">
                Catatan aktivitas operasional dan pemeliharaan mekanik terbaru untuk unit ini
              </p>
            </div>
            <span className="font-mono text-xs text-warm-muted tabular-nums">
              {unit.logs.length} Catatan
            </span>
          </div>

          {unit.logs.length === 0 ? (
            <div className="p-4 rounded-xl bg-warm-panel/60 border border-dashed border-warm-border text-center font-mono text-xs text-warm-muted">
              Belum ada riwayat log harian atau catatan servis PM untuk unit {unit.kodeUnit}.
            </div>
          ) : (
            <div className="divide-y divide-warm-border max-h-60 overflow-y-auto pr-1">
              {unit.logs.map((item) => {
                const isService = item.type === 'SERVICE';
                return (
                  <div key={item.id} className="py-3 first:pt-1 last:pb-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1 font-mono text-xs">
                      <span
                        className={`font-bold text-[11px] px-2 py-0.5 rounded ${
                          isService
                            ? 'bg-amber-100 text-amber-900'
                            : 'bg-emerald-100 text-emerald-900'
                        }`}
                      >
                        {isService ? 'SERVIS PM' : 'LOG HARIAN'}
                      </span>
                      <span className="text-[11px] text-warm-muted tabular-nums">{item.date}</span>
                      <span className="text-warm-muted" aria-hidden="true">
                        ·
                      </span>
                      <span className="font-bold text-warm-text tabular-nums">{item.summary}</span>
                    </div>
                    {item.note && (
                      <p className="text-xs text-warm-muted pl-0.5">{item.note}</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
