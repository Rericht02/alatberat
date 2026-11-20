import {
  Download,
  FolderDown,
  FolderUp,
  Plus,
  Printer,
  RotateCcw,
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
  const handleHargaInput = (raw: string) => {
    const digitsOnly = raw.replace(/\D/g, '');
    const numVal = digitsOnly ? parseInt(digitsOnly, 10) : 0;
    onHargaSolarChange(numVal);
  };

  return (
    <header className="bg-forest rounded-2xl px-5 py-4 sm:px-6 sm:py-5 text-white space-y-4">
      <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        {/* Kiri: Identitas Aplikasi */}
        <div className="flex items-start sm:items-center gap-3.5 min-w-0">
          <div className="w-11 h-11 rounded-xl bg-white/10 border border-white/15 flex items-center justify-center shrink-0 mt-0.5 sm:mt-0">
            <svg
              className="w-6 h-6 text-emerald-300"
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
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-0.5">
              <h1 className="font-mono font-bold text-lg sm:text-xl tracking-tight text-white">
                Monitoring Alat Berat 2026
              </h1>
              <span className="font-mono text-[11px] text-emerald-200/90 whitespace-nowrap">
                {saveStatus}
              </span>
            </div>
            <p className="text-xs sm:text-sm text-emerald-100/85 mt-0.5">
              Sistem Manajemen Ketersediaan (PA/MA/UA/EU), BBM &amp; Preventive Maintenance Armada
            </p>
          </div>
        </div>

        {/* Kanan: Tombol Aksi */}
        <div className="flex flex-wrap items-center gap-2 no-print">
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
            title="Cetak laporan ke kertas A4 / PDF"
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

      {/* Bar Parameter Global */}
      <div className="pt-3 border-t border-white/15 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
        <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
          <div className="flex items-center gap-2">
            <span className="text-emerald-200/80">Armada Terdaftar:</span>
            <span className="font-bold text-white tabular-nums">{unitCount} Unit</span>
          </div>
          <div className="flex items-center gap-2">
            <label htmlFor="globalPeriodeInput" className="text-emerald-200/80 whitespace-nowrap">
              Periode Aktif:
            </label>
            <input
              type="text"
              id="globalPeriodeInput"
              value={periodeAktif}
              onChange={(e) => onPeriodeChange(e.target.value)}
              className="bg-white/10 border border-white/25 rounded-lg px-2.5 py-1 text-white font-semibold w-36 sm:w-44 focus:outline-none focus:bg-white/20 focus:border-emerald-300"
            />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <label htmlFor="globalHargaSolarInput" className="text-emerald-200/80 whitespace-nowrap">
            Harga Solar / Liter:
          </label>
          <div className="relative flex items-center">
            <span className="absolute left-2.5 text-emerald-200 font-bold">Rp</span>
            <input
              type="text"
              id="globalHargaSolarInput"
              inputMode="numeric"
              value={hargaSolarGlobal > 0 ? fmtInt.format(hargaSolarGlobal) : ''}
              onChange={(e) => handleHargaInput(e.target.value)}
              placeholder="0"
              className="bg-white/10 border border-white/25 rounded-lg pl-8 pr-3 py-1 text-white font-bold tabular-nums w-32 text-right focus:outline-none focus:bg-white/20 focus:border-emerald-300"
            />
          </div>
        </div>
      </div>
    </header>
  );
}
