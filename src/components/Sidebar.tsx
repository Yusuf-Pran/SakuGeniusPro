import React, { useState } from "react";
import { LayoutDashboard, PlusCircle, ListFilter, Settings, Sparkles, LogOut, Wallet, ShieldCheck } from "lucide-react";
import { SakuGeniusLogo } from "./SakuGeniusLogo";

interface SidebarProps {
  currentView: "dashboard" | "input" | "history" | "settings";
  onChangeView: (view: "dashboard" | "input" | "history" | "settings") => void;
  onOpenAIModal: () => void;
  userName: string;
  userPhone: string;
  onLogout: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onChangeView,
  onOpenAIModal,
  userName,
  userPhone,
  onLogout,
}) => {
  const [imgError, setImgError] = useState(false);
  const navItems = [
    { id: "dashboard" as const, label: "Dashboard", icon: LayoutDashboard },
    { id: "input" as const, label: "Input Data", icon: PlusCircle },
    { id: "history" as const, label: "Riwayat Transaksi", icon: ListFilter },
    { id: "settings" as const, label: "Kelola Sistem", icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shadow-sm z-30 transition-colors flex-shrink-0">
      {/* Brand Header */}
      <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center gap-3">
        {!imgError ? (
          <img
            src="/Logo.png"
            alt="SakuGenius Logo"
            onError={() => setImgError(true)}
            className="w-10 h-10 object-contain rounded-2xl shadow-md shadow-sky-500/20 flex-shrink-0"
            referrerPolicy="no-referrer"
          />
        ) : (
          <SakuGeniusLogo className="w-10 h-10" />
        )}
        <div className="overflow-hidden">
          <h1 className="text-lg font-black tracking-tight text-slate-900 dark:text-white leading-tight">
            SakuGenius
          </h1>
          <span className="text-[10px] font-bold text-sky-600 dark:text-sky-400 bg-sky-50 dark:bg-sky-950/60 px-1.5 py-0.5 rounded">
            AI Finance Pro
          </span>
        </div>
      </div>

      {/* Quick AI Floating Banner */}
      <div className="px-4 pt-4">
        <div className="p-3.5 rounded-2xl bg-gradient-to-br from-indigo-50 to-violet-50 dark:from-indigo-950/40 dark:to-violet-950/40 border border-indigo-100 dark:border-indigo-900/50 shadow-xs">
          <div className="flex items-center gap-2 mb-1.5">
            <Sparkles className="w-4 h-4 text-indigo-600 dark:text-indigo-400" />
            <span className="text-xs font-bold text-slate-900 dark:text-white">AI Gemini 3.7</span>
          </div>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mb-2.5 leading-snug">
            Catat struk & suara otomatis dalam hitungan detik.
          </p>
          <button
            onClick={onOpenAIModal}
            className="w-full py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-sm shadow-indigo-600/20 flex items-center justify-center gap-1.5 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Mulai Catat AI</span>
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-1.5 overflow-y-auto">
        <p className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider px-3 mb-2 mt-1">
          Menu Utama
        </p>

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 text-xs font-bold rounded-xl transition-all ${
                isActive
                  ? "bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 border border-indigo-200 dark:border-indigo-800/80 shadow-xs"
                  : "text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? "text-indigo-600 dark:text-indigo-400" : "text-slate-400"}`} />
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* User Footer & Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2 bg-slate-50/50 dark:bg-slate-900/50">
        <div className="flex items-center gap-2.5 overflow-hidden">
          <div className="w-9 h-9 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black text-xs flex-shrink-0">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="overflow-hidden">
            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
              {userName || "Member"}
            </p>
            <p className="text-[10px] text-slate-400 truncate flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-emerald-500" />
              <span>{userPhone || "Terdaftar"}</span>
            </p>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="p-2 text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-xl transition-colors"
          title="Keluar / Kunci Aplikasi"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
};
