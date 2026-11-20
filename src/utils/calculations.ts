import { createDefaultState, STORAGE_KEY, UNIT_CATEGORIES } from '../data/presets';
import type {
  FleetAppState,
  FuelEfficiency,
  HeavyUnit,
  OperationStatus,
  ServiceState,
  UnitCategory,
  UnitMetrics,
} from '../types/fleet';

export const fmtDec1 = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 1,
  maximumFractionDigits: 1,
});

export const fmtDec2 = new Intl.NumberFormat('id-ID', {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

export const fmtInt = new Intl.NumberFormat('id-ID', {
  maximumFractionDigits: 0,
});

export function formatRupiah(num: number): string {
  const safe = Number.isFinite(num) ? Math.round(num) : 0;
  return 'Rp ' + fmtInt.format(safe);
}

export function formatHM(num: number): string {
  const safe = Number.isFinite(num) ? num : 0;
  return Number.isInteger(safe) ? fmtInt.format(safe) : fmtDec1.format(safe);
}

export function clampPercent(val: number): number {
  if (!Number.isFinite(val)) return 0;
  return Math.max(0, Math.min(100, val));
}

export function safeNum(val: unknown, fallback = 0): number {
  const parsed = typeof val === 'number' ? val : parseFloat(String(val ?? ''));
  return Number.isFinite(parsed) ? parsed : fallback;
}

export function computeUnitMetrics(unit: HeavyUnit, hargaSolarGlobal: number): UnitMetrics {
  const W = Math.max(0, safeNum(unit.W, 0));
  const S = Math.max(0, safeNum(unit.S, 0));
  const R = Math.max(0, safeNum(unit.R, 0));
  const targetPA = clampPercent(safeNum(unit.targetPA, 85));

  const totalWSR = W + S + R;
  const totalWR = W + R;
  const totalWS = W + S;

  const pa = totalWSR > 0 ? ((W + S) / totalWSR) * 100 : 0;
  const ma = totalWR > 0 ? (W / totalWR) * 100 : 0;
  const ua = totalWS > 0 ? (W / totalWS) * 100 : 0;
  const eu = totalWSR > 0 ? (W / totalWSR) * 100 : 0;

  const hmAwal = Math.max(0, safeNum(unit.hmAwal, 0));
  const hmAkhir = Math.max(0, safeNum(unit.hmAkhir, 0));
  const isHMInvalid = hmAkhir < hmAwal;
  const hmTerpakai = Math.max(0, hmAkhir - hmAwal);

  const solar = Math.max(0, safeNum(unit.solar, 0));
  const stdFuel = Math.max(0.1, safeNum(unit.stdFuel, 15));
  const hargaSolar = Math.max(0, safeNum(hargaSolarGlobal, 15000));

  const fuelRatio = hmTerpakai > 0 ? solar / hmTerpakai : 0;
  const totalFuelCost = solar * hargaSolar;
  const costPerHM = hmTerpakai > 0 ? totalFuelCost / hmTerpakai : 0;

  let fuelEfficiency: FuelEfficiency = 'NORMAL';
  if (hmTerpakai === 0 || solar === 0) {
    fuelEfficiency = 'STANDBY';
  } else if (fuelRatio <= stdFuel * 0.95) {
    fuelEfficiency = 'HEMAT';
  } else if (fuelRatio > stdFuel * 1.05) {
    fuelEfficiency = 'BOROS';
  }

  const hmServis = Math.max(0, safeNum(unit.hmServis, 0));
  const interval = Math.max(1, safeNum(unit.interval, 250));
  const batasSegera = Math.max(0, safeNum(unit.batasSegera, 50));

  const dueHM = hmServis + interval;
  const selisih = dueHM - hmAkhir;
  const hmSejakServis = Math.max(0, hmAkhir - hmServis);
  const intervalProgressPct = (hmSejakServis / interval) * 100;

  let serviceState: ServiceState = 'SAFE';
  if (hmAkhir > dueHM) {
    serviceState = 'OVERDUE';
  } else if (selisih <= batasSegera) {
    serviceState = 'SOON';
  }

  return {
    W,
    S,
    R,
    totalWSR,
    targetPA,
    pa,
    ma,
    ua,
    eu,
    hmAwal,
    hmAkhir,
    isHMInvalid,
    hmTerpakai,
    solar,
    stdFuel,
    hargaSolar,
    fuelRatio,
    totalFuelCost,
    costPerHM,
    fuelEfficiency,
    hmServis,
    interval,
    batasSegera,
    dueHM,
    selisih,
    intervalProgressPct,
    serviceState,
  };
}

export function generateNextUnitCode(fleet: HeavyUnit[], prefix: string): string {
  const cleanPrefix = (prefix || 'UN').toUpperCase().replace(/[^A-Z0-9]/g, '') || 'UN';
  let maxNum = 0;
  const regex = new RegExp(`^${cleanPrefix}-(\\d+)$`, 'i');

  fleet.forEach((u) => {
    const match = u.kodeUnit.trim().match(regex);
    if (match) {
      const num = parseInt(match[1], 10);
      if (num > maxNum) maxNum = num;
    }
  });

  return `${cleanPrefix}-${String(maxNum + 1).padStart(2, '0')}`;
}

function normalizeCategory(val: unknown): UnitCategory {
  const str = String(val ?? 'Excavator') as UnitCategory;
  return UNIT_CATEGORIES.includes(str) ? str : 'Lainnya';
}

function normalizeStatus(val: unknown): OperationStatus {
  if (val === 'Standby' || val === 'Breakdown' || val === 'Aktif') return val;
  return 'Aktif';
}

export function sanitizeState(raw: unknown): FleetAppState {
  const parsed = raw as Partial<FleetAppState> | null;
  if (!parsed || !Array.isArray(parsed.fleet) || parsed.fleet.length === 0) {
    return createDefaultState();
  }

  const sanitizedFleet: HeavyUnit[] = parsed.fleet.map((u, idx) => ({
    id: u.id || `unit-restored-${idx}-${Date.now()}`,
    kodeUnit: String(u.kodeUnit || `UNIT-${idx + 1}`).toUpperCase(),
    kategori: normalizeCategory(u.kategori),
    modelUnit: u.modelUnit || 'Alat Berat',
    site: u.site || 'Site Utama',
    operator: u.operator || '-',
    statusOperasi: normalizeStatus(u.statusOperasi),
    W: Math.max(0, safeNum(u.W, 0)),
    S: Math.max(0, safeNum(u.S, 0)),
    R: Math.max(0, safeNum(u.R, 0)),
    targetPA: clampPercent(safeNum(u.targetPA, 85)),
    hmAwal: Math.max(0, safeNum(u.hmAwal, 0)),
    hmAkhir: Math.max(0, safeNum(u.hmAkhir, 0)),
    solar: Math.max(0, safeNum(u.solar, 0)),
    stdFuel: Math.max(0.1, safeNum(u.stdFuel, 15)),
    hmServis: Math.max(0, safeNum(u.hmServis, 0)),
    interval: Math.max(1, safeNum(u.interval, 250)),
    batasSegera: Math.max(0, safeNum(u.batasSegera, 50)),
    jenisPM: u.jenisPM || 'PM-250',
    logs: Array.isArray(u.logs)
      ? u.logs.map((l, lIdx) => ({
          id: l.id || `log-${idx}-${lIdx}`,
          type: l.type === 'SERVICE' ? 'SERVICE' : 'DAILY',
          date: String(l.date || ''),
          summary: String(l.summary || ''),
          note: String(l.note || ''),
        }))
      : [],
  }));

  const activeUnitId = sanitizedFleet.some((u) => u.id === parsed.activeUnitId)
    ? String(parsed.activeUnitId)
    : sanitizedFleet[0].id;

  return {
    periodeAktif: parsed.periodeAktif || 'November 2026',
    hargaSolarGlobal: Math.max(0, safeNum(parsed.hargaSolarGlobal, 15000)),
    activeUnitId,
    fleet: sanitizedFleet,
  };
}

export function loadStateFromStorage(): FleetAppState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultState();
    return sanitizeState(JSON.parse(raw));
  } catch {
    return createDefaultState();
  }
}

