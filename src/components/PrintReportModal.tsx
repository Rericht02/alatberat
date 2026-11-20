import { useEffect, useMemo, useState } from 'react';
import { FileCode2, FileDown, Printer, X } from 'lucide-react';
import type { FleetAppState, HeavyUnit } from '../types/fleet';
import {
  computeUnitMetrics,
  fmtDec1,
  fmtDec2,
  fmtInt,
  formatHM,
  formatRupiah,
} from '../utils/calculations';
import {
  computeFleetSummary,
  downloadFleetReportPDF,
  downloadPrintableHTML,
} from '../utils/reportPdf';

interface PrintReportModalProps {
  open: boolean;
  appState: FleetAppState;
  activeUnit: HeavyUnit | null;
  onClose: () => void;
  onNotify: (msg: string, type?: 'success' | 'warning' | 'error') => void;
}

export function PrintReportModal({
  open,
  appState,
  activeUnit,
  onClose,
  onNotify,
}: PrintReportModalProps) {
  const [includeActiveUnitDetail, setIncludeActiveUnitDetail] = useState(true);
  const [includeSignatures, setIncludeSignatures] = useState(true);

  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [open, onClose]);

  const summary = useMemo(() => computeFleetSummary(appState), [appState]);

  const activeMetrics = useMemo(
    () => (activeUnit ? computeUnitMetrics(activeUnit, appState.hargaSolarGlobal) : null),
    [activeUnit, appState.hargaSolarGlobal]
  );

  if (!open) return null;

  const printDate = new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());

  const handleDownloadPDF = () => {
    try {
      downloadFleetReportPDF(appState, activeUnit, {
        includeActiveUnitDetail,
        includeSignatures,
      });
      onNotify('Laporan PDF (A4) berhasil diunduh dan siap dicetak.');
    } catch {
      onNotify('Gagal membuat file PDF. Coba unduh versi HTML Cetak.', 'error');
    }
  };

  const handleDownloadHTML = () => {
    downloadPrintableHTML(appState, activeUnit, {
      includeActiveUnitDetail,
      includeSignatures,
    });
    onNotify('File HTML siap cetak A4 berhasil diunduh.');
  };

  const handleDirectPrint = () => {
    try {
      const isInIframe = window.self !== window.top;
      window.print();
      if (isInIframe) {
        onNotify(
          'Jika dialog cetak browser diblokir di mode pratinjau, gunakan tombol "Unduh PDF (A4)" untuk mencetak.',
          'warning'
        );
      }
    } catch {
      onNotify('Gunakan tombol "Unduh PDF (A4)" untuk mencetak laporan.', 'warning');
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/65 backdrop-blur-[2px] p-0 sm:p-5 overflow-y-auto print-modal-backdrop"
      role="dialog"
      aria-modal="true"
      aria-labelledby="print-modal-title"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-warm-card rounded-t-3xl sm:rounded-2xl border border-warm-border shadow-2xl max-w-5xl w-full sm:my-auto overflow-hidden flex flex-col max-h-[94dvh] print-modal-shell">
        {/* Header Modal (Disembunyikan saat print) */}
        <div className="bg-forest px-5 py-4 sm:px-6 text-white flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center shrink-0">
              <Printer className="w-5 h-5 text-emerald-200" />
            </div>
            <div>
              <h3 id="print-modal-title" className="font-mono font-bold text-base sm:text-lg">
                Pratinjau &amp; Cetak Laporan A4
              </h3>
              <p className="text-xs text-emerald-100/80">
                Unduh file PDF A4 siap cetak atau cetak langsung ke printer
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

        {/* Bar Opsi & Tombol Unduh/Cetak */}
        <div className="bg-warm-panel px-5 py-3 sm:px-6 border-b border-warm-border flex flex-wrap items-center justify-between gap-3 shrink-0 no-print">
          <div className="flex flex-wrap items-center gap-4 text-xs font-mono text-warm-text">
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeActiveUnitDetail}
                onChange={(e) => setIncludeActiveUnitDetail(e.target.checked)}
                className="rounded border-warm-border accent-forest"
              />
              <span>Sertakan Detail Unit Aktif ({activeUnit?.kodeUnit ?? '-'})</span>
            </label>
            <label className="inline-flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={includeSignatures}
                onChange={(e) => setIncludeSignatures(e.target.checked)}
                className="rounded border-warm-border accent-forest"
              />
              <span>Kolom Tanda Tangan</span>
            </label>
          </div>

          <div className="grid grid-cols-2 sm:flex sm:flex-wrap items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              onClick={handleDownloadPDF}
              className="col-span-2 sm:col-span-1 min-h-[44px] sm:min-h-0 px-4 py-2 rounded-xl text-xs font-bold bg-safety-orange hover:bg-safety-orange-hover text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileDown className="w-4 h-4 shrink-0" />
              <span>Unduh PDF (A4)</span>
            </button>
            <button
              type="button"
              onClick={handleDownloadHTML}
              className="min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl text-xs font-semibold bg-white hover:bg-warm-bg text-warm-text border border-warm-border transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <FileCode2 className="w-4 h-4 text-forest shrink-0" />
              <span>HTML Cetak</span>
            </button>
            <button
              type="button"
              onClick={handleDirectPrint}
              className="min-h-[44px] sm:min-h-0 px-3.5 py-2 rounded-xl text-xs font-bold bg-forest hover:bg-forest-light text-white transition-colors flex items-center justify-center gap-1.5 cursor-pointer whitespace-nowrap shrink-0"
            >
              <Printer className="w-4 h-4 shrink-0" />
              <span>Cetak Langsung</span>
            </button>
          </div>
        </div>

        {/* Kertas Pratinjau A4 */}
        <div className="p-4 sm:p-6 overflow-y-auto bg-warm-bg/70 print-sheet-wrapper">
          <div className="bg-white border border-warm-border rounded-xl p-5 sm:p-8 max-w-[820px] mx-auto space-y-5 print-sheet">
            {/* Kop Laporan */}
            <div className="bg-forest text-white rounded-xl px-5 py-4">
              <h2 className="font-mono font-bold text-base sm:text-lg tracking-tight">
                LAPORAN MONITORING ALAT BERAT 2026
              </h2>
              <p className="text-xs text-emerald-100 mt-0.5">
                Sistem Manajemen Ketersediaan (PA/MA/UA/EU), Konsumsi BBM &amp; Preventive Maintenance
              </p>
              <div className="mt-2.5 pt-2 border-t border-white/15 flex flex-wrap gap-x-4 gap-y-1 font-mono text-[11px] text-emerald-100/90 tabular-nums">
                <span>Periode: {appState.periodeAktif}</span>
                <span aria-hidden="true">·</span>
                <span>Harga Solar: {formatRupiah(appState.hargaSolarGlobal)}/L</span>
                <span aria-hidden="true">·</span>
                <span>Dicetak: {printDate}</span>
              </div>
            </div>

            {/* 5 KPI Ringkas */}
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
              <div className="bg-warm-panel border border-warm-border rounded-lg p-2.5">
                <div className="font-mono text-[10px] font-semibold text-warm-muted">Total Armada</div>
                <div className="font-mono font-bold text-base text-warm-text tabular-nums mt-0.5">
                  {summary.totalUnits} Unit
                </div>
                <div className="font-mono text-[10px] text-warm-muted tabular-nums">
                  {summary.countAktif} Aktif · {summary.countStandby} S · {summary.countBreakdown} BD
                </div>
              </div>
              <div className="bg-warm-panel border border-warm-border rounded-lg p-2.5">
                <div className="font-mono text-[10px] font-semibold text-warm-muted">Rata-rata PA</div>
                <div
                  className={`font-mono font-bold text-base tabular-nums mt-0.5 ${
                    summary.avgPA >= summary.avgTargetPA ? 'text-emerald-700' : 'text-red-700'
                  }`}
                >
                  {fmtDec1.format(summary.avgPA)}%
                </div>
                <div className="font-mono text-[10px] text-warm-muted tabular-nums">
                  Target {fmtDec1.format(summary.avgTargetPA)}%
                </div>
              </div>
              <div className="bg-warm-panel border border-warm-border rounded-lg p-2.5">
                <div className="font-mono text-[10px] font-semibold text-warm-muted">Total HM</div>
                <div className="font-mono font-bold text-base text-warm-text tabular-nums mt-0.5">
                  {formatHM(summary.sumHM)} jam
                </div>
                <div className="font-mono text-[10px] text-warm-muted tabular-nums">
                  Avg {fmtDec2.format(summary.avgFuelRatio)} L/HM
                </div>
              </div>
              <div className="bg-warm-panel border border-warm-border rounded-lg p-2.5">
                <div className="font-mono text-[10px] font-semibold text-warm-muted">Solar Terisi</div>
                <div className="font-mono font-bold text-base text-warm-text tabular-nums mt-0.5">
                  {fmtInt.format(summary.sumSolar)} L
                </div>
                <div className="font-mono text-[10px] font-semibold text-amber-900 tabular-nums">
                  {formatRupiah(summary.sumFuelCost)}
                </div>
              </div>
              <div className="bg-warm-panel border border-warm-border rounded-lg p-2.5">
                <div className="font-mono text-[10px] font-semibold text-warm-muted">Peringatan PM</div>
                <div
                  className={`font-mono font-bold text-base tabular-nums mt-0.5 ${
                    summary.overdueCount > 0 ? 'text-red-700' : 'text-emerald-700'
                  }`}
                >
                  {summary.overdueCount} Lewat
                </div>
                <div className="font-mono text-[10px] text-amber-800 tabular-nums">
                  {summary.soonCount} Segera Servis
                </div>
              </div>
            </div>

            {/* Tabel Rekapitulasi Armada */}
            <div className="space-y-2">
              <h3 className="font-mono font-bold text-xs text-forest">
                1. Rekapitulasi Operasional Armada ({appState.fleet.length} Unit)
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-[11px] tabular-nums">
                  <thead>
                    <tr className="bg-forest text-white font-mono">
                      <th className="py-2 px-2.5 border border-forest">Kode &amp; Model</th>
                      <th className="py-2 px-2 border border-forest">Status</th>
                      <th className="py-2 px-2 border border-forest text-right">PA%</th>
                      <th className="py-2 px-2 border border-forest text-right">MA%</th>
                      <th className="py-2 px-2 border border-forest text-right">UA%</th>
                      <th className="py-2 px-2 border border-forest text-right">EU%</th>
                      <th className="py-2 px-2 border border-forest text-right">HM Pakai</th>
                      <th className="py-2 px-2 border border-forest text-right">Fuel / Std</th>
                      <th className="py-2 px-2 border border-forest text-right">Biaya Solar</th>
                      <th className="py-2 px-2 border border-forest">Status PM</th>
                    </tr>
                  </thead>
                  <tbody>
                    {appState.fleet.map((u) => {
                      const m = computeUnitMetrics(u, appState.hargaSolarGlobal);
                      const pmText =
                        m.serviceState === 'OVERDUE'
                          ? `LEWAT ${formatHM(Math.abs(m.selisih))}j`
                          : m.serviceState === 'SOON'
                            ? `SEGERA ${formatHM(m.selisih)}j`
                            : `AMAN (${formatHM(m.selisih)}j)`;
                      const pmColor =
                        m.serviceState === 'OVERDUE'
                          ? 'text-red-700 font-bold'
                          : m.serviceState === 'SOON'
                            ? 'text-amber-800 font-bold'
                            : 'text-emerald-700 font-semibold';

                      return (
                        <tr key={u.id} className="odd:bg-white even:bg-warm-panel/45">
                          <td className="py-1.5 px-2.5 border border-warm-border">
                            <div className="font-mono font-bold text-warm-text">{u.kodeUnit}</div>
                            <div className="text-[10px] text-warm-muted">
                              {u.modelUnit} · {u.kategori}
                            </div>
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border font-mono">
                            {u.statusOperasi}
                          </td>
                          <td
                            className={`py-1.5 px-2 border border-warm-border text-right font-mono font-bold ${
                              m.pa < m.targetPA ? 'text-red-700' : 'text-emerald-700'
                            }`}
                          >
                            {fmtDec1.format(m.pa)}%
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border text-right font-mono">
                            {fmtDec1.format(m.ma)}%
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border text-right font-mono">
                            {fmtDec1.format(m.ua)}%
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border text-right font-mono">
                            {fmtDec1.format(m.eu)}%
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border text-right font-mono">
                            {formatHM(m.hmTerpakai)} HM
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border text-right font-mono">
                            <div>{fmtDec2.format(m.fuelRatio)} L/HM</div>
                            <div className="text-[10px] text-warm-muted">
                              Std {fmtDec1.format(m.stdFuel)}
                            </div>
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border text-right font-mono">
                            {formatRupiah(m.totalFuelCost)}
                          </td>
                          <td className="py-1.5 px-2 border border-warm-border font-mono">
                            <div className={pmColor}>{pmText}</div>
                            <div className="text-[10px] text-warm-muted">
                              Due HM {formatHM(m.dueHM)}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Rincian Unit Aktif */}
            {includeActiveUnitDetail && activeUnit && activeMetrics && (
              <div className="space-y-2.5 pt-1">
                <h3 className="font-mono font-bold text-xs text-forest">
                  2. Rincian Unit Aktif: {activeUnit.kodeUnit} — {activeUnit.modelUnit} (
                  {activeUnit.kategori})
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs font-mono border border-warm-border rounded-lg p-3 bg-warm-panel/40 tabular-nums">
                  <div>
                    <span className="text-warm-muted">Lokasi / Site: </span>
                    <strong className="text-warm-text">{activeUnit.site || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-warm-muted">Operator / PIC: </span>
                    <strong className="text-warm-text">{activeUnit.operator || '-'}</strong>
                  </div>
                  <div>
                    <span className="text-warm-muted">Jam W / S / R: </span>
                    <strong className="text-warm-text">
                      {formatHM(activeMetrics.W)} / {formatHM(activeMetrics.S)} /{' '}
                      {formatHM(activeMetrics.R)} jam
                    </strong>
                  </div>
                  <div>
                    <span className="text-warm-muted">PA / MA / UA / EU: </span>
                    <strong className="text-warm-text">
                      {fmtDec1.format(activeMetrics.pa)}% / {fmtDec1.format(activeMetrics.ma)}% /{' '}
                      {fmtDec1.format(activeMetrics.ua)}% / {fmtDec1.format(activeMetrics.eu)}%
                    </strong>
                  </div>
                  <div>
                    <span className="text-warm-muted">HM &amp; Solar: </span>
                    <strong className="text-warm-text">
                      {formatHM(activeMetrics.hmAwal)} → {formatHM(activeMetrics.hmAkhir)} (
                      {formatHM(activeMetrics.hmTerpakai)} HM) · {fmtInt.format(activeMetrics.solar)}{' '}
                      L
                    </strong>
                  </div>
                  <div>
                    <span className="text-warm-muted">Fuel Ratio &amp; Biaya: </span>
                    <strong className="text-warm-text">
                      {fmtDec2.format(activeMetrics.fuelRatio)} L/HM ({activeMetrics.fuelEfficiency}
                      ) · {formatRupiah(activeMetrics.totalFuelCost)}
                    </strong>
                  </div>
                </div>

                {activeUnit.logs.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="font-mono text-[11px] font-bold text-warm-text">
                      Riwayat Log &amp; Servis PM ({activeUnit.kodeUnit})
                    </div>
                    <table className="w-full text-left border-collapse text-[11px]">
                      <thead>
                        <tr className="bg-warm-panel font-mono text-warm-text">
                          <th className="py-1.5 px-2 border border-warm-border">Tipe</th>
                          <th className="py-1.5 px-2 border border-warm-border">Tanggal</th>
                          <th className="py-1.5 px-2 border border-warm-border">Ringkasan</th>
                          <th className="py-1.5 px-2 border border-warm-border">Catatan</th>
                        </tr>
                      </thead>
                      <tbody>
                        {activeUnit.logs.slice(0, 8).map((log) => (
                          <tr key={log.id}>
                            <td className="py-1.5 px-2 border border-warm-border font-mono font-bold">
                              {log.type === 'SERVICE' ? 'SERVIS PM' : 'LOG HARIAN'}
                            </td>
                            <td className="py-1.5 px-2 border border-warm-border font-mono tabular-nums">
                              {log.date}
                            </td>
                            <td className="py-1.5 px-2 border border-warm-border font-mono tabular-nums">
                              {log.summary}
                            </td>
                            <td className="py-1.5 px-2 border border-warm-border">
                              {log.note || '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            )}

            {/* Kolom Tanda Tangan */}
            {includeSignatures && (
              <div className="grid grid-cols-3 gap-6 pt-6 text-center text-xs">
                <div>
                  <div className="text-warm-muted">Dibuat Oleh,</div>
                  <div className="h-14 border-b border-warm-border mx-4 mb-1.5" />
                  <div className="font-bold text-warm-text">Admin Plant / Fleet</div>
                </div>
                <div>
                  <div className="text-warm-muted">Diperiksa Oleh,</div>
                  <div className="h-14 border-b border-warm-border mx-4 mb-1.5" />
                  <div className="font-bold text-warm-text">Kepala Workshop / Mekanik</div>
                </div>
                <div>
                  <div className="text-warm-muted">Disetujui Oleh,</div>
                  <div className="h-14 border-b border-warm-border mx-4 mb-1.5" />
                  <div className="font-bold text-warm-text">Project Manager</div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
