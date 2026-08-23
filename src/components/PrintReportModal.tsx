import React, { useRef } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Printer,
  X,
  Download,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  FileSpreadsheet,
  Building,
  ShieldCheck,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Category, Transaction } from "../types";
import { formatRupiah, getMonthDisplay } from "../utils/storage";

interface PrintReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  categories: Category[];
  selectedMonth: string;
  onChangeMonth: (m: string) => void;
  userName: string;
  userPhone: string;
  userEmail: string;
  appName: string;
}

export const PrintReportModal: React.FC<PrintReportModalProps> = ({
  isOpen,
  onClose,
  transactions,
  categories,
  selectedMonth,
  onChangeMonth,
  userName,
  userPhone,
  userEmail,
  appName,
}) => {
  if (!isOpen) return null;

  // Filter transactions by month
  const monthTransactions = transactions
    .filter((t) => t.tanggal.startsWith(selectedMonth))
    .sort((a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime());

  // Calculations
  const totalIncome = monthTransactions
    .filter((t) => t.jenis === "Pemasukan")
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalExpense = monthTransactions
    .filter((t) => t.jenis === "Pengeluaran")
    .reduce((sum, t) => sum + t.nominal, 0);

  const netSavings = totalIncome - totalExpense;

  const totalBalanceAllTime = transactions.reduce((acc, t) => {
    return t.jenis === "Pemasukan" ? acc + t.nominal : acc - t.nominal;
  }, 0);

  // Category expense breakdown
  const categoryExpenses: { [key: string]: number } = {};
  monthTransactions
    .filter((t) => t.jenis === "Pengeluaran")
    .forEach((t) => {
      categoryExpenses[t.kategori] = (categoryExpenses[t.kategori] || 0) + t.nominal;
    });

  const expenseCategories = categories.filter((c) => c.jenis === "Pengeluaran");

  // Running balance calculation for mutation table
  let runningBalance = 0;
  const transactionsWithBalance = monthTransactions.map((t) => {
    if (t.jenis === "Pemasukan") {
      runningBalance += t.nominal;
    } else {
      runningBalance -= t.nominal;
    }
    return { ...t, runningBalance };
  });

  const handlePrint = () => {
    window.print();
  };

  const handleExportCSV = () => {
    const headers = ["No", "Tanggal", "Nama Transaksi", "Jenis", "Kategori", "Nominal", "Catatan", "Sumber"];
    const rows = monthTransactions.map((t, idx) => [
      idx + 1,
      t.tanggal,
      `"${t.nama.replace(/"/g, '""')}"`,
      t.jenis,
      `"${t.kategori}"`,
      t.nominal,
      `"${(t.catatan || "").replace(/"/g, '""')}"`,
      t.source || "manual",
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Laporan_Keuangan_${selectedMonth}_${userName.replace(/\s+/g, "_")}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto print:p-0 print:bg-white">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col print:border-none print:shadow-none print:max-h-none print:rounded-none print:m-0"
      >
        {/* Modal Top Action Bar (Hidden in Print) */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between gap-3 no-print">
          <div className="flex items-center gap-2.5">
            <img
              src="/Logo.png"
              alt="Logo"
              className="w-8 h-8 object-contain rounded-xl shadow-xs"
              referrerPolicy="no-referrer"
            />
            <div>
              <h3 className="text-xs font-black text-slate-900 dark:text-white">
                Pratinjau Dokumen Cetak PDF
              </h3>
              <p className="text-[10px] text-slate-400">
                Format Laporan Keuangan Standar & Manajemen Arus Kas
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => e.target.value && onChangeMonth(e.target.value)}
              className="px-2.5 py-1.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 text-xs font-bold text-indigo-600 dark:text-indigo-400 focus:outline-none"
            />

            <button
              onClick={handleExportCSV}
              className="py-1.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center gap-1.5 transition-all"
              title="Unduh format spreadsheet CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">CSV</span>
            </button>

            <button
              onClick={handlePrint}
              className="py-1.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Cetak / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-white rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* PRINTABLE FINANCIAL STATEMENT CANVAS */}
        <div className="flex-1 overflow-y-auto p-6 sm:p-10 bg-white text-slate-900 font-sans print:overflow-visible print:p-0">
          {/* Header Section */}
          <div className="border-b-2 border-slate-900 pb-6 mb-6">
            <div className="flex justify-between items-start">
              <div>
                <div className="flex items-center gap-2.5 mb-1">
                  <img
                    src="/Logo.png"
                    alt="Logo"
                    className="w-9 h-9 object-contain rounded-lg shadow-xs"
                    referrerPolicy="no-referrer"
                  />
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight text-slate-950 uppercase">
                    {appName || "SAKUGENIUS"}
                  </h1>
                </div>
                <h2 className="text-xs font-bold text-slate-700 tracking-wider uppercase">
                  LAPORAN KEUANGAN
                </h2>
                <p className="text-[11px] text-slate-500 mt-1">
                  Smart Financial Management & AI Bookkeeping System
                </p>
              </div>

              <div className="text-right text-[11px] text-slate-700 space-y-0.5">
                <div className="px-2.5 py-1 bg-slate-100 rounded text-[10px] font-bold text-slate-800 uppercase inline-block mb-1">
                  Dokumen Resmi
                </div>
                <p>
                  Periode: <strong className="text-slate-900">{getMonthDisplay(selectedMonth).toUpperCase()}</strong>
                </p>
                <p>
                  Dicetak: <span>{new Date().toLocaleDateString("id-ID", { day: "numeric", month: "long", year: "numeric" })}</span>
                </p>
                <p>Mata Uang: <strong>IDR (Rupiah)</strong></p>
              </div>
            </div>

            {/* Account Owner Card */}
            <div className="mt-4 p-3.5 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Nama Pemilik Akun</span>
                <strong className="text-slate-900">{userName || "Pengguna"}</strong>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Kontak / WhatsApp</span>
                <span className="text-slate-800">{userPhone || "-"}</span>
              </div>
              <div>
                <span className="text-[10px] text-slate-400 font-bold uppercase block">Email Terdaftar</span>
                <span className="text-slate-800">{userEmail || "-"}</span>
              </div>
            </div>
          </div>

          {/* Financial Summary Highlight Cards */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-emerald-800 uppercase block">Total Pemasukan (CR)</span>
              <strong className="text-xs sm:text-sm text-emerald-700 font-black">
                {formatRupiah(totalIncome)}
              </strong>
            </div>

            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-rose-800 uppercase block">Total Pengeluaran (DB)</span>
              <strong className="text-xs sm:text-sm text-rose-700 font-black">
                {formatRupiah(totalExpense)}
              </strong>
            </div>

            <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-center">
              <span className="text-[10px] font-bold text-indigo-800 uppercase block">Arus Bersih Periode Ini</span>
              <strong className={`text-xs sm:text-sm font-black ${netSavings >= 0 ? "text-indigo-700" : "text-red-700"}`}>
                {formatRupiah(netSavings)}
              </strong>
            </div>

            <div className="p-3 bg-slate-100 border border-slate-300 rounded-xl text-center">
              <span className="text-[10px] font-bold text-slate-700 uppercase block">Saldo Total Akumulasi</span>
              <strong className="text-xs sm:text-sm text-slate-950 font-black">
                {formatRupiah(totalBalanceAllTime)}
              </strong>
            </div>
          </div>

          {/* Budget Monitor Section */}
          {expenseCategories.length > 0 && (
            <div className="mb-6 p-4 border border-slate-200 rounded-xl bg-slate-50/50">
              <h4 className="text-xs font-black uppercase text-slate-900 mb-3 flex items-center gap-1.5">
                <span>Monitor Anggaran & Budget Kategori</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                {expenseCategories.map((cat) => {
                  const used = categoryExpenses[cat.nama] || 0;
                  const pct = cat.budget > 0 ? (used / cat.budget) * 100 : 0;
                  const isOver = cat.budget > 0 && used > cat.budget;

                  return (
                    <div key={cat.id} className="p-2.5 bg-white rounded-lg border border-slate-200">
                      <div className="flex justify-between items-center text-[11px] mb-1">
                        <strong className="text-slate-900">{cat.nama}</strong>
                        <span className={isOver ? "text-red-600 font-bold" : "text-slate-600"}>
                          {formatRupiah(used)} {cat.budget > 0 ? `/ ${formatRupiah(cat.budget)}` : ""}
                        </span>
                      </div>
                      {cat.budget > 0 && (
                        <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${
                              isOver ? "bg-red-500" : pct > 80 ? "bg-amber-500" : "bg-indigo-600"
                            }`}
                            style={{ width: `${Math.min(pct, 100)}%` }}
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Mutation Table Section */}
          <div className="mb-6">
            <h4 className="text-xs font-black uppercase text-slate-900 mb-2">
              Rincian Mutasi Transaksi ({monthTransactions.length} Data)
            </h4>

            {monthTransactions.length === 0 ? (
              <div className="py-8 text-center text-slate-400 text-xs border border-dashed border-slate-200 rounded-xl">
                Tidak ada data transaksi pada periode {getMonthDisplay(selectedMonth)}.
              </div>
            ) : (
              <table className="w-full text-xs border-collapse border-t border-b border-slate-900">
                <thead>
                  <tr className="bg-slate-100 border-b border-slate-400 text-left font-bold uppercase text-[10px] text-slate-800">
                    <th className="py-2.5 px-2">No</th>
                    <th className="py-2.5 px-2">Tanggal</th>
                    <th className="py-2.5 px-2">Deskripsi & Kategori</th>
                    <th className="py-2.5 px-2">Catatan / Sumber</th>
                    <th className="py-2.5 px-2 text-right">Debit (DB)</th>
                    <th className="py-2.5 px-2 text-right">Kredit (CR)</th>
                    <th className="py-2.5 px-2 text-right">Saldo Mutasi</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {transactionsWithBalance.map((t, idx) => (
                    <tr key={t.id} className="hover:bg-slate-50">
                      <td className="py-2 px-2 text-slate-500">{idx + 1}</td>
                      <td className="py-2 px-2 whitespace-nowrap text-slate-700 font-medium">
                        {t.tanggal}
                      </td>
                      <td className="py-2 px-2">
                        <strong className="text-slate-900 block">{t.nama}</strong>
                        <span className="text-[10px] text-indigo-700 font-semibold">{t.kategori}</span>
                      </td>
                      <td className="py-2 px-2 text-[11px] text-slate-600">
                        {t.catatan || "-"}
                        {t.source && t.source !== "manual" && (
                          <span className="block text-[9px] text-slate-400 uppercase font-mono">
                            via {t.source.replace("_", " ")}
                          </span>
                        )}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-rose-700">
                        {t.jenis === "Pengeluaran" ? formatRupiah(t.nominal) : "-"}
                      </td>
                      <td className="py-2 px-2 text-right font-bold text-emerald-700">
                        {t.jenis === "Pemasukan" ? formatRupiah(t.nominal) : "-"}
                      </td>
                      <td className="py-2 px-2 text-right font-extrabold text-slate-900">
                        {formatRupiah(t.runningBalance)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Document Footer & Signatures */}
          <div className="pt-4 border-t-2 border-slate-900 grid grid-cols-2 sm:grid-cols-3 gap-6 items-end text-xs">
            <div>
              <div className="flex items-center gap-1 text-[11px] font-bold text-emerald-700 mb-1">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Dokumen Sah & Terverifikasi</span>
              </div>
              <p className="text-[10px] text-slate-500 leading-tight">
                Dicetak secara otomatis dari sistem {appName}. Tidak memerlukan tanda tangan basah untuk arsip digital.
              </p>
            </div>

            <div className="text-center sm:text-right col-span-1 sm:col-span-2 space-y-8">
              <p className="text-[11px] text-slate-600">
                {new Date().toLocaleDateString("id-ID", { dateStyle: "long" })}
              </p>
              <div className="pt-2">
                <p className="font-extrabold text-slate-900 border-t border-slate-400 inline-block px-8">
                  {userName || "Pemilik Rekening"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