export function exportFleetToCSV(state: FleetAppState): boolean {
  if (!state.fleet.length) return false;

  const sep = ';';
  const headers = [
    'Periode',
    'Kode Unit',
    'Kategori',
    'Model Alat',
    'Lokasi/Site',
    'Operator/PIC',
    'Status Operasi',
    'Working W (Jam)',
    'Standby S (Jam)',
    'Repair R (Jam)',
    'Target PA (%)',
    'PA (%)',
    'MA (%)',
    'UA (%)',
    'EU (%)',
    'HM Awal',
    'HM Akhir',
    'HM Terpakai',
    'Solar Terisi (L)',
    'Standar Solar (L/HM)',
    'Fuel Ratio (L/HM)',
    'Harga Solar/L (Rp)',
    'Total Biaya Solar (Rp)',
    'Biaya BBM/HM (Rp)',
    'HM Servis Terakhir',
    'Interval Servis (Jam)',
    'Due HM',
    'Selisih Jam Servis',
    'Status Servis PM',
  ];

  const rows = state.fleet.map((u) => {
    const m = computeUnitMetrics(u, state.hargaSolarGlobal);
    const statusPM =
      m.serviceState === 'OVERDUE'
        ? `LEWAT ${Math.abs(m.selisih)} jam`
        : m.serviceState === 'SOON'
          ? `SEGERA (${m.selisih} jam)`
          : `AMAN (sisa ${m.selisih} jam)`;

    return [
      state.periodeAktif,
      u.kodeUnit,
      u.kategori,
      u.modelUnit,
      u.site,
      u.operator,
      u.statusOperasi,
      m.W,
      m.S,
      m.R,
      m.targetPA,
      m.pa.toFixed(1).replace('.', ','),
      m.ma.toFixed(1).replace('.', ','),
      m.ua.toFixed(1).replace('.', ','),
      m.eu.toFixed(1).replace('.', ','),
      m.hmAwal,
      m.hmAkhir,
      m.hmTerpakai,
      m.solar,
      m.stdFuel.toFixed(1).replace('.', ','),
      m.fuelRatio.toFixed(2).replace('.', ','),
      Math.round(m.hargaSolar),
      Math.round(m.totalFuelCost),
      Math.round(m.costPerHM),
      m.hmServis,
      m.interval,
      m.dueHM,
      m.selisih,
      statusPM,
    ]
      .map((val) => `"${String(val ?? '').replace(/"/g, '""')}"`)
      .join(sep);
  });

  const csvContent = '\uFEFF' + [headers.join(sep), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `Monitoring_Alat_Berat_2026_${dateStr}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
  return true;
}

export function backupFleetToJSON(state: FleetAppState): void {
  const payload = {
    application: 'Monitoring Alat Berat 2026',
    version: '1.0',
    exportedAt: new Date().toISOString(),
    data: state,
  };
  const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.setAttribute('download', `Backup_Armada_2026_${dateStr}.json`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
