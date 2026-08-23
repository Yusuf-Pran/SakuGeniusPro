import React, { useState } from "react";
import { motion } from "motion/react";
import {
  TrendingDown,
  TrendingUp,
  Wallet,
  PieChart,
  Target,
  Sparkles,
  AlertTriangle,
  ChevronRight,
  ArrowUpRight,
  ArrowDownLeft,
  Bot,
  Printer,
  FileText,
} from "lucide-react";
import { Category, Transaction } from "../types";
import { formatRupiah, getMonthDisplay } from "../utils/storage";
import { PrintReportModal } from "./PrintReportModal";

interface DashboardViewProps {
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string;
  onChangeMonth: (month: string) => void;
  onOpenAIModal: () => void;
  onSwitchView: (view: "dashboard" | "input" | "history" | "settings") => void;
  userName?: string;
  userPhone?: string;
  userEmail?: string;
  appName?: string;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  transactions,
  categories,
  selectedMonth,
  onChangeMonth,
  onOpenAIModal,
  onSwitchView,
  userName = "Pengguna",
  userPhone = "081234567890",
  userEmail = "pengguna@sakugenius.app",
  appName = "SakuGenius",
}) => {
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [loadingAdvice, setLoadingAdvice] = useState(false);
  const [isPrintModalOpen, setIsPrintModalOpen] = useState(false);

  // Filter transactions by selected month
  const monthTransactions = transactions.filter((t) =>
    t.tanggal.startsWith(selectedMonth)
  );

  // Summary calculations
  const totalIncomeMonth = monthTransactions
    .filter((t) => t.jenis === "Pemasukan")
    .reduce((acc, t) => acc + t.nominal, 0);

  const totalExpenseMonth = monthTransactions
    .filter((t) => t.jenis === "Pengeluaran")
    .reduce((acc, t) => acc + t.nominal, 0);

  // All-time balance
  const totalBalanceAllTime = transactions.reduce((acc, t) => {
    return t.jenis === "Pemasukan" ? acc + t.nominal : acc - t.nominal;
  }, 0);

  // Group expenses by category for chart
  const categoryExpenses: { [key: string]: number } = {};
  monthTransactions
    .filter((t) => t.jenis === "Pengeluaran")
    .forEach((t) => {
      categoryExpenses[t.kategori] = (categoryExpenses[t.kategori] || 0) + t.nominal;
    });

  const expenseCategoriesList = categories.filter((c) => c.jenis === "Pengeluaran");

  // Overbudget detection
  const overbudgetCategories = expenseCategoriesList
    .filter((c) => c.budget > 0 && (categoryExpenses[c.nama] || 0) > c.budget)
    .map((c) => ({
      nama: c.nama,
      budget: c.budget,
      terpakai: categoryExpenses[c.nama] || 0,
      kelebihan: (categoryExpenses[c.nama] || 0) - c.budget,
    }));

  // AI Financial Advisor fetch
  const fetchFinancialAdvice = async () => {
    setLoadingAdvice(true);
    try {
      const res = await fetch("/api/ai/financial-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          summary: {
            income: totalIncomeMonth,
            expense: totalExpenseMonth,
            balance: totalBalanceAllTime,
          },
          overbudgetCategories,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setAiAdvice(data.advice);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAdvice(false);
    }
  };

  // Color palette for chart
  const colors = [
    "#6366f1",
    "#ec4899",
    "#f59e0b",
    "#10b981",
    "#06b6d4",
    "#8b5cf6",
    "#ef4444",
    "#64748b",
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Top Banner: Month Selector & Quick Actions */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <h2 className="text-lg font-black text-slate-900 dark:text-white">
            Ringkasan Keuangan {getMonthDisplay(selectedMonth)}
          </h2>
          <p className="text-xs text-slate-400">
            {monthTransactions.length} transaksi tercatat pada periode ini
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <input
            type="month"
            value={selectedMonth}
            onChange={(e) => e.target.value && onChangeMonth(e.target.value)}
            className="px-3.5 py-2 rounded-xl bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none cursor-pointer"
          />

          <button
            onClick={() => setIsPrintModalOpen(true)}
            className="py-2 px-3 sm:px-3.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 rounded-xl text-xs font-bold border border-slate-200 dark:border-slate-700 flex items-center gap-1.5 flex-shrink-0 transition-all cursor-pointer"
            title="Cetak Laporan Keuangan PDF"
          >
            <Printer className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
            <span className="hidden sm:inline">Cetak PDF</span>
          </button>

          <button
            onClick={onOpenAIModal}
            className="py-2 px-4 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20 flex items-center gap-1.5 flex-shrink-0 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>Catat AI</span>
          </button>
        </div>
      </div>

      {/* 3 Main Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Pemasukan Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pemasukan
            </span>
            <div className="w-9 h-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ArrowDownLeft className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiah(totalIncomeMonth)}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Arus kas masuk bulan ini</span>
            </p>
          </div>
        </motion.div>

        {/* Pengeluaran Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.05 }}
          className="bg-white dark:bg-slate-900 p-5 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
              Total Pengeluaran
            </span>
            <div className="w-9 h-9 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
              <ArrowUpRight className="w-5 h-5" />
            </div>
          </div>
          <div>
            <h3 className="text-2xl font-black text-slate-900 dark:text-white">
              {formatRupiah(totalExpenseMonth)}
            </h3>
            <p className="text-[11px] text-rose-600 dark:text-rose-400 font-semibold mt-1 flex items-center gap-1">
              <TrendingDown className="w-3.5 h-3.5" />
              <span>Arus kas keluar bulan ini</span>
            </p>
          </div>
        </motion.div>

        {/* Total Saldo All-Time Card */}
        <motion.div
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2, delay: 0.1 }}
          className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 text-white p-5 rounded-3xl shadow-lg shadow-indigo-600/20 flex flex-col justify-between relative overflow-hidden"
        >
          <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full blur-xl -mr-8 -mt-8" />
          <div className="flex items-center justify-between mb-3 relative z-10">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-200">
              Saldo Bersih (Semua Waktu)
            </span>
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white">
              <Wallet className="w-5 h-5" />
            </div>
          </div>
          <div className="relative z-10">
            <h3 className="text-2xl font-black">
              {formatRupiah(totalBalanceAllTime)}
            </h3>
            <p className="text-[11px] text-indigo-100 mt-1 font-medium">
              Net akumulasi seluruh transaksi
            </p>
          </div>
        </motion.div>
      </div>

      {/* Overbudget Warning Alert (If any) */}
      {overbudgetCategories.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="p-4 bg-red-50 dark:bg-red-950/40 border-2 border-red-300 dark:border-red-800/80 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
        >
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-900/60 text-red-600 dark:text-red-400 flex items-center justify-center flex-shrink-0">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <h4 className="font-extrabold text-red-900 dark:text-red-200 text-sm">
                Perhatian: {overbudgetCategories.length} Kategori Melebihi Budget!
              </h4>
              <p className="text-red-700 dark:text-red-300 mt-0.5">
                {overbudgetCategories.map((o) => `${o.nama} (+${formatRupiah(o.kelebihan)})`).join(", ")}
              </p>
            </div>
          </div>
          <button
            onClick={() => onSwitchView("settings")}
            className="py-2 px-4 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs flex-shrink-0 cursor-pointer"
          >
            Sesuaikan Budget
          </button>
        </motion.div>
      )}

      {/* 2 Column Layout: Expense Donut Chart & Budget Status Table */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart Card */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Proporsi Pengeluaran
              </h3>
            </div>
            <span className="text-[11px] font-bold text-slate-400">
              {Object.keys(categoryExpenses).length} Kategori Aktif
            </span>
          </div>

          {Object.keys(categoryExpenses).length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              Belum ada data pengeluaran di bulan {getMonthDisplay(selectedMonth)}.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="space-y-2.5">
                {Object.entries(categoryExpenses)
                  .sort(([, a], [, b]) => b - a)
                  .map(([catName, amount], idx) => {
                    const pct = totalExpenseMonth > 0 ? (amount / totalExpenseMonth) * 100 : 0;
                    const color = colors[idx % colors.length];
                    return (
                      <div key={catName} className="space-y-1">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-semibold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                            <span
                              className="w-2.5 h-2.5 rounded-full inline-block"
                              style={{ backgroundColor: color }}
                            />
                            {catName}
                          </span>
                          <span className="font-extrabold text-slate-900 dark:text-white">
                            {formatRupiah(amount)} ({Math.round(pct)}%)
                          </span>
                        </div>
                        <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{
                              width: `${pct}%`,
                              backgroundColor: color,
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>

        {/* Budget Status Table */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target className="w-4 h-4 text-indigo-600" />
              <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                Status Budget Bulanan
              </h3>
            </div>
            <button
              onClick={() => onSwitchView("settings")}
              className="text-xs font-bold text-indigo-600 dark:text-indigo-400 hover:underline flex items-center gap-0.5 cursor-pointer"
            >
              <span>Kelola</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="border-b border-slate-100 dark:border-slate-800 text-slate-400 font-bold uppercase text-[10px]">
                  <th className="pb-2">Kategori</th>
                  <th className="pb-2 text-right">Budget</th>
                  <th className="pb-2 text-right">Terpakai</th>
                  <th className="pb-2 text-right">Sisa</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
                {expenseCategoriesList.map((cat) => {
                  const terpakai = categoryExpenses[cat.nama] || 0;
                  const sisa = cat.budget - terpakai;
                  const hasBudget = cat.budget > 0;
                  const isOver = hasBudget && sisa < 0;
                  const isWarning = hasBudget && sisa >= 0 && sisa < cat.budget * 0.2;

                  return (
                    <tr key={cat.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                      <td className="py-2.5 font-bold text-slate-800 dark:text-slate-200">
                        {cat.nama}
                      </td>
                      <td className="py-2.5 text-right font-medium text-slate-500">
                        {hasBudget ? formatRupiah(cat.budget) : "-"}
                      </td>
                      <td className="py-2.5 text-right font-bold text-slate-900 dark:text-white">
                        {formatRupiah(terpakai)}
                      </td>
                      <td className="py-2.5 text-right font-extrabold">
                        {hasBudget ? (
                          <span
                            className={
                              isOver
                                ? "text-red-600 dark:text-red-400 font-black"
                                : isWarning
                                ? "text-amber-500 font-bold"
                                : "text-emerald-600 dark:text-emerald-400 font-bold"
                            }
                          >
                            {isOver ? `-${formatRupiah(Math.abs(sisa))}` : formatRupiah(sisa)}
                          </span>
                        ) : (
                          <span className="text-slate-400 italic font-normal">Tanpa limit</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* AI Financial Advisor Box */}
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 dark:from-slate-900 dark:to-indigo-950/40 p-5 sm:p-6 rounded-3xl border border-indigo-100 dark:border-indigo-900/60 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-indigo-600 text-white flex items-center justify-center shadow-md shadow-indigo-600/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white flex items-center gap-1.5">
                <span>Konsultan Finansial AI Gemini</span>
                <span className="text-[10px] px-2 py-0.5 rounded-md bg-indigo-100 dark:bg-indigo-900 text-indigo-700 dark:text-indigo-300 font-bold">
                  Advisor
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Analisis pengeluaran dan rekomendasi penghematan cerdas
              </p>
            </div>
          </div>

          <button
            onClick={fetchFinancialAdvice}
            disabled={loadingAdvice}
            className="py-2.5 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all hover:scale-105 cursor-pointer"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-300" />
            <span>{loadingAdvice ? "Menganalisis..." : "Minta Saran Keuangan"}</span>
          </button>
        </div>

        {aiAdvice && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-indigo-200 dark:border-indigo-800/80 text-xs text-slate-700 dark:text-slate-200 leading-relaxed whitespace-pre-line"
          >
            {aiAdvice}
          </motion.div>
        )}
      </div>

      {/* Print Report Modal */}
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
