import React, { useRef, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Printer,
  X,
  Calendar,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  TrendingUp,
  Building,
  ShieldCheck,
  CheckCircle,
  FileText,
} from "lucide-react";
import { Category, Transaction } from "../types";
import { formatRupiah, getMonthDisplay } from "../utils/storage";
import { SakuGeniusLogo } from "./SakuGeniusLogo";
import { toCanvas } from "html-to-image";
import { jsPDF } from "jspdf";

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
  const [topLogoError, setTopLogoError] = useState(false);
  const [docLogoError, setDocLogoError] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Filter transactions by month
  const monthTransactions = transactions
    .filter((t) => t.tanggal.startsWith(selectedMonth))
    .sort(
      (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime(),
    );

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
      categoryExpenses[t.kategori] =
        (categoryExpenses[t.kategori] || 0) + t.nominal;
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

  const handlePrint = async () => {
    const element = document.getElementById("printable-report");
    if (!element) return;

    setIsGenerating(true);

    try {
      const canvas = await toCanvas(element, {
        pixelRatio: 2,
        backgroundColor: "#ffffff",
      });

      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");

      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = pdf.internal.pageSize.getHeight();

      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const ratio = pdfWidth / canvasWidth;

      const imgHeight = canvasHeight * ratio;
      let heightLeft = imgHeight;
      let position = 0;

      pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
      heightLeft -= pdfHeight;

      while (heightLeft > 0) {
        position = heightLeft - imgHeight;
        pdf.addPage();
        pdf.addImage(imgData, "PNG", 0, position, pdfWidth, imgHeight);
        heightLeft -= pdfHeight;
      }

      pdf.save(
        `Laporan_Keuangan_${selectedMonth}_${userName.replace(/\s+/g, "_")}.pdf`,
      );
    } catch (err) {
      console.error("Gagal mencetak PDF:", err);
      alert("Terjadi kesalahan saat memproses PDF.");
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-2 sm:p-4 bg-slate-950/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        className="w-full max-w-4xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-4 max-h-[92vh] flex flex-col"
      >
        {/* Modal Top Action Bar */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            {!topLogoError ? (
              <img
                src="/logo.png"
                alt="Logo"
                onError={() => setTopLogoError(true)}
                className="w-8 h-8 object-contain rounded-xl shadow-xs"
                referrerPolicy="no-referrer"
              />
            ) : (
              <SakuGeniusLogo className="w-8 h-8 rounded-xl" />
            )}
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
              onClick={handlePrint}
              disabled={isGenerating}
              className="py-1.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-black shadow-md shadow-rose-600/20 flex items-center gap-1.5 transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 disabled:cursor-not-allowed"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{isGenerating ? "Memproses..." : "Download PDF"}</span>
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
        <div className="flex-1 overflow-auto bg-slate-100 dark:bg-slate-900 p-4">
          <div className="flex justify-center min-w-max">
            <div
              id="printable-report"
              className="bg-white text-slate-900 font-sans p-10 shadow-sm rounded-none sm:rounded-xl shrink-0"
              style={{ width: "800px", minWidth: "800px", minHeight: "1131px" }}
            >
              {/* Header Section */}
              <div className="flex justify-between items-start mb-10">
                <div className="flex items-start gap-4">
                  {!docLogoError ? (
                    <img
                      src="/logo.png"
                      alt="Logo"
                      onError={() => setDocLogoError(true)}
                      className="w-12 h-12 object-contain"
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <SakuGeniusLogo className="w-12 h-12" />
                  )}
                  <div className="pt-0.5">
                    <h1 className="text-xl font-black tracking-widest text-slate-900 uppercase leading-none mb-1.5">
                      {appName || "SAKUGENIUS"}
                    </h1>
                    <h2 className="text-sm font-bold text-slate-800 tracking-wide uppercase">
                      LAPORAN KEUANGAN KAMU
                    </h2>
                    <div className="mt-8 text-[11px] text-slate-600 space-y-1.5">
                      <p className="uppercase">YTH. {userName || "PENGGUNA"}</p>
                      <p className="uppercase">
                        {userEmail || "PENGGUNA@SAKUGENIUS.APP"}
                      </p>
                      <p className="uppercase mt-2">INDONESIA</p>
                    </div>
                  </div>
                </div>

                <div className="text-right text-[10px] text-slate-700">
                  <table className="ml-auto text-left uppercase">
                    <tbody>
                      <tr>
                        <td className="pr-4 py-0.5">HALAMAN</td>
                        <td className="font-semibold text-slate-900">: 1/1</td>
                      </tr>
                      <tr>
                        <td className="pr-4 py-0.5">PERIODE</td>
                        <td className="font-semibold text-slate-900">
                          : {getMonthDisplay(selectedMonth)}
                        </td>
                      </tr>
                      <tr>
                        <td className="pr-4 py-0.5">MATA UANG</td>
                        <td className="font-semibold text-slate-900">: IDR</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>

              <div className="border-t border-slate-300 pt-4 mb-8">
                <h3 className="text-[11px] font-bold text-slate-900 uppercase mb-1">
                  CATATAN:
                </h3>
                <p className="text-[11px] text-slate-600">
                  {appName || "SakuGenius"} mencatat sesuai dengan input
                  transaksi pengguna dalam rentang waktu 1 bulan.
                </p>
              </div>

              {/* Budget Monitor Section */}
              {expenseCategories.length > 0 && (
                <div className="mb-10">
                  <h3 className="text-[11px] font-bold text-slate-900 uppercase mb-3 border-b border-slate-300 pb-1.5">
                    MONITOR ANGGARAN & PENGELUARAN KATEGORI
                  </h3>
                  <div className="grid grid-cols-2 gap-x-8 gap-y-4">
                    {expenseCategories.map((cat) => {
                      const used = categoryExpenses[cat.nama] || 0;
                      const pct =
                        cat.budget > 0 ? (used / cat.budget) * 100 : 0;
                      const isOver = cat.budget > 0 && used > cat.budget;

                      return (
                        <div key={cat.id} className="text-[11px]">
                          <div className="flex justify-between items-end mb-1.5">
                            <span className="font-bold text-slate-800 uppercase">
                              {cat.nama}
                            </span>
                            <span
                              className={`${isOver ? "text-red-700 font-bold" : "text-slate-600"}`}
                            >
                              Rp {used.toLocaleString("id-ID")}{" "}
                              {cat.budget > 0
                                ? `/ Rp ${cat.budget.toLocaleString("id-ID")}`
                                : ""}
                            </span>
                          </div>
                          {cat.budget > 0 && (
                            <div className="w-full bg-slate-100 h-1.5 rounded-none overflow-hidden">
                              <div
                                className={`h-full ${
                                  isOver
                                    ? "bg-red-600"
                                    : pct > 80
                                      ? "bg-amber-500"
                                      : "bg-slate-800"
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
              <div className="mb-10">
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="border-y border-slate-900 text-left font-bold uppercase text-slate-900">
                      <th className="py-3 px-2 w-28">TANGGAL</th>
                      <th className="py-3 px-2">KETERANGAN</th>
                      <th className="py-3 px-2 text-right w-40">
                        MUTASI KREDIT (CR)
                      </th>
                      <th className="py-3 px-2 text-right w-40">
                        MUTASI DEBIT (DB)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {monthTransactions.length === 0 ? (
                      <tr>
                        <td
                          colSpan={4}
                          className="py-8 text-center text-slate-500 italic"
                        >
                          Tidak ada data transaksi pada periode ini.
                        </td>
                      </tr>
                    ) : (
                      monthTransactions.map((t) => {
                        const [year, month, day] = t.tanggal.split("-");

                        return (
                          <tr key={t.id} className="text-slate-700">
                            <td className="py-4 px-2 align-top">
                              {day}/{month}
                            </td>
                            <td className="py-4 px-2">
                              <strong className="text-slate-900 uppercase block mb-1">
                                {t.kategori}
                              </strong>
                              <span className="text-slate-500">{t.nama}</span>
                            </td>
                            <td className="py-4 px-2 text-right align-top">
                              {t.jenis === "Pemasukan"
                                ? t.nominal.toLocaleString("id-ID")
                                : ""}
                            </td>
                            <td className="py-4 px-2 text-right align-top">
                              {t.jenis === "Pengeluaran"
                                ? t.nominal.toLocaleString("id-ID")
                                : ""}
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>

              {/* Document Footer */}
              <div className="border-t border-slate-300 pt-6 flex justify-between items-start text-[11px]">
                <div className="text-slate-400 italic">
                  Dicetak: {new Date().toLocaleDateString("id-ID")},{" "}
                  {new Date().toLocaleTimeString("id-ID")}
                </div>
                <div className="w-72">
                  <table className="w-full text-slate-900 font-bold uppercase">
                    <tbody>
                      <tr>
                        <td className="py-1">MUTASI CR</td>
                        <td className="w-4 text-center">:</td>
                        <td className="text-right py-1">
                          Rp {totalIncome.toLocaleString("id-ID")}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-1">MUTASI DB</td>
                        <td className="w-4 text-center">:</td>
                        <td className="text-right py-1">
                          Rp {totalExpense.toLocaleString("id-ID")}
                        </td>
                      </tr>
                      <tr>
                        <td className="py-2 mt-1">SALDO (ALL TIME)</td>
                        <td className="w-4 text-center">:</td>
                        <td className="text-right py-2">
                          Rp {totalBalanceAllTime.toLocaleString("id-ID")}
                        </td>
                      </tr>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
