import { CalendarPlus, FileText, Layers, SlidersHorizontal } from 'lucide-react';

export type MobileTab = 'armada' | 'kalkulator';

interface MobileBottomNavProps {
  activeTab: MobileTab;
  activeUnitCode: string;
  alertCount: number;
  onSelectTab: (tab: MobileTab) => void;
  onQuickDailyLog: () => void;
  onOpenReport: () => void;
}

export function MobileBottomNav({
  activeTab,
  activeUnitCode,
  alertCount,
  onSelectTab,
  onQuickDailyLog,
  onOpenReport,
}: MobileBottomNavProps) {
  return (
    <nav
      aria-label="Navigasi Mobile"
      className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white/95 backdrop-blur-md border-t border-warm-border pb-safe no-print"
    >
      <div className="grid grid-cols-4 items-center h-16 px-1">
        <button
          type="button"
          onClick={() => onSelectTab('armada')}
          className={`relative flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer ${
            activeTab === 'armada'
              ? 'text-forest font-bold'
              : 'text-warm-muted hover:text-warm-text font-medium'
          }`}
        >
          <div className="relative">
            <Layers className="w-5 h-5" />
            {alertCount > 0 && (
              <span className="absolute -top-1.5 -right-2.5 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white font-mono text-[9px] font-bold flex items-center justify-center tabular-nums">
                {alertCount}
              </span>
            )}
          </div>
          <span className="text-[11px] tracking-tight mt-1 leading-none">Armada</span>
        </button>

        <button
          type="button"
          onClick={() => onSelectTab('kalkulator')}
          className={`flex flex-col items-center justify-center min-h-[48px] rounded-xl transition-colors cursor-pointer ${
            activeTab === 'kalkulator'
              ? 'text-forest font-bold'
              : 'text-warm-muted hover:text-warm-text font-medium'
          }`}
        >
          <SlidersHorizontal className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 leading-none truncate max-w-[76px]">
            {activeUnitCode || 'Unit'}
          </span>
        </button>

        <button
          type="button"
          onClick={onQuickDailyLog}
          className="flex flex-col items-center justify-center min-h-[48px] rounded-xl text-safety-orange hover:text-safety-orange-hover font-bold transition-colors cursor-pointer"
        >
          <CalendarPlus className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 leading-none">+ Log</span>
        </button>

        <button
          type="button"
          onClick={onOpenReport}
          className="flex flex-col items-center justify-center min-h-[48px] rounded-xl text-warm-muted hover:text-warm-text font-medium transition-colors cursor-pointer"
        >
          <FileText className="w-5 h-5" />
          <span className="text-[11px] tracking-tight mt-1 leading-none">Laporan</span>
        </button>
      </div>
    </nav>
  );
}
