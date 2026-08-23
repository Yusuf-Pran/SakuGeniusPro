import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Bell, X, CheckCheck, Trash2, ShieldAlert, AlertTriangle, ArrowRight } from "lucide-react";
import { BudgetNotification } from "../types";
import { formatRupiah } from "../utils/storage";

interface NotificationCenterModalProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: BudgetNotification[];
  onMarkAllAsRead: () => void;
  onClearAll: () => void;
  onViewBudget: () => void;
}

export const NotificationCenterModal: React.FC<NotificationCenterModalProps> = ({
  isOpen,
  onClose,
  notifications,
  onMarkAllAsRead,
  onClearAll,
  onViewBudget,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 15 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 15 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[85vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-slate-900 dark:text-white">
                Notifikasi & Peringatan
              </h2>
              <p className="text-[11px] text-slate-400">
                Riwayat pesan overbudget dan peringatan limit
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Action toolbar */}
        {notifications.length > 0 && (
          <div className="px-5 py-2.5 bg-slate-50/80 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
            <button
              onClick={onMarkAllAsRead}
              className="flex items-center gap-1 text-slate-600 dark:text-slate-300 hover:text-indigo-600 font-semibold"
            >
              <CheckCheck className="w-3.5 h-3.5" />
              <span>Tandai Sudah Dibaca</span>
            </button>
            <button
              onClick={onClearAll}
              className="flex items-center gap-1 text-red-500 hover:text-red-700 font-semibold"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>Hapus Semua</span>
            </button>
          </div>
        )}

        {/* List of Notifications */}
        <div className="p-5 overflow-y-auto flex-1 space-y-3">
          {notifications.length === 0 ? (
            <div className="py-12 text-center flex flex-col items-center">
              <div className="w-16 h-16 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
                <Bell className="w-8 h-8" />
              </div>
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300">
                Belum ada notifikasi baru
              </h4>
              <p className="text-xs text-slate-400 mt-1 max-w-xs">
                Peringatan overbudget akan muncul di sini saat pengeluaran melampaui target.
              </p>
            </div>
          ) : (
            notifications.map((notif) => {
              const isOver = notif.kelebihan > 0;
              return (
                <div
                  key={notif.id}
                  className={`p-4 rounded-2xl border transition-all ${
                    !notif.isRead
                      ? "bg-red-50/60 dark:bg-red-950/30 border-red-200 dark:border-red-900/60 shadow-xs"
                      : "bg-white dark:bg-slate-800/60 border-slate-200 dark:border-slate-700"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0 ${
                        isOver
                          ? "bg-red-100 dark:bg-red-950/80 text-red-600 dark:text-red-400"
                          : "bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400"
                      }`}
                    >
                      {isOver ? <ShieldAlert className="w-5 h-5" /> : <AlertTriangle className="w-5 h-5" />}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1 mb-1">
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white truncate">
                          {isOver ? "🚨 Overbudget" : "⚠️ Mendekati Limit"}: {notif.kategori}
                        </h4>
                        <span className="text-[10px] text-slate-400 flex-shrink-0">
                          {new Date(notif.timestamp).toLocaleTimeString("id-ID", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>

                      <p className="text-xs text-slate-600 dark:text-slate-300 mb-2 leading-relaxed">
                        {notif.message}
                      </p>

                      <div className="flex items-center justify-between text-[11px] pt-2 border-t border-slate-100 dark:border-slate-700/80">
                        <span className="text-slate-500">
                          Terpakai: <strong className="text-red-600 dark:text-red-400">{formatRupiah(notif.pemakaian)}</strong> / {formatRupiah(notif.budget)}
                        </span>
                        <button
                          onClick={() => {
                            onClose();
                            onViewBudget();
                          }}
                          className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-1"
                        >
                          <span>Lihat Budget</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </motion.div>
    </div>
  );
};
