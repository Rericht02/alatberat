import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { FleetAppState, HeavyUnit } from '../types/fleet';
import {
  computeUnitMetrics,
  fmtDec1,
  fmtDec2,
  fmtInt,
  formatHM,
  formatRupiah,
} from './calculations';

export interface ReportOptions {
  includeActiveUnitDetail: boolean;
  includeSignatures: boolean;
}

interface PdfWithAutoTable extends jsPDF {
  lastAutoTable?: { finalY: number };
}

function getFormattedPrintDate(): string {
  return new Intl.DateTimeFormat('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date());
}

export function computeFleetSummary(state: FleetAppState) {
  const totalUnits = state.fleet.length;
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

  state.fleet.forEach((u) => {
    if (u.statusOperasi === 'Standby') countStandby++;
    else if (u.statusOperasi === 'Breakdown') countBreakdown++;
    else countAktif++;

    const m = computeUnitMetrics(u, state.hargaSolarGlobal);
    sumPA += m.pa;
    sumTargetPA += m.targetPA;
    sumHM += m.hmTerpakai;
    sumSolar += m.solar;
    sumFuelCost += m.totalFuelCost;

    if (m.serviceState === 'OVERDUE') overdueCount++;
    else if (m.serviceState === 'SOON') soonCount++;
  });

  return {
    totalUnits,
    countAktif,
    countStandby,
    countBreakdown,
    avgPA: totalUnits > 0 ? sumPA / totalUnits : 0,
    avgTargetPA: totalUnits > 0 ? sumTargetPA / totalUnits : 85,
    sumHM,
    avgFuelRatio: sumHM > 0 ? sumSolar / sumHM : 0,
    sumSolar,
    sumFuelCost,
    overdueCount,
    soonCount,
  };
}

export function downloadFleetReportPDF(
  state: FleetAppState,
  activeUnit: HeavyUnit | null,
  options: ReportOptions
): void {
  const doc = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  }) as PdfWithAutoTable;

  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = pageWidth - margin * 2;
  const summary = computeFleetSummary(state);
  const printDate = getFormattedPrintDate();

  // Header Banner (Forest Green)
  doc.setFillColor(17, 61, 35);
  doc.roundedRect(margin, margin, contentWidth, 24, 3, 3, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('MONITORING ALAT BERAT 2026', margin + 5, margin + 9);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(209, 250, 229);
  doc.text(
    'Laporan Ketersediaan Armada (PA/MA/UA/EU), Konsumsi BBM & Preventive Maintenance',
    margin + 5,
    margin + 14.5
  );

  doc.setFontSize(8);
  doc.text(
    `Periode: ${state.periodeAktif}   |   Harga Solar: ${formatRupiah(state.hargaSolarGlobal)}/L   |   Dicetak: ${printDate}`,
    margin + 5,
    margin + 20.5
  );

  // 5 KPI Summary Boxes
  let y = margin + 28;
  const kpiGap = 2.5;
  const kpiWidth = (contentWidth - kpiGap * 4) / 5;
  const kpiHeight = 18;

  const kpiItems = [
    {
      label: 'TOTAL ARMADA',
      value: `${summary.totalUnits} Unit`,
      sub: `${summary.countAktif} Aktif / ${summary.countStandby} S / ${summary.countBreakdown} BD`,
      valueColor: [24, 24, 27] as [number, number, number],
    },
    {
      label: 'RATA-RATA PA',
      value: `${fmtDec1.format(summary.avgPA)}%`,
      sub: `Target ${fmtDec1.format(summary.avgTargetPA)}%`,
      valueColor:
        summary.avgPA >= summary.avgTargetPA
          ? ([21, 128, 61] as [number, number, number])
          : ([185, 28, 28] as [number, number, number]),
    },
    {
      label: 'TOTAL HM TERPAKAI',
      value: `${formatHM(summary.sumHM)} jam`,
      sub: `Avg ${fmtDec2.format(summary.avgFuelRatio)} L/HM`,
      valueColor: [24, 24, 27] as [number, number, number],
    },
    {
      label: 'KONSUMSI SOLAR',
      value: `${fmtInt.format(summary.sumSolar)} L`,
      sub: formatRupiah(summary.sumFuelCost),
      valueColor: [146, 64, 14] as [number, number, number],
    },
    {
      label: 'PERINGATAN PM',
      value: `${summary.overdueCount} Lewat`,
      sub: `${summary.soonCount} Segera Servis`,
      valueColor:
        summary.overdueCount > 0
          ? ([185, 28, 28] as [number, number, number])
          : ([21, 128, 61] as [number, number, number]),
    },
  ];

  kpiItems.forEach((item, idx) => {
    const x = margin + idx * (kpiWidth + kpiGap);
    doc.setFillColor(247, 245, 240);
    doc.setDrawColor(216, 211, 200);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, y, kpiWidth, kpiHeight, 2, 2, 'FD');

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(82, 82, 91);
    doc.text(item.label, x + 2.5, y + 4.8);

    doc.setFontSize(10.5);
    doc.setTextColor(item.valueColor[0], item.valueColor[1], item.valueColor[2]);
    doc.text(item.value, x + 2.5, y + 11.2);

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(6.5);
    doc.setTextColor(82, 82, 91);
    doc.text(item.sub, x + 2.5, y + 15.8);
  });

  y += kpiHeight + 6;

  // Section 1: Tabel Rekapitulasi Armada
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(9.5);
  doc.setTextColor(17, 61, 35);
  doc.text(`1. REKAPITULASI OPERASIONAL ARMADA (${state.fleet.length} UNIT)`, margin, y);
  y += 2.5;

  const tableBody = state.fleet.map((u) => {
    const m = computeUnitMetrics(u, state.hargaSolarGlobal);
    const statusPM =
      m.serviceState === 'OVERDUE'
        ? `LEWAT ${formatHM(Math.abs(m.selisih))}j`
        : m.serviceState === 'SOON'
          ? `SEGERA ${formatHM(m.selisih)}j`
          : `AMAN (${formatHM(m.selisih)}j)`;

    return [
      `${u.kodeUnit}\n${u.modelUnit}`,
      u.statusOperasi,
      `${fmtDec1.format(m.pa)}%`,
      `${fmtDec1.format(m.ma)}%`,
      `${fmtDec1.format(m.ua)}%`,
      `${fmtDec1.format(m.eu)}%`,
      `${formatHM(m.hmTerpakai)} HM`,
      `${fmtDec2.format(m.fuelRatio)} / ${fmtDec1.format(m.stdFuel)}`,
      formatRupiah(m.totalFuelCost),
      `${statusPM}\nDue HM ${formatHM(m.dueHM)}`,
    ];
  });

  autoTable(doc, {
    startY: y,
    margin: { left: margin, right: margin },
    head: [
      [
        'Kode & Model',
        'Status',
        'PA%',
        'MA%',
        'UA%',
        'EU%',
        'HM Pakai',
        'Fuel/Std',
        'Biaya Solar',
        'Status PM',
      ],
    ],
    body: tableBody,
    theme: 'grid',
    styles: {
      fontSize: 7.2,
      cellPadding: 2,
      textColor: [24, 24, 27],
      lineColor: [216, 211, 200],
      lineWidth: 0.2,
      valign: 'middle',
    },
    headStyles: {
      fillColor: [17, 61, 35],
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 7.2,
    },
    alternateRowStyles: {
      fillColor: [250, 249, 246],
    },
    columnStyles: {
      0: { cellWidth: 30 },
      1: { cellWidth: 14, halign: 'center' },
      2: { cellWidth: 12, halign: 'right', fontStyle: 'bold' },
      3: { cellWidth: 11, halign: 'right' },
      4: { cellWidth: 11, halign: 'right' },
      5: { cellWidth: 11, halign: 'right' },
      6: { cellWidth: 16, halign: 'right' },
      7: { cellWidth: 20, halign: 'right' },
      8: { cellWidth: 26, halign: 'right' },
      9: { cellWidth: 35 },
    },
    didParseCell: (data) => {
      if (data.section !== 'body') return;
      const u = state.fleet[data.row.index];
      if (!u) return;
      const m = computeUnitMetrics(u, state.hargaSolarGlobal);
      if (data.column.index === 2) {
        data.cell.styles.textColor =
          m.pa < m.targetPA ? [185, 28, 28] : [21, 128, 61];
      }
      if (data.column.index === 9) {
        if (m.serviceState === 'OVERDUE') {
          data.cell.styles.textColor = [185, 28, 28];
          data.cell.styles.fontStyle = 'bold';
        } else if (m.serviceState === 'SOON') {
          data.cell.styles.textColor = [180, 83, 9];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [21, 128, 61];
        }
      }
    },
  });

  y = (doc.lastAutoTable?.finalY ?? y + 40) + 7;

  // Section 2: Detail Unit Aktif & Riwayat Log
  if (options.includeActiveUnitDetail && activeUnit) {
    const m = computeUnitMetrics(activeUnit, state.hargaSolarGlobal);
    if (y > pageHeight - 75) {
      doc.addPage();
      y = margin + 4;
    }

    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9.5);
    doc.setTextColor(17, 61, 35);
    doc.text(
      `2. RINCIAN UNIT AKTIF: ${activeUnit.kodeUnit} — ${activeUnit.modelUnit} (${activeUnit.kategori})`,
      margin,
      y
    );
    y += 2.5;

    const statusPMDetail =
      m.serviceState === 'OVERDUE'
        ? `LEWAT ${formatHM(Math.abs(m.selisih))} jam (Due HM ${formatHM(m.dueHM)})`
        : m.serviceState === 'SOON'
          ? `SEGERA dalam ${formatHM(m.selisih)} jam (Due HM ${formatHM(m.dueHM)})`
          : `AMAN — sisa ${formatHM(m.selisih)} jam (Due HM ${formatHM(m.dueHM)})`;

    autoTable(doc, {
      startY: y,
      margin: { left: margin, right: margin },
      theme: 'grid',
      styles: {
        fontSize: 7.5,
        cellPadding: 2.2,
        textColor: [24, 24, 27],
        lineColor: [216, 211, 200],
        lineWidth: 0.2,
      },
      body: [
        [
          { content: 'Lokasi / Site', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          activeUnit.site || '-',
          { content: 'Operator / PIC', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          activeUnit.operator || '-',
        ],
        [
          { content: 'Jam Operasi (W / S / R)', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          `${formatHM(m.W)} / ${formatHM(m.S)} / ${formatHM(m.R)} jam (Total ${formatHM(m.totalWSR)} jam)`,
          { content: 'Ketersediaan PA / MA / UA / EU', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          `${fmtDec1.format(m.pa)}% / ${fmtDec1.format(m.ma)}% / ${fmtDec1.format(m.ua)}% / ${fmtDec1.format(m.eu)}% (Target PA ${fmtInt.format(m.targetPA)}%)`,
        ],
        [
          { content: 'Hour Meter & Solar', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          `HM ${formatHM(m.hmAwal)} -> ${formatHM(m.hmAkhir)} (${formatHM(m.hmTerpakai)} HM) | ${fmtInt.format(m.solar)} L`,
          { content: 'Fuel Ratio & Biaya BBM', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          `${fmtDec2.format(m.fuelRatio)} L/HM (${m.fuelEfficiency}) | ${formatRupiah(m.totalFuelCost)}`,
        ],
        [
          { content: 'Jadwal Preventive Maintenance', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          `${activeUnit.jenisPM} | Servis Terakhir HM ${formatHM(m.hmServis)} | Interval ${formatHM(m.interval)} jam`,
          { content: 'Status Servis PM', styles: { fontStyle: 'bold', fillColor: [247, 245, 240] } },
          statusPMDetail,
        ],
      ],
      columnStyles: {
        0: { cellWidth: 40 },
        1: { cellWidth: 53 },
        2: { cellWidth: 42 },
        3: { cellWidth: 51 },
      },
    });

    y = (doc.lastAutoTable?.finalY ?? y + 30) + 5;

    if (activeUnit.logs.length > 0) {
      if (y > pageHeight - 48) {
        doc.addPage();
        y = margin + 4;
      }
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8.5);
      doc.setTextColor(24, 24, 27);
      doc.text(`Riwayat Log & Servis PM (${activeUnit.kodeUnit})`, margin, y);
      y += 2;

      autoTable(doc, {
        startY: y,
        margin: { left: margin, right: margin },
        head: [['Tipe', 'Tanggal', 'Ringkasan Aktivitas', 'Catatan']],
        body: activeUnit.logs.slice(0, 8).map((log) => [
          log.type === 'SERVICE' ? 'SERVIS PM' : 'LOG HARIAN',
          log.date,
          log.summary,
          log.note || '-',
        ]),
        theme: 'grid',
        styles: {
          fontSize: 7.2,
          cellPadding: 2,
          lineColor: [216, 211, 200],
          lineWidth: 0.2,
        },
        headStyles: {
          fillColor: [247, 245, 240],
          textColor: [24, 24, 27],
          fontStyle: 'bold',
        },
        columnStyles: {
          0: { cellWidth: 22, fontStyle: 'bold' },
          1: { cellWidth: 22 },
          2: { cellWidth: 74 },
          3: { cellWidth: 68 },
        },
      });

      y = (doc.lastAutoTable?.finalY ?? y + 20) + 7;
    }
  }

  // Section 3: Kolom Tanda Tangan
  if (options.includeSignatures) {
    if (y > pageHeight - 36) {
      doc.addPage();
      y = margin + 10;
    } else {
      y += 4;
    }

    const colW = contentWidth / 3;
    const roles = ['Dibuat Oleh,', 'Diperiksa Oleh,', 'Disetujui Oleh,'];
    const titles = ['Admin Plant / Fleet', 'Kepala Workshop / Mekanik', 'Project Manager'];

    roles.forEach((role, idx) => {
      const cx = margin + colW * idx + colW / 2;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.setTextColor(82, 82, 91);
      doc.text(role, cx, y, { align: 'center' });

      doc.setDrawColor(161, 161, 170);
      doc.setLineWidth(0.3);
      doc.line(cx - 22, y + 20, cx + 22, y + 20);

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(8);
      doc.setTextColor(24, 24, 27);
      doc.text(titles[idx], cx, y + 24.5, { align: 'center' });
    });
  }

  // Footer nomor halaman
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(7.5);
    doc.setTextColor(113, 113, 122);
    doc.text(
      `Monitoring Alat Berat 2026 — Periode ${state.periodeAktif}`,
      margin,
      pageHeight - 6
    );
    doc.text(`Halaman ${i} dari ${pageCount}`, pageWidth - margin, pageHeight - 6, {
      align: 'right',
    });
  }

  const dateStr = new Date().toISOString().slice(0, 10);
  doc.save(`Laporan_Alat_Berat_2026_${dateStr}.pdf`);
}

function escapeHtml(str: string): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

export function downloadPrintableHTML(
  state: FleetAppState,
  activeUnit: HeavyUnit | null,
  options: ReportOptions
): void {
  const summary = computeFleetSummary(state);
  const printDate = getFormattedPrintDate();

  const fleetRowsHtml = state.fleet
    .map((u) => {
      const m = computeUnitMetrics(u, state.hargaSolarGlobal);
      const pmLabel =
        m.serviceState === 'OVERDUE'
          ? `<span style="color:#b91c1c;font-weight:700;">LEWAT ${formatHM(Math.abs(m.selisih))}j</span>`
          : m.serviceState === 'SOON'
            ? `<span style="color:#b45309;font-weight:700;">SEGERA ${formatHM(m.selisih)}j</span>`
            : `<span style="color:#15803d;font-weight:700;">AMAN (${formatHM(m.selisih)}j)</span>`;

      return `
        <tr>
          <td><strong>${escapeHtml(u.kodeUnit)}</strong><br><span style="color:#52525b;font-size:10px;">${escapeHtml(u.modelUnit)} · ${escapeHtml(u.kategori)}</span></td>
          <td>${escapeHtml(u.statusOperasi)}</td>
          <td style="text-align:right;font-weight:700;color:${m.pa < m.targetPA ? '#b91c1c' : '#15803d'};">${fmtDec1.format(m.pa)}%</td>
          <td style="text-align:right;">${fmtDec1.format(m.ma)}%</td>
          <td style="text-align:right;">${fmtDec1.format(m.ua)}%</td>
          <td style="text-align:right;">${fmtDec1.format(m.eu)}%</td>
          <td style="text-align:right;">${formatHM(m.hmTerpakai)} HM</td>
          <td style="text-align:right;">${fmtDec2.format(m.fuelRatio)} L/HM<br><span style="color:#71717a;font-size:9px;">Std ${fmtDec1.format(m.stdFuel)}</span></td>
          <td style="text-align:right;">${formatRupiah(m.totalFuelCost)}</td>
          <td>${pmLabel}<br><span style="color:#71717a;font-size:9px;">Due HM ${formatHM(m.dueHM)}</span></td>
        </tr>
      `;
    })
    .join('');

  const detailSectionHtml =
    options.includeActiveUnitDetail && activeUnit
      ? (() => {
          const m = computeUnitMetrics(activeUnit, state.hargaSolarGlobal);
          const logsHtml = activeUnit.logs
            .slice(0, 8)
            .map(
              (l) => `
              <tr>
                <td><strong>${l.type === 'SERVICE' ? 'SERVIS PM' : 'LOG HARIAN'}</strong></td>
                <td>${escapeHtml(l.date)}</td>
                <td>${escapeHtml(l.summary)}</td>
                <td>${escapeHtml(l.note || '-')}</td>
              </tr>`
            )
            .join('');

          return `
            <h2>2. Rincian Unit Aktif: ${escapeHtml(activeUnit.kodeUnit)} — ${escapeHtml(activeUnit.modelUnit)}</h2>
            <table>
              <tbody>
                <tr>
                  <th style="width:22%;">Lokasi / Site</th><td>${escapeHtml(activeUnit.site || '-')}</td>
                  <th style="width:22%;">Operator / PIC</th><td>${escapeHtml(activeUnit.operator || '-')}</td>
                </tr>
                <tr>
                  <th>Jam W / S / R</th><td>${formatHM(m.W)} / ${formatHM(m.S)} / ${formatHM(m.R)} jam (Total ${formatHM(m.totalWSR)} jam)</td>
                  <th>PA / MA / UA / EU</th><td>${fmtDec1.format(m.pa)}% / ${fmtDec1.format(m.ma)}% / ${fmtDec1.format(m.ua)}% / ${fmtDec1.format(m.eu)}%</td>
                </tr>
                <tr>
                  <th>HM &amp; Solar</th><td>HM ${formatHM(m.hmAwal)} → ${formatHM(m.hmAkhir)} (${formatHM(m.hmTerpakai)} HM) · ${fmtInt.format(m.solar)} L</td>
                  <th>Fuel Ratio &amp; Biaya</th><td>${fmtDec2.format(m.fuelRatio)} L/HM (${m.fuelEfficiency}) · ${formatRupiah(m.totalFuelCost)}</td>
                </tr>
              </tbody>
            </table>
            ${
              logsHtml
                ? `<h3 style="margin-top:14px;font-size:12px;">Riwayat Log &amp; Servis PM (${escapeHtml(activeUnit.kodeUnit)})</h3>
                   <table><thead><tr><th>Tipe</th><th>Tanggal</th><th>Ringkasan</th><th>Catatan</th></tr></thead><tbody>${logsHtml}</tbody></table>`
                : ''
            }
          `;
        })()
      : '';

  const signatureHtml = options.includeSignatures
    ? `
      <div class="sig-grid">
        <div class="sig-box"><div>Dibuat Oleh,</div><div class="sig-line"></div><strong>Admin Plant / Fleet</strong></div>
        <div class="sig-box"><div>Diperiksa Oleh,</div><div class="sig-line"></div><strong>Kepala Workshop / Mekanik</strong></div>
        <div class="sig-box"><div>Disetujui Oleh,</div><div class="sig-line"></div><strong>Project Manager</strong></div>
      </div>`
    : '';

  const html = `<!doctype html>
<html lang="id">
<head>
  <meta charset="UTF-8" />
  <title>Laporan Monitoring Alat Berat 2026 — ${escapeHtml(state.periodeAktif)}</title>
  <style>
    @page { size: A4 portrait; margin: 12mm; }
    * { box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #18181b; margin: 0; padding: 20px; background: #f4f4f1; font-size: 11px; }
    .toolbar { max-width: 210mm; margin: 0 auto 14px; display: flex; justify-content: flex-end; gap: 8px; }
    .btn { background: #113D23; color: #fff; border: none; padding: 9px 16px; border-radius: 8px; font-weight: 700; cursor: pointer; font-size: 12px; }
    .sheet { max-width: 210mm; margin: 0 auto; background: #fff; padding: 14mm; border: 1px solid #d8d3c8; border-radius: 8px; }
    .header { background: #113D23; color: #fff; padding: 14px 18px; border-radius: 8px; margin-bottom: 14px; }
    .header h1 { margin: 0; font-size: 16px; letter-spacing: -0.01em; }
    .header p { margin: 4px 0 0; color: #d1fae5; font-size: 11px; }
    .kpi-grid { display: grid; grid-template-columns: repeat(5, 1fr); gap: 8px; margin-bottom: 16px; }
    .kpi { background: #f7f5f0; border: 1px solid #d8d3c8; border-radius: 6px; padding: 8px; }
    .kpi-label { font-size: 9px; font-weight: 700; color: #52525b; text-transform: uppercase; }
    .kpi-val { font-size: 14px; font-weight: 700; margin: 3px 0; font-variant-numeric: tabular-nums; }
    .kpi-sub { font-size: 9px; color: #52525b; }
    h2 { font-size: 12px; color: #113D23; margin: 16px 0 6px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; font-variant-numeric: tabular-nums; }
    th, td { border: 1px solid #d8d3c8; padding: 5px 6px; text-align: left; vertical-align: top; }
    thead th { background: #113D23; color: #fff; font-size: 10px; }
    tbody th { background: #f7f5f0; font-size: 10px; }
    .sig-grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-top: 28px; text-align: center; }
    .sig-line { border-bottom: 1px solid #a1a1aa; height: 48px; margin: 0 18px 6px; }
    @media print {
      body { background: #fff; padding: 0; }
      .toolbar { display: none; }
      .sheet { border: none; padding: 0; border-radius: 0; max-width: 100%; }
      .header, thead th, .kpi { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    }
  </style>
</head>
<body>
  <div class="toolbar">
    <button class="btn" onclick="window.print()">Cetak / Simpan sebagai PDF</button>
  </div>
  <div class="sheet">
    <div class="header">
      <h1>MONITORING ALAT BERAT 2026</h1>
      <p>Periode: ${escapeHtml(state.periodeAktif)} · Harga Solar: ${formatRupiah(state.hargaSolarGlobal)}/L · Dicetak: ${escapeHtml(printDate)}</p>
    </div>
    <div class="kpi-grid">
      <div class="kpi"><div class="kpi-label">Total Armada</div><div class="kpi-val">${summary.totalUnits} Unit</div><div class="kpi-sub">${summary.countAktif} Aktif · ${summary.countStandby} S · ${summary.countBreakdown} BD</div></div>
      <div class="kpi"><div class="kpi-label">Rata-rata PA</div><div class="kpi-val" style="color:${summary.avgPA >= summary.avgTargetPA ? '#15803d' : '#b91c1c'};">${fmtDec1.format(summary.avgPA)}%</div><div class="kpi-sub">Target ${fmtDec1.format(summary.avgTargetPA)}%</div></div>
      <div class="kpi"><div class="kpi-label">Total HM</div><div class="kpi-val">${formatHM(summary.sumHM)} jam</div><div class="kpi-sub">Avg ${fmtDec2.format(summary.avgFuelRatio)} L/HM</div></div>
      <div class="kpi"><div class="kpi-label">Solar</div><div class="kpi-val">${fmtInt.format(summary.sumSolar)} L</div><div class="kpi-sub">${formatRupiah(summary.sumFuelCost)}</div></div>
      <div class="kpi"><div class="kpi-label">Peringatan PM</div><div class="kpi-val" style="color:${summary.overdueCount > 0 ? '#b91c1c' : '#15803d'};">${summary.overdueCount} Lewat</div><div class="kpi-sub">${summary.soonCount} Segera Servis</div></div>
    </div>
    <h2>1. Rekapitulasi Operasional Armada (${state.fleet.length} Unit)</h2>
    <table>
      <thead>
        <tr>
          <th>Kode &amp; Model</th><th>Status</th><th style="text-align:right;">PA%</th><th style="text-align:right;">MA%</th><th style="text-align:right;">UA%</th><th style="text-align:right;">EU%</th><th style="text-align:right;">HM Pakai</th><th style="text-align:right;">Fuel / Std</th><th style="text-align:right;">Biaya Solar</th><th>Status PM</th>
        </tr>
      </thead>
      <tbody>${fleetRowsHtml}</tbody>
    </table>
    ${detailSectionHtml}
    ${signatureHtml}
  </div>
</body>
</html>`;

  const blob = new Blob([html], { type: 'text/html;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `Laporan_Cetak_Alat_Berat_2026_${dateStr}.html`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
