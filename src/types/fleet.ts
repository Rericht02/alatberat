export type UnitCategory =
  | 'Excavator'
  | 'Dump Truck'
  | 'Bulldozer'
  | 'Wheel Loader'
  | 'Motor Grader'
  | 'Compactor'
  | 'Lainnya';

export type OperationStatus = 'Aktif' | 'Standby' | 'Breakdown';

export type ServiceState = 'OVERDUE' | 'SOON' | 'SAFE';

export type FuelEfficiency = 'HEMAT' | 'NORMAL' | 'BOROS' | 'STANDBY';

export type ServiceFilterValue = 'ALL' | 'NEED_SERVICE' | 'OVERDUE' | 'SOON' | 'SAFE';

export type PresetKey =
  | 'EXCAVATOR'
  | 'DUMP_TRUCK'
  | 'BULLDOZER'
  | 'WHEEL_LOADER'
  | 'MOTOR_GRADER'
  | 'COMPACTOR'
  | 'CUSTOM';

export interface UnitLog {
  id: string;
  type: 'DAILY' | 'SERVICE';
  date: string;
  summary: string;
  note: string;
}

export interface HeavyUnit {
  id: string;
  kodeUnit: string;
  kategori: UnitCategory;
  modelUnit: string;
  site: string;
  operator: string;
  statusOperasi: OperationStatus;
  W: number;
  S: number;
  R: number;
  targetPA: number;
  hmAwal: number;
  hmAkhir: number;
  solar: number;
  stdFuel: number;
  hmServis: number;
  interval: number;
  batasSegera: number;
  jenisPM: string;
  logs: UnitLog[];
}

export interface FleetAppState {
  periodeAktif: string;
  hargaSolarGlobal: number;
  activeUnitId: string;
  fleet: HeavyUnit[];
}

export interface UnitMetrics {
  W: number;
  S: number;
  R: number;
  totalWSR: number;
  targetPA: number;
  pa: number;
  ma: number;
  ua: number;
  eu: number;
  hmAwal: number;
  hmAkhir: number;
  isHMInvalid: boolean;
  hmTerpakai: number;
  solar: number;
  stdFuel: number;
  hargaSolar: number;
  fuelRatio: number;
  totalFuelCost: number;
  costPerHM: number;
  fuelEfficiency: FuelEfficiency;
  hmServis: number;
  interval: number;
  batasSegera: number;
  dueHM: number;
  selisih: number;
  intervalProgressPct: number;
  serviceState: ServiceState;
}

export interface UnitPreset {
  key: PresetKey;
  label: string;
  fuelHint: string;
  kategori: UnitCategory;
  prefix: string;
  model: string;
  interval: number;
  batasSegera: number;
  stdFuel: number;
  targetPA: number;
  jenisPM: string;
}

export type ToastType = 'success' | 'warning' | 'error';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

export interface ConfirmDialogState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  isDanger: boolean;
  onConfirm: () => void;
}
