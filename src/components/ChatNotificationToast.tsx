import React, { useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { AlertTriangle, BellRing, X, ArrowRight, ShieldAlert } from "lucide-react";
import { BudgetNotification } from "../types";
import { formatRupiah } from "../utils/storage";

interface ChatNotificationToastProps {
  notification: BudgetNotification | null;
  onClose: () => void;
  onViewBudget: () => void;
}

export const ChatNotificationToast: React.FC<ChatNotificationToastProps> = ({
  notification,
  onClose,
  onViewBudget,
}) => {
  useEffect(() => {
    if (!notification) return;
    // Auto dismiss after 8 seconds
    const timer = setTimeout(() => {
      onClose();
    }, 8500);
    return () => clearTimeout(timer);
  }, [notification, onClose]);

  if (!notification) return null;

  const isDanger = notification.level === "danger" || notification.kelebihan > 0;

  return (
    <AnimatePresence>
      <div className="fixed top-4 right-4 sm:right-6 z-[999] max-w-md w-[calc(100vw-2rem)] sm:w-96 pointer-events-auto">
        <motion.div
          initial={{ opacity: 0, y: -40, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -20, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 450, damping: 30 }}
          className="relative overflow-hidden bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-2xl border-2 border-red-500/80 dark:border-red-500/60 shadow-2xl shadow-red-500/20 p-4 transition-all"
        >
          {/* Glowing indicator bar */}
          <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-red-500 via-amber-500 to-red-600 animate-pulse" />

          {/* Chat message header */}
          <div className="flex items-start gap-3">
            {/* Avatar with pulsing badge */}
            <div className="relative flex-shrink-0">
              <div className="w-11 h-11 rounded-2xl bg-red-100 dark:bg-red-950/80 border border-red-200 dark:border-red-800 flex items-center justify-center text-red-600 dark:text-red-400 shadow-sm">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <span className="absolute -bottom-1 -right-1 flex h-4 w-4">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500 items-center justify-center text-[9px] text-white font-black">!</span>
              </span>
            </div>

            {/* Chat Content Body */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1 mb-1">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-extrabold uppercase tracking-wider text-red-600 dark:text-red-400">
                    Peringatan Budget
                  </span>
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
                  <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Baru saja</span>
                </div>
                <button
                  onClick={onClose}
                  className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1 rounded-lg transition-colors"
                  aria-label="Tutup notifikasi"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Chat Bubble Message */}
              <div className="bg-red-50 dark:bg-red-950/40 border border-red-100 dark:border-red-900/50 rounded-xl p-3 text-xs text-slate-800 dark:text-slate-200 leading-relaxed shadow-inner">
                <p className="font-semibold text-slate-900 dark:text-white mb-1.5">
                  🚨 Pengeluaran <span className="text-red-600 dark:text-red-400 underline decoration-red-400">{notification.kategori}</span> telah melampaui budget!
                </p>
                <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-red-200/60 dark:border-red-900/60 text-[11px]">
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Total Terpakai:</span>
                    <strong className="text-red-600 dark:text-red-400 font-bold">{formatRupiah(notification.pemakaian)}</strong>
                  </div>
                  <div>
                    <span className="text-slate-500 dark:text-slate-400 block">Batas Budget:</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">{formatRupiah(notification.budget)}</span>
                  </div>
                </div>
                {notification.kelebihan > 0 && (
                  <div className="mt-2 text-[11px] font-bold text-red-700 dark:text-red-300 bg-red-100/80 dark:bg-red-900/50 px-2 py-1 rounded-md">
                    ⚠️ Melebihi: +{formatRupiah(notification.kelebihan)} ({Math.round(notification.persentase)}%)
                  </div>
                )}
              </div>

              {/* Interactive Actions */}
              <div className="flex items-center justify-end gap-2 mt-3">
                <button
                  onClick={onClose}
                  className="text-xs font-semibold px-3 py-1.5 rounded-lg text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                >
                  Abaikan
                </button>
                <button
                  onClick={() => {
                    onClose();
                    onViewBudget();
                  }}
                  className="text-xs font-bold flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-md shadow-red-600/30 transition-all hover:translate-x-0.5"
                >
                  <span>Cek Status Budget</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
