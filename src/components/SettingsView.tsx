import React, { useState } from "react";
import { motion } from "motion/react";
import {
  Tag,
  User,
  Plus,
  Edit2,
  Trash2,
  Save,
  X,
  ShieldCheck,
  Download,
  Upload,
  Volume2,
  VolumeX,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Sliders,
  RotateCcw,
  LogOut,
  Building,
} from "lucide-react";
import { Category, AppSettings } from "../types";
import { formatRupiah, parseRupiahInput } from "../utils/storage";

interface SettingsViewProps {
  categories: Category[];
  onSaveCategory: (category: Category) => void;
  onDeleteCategory: (id: string) => void;
  settings: AppSettings;
  onUpdateSettings: (settings: AppSettings) => void;
  onExportData: () => void;
  onImportData: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onLogout: () => void;
  userName: string;
  userPhone: string;
  userEmail: string;
  onUpdateUserProfile: (profile: { name: string; phone: string; email?: string }) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  categories,
  onSaveCategory,
  onDeleteCategory,
  settings,
  onUpdateSettings,
  onExportData,
  onImportData,
  onLogout,
  userName,
  userPhone,
  userEmail,
  onUpdateUserProfile,
}) => {
  const [activeTab, setActiveTab] = useState<"categories" | "profile" | "preferences" | "backup">("categories");

  // Category form state
  const [catId, setCatId] = useState<string | null>(null);
  const [catJenis, setCatJenis] = useState<"Pengeluaran" | "Pemasukan">("Pengeluaran");
  const [catNama, setCatNama] = useState("");
  const [catBudgetStr, setCatBudgetStr] = useState("");

  // Profile form state
  const [profName, setProfName] = useState(userName || settings.userName || "Pengguna");
  const [profPhone, setProfPhone] = useState(userPhone || settings.userPhone || "");
  const [profEmail, setProfEmail] = useState(userEmail || settings.userEmail || "");
  const [appName, setAppName] = useState(settings.appName || "SakuGenius");

  // Preferences state
  const [soundEnabled, setSoundEnabled] = useState(settings.soundEnabled);
  const [autoAiCategory, setAutoAiCategory] = useState(settings.autoAiCategory);
  const [notifySaved, setNotifySaved] = useState("");

  // Save / Update Category
  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!catNama.trim()) return;

    const budget = parseRupiahInput(catBudgetStr);
    onSaveCategory({
      id: catId || `c-${Date.now()}`,
      jenis: catJenis,
      nama: catNama.trim(),
      budget: catJenis === "Pengeluaran" ? budget : 0,
    });

    setCatId(null);
    setCatNama("");
    setCatBudgetStr("");
    setNotifySaved("Kategori berhasil disimpan!");
    setTimeout(() => setNotifySaved(""), 3000);
  };

  const handleEditCategory = (cat: Category) => {
    setCatId(cat.id);
    setCatJenis(cat.jenis);
    setCatNama(cat.nama);
    setCatBudgetStr(cat.budget > 0 ? formatRupiah(cat.budget) : "");
  };

  const handleCancelCategoryEdit = () => {
    setCatId(null);
    setCatNama("");
    setCatBudgetStr("");
  };

  // Save Profile & App Settings
  const handleSaveProfile = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUserProfile({
      name: profName.trim() || "Pengguna",
      phone: profPhone.trim(),
      email: profEmail.trim(),
    });

    onUpdateSettings({
      ...settings,
      appName: appName.trim() || "SakuGenius",
      userName: profName.trim(),
      userPhone: profPhone.trim(),
      userEmail: profEmail.trim(),
    });

    setNotifySaved("Profil & nama aplikasi berhasil diperbarui!");
    setTimeout(() => setNotifySaved(""), 3000);
  };

  // Save System Preferences
  const handleSavePreferences = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateSettings({
      ...settings,
      soundEnabled,
      autoAiCategory,
    });

    setNotifySaved("Preferensi sistem berhasil disimpan!");
    setTimeout(() => setNotifySaved(""), 3000);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Toast Notification */}
      {notifySaved && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800 text-emerald-800 dark:text-emerald-300 rounded-2xl flex items-center gap-2.5 text-xs font-bold shadow-sm"
        >
          <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
          <span>{notifySaved}</span>
        </motion.div>
      )}

      {/* Navigation Tabs */}
      <div className="flex bg-slate-100 dark:bg-slate-800/80 p-1.5 rounded-2xl border border-slate-200 dark:border-slate-700/60 overflow-x-auto gap-1">
        <button
          onClick={() => setActiveTab("categories")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "categories"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Tag className="w-4 h-4" />
          <span>Kategori & Budget</span>
        </button>

        <button
          onClick={() => setActiveTab("profile")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "profile"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <User className="w-4 h-4" />
          <span>Profil Pengguna</span>
        </button>

        <button
          onClick={() => setActiveTab("preferences")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "preferences"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Sliders className="w-4 h-4" />
          <span>Preferensi & Suara</span>
        </button>

        <button
          onClick={() => setActiveTab("backup")}
          className={`flex-1 min-w-[140px] py-2.5 px-3 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
            activeTab === "backup"
              ? "bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200/60 dark:border-slate-700"
              : "text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
          }`}
        >
          <Download className="w-4 h-4" />
          <span>Cadangan & Reset</span>
        </button>
      </div>

      {/* TAB 1: KATEGORI & BUDGET */}
      {activeTab === "categories" && (
        <div className="space-y-6">
          {/* Add / Edit Category Form */}
          <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-black text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Tag className="w-4 h-4 text-indigo-600" />
              <span>{catId ? "Edit Kategori & Budget" : "Tambah Kategori Baru"}</span>
            </h3>

            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Jenis Transaksi
                  </label>
                  <select
                    value={catJenis}
                    onChange={(e) => setCatJenis(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-bold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  >
                    <option value="Pengeluaran">Pengeluaran</option>
                    <option value="Pemasukan">Pemasukan</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Nama Kategori
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Belanja Bulanan"
                    value={catNama}
                    onChange={(e) => setCatNama(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-500 mb-1">
                    Batas Budget / Bulan (Rp)
                  </label>
                  <input
                    type="text"
                    disabled={catJenis === "Pemasukan"}
                    placeholder={catJenis === "Pemasukan" ? "Tanpa Limit (Pemasukan)" : "Contoh: 1.500.000"}
                    value={catBudgetStr}
                    onChange={(e) => {
                      const val = parseRupiahInput(e.target.value);
                      setCatBudgetStr(val > 0 ? formatRupiah(val) : "");
                    }}
                    className={`w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none ${
                      catJenis === "Pemasukan" ? "opacity-50 cursor-not-allowed" : ""
                    }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                {catId && (
                  <button
                    type="button"
                    onClick={handleCancelCategoryEdit}
                    className="px-4 py-2 bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-xl text-xs font-bold transition-colors"
                  >
                    Batal
                  </button>
                )}
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
                >
                  <Save className="w-3.5 h-3.5" />
                  <span>{catId ? "Simpan Perubahan" : "Tambah Kategori"}</span>
                </button>
              </div>
            </form>
          </div>

          {/* Category List */}
          <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
            <div className="p-5 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <div>
                <h4 className="text-xs font-black uppercase text-slate-400 tracking-wider">
                  Daftar Kategori Terdaftar ({categories.length})
                </h4>
                <p className="text-xs text-slate-500 mt-0.5">
                  Kelola kategori pengeluaran & pemasukan serta alokasi anggaran bulanan
                </p>
              </div>
            </div>

            <div className="divide-y divide-slate-100 dark:divide-slate-800">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`w-2.5 h-2.5 rounded-full ${
                        cat.jenis === "Pemasukan" ? "bg-emerald-500" : "bg-indigo-500"
                      }`}
                    />
                    <div>
                      <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                        {cat.nama}
                      </h5>
                      <div className="flex items-center gap-2 text-[11px] text-slate-400">
                        <span className="font-medium">{cat.jenis}</span>
                        {cat.jenis === "Pengeluaran" && (
                          <>
                            <span>•</span>
                            <span className="font-bold text-indigo-600 dark:text-indigo-400">
                              Budget: {cat.budget > 0 ? formatRupiah(cat.budget) : "Tanpa Limit"}
                            </span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleEditCategory(cat)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Hapus"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PROFIL PENGGUNA */}
      {activeTab === "profile" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black">
              <User className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Profil Pemilik & Nama Usaha
              </h3>
              <p className="text-xs text-slate-500">
                Informasi ini akan tercetak pada lembar laporan keuangan resmi
              </p>
            </div>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Nama Pemilik / Nasabah
                </label>
                <input
                  type="text"
                  required
                  value={profName}
                  onChange={(e) => setProfName(e.target.value)}
                  placeholder="Contoh: Budi Santoso"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Nama Aplikasi / Usaha
                </label>
                <input
                  type="text"
                  required
                  value={appName}
                  onChange={(e) => setAppName(e.target.value)}
                  placeholder="Contoh: SakuGenius"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Nomor HP / WhatsApp
                </label>
                <input
                  type="text"
                  value={profPhone}
                  onChange={(e) => setProfPhone(e.target.value)}
                  placeholder="Contoh: 081234567890"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-500 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={profEmail}
                  onChange={(e) => setProfEmail(e.target.value)}
                  placeholder="Contoh: budi@gmail.com"
                  className="w-full px-3.5 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {settings.licenseCode && (
              <div className="p-3.5 bg-indigo-50 dark:bg-slate-800/80 border border-indigo-100 dark:border-slate-700 rounded-2xl flex items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                    <ShieldCheck className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
                      Kode Akses PRO (Tersinkronisasi Google Sheet)
                    </span>
                    <strong className="text-xs font-mono font-bold text-indigo-700 dark:text-indigo-400">
                      {settings.licenseCode}
                    </strong>
                  </div>
                </div>
                <span className="text-[10px] font-bold px-2.5 py-1 rounded-lg bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Status: Terverifikasi / Aktif
                </span>
              </div>
            )}

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Profil</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 3: PREFERENSI & SUARA */}
      {activeTab === "preferences" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black">
              <Sliders className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Preferensi Sistem & Notifikasi
              </h3>
              <p className="text-xs text-slate-500">
                Atur efek audio peringatan dan kecerdasan buatan
              </p>
            </div>
          </div>

          <form onSubmit={handleSavePreferences} className="space-y-4">
            <div className="space-y-4">
              {/* Sound toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5 text-indigo-600" />
                  ) : (
                    <VolumeX className="w-5 h-5 text-slate-400" />
                  )}
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Efek Suara Notifikasi & Peringatan Budget
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      Bunyikan suara interaktif saat transaksi tersimpan atau budget melebihi limit
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={soundEnabled}
                  onChange={(e) => setSoundEnabled(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded-lg cursor-pointer"
                />
              </div>

              {/* AI Auto Category toggle */}
              <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/60 dark:border-slate-700">
                <div className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                  <div>
                    <h5 className="font-extrabold text-xs text-slate-900 dark:text-white">
                      Auto-Mapping Kategori AI
                    </h5>
                    <p className="text-[11px] text-slate-500">
                      AI Gemini otomatis memetakan transaksi baru ke kategori yang paling sesuai
                    </p>
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={autoAiCategory}
                  onChange={(e) => setAutoAiCategory(e.target.checked)}
                  className="w-5 h-5 text-indigo-600 rounded-lg cursor-pointer"
                />
              </div>
            </div>

            <div className="flex justify-end pt-3">
              <button
                type="submit"
                className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-600/20 flex items-center gap-1.5 transition-all hover:scale-105"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Simpan Preferensi</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* TAB 4: CADANGAN & RESET */}
      {activeTab === "backup" && (
        <div className="bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-xs space-y-6">
          <div className="flex items-center gap-2.5 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 dark:bg-indigo-900/60 text-indigo-700 dark:text-indigo-300 flex items-center justify-center font-black">
              <Download className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-black text-slate-900 dark:text-white">
                Cadangan, Pulihkan & Sesi
              </h3>
              <p className="text-xs text-slate-500">
                Ekspor data ke file JSON atau pulihkan data keuangan kapan saja
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Backup */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mb-1">
                  Cadangkan Semua Data (JSON)
                </h5>
                <p className="text-[11px] text-slate-500 mb-4">
                  Unduh seluruh histori transaksi, kategori, budget, dan setelan ke file cadangan.
                </p>
              </div>
              <button
                onClick={onExportData}
                className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 shadow-xs transition-colors"
              >
                <Download className="w-4 h-4" />
                <span>Unduh Cadangan Data</span>
              </button>
            </div>

            {/* Restore */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex flex-col justify-between">
              <div>
                <h5 className="font-extrabold text-xs text-slate-900 dark:text-white mb-1">
                  Pulihkan dari File JSON
                </h5>
                <p className="text-[11px] text-slate-500 mb-4">
                  Pilih file cadangan JSON yang telah diekspor sebelumnya untuk mengembalikan data.
                </p>
              </div>
              <label className="w-full py-2.5 bg-slate-200 dark:bg-slate-700 hover:bg-slate-300 dark:hover:bg-slate-600 text-slate-800 dark:text-white rounded-xl text-xs font-bold flex items-center justify-center gap-2 cursor-pointer transition-colors">
                <Upload className="w-4 h-4" />
                <span>Pilih File Cadangan</span>
                <input
                  type="file"
                  accept=".json"
                  onChange={onImportData}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Session Logout & Reset Area */}
          <div className="p-4 rounded-2xl bg-red-50/60 dark:bg-red-950/30 border border-red-200 dark:border-red-900/60 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div>
              <h5 className="font-extrabold text-xs text-red-900 dark:text-red-300">
                Kunci / Keluar dari Sesi
              </h5>
              <p className="text-[11px] text-red-700 dark:text-red-400">
                Keluar dari aplikasi dan kembali ke layar sambutan
              </p>
            </div>

            <button
              onClick={onLogout}
              className="py-2 px-4 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 flex-shrink-0 transition-colors"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Keluar Sesi</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
