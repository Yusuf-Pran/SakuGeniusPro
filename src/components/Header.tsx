import React, { useState } from "react";
import { Moon, Sun, Bell, Sparkles, Cloud, ShieldCheck, User } from "lucide-react";
import { BudgetNotification } from "../types";
import { SakuGeniusLogo } from "./SakuGeniusLogo";

interface HeaderProps {
  title: string;
  isDark: boolean;
  onToggleTheme: () => void;
  onOpenAIModal: () => void;
  onOpenNotifications: () => void;
  notifications: BudgetNotification[];
  userName: string;
}

export const Header: React.FC<HeaderProps> = ({
  title,
  isDark,
  onToggleTheme,
  onOpenAIModal,
  onOpenNotifications,
  notifications,
  userName,
}) => {
  const unreadCount = notifications.filter((n) => !n.isRead).length;
  const [imgError, setImgError] = useState(false);

  return (
    <header className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 shadow-xs px-4 sm:px-8 py-3.5 flex justify-between items-center z-20 sticky top-0 transition-colors">
      {/* Title & Brand Logo */}
      <div className="flex items-center gap-3">
        {!imgError ? (
          <img
            src="/Logo.png"
            alt="SakuGenius Logo"
            onError={() => setImgError(true)}
            className="w-9 h-9 object-contain rounded-xl shadow-xs md:hidden"
            referrerPolicy="no-referrer"
          />
        ) : (
          <SakuGeniusLogo className="w-9 h-9 md:hidden rounded-xl" />
        )}
        <div>
          <h1 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white tracking-tight leading-tight">
            {title}
          </h1>
          <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
            SakuGenius • Keuangan Keluarga Cerdas
          </p>
        </div>
      </div>

      {/* Right Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* Cloud Sync Badge */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-400 text-[11px] font-bold">
          <Cloud className="w-3.5 h-3.5" />
          <span>Tersinkron</span>
        </div>

        {/* Quick AI Action Button */}
        <button
          onClick={onOpenAIModal}
          className="py-1.5 px-3 sm:px-3.5 rounded-xl bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 transition-all hover:scale-105 active:scale-95"
        >
          <Sparkles className="w-3.5 h-3.5 text-amber-300 animate-pulse" />
          <span className="hidden sm:inline">Catat AI</span>
          <span className="text-[10px] sm:hidden">AI</span>
        </button>

        {/* Notification Bell with Badge */}
        <button
          onClick={onOpenNotifications}
          className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
          title="Notifikasi & Peringatan Budget"
        >
          <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 flex h-4 w-4">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 text-[9px] font-extrabold text-white items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            </span>
          )}
        </button>

        {/* Theme Toggle */}
        <button
          onClick={onToggleTheme}
          className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 flex items-center justify-center transition-colors"
          title="Ganti Tema"
        >
          {isDark ? <Sun className="w-4 h-4 sm:w-5 sm:h-5 text-amber-400" /> : <Moon className="w-4 h-4 sm:w-5 sm:h-5" />}
        </button>

        {/* User Initial Badge */}
        <div className="hidden sm:flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-800">
          <div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center text-xs font-black">
            {userName ? userName.charAt(0).toUpperCase() : "U"}
          </div>
        </div>
      </div>
    </header>
  );
};
