import React, { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  Save,
  RotateCcw,
  Sparkles,
  Camera,
  Mic,
  AlertTriangle,
  CheckCircle2,
  Calendar,
  Tag,
  FileText,
  CreditCard,
} from "lucide-react";
import { Category, Transaction } from "../types";
import { formatRupiah, parseRupiahInput } from "../utils/storage";

interface InputViewProps {
  categories: Category[];
  transactions: Transaction[];
  onSaveTransaction: (transaction: Omit<Transaction, "id">) => void;
  onOpenAIModal: () => void;
  editingTransaction?: Transaction | null;
  onCancelEdit?: () => void;
}

export const InputView: React.FC<InputViewProps> = ({
  categories,
  transactions,
  onSaveTransaction,
  onOpenAIModal,
  editingTransaction,
  onCancelEdit,
}) => {
  const [tanggal, setTanggal] = useState(new Date().toISOString().split("T")[0]);
  const [jenis, setJenis] = useState<"Pengeluaran" | "Pemasukan">("Pengeluaran");
  const [kategori, setKategori] = useState("");
  const [nama, setNama] = useState("");
  const [nominalStr, setNominalStr] = useState("");
  const [catatan, setCatatan] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Sync editing transaction if provided
  useEffect(() => {
    if (editingTransaction) {
      setTanggal(editingTransaction.tanggal);
      setJenis(editingTransaction.jenis);
      setKategori(editingTransaction.kategori);
      setNama(editingTransaction.nama);
      setNominalStr(formatRupiah(editingTransaction.nominal));
      setCatatan(editingTransaction.catatan || "");
    }
  }, [editingTransaction]);

  // Set default category when type changes
  useEffect(() => {
    const available = categories.filter((c) => c.jenis === jenis);
    if (available.length > 0 && !available.some((c) => c.nama === kategori)) {
      setKategori(available[0].nama);
    }
  }, [jenis, categories]);

  const rawNominal = parseRupiahInput(nominalStr);

  // Check if this input will cause overbudget
  const selectedCategoryObj = categories.find(
    (c) => c.nama === kategori && c.jenis === "Pengeluaran"
  );
  const currentMonth = tanggal.substring(0, 7);
  const currentExpenseForCat = transactions
    .filter(
      (t) =>
        t.kategori === kategori &&
        t.jenis === "Pengeluaran" &&
        t.tanggal.startsWith(currentMonth) &&
        t.id !== editingTransaction?.id
    )
    .reduce((sum, t) => sum + t.nominal, 0);

  const willOverbudget =
    jenis === "Pengeluaran" &&
    selectedCategoryObj &&
    selectedCategoryObj.budget > 0 &&
    currentExpenseForCat + rawNominal > selectedCategoryObj.budget;

  const kelebihanPreview = willOverbudget
    ? currentExpenseForCat + rawNominal - selectedCategoryObj!.budget
    : 0;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) return;
    if (rawNominal <= 0) return;

    onSaveTransaction({
      tanggal,
      jenis,
      kategori: kategori || categories.filter((c) => c.jenis === jenis)[0]?.nama || "Lain-lain",
      nama: nama.trim(),
      nominal: rawNominal,
      catatan: catatan.trim(),
      source: "manual",
    });

    setSuccessMsg("Transaksi berhasil disimpan!");
    setTimeout(() => setSuccessMsg(""), 4000);

    if (!editingTransaction) {
      setNama("");
      setNominalStr("");
      setCatatan("");
    }
  };

  const handleReset = () => {
    if (onCancelEdit && editingTransaction) {
      onCancelEdit();
    }
    setTanggal(new Date().toISOString().split("T")[0]);
    setJenis("Pengeluaran");
    setNama("");
    setNominalStr("");
    setCatatan("");
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* AI Quick Banner */}
      {!editingTransaction && (
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-5 rounded-3xl text-white shadow-lg shadow-indigo-600/20 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3 text-center sm:text-left">
            <div className="w-12 h-12 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white flex-shrink-0">
              <Sparkles className="w-6 h-6 text-amber-300 animate-pulse" />
            </div>
            <div>
              <h3 className="text-sm font-black leading-tight">
                Malas Mengetik Manual? Gunakan AI Gemini!
              </h3>
              <p className="text-xs text-indigo-100 mt-0.5">
                Cukup foto struk atau rekam suara, AI akan mengisi nominal otomatis.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onOpenAIModal}
            className="w-full sm:w-auto py-2.5 px-5 bg-white hover:bg-slate-100 text-indigo-700 rounded-xl text-xs font-black shadow-md flex items-center justify-center gap-2 transition-all hover:scale-105 flex-shrink-0"
          >
            <Camera className="w-4 h-4 text-indigo-600" />
            <Mic className="w-4 h-4 text-violet-600" />
            <span>Catat via AI</span>
          </button>
        </div>
      )}

      {/* Main Input Form Card */}
      <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 mb-6 border-b border-slate-100 dark:border-slate-800">
          <div>
            <h2 className="text-base font-black text-slate-900 dark:text-white">
              {editingTransaction ? "Edit Catatan Transaksi" : "Formulir Catat Keuangan"}
            </h2>
            <p className="text-xs text-slate-400">
              {editingTransaction ? "Perbarui rincian transaksi Anda" : "Input pengeluaran atau pemasukan baru"}
            </p>
          </div>

          {editingTransaction && onCancelEdit && (
            <button
              onClick={onCancelEdit}
              className="text-xs font-bold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              Batal Edit
            </button>
          )}
        </div>

        {successMsg && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-5 p-3.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-2"
          >
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>{successMsg}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Tanggal & Jenis */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5 text-indigo-500" />
                <span>Tanggal</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                <CreditCard className="w-3.5 h-3.5 text-indigo-500" />
                <span>Jenis Transaksi</span>
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setJenis("Pengeluaran")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    jenis === "Pengeluaran"
                      ? "bg-rose-50 dark:bg-rose-950/60 border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => setJenis("Pemasukan")}
                  className={`py-2.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                    jenis === "Pemasukan"
                      ? "bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 shadow-xs"
                      : "bg-slate-50 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-500"
                  }`}
                >
                  Pemasukan
                </button>
              </div>
            </div>
          </div>

          {/* Kategori */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <Tag className="w-3.5 h-3.5 text-indigo-500" />
              <span>Kategori</span>
            </label>
            <select
              required
              value={kategori}
              onChange={(e) => setKategori(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            >
              {categories
                .filter((c) => c.jenis === jenis)
                .map((c) => (
                  <option key={c.id} value={c.nama}>
                    {c.nama} {c.budget > 0 ? `(Budget: ${formatRupiah(c.budget)})` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* Nama / Keterangan Transaksi */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
              <FileText className="w-3.5 h-3.5 text-indigo-500" />
              <span>Keterangan Transaksi</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Belanja Bulanan di Supermarket, Makan Siang, Bensin"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm font-semibold text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Nominal (Rupiah Formatted) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Nominal (Rp)
            </label>
            <input
              type="text"
              inputMode="numeric"
              required
              placeholder="Rp 0"
              value={nominalStr}
              onChange={(e) => {
                const parsed = parseRupiahInput(e.target.value);
                setNominalStr(parsed > 0 ? formatRupiah(parsed) : "");
              }}
              className="w-full px-5 py-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl text-2xl font-black text-slate-900 dark:text-white placeholder:text-slate-300 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Overbudget Live Warning Indicator */}
          {willOverbudget && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="p-3.5 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-start gap-2.5"
            >
              <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-500 animate-bounce" />
              <div>
                <strong className="block font-bold">
                  Peringatan: Pengeluaran ini akan melebihi budget {kategori}!
                </strong>
                <p className="mt-0.5 text-[11px]">
                  Budget: {formatRupiah(selectedCategoryObj!.budget)} • Terpakai: {formatRupiah(currentExpenseForCat)} • Melebihi: +{formatRupiah(kelebihanPreview)}. Notifikasi chat alert akan dikirim setelah disimpan.
                </p>
              </div>
            </motion.div>
          )}

          {/* Catatan Tambahan (Opsional) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
              Catatan Tambahan (Opsional)
            </label>
            <textarea
              rows={2}
              placeholder="Catatan kecil / rincian opsional..."
              value={catatan}
              onChange={(e) => setCatatan(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-medium text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
            />
          </div>

          {/* Submit & Reset Buttons */}
          <div className="flex gap-3 pt-3">
            <button
              type="button"
              onClick={handleReset}
              className="w-1/3 py-3.5 px-4 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-2xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset</span>
            </button>

            <button
              type="submit"
              className="w-2/3 py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-2xl text-xs font-bold shadow-lg shadow-indigo-600/25 transition-all hover:scale-[1.01] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <Save className="w-4 h-4" />
              <span>{editingTransaction ? "Perbarui Transaksi" : "Simpan Transaksi"}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
