import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Wallet,
  ArrowRight,
  User,
  Phone,
  Mail,
  KeyRound,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Loader2,
  Sparkles,
  Lock,
  FileSpreadsheet,
} from "lucide-react";
import { SakuGeniusLogo } from "./SakuGeniusLogo";

interface LoginModalProps {
  onSuccess: (user: { name: string; phone: string; email?: string; licenseCode?: string }) => void;
  appName?: string;
  defaultName?: string;
  defaultPhone?: string;
  defaultEmail?: string;
  defaultLicense?: string;
}

export const LoginModal: React.FC<LoginModalProps> = ({
  onSuccess,
  appName = "SakuGenius",
  defaultName = "",
  defaultPhone = "",
  defaultEmail = "",
  defaultLicense = "SAKUGENIUSPRO",
}) => {
  const [name, setName] = useState(defaultName || "");
  const [phone, setPhone] = useState(defaultPhone || "");
  const [email, setEmail] = useState(defaultEmail || "");
  const [accessCode, setAccessCode] = useState(defaultLicense || "SAKUGENIUSPRO");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);
  const [imgError, setImgError] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    setSuccessMsg(null);

    const trimmedName = name.trim();
    const trimmedEmail = email.trim().toLowerCase();
    const trimmedPhone = phone.trim();
    const trimmedCode = accessCode.trim().toUpperCase();

    if (!trimmedName) {
      setErrorMsg("Mohon isi Nama Lengkap Anda.");
      return;
    }
    if (!trimmedEmail) {
      setErrorMsg("Mohon isi Email aktif Anda.");
      return;
    }
    if (!trimmedPhone) {
      setErrorMsg("Mohon isi Nomor WhatsApp / HP Anda.");
      return;
    }
    if (!trimmedCode) {
      setErrorMsg("Mohon masukkan Kode Akses: SAKUGENIUSPRO");
      return;
    }

    if (trimmedCode !== "SAKUGENIUSPRO" && trimmedCode !== "SAKUGENIUS" && trimmedCode !== "DEMO-SAKU") {
      setErrorMsg("Kode Akses tidak sesuai. Silakan gunakan kode akses resmi: SAKUGENIUSPRO");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/auth/validate-license", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kode: trimmedCode,
          nama: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
        }),
      });

      const result = await response.json();

      if (result && result.valid) {
        setSuccessMsg(result.message || "Akses Berhasil Divalidasi!");
        setTimeout(() => {
          onSuccess({
            name: trimmedName,
            phone: trimmedPhone,
            email: trimmedEmail,
            licenseCode: trimmedCode,
          });
        }, 500);
      } else {
        setErrorMsg(result?.message || "Gagal memvalidasi kode akses.");
      }
    } catch (err: any) {
      console.error("Login verification error:", err);
      // Even if network glitches, if code is SAKUGENIUSPRO, allow entry
      setSuccessMsg("Selamat datang! Akses PRO aktif.");
      setTimeout(() => {
        onSuccess({
          name: trimmedName,
          phone: trimmedPhone,
          email: trimmedEmail,
          licenseCode: trimmedCode,
        });
      }, 500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6"
      >
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-indigo-600 via-indigo-700 to-violet-800 p-7 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-44 h-44 bg-white/10 rounded-full blur-2xl -mr-12 -mt-12" />
          <div className="relative z-10 flex flex-col items-center">
            {!imgError ? (
              <img
                src="/Logo.png"
                alt="SakuGenius Logo"
                onError={() => setImgError(true)}
                className="w-16 h-16 object-contain rounded-2xl mb-3 shadow-xl border-2 border-white/40 bg-white/10 backdrop-blur-md"
                referrerPolicy="no-referrer"
              />
            ) : (
              <SakuGeniusLogo className="w-16 h-16 rounded-2xl mb-3 shadow-xl border-2 border-white/40" />
            )}
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">{appName}</h2>
              <span className="px-2 py-0.5 rounded-full bg-amber-400 text-amber-950 text-[10px] font-extrabold tracking-wider uppercase shadow">
                PRO
              </span>
            </div>
            <p className="text-xs text-indigo-100 mt-1 max-w-xs leading-relaxed">
              Registrasi Akses Pengguna & Manajemen Keuangan Cerdas AI
            </p>
          </div>
        </div>

        {/* Content & Form */}
        <div className="p-6 sm:p-7 space-y-5">
          <div className="text-center space-y-1">
            <h3 className="text-base font-extrabold text-slate-900 dark:text-white">
              Data Pengguna & Kode Akses
            </h3>
            <p className="text-xs text-slate-400">
              Lengkapi data profil Anda untuk sinkronisasi otomatis ke Google Sheet
            </p>
          </div>

          {/* Feedback Messages */}
          <AnimatePresence mode="wait">
            {errorMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-rose-50 dark:bg-rose-950/50 border border-rose-200 dark:border-rose-800 rounded-2xl flex items-start gap-2.5 text-xs text-rose-800 dark:text-rose-200 font-semibold leading-relaxed"
              >
                <AlertCircle className="w-4 h-4 text-rose-600 flex-shrink-0 mt-0.5" />
                <div className="flex-1">{errorMsg}</div>
              </motion.div>
            )}

            {successMsg && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                className="p-3.5 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-800 dark:text-emerald-200 font-bold"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0" />
                <span>{successMsg}</span>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={handleLogin} className="space-y-4">
            {/* Input: Kode Akses */}
            <div className="p-3.5 bg-indigo-50/70 dark:bg-indigo-950/30 border border-indigo-200/80 dark:border-indigo-800/80 rounded-2xl space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="text-[11px] font-bold text-indigo-950 dark:text-indigo-200 flex items-center gap-1.5">
                  <KeyRound className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />
                  <span>Kode Akses Aplikasi</span>
                </label>
                <button
                  type="button"
                  onClick={() => setAccessCode("SAKUGENIUSPRO")}
                  className="text-[10px] font-bold text-indigo-600 dark:text-indigo-400 hover:underline cursor-pointer flex items-center gap-1"
                >
                  <Sparkles className="w-3 h-3 text-amber-500" />
                  <span>Set: SAKUGENIUSPRO</span>
                </button>
              </div>
              <div className="relative">
                <Lock className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-indigo-500" />
                <input
                  type="text"
                  required
                  placeholder="Masukkan SAKUGENIUSPRO"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
                  className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-800 border border-indigo-200 dark:border-slate-700 rounded-xl text-xs font-mono font-black text-indigo-900 dark:text-indigo-300 tracking-wider placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none uppercase"
                />
              </div>
              <p className="text-[10.5px] text-indigo-700/80 dark:text-indigo-300/80 font-medium">
                Gunakan kode akses: <strong className="font-mono font-bold text-indigo-900 dark:text-white">SAKUGENIUSPRO</strong>
              </p>
            </div>

            {/* Input: Nama Lengkap */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nama Lengkap Pengguna <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <User className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  required
                  placeholder="Contoh: Budi Santoso"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Input: Email */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Email Pengguna <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="email"
                  required
                  placeholder="Contoh: budi@gmail.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Input: WhatsApp / Phone */}
            <div>
              <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 mb-1">
                Nomor WhatsApp / HP <span className="text-rose-500">*</span>
              </label>
              <div className="relative">
                <Phone className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="tel"
                  required
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3.5 px-4 bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white rounded-xl text-xs font-extrabold shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-98 cursor-pointer disabled:opacity-75 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Menyimpan ke Google Sheet & Masuk...</span>
                </>
              ) : (
                <>
                  <span>Aktifkan Akses & Masuk</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Sync Status Badge */}
          <div className="p-3 bg-slate-50 dark:bg-slate-800/60 rounded-2xl border border-slate-100 dark:border-slate-800 text-center space-y-1">
            <p className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1.5 font-semibold">
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
              <span>Otomatis Tercatat ke Google Sheet Database Pemilik (Anti-Duplikat)</span>
            </p>
            <p className="text-[10px] text-slate-400">
              Jika user sudah pernah terdaftar (Email / Nomor HP sama), sistem akan memperbarui waktu login tanpa membuat baris duplikat.
            </p>
          </div>


        </div>
      </motion.div>
    </div>
  );
};
