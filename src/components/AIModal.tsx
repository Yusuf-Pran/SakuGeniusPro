import React, { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import {
  Mic,
  Square,
  Camera,
  Upload,
  Sparkles,
  X,
  Check,
  AlertCircle,
  FileText,
  Clock,
  Tag,
  Calendar,
  Layers,
  Wand2,
  Volume2,
} from "lucide-react";
import { Category, Transaction } from "../types";
import { formatRupiah, parseRupiahInput } from "../utils/storage";
import { soundEffects } from "../utils/audio";

interface AIModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onSaveTransaction: (transaction: Omit<Transaction, "id">) => void;
}

export const AIModal: React.FC<AIModalProps> = ({
  isOpen,
  onClose,
  categories,
  onSaveTransaction,
}) => {
  const [activeTab, setActiveTab] = useState<"voice" | "receipt" | "text">("voice");

  // Voice recording states
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<any>(null);

  // Receipt image states
  const [receiptImage, setReceiptImage] = useState<string | null>(null);
  const [receiptMime, setReceiptMime] = useState<string>("image/jpeg");
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Smart text state
  const [smartText, setSmartText] = useState("");

  // Processing & result states
  const [isLoading, setIsLoading] = useState(false);
  const [loadingStatus, setLoadingStatus] = useState("");
  const [errorMsg, setErrorMsg] = useState("");
  const [parsedResult, setParsedResult] = useState<{
    nama: string;
    nominal: number;
    jenis: "Pengeluaran" | "Pemasukan";
    kategori: string;
    tanggal: string;
    catatan?: string;
    items?: Array<{ nama: string; harga?: number; qty?: number }>;
    source: "ai_voice" | "ai_receipt" | "ai_text";
  } | null>(null);

  // Cleanup on close
  useEffect(() => {
    if (!isOpen) {
      stopRecording();
      setParsedResult(null);
      setReceiptImage(null);
      setAudioBlob(null);
      setErrorMsg("");
      setIsLoading(false);
      setSmartText("");
    }
  }, [isOpen]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
      setRecordingTime(0);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isRecording]);

  // Start Audio Recording
  const startRecording = async () => {
    try {
      setErrorMsg("");
      audioChunksRef.current = [];
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          audioChunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const mime = mediaRecorder.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mime });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err: any) {
      console.error("Mic access error:", err);
      setErrorMsg("Izin mikrofon ditolak atau tidak didukung di browser ini.");
    }
  };

  // Stop Audio Recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Process Voice Recording with Gemini
  const processVoiceRecording = async () => {
    if (!audioBlob) {
      setErrorMsg("Silakan rekam suara Anda terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setLoadingStatus("AI Gemini sedang mendengarkan & menganalisis suara Anda...");
    setErrorMsg("");

    try {
      // Convert audio blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64Audio = reader.result as string;
        const availableCategoryNames = categories.map((c) => c.nama);

        const res = await fetch("/api/ai/voice-expense", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            audioBase64: base64Audio,
            mimeType: audioBlob.type || "audio/webm",
            availableCategories: availableCategoryNames,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Gagal memproses suara.");
        }

        setParsedResult({
          nama: data.data.nama || "Pengeluaran Suara",
          nominal: Number(data.data.nominal) || 0,
          jenis: data.data.jenis === "Pemasukan" ? "Pemasukan" : "Pengeluaran",
          kategori: data.data.kategori || categories[0]?.nama || "Lain-lain",
          tanggal: data.data.tanggal || new Date().toISOString().split("T")[0],
          catatan: data.data.catatan || "",
          source: "ai_voice",
        });
        soundEffects.playSuccessChime();
        setIsLoading(false);
      };
    } catch (err: any) {
      console.error("Voice processing error:", err);
      setErrorMsg(err.message || "Gagal memproses suara.");
      setIsLoading(false);
    }
  };

  // Handle Receipt Image Selection
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setReceiptMime(file.type || "image/jpeg");
    const reader = new FileReader();
    reader.onload = () => {
      setReceiptImage(reader.result as string);
      setParsedResult(null);
      setErrorMsg("");
    };
    reader.readAsDataURL(file);
  };

  // Process Receipt Image with Gemini
  const processReceiptImage = async () => {
    if (!receiptImage) {
      setErrorMsg("Silakan pilih atau foto struk terlebih dahulu.");
      return;
    }

    setIsLoading(true);
    setLoadingStatus("AI Gemini sedang memindai struk & membaca nominal...");
    setErrorMsg("");

    try {
      const res = await fetch("/api/ai/scan-receipt", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          imageBase64: receiptImage,
          mimeType: receiptMime,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memindai struk.");
      }

      setParsedResult({
        nama: data.data.nama || "Struk Pembelian",
        nominal: Number(data.data.total) || 0,
        jenis: data.data.jenis === "Pemasukan" ? "Pemasukan" : "Pengeluaran",
        kategori: data.data.kategori || categories[0]?.nama || "Belanja & Kebutuhan",
        tanggal: data.data.tanggal || new Date().toISOString().split("T")[0],
        catatan: data.data.ringkasan || "Hasil scan struk otomatis",
        items: data.data.items || [],
        source: "ai_receipt",
      });
      soundEffects.playSuccessChime();
    } catch (err: any) {
      console.error("Scan receipt error:", err);
      setErrorMsg(err.message || "Gagal memindai struk.");
    } finally {
      setIsLoading(false);
    }
  };

  // Process Smart Natural Language Text
  const processSmartText = async () => {
    if (!smartText.trim()) {
      setErrorMsg("Silakan ketik kalimat pengeluaran Anda.");
      return;
    }

    setIsLoading(true);
    setLoadingStatus("AI Gemini sedang mengekstrak data dari teks...");
    setErrorMsg("");

    try {
      const availableCategoryNames = categories.map((c) => c.nama);
      const res = await fetch("/api/ai/smart-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          textPrompt: smartText,
          availableCategories: availableCategoryNames,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error || "Gagal memproses teks.");
      }

      setParsedResult({
        nama: data.data.nama || smartText,
        nominal: Number(data.data.nominal) || 0,
        jenis: data.data.jenis === "Pemasukan" ? "Pemasukan" : "Pengeluaran",
        kategori: data.data.kategori || categories[0]?.nama || "Lain-lain",
        tanggal: data.data.tanggal || new Date().toISOString().split("T")[0],
        catatan: data.data.penjelasan || smartText,
        source: "ai_text",
      });
      soundEffects.playSuccessChime();
    } catch (err: any) {
      console.error("Smart text parsing error:", err);
      setErrorMsg(err.message || "Gagal memproses teks.");
    } finally {
      setIsLoading(false);
    }
  };

  // Save Confirmed Transaction
  const handleConfirmSave = () => {
    if (!parsedResult) return;
    onSaveTransaction({
      nama: parsedResult.nama,
      nominal: parsedResult.nominal,
      jenis: parsedResult.jenis,
      kategori: parsedResult.kategori,
      tanggal: parsedResult.tanggal,
      catatan: parsedResult.catatan,
      items: parsedResult.items,
      source: parsedResult.source,
    });
    soundEffects.playSuccessChime();
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[250] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md overflow-y-auto">
      <motion.div
        initial={{ opacity: 0, scale: 0.94, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.94, y: 20 }}
        className="w-full max-w-xl bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden my-6 max-h-[90vh] flex flex-col"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-indigo-600 via-violet-600 to-purple-700 p-5 text-white flex items-center justify-between relative overflow-hidden flex-shrink-0">
          <div className="flex items-center gap-3 relative z-10">
            <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center text-white shadow-inner">
              <Sparkles className="w-5 h-5 text-amber-300" />
            </div>
            <div>
              <h2 className="text-lg font-black leading-tight flex items-center gap-2">
                <span>Catat Keuangan AI Gemini</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/20 font-bold uppercase tracking-wider">
                  Smart AI
                </span>
              </h2>
              <p className="text-xs text-indigo-100 font-medium">
                Catat pengeluaran otomatis via Suara, Foto Struk, atau Teks Cerdas
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-black/20 hover:bg-black/40 text-white flex items-center justify-center transition-colors relative z-10"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        {!parsedResult && (
          <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-900/50 p-2 gap-1.5 flex-shrink-0">
            <button
              onClick={() => {
                setActiveTab("voice");
                setErrorMsg("");
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "voice"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Mic className="w-4 h-4" />
              <span>Input Suara</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("receipt");
                setErrorMsg("");
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "receipt"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Camera className="w-4 h-4" />
              <span>Scan Foto Struk</span>
            </button>
            <button
              onClick={() => {
                setActiveTab("text");
                setErrorMsg("");
              }}
              className={`flex-1 py-2.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
                activeTab === "text"
                  ? "bg-white dark:bg-slate-800 text-indigo-600 dark:text-indigo-400 shadow-sm border border-slate-200 dark:border-slate-700"
                  : "text-slate-500 hover:text-slate-800 dark:hover:text-slate-200"
              }`}
            >
              <Wand2 className="w-4 h-4" />
              <span>Teks Cerdas</span>
            </button>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1">
          {errorMsg && (
            <div className="mb-4 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 flex items-start gap-2.5 text-xs text-red-700 dark:text-red-300">
              <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
              <div className="flex-1">{errorMsg}</div>
            </div>
          )}

          {/* Loading Animation */}
          {isLoading && (
            <div className="py-12 text-center flex flex-col items-center justify-center">
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 animate-spin flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white dark:bg-slate-900 flex items-center justify-center">
                    <Sparkles className="w-8 h-8 text-indigo-600 dark:text-indigo-400 animate-pulse" />
                  </div>
                </div>
              </div>
              <h3 className="text-base font-extrabold text-slate-900 dark:text-white mb-2">
                Memproses dengan Gemini AI...
              </h3>
              <p className="text-xs text-slate-500 max-w-sm">{loadingStatus}</p>
            </div>
          )}

          {/* PARSED RESULT PREVIEW / CONFIRMATION FORM */}
          {!isLoading && parsedResult && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-4"
            >
              <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/50 rounded-2xl flex items-center gap-2.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                <Check className="w-4 h-4 text-emerald-600" />
                <span>AI Gemini berhasil mengekstrak data! Silakan periksa sebelum disimpan.</span>
              </div>

              <div className="bg-slate-50 dark:bg-slate-800/60 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 space-y-4">
                {/* Nominal */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Nominal Transaksi
                  </label>
                  <div className="text-2xl font-black text-slate-900 dark:text-white">
                    <input
                      type="text"
                      value={formatRupiah(parsedResult.nominal)}
                      onChange={(e) => {
                        const val = parseRupiahInput(e.target.value);
                        setParsedResult({ ...parsedResult, nominal: val });
                      }}
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2 text-xl font-black text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Nama / Keterangan */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Keterangan / Merchant
                  </label>
                  <input
                    type="text"
                    value={parsedResult.nama}
                    onChange={(e) => setParsedResult({ ...parsedResult, nama: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Jenis & Kategori */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Jenis
                    </label>
                    <select
                      value={parsedResult.jenis}
                      onChange={(e) =>
                        setParsedResult({
                          ...parsedResult,
                          jenis: e.target.value as "Pengeluaran" | "Pemasukan",
                        })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      <option value="Pengeluaran">Pengeluaran</option>
                      <option value="Pemasukan">Pemasukan</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                      Kategori
                    </label>
                    <select
                      value={parsedResult.kategori}
                      onChange={(e) =>
                        setParsedResult({ ...parsedResult, kategori: e.target.value })
                      }
                      className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                    >
                      {categories
                        .filter((c) => c.jenis === parsedResult.jenis)
                        .map((c) => (
                          <option key={c.id} value={c.nama}>
                            {c.nama}
                          </option>
                        ))}
                    </select>
                  </div>
                </div>

                {/* Tanggal */}
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                    Tanggal
                  </label>
                  <input
                    type="date"
                    value={parsedResult.tanggal}
                    onChange={(e) => setParsedResult({ ...parsedResult, tanggal: e.target.value })}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>

                {/* Struk Breakdown (If items found) */}
                {parsedResult.items && parsedResult.items.length > 0 && (
                  <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                      Rincian Item Struk ({parsedResult.items.length} item)
                    </label>
                    <div className="max-h-36 overflow-y-auto space-y-1.5 pr-1">
                      {parsedResult.items.map((it, idx) => (
                        <div
                          key={idx}
                          className="flex justify-between items-center text-xs p-2 rounded-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800"
                        >
                          <span className="text-slate-800 dark:text-slate-200 truncate pr-2">
                            {it.nama} {it.qty && it.qty > 1 ? `(x${it.qty})` : ""}
                          </span>
                          <span className="font-bold text-slate-900 dark:text-white flex-shrink-0">
                            {it.harga ? formatRupiah(it.harga) : "-"}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Action buttons */}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setParsedResult(null)}
                  className="flex-1 py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition-colors"
                >
                  Scan Ulang
                </button>
                <button
                  type="button"
                  onClick={handleConfirmSave}
                  className="flex-2 py-3 px-6 rounded-xl font-bold text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-600/30 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                >
                  <Check className="w-4 h-4" />
                  <span>Simpan Transaksi Ini</span>
                </button>
              </div>
            </motion.div>
          )}

          {/* TAB 1: VOICE RECORDING INTERFACE */}
          {!isLoading && !parsedResult && activeTab === "voice" && (
            <div className="py-6 flex flex-col items-center text-center space-y-6">
              {/* Mic Visualizer Button */}
              <div className="relative flex items-center justify-center">
                {isRecording && (
                  <>
                    <motion.div
                      animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0.1, 0.6] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                      className="absolute w-36 h-36 rounded-full bg-red-500"
                    />
                    <motion.div
                      animate={{ scale: [1, 1.25, 1], opacity: [0.8, 0.2, 0.8] }}
                      transition={{ repeat: Infinity, duration: 1.2, delay: 0.2 }}
                      className="absolute w-28 h-28 rounded-full bg-red-400"
                    />
                  </>
                )}
                <button
                  type="button"
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`relative z-10 w-24 h-24 rounded-full flex items-center justify-center text-white shadow-xl transition-all ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 ring-4 ring-red-400 scale-105"
                      : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"
                  }`}
                >
                  {isRecording ? <Square className="w-9 h-9" /> : <Mic className="w-10 h-10" />}
                </button>
              </div>

              {/* Status Info */}
              <div>
                <h4 className="text-base font-extrabold text-slate-900 dark:text-white">
                  {isRecording ? "Sedang Merekam Suara..." : "Tekan Mikrofon & Bicara"}
                </h4>
                <p className="text-xs text-slate-500 mt-1 max-w-sm">
                  {isRecording
                    ? `Durasi: ${recordingTime} detik • Ucapkan nominal & keterangan pengeluaran Anda.`
                    : "Contoh: \"Tadi beli bensin motor lima puluh ribu\" atau \"Makan siang soto ayam dua puluh lima ribu\""}
                </p>
              </div>

              {/* Recorded Audio ready */}
              {audioBlob && !isRecording && (
                <div className="w-full bg-slate-50 dark:bg-slate-800 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-slate-700 dark:text-slate-300">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span>Rekaman suara siap dianalisis ({Math.round(audioBlob.size / 1024)} KB)</span>
                  </div>
                  <button
                    type="button"
                    onClick={processVoiceRecording}
                    className="w-full sm:w-auto py-2.5 px-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md flex items-center justify-center gap-1.5 transition-all"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-amber-300" />
                    <span>Analisis dengan Gemini</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: RECEIPT SCANNER INTERFACE */}
          {!isLoading && !parsedResult && activeTab === "receipt" && (
            <div className="py-3 space-y-4">
              <input
                type="file"
                ref={fileInputRef}
                accept="image/*"
                capture="environment"
                onChange={handleImageUpload}
                className="hidden"
              />

              {!receiptImage ? (
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="border-2 border-dashed border-slate-300 dark:border-slate-700 hover:border-indigo-500 dark:hover:border-indigo-400 rounded-3xl p-8 text-center cursor-pointer bg-slate-50/50 dark:bg-slate-900/50 hover:bg-indigo-50/30 transition-all flex flex-col items-center justify-center"
                >
                  <div className="w-16 h-16 rounded-2xl bg-indigo-100 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
                    <Camera className="w-8 h-8" />
                  </div>
                  <h4 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Ambil Foto Struk atau Upload Gambar
                  </h4>
                  <p className="text-xs text-slate-400 mt-1 max-w-xs">
                    Mendukung format JPG, PNG, WEBP struk kasir, invoice, atau nota belanja
                  </p>
                  <button
                    type="button"
                    className="mt-4 py-2 px-4 rounded-xl bg-indigo-600 text-white text-xs font-bold flex items-center gap-1.5"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Pilih Foto Struk</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-4">
                  {/* Image Preview with Scanner Effect */}
                  <div className="relative rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-700 bg-black max-h-64 flex items-center justify-center group">
                    <img
                      src={receiptImage}
                      alt="Receipt Preview"
                      className="max-h-64 w-auto object-contain opacity-90"
                    />
                    {/* Scanner line animation */}
                    <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-transparent via-cyan-400 to-transparent animate-pulse shadow-lg shadow-cyan-500/50" />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute bottom-3 right-3 bg-black/60 hover:bg-black/80 text-white text-xs px-3 py-1.5 rounded-lg backdrop-blur-md font-semibold"
                    >
                      Ganti Foto
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={processReceiptImage}
                    className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
                  >
                    <Sparkles className="w-4 h-4 text-amber-300" />
                    <span>Scan & Ekstrak Total Struk dengan AI</span>
                  </button>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: SMART NATURAL TEXT PARSER */}
          {!isLoading && !parsedResult && activeTab === "text" && (
            <div className="py-3 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                  Tuliskan Pengeluaran Bebas
                </label>
                <textarea
                  rows={3}
                  value={smartText}
                  onChange={(e) => setSmartText(e.target.value)}
                  placeholder="Contoh: Makan siang nasi padang 32 ribu di ampera, atau Bayar listrik 250rb kemarin"
                  className="w-full p-3.5 bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm text-slate-900 dark:text-white placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>

              {/* Quick Prompt Chips */}
              <div>
                <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
                  Contoh Cepat:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    "Beli kopi susu 22rb barusan",
                    "Isi token listrik 100 ribu",
                    "Beli bensin pertalite 45rb",
                    "Gaji bulanan masuk 7.5jt",
                    "Belanja mingguan pasar 180rb",
                  ].map((example, i) => (
                    <button
                      key={i}
                      type="button"
                      onClick={() => setSmartText(example)}
                      className="text-[11px] py-1 px-2.5 rounded-lg bg-slate-100 dark:bg-slate-800 hover:bg-indigo-50 dark:hover:bg-indigo-950/50 text-slate-600 dark:text-slate-400 hover:text-indigo-600 transition-colors"
                    >
                      {example}
                    </button>
                  ))}
                </div>
              </div>

              <button
                type="button"
                onClick={processSmartText}
                className="w-full py-3.5 px-6 bg-gradient-to-r from-indigo-600 to-violet-700 hover:from-indigo-700 hover:to-violet-800 text-white font-bold text-xs rounded-xl shadow-lg shadow-indigo-600/25 flex items-center justify-center gap-2 transition-all hover:scale-[1.01]"
              >
                <Wand2 className="w-4 h-4 text-amber-300" />
                <span>Analisis & Catat Otomatis</span>
              </button>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
};
