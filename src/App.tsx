import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AddUnitModal } from './components/AddUnitModal';
import { ConfirmModal } from './components/ConfirmModal';
import { DailyLogModal, type DailyLogPayload } from './components/DailyLogModal';
import { FleetHeader } from './components/FleetHeader';
import { FleetSummaryKpis } from './components/FleetSummaryKpis';
import { FleetTable } from './components/FleetTable';
import { MobileBottomNav, type MobileTab } from './components/MobileBottomNav';
import { PrintReportModal } from './components/PrintReportModal';
import {
  ServiceCompleteModal,
  type ServiceCompletePayload,
} from './components/ServiceCompleteModal';
import { ToastContainer } from './components/ToastContainer';
import { UnitDetailPanel } from './components/UnitDetailPanel';
import { createDefaultState, STORAGE_KEY } from './data/presets';
import type {
  ConfirmDialogState,
  FleetAppState,
  HeavyUnit,
  ServiceFilterValue,
  ToastItem,
  ToastType,
} from './types/fleet';
import {
  backupFleetToJSON,
  computeUnitMetrics,
  exportFleetToCSV,
  fmtDec1,
  fmtInt,
  formatHM,
  generateNextUnitCode,
  loadStateFromStorage,
  sanitizeState,
} from './utils/calculations';

