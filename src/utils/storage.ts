import { AppState, Category, Transaction } from "../types";

export const STORAGE_KEY = "SAKUGENIUS_V2_DATA";
export const AUTH_KEY = "SAKUGENIUS_AUTH_SESSION";

export const initialCategories: Category[] = [
  { id: "c1", jenis: "Pengeluaran", nama: "Makanan & Minuman", budget: 1500000, color: "#f59e0b" },
  { id: "c2", jenis: "Pengeluaran", nama: "Belanja & Kebutuhan", budget: 1000000, color: "#ec4899" },
  { id: "c3", jenis: "Pengeluaran", nama: "Transportasi & Bensin", budget: 500000, color: "#06b6d4" },
  { id: "c4", jenis: "Pengeluaran", nama: "Tagihan & Utilitas", budget: 1000000, color: "#8b5cf6" },
  { id: "c5", jenis: "Pengeluaran", nama: "Kesehatan & Obat", budget: 400000, color: "#ef4444" },
  { id: "c6", jenis: "Pengeluaran", nama: "Hiburan & Rekreasi", budget: 500000, color: "#3b82f6" },
  { id: "c7", jenis: "Pengeluaran", nama: "Lain-lain", budget: 300000, color: "#64748b" },
  { id: "c8", jenis: "Pemasukan", nama: "Gaji Utama", budget: 0, color: "#10b981" },
  { id: "c9", jenis: "Pemasukan", nama: "Bonus & THR", budget: 0, color: "#22c55e" },
  { id: "c10", jenis: "Pemasukan", nama: "Usaha / Freelance", budget: 0, color: "#14b8a6" },
  { id: "c11", jenis: "Pemasukan", nama: "Investasi / Pasif", budget: 0, color: "#84cc16" },
];

export const initialSampleTransactions: Transaction[] = [
  {
    id: "tx-1",
    tanggal: new Date().toISOString().split("T")[0],
    nama: "Gaji Bulanan",
    jenis: "Pemasukan",
    kategori: "Gaji Utama",
    nominal: 7500000,
    catatan: "Penerimaan gaji via transfer bank",
    source: "manual",
  },
  {
    id: "tx-2",
    tanggal: new Date().toISOString().split("T")[0],
    nama: "Belanja Mingguan Supermarket",
    jenis: "Pengeluaran",
    kategori: "Belanja & Kebutuhan",
    nominal: 650000,
    catatan: "Beras, minyak, sabun, sayuran",
    source: "ai_receipt",
  },
  {
    id: "tx-3",
    tanggal: new Date().toISOString().split("T")[0],
    nama: "Makan Siang & Kopi",
    jenis: "Pengeluaran",
    kategori: "Makanan & Minuman",
    nominal: 120000,
    catatan: "Pesan makanan via suara",
    source: "ai_voice",
  },
  {
    id: "tx-4",
    tanggal: new Date().toISOString().split("T")[0],
    nama: "Isi Bensin Mobil",
    jenis: "Pengeluaran",
    kategori: "Transportasi & Bensin",
    nominal: 250000,
    catatan: "Pertamax di SPBU",
    source: "manual",
  },
];

export function getInitialState(): AppState {
  const defaultSettings = {
    appName: "SakuGenius",
    userName: "",
    userEmail: "",
    userPhone: "",
    soundEnabled: true,
    autoAiCategory: true,
    currency: "IDR",
  };

  if (typeof window === "undefined") {
    return {
      transactions: initialSampleTransactions,
      categories: initialCategories,
      settings: defaultSettings,
      notifications: [],
    };
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      return {
        transactions: parsed.transactions || initialSampleTransactions,
        categories: parsed.categories || initialCategories,
        settings: {
          appName: parsed.settings?.appName || defaultSettings.appName,
          userName: parsed.settings?.userName || defaultSettings.userName,
          userEmail: parsed.settings?.userEmail || defaultSettings.userEmail,
          userPhone: parsed.settings?.userPhone || defaultSettings.userPhone,
          soundEnabled: parsed.settings?.soundEnabled ?? true,
          autoAiCategory: parsed.settings?.autoAiCategory ?? true,
          currency: parsed.settings?.currency || "IDR",
        },
        notifications: parsed.notifications || [],
      };
    }
  } catch (e) {
    console.error("Failed to load local state:", e);
  }

  return {
    transactions: initialSampleTransactions,
    categories: initialCategories,
    settings: defaultSettings,
    notifications: [],
  };
}

export function saveStateToStorage(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch (e) {
    console.error("Failed to save state to localStorage:", e);
  }
}

export function formatRupiah(amount: number): string {
  if (isNaN(amount)) return "Rp 0";
  return "Rp " + Math.round(amount).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

export function parseRupiahInput(value: string): number {
  const digits = value.replace(/\D/g, "");
  return digits ? parseInt(digits, 10) : 0;
}

export function cleanPhoneNumber(phone: string): string {
  let cleaned = phone.replace(/\D/g, "");
  if (cleaned.startsWith("62")) {
    cleaned = "0" + cleaned.substring(2);
  }
  return cleaned;
}

export function getCurrentMonthStr(): string {
  const d = new Date();
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  return `${yyyy}-${mm}`;
}

export function getMonthDisplay(monthStr: string): string {
  if (!monthStr) return "";
  const [year, month] = monthStr.split("-");
  const date = new Date(parseInt(year), parseInt(month) - 1, 1);
  return date.toLocaleDateString("id-ID", { month: "long", year: "numeric" });
}
