import React, { useState, useEffect, useCallback } from "react";
import { Header } from "./components/Header";
import { Sidebar } from "./components/Sidebar";
import { BottomNav } from "./components/BottomNav";
import { DashboardView } from "./components/DashboardView";
import { InputView } from "./components/InputView";
import { HistoryView } from "./components/HistoryView";
import { SettingsView } from "./components/SettingsView";
import { LoginModal } from "./components/LoginModal";
import { AIModal } from "./components/AIModal";
import { ChatNotificationToast } from "./components/ChatNotificationToast";
import { NotificationCenterModal } from "./components/NotificationCenterModal";
import {
  AppState,
  BudgetNotification,
  Category,
  Transaction,
} from "./types";
import {
  AUTH_KEY,
  getInitialState,
  saveStateToStorage,
  getCurrentMonthStr,
  formatRupiah,
} from "./utils/storage";
import { soundEffects } from "./utils/audio";

export default function App() {
  // App state
  const [state, setState] = useState<AppState>(getInitialState);
  const [currentView, setCurrentView] = useState<"dashboard" | "input" | "history" | "settings">("dashboard");
  const [selectedMonth, setSelectedMonth] = useState<string>(getCurrentMonthStr);

  // Theme state with instant DOM sync
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    const stored = localStorage.getItem("theme");
    if (stored) return stored === "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches;
  });

  // Auth session state
  const [currentUser, setCurrentUser] = useState<{
    name: string;
    phone: string;
    email?: string;
    licenseCode?: string;
  } | null>(() => {
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(AUTH_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  });

  // AI Modal state
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);

  // Notification center modal state
  const [isNotifCenterOpen, setIsNotifCenterOpen] = useState(false);

  // Active floating chat alert notification
  const [activeChatAlert, setActiveChatAlert] = useState<BudgetNotification | null>(null);

  // Editing transaction state for input view
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  // Sync state to local storage
  useEffect(() => {
    saveStateToStorage(state);
  }, [state]);

  // Sync dark mode class to <html> and <body>
  useEffect(() => {
    const root = document.documentElement;
    if (isDark) {
      root.classList.add("dark");
      document.body.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      root.classList.remove("dark");
      document.body.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark((prev) => !prev);

  // Login handler
  const handleLoginSuccess = (user: { name: string; phone: string; email?: string; licenseCode?: string }) => {
    setCurrentUser(user);
    localStorage.setItem(AUTH_KEY, JSON.stringify(user));
    setState((prev) => ({
      ...prev,
      settings: {
        ...prev.settings,
        userName: user.name,
        userPhone: user.phone,
        userEmail: user.email,
        licenseCode: user.licenseCode || prev.settings.licenseCode,
      },
    }));
    soundEffects.playSuccessChime();
  };

  // User profile update handler
  const handleUpdateUserProfile = (profile: { name: string; phone: string; email?: string }) => {
    setCurrentUser(profile);
    localStorage.setItem(AUTH_KEY, JSON.stringify(profile));
  };

  // Logout handler
  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem(AUTH_KEY);
  };

  /**
   * Check budget status and trigger chat-style notification if budget exceeded
   */
  const checkBudgetAndNotify = useCallback(
    (kategori: string, tanggal: string, updatedTransactions: Transaction[], currentCategories: Category[]) => {
      const monthStr = tanggal.substring(0, 7);
      const catObj = currentCategories.find((c) => c.nama === kategori && c.jenis === "Pengeluaran");

      if (!catObj || catObj.budget <= 0) return;

      const totalExpenseInMonth = updatedTransactions
        .filter((t) => t.kategori === kategori && t.jenis === "Pengeluaran" && t.tanggal.startsWith(monthStr))
        .reduce((sum, t) => sum + t.nominal, 0);

      const kelebihan = totalExpenseInMonth - catObj.budget;
      const persentase = (totalExpenseInMonth / catObj.budget) * 100;

      if (totalExpenseInMonth > catObj.budget) {
        // OVERBUDGET (Level: Danger)
        const newNotif: BudgetNotification = {
          id: `notif-${Date.now()}`,
          kategori: catObj.nama,
          timestamp: Date.now(),
          pemakaian: totalExpenseInMonth,
          budget: catObj.budget,
          kelebihan: kelebihan,
          isRead: false,
          level: "danger",
          persentase: persentase,
          message: `Total pengeluaran kategori ${catObj.nama} mencapai ${formatRupiah(totalExpenseInMonth)}, melebihi batas budget sebesar +${formatRupiah(kelebihan)} (${Math.round(persentase)}%)!`,
        };

        if (state.settings.soundEnabled) {
          soundEffects.playChatNotification();
        }

        setActiveChatAlert(newNotif);

        setState((prev) => ({
          ...prev,
          notifications: [newNotif, ...prev.notifications],
        }));
      } else if (persentase >= 85) {
        // APPROACHING LIMIT WARNING (Level: Warning)
        const newNotif: BudgetNotification = {
          id: `notif-${Date.now()}`,
          kategori: catObj.nama,
          timestamp: Date.now(),
          pemakaian: totalExpenseInMonth,
          budget: catObj.budget,
          kelebihan: 0,
          isRead: false,
          level: "warning",
          persentase: persentase,
          message: `Pengeluaran ${catObj.nama} telah mencapai ${Math.round(persentase)}% dari budget (${formatRupiah(totalExpenseInMonth)} / ${formatRupiah(catObj.budget)}).`,
        };

        if (state.settings.soundEnabled) {
          soundEffects.playChatNotification();
        }

        setActiveChatAlert(newNotif);

        setState((prev) => ({
          ...prev,
          notifications: [newNotif, ...prev.notifications],
        }));
      }
    },
    [state.settings.soundEnabled]
  );

  // Save or Update Transaction
  const handleSaveTransaction = (txData: Omit<Transaction, "id">) => {
    let updatedTransactions: Transaction[];

    if (editingTransaction) {
      updatedTransactions = state.transactions.map((t) =>
        t.id === editingTransaction.id ? { ...txData, id: editingTransaction.id } : t
      );
      setEditingTransaction(null);
    } else {
      const newTx: Transaction = {
        ...txData,
        id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
        createdAt: Date.now(),
      };
      updatedTransactions = [newTx, ...state.transactions];
    }

    setState((prev) => ({
      ...prev,
      transactions: updatedTransactions,
    }));

    // Auto set view to transaction's month
    if (txData.tanggal) {
      setSelectedMonth(txData.tanggal.substring(0, 7));
    }

    // Check budget limit alert
    if (txData.jenis === "Pengeluaran") {
      checkBudgetAndNotify(txData.kategori, txData.tanggal, updatedTransactions, state.categories);
    }
  };

  // Edit Transaction Trigger
  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setCurrentView("input");
  };

  // Delete Transaction
  const handleDeleteTransaction = (id: string) => {
    setState((prev) => ({
      ...prev,
      transactions: prev.transactions.filter((t) => t.id !== id),
    }));
  };

  // Save Category
  const handleSaveCategory = (cat: Category) => {
    setState((prev) => {
      const exists = prev.categories.some((c) => c.id === cat.id);
      const updatedCategories = exists
        ? prev.categories.map((c) => (c.id === cat.id ? cat : c))
        : [...prev.categories, cat];
      return { ...prev, categories: updatedCategories };
    });
  };

  // Delete Category
  const handleDeleteCategory = (id: string) => {
    setState((prev) => ({
      ...prev,
      categories: prev.categories.filter((c) => c.id !== id),
    }));
  };

  // Update System Settings
  const handleUpdateSettings = (newSettings: AppState["settings"]) => {
    setState((prev) => ({
      ...prev,
      settings: newSettings,
    }));
  };

  // Notifications helpers
  const handleMarkAllNotifsAsRead = () => {
    setState((prev) => ({
      ...prev,
      notifications: prev.notifications.map((n) => ({ ...n, isRead: true })),
    }));
  };

  const handleClearAllNotifs = () => {
    setState((prev) => ({
      ...prev,
      notifications: [],
    }));
  };

  // Export JSON Backup
  const handleExportData = () => {
    const jsonStr = JSON.stringify(state, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${state.settings.appName || "SakuGenius"}_Backup_${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import JSON Backup
  const handleImportData = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(event.target?.result as string);
        if (parsed.transactions && parsed.categories) {
          setState(parsed);
          alert("Data berhasil dipulihkan dari berkas cadangan JSON!");
        } else {
          alert("Format file JSON tidak sesuai.");
        }
      } catch (err) {
        alert("Gagal membaca berkas JSON.");
      }
    };
    reader.readAsText(file);
  };

  // View title lookup
  const viewTitles = {
    dashboard: "Dashboard Keuangan",
    input: editingTransaction ? "Edit Catatan" : "Catat Transaksi",
    history: "Riwayat & Mutasi",
    settings: "Pengaturan Sistem & Kategori",
  };

  // If user is not authenticated, show welcoming login setup
  if (!currentUser) {
    return (
      <LoginModal
        appName={state.settings.appName}
        defaultName={state.settings.userName || ""}
        defaultPhone={state.settings.userPhone || ""}
        defaultEmail={state.settings.userEmail || ""}
        defaultLicense={state.settings.licenseCode || "SAKUGENIUSPRO"}
        onSuccess={handleLoginSuccess}
      />
    );
  }

  return (
    <div className="flex h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-800 dark:text-slate-100 overflow-hidden font-sans transition-colors duration-200">
      {/* Interactive Chat Notification Toast */}
      <ChatNotificationToast
        notification={activeChatAlert}
        onClose={() => setActiveChatAlert(null)}
        onViewBudget={() => {
          setCurrentView("dashboard");
          setActiveChatAlert(null);
        }}
      />

      {/* Notification Center Modal */}
      <NotificationCenterModal
        isOpen={isNotifCenterOpen}
        onClose={() => setIsNotifCenterOpen(false)}
        notifications={state.notifications}
        onMarkAllAsRead={handleMarkAllNotifsAsRead}
        onClearAll={handleClearAllNotifs}
        onViewBudget={() => {
          setIsNotifCenterOpen(false);
          setCurrentView("dashboard");
        }}
      />

      {/* Gemini AI Voice and Receipt Scanner Modal */}
      <AIModal
        isOpen={isAIModalOpen}
        onClose={() => setIsAIModalOpen(false)}
        categories={state.categories}
        onSaveTransaction={handleSaveTransaction}
      />

      {/* Desktop Sidebar */}
      <Sidebar
        currentView={currentView}
        onChangeView={(view) => {
          setEditingTransaction(null);
          setCurrentView(view);
        }}
        onOpenAIModal={() => setIsAIModalOpen(true)}
        userName={currentUser.name}
        userPhone={currentUser.phone}
        onLogout={handleLogout}
      />

      {/* Main Layout Container */}
      <div className="flex-1 flex flex-col h-full relative overflow-hidden">
        {/* Header */}
        <Header
          title={viewTitles[currentView]}
          isDark={isDark}
          onToggleTheme={toggleTheme}
          onOpenAIModal={() => setIsAIModalOpen(true)}
          onOpenNotifications={() => setIsNotifCenterOpen(true)}
          notifications={state.notifications}
          userName={currentUser.name}
        />

        {/* Scrollable Main View Area */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-8 pb-24 md:pb-8">
          {currentView === "dashboard" && (
            <DashboardView
              transactions={state.transactions}
              categories={state.categories}
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              onSwitchView={(v) => setCurrentView(v)}
              userName={currentUser.name}
              userPhone={currentUser.phone}
              userEmail={currentUser.email || `${currentUser.phone}@sakugenius.app`}
              appName={state.settings.appName}
            />
          )}

          {currentView === "input" && (
            <InputView
              categories={state.categories}
              transactions={state.transactions}
              onSaveTransaction={handleSaveTransaction}
              onOpenAIModal={() => setIsAIModalOpen(true)}
              editingTransaction={editingTransaction}
              onCancelEdit={() => {
                setEditingTransaction(null);
                setCurrentView("history");
              }}
            />
          )}

          {currentView === "history" && (
            <HistoryView
              transactions={state.transactions}
              categories={state.categories}
              selectedMonth={selectedMonth}
              onChangeMonth={setSelectedMonth}
              onEditTransaction={handleEditTransaction}
              onDeleteTransaction={handleDeleteTransaction}
              userName={currentUser.name}
              userPhone={currentUser.phone}
              userEmail={currentUser.email || `${currentUser.phone}@sakugenius.app`}
              appName={state.settings.appName}
            />
          )}

          {currentView === "settings" && (
            <SettingsView
              categories={state.categories}
              onSaveCategory={handleSaveCategory}
              onDeleteCategory={handleDeleteCategory}
              settings={state.settings}
              onUpdateSettings={handleUpdateSettings}
              onExportData={handleExportData}
              onImportData={handleImportData}
              onLogout={handleLogout}
              userName={currentUser.name}
              userPhone={currentUser.phone}
              userEmail={currentUser.email || ""}
              onUpdateUserProfile={handleUpdateUserProfile}
            />
          )}
        </main>

        {/* Mobile Bottom Navigation */}
        <BottomNav
          currentView={currentView}
          onChangeView={(view) => {
            setEditingTransaction(null);
            setCurrentView(view);
          }}
          onOpenAIModal={() => setIsAIModalOpen(true)}
        />
      </div>
    </div>
  );
}
