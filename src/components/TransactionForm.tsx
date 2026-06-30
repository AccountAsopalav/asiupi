import React, { useState, useRef, useEffect, useMemo } from "react";
import { Upload, X, Check, Save, FileText, Loader2, Sparkles, Image as ImageIcon } from "lucide-react";
import { motion } from "motion/react";
import { SettingsData, User, Transaction } from "../types";

interface TransactionFormProps {
  settings: SettingsData;
  onSubmit: (formData: any) => Promise<boolean>;
  nextVoucherNo: number;
  currentUser?: User | null;
  transactions: Transaction[];
}

// Helper functions to handle and format dates as DD-MMM-YY
function normalizeDate(dateStr: any): string {
  if (!dateStr) return "";

  // Handle actual Date object if passed
  if (dateStr instanceof Date) {
    const y = dateStr.getFullYear();
    const m = String(dateStr.getMonth() + 1).padStart(2, '0');
    const d = String(dateStr.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  let str = String(dateStr).trim();
  if (!str) return "";

  // Handle standard long dates or dates containing timezone names (e.g. GMT or parentheses)
  if (str.includes("GMT") || str.includes("UTC") || str.includes("(") || (/\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\b/i.test(str) && str.length > 15)) {
    try {
      // Strip parenthesized timezone like (India Standard Time) to prevent Invalid Date
      const cleanDateStr = str.replace(/\([^)]*\)/g, "").trim();
      const parsed = new Date(cleanDateStr);
      if (!isNaN(parsed.getTime())) {
        const y = parsed.getFullYear();
        const m = String(parsed.getMonth() + 1).padStart(2, '0');
        const d = String(parsed.getDate()).padStart(2, '0');
        return `${y}-${m}-${d}`;
      }
    } catch (e) {
      // ignore
    }
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  if (str.includes("T")) {
    const isoPart = str.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
      return isoPart;
    }
    str = isoPart;
  }

  let cleanStr = str.replace(/,/g, " ").replace(/\s+/g, " ").trim();

  const lowerStr = cleanStr.toLowerCase();
  let foundMonthKey: string | null = null;
  let foundMonthVal: string | null = null;
  
  const MONTHS_MAP: Record<string, string> = {
    january: "01", february: "02", march: "03", april: "04", may: "05", june: "06",
    july: "07", august: "08", september: "09", october: "10", november: "11", december: "12",
    jan: "01", feb: "02", mar: "03", apr: "04", jun: "06", jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
  };

  for (const key of Object.keys(MONTHS_MAP)) {
    if (lowerStr.includes(key)) {
      if (!foundMonthKey || key.length > foundMonthKey.length) {
        foundMonthKey = key;
        foundMonthVal = MONTHS_MAP[key];
      }
    }
  }

  if (foundMonthKey && foundMonthVal) {
    const spaceStr = cleanStr.replace(/[-/]/g, " ").replace(/\s+/g, " ").trim();
    const parts = spaceStr.split(" ");
    
    let day = "";
    let year = "";
    const month = foundMonthVal;

    if (parts.length === 3) {
      const p0 = parts[0];
      const p2 = parts[2];

      if (p2.length === 4 || p2.length === 2) {
        day = p0;
        year = p2;
      } else if (p0.length === 4 || p0.length === 2) {
        day = p2;
        year = p0;
      } else {
        day = p0;
        year = p2;
      }

      if (year.length === 2) {
        const yNum = parseInt(year);
        year = yNum > 50 ? `19${year}` : `20${year}`;
      }

      return `${year}-${month.padStart(2, '0')}-${day.replace(/\D/g, '').padStart(2, '0')}`;
    }
  }

  if (cleanStr.includes("/")) {
    const parts = cleanStr.split("/");
    if (parts.length === 3) {
      const p0 = parts[0].trim();
      const p1 = parts[1].trim();
      const p2 = parts[2].trim();

      let year = "";
      let month = "";
      let day = "";

      if (p0.length === 4) {
        year = p0;
        month = p1;
        day = p2;
      } else {
        const yPart = p2;
        if (yPart.length === 2) {
          const yNum = parseInt(yPart);
          year = yNum > 50 ? `19${yPart}` : `20${yPart}`;
        } else {
          year = yPart;
        }

        const num0 = parseInt(p0);
        const num1 = parseInt(p1);

        if (num0 > 12) {
          day = p0;
          month = p1;
        } else if (num1 > 12) {
          day = p1;
          month = p0;
        } else {
          day = p0;
          month = p1;
        }
      }

      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  if (cleanStr.includes("-")) {
    const parts = cleanStr.split("-");
    if (parts.length === 3) {
      const p0 = parts[0].trim();
      const p1 = parts[1].trim();
      const p2 = parts[2].trim();

      let year = "";
      let month = "";
      let day = "";

      if (p0.length === 4) {
        year = p0;
        month = p1;
        day = p2;
      } else {
        const yPart = p2;
        if (yPart.length === 2) {
          const yNum = parseInt(yPart);
          year = yNum > 50 ? `19${yPart}` : `20${yPart}`;
        } else {
          year = yPart;
        }

        const num0 = parseInt(p0);
        const num1 = parseInt(p1);

        if (num0 > 12) {
          day = p0;
          month = p1;
        } else if (num1 > 12) {
          day = p1;
          month = p0;
        } else {
          day = p0;
          month = p1;
        }
      }

      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    }
  }

  try {
    const parsed = new Date(cleanStr);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (e) {
    // Ignore
  }

  return cleanStr;
}

function formatShortDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const normalized = normalizeDate(dateStr);
  if (!normalized) return String(dateStr);

  const parts = normalized.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(month, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      const shortMonth = months[monthIndex];
      const shortYear = year.slice(-2);
      return `${day}-${shortMonth}-${shortYear}`; // e.g., "11-Jun-26"
    }
  }
  return String(dateStr);
}

// Drag & Drop File Uploader Component
interface FileUploaderProps {
  label: string;
  id: string;
  value: string;
  onChange: (base64: string) => void;
}

function FileUploader({ label, id, value, onChange }: FileUploaderProps) {
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  };

  const handleFile = async (file: File) => {
    if (!file.type.startsWith("image/")) {
      alert("Only image files are supported!");
      return;
    }
    
    if (file.size > 1.5 * 1024 * 1024) {
      alert("Image is too large. Please select an image under 1.5MB.");
      return;
    }

    try {
      const base64 = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = (err) => reject(err);
      });
      onChange(base64);
    } catch (err) {
      console.error("Failed to read file", err);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0]);
    }
  };

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      
      {value ? (
        <div className="relative border border-slate-200 rounded overflow-hidden bg-slate-50 p-2 flex items-center justify-between gap-3 h-16">
          <div className="flex items-center gap-2.5 min-w-0">
            <img src={value} alt={label} className="w-12 h-12 object-cover rounded border border-slate-200 shrink-0" />
            <span className="text-[9px] text-emerald-800 font-bold bg-emerald-50 border border-emerald-100 px-1.5 py-0.5 rounded flex items-center gap-1 uppercase tracking-wide">
              <Check className="w-2.5 h-2.5" /> Selected
            </span>
          </div>
          <button
            type="button"
            onClick={() => onChange("")}
            className="text-slate-400 hover:text-rose-600 p-1.5 hover:bg-rose-50 rounded transition-colors cursor-pointer"
            id={`clear-${id}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragOver={handleDrag}
          onDragLeave={handleDrag}
          onDrop={handleDrop}
          onClick={handleButtonClick}
          className={`border-2 border-dashed rounded p-3 text-center flex flex-col items-center justify-center gap-1 cursor-pointer transition-all h-16 ${
            dragActive 
              ? "border-indigo-500 bg-indigo-50/50" 
              : "border-slate-300 hover:border-indigo-500 bg-slate-50/50 hover:bg-slate-50"
          }`}
          id={`dropzone-${id}`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleChange}
            className="hidden"
            id={id}
          />
          <Upload className="w-4 h-4 text-slate-400" />
          <div className="text-[9px] text-slate-500 font-semibold leading-none uppercase tracking-wide">
            <span className="text-indigo-600 font-bold">Upload image</span>
          </div>
        </div>
      )}
    </div>
  );
}

export default function TransactionForm({ settings, onSubmit, nextVoucherNo, currentUser, transactions }: TransactionFormProps) {
  const hasDepositAccess = !!(currentUser && (
    currentUser.role?.toLowerCase() === "admin" || 
    currentUser.role?.toLowerCase() === "administrator" || 
    currentUser.role?.toLowerCase() === "manager"
  ));

  const [type, setType] = useState<"Expense" | "Income">("Expense");

  // Force Expense mode if user doesn't have deposit access
  useEffect(() => {
    if (!hasDepositAccess && type === "Income") {
      setType("Expense");
    }
  }, [hasDepositAccess, type]);

  const lastFiveTransactions = useMemo(() => {
    return [...transactions]
      .filter((tx) => {
        if (type === "Expense") {
          return (parseFloat(String(tx.expenseAmount)) || 0) > 0;
        } else {
          return (parseFloat(String(tx.depositedAmount)) || 0) > 0;
        }
      })
      .sort((a, b) => {
        const dateA = normalizeDate(a.dateOfExpense);
        const dateB = normalizeDate(b.dateOfExpense);
        if (dateA !== dateB) {
          return dateB.localeCompare(dateA);
        }
        const tsA = a.timestamp || "";
        const tsB = b.timestamp || "";
        if (tsA !== tsB) {
          return tsB.localeCompare(tsA);
        }
        const vA = a.voucherNo || "";
        const vB = b.voucherNo || "";
        const numA = parseInt(vA.replace(/\D/g, ""), 10);
        const numB = parseInt(vB.replace(/\D/g, ""), 10);
        if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
          return numB - numA;
        }
        return vB.localeCompare(vA);
      })
      .slice(0, 5);
  }, [transactions, type]);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [pendingPayload, setPendingPayload] = useState<any>(null);
  const [autoVoucher, setAutoVoucher] = useState(true);

  // Form Fields State
  const [utrNumber, setUtrNumber] = useState("");
  const [operatorName, setOperatorName] = useState(() => {
    return currentUser ? (currentUser.name || currentUser.username || "") : "";
  });
  const [dateOfExpense, setDateOfExpense] = useState(new Date().toISOString().split("T")[0]);

  // Sync operatorName with currentUser when user logs in or changes
  useEffect(() => {
    if (currentUser) {
      setOperatorName(currentUser.name || currentUser.username || "");
    }
  }, [currentUser]);
  const [voucherNo, setVoucherNo] = useState(`AP-${nextVoucherNo}`);
  const [employeeName, setEmployeeName] = useState("");
  const [isOtherEmployee, setIsOtherEmployee] = useState(false);
  const [customEmployeeName, setCustomEmployeeName] = useState("");
  const [department, setDepartment] = useState("");
  const [category, setCategory] = useState("");
  const [vendorName, setVendorName] = useState("");
  const [gst, setGst] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [expenseAmount, setExpenseAmount] = useState<string>("");
  const [depositedAmount, setDepositedAmount] = useState<string>("");
  const [isExpenseFocused, setIsExpenseFocused] = useState(false);
  const [isDepositedFocused, setIsDepositedFocused] = useState(false);

  const formatIndianCurrency = (valueStr: string) => {
    if (!valueStr) return "";
    const num = parseFloat(valueStr);
    if (isNaN(num)) return valueStr;
    return new Intl.NumberFormat("en-IN", {
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    }).format(num);
  };
  const [angadia, setAngadia] = useState("");
  const [voucherRemarks, setVoucherRemarks] = useState("");
  const [billImage, setBillImage] = useState("");
  const [receiptImage, setReceiptImage] = useState("");
  const [itemImage, setItemImage] = useState("");
  const [securityStampImage, setSecurityStampImage] = useState("");
  const [authorisedBy, setAuthorisedBy] = useState("");

  // Update voucher number dynamically if nextVoucherNo changes and autoVoucher is selected
  useEffect(() => {
    if (autoVoucher) {
      setVoucherNo(`AP-${nextVoucherNo}`);
    }
  }, [nextVoucherNo, autoVoucher]);

  // Dropdowns Dynamic Selection Filter according to user request
  const filteredDropdowns = React.useMemo(() => {
    const allEmployees = settings.employees || [];
    const allDepartments = settings.departments || [];
    const allCategories = settings.categories || [];
    const allAngadias = settings.angadias || [];
    const allPaymentMethods = settings.paymentMethods || [];

    if (type === "Income") {
      return {
        employees: allEmployees,
        departments: allDepartments.filter(d => ["Sales", "Finance", "Administration", "Marketing", "Management"].includes(d) || !["Operations", "HR", "IT", "Security"].includes(d)),
        categories: allCategories.filter(c => c.toLowerCase().includes("deposit") || c.toLowerCase().includes("income") || c.toLowerCase().includes("sales") || c.toLowerCase().includes("received") || c.toLowerCase().includes("refund") || ["Capital", "Interest", "Sales Inflow", "Angadia Deposit"].includes(c)),
        angadias: allAngadias,
        paymentMethods: allPaymentMethods.filter(p => ["Bank Transfer", "Cheque", "UPI", "Cash", "Angadia"].includes(p))
      };
    } else {
      return {
        employees: allEmployees,
        departments: allDepartments,
        categories: allCategories.filter(c => !c.toLowerCase().includes("income") && !c.toLowerCase().includes("received") && !c.toLowerCase().includes("sales inflow")),
        angadias: allAngadias,
        paymentMethods: allPaymentMethods
      };
    }
  }, [settings, type]);

  // Keep values empty if not selected, but reset if selected value is no longer in the filtered list
  useEffect(() => {
    if (employeeName && !isOtherEmployee && !filteredDropdowns.employees.includes(employeeName)) {
      setEmployeeName("");
    }
    if (department && !filteredDropdowns.departments.includes(department)) {
      setDepartment("");
    }
    if (category && !filteredDropdowns.categories.includes(category)) {
      setCategory("");
    }
    if (paymentMethod && !filteredDropdowns.paymentMethods.includes(paymentMethod)) {
      setPaymentMethod("");
    }
    if (angadia && !filteredDropdowns.angadias.includes(angadia)) {
      setAngadia("");
    }
  }, [filteredDropdowns, employeeName, department, category, paymentMethod, angadia]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (type === "Expense") {
      const amountNum = parseFloat(expenseAmount) || 0;
      if (amountNum > 10000) {
        alert("Expense amount cannot exceed ₹10,000.");
        return;
      }
    }

    const payload = {
      action: "addRecord",
      utrNumber: type === "Income" ? "" : utrNumber,
      operatorName: type === "Income" ? "" : operatorName,
      dateOfExpense,
      voucherNo: type === "Income" ? "AUTO" : (autoVoucher ? "AUTO" : voucherNo),
      employeeName: type === "Income" ? "" : employeeName,
      department: type === "Income" ? "" : department,
      category: type === "Income" ? "" : category,
      vendorName: type === "Income" ? "" : vendorName,
      gst: type === "Income" ? "0%" : (settings.gstOptions.includes(gst) ? gst : gst || "0%"),
      paymentMethod: type === "Income" ? "" : paymentMethod,
      expenseAmount: type === "Expense" ? parseFloat(expenseAmount) || 0 : 0,
      depositedAmount: type === "Income" ? parseFloat(depositedAmount) || 0 : 0,
      voucherRemarks: type === "Income" ? "" : (voucherRemarks + (angadia ? ` [Angadia: ${angadia}]` : "")),
      billImage: type === "Income" ? "" : billImage,
      receiptImage: type === "Income" ? "" : receiptImage,
      itemImage: type === "Income" ? "" : itemImage,
      securityStampImage: type === "Income" ? "" : securityStampImage,
      authorisedBy: type === "Income" ? "" : authorisedBy
    };

    setPendingPayload(payload);
    setShowConfirmDialog(true);
  };

  const handleCancelSubmit = () => {
    setShowConfirmDialog(false);
    setPendingPayload(null);
  };

  const handleActualSubmit = async () => {
    if (!pendingPayload) return;
    setIsSubmitting(true);

    const success = await onSubmit(pendingPayload);
    
    if (success) {
      setUtrNumber("");
      setVendorName("");
      setExpenseAmount("");
      setDepositedAmount("");
      setVoucherRemarks("");
      setBillImage("");
      setReceiptImage("");
      setItemImage("");
      setSecurityStampImage("");
      // Reset dropdowns to empty
      setEmployeeName("");
      setIsOtherEmployee(false);
      setCustomEmployeeName("");
      setDepartment("");
      setCategory("");
      setPaymentMethod("");
      setAngadia("");
      setGst("");
      setAuthorisedBy("");
      // Reset operatorName to current logged in user name
      if (currentUser) {
        setOperatorName(currentUser.name || currentUser.username || "");
      }
      setShowConfirmDialog(false);
      setPendingPayload(null);
    }
    
    setIsSubmitting(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 font-sans">
      <div className="bg-white border border-slate-200 shadow-md rounded p-6 md:p-8 space-y-6">
        
        {/* Header and Toggle Button */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b border-slate-100 pb-5 gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-5 h-5 text-indigo-600" />
            <span>ENTER NEW TRANSACTION</span>
          </h2>
          <p className="text-xs text-slate-400">Add deposits or outflow vouchers directly to your company ledger</p>
        </div>

        {/* Dynamic Mode Selector */}
        {hasDepositAccess && (
          <div className="flex items-center gap-1.5 bg-slate-100 p-1 rounded border border-slate-200">
            <button
              type="button"
              onClick={() => {
                setType("Expense");
                setDepositedAmount("");
              }}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                type === "Expense" 
                  ? "bg-rose-500 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="toggle-expense-mode"
            >
              Expense Log
            </button>
            <button
              type="button"
              onClick={() => {
                setType("Income");
                setExpenseAmount("");
              }}
              className={`px-4 py-1.5 rounded text-xs font-bold transition-all cursor-pointer uppercase tracking-wider ${
                type === "Income" 
                  ? "bg-indigo-600 text-white shadow-sm" 
                  : "text-slate-600 hover:text-slate-950"
              }`}
              id="toggle-income-mode"
            >
              Deposit
            </button>
          </div>
        )}
      </div>

      {/* Main input form */}
      <form onSubmit={handleFormSubmit} className="space-y-6">
        
        {type === "Income" ? (
          /* Simple 2-column grid for Deposit mode */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deposited Amount (₹)</label>
              <input
                type="text"
                inputMode="decimal"
                required
                value={isDepositedFocused ? depositedAmount : formatIndianCurrency(depositedAmount)}
                onFocus={() => setIsDepositedFocused(true)}
                onBlur={(e) => {
                  setIsDepositedFocused(false);
                  const clean = e.target.value.replace(/[^0-9.]/g, "");
                  setDepositedAmount(clean);
                }}
                onChange={(e) => {
                  const val = e.target.value;
                  const clean = val.replace(/[^0-9.]/g, "");
                  setDepositedAmount(clean);
                }}
                placeholder="0.00"
                className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-emerald-600 text-sm bg-slate-50 focus:bg-white"
                id="field-deposited-amount"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date of Deposit</label>
              <input
                type="date"
                required
                value={dateOfExpense}
                onChange={(e) => setDateOfExpense(e.target.value)}
                className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50 focus:bg-white font-mono font-bold"
                id="field-date"
              />
              <div className="mt-1">
                <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 uppercase">
                  {formatShortDate(dateOfExpense)}
                </span>
              </div>
            </div>
          </div>
        ) : (
          /* Full fields for Expense mode */
          <>
            {/* Row 4: Voucher configuration option (Moved to Top) */}
            <div className="bg-slate-50 p-4 border border-slate-200 rounded flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="space-y-1">
                <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Automatic Ledger Voucher Integration</h4>
                <p className="text-[11px] text-slate-500 leading-normal">
                  Selecting "Auto Voucher" locks an incremental voucher code on submission. Disabling allows manual editing.
                </p>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="flex flex-col items-end">
                  <span className="text-[9px] font-bold text-slate-400 uppercase">Voucher ID</span>
                  <span className="text-xs font-mono font-bold text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded shadow-sm mt-0.5">
                    {voucherNo}
                  </span>
                </div>
                
                <button
                  type="button"
                  onClick={() => {
                    const toggled = !autoVoucher;
                    setAutoVoucher(toggled);
                    if (!toggled) {
                      setVoucherNo("");
                    } else {
                      setVoucherNo(`AP-${nextVoucherNo}`);
                    }
                  }}
                  className="text-slate-600 hover:text-slate-900 p-1.5 hover:bg-slate-100 rounded border border-slate-200 transition-all cursor-pointer"
                  id="toggle-voucher-numbering"
                >
                  {autoVoucher ? (
                    <span className="text-[10px] font-bold text-indigo-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-indigo-100 shadow-sm uppercase tracking-wide">
                      ⚡ Auto
                    </span>
                  ) : (
                    <span className="text-[10px] font-bold text-slate-600 flex items-center gap-1 bg-white px-2 py-0.5 rounded border border-slate-200 shadow-sm uppercase tracking-wide">
                      ✏️ Manual
                    </span>
                  )}
                </button>
              </div>
            </div>

            {/* Row 1: Amount & Reference Details */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Expense Amount (₹)</label>
                <input
                  type="text"
                  inputMode="decimal"
                  required
                  value={isExpenseFocused ? expenseAmount : formatIndianCurrency(expenseAmount)}
                  onFocus={() => setIsExpenseFocused(true)}
                  onBlur={(e) => {
                    setIsExpenseFocused(false);
                    const clean = e.target.value.replace(/[^0-9.]/g, "");
                    if (clean === "") {
                      setExpenseAmount("");
                      return;
                    }
                    const num = parseFloat(clean);
                    if (!isNaN(num) && num > 10000) {
                      // Do not accept the entry if above 10000
                      return;
                    }
                    setExpenseAmount(clean);
                  }}
                  onChange={(e) => {
                    const val = e.target.value;
                    const clean = val.replace(/[^0-9.]/g, "");
                    if (clean === "") {
                      setExpenseAmount("");
                      return;
                    }
                    const num = parseFloat(clean);
                    if (!isNaN(num) && num > 10000) {
                      // Do not accept the entry if above 10000 (discard / reject the input change)
                      return;
                    }
                    setExpenseAmount(clean);
                  }}
                  placeholder="0.00"
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 font-bold font-mono text-rose-500 text-sm bg-slate-50 focus:bg-white"
                  id="field-expense-amount"
                />
                <span className="text-[9px] text-rose-500 block font-bold">Max limit: ₹10,000 per transaction</span>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">UTR Number / Ref</label>
                <input
                  type="text"
                  value={utrNumber}
                  onChange={(e) => setUtrNumber(e.target.value)}
                  placeholder="Enter bank transaction ID"
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs placeholder-slate-400 bg-slate-50 focus:bg-white font-mono"
                  id="field-utr"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date of Expense</label>
                <input
                  type="date"
                  required
                  value={dateOfExpense}
                  onChange={(e) => setDateOfExpense(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-slate-50 focus:bg-white font-mono font-bold"
                  id="field-date"
                />
                <div className="mt-1">
                  <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 uppercase">
                    {formatShortDate(dateOfExpense)}
                  </span>
                </div>
              </div>
            </div>

            {/* Row 2: Dynamic Dropdowns filtered by type */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 bg-slate-50 p-4 rounded border border-slate-200">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Employee / Worker Name</label>
                <select
                  required
                  value={isOtherEmployee ? "Others" : employeeName}
                  onChange={(e) => {
                    const val = e.target.value;
                    if (val === "Others") {
                      setIsOtherEmployee(true);
                      setEmployeeName("");
                      setCustomEmployeeName("");
                    } else {
                      setIsOtherEmployee(false);
                      setEmployeeName(val);
                      setCustomEmployeeName("");
                    }
                  }}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-semibold"
                  id="dropdown-employee"
                >
                  <option value="">-- Select Employee / Worker --</option>
                  {filteredDropdowns.employees.map((emp, idx) => (
                    <option key={idx} value={emp}>{emp}</option>
                  ))}
                  <option value="Others">Others</option>
                </select>

                {isOtherEmployee && (
                  <div className="mt-2 bg-indigo-50/20 p-2 rounded border border-indigo-100">
                    <label className="block text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Enter Name Manually *</label>
                    <input
                      type="text"
                      required
                      value={customEmployeeName}
                      onChange={(e) => {
                        const val = e.target.value;
                        setCustomEmployeeName(val);
                        setEmployeeName(val);
                      }}
                      placeholder="Type name here..."
                      className="w-full px-2.5 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-semibold"
                    />
                  </div>
                )}
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Department</label>
                <select
                  required
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-semibold"
                  id="dropdown-department"
                >
                  <option value="">-- Select Department --</option>
                  {filteredDropdowns.departments.map((dept, idx) => (
                    <option key={idx} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Category</label>
                <select
                  required
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-semibold"
                  id="dropdown-category"
                >
                  <option value="">-- Select Category --</option>
                  {filteredDropdowns.categories.map((cat, idx) => (
                    <option key={idx} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Payment Method</label>
                <select
                  required
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-semibold"
                  id="dropdown-payment-method"
                >
                  <option value="">-- Select Payment Method --</option>
                  {filteredDropdowns.paymentMethods.map((pm, idx) => (
                    <option key={idx} value={pm}>{pm}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Angadia</label>
                <select
                  value={angadia}
                  onChange={(e) => setAngadia(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-semibold"
                  id="dropdown-angadia"
                >
                  <option value="">-- Select Angadia --</option>
                  {filteredDropdowns.angadias.map((ang, idx) => (
                    <option key={idx} value={ang}>{ang}</option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">GST (%)</label>
                <select
                  value={gst}
                  onChange={(e) => setGst(e.target.value)}
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs bg-white font-semibold font-mono"
                  id="dropdown-gst"
                >
                  <option value="">-- Select GST --</option>
                  {settings.gstOptions.length > 0 ? (
                    settings.gstOptions.map((opt, idx) => (
                      <option key={idx} value={opt}>{opt}</option>
                    ))
                  ) : (
                    <>
                      <option value="0%">0% Exempt</option>
                      <option value="5%">5% GST</option>
                      <option value="12%">12% GST</option>
                      <option value="18%">18% GST</option>
                      <option value="28%">28% GST</option>
                    </>
                  )}
                </select>
              </div>
            </div>

            {/* Row 3: Operational Details & Metadata */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Vendor Name</label>
                <input
                  type="text"
                  value={vendorName}
                  onChange={(e) => setVendorName(e.target.value)}
                  placeholder="Supplier or Client Name"
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs placeholder-slate-400 bg-slate-50 focus:bg-white font-semibold"
                  id="field-vendor"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Operator Name</label>
                <input
                  type="text"
                  value={operatorName}
                  onChange={(e) => setOperatorName(e.target.value)}
                  placeholder="e.g. Counter Operator"
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs placeholder-slate-400 bg-slate-50 focus:bg-white font-semibold"
                  id="field-operator"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Authorised By</label>
                <input
                  type="text"
                  value={authorisedBy}
                  onChange={(e) => setAuthorisedBy(e.target.value)}
                  placeholder="Approving manager name"
                  className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs placeholder-slate-400 bg-slate-50 focus:bg-white font-semibold"
                  id="field-authorised-by"
                />
              </div>
            </div>

            {/* Row 5: Remarks */}
            <div className="space-y-1.5">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voucher Remarks</label>
              <textarea
                value={voucherRemarks}
                onChange={(e) => setVoucherRemarks(e.target.value)}
                rows={2}
                placeholder="Add any specific description, note of justification or instructions..."
                className="w-full px-3 py-2 rounded border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-xs placeholder-slate-400 bg-slate-50 focus:bg-white resize-none font-semibold"
                id="field-remarks"
              />
            </div>

            {/* Row 6: Image Upload grid (4 slots) */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 pt-2">
              <FileUploader label="Upload Bill Image" id="bill-img" value={billImage} onChange={setBillImage} />
              <FileUploader label="Receipt Image" id="receipt-img" value={receiptImage} onChange={setReceiptImage} />
              <FileUploader label="Item Image" id="item-img" value={itemImage} onChange={setItemImage} />
              <FileUploader label="Security Stamp" id="stamp-img" value={securityStampImage} onChange={setSecurityStampImage} />
            </div>
          </>
        )}

        {/* Submit button */}
        <div className="border-t border-slate-100 pt-5 flex justify-end">
          <button
            type="submit"
            disabled={isSubmitting}
            className={`px-6 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-xs shadow-md shadow-indigo-100 transition-all flex items-center gap-2 cursor-pointer ${
              isSubmitting ? "bg-slate-200 cursor-not-allowed text-slate-500 shadow-none" : ""
            }`}
            id="transaction-submit-btn"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                <span>SAVING TO GOOGLE SHEET...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>SUBMIT LEDGER ENTRY</span>
              </>
            )}
          </button>
        </div>

      </form>
      </div>

      {/* Confirmation Dialog Modal */}
      {showConfirmDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="bg-white rounded-lg border border-slate-200 shadow-xl max-w-lg w-full overflow-hidden font-sans"
          >
            {/* Modal Header */}
            <div className="bg-slate-50 border-b border-slate-100 p-4 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wide">Review Entry Details</h3>
                  <p className="text-[10px] text-slate-400 uppercase tracking-widest">Verify before pushing to Google Sheets</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={handleCancelSubmit}
                className="p-1 hover:bg-slate-100 rounded text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Body */}
            <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
              {/* Big styled amount */}
              <div className="bg-slate-50 border border-slate-100 rounded p-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">Total Amount</p>
                <p className="text-2xl font-bold font-mono tracking-tight text-slate-900 mt-1">
                  {type === "Expense" ? (
                    <span className="text-rose-600">
                      ₹{parseFloat(expenseAmount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  ) : (
                    <span className="text-emerald-600">
                      ₹{parseFloat(depositedAmount || "0").toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  )}
                </p>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider mt-2 ${
                  type === "Expense" ? "bg-rose-50 text-rose-700 border border-rose-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                }`}>
                  {type} Mode
                </span>
              </div>

              {/* Details Grid */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Date</span>
                  <span className="font-semibold text-slate-700 font-mono">{formatShortDate(dateOfExpense)}</span>
                </div>

                <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Voucher No</span>
                  <span className="font-bold text-slate-800 font-mono">
                    {type === "Income" ? "AUTO" : (autoVoucher ? "AUTO" : voucherNo)}
                  </span>
                </div>

                {type === "Expense" && (
                  <>
                    {employeeName && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100 col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Employee / Worker</span>
                        <span className="font-semibold text-slate-700">{employeeName}</span>
                      </div>
                    )}

                    {department && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Department</span>
                        <span className="font-semibold text-slate-700">{department}</span>
                      </div>
                    )}

                    {category && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Category</span>
                        <span className="font-semibold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded text-[10px] inline-block">
                          {category}
                        </span>
                      </div>
                    )}

                    {vendorName && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Vendor Name</span>
                        <span className="font-semibold text-slate-700 truncate block">{vendorName}</span>
                      </div>
                    )}

                    {paymentMethod && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Payment Method</span>
                        <span className="font-semibold text-slate-700">{paymentMethod}</span>
                      </div>
                    )}

                    {gst && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">GST Rate</span>
                        <span className="font-semibold text-slate-700">{gst}</span>
                      </div>
                    )}

                    {angadia && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Angadia</span>
                        <span className="font-semibold text-slate-700">{angadia}</span>
                      </div>
                    )}

                    {utrNumber && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100 col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">UTR / Txn Number</span>
                        <span className="font-mono text-slate-700">{utrNumber}</span>
                      </div>
                    )}

                    {authorisedBy && (
                      <div className="bg-slate-50/50 p-2.5 rounded border border-slate-100 col-span-2">
                        <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-0.5">Authorised By</span>
                        <span className="font-semibold text-slate-700">{authorisedBy}</span>
                      </div>
                    )}
                  </>
                )}
              </div>

              {/* Remarks */}
              {(type === "Income" ? false : !!voucherRemarks || !!angadia) && (
                <div className="bg-slate-50/50 p-3 rounded border border-slate-100 text-xs">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Remarks</span>
                  <p className="text-slate-600 leading-relaxed italic">
                    "{voucherRemarks || "—"}" {angadia ? `[Angadia: ${angadia}]` : ""}
                  </p>
                </div>
              )}

              {/* Attached Images Indicator */}
              {type === "Expense" && (billImage || receiptImage || itemImage || securityStampImage) && (
                <div className="bg-slate-50/50 p-3 rounded border border-slate-100 text-xs space-y-1.5">
                  <span className="text-[10px] text-slate-400 uppercase font-semibold block mb-1">Attached Evidences</span>
                  <div className="flex flex-wrap gap-2">
                    {billImage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-100 font-semibold text-[10px]">
                        <Check className="w-3 h-3" /> Bill
                      </span>
                    )}
                    {receiptImage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-100 font-semibold text-[10px]">
                        <Check className="w-3 h-3" /> Receipt
                      </span>
                    )}
                    {itemImage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-100 font-semibold text-[10px]">
                        <Check className="w-3 h-3" /> Item
                      </span>
                    )}
                    {securityStampImage && (
                      <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-100 font-semibold text-[10px]">
                        <Check className="w-3 h-3" /> Security Stamp
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-end gap-3 text-xs font-semibold">
              <button
                type="button"
                onClick={handleCancelSubmit}
                disabled={isSubmitting}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 rounded text-slate-600 transition-colors disabled:opacity-50 cursor-pointer uppercase tracking-wider text-[10px]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleActualSubmit}
                disabled={isSubmitting}
                className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-white font-bold transition-all shadow-md shadow-indigo-100 flex items-center gap-1.5 cursor-pointer uppercase tracking-wider text-[10px] disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>SUBMITTING...</span>
                  </>
                ) : (
                  <>
                    <Save className="w-3.5 h-3.5" />
                    <span>CONFIRM & SUBMIT</span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* New Section: Last Five Transactions */}
      <div className="bg-white border border-slate-200 shadow-md rounded p-6 md:p-8 space-y-4" id="section-last-five-transactions">
        <div>
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
            <span className={`w-1.5 h-3 rounded-full ${type === "Expense" ? "bg-rose-600" : "bg-indigo-600"}`} />
            LATEST 5 {type === "Expense" ? "EXPENSE" : "DEPOSIT"} ENTRIES (VIEW ONLY)
          </h3>
          <p className="text-xs text-slate-400 mt-0.5">
            Quick reference of recently logged {type === "Expense" ? "expense" : "deposit"} transactions
          </p>
        </div>

        {lastFiveTransactions.length === 0 ? (
          <div className="text-center py-6 border border-dashed border-slate-200 rounded-lg bg-slate-50 text-xs text-slate-400 font-medium">
            No {type === "Expense" ? "expense" : "deposit"} transactions found.
          </div>
        ) : (
          <div className="overflow-x-auto border border-slate-100 rounded-lg">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#0F172B] text-white text-[10px] font-bold uppercase tracking-wider h-10">
                  <th className="p-3 whitespace-nowrap">Voucher No</th>
                  <th className="p-3 whitespace-nowrap">Date</th>
                  <th className="p-3 whitespace-nowrap">Type</th>
                  <th className="p-3 whitespace-nowrap">Employee / Worker</th>
                  <th className="p-3 whitespace-nowrap">Category</th>
                  <th className="p-3">Particulars / Remarks</th>
                  <th className="p-3 text-right whitespace-nowrap">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {lastFiveTransactions.map((tx) => {
                  const txIsExpense = (parseFloat(String(tx.expenseAmount)) || 0) > 0;
                  const amount = txIsExpense ? (tx.expenseAmount || 0) : (tx.depositedAmount || 0);
                  
                  return (
                    <tr key={tx.voucherNo || tx.timestamp || Math.random()} className="hover:bg-slate-50 transition-colors">
                      <td className="p-3 font-mono font-bold text-slate-950 whitespace-nowrap">{tx.voucherNo || "—"}</td>
                      <td className="p-3 text-slate-500 whitespace-nowrap">{formatShortDate(tx.dateOfExpense)}</td>
                      <td className="p-3 whitespace-nowrap">
                        {txIsExpense ? (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-rose-50 text-rose-700 border border-rose-100">
                            Expense
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wide bg-emerald-50 text-emerald-700 border border-emerald-100">
                            Deposit
                          </span>
                        )}
                      </td>
                      <td className="p-3 whitespace-nowrap">{tx.employeeName || "—"}</td>
                      <td className="p-3 whitespace-nowrap">
                        <span className="text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded text-[10px]">
                          {tx.category || "—"}
                        </span>
                      </td>
                      <td className="p-3 text-slate-500" title={tx.voucherRemarks}>
                        <div className="max-w-[200px] md:max-w-[300px] truncate">
                          {tx.voucherRemarks || "—"}
                        </div>
                      </td>
                      <td className="p-3 text-right font-mono font-bold text-slate-950 whitespace-nowrap">
                        <span className={txIsExpense ? "text-rose-600" : "text-emerald-600"}>
                          ₹{amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}