export default function App() {
  const [appState, setAppState] = useState<FleetAppState>(() => loadStateFromStorage());
  const [saveStatus, setSaveStatus] = useState<string>('Tersimpan Otomatis');
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmDialog, setConfirmDialog] = useState<ConfirmDialogState | null>(null);

  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState<ServiceFilterValue>('ALL');

  const [isAddUnitOpen, setIsAddUnitOpen] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);
  const [dailyLogUnitId, setDailyLogUnitId] = useState<string | null>(null);
  const [serviceModalUnitId, setServiceModalUnitId] = useState<string | null>(null);
  const [mobileTab, setMobileTab] = useState<MobileTab>('armada');

  const restoreInputRef = useRef<HTMLInputElement | null>(null);
  const saveTimerRef = useRef<number | null>(null);
  const isFirstRender = useRef(true);

  const showToast = useCallback((message: string, type: ToastType = 'success') => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    setToasts((prev) => [...prev, { id, message, type }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((item) => item.id !== id));
    }, 3400);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(appState));
      setSaveStatus('Menyimpan...');
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
      saveTimerRef.current = window.setTimeout(() => {
        setSaveStatus('Tersimpan Otomatis');
      }, 400);
    } catch {
      setSaveStatus('Gagal Simpan Lokal');
      showToast('Peringatan: Penyimpanan lokal penuh atau diblokir browser.', 'error');
    }
    return () => {
      if (saveTimerRef.current) window.clearTimeout(saveTimerRef.current);
    };
  }, [appState, showToast]);

  const activeUnit = useMemo(() => {
    return (
      appState.fleet.find((u) => u.id === appState.activeUnitId) ??
      appState.fleet[0] ??
      null
    );
  }, [appState.fleet, appState.activeUnitId]);

  const dailyLogUnit = useMemo(
    () => appState.fleet.find((u) => u.id === dailyLogUnitId) ?? null,
    [appState.fleet, dailyLogUnitId]
  );

  const serviceModalUnit = useMemo(
    () => appState.fleet.find((u) => u.id === serviceModalUnitId) ?? null,
    [appState.fleet, serviceModalUnitId]
  );

  const serviceAlertCount = useMemo(() => {
    return appState.fleet.reduce((acc, unit) => {
      const m = computeUnitMetrics(unit, appState.hargaSolarGlobal);
      return acc + (m.serviceState === 'OVERDUE' || m.serviceState === 'SOON' ? 1 : 0);
    }, 0);
  }, [appState.fleet, appState.hargaSolarGlobal]);

  const handleSelectUnitFromList = useCallback((unitId: string) => {
    setAppState((prev) => ({ ...prev, activeUnitId: unitId }));
    if (window.innerWidth < 768) {
      setMobileTab('kalkulator');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }, []);

  const handleSelectMobileTab = useCallback((tab: MobileTab) => {
    setMobileTab(tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleUpdateUnit = useCallback((unitId: string, patch: Partial<HeavyUnit>) => {
    setAppState((prev) => ({
      ...prev,
      fleet: prev.fleet.map((u) => (u.id === unitId ? { ...u, ...patch } : u)),
    }));
  }, []);

  const handleSaveNewUnit = useCallback(
    (unit: HeavyUnit, keepOpen: boolean) => {
      setAppState((prev) => ({
        ...prev,
        activeUnitId: unit.id,
        fleet: [unit, ...prev.fleet],
      }));
      showToast(`Unit ${unit.kodeUnit} (${unit.modelUnit}) berhasil ditambahkan.`);
      if (!keepOpen) {
        setIsAddUnitOpen(false);
      }
    },
    [showToast]
  );

  const handleDuplicateUnit = useCallback(
    (unitId: string) => {
      const src = appState.fleet.find((u) => u.id === unitId);
      if (!src) return;

      const prefixMatch = src.kodeUnit.match(/^([A-Z0-9]+)-/i);
      const prefix = prefixMatch ? prefixMatch[1] : src.kodeUnit.slice(0, 2);
      const nextCode = generateNextUnitCode(appState.fleet, prefix);

      const cloned: HeavyUnit = {
        ...JSON.parse(JSON.stringify(src)),
        id: `unit-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        kodeUnit: nextCode,
        logs: [],
      };

      setAppState((prev) => ({
        ...prev,
        activeUnitId: cloned.id,
        fleet: [cloned, ...prev.fleet],
      }));
      showToast(`Unit berhasil diduplikasi menjadi ${nextCode}.`);
    },
    [appState.fleet, showToast]
  );

  const handleDeleteUnit = useCallback(
    (unitId: string) => {
      if (appState.fleet.length <= 1) {
        showToast('Minimal harus tersisa 1 unit aktif di dalam daftar armada.', 'warning');
        return;
      }
      const target = appState.fleet.find((u) => u.id === unitId);
      if (!target) return;

      setConfirmDialog({
        open: true,
        title: `Hapus Unit ${target.kodeUnit}?`,
        message: `Data operasional, jadwal servis PM, dan riwayat log untuk ${target.kodeUnit} (${target.modelUnit}) akan dihapus permanen.`,
        confirmLabel: 'Hapus Unit',
        isDanger: true,
        onConfirm: () => {
          setAppState((prev) => {
            const nextFleet = prev.fleet.filter((u) => u.id !== unitId);
            const nextActiveId =
              prev.activeUnitId === unitId ? nextFleet[0]?.id ?? '' : prev.activeUnitId;
            return {
              ...prev,
              activeUnitId: nextActiveId,
              fleet: nextFleet,
            };
          });
          showToast(`Unit ${target.kodeUnit} telah dihapus.`, 'warning');
        },
      });
    },
    [appState.fleet, showToast]
  );

  const handleSubmitDailyLog = useCallback(
    (unitId: string, payload: DailyLogPayload) => {
      const target = appState.fleet.find((u) => u.id === unitId);
      if (!target) return;

      setAppState((prev) => ({
        ...prev,
        activeUnitId: unitId,
        fleet: prev.fleet.map((u) => {
          if (u.id !== unitId) return u;
          const summary = `+${fmtDec1.format(payload.addW)} W | +${fmtDec1.format(
            payload.addS
          )} S | +${fmtDec1.format(payload.addR)} R | +${fmtInt.format(
            payload.addSolar
          )} L → HM ${formatHM(payload.newHMAkhir)}`;
          return {
            ...u,
            W: u.W + payload.addW,
            S: u.S + payload.addS,
            R: u.R + payload.addR,
            solar: u.solar + payload.addSolar,
            hmAkhir: payload.newHMAkhir,
            logs: [
              {
                id: `log-${Date.now()}`,
                type: 'DAILY',
                date: payload.date,
                summary,
                note: payload.note || 'Input log operasional harian',
              },
              ...u.logs,
            ],
          };
        }),
      }));

      setDailyLogUnitId(null);
      showToast(`Log harian untuk ${target.kodeUnit} berhasil disimpan.`);
    },
    [appState.fleet, showToast]
  );

  const handleSubmitServiceComplete = useCallback(
    (unitId: string, payload: ServiceCompletePayload) => {
      const target = appState.fleet.find((u) => u.id === unitId);
      if (!target) return;

      const todayStr = new Date().toISOString().slice(0, 10);

      setAppState((prev) => ({
        ...prev,
        activeUnitId: unitId,
        fleet: prev.fleet.map((u) => {
          if (u.id !== unitId) return u;
          const nextDue = payload.execHM + u.interval;
          return {
            ...u,
            hmServis: payload.execHM,
            hmAkhir: Math.max(u.hmAkhir, payload.execHM),
            jenisPM: payload.pkg,
            statusOperasi: u.statusOperasi === 'Breakdown' ? 'Aktif' : u.statusOperasi,
            logs: [
              {
                id: `pm-${Date.now()}`,
                type: 'SERVICE',
                date: todayStr,
                summary: `${payload.pkg} Selesai di HM ${formatHM(
                  payload.execHM
                )} (Next Due: HM ${formatHM(nextDue)})`,
                note: payload.note || 'Preventive maintenance berkala selesai dilaksanakan',
              },
              ...u.logs,
            ],
          };
        }),
      }));

      setServiceModalUnitId(null);
      showToast(
        `Servis ${payload.pkg} untuk ${target.kodeUnit} dicatat selesai di HM ${formatHM(
          payload.execHM
        )}.`
      );
    },
    [appState.fleet, showToast]
  );

  const handleExportCSV = useCallback(() => {
    const ok = exportFleetToCSV(appState);
    if (ok) {
      showToast('Laporan CSV (Excel-friendly) berhasil diunduh.');
    } else {
      showToast('Tidak ada data unit untuk di-export.', 'error');
    }
  }, [appState, showToast]);

  const handleBackupJSON = useCallback(() => {
    backupFleetToJSON(appState);
    showToast('Backup JSON berhasil diunduh.');
  }, [appState, showToast]);

  const handleRestoreFileChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const parsed = JSON.parse(String(e.target?.result ?? ''));
          const candidate =
            parsed && parsed.data && Array.isArray(parsed.data.fleet)
              ? parsed.data
              : parsed && Array.isArray(parsed.fleet)
                ? parsed
                : null;

          if (!candidate || candidate.fleet.length === 0) {
            throw new Error('Struktur JSON tidak valid.');
          }

          setConfirmDialog({
            open: true,
            title: 'Restore Data dari File Backup JSON?',
            message: `File "${file.name}" berisi ${candidate.fleet.length} unit armada. Data saat ini akan digantikan dengan data dari file backup.`,
            confirmLabel: 'Ya, Restore Data',
            isDanger: false,
            onConfirm: () => {
              const clean = sanitizeState(candidate);
              setAppState(clean);
              showToast(`Berhasil memulihkan ${clean.fleet.length} unit dari backup JSON.`);
            },
          });
        } catch {
          showToast('Gagal membaca file JSON: pastikan format file backup valid.', 'error');
        } finally {
          event.target.value = '';
        }
      };
      reader.readAsText(file);
    },
    [showToast]
  );

  const handleResetFleet = useCallback(() => {
    setConfirmDialog({
      open: true,
      title: 'Reset Data ke 4 Unit Contoh Awal?',
      message:
        'Seluruh perubahan kustom dan penambahan unit saat ini akan dihapus dan dikembalikan ke 4 unit contoh (EX-01, DT-05, DZ-02, WL-03).',
      confirmLabel: 'Reset Data',
      isDanger: true,
      onConfirm: () => {
        setAppState(createDefaultState());
        setSearchQuery('');
        setCategoryFilter('ALL');
        setStatusFilter('ALL');
        showToast('Data armada berhasil di-reset ke contoh awal.');
      },
    });
  }, [showToast]);

  const handleToggleServiceAlertFilter = useCallback(() => {
    setStatusFilter((prev) => {
      if (prev === 'NEED_SERVICE') {
        showToast('Menampilkan seluruh unit armada.');
        return 'ALL';
      }
      showToast('Menampilkan unit dengan status servis LEWAT & SEGERA.', 'warning');
      return 'NEED_SERVICE';
    });
  }, [showToast]);

  const handleResetFilters = useCallback(() => {
    setSearchQuery('');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
  }, []);

  return (
    <div className="min-h-screen bg-warm-bg text-warm-text px-3 pt-3 pb-24 sm:p-5 lg:p-6 md:pb-6">
      <input
        ref={restoreInputRef}
        type="file"
        accept=".json,application/json"
        onChange={handleRestoreFileChange}
        className="hidden"
      />

      <div
        className={`max-w-[1440px] mx-auto space-y-4 sm:space-y-5 print-container ${
          isPrintModalOpen ? 'no-print' : ''
        }`}
      >
        <FleetHeader
          unitCount={appState.fleet.length}
          periodeAktif={appState.periodeAktif}
          hargaSolarGlobal={appState.hargaSolarGlobal}
          saveStatus={saveStatus}
          onPeriodeChange={(value) =>
            setAppState((prev) => ({ ...prev, periodeAktif: value }))
          }
          onHargaSolarChange={(value) =>
            setAppState((prev) => ({ ...prev, hargaSolarGlobal: value }))
          }
          onOpenAddUnit={() => setIsAddUnitOpen(true)}
          onExportCSV={handleExportCSV}
          onBackupJSON={handleBackupJSON}
          onTriggerRestoreJSON={() => restoreInputRef.current?.click()}
          onPrintReport={() => setIsPrintModalOpen(true)}
          onResetFleet={handleResetFleet}
        />

        {/* Tab Armada di Mobile (Selalu tampil di Desktop md+) */}
        <div className={`space-y-4 sm:space-y-5 ${mobileTab === 'armada' ? 'block' : 'hidden md:block'}`}>
          <FleetSummaryKpis
            fleet={appState.fleet}
            hargaSolarGlobal={appState.hargaSolarGlobal}
            isServiceFilterActive={statusFilter === 'NEED_SERVICE'}
            onFilterServiceAlerts={handleToggleServiceAlertFilter}
          />

          <FleetTable
            fleet={appState.fleet}
            activeUnitId={activeUnit?.id ?? ''}
            hargaSolarGlobal={appState.hargaSolarGlobal}
            searchQuery={searchQuery}
            categoryFilter={categoryFilter}
            statusFilter={statusFilter}
            onSearchChange={setSearchQuery}
            onCategoryFilterChange={setCategoryFilter}
            onStatusFilterChange={setStatusFilter}
            onResetFilters={handleResetFilters}
            onSelectUnit={handleSelectUnitFromList}
            onOpenDailyLog={(unitId) => setDailyLogUnitId(unitId)}
            onOpenServiceComplete={(unitId) => setServiceModalUnitId(unitId)}
            onDuplicateUnit={handleDuplicateUnit}
            onDeleteUnit={handleDeleteUnit}
          />
        </div>

        {/* Tab Kalkulator Unit di Mobile (Selalu tampil di Desktop md+) */}
        {activeUnit && (
          <div className={mobileTab === 'kalkulator' ? 'block' : 'hidden md:block'}>
            <UnitDetailPanel
              unit={activeUnit}
              fleet={appState.fleet}
              hargaSolarGlobal={appState.hargaSolarGlobal}
              onSelectUnit={(unitId) =>
                setAppState((prev) => ({ ...prev, activeUnitId: unitId }))
              }
              onUpdateUnit={handleUpdateUnit}
              onOpenDailyLog={(unitId) => setDailyLogUnitId(unitId)}
              onOpenServiceComplete={(unitId) => setServiceModalUnitId(unitId)}
              onDuplicateUnit={handleDuplicateUnit}
              onDeleteUnit={handleDeleteUnit}
            />
          </div>
        )}
      </div>

      <MobileBottomNav
        activeTab={mobileTab}
        activeUnitCode={activeUnit?.kodeUnit ?? 'Unit'}
        alertCount={serviceAlertCount}
        onSelectTab={handleSelectMobileTab}
        onQuickDailyLog={() => {
          if (activeUnit) setDailyLogUnitId(activeUnit.id);
        }}
        onOpenReport={() => setIsPrintModalOpen(true)}
      />

      <AddUnitModal
        open={isAddUnitOpen}
        fleet={appState.fleet}
        hargaSolarGlobal={appState.hargaSolarGlobal}
        onClose={() => setIsAddUnitOpen(false)}
        onSave={handleSaveNewUnit}
        onToastError={(msg) => showToast(msg, 'error')}
      />

      <DailyLogModal
        unit={dailyLogUnit}
        onClose={() => setDailyLogUnitId(null)}
        onSubmit={handleSubmitDailyLog}
      />

      <ServiceCompleteModal
        unit={serviceModalUnit}
        onClose={() => setServiceModalUnitId(null)}
        onSubmit={handleSubmitServiceComplete}
      />

      <PrintReportModal
        open={isPrintModalOpen}
        appState={appState}
        activeUnit={activeUnit}
        onClose={() => setIsPrintModalOpen(false)}
        onNotify={showToast}
      />

      <ConfirmModal
        dialog={confirmDialog}
        onClose={() => setConfirmDialog(null)}
      />

      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
    </div>
  );
}
