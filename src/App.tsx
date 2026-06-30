import React, { useState, useEffect } from "react";
import { 
  Activity, 
  Settings, 
  Database, 
  PlusCircle, 
  Layers, 
  User as UserIcon, 
  LogOut, 
  RefreshCw, 
  FileText, 
  LayoutDashboard, 
  Code,
  CheckCircle,
  AlertCircle,
  Users,
  Download
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

import { User, SettingsData, Transaction } from "./types";
import SetupModal from "./components/SetupModal";
import LoginScreen from "./components/LoginScreen";
import Dashboard from "./components/Dashboard";
import TransactionForm from "./components/TransactionForm";
import VoucherGenerator from "./components/VoucherGenerator";
import UsersTab from "./components/UsersTab";
import logoUrl from "./assets/images/regenerated_image_1782548322739.png";
import asopalavLogoUrl from "./assets/images/regenerated_image_1782658387597.png";

export default function App() {
  // Connection and Session state
  const [appsScriptUrl, setAppsScriptUrl] = useState<string>(() => {
    return localStorage.getItem("asopalav_script_url") || "";
  });
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("asopalav_user");
    return saved ? JSON.parse(saved) : null;
  });

  // UI state
  const [activeTab, setActiveTab] = useState<string>("Dashboard");
  const [isSetupOpen, setIsSetupOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // PWA Install Prompt state
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [showInstallBtn, setShowInstallBtn] = useState<boolean>(false);
  const [isInstallDismissed, setIsInstallDismissed] = useState<boolean>(() => {
    return localStorage.getItem("asopalav_pwa_dismissed") === "true";
  });
  const [isInIframe, setIsInIframe] = useState<boolean>(false);

  // Data state
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [nextVoucherNo, setNextVoucherNo] = useState<number>(1001);
  const [users, setUsers] = useState<User[]>([]);
  const [settings, setSettings] = useState<SettingsData>({
    employees: [],
    departments: [],
    categories: [],
    angadias: [],
    gstOptions: [],
    paymentMethods: []
  });

  // Trigger setup modal if no Apps Script URL is saved
  useEffect(() => {
    if (!appsScriptUrl) {
      setIsSetupOpen(true);
    } else if (currentUser) {
      // Fetch latest sheets data if URL is configured and user is logged in
      fetchLatestData();
    }
  }, [appsScriptUrl, currentUser]);

  // Listen to PWA installation events
  useEffect(() => {
    setIsInIframe(window.self !== window.top);

    const handleBeforeInstallPrompt = (e: Event) => {
      // Prevent browser's default prompt mini-infobar
      e.preventDefault();
      // Store the event so we can trigger it later
      setDeferredPrompt(e);
      // Show the installation button/banner
      setShowInstallBtn(true);
    };

    const handleAppInstalled = () => {
      setDeferredPrompt(null);
      setShowInstallBtn(false);
      showNotification("success", "AsōPalav ERP successfully installed as an App!");
    };

    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
    window.addEventListener("appinstalled", handleAppInstalled);

    // Check if running in standalone mode (already installed)
    if (window.matchMedia("(display-mode: standalone)").matches || (navigator as any).standalone) {
      setShowInstallBtn(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
      window.removeEventListener("appinstalled", handleAppInstalled);
    };
  }, []);

  const handleInstallApp = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    try {
      const { outcome } = await deferredPrompt.userChoice;
      console.log(`User response to PWA prompt: ${outcome}`);
    } catch (err) {
      console.error("Installation choice error:", err);
    }
    setDeferredPrompt(null);
    setShowInstallBtn(false);
  };

  const dismissInstallPrompt = () => {
    localStorage.setItem("asopalav_pwa_dismissed", "true");
    setIsInstallDismissed(true);
  };

  // Fetch all records & lists from Google Sheets
  const fetchLatestData = async () => {
    if (!appsScriptUrl) return;
    setIsLoading(true);
    try {
      const response = await fetch(`${appsScriptUrl}?action=getData`);
      if (!response.ok) {
        throw new Error("HTTP error: " + response.status);
      }
      const data = await response.json();
      if (data.status === "success") {
        setTransactions(data.records || []);
        if (data.settings) {
          setSettings(data.settings);
        }
        if (data.users) {
          setUsers(data.users);
        }
        if (data.nextVoucherNo) {
          setNextVoucherNo(data.nextVoucherNo);
        }
        showNotification("success", "Synchronized successfully with Google Sheets!");
      } else {
        showNotification("error", data.message || "Failed to parse Google Sheets data.");
      }
    } catch (err: any) {
      console.error("Fetch data error:", err);
      showNotification("error", "Failed to connect to Google Sheets. Verify your Web App URL.");
    } finally {
      setIsLoading(false);
    }
  };

  const showNotification = (type: "success" | "error", message: string) => {
    setNotification({ type, message });
    setTimeout(() => setNotification(null), 4000);
  };

  // Handle saving the Apps Script URL
  const handleSaveUrl = (url: string) => {
    localStorage.setItem("asopalav_script_url", url);
    setAppsScriptUrl(url);
    setIsSetupOpen(false);
    showNotification("success", "Connection URL saved successfully!");
  };

  // Handle login completion
  const handleLoginSuccess = (user: User) => {
    localStorage.setItem("asopalav_user", JSON.stringify(user));
    setCurrentUser(user);
    // If the pages array has items, make the first item the active tab
    if (user.pages && user.pages.length > 0) {
      setActiveTab(user.pages[0]);
    }
    showNotification("success", `Logged in as ${user.name}`);
  };

  // Handle logging out
  const handleLogout = () => {
    localStorage.removeItem("asopalav_user");
    setCurrentUser(null);
    setTransactions([]);
    showNotification("success", "Logged out from system.");
  };

  // Handle saving a new transaction
  const handleAddTransaction = async (formData: any): Promise<boolean> => {
    if (!appsScriptUrl) {
      showNotification("error", "Connection error: Please configure your Google Apps Script URL first.");
      return false;
    }

    try {
      // Send transaction to Google Sheet via Apps Script POST
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8" // bypass simple CORS requests criteria
        },
        body: JSON.stringify(formData)
      });

      if (!response.ok) {
        throw new Error("HTTP connection error: status " + response.status);
      }

      const result = await response.json();
      
      if (result.status === "success") {
        showNotification("success", `Transaction recorded successfully! Voucher Code: ${result.voucherNo}`);
        // Reload table data
        fetchLatestData();
        return true;
      } else {
        showNotification("error", result.message || "Failed to save transaction.");
        return false;
      }
    } catch (err: any) {
      console.error("Save transaction error:", err);
      // Fallback local save in Sandbox Mode
      const timestamp = new Date().toISOString();
      const mockVoucherNo = formData.voucherNo === "AUTO" ? `AP-${nextVoucherNo}` : formData.voucherNo;
      
      const newLocalTx: Transaction = {
        timestamp,
        utrNumber: formData.utrNumber || "",
        operatorName: formData.operatorName || "Sandbox Operator",
        dateOfExpense: formData.dateOfExpense || "",
        voucherNo: mockVoucherNo,
        employeeName: formData.employeeName || "Sample Employee",
        department: formData.department || "Administration",
        category: formData.category || "General",
        vendorName: formData.vendorName || "",
        gst: formData.gst || "0%",
        paymentMethod: formData.paymentMethod || "Cash",
        expenseAmount: formData.expenseAmount || 0,
        depositedAmount: formData.depositedAmount || 0,
        voucherRemarks: formData.voucherRemarks || "",
        billImage: formData.billImage || "",
        receiptImage: formData.receiptImage || "",
        itemImage: formData.itemImage || "",
        securityStampImage: formData.securityStampImage || "",
        authorisedBy: formData.authorisedBy || ""
      };

      setTransactions(prev => [newLocalTx, ...prev]);
      setNextVoucherNo(prev => prev + 1);
      showNotification("success", `[Sandbox Mode] Locally recorded! Voucher: ${mockVoucherNo}`);
      return true;
    }
  };

  // Handle editing a transaction
  const handleEditTransaction = async (formData: any): Promise<boolean> => {
    if (!appsScriptUrl) {
      setTransactions(prev => prev.map(tx => tx.voucherNo === formData.voucherNo ? { ...tx, ...formData } : tx));
      showNotification("success", `[Sandbox Mode] Transaction updated locally!`);
      return true;
    }

    setIsLoading(true);
    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({ action: "editRecord", ...formData })
      });

      if (!response.ok) {
        throw new Error("HTTP connection error: status " + response.status);
      }

      const result = await response.json();
      if (result.status === "success") {
        showNotification("success", `Record ${formData.voucherNo} updated successfully.`);
        fetchLatestData();
        return true;
      } else {
        showNotification("error", result.message || "Failed to update record.");
        return false;
      }
    } catch (err: any) {
      console.error("Edit transaction error:", err);
      setTransactions(prev => prev.map(tx => tx.voucherNo === formData.voucherNo ? { ...tx, ...formData } : tx));
      showNotification("success", `[Sandbox Mode Fallback] Updated locally.`);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Handle deleting a transaction
  const handleDeleteTransaction = async (voucherNo: string): Promise<boolean> => {
    if (!appsScriptUrl) {
      setTransactions(prev => prev.filter(tx => tx.voucherNo !== voucherNo));
      showNotification("success", `[Sandbox Mode] Transaction deleted locally!`);
      return true;
    }

    setIsLoading(true);
    try {
      const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({ action: "deleteRecord", voucherNo })
      });

      if (!response.ok) {
        throw new Error("HTTP connection error: status " + response.status);
      }

      const result = await response.json();
      if (result.status === "success") {
        showNotification("success", `Record ${voucherNo} deleted successfully.`);
        fetchLatestData();
        return true;
      } else {
        showNotification("error", result.message || "Failed to delete record.");
        return false;
      }
    } catch (err: any) {
      console.error("Delete transaction error:", err);
      setTransactions(prev => prev.filter(tx => tx.voucherNo !== voucherNo));
      showNotification("success", `[Sandbox Mode Fallback] Deleted locally.`);
      return true;
    } finally {
      setIsLoading(false);
    }
  };

  // Render main section based on RBAC & Active Tab
  const renderTabContent = () => {
    // Basic screen selection mapping
    switch (activeTab) {
      case "Dashboard":
        return (
          <Dashboard 
            transactions={transactions} 
            currentUser={currentUser} 
            onEditTransaction={handleEditTransaction}
            onDeleteTransaction={handleDeleteTransaction}
            settings={settings}
          />
        );
      case "Form":
        return (
          <TransactionForm 
            settings={settings} 
            onSubmit={handleAddTransaction} 
            nextVoucherNo={nextVoucherNo} 
            currentUser={currentUser}
            transactions={transactions}
          />
        );
      case "Voucher":
        return (
          <VoucherGenerator 
            nextVoucherNo={nextVoucherNo}
            transactions={transactions}
            initialData={
              transactions.length > 0 
                ? {
                    voucherNo: transactions[0].voucherNo,
                    date: transactions[0].dateOfExpense,
                    employeeName: transactions[0].employeeName,
                    particulars: transactions[0].voucherRemarks,
                    refBillDate: transactions[0].utrNumber ? `Ref: ${transactions[0].utrNumber}` : "",
                    staffPerson: transactions[0].operatorName,
                    amount: transactions[0].expenseAmount || transactions[0].depositedAmount,
                    authorizedBy: transactions[0].authorisedBy,
                    department: transactions[0].department,
                    category: transactions[0].category
                  }
                : undefined
            }
          />
        );
      case "Users":
        return (
          <UsersTab 
            users={users}
            currentUser={currentUser!}
            appsScriptUrl={appsScriptUrl}
            onRefresh={fetchLatestData}
            showNotification={showNotification}
          />
        );
      default:
        return <Dashboard transactions={transactions} currentUser={currentUser} />;
    }
  };

  // Ensure login screen displays if not authenticated
  if (!currentUser) {
    return (
      <>
        <LoginScreen 
          onLoginSuccess={handleLoginSuccess} 
          appsScriptUrl={appsScriptUrl} 
          onOpenSetup={() => setIsSetupOpen(true)}
        />
        <SetupModal
          currentUrl={appsScriptUrl}
          onSave={handleSaveUrl}
          isOpen={isSetupOpen}
          onClose={() => setIsSetupOpen(false)}
          canClose={!!appsScriptUrl}
        />

        {/* Floating PWA Install Promo Prompt */}
        {isInIframe ? (
          !isInstallDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-6 right-4 left-4 md:left-auto md:w-80 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-white"
              id="pwa-floating-install-iframe-login"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white">Install AsōPalav ERP</h4>
                    <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                      To install this app on your PC or Phone as a PWA, please click below to open the app in a new tab first.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={dismissInstallPrompt}
                  className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 text-xs font-bold mt-1">
                <a
                  href={window.location.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-center cursor-pointer transition-colors shadow-sm"
                >
                  Open in New Tab
                </a>
                <button
                  onClick={dismissInstallPrompt}
                  className="px-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-center cursor-pointer transition-colors"
                >
                  Later
                </button>
              </div>
            </motion.div>
          )
        ) : (
          showInstallBtn && !isInstallDismissed && (
            <motion.div
              initial={{ opacity: 0, y: 50, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 50, scale: 0.95 }}
              className="fixed bottom-6 right-4 left-4 md:left-auto md:w-80 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex flex-col gap-3"
              id="pwa-floating-install-prompt-login"
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-3">
                  <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                    <Download className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">Install AsōPalav ERP</h4>
                    <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                      Add to your home screen for offline support, instant loading, and fullscreen dashboard access.
                    </p>
                  </div>
                </div>
                <button 
                  onClick={dismissInstallPrompt}
                  className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <div className="flex gap-2 text-xs font-bold mt-1">
                <button
                  onClick={handleInstallApp}
                  className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-center cursor-pointer transition-colors shadow-sm"
                >
                  Install App
                </button>
                <button
                  onClick={dismissInstallPrompt}
                  className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-center cursor-pointer transition-colors"
                >
                  Later
                </button>
              </div>
            </motion.div>
          )
        )}
      </>
    );
  }

  // Filter tabs/pages based on Role-Based Access (user.pages column in Sheets USERS tab)
  const allowedTabs = [...(currentUser.pages || ["Dashboard", "Form", "Voucher"])];
  const isAdmin = currentUser.role?.toLowerCase() === "admin" || currentUser.role?.toLowerCase() === "administrator";
  if (isAdmin && !allowedTabs.includes("Users")) {
    allowedTabs.push("Users");
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased font-sans">
      
      {/* Dynamic Floating Notifications */}
      <AnimatePresence>
        {notification && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-md w-full px-4"
          >
            <div className={`p-4 rounded border shadow-xl flex items-start gap-3 ${
              notification.type === "success" 
                ? "bg-emerald-50 border-emerald-200 text-emerald-800" 
                : "bg-rose-50 border-rose-200 text-rose-800"
            }`}>
              {notification.type === "success" ? (
                <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              )}
              <div className="text-xs font-semibold leading-relaxed">{notification.message}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Beautiful Top Branding Header */}
      <header className="bg-white text-slate-900 shadow-sm border-b border-slate-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-16 flex items-center justify-between">
          
          {/* Logo Brand */}
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white border border-slate-150 rounded flex items-center justify-center shadow-sm overflow-hidden p-0.5">
              <img 
                src={logoUrl} 
                alt="AsōPalav Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
            <div>
              <div className="flex items-center h-6">
                <img 
                  src={asopalavLogoUrl} 
                  alt="AsōPalav Brand Logo" 
                  className="h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[9px] text-slate-400 uppercase tracking-widest font-mono font-bold leading-none mt-1">UPI PAYMENT VOUCHERS</p>
            </div>
          </div>

          {/* Navigation Controls for RBAC tabs */}
          <nav className="hidden md:flex items-center gap-2">
            {allowedTabs.includes("Dashboard") && (
              <button
                onClick={() => setActiveTab("Dashboard")}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "Dashboard" 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                id="tab-dashboard"
              >
                <LayoutDashboard className="w-3.5 h-3.5" /> DASHBOARD
              </button>
            )}
            {allowedTabs.includes("Form") && (
              <button
                onClick={() => setActiveTab("Form")}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "Form" 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                id="tab-form"
              >
                <PlusCircle className="w-3.5 h-3.5" /> TRANSACTION FORM
              </button>
            )}
            {allowedTabs.includes("Voucher") && (
              <button
                onClick={() => setActiveTab("Voucher")}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "Voucher" 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                id="tab-voucher"
              >
                <FileText className="w-3.5 h-3.5" /> VOUCHER CREATOR
              </button>
            )}
            {allowedTabs.includes("Users") && (
              <button
                onClick={() => setActiveTab("Users")}
                className={`px-3 py-1.5 rounded text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                  activeTab === "Users" 
                    ? "bg-indigo-600 text-white shadow-sm" 
                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-100"
                }`}
                id="tab-users"
              >
                <Users className="w-3.5 h-3.5" /> ACCOUNTS &amp; USERS
              </button>
            )}
          </nav>

          {/* Configuration and Profile Controls */}
          <div className="flex items-center gap-4">
            
            {/* PWA Install Button / New Tab link depending on iframe context */}
            {isInIframe ? (
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                title="Open in new tab to install as App"
                id="pwa-open-newtab-btn"
              >
                <Download className="w-3 h-3 animate-pulse" />
                <span>INSTALL APP (NEW TAB)</span>
              </a>
            ) : (
              showInstallBtn && (
                <button
                  onClick={handleInstallApp}
                  className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold shadow-sm transition-all cursor-pointer"
                  title="Install AsōPalav ERP PWA"
                  id="pwa-install-header-btn"
                >
                  <Download className="w-3 h-3 animate-bounce" />
                  <span>INSTALL APP</span>
                </button>
              )
            )}

            {/* Connected Badge (Google Sheets connection visual feedback) */}
            <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-emerald-50 border border-emerald-100 rounded-full text-[11px] font-semibold text-emerald-700">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>
              <span>Connected</span>
            </div>

            {/* Connection Reload button */}
            <button
              onClick={fetchLatestData}
              disabled={isLoading}
              title="Sync Latest Google Sheet Records"
              className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded transition-colors text-slate-500 hover:text-slate-950 cursor-pointer disabled:opacity-40 flex items-center justify-center"
              id="sync-data-header-btn"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin" : ""}`} />
            </button>

            {/* Sheets API config settings trigger */}
            {isAdmin && (
              <button
                onClick={() => setIsSetupOpen(true)}
                title="Connection Settings"
                className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded transition-colors text-slate-500 hover:text-slate-950 cursor-pointer flex items-center justify-center"
                id="setup-config-header-btn"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            )}

            {/* Vertical Split Line */}
            <div className="w-px h-6 bg-slate-200 shrink-0" />

            {/* User Profile dropdown panel */}
            <div className="flex items-center gap-3">
              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold block text-slate-950 leading-none">{currentUser.name}</span>
                <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mt-0.5 block">{currentUser.designation || "Admin"} • {currentUser.role || "Staff"}</span>
              </div>
              
              <button
                onClick={handleLogout}
                title="Sign Out"
                className="p-1.5 border border-slate-300 text-slate-600 hover:text-rose-600 hover:bg-rose-50 rounded transition-colors cursor-pointer flex items-center justify-center"
                id="logout-header-btn"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>

          </div>

        </div>
      </header>

      {/* Mobile navigation tab list (Bottom bar on smaller viewport) */}
      <div className="md:hidden bg-white border-t border-slate-200 fixed bottom-0 left-0 right-0 z-40 h-14 flex items-center justify-around text-slate-500 shadow-md px-2">
        {allowedTabs.includes("Dashboard") && (
          <button
            onClick={() => setActiveTab("Dashboard")}
            className={`flex flex-col items-center gap-1 cursor-pointer py-1 text-[10px] font-bold ${
              activeTab === "Dashboard" ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Dashboard</span>
          </button>
        )}
        {allowedTabs.includes("Form") && (
          <button
            onClick={() => setActiveTab("Form")}
            className={`flex flex-col items-center gap-1 cursor-pointer py-1 text-[10px] font-bold ${
              activeTab === "Form" ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <PlusCircle className="w-4 h-4" />
            <span>Form</span>
          </button>
        )}
        {allowedTabs.includes("Voucher") && (
          <button
            onClick={() => setActiveTab("Voucher")}
            className={`flex flex-col items-center gap-1 cursor-pointer py-1 text-[10px] font-bold ${
              activeTab === "Voucher" ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Voucher</span>
          </button>
        )}
        {allowedTabs.includes("Users") && (
          <button
            onClick={() => setActiveTab("Users")}
            className={`flex flex-col items-center gap-1 cursor-pointer py-1 text-[10px] font-bold ${
              activeTab === "Users" ? "text-indigo-600" : "text-slate-400"
            }`}
          >
            <Users className="w-4 h-4" />
            <span>Users</span>
          </button>
        )}
      </div>

      {/* Main body area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 md:p-6 pb-20 md:pb-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.15 }}
          >
            {renderTabContent()}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* Modals and configs */}
      <SetupModal
        currentUrl={appsScriptUrl}
        onSave={handleSaveUrl}
        isOpen={isSetupOpen}
        onClose={() => setIsSetupOpen(false)}
        canClose={!!appsScriptUrl}
      />

      {/* Floating PWA Install Promo Prompt */}
      {isInIframe ? (
        !isInstallDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-50 bg-slate-900 border border-slate-800 rounded-xl shadow-2xl p-4 flex flex-col gap-3 text-white"
            id="pwa-floating-install-iframe"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-indigo-500/20 border border-indigo-500/30 rounded-lg flex items-center justify-center text-indigo-400 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-white">Install AsōPalav ERP</h4>
                  <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                    To install this app on your PC or Phone as a PWA, please click below to open the app in a new tab first.
                  </p>
                </div>
              </div>
              <button 
                onClick={dismissInstallPrompt}
                className="text-slate-400 hover:text-white p-0.5 rounded-full hover:bg-slate-800 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2 text-xs font-bold mt-1">
              <a
                href={window.location.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-center cursor-pointer transition-colors shadow-sm"
              >
                Open in New Tab
              </a>
              <button
                onClick={dismissInstallPrompt}
                className="px-3 py-2 border border-slate-700 hover:bg-slate-800 text-slate-300 rounded-lg text-center cursor-pointer transition-colors"
              >
                Later
              </button>
            </div>
          </motion.div>
        )
      ) : (
        showInstallBtn && !isInstallDismissed && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.95 }}
            className="fixed bottom-16 md:bottom-6 right-4 left-4 md:left-auto md:w-80 z-50 bg-white border border-slate-200 rounded-xl shadow-2xl p-4 flex flex-col gap-3"
            id="pwa-floating-install-prompt"
          >
            <div className="flex items-start justify-between">
              <div className="flex gap-3">
                <div className="w-10 h-10 bg-indigo-50 border border-indigo-100 rounded-lg flex items-center justify-center text-indigo-600 shrink-0">
                  <Download className="w-5 h-5" />
                </div>
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Install AsōPalav ERP</h4>
                  <p className="text-[11px] text-slate-500 mt-0.5 leading-relaxed">
                    Add to your home screen for offline support, instant loading, and fullscreen dashboard access.
                  </p>
                </div>
              </div>
              <button 
                onClick={dismissInstallPrompt}
                className="text-slate-400 hover:text-slate-600 p-0.5 rounded-full hover:bg-slate-100 cursor-pointer"
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex gap-2 text-xs font-bold mt-1">
              <button
                onClick={handleInstallApp}
                className="flex-1 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-center cursor-pointer transition-colors shadow-sm"
              >
                Install App
              </button>
              <button
                onClick={dismissInstallPrompt}
                className="px-3 py-2 border border-slate-200 hover:bg-slate-50 text-slate-600 rounded-lg text-center cursor-pointer transition-colors"
              >
                Later
              </button>
            </div>
          </motion.div>
        )
      )}

    </div>
  );
}
