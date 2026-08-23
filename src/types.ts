export type TransactionType = "Pengeluaran" | "Pemasukan";

export interface TransactionItem {
  nama: string;
  harga?: number;
  qty?: number;
}

export interface Transaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  nama: string;
  jenis: TransactionType;
  kategori: string;
  nominal: number;
  catatan?: string;
  items?: TransactionItem[];
  source?: "manual" | "ai_voice" | "ai_receipt" | "ai_text";
  createdAt?: number;
}

export interface Category {
  id: string;
  jenis: TransactionType;
  nama: string;
  budget: number; // 0 if no budget
  icon?: string;
  color?: string;
}

export interface RegisteredUser {
  id: string;
  nama: string;
  noHp: string; // formatted phone number e.g. 081234567890
  email?: string;
  role: "admin" | "member";
  status: "aktif" | "nonaktif";
  tglDaftar: string;
  catatan?: string;
}

export interface BudgetNotification {
  id: string;
  kategori: string;
  timestamp: number;
  pemakaian: number;
  budget: number;
  kelebihan: number;
  isRead: boolean;
  message: string;
  persentase: number;
  level: "warning" | "danger"; // warning (>=80%), danger (>100%)
}

export interface AppSettings {
  appName: string;
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  licenseCode?: string;
  soundEnabled: boolean;
  autoAiCategory: boolean;
  currency?: string;
}

export interface AIScanResult {
  nama: string;
  tanggal: string;
  total: number;
  kategori: string;
  jenis: TransactionType;
  ringkasan?: string;
  items?: TransactionItem[];
}

export interface AIVoiceResult {
  nama: string;
  nominal: number;
  jenis: TransactionType;
  kategori: string;
  tanggal: string;
  catatan?: string;
}

export interface AppState {
  transactions: Transaction[];
  categories: Category[];
  settings: AppSettings;
  notifications: BudgetNotification[];
}
