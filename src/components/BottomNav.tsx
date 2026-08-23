import React from "react";
import { LayoutDashboard, PlusCircle, ListFilter, Settings, Sparkles } from "lucide-react";

interface BottomNavProps {
  currentView: "dashboard" | "input" | "history" | "settings";
  onChangeView: (view: "dashboard" | "input" | "history" | "settings") => void;
  onOpenAIModal: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onChangeView,
  onOpenAIModal,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 flex justify-around items-center z-40 pb-[env(safe-area-inset-bottom)] px-2 transition-colors">
      <button
        onClick={() => onChangeView("dashboard")}
        className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
          currentView === "dashboard"
            ? "text-indigo-600 dark:text-indigo-400 font-bold"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
      >
        <LayoutDashboard className="w-5 h-5" />
        <span className="text-[10px]">Beranda</span>
      </button>

      <button
        onClick={() => onChangeView("input")}
        className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
          currentView === "input"
            ? "text-indigo-600 dark:text-indigo-400 font-bold"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
      >
        <PlusCircle className="w-5 h-5" />
        <span className="text-[10px]">Input</span>
      </button>

      {/* Floating Center AI Action */}
      <button
        onClick={onOpenAIModal}
        className="-mt-5 w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-600 via-violet-600 to-purple-600 text-white flex items-center justify-center shadow-lg shadow-indigo-500/40 hover:scale-105 active:scale-95 transition-transform"
        title="Catat dengan AI"
      >
        <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
      </button>

      <button
        onClick={() => onChangeView("history")}
        className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
          currentView === "history"
            ? "text-indigo-600 dark:text-indigo-400 font-bold"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
      >
        <ListFilter className="w-5 h-5" />
        <span className="text-[10px]">Riwayat</span>
      </button>

      <button
        onClick={() => onChangeView("settings")}
        className={`flex-1 py-2.5 flex flex-col items-center gap-1 transition-colors ${
          currentView === "settings"
            ? "text-indigo-600 dark:text-indigo-400 font-bold"
            : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
        }`}
      >
        <Settings className="w-5 h-5" />
        <span className="text-[10px]">Sistem</span>
      </button>
    </nav>
  );
};
