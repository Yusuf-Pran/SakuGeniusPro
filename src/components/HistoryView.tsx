import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Search,
  Filter,
  Download,
  Edit2,
  Trash2,
  Calendar,
  ArrowUpRight,
  ArrowDownLeft,
  Sparkles,
  Camera,
  Mic,
  FileText,
  Printer,
  FileSpreadsheet,
  Eye,
} from "lucide-react";
import { Category, Transaction } from "../types";
import { formatRupiah, getMonthDisplay } from "../utils/storage";
import { PrintReportModal } from "./PrintReportModal";

interface HistoryViewProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  onEditTransaction: (transaction: Transaction) => void;
  onDeleteTransaction: (id: string) => void;
  userName: string;
  userPhone: string;
  userEmail: string;
  appName: string;
}

export const HistoryView: React.FC<HistoryViewProps> = ({
  transactions,
  categories,
  selectedMonth,
  onChangeMonth,
  onEditTransaction,
  onDeleteTransaction,
  userName,
  userPhone,
  userEmail,
  appName,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [filterType, setFilterType] = useState<"all" | "Pengeluaran" | "Pemasukan">("all");
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Month filtered transactions
  const monthTransactions = transactions.filter((t) =>
    t.tanggal.startsWith(selectedMonth)
  );

  // Search and category filtering
  const filteredTransactions = monthTransactions.filter((t) => {
    const matchSearch =
      t.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.kategori.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.catatan && t.catatan.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchCategory = filterCategory === "all" || t.kategori === filterCategory;
    const matchType = filterType === "all" || t.jenis === filterType;

    return matchSearch && matchCategory && matchType;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Search and Action Toolbar */}
      <div className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              Riwayat Transaksi Keuangan
            </h2>
            <p className="text-xs text-slate-400">
              Periode: {getMonthDisplay(selectedMonth)} • {filteredTransactions.length} transaksi ditampilkan
            </p>
          </div>

          <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && onChangeMonth(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
            />

            {/* Print / PDF Button */}
            <button
              onClick={() => setIsPrintModalOpen(true)}
              className="py-2 px-3.5 sm:px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-black text-xs shadow-md shadow-rose-600/20 flex items-center gap-1.5 flex-shrink-0 transition-all hover:scale-105 cursor-pointer"
              title="Pratinjau & Cetak Laporan Keuangan PDF"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak PDF</span>
            </button>
          </div>
        </div>

        {/* Filter Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          {/* Search bar */}
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, merchant, catatan..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">Semua Jenis (Pengeluaran & Pemasukan)</option>
              <option value="Pengeluaran">Hanya Pengeluaran</option>
              <option value="Pemasukan">Hanya Pemasukan</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={filterCategory}
              onChange={(e) => setFilterCategory(e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.nama}>
                  {c.nama} ({c.jenis})
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Transaction List */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-4 sm:p-6">
        {filteredTransactions.length === 0 ? (
          <div className="py-16 text-center flex flex-col items-center">
            <div className="w-16 h-16 rounded-3xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
              <FileSpreadsheet className="w-8 h-8" />
            </div>
            <h3 className="text-sm font-bold text-slate-700 dark:text-slate-300">
              Tidak ada catatan transaksi
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              Tidak ditemukan data pada filter periode {getMonthDisplay(selectedMonth)}.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredTransactions
              .sort((a, b) => new Date(b.tanggal).getTime() - new Date(a.tanggal).getTime())
              .map((tx) => {
                const isIncome = tx.jenis === "Pemasukan";
                return (
                  <motion.div
                    key={tx.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-slate-50/70 dark:bg-slate-800/40 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-100 dark:border-slate-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 transition-colors group"
                  >
                    <div className="flex items-center gap-3.5 min-w-0">
                      <div
                        className={`w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0 ${
                          isIncome
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-950/80 dark:text-emerald-400"
                            : "bg-rose-100 text-rose-600 dark:bg-rose-950/80 dark:text-rose-400"
                        }`}
                      >
                        {isIncome ? (
                          <ArrowDownLeft className="w-5 h-5" />
                        ) : (
                          <ArrowUpRight className="w-5 h-5" />
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <h4 className="font-extrabold text-xs text-slate-900 dark:text-white truncate">
                            {tx.nama}
                          </h4>
                          {/* AI Source Badges */}
                          {tx.source === "ai_receipt" && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-cyan-50 dark:bg-cyan-950 text-cyan-700 dark:text-cyan-400 border border-cyan-200 dark:border-cyan-800 flex-shrink-0">
                              <Camera className="w-2.5 h-2.5" />
                              <span>AI Struk</span>
                            </span>
                          )}
                          {tx.source === "ai_voice" && (
                            <span className="inline-flex items-center gap-1 text-[9px] font-bold px-2 py-0.5 rounded-full bg-purple-50 dark:bg-purple-950 text-purple-700 dark:text-purple-400 border border-purple-200 dark:border-purple-800 flex-shrink-0">
                              <Mic className="w-2.5 h-2.5" />
                              <span>AI Suara</span>
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                          <span className="font-medium">{tx.kategori}</span>
                          <span>•</span>
                          <span>
                            {new Date(tx.tanggal).toLocaleDateString("id-ID", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>

                        {tx.catatan && (
                          <p className="text-[10px] text-slate-500 italic mt-0.5 truncate max-w-sm">
                            "{tx.catatan}"
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-200 dark:border-slate-700">
                      <span
                        className={`text-sm font-black whitespace-nowrap ${
                          isIncome
                            ? "text-emerald-600 dark:text-emerald-400"
                            : "text-slate-900 dark:text-white"
                        }`}
                      >
                        {isIncome ? "+" : "-"} {formatRupiah(tx.nominal)}
                      </span>

                      <div className="flex items-center gap-1 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => onEditTransaction(tx)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                          title="Edit Transaksi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeleteTransaction(tx.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                          title="Hapus Transaksi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
          </div>
        )}
      </div>

      {/* PRINT REPORT MODAL */}
      <PrintReportModal
        isOpen={isPrintModalOpen}
        onClose={() => setIsPrintModalOpen(false)}
        transactions={transactions}
        categories={categories}
        selectedMonth={selectedMonth}
        onChangeMonth={onChangeMonth}
        userName={userName}
        userPhone={userPhone}
        userEmail={userEmail}
        appName={appName}
      />
    </div>
  );
};
