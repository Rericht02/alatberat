import { useMemo } from 'react';
import { ChevronRight, Copy, Search, Trash2 } from 'lucide-react';
import { UNIT_CATEGORIES } from '../data/presets';
import type { HeavyUnit, ServiceFilterValue } from '../types/fleet';
import {
  computeUnitMetrics,
  fmtDec1,
  fmtDec2,
  formatHM,
} from '../utils/calculations';

interface FleetTableProps {
  fleet: HeavyUnit[];
  activeUnitId: string;
  hargaSolarGlobal: number;
  searchQuery: string;
  categoryFilter: string;
  statusFilter: ServiceFilterValue;
  onSearchChange: (value: string) => void;
  onCategoryFilterChange: (value: string) => void;
  onStatusFilterChange: (value: ServiceFilterValue) => void;
  onResetFilters: () => void;
  onSelectUnit: (unitId: string) => void;
  onOpenDailyLog: (unitId: string) => void;
  onOpenServiceComplete: (unitId: string) => void;
  onDuplicateUnit: (unitId: string) => void;
  onDeleteUnit: (unitId: string) => void;
}

export function FleetTable({
  fleet,
  activeUnitId,
  hargaSolarGlobal,
  searchQuery,
  categoryFilter,
  statusFilter,
  onSearchChange,
  onCategoryFilterChange,
  onStatusFilterChange,
  onResetFilters,
  onSelectUnit,
  onOpenDailyLog,
  onOpenServiceComplete,
  onDuplicateUnit,
  onDeleteUnit,
}: FleetTableProps) {
  const filteredRows = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    return fleet
      .map((unit) => ({
        unit,
        metrics: computeUnitMetrics(unit, hargaSolarGlobal),
      }))
      .filter(({ unit, metrics }) => {
        const matchesText =
          !query ||
          unit.kodeUnit.toLowerCase().includes(query) ||
          unit.modelUnit.toLowerCase().includes(query) ||
          unit.kategori.toLowerCase().includes(query) ||
          unit.site.toLowerCase().includes(query) ||
          unit.operator.toLowerCase().includes(query);

        const matchesCat = categoryFilter === 'ALL' || unit.kategori === categoryFilter;

        let matchesStatus = true;
        if (statusFilter === 'OVERDUE') matchesStatus = metrics.serviceState === 'OVERDUE';
        else if (statusFilter === 'SOON') matchesStatus = metrics.serviceState === 'SOON';
        else if (statusFilter === 'SAFE') matchesStatus = metrics.serviceState === 'SAFE';
        else if (statusFilter === 'NEED_SERVICE') {
          matchesStatus =
            metrics.serviceState === 'OVERDUE' || metrics.serviceState === 'SOON';
        }

        return matchesText && matchesCat && matchesStatus;
      });
  }, [fleet, hargaSolarGlobal, searchQuery, categoryFilter, statusFilter]);

  return (
    <section
      aria-label="Tabel Daftar Armada"
      className="bg-warm-card rounded-2xl border border-warm-border overflow-hidden print-break-inside"
    >
      {/* Toolbar */}
      <div className="bg-warm-panel px-4 py-3.5 sm:px-6 border-b border-warm-border flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div>
          <h2 className="font-mono font-bold text-sm sm:text-base text-warm-text">
            Daftar Armada &amp; Status Operasional ({fleet.length} Unit)
          </h2>
          <p className="text-xs text-warm-muted">
            <span className="md:hidden">Ketuk kartu unit untuk membuka kalkulator &amp; edit data</span>
            <span className="hidden md:inline">
              Klik baris unit untuk membuka &amp; mengedit rincian pada Panel Kalkulator di bawah
            </span>
          </p>
        </div>

        <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 no-print">
          <div className="relative col-span-2 sm:w-56">
            <Search className="w-4 h-4 text-warm-muted absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Cari kode, merek, site..."
              className="w-full min-h-[44px] md:min-h-0 pl-9 pr-3 py-2 text-base sm:text-xs font-sans bg-white border border-warm-border rounded-xl focus:outline-none focus:border-forest"
            />
          </div>

          <select
            value={categoryFilter}
            onChange={(e) => onCategoryFilterChange(e.target.value)}
            aria-label="Filter kategori alat berat"
            className="min-h-[44px] md:min-h-0 px-3 py-2 text-sm sm:text-xs font-mono font-medium bg-white border border-warm-border rounded-xl focus:outline-none focus:border-forest cursor-pointer"
          >
            <option value="ALL">Semua Kategori</option>
            {UNIT_CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange(e.target.value as ServiceFilterValue)}
            aria-label="Filter status servis PM"
            className="min-h-[44px] md:min-h-0 px-3 py-2 text-sm sm:text-xs font-mono font-medium bg-white border border-warm-border rounded-xl focus:outline-none focus:border-forest cursor-pointer"
          >
            <option value="ALL">Semua Servis</option>
            <option value="NEED_SERVICE">Perlu Servis</option>
            <option value="OVERDUE">Lewat Servis</option>
            <option value="SOON">Segera Servis</option>
            <option value="SAFE">Servis Aman</option>
          </select>
        </div>
      </div>

      {/* MOBILE CARD LIST (< md) — Tanpa horizontal scroll yang menyulitkan di HP */}
      {filteredRows.length > 0 && (
        <div className="md:hidden divide-y divide-warm-border">
          {filteredRows.map(({ unit, metrics }) => {
            const isSelected = unit.id === activeUnitId;

            const opStatusClass =
              unit.statusOperasi === 'Standby'
                ? 'text-amber-800 bg-amber-100/80'
                : unit.statusOperasi === 'Breakdown'
                  ? 'text-red-800 bg-red-100/80'
                  : 'text-emerald-800 bg-emerald-100/80';

            const pmStatusClass =
              metrics.serviceState === 'OVERDUE'
                ? 'text-red-800 bg-red-100 border-red-200'
                : metrics.serviceState === 'SOON'
                  ? 'text-amber-800 bg-amber-100 border-amber-200'
                  : 'text-emerald-800 bg-emerald-100 border-emerald-200';

            const pmStatusText =
              metrics.serviceState === 'OVERDUE'
                ? `LEWAT ${formatHM(Math.abs(metrics.selisih))}j`
                : metrics.serviceState === 'SOON'
                  ? `SEGERA ${formatHM(metrics.selisih)}j`
                  : `AMAN (${formatHM(metrics.selisih)}j)`;

            const fuelColor =
              metrics.fuelEfficiency === 'BOROS'
                ? 'text-red-700'
                : metrics.fuelEfficiency === 'HEMAT'
                  ? 'text-emerald-700'
                  : 'text-warm-text';

            return (
              <div
                key={unit.id}
                onClick={() => onSelectUnit(unit.id)}
                className={`p-4 space-y-3 transition-colors cursor-pointer ${
                  isSelected ? 'bg-emerald-50/75' : 'bg-white active:bg-warm-panel/80'
                }`}
              >
                {/* Header Kartu Unit */}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5 font-mono text-sm">
                      <span className="font-bold text-warm-text">{unit.kodeUnit}</span>
                      <span className="text-warm-muted" aria-hidden="true">
                        ·
                      </span>
                      <span className="text-xs text-warm-muted truncate">{unit.kategori}</span>
                    </div>
                    <div className="font-semibold text-sm text-warm-text mt-0.5 truncate">
                      {unit.modelUnit}
                    </div>
                    <div className="text-xs text-warm-muted truncate">
                      {unit.site} · {unit.operator}
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span
                      className={`px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold ${opStatusClass}`}
                    >
                      {unit.statusOperasi}
                    </span>
                    <ChevronRight className="w-4 h-4 text-warm-muted" />
                  </div>
                </div>

                {/* Strip 4 Metrik Kunci */}
                <div className="grid grid-cols-3 gap-2 bg-warm-panel/70 border border-warm-border/70 rounded-xl p-2.5 font-mono tabular-nums">
                  <div>
                    <div className="text-[10px] text-warm-muted">PA / MA</div>
                    <div className="text-xs font-bold mt-0.5">
                      <span className={metrics.pa < metrics.targetPA ? 'text-red-700' : 'text-emerald-700'}>
                        {fmtDec1.format(metrics.pa)}%
                      </span>
                      <span className="text-warm-muted font-normal">
                        {' '}
                        / {fmtDec1.format(metrics.ma)}%
                      </span>
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-warm-muted">HM Pakai</div>
                    <div className="text-xs font-bold text-warm-text mt-0.5">
                      {formatHM(metrics.hmTerpakai)} HM
                    </div>
                  </div>
                  <div>
                    <div className="text-[10px] text-warm-muted">Fuel Ratio</div>
                    <div className={`text-xs font-bold mt-0.5 ${fuelColor}`}>
                      {fmtDec2.format(metrics.fuelRatio)} L/H
                    </div>
                  </div>
                </div>

                {/* Status Servis + Tombol Aksi Sentuh (44px) */}
                <div
                  className="flex flex-wrap items-center justify-between gap-2 pt-0.5"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="font-mono">
                    <span
                      className={`inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-bold border tabular-nums ${pmStatusClass}`}
                    >
                      {pmStatusText}
                    </span>
                    <span className="block text-[10px] text-warm-muted mt-0.5 tabular-nums">
                      Due HM {formatHM(metrics.dueHM)}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => onOpenDailyLog(unit.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-emerald-50 active:bg-emerald-100 text-forest border border-emerald-200 cursor-pointer whitespace-nowrap"
                    >
                      + Log
                    </button>
                    <button
                      type="button"
                      onClick={() => onOpenServiceComplete(unit.id)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl font-mono text-xs font-bold bg-amber-50 active:bg-amber-100 text-amber-800 border border-amber-200 cursor-pointer whitespace-nowrap"
                    >
                      Servis
                    </button>
                    <button
                      type="button"
                      onClick={() => onDuplicateUnit(unit.id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-warm-muted active:bg-warm-panel border border-warm-border cursor-pointer"
                      aria-label={`Duplikat ${unit.kodeUnit}`}
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => onDeleteUnit(unit.id)}
                      className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-xl text-warm-muted hover:text-red-700 active:bg-red-50 border border-warm-border cursor-pointer"
                      aria-label={`Hapus ${unit.kodeUnit}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* DESKTOP TABLE (md dan ke atas) */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[940px]">
          <thead>
            <tr className="bg-warm-panel/60 border-b border-warm-border font-mono text-[11px] text-warm-muted">
              <th className="py-3 px-4 font-semibold">Kode Unit &amp; Tipe</th>
              <th className="py-3 px-3 font-semibold">Status</th>
              <th className="py-3 px-3 font-semibold text-right">PA%</th>
              <th className="py-3 px-3 font-semibold text-right">MA%</th>
              <th className="py-3 px-3 font-semibold text-right">UA%</th>
              <th className="py-3 px-3 font-semibold text-right">EU%</th>
              <th className="py-3 px-3 font-semibold text-right">HM Terpakai</th>
              <th className="py-3 px-3 font-semibold text-right">Fuel Ratio vs Std</th>
              <th className="py-3 px-3 font-semibold">Status Servis PM</th>
              <th className="py-3 px-4 font-semibold text-right no-print">Aksi Cepat</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-warm-border text-xs">
            {filteredRows.map(({ unit, metrics }) => {
              const isSelected = unit.id === activeUnitId;

              const opStatusClass =
                unit.statusOperasi === 'Standby'
                  ? 'text-amber-800 bg-amber-100/80'
                  : unit.statusOperasi === 'Breakdown'
                    ? 'text-red-800 bg-red-100/80'
                    : 'text-emerald-800 bg-emerald-100/80';

              const pmStatusClass =
                metrics.serviceState === 'OVERDUE'
                  ? 'text-red-800 bg-red-100 border-red-200'
                  : metrics.serviceState === 'SOON'
                    ? 'text-amber-800 bg-amber-100 border-amber-200'
                    : 'text-emerald-800 bg-emerald-100 border-emerald-200';

              const pmStatusText =
                metrics.serviceState === 'OVERDUE'
                  ? `LEWAT ${formatHM(Math.abs(metrics.selisih))}j`
                  : metrics.serviceState === 'SOON'
                    ? `SEGERA ${formatHM(metrics.selisih)}j`
                    : `AMAN (${formatHM(metrics.selisih)}j)`;

              const fuelColor =
                metrics.fuelEfficiency === 'BOROS'
                  ? 'text-red-700 font-bold'
                  : metrics.fuelEfficiency === 'HEMAT'
                    ? 'text-emerald-700 font-bold'
                    : 'text-warm-text font-bold';

              return (
                <tr
                  key={unit.id}
                  onClick={() => onSelectUnit(unit.id)}
                  className={`transition-colors cursor-pointer ${
                    isSelected
                      ? 'bg-emerald-50/90 ring-1 ring-inset ring-forest/35'
                      : 'bg-white hover:bg-warm-panel/70'
                  }`}
                >
                  <td className="py-3 px-4">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-1.5 font-mono text-xs">
                        <span className="font-bold text-warm-text">{unit.kodeUnit}</span>
                        <span className="text-warm-muted" aria-hidden="true">
                          ·
                        </span>
                        <span className="text-[11px] text-warm-muted">{unit.kategori}</span>
                      </div>
                      <div className="font-semibold text-xs text-warm-text">{unit.modelUnit}</div>
                      <div className="text-[11px] text-warm-muted">{unit.site}</div>
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md font-mono text-[11px] font-semibold whitespace-nowrap ${opStatusClass}`}
                    >
                      {unit.statusOperasi}
                    </span>
                  </td>

                  <td
                    className={`py-3 px-3 text-right font-mono font-bold tabular-nums ${
                      metrics.pa < metrics.targetPA ? 'text-red-700' : 'text-emerald-700'
                    }`}
                  >
                    {fmtDec1.format(metrics.pa)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-warm-text">
                    {fmtDec1.format(metrics.ma)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-warm-text">
                    {fmtDec1.format(metrics.ua)}%
                  </td>
                  <td className="py-3 px-3 text-right font-mono tabular-nums text-warm-text">
                    {fmtDec1.format(metrics.eu)}%
                  </td>

                  <td className="py-3 px-3 text-right font-mono font-semibold tabular-nums text-warm-text">
                    {formatHM(metrics.hmTerpakai)}{' '}
                    <span className="text-[10px] text-warm-muted font-normal">HM</span>
                  </td>

                  <td className="py-3 px-3 text-right font-mono tabular-nums">
                    <div className={fuelColor}>
                      {fmtDec2.format(metrics.fuelRatio)}{' '}
                      <span className="text-[10px] font-normal">L/HM</span>
                    </div>
                    <div className="text-[10px] text-warm-muted">
                      Std {fmtDec1.format(metrics.stdFuel)}
                    </div>
                  </td>

                  <td className="py-3 px-3">
                    <span
                      className={`status-badge inline-flex items-center px-2 py-0.5 rounded-md font-mono text-[11px] font-bold border whitespace-nowrap tabular-nums ${pmStatusClass}`}
                    >
                      {pmStatusText}
                    </span>
                    <div className="font-mono text-[10px] text-warm-muted mt-0.5 tabular-nums">
                      Due HM {formatHM(metrics.dueHM)}
                    </div>
                  </td>

                  <td
                    className="py-3 px-4 text-right no-print"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="inline-flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onOpenDailyLog(unit.id)}
                        className="px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold bg-emerald-50 hover:bg-emerald-100 text-forest border border-emerald-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        title="Input Log Harian"
                      >
                        + Log
                      </button>
                      <button
                        type="button"
                        onClick={() => onOpenServiceComplete(unit.id)}
                        className="px-2.5 py-1.5 rounded-lg font-mono text-[11px] font-bold bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 transition-colors cursor-pointer whitespace-nowrap shrink-0"
                        title="Catat Servis Selesai"
                      >
                        Servis
                      </button>
                      <button
                        type="button"
                        onClick={() => onDuplicateUnit(unit.id)}
                        className="p-1.5 rounded-lg text-warm-muted hover:text-warm-text hover:bg-warm-panel transition-colors cursor-pointer shrink-0"
                        title="Duplikat Unit"
                        aria-label={`Duplikat ${unit.kodeUnit}`}
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteUnit(unit.id)}
                        className="p-1.5 rounded-lg text-warm-muted hover:text-red-700 hover:bg-red-50 transition-colors cursor-pointer shrink-0"
                        title="Hapus Unit"
                        aria-label={`Hapus ${unit.kodeUnit}`}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Empty State */}
      {filteredRows.length === 0 && (
        <div className="p-8 text-center space-y-3">
          <p className="font-mono text-sm font-bold text-warm-text">
            Tidak ada unit yang sesuai filter
          </p>
          <p className="text-xs text-warm-muted">
            Ubah kata kunci pencarian/filter atau tambahkan unit alat berat baru.
          </p>
          <button
            type="button"
            onClick={onResetFilters}
            className="min-h-[44px] px-4 py-2 rounded-xl text-xs font-bold bg-forest text-white hover:bg-forest-light cursor-pointer transition-colors whitespace-nowrap"
          >
            Tampilkan Semua Unit
          </button>
        </div>
      )}
    </section>
  );
}
