import { useState } from 'react';
import {
  ChevronDown,
  Download,
  FolderDown,
  FolderUp,
  Plus,
  Printer,
  RotateCcw,
  SlidersHorizontal,
} from 'lucide-react';
import { fmtInt } from '../utils/calculations';

interface FleetHeaderProps {
  unitCount: number;
  periodeAktif: string;
  hargaSolarGlobal: number;
  saveStatus: string;
  onPeriodeChange: (value: string) => void;
  onHargaSolarChange: (value: number) => void;
  onOpenAddUnit: () => void;
  onExportCSV: () => void;
  onBackupJSON: () => void;
  onTriggerRestoreJSON: () => void;
  onPrintReport: () => void;
  onResetFleet: () => void;
}

export function FleetHeader({
  unitCount,
  periodeAktif,
  hargaSolarGlobal,
  saveStatus,
  onPeriodeChange,
  onHargaSolarChange,
  onOpenAddUnit,
  onExportCSV,
  onBackupJSON,
  onTriggerRestoreJSON,
  onPrintReport,
  onResetFleet,
}: FleetHeaderProps) {
  const [mobileToolsOpen, setMobileToolsOpen] = useState(false);

  const handleHargaInput = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    const numVal = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    onHargaSolarChange(numVal);
  };

  return (
    <header className="bg-forest rounded-2xl px-4 py-4 sm:px-6 sm:py-5 text-white space-y-3.5 sm:space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-3.5">
        {/* Kiri: Identitas Aplikasi + Aksi Cepat Mobile */}
        <div className="flex items-start justify-between gap-3 min-w-0">
          <div className="flex items-start sm:items-center gap-3 min-w-0">
            <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0">
              <svg
                className="w-5 h-5 sm:w-6 sm:h-6 text-emerald-300"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M3 17h18" />
                <path d="M5 17v-4a2 2 0 0 1 2-2h6l3 3h3a2 2 0 0 1 2 2v1" />
                <circle cx="7.5" cy="17.5" r="2.5" />
                <circle cx="16.5" cy="17.5" r="2.5" />
                <path d="M13 11V6l4-2 2 3" />
              </svg>
            </div>
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-x-2.5 gap-y-0.5">
                <h1 className="font-mono font-bold text-base sm:text-xl tracking-tight text-white leading-snug">
                  Monitoring Alat Berat 2026
                </h1>
                <span className="font-mono text-[11px] text-emerald-200/90 whitespace-nowrap">
                  {saveStatus}
                </span>
              </div>
              <p className="text-xs sm:text-sm text-emerald-100/85 mt-0.5 line-clamp-2 sm:line-clamp-none">
                Sistem Manajemen Ketersediaan (PA/MA/UA/EU), BBM &amp; Preventive Maintenance Armada
              </p>
            </div>
          </div>
        </div>

        {/* Mobile Primary Row (Terlihat hanya di HP < md) */}
        <div className="grid grid-cols-2 gap-2 md:hidden no-print">
          <button
            type="button"
            onClick={onOpenAddUnit}
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-bold bg-safety-orange hover:bg-safety-orange-hover text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Unit</span>
          </button>

          <button
            type="button"
            onClick={() => setMobileToolsOpen((prev) => !prev)}
            aria-expanded={mobileToolsOpen}
            className="min-h-[44px] px-3.5 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap"
          >
            <SlidersHorizontal className="w-4 h-4 text-emerald-300 shrink-0" />
            <span>Menu Data</span>
            <ChevronDown
              className={`w-3.5 h-3.5 transition-transform ${
                mobileToolsOpen ? 'rotate-180' : ''
              }`}
            />
          </button>
        </div>

        {/* Mobile Collapsible Tools Drawer */}
        {mobileToolsOpen && (
          <div className="grid grid-cols-2 gap-2 pt-1 md:hidden no-print">
            <button
              type="button"
              onClick={() => {
                onPrintReport();
                setMobileToolsOpen(false);
              }}
              className="min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Printer className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Cetak / PDF</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onExportCSV();
                setMobileToolsOpen(false);
              }}
              className="min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Export CSV</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onBackupJSON();
                setMobileToolsOpen(false);
              }}
              className="min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FolderDown className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Backup JSON</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onTriggerRestoreJSON();
                setMobileToolsOpen(false);
              }}
              className="min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <FolderUp className="w-4 h-4 text-emerald-300 shrink-0" />
              <span>Restore JSON</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onResetFleet();
                setMobileToolsOpen(false);
              }}
              className="col-span-2 min-h-[44px] px-3 py-2.5 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/35 text-red-100 border border-red-400/30 flex items-center justify-center gap-1.5 cursor-pointer"
            >
              <RotateCcw className="w-4 h-4 shrink-0" />
              <span>Reset ke 4 Unit Contoh</span>
            </button>
          </div>
        )}

        {/* Desktop Action Bar (md dan ke atas) */}
        <div className="hidden md:flex flex-wrap items-center gap-2 no-print">
          <button
            type="button"
            onClick={onOpenAddUnit}
            className="px-4 py-2.5 rounded-xl text-xs font-bold bg-safety-orange hover:bg-safety-orange-hover text-white transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
          >
            <Plus className="w-4 h-4 shrink-0" />
            <span>Tambah Unit Baru</span>
          </button>

          <button
            type="button"
            onClick={onExportCSV}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Unduh laporan Excel (.csv)"
          >
            <Download className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Export CSV</span>
          </button>

          <button
            type="button"
            onClick={onBackupJSON}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Simpan cadangan database armada (.json)"
          >
            <FolderDown className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Backup JSON</span>
          </button>

          <button
            type="button"
            onClick={onTriggerRestoreJSON}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Pulihkan database dari file JSON"
          >
            <FolderUp className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Restore JSON</span>
          </button>

          <button
            type="button"
            onClick={onPrintReport}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-white/10 hover:bg-white/20 text-white border border-white/20 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Pratinjau & cetak laporan A4 / PDF"
          >
            <Printer className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
            <span>Cetak Laporan</span>
          </button>

          <button
            type="button"
            onClick={onResetFleet}
            className="px-3 py-2.5 rounded-xl text-xs font-semibold bg-red-500/20 hover:bg-red-500/35 text-red-100 border border-red-400/30 transition-colors flex items-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            title="Kembalikan ke 4 unit contoh awal"
          >
            <RotateCcw className="w-3.5 h-3.5 shrink-0" />
            <span>Reset Contoh</span>
          </button>
        </div>
      </div>

      {/* Bar Parameter Global (Responsif 2 kolom di HP, 1 baris di Desktop) */}
      <div className="pt-3 border-t border-white/15 grid grid-cols-2 md:flex md:flex-wrap md:items-center md:justify-between gap-2.5 sm:gap-3 text-xs font-mono">
        <div className="col-span-2 md:col-span-1 flex items-center justify-between md:justify-start md:gap-4">
          <div className="flex items-center gap-2">
            <span className="text-emerald-200/80">Armada:</span>
            <span className="font-bold text-white tabular-nums">{unitCount} Unit</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <label htmlFor="globalPeriodeInputDesktop" className="text-emerald-200/80 whitespace-nowrap">
              Periode Aktif:
            </label>
            <input
              type="text"
              id="globalPeriodeInputDesktop"
              value={periodeAktif}
              onChange={(e) => onPeriodeChange(e.target.value)}
              className="bg-white/10 border border-white/25 rounded-lg px-2.5 py-1 text-white font-semibold w-44 focus:outline-none focus:bg-white/20 focus:border-emerald-300"
            />
          </div>
        </div>

        {/* Mobile Periode Input */}
        <div className="md:hidden">
          <label
            htmlFor="globalPeriodeInputMobile"
            className="block text-[11px] text-emerald-200/80 mb-1"
          >
            Periode Aktif
          </label>
          <input
            type="text"
            id="globalPeriodeInputMobile"
            value={periodeAktif}
            onChange={(e) => onPeriodeChange(e.target.value)}
            className="w-full min-h-[40px] bg-white/10 border border-white/25 rounded-xl px-3 py-1.5 text-sm text-white font-semibold focus:outline-none focus:bg-white/20 focus:border-emerald-300"
          />
        </div>

        {/* Harga Solar (Mobile & Desktop) */}
        <div className="md:flex md:items-center md:gap-2">
          <label
            htmlFor="globalHargaSolarInput"
            className="block md:inline text-[11px] md:text-xs text-emerald-200/80 mb-1 md:mb-0 whitespace-nowrap"
          >
            Harga Solar / L
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-emerald-200 font-bold text-xs">Rp</span>
            <input
              type="text"
              id="globalHargaSolarInput"
              inputMode="numeric"
              value={hargaSolarGlobal > 0 ? fmtInt.format(hargaSolarGlobal) : ''}
              onChange={(e) => handleHargaInput(e.target.value)}
              placeholder="0"
              className="w-full md:w-32 min-h-[40px] md:min-h-0 bg-white/10 border border-white/25 rounded-xl md:rounded-lg pl-8 pr-3 py-1.5 md:py-1 text-sm md:text-xs text-white font-bold tabular-nums text-right focus:outline-none focus:bg-white/20 focus:border-emerald-300"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
