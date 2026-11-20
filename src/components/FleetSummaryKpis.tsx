import { useMemo } from 'react';
import { AlertTriangle, BarChart3, Clock, Fuel, Layers } from 'lucide-react';
import type { HeavyUnit } from '../types/fleet';
import {
  computeUnitMetrics,
  fmtDec1,
  fmtDec2,
  fmtInt,
  formatHM,
  formatRupiah,
} from '../utils/calculations';

interface FleetSummaryKpisProps {
  fleet: HeavyUnit[];
  hargaSolarGlobal: number;
  isServiceFilterActive: boolean;
  onFilterServiceAlerts: () => void;
}

export function FleetSummaryKpis({
  fleet,
  hargaSolarGlobal,
  isServiceFilterActive,
  onFilterServiceAlerts,
}: FleetSummaryKpisProps) {
  const summary = useMemo(() => {
    const totalUnits = fleet.length;
    let countAktif = 0;
    let countStandby = 0;
    let countBreakdown = 0;
    let sumPA = 0;
    let sumTargetPA = 0;
    let sumHM = 0;
    let sumSolar = 0;
    let sumFuelCost = 0;
    let overdueCount = 0;
    let soonCount = 0;

    fleet.forEach((u) => {
      if (u.statusOperasi === 'Standby') countStandby++;
      else if (u.statusOperasi === 'Breakdown') countBreakdown++;
      else countAktif++;

      const m = computeUnitMetrics(u, hargaSolarGlobal);
      sumPA += m.pa;
      sumTargetPA += m.targetPA;
      sumHM += m.hmTerpakai;
      sumSolar += m.solar;
      sumFuelCost += m.totalFuelCost;

      if (m.serviceState === 'OVERDUE') overdueCount++;
      else if (m.serviceState === 'SOON') soonCount++;
    });

    const avgPA = totalUnits > 0 ? sumPA / totalUnits : 0;
    const avgTargetPA = totalUnits > 0 ? sumTargetPA / totalUnits : 85;
    const avgFuelRatio = sumHM > 0 ? sumSolar / sumHM : 0;

    return {
      totalUnits,
      countAktif,
      countStandby,
      countBreakdown,
      avgPA,
      avgTargetPA,
      sumHM,
      avgFuelRatio,
      sumSolar,
      sumFuelCost,
      overdueCount,
      soonCount,
    };
  }, [fleet, hargaSolarGlobal]);

  return (
    <section
      aria-label="Ringkasan 5 KPI Armada"
      className="grid grid-cols-2 lg:grid-cols-5 gap-2.5 sm:gap-3 print-break-inside"
    >
      {/* KPI 1: Total Armada */}
      <div className="bg-warm-card rounded-2xl border border-warm-border p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-warm-muted">
            Total Armada
          </span>
          <Layers className="w-4 h-4 text-forest shrink-0" />
        </div>
        <p className="font-mono font-bold text-xl sm:text-2xl text-warm-text tabular-nums mt-1.5">
          {summary.totalUnits} Unit
        </p>
        <p className="font-mono text-[10px] sm:text-[11px] text-warm-muted tabular-nums mt-1">
          {summary.countAktif} Aktif · {summary.countStandby} S · {summary.countBreakdown} B/D
        </p>
      </div>

      {/* KPI 2: Rata-rata PA Armada */}
      <div className="bg-warm-card rounded-2xl border border-warm-border p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-warm-muted">
            Rata-rata PA
          </span>
          <BarChart3 className="w-4 h-4 text-emerald-700 shrink-0" />
        </div>
        <p
          className={`font-mono font-bold text-xl sm:text-2xl tabular-nums mt-1.5 ${
            summary.avgPA >= summary.avgTargetPA ? 'text-emerald-700' : 'text-red-700'
          }`}
        >
          {fmtDec1.format(summary.avgPA)}%
        </p>
        <p className="font-mono text-[10px] sm:text-[11px] text-warm-muted tabular-nums mt-1">
          Target: {fmtDec1.format(summary.avgTargetPA)}%
        </p>
      </div>

      {/* KPI 3: Total HM Terpakai */}
      <div className="bg-warm-card rounded-2xl border border-warm-border p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-warm-muted">
            Total HM Pakai
          </span>
          <Clock className="w-4 h-4 text-slate-700 shrink-0" />
        </div>
        <p className="font-mono font-bold text-xl sm:text-2xl text-warm-text tabular-nums mt-1.5">
          {formatHM(summary.sumHM)} jam
        </p>
        <p className="font-mono text-[10px] sm:text-[11px] text-warm-muted tabular-nums mt-1">
          Avg {fmtDec2.format(summary.avgFuelRatio)} L/HM
        </p>
      </div>

      {/* KPI 4: Total Konsumsi & Biaya Solar */}
      <div className="bg-warm-card rounded-2xl border border-warm-border p-3.5 sm:p-4 flex flex-col justify-between">
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] sm:text-xs font-semibold text-warm-muted">
            Konsumsi Solar
          </span>
          <Fuel className="w-4 h-4 text-amber-700 shrink-0" />
        </div>
        <p className="font-mono font-bold text-xl sm:text-2xl text-warm-text tabular-nums mt-1.5">
          {fmtInt.format(summary.sumSolar)} L
        </p>
        <p className="font-mono text-[10px] sm:text-[11px] font-semibold text-amber-900 tabular-nums mt-1 truncate">
          {formatRupiah(summary.sumFuelCost)}
        </p>
      </div>

      {/* KPI 5: Peringatan Servis (Full width di HP agar mudah disentuh) */}
      <button
        type="button"
        onClick={onFilterServiceAlerts}
        className={`col-span-2 lg:col-span-1 min-h-[44px] rounded-2xl border p-3.5 sm:p-4 flex flex-col justify-between text-left transition-colors cursor-pointer group ${
          isServiceFilterActive
            ? 'bg-red-50/70 border-red-400'
            : 'bg-warm-card hover:bg-red-50/35 border-warm-border'
        }`}
        title="Klik untuk memfilter unit yang perlu perhatian servis"
      >
        <div className="flex items-center justify-between w-full gap-2">
          <span className="text-xs font-semibold text-warm-muted group-hover:text-red-800">
            Peringatan Servis
          </span>
          <AlertTriangle className="w-4 h-4 text-red-700 shrink-0" />
        </div>
        <div className="flex items-baseline gap-2 mt-1.5 tabular-nums">
          <span className="font-mono font-bold text-lg text-red-700">
            {summary.overdueCount} LEWAT
          </span>
          <span className="text-warm-muted">·</span>
          <span className="font-mono font-bold text-lg text-amber-700">
            {summary.soonCount} SEGERA
          </span>
        </div>
        <p className="font-mono text-[11px] text-forest underline underline-offset-2 mt-1 no-print">
          {isServiceFilterActive ? 'Filter aktif (ketuk untuk reset)' : 'Ketuk untuk filter unit perlu servis →'}
        </p>
      </button>
    </section>
  );
}
