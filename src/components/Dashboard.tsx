import React, { useMemo, useState, useRef } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, PieChart, Pie, Cell } from "recharts";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp, Layers, Award, FileText, Check, AlertCircle, Search, X, Image as ImageIcon, Calendar, Download, ChevronLeft, ChevronRight, SlidersHorizontal, Filter, Eye, Edit2, Trash2, Lock, Upload, Loader2, Save } from "lucide-react";
import { Transaction } from "../types";

interface DashboardProps {
  transactions: Transaction[];
  currentUser: any;
  onEditTransaction?: (formData: any) => Promise<boolean>;
  onDeleteTransaction?: (voucherNo: string) => Promise<boolean>;
  settings?: any;
}

function normalizeDate(dateStr: any): string {
  if (!dateStr) return "";

  // Handle Date objects and custom Timestamp structures
  if (typeof dateStr === "object") {
    if (typeof dateStr.toDate === "function") {
      dateStr = dateStr.toDate();
    }
    if (dateStr instanceof Date || typeof dateStr.getMonth === "function") {
      const y = dateStr.getFullYear();
      const m = String(dateStr.getMonth() + 1).padStart(2, '0');
      const d = String(dateStr.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  }

  let str = String(dateStr).trim();
  if (!str) return "";

  // 1. If it's already a perfect YYYY-MM-DD format, return it
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // 2. If it is an ISO string containing 'T'
  if (str.includes("T")) {
    const isoPart = str.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
      return isoPart;
    }
    str = isoPart;
  }

  // 3. Handle standard JavaScript Date.toString() output (e.g. "Sat Jun 27 2026 00:00:00 ...")
  const matchFull = str.match(/^([A-Za-z]{3})\s+([A-Za-z]{3})\s+(\d{1,2})\s+(\d{4})/);
  if (matchFull) {
    const monthName = matchFull[2].toLowerCase();
    const day = matchFull[3].padStart(2, '0');
    const year = matchFull[4];
    const MONTHS_MAP: Record<string, string> = {
      jan: "01", feb: "02", mar: "03", apr: "04", may: "05", jun: "06",
      jul: "07", aug: "08", sep: "09", oct: "10", nov: "11", dec: "12"
    };
    const month = MONTHS_MAP[monthName.slice(0, 3)];
    if (month) {
      return `${year}-${month}-${day}`;
    }
  }

  // Normalize separators to spaces first to find components, but preserve '-' and '/'
  let cleanStr = str.replace(/,/g, " ").replace(/\s+/g, " ").trim();

  // Check if there is a month name in the string
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

  // If a month name was found (e.g. "27-Jun-2026" or "27 Jun 2026")
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

  // 3. If there are slash separators '/'
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

  // 4. If there are dash separators '-'
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
    // Ignore and fallback
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

const DEMO_TRANSACTIONS: Transaction[] = [];

function canUserEdit(dateOfExpenseStr: string | undefined | null, isAdmin: boolean): boolean {
  if (isAdmin) return true;
  if (!dateOfExpenseStr) return false;
  try {
    const normalizedExpense = normalizeDate(dateOfExpenseStr);
    if (!normalizedExpense || !/^\d{4}-\d{2}-\d{2}$/.test(normalizedExpense)) {
      return false;
    }
    const [year, month, day] = normalizedExpense.split("-").map(Number);
    const expenseDate = new Date(year, month - 1, day);
    
    const today = new Date();
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    
    const diffTime = todayDate.getTime() - expenseDate.getTime();
    const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    
    // same day (0) or one day before (1)
    return diffDays <= 1;
  } catch (e) {
    return false;
  }
}

export default function Dashboard({ transactions, currentUser, onEditTransaction, onDeleteTransaction, settings }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Edit, Delete, View states
  const [selectedTx, setSelectedTx] = useState<Transaction | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isEditOtherEmployee, setIsEditOtherEmployee] = useState(false);
  const [editCustomEmployeeName, setEditCustomEmployeeName] = useState("");
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isActionSubmitting, setIsActionSubmitting] = useState(false);

  const [editForm, setEditForm] = useState({
    voucherNo: "",
    utrNumber: "",
    operatorName: "",
    dateOfExpense: "",
    employeeName: "",
    department: "",
    category: "",
    vendorName: "",
    gst: "",
    paymentMethod: "",
    expenseAmount: 0,
    depositedAmount: 0,
    voucherRemarks: "",
    billImage: "",
    receiptImage: "",
    itemImage: "",
    securityStampImage: "",
    authorisedBy: ""
  });

  const handleOpenView = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsViewOpen(true);
  };

  const handleOpenEdit = (tx: Transaction) => {
    setSelectedTx(tx);
    const isEmpOther = tx.employeeName && !(settings?.employees || []).includes(tx.employeeName);
    setIsEditOtherEmployee(!!isEmpOther);
    setEditCustomEmployeeName(isEmpOther ? tx.employeeName : "");
    setEditForm({
      voucherNo: tx.voucherNo || "",
      utrNumber: tx.utrNumber || "",
      operatorName: tx.operatorName || "",
      dateOfExpense: normalizeDate(tx.dateOfExpense) || "",
      employeeName: tx.employeeName || "",
      department: tx.department || "",
      category: tx.category || "",
      vendorName: tx.vendorName || "",
      gst: tx.gst || "0%",
      paymentMethod: tx.paymentMethod || "Cash",
      expenseAmount: tx.expenseAmount || 0,
      depositedAmount: tx.depositedAmount || 0,
      voucherRemarks: tx.voucherRemarks || "",
      billImage: tx.billImage || "",
      receiptImage: tx.receiptImage || "",
      itemImage: tx.itemImage || "",
      securityStampImage: tx.securityStampImage || "",
      authorisedBy: tx.authorisedBy || ""
    });
    setIsEditOpen(true);
  };

  const handleOpenDelete = (tx: Transaction) => {
    setSelectedTx(tx);
    setIsDeleteOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onEditTransaction) return;
    setIsActionSubmitting(true);
    try {
      const success = await onEditTransaction(editForm);
      if (success) {
        setIsEditOpen(false);
        setSelectedTx(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!selectedTx || !onDeleteTransaction) return;
    setIsActionSubmitting(true);
    try {
      const success = await onDeleteTransaction(selectedTx.voucherNo);
      if (success) {
        setIsDeleteOpen(false);
        setSelectedTx(null);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsActionSubmitting(false);
    }
  };

  // Local table filters
  const [localCategory, setLocalCategory] = useState("All");
  const [localMethod, setLocalMethod] = useState("All");
  const [localDept, setLocalDept] = useState("All");
  const [localType, setLocalType] = useState("All"); // "All", "Expenses", "Deposits"
  const [localSearch, setLocalSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const baseTransactions = useMemo(() => {
    return [...transactions].sort((a, b) => {
      // 1. Sort by dateOfExpense (descending)
      const dateA = normalizeDate(a.dateOfExpense);
      const dateB = normalizeDate(b.dateOfExpense);
      if (dateA !== dateB) {
        return dateB.localeCompare(dateA);
      }
      
      // 2. Sort by timestamp (descending)
      const tsA = a.timestamp || "";
      const tsB = b.timestamp || "";
      if (tsA !== tsB) {
        return tsB.localeCompare(tsA);
      }

      // 3. Sort by voucherNo (descending)
      const vA = a.voucherNo || "";
      const vB = b.voucherNo || "";
      
      const numA = parseInt(vA.replace(/\D/g, ""), 10);
      const numB = parseInt(vB.replace(/\D/g, ""), 10);
      if (!isNaN(numA) && !isNaN(numB) && numA !== numB) {
        return numB - numA;
      }
      
      return vB.localeCompare(vA);
    });
  }, [transactions]);

  // Unique options for local dropdown filters
  const uniqueCategories = useMemo(() => {
    const cats = new Set<string>();
    baseTransactions.forEach(tx => {
      if (tx.category && tx.category.trim()) cats.add(tx.category.trim());
    });
    return Array.from(cats).sort();
  }, [baseTransactions]);

  const uniqueMethods = useMemo(() => {
    const methods = new Set<string>();
    baseTransactions.forEach(tx => {
      if (tx.paymentMethod && tx.paymentMethod.trim()) methods.add(tx.paymentMethod.trim());
    });
    return Array.from(methods).sort();
  }, [baseTransactions]);

  const uniqueDepartments = useMemo(() => {
    const depts = new Set<string>();
    baseTransactions.forEach(tx => {
      if (tx.department && tx.department.trim()) depts.add(tx.department.trim());
    });
    return Array.from(depts).sort();
  }, [baseTransactions]);

  const filteredTransactions = useMemo(() => {
    let result = baseTransactions;

    if (startDate) {
      result = result.filter(tx => {
        if (!tx.dateOfExpense) return false;
        const normalized = normalizeDate(tx.dateOfExpense);
        return normalized >= startDate;
      });
    }
    if (endDate) {
      result = result.filter(tx => {
        if (!tx.dateOfExpense) return false;
        const normalized = normalizeDate(tx.dateOfExpense);
        return normalized <= endDate;
      });
    }

    if (!searchQuery.trim()) return result;
    const q = searchQuery.toLowerCase().trim();
    return result.filter((tx) => {
      const matchVoucher = tx.voucherNo?.toLowerCase().includes(q);
      const matchEmployee = tx.employeeName?.toLowerCase().includes(q);
      const matchCategory = tx.category?.toLowerCase().includes(q);
      const matchVendor = tx.vendorName?.toLowerCase().includes(q);
      const matchUtr = tx.utrNumber?.toLowerCase().includes(q);
      const matchDepartment = tx.department?.toLowerCase().includes(q);
      const matchRemarks = tx.voucherRemarks?.toLowerCase().includes(q);
      const matchMethod = tx.paymentMethod?.toLowerCase().includes(q);
      return (
        matchVoucher ||
        matchEmployee ||
        matchCategory ||
        matchVendor ||
        matchUtr ||
        matchDepartment ||
        matchRemarks ||
        matchMethod
      );
    });
  }, [baseTransactions, searchQuery, startDate, endDate]);

  const tableFilteredTransactions = useMemo(() => {
    let result = filteredTransactions;

    if (localCategory !== "All") {
      result = result.filter(tx => tx.category?.trim() === localCategory);
    }
    if (localMethod !== "All") {
      result = result.filter(tx => tx.paymentMethod?.trim() === localMethod);
    }
    if (localDept !== "All") {
      result = result.filter(tx => tx.department?.trim() === localDept);
    }
    if (localType !== "All") {
      if (localType === "Expenses") {
        result = result.filter(tx => (parseFloat(String(tx.expenseAmount)) || 0) > 0);
      } else if (localType === "Deposits") {
        result = result.filter(tx => (parseFloat(String(tx.depositedAmount)) || 0) > 0);
      }
    }
    if (localSearch.trim()) {
      const q = localSearch.toLowerCase().trim();
      result = result.filter(tx => 
        tx.voucherNo?.toLowerCase().includes(q) ||
        tx.employeeName?.toLowerCase().includes(q) ||
        tx.category?.toLowerCase().includes(q) ||
        tx.vendorName?.toLowerCase().includes(q) ||
        tx.utrNumber?.toLowerCase().includes(q) ||
        tx.department?.toLowerCase().includes(q) ||
        tx.voucherRemarks?.toLowerCase().includes(q) ||
        tx.paymentMethod?.toLowerCase().includes(q)
      );
    }

    return result;
  }, [filteredTransactions, localCategory, localMethod, localDept, localType, localSearch]);

  const totalPages = Math.max(1, Math.ceil(tableFilteredTransactions.length / itemsPerPage));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  
  const paginatedTransactions = useMemo(() => {
    const startIdx = (safeCurrentPage - 1) * itemsPerPage;
    return tableFilteredTransactions.slice(startIdx, startIdx + itemsPerPage);
  }, [tableFilteredTransactions, safeCurrentPage, itemsPerPage]);

  const handleExportCSV = () => {
    if (filteredTransactions.length === 0) return;
    
    const headers = [
      "Voucher No",
      "Date",
      "UTR Number / Ref",
      "Employee",
      "Department",
      "Category",
      "Vendor",
      "GST",
      "Payment Method",
      "Expense Amount (INR)",
      "Deposited Amount (INR)",
      "Remarks",
      "Authorised By"
    ];

    const formatCSVValue = (val: any) => {
      if (val === null || val === undefined) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(","),
      ...filteredTransactions.map(tx => [
        formatCSVValue(tx.voucherNo || "N/A"),
        formatCSVValue(formatShortDate(tx.dateOfExpense) || "N/A"),
        formatCSVValue(tx.utrNumber || "N/A"),
        formatCSVValue(tx.employeeName || "N/A"),
        formatCSVValue(tx.department || "N/A"),
        formatCSVValue(tx.category || "N/A"),
        formatCSVValue(tx.vendorName || "N/A"),
        formatCSVValue(tx.gst || "0%"),
        formatCSVValue(tx.paymentMethod || "N/A"),
        tx.expenseAmount || 0,
        tx.depositedAmount || 0,
        formatCSVValue(tx.voucherRemarks || ""),
        formatCSVValue(tx.authorisedBy || "")
      ].join(","))
    ];

    const csvString = "\uFEFF" + csvRows.join("\r\n");
    const blob = new Blob([csvString], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    
    const dateStr = new Date().toISOString().slice(0, 10);
    const filterSuffix = (startDate || endDate) 
      ? `_filtered_${startDate || 'start'}_to_${endDate || 'end'}` 
      : "";
    link.setAttribute("download", `transaction_report_${dateStr}${filterSuffix}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };
  
  // Calculate aggregates and distributions
  const stats = useMemo(() => {
    let totalIncome = 0;
    let totalExpense = 0;
    
    const departmentMap: Record<string, number> = {};
    const categoryMap: Record<string, number> = {};
    const employeeMap: Record<string, number> = {};
    const monthlyMap: Record<string, { month: string; income: number; expense: number }> = {};
    const paymentMethodMap: Record<string, number> = {};
    const categoryTopSingleMap: Record<string, { category: string; amount: number; voucherNo: string; employeeName: string; date: string; vendorName: string }> = {};

    const isDemo = transactions.length === 0;
    const activeList = filteredTransactions;

    activeList.forEach((tx) => {
      const inc = parseFloat(String(tx.depositedAmount)) || 0;
      const exp = parseFloat(String(tx.expenseAmount)) || 0;
      
      totalIncome += inc;
      totalExpense += exp;

      // Group Department Expenses
      if (exp > 0 && tx.department) {
        const dept = tx.department.trim();
        departmentMap[dept] = (departmentMap[dept] || 0) + exp;
      }

      // Group Category Expenses
      if (exp > 0 && tx.category) {
        const cat = tx.category.trim();
        categoryMap[cat] = (categoryMap[cat] || 0) + exp;
      }

      // Group Employee Expenses
      if (exp > 0 && tx.employeeName) {
        const emp = tx.employeeName.trim();
        employeeMap[emp] = (employeeMap[emp] || 0) + exp;
      }

      // Group Payment Method Expenses
      if (exp > 0 && tx.paymentMethod) {
        const pm = tx.paymentMethod.trim();
        paymentMethodMap[pm] = (paymentMethodMap[pm] || 0) + exp;
      }

      // Group Top Expense by Category
      if (exp > 0 && tx.category) {
        const cat = tx.category.trim();
        if (!categoryTopSingleMap[cat] || exp > categoryTopSingleMap[cat].amount) {
          categoryTopSingleMap[cat] = {
            category: cat,
            amount: exp,
            voucherNo: tx.voucherNo || "N/A",
            employeeName: tx.employeeName || "N/A",
            date: formatShortDate(tx.dateOfExpense) || "N/A",
            vendorName: tx.vendorName || "N/A"
          };
        }
      }

      // Monthly Trend aggregation
      if (tx.dateOfExpense) {
        try {
          const normalized = normalizeDate(tx.dateOfExpense);
          const dateParts = normalized.split("-");
          if (dateParts.length >= 2) {
            const yearMonth = `${dateParts[0]}-${dateParts[1]}`; // e.g. "2026-06"
            const dateObj = new Date(parseInt(dateParts[0]), parseInt(dateParts[1]) - 1, 1);
            const monthLabel = dateObj.toLocaleString("default", { month: "short", year: "numeric" });
            
            if (!monthlyMap[yearMonth]) {
              monthlyMap[yearMonth] = { month: monthLabel, income: 0, expense: 0 };
            }
            monthlyMap[yearMonth].income += inc;
            monthlyMap[yearMonth].expense += exp;
          }
        } catch (e) {
          // ignore parsing error
        }
      }
    });

    // Convert objects to sorted top arrays
    const departmentExpenses = Object.entries(departmentMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const categoryExpenses = Object.entries(categoryMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const employeeExpenses = Object.entries(employeeMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 5);

    const paymentMethodExpenses = Object.entries(paymentMethodMap)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    const topSingleExpensesByCategory = Object.values(categoryTopSingleMap)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);

    // Sort monthly trend chronologically
    const monthlyTrend = Object.entries(monthlyMap)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([, data]) => data);

    // Calculate current month's Net Cash Flow (Total Deposits minus Total Expenses for the current month)
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonthNum = String(now.getMonth() + 1).padStart(2, "0");
    const currentYearMonth = `${currentYear}-${currentMonthNum}`;
    const defaultMonthLabel = now.toLocaleString("default", { month: "short", year: "numeric" });

    let currentMonthDeposits = 0;
    let currentMonthExpenses = 0;
    let monthLabelToUse = defaultMonthLabel;

    // Check if current month has any transactions
    const hasCurrentMonthTx = activeList.some(tx => tx.dateOfExpense && tx.dateOfExpense.startsWith(currentYearMonth));
    
    let targetYM = currentYearMonth;
    if (hasCurrentMonthTx) {
      monthLabelToUse = defaultMonthLabel;
    } else {
      // Fallback to the latest month in the dataset
      let latestYM = "";
      activeList.forEach((tx) => {
        if (tx.dateOfExpense) {
          const parts = tx.dateOfExpense.split("-");
          if (parts.length >= 2) {
            const ym = `${parts[0]}-${parts[1]}`;
            if (ym > latestYM) {
              latestYM = ym;
            }
          }
        }
      });
      if (latestYM) {
        targetYM = latestYM;
        try {
          const parts = latestYM.split("-");
          const dateObj = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, 1);
          monthLabelToUse = dateObj.toLocaleString("default", { month: "short", year: "numeric" });
        } catch {
          monthLabelToUse = "Selected Month";
        }
      }
    }

    // Sum for targetYM
    activeList.forEach((tx) => {
      if (tx.dateOfExpense && tx.dateOfExpense.startsWith(targetYM)) {
        currentMonthDeposits += parseFloat(String(tx.depositedAmount)) || 0;
        currentMonthExpenses += parseFloat(String(tx.expenseAmount)) || 0;
      }
    });

    const currentMonthNetFlow = currentMonthDeposits - currentMonthExpenses;

    return {
      totalIncome: totalIncome,
      totalExpense: totalExpense,
      netBalance: totalIncome - totalExpense,
      currentMonthDeposits,
      currentMonthExpenses,
      currentMonthNetFlow,
      currentMonthLabel: monthLabelToUse,
      departmentExpenses,
      categoryExpenses,
      employeeExpenses,
      monthlyTrend,
      paymentMethodExpenses,
      topSingleExpensesByCategory,
      actualDataCount: transactions.length,
      filteredDataCount: filteredTransactions.length,
      isDemo
    };
  }, [transactions, filteredTransactions]);

  // Daily Summary (deposits & expenses for the current day)
  const todayStats = useMemo(() => {
    const today = new Date();
    const y = today.getFullYear();
    const m = String(today.getMonth() + 1).padStart(2, '0');
    const d = String(today.getDate()).padStart(2, '0');
    const todayStr = `${y}-${m}-${d}`;

    let expenses = 0;
    let deposits = 0;
    let count = 0;

    baseTransactions.forEach((tx) => {
      if (tx.dateOfExpense) {
        const normalized = normalizeDate(tx.dateOfExpense);
        if (normalized === todayStr) {
          expenses += parseFloat(String(tx.expenseAmount)) || 0;
          deposits += parseFloat(String(tx.depositedAmount)) || 0;
          count++;
        }
      }
    });

    return {
      expenses,
      deposits,
      count,
      dateStr: todayStr,
      formattedDate: today.toLocaleDateString("en-IN", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      }),
    };
  }, [baseTransactions]);

  const COLORS = ["#4f46e5", "#818cf8", "#a5b4fc", "#c7d2fe", "#e0e7ff"];
  const PIE_COLORS = ["#4f46e5", "#06b6d4", "#10b981", "#f59e0b", "#ec4899"];
  const BAR_COLORS = ["#6366f1", "#4f46e5", "#4338ca", "#3730a3", "#312e81"];

  return (
    <div className="space-y-6 font-sans text-slate-900">
      
      {/* Welcome Banner */}
      <div className="bg-slate-900 rounded border border-slate-800 p-6 text-white shadow-md flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-600/10 rounded-full blur-2xl pointer-events-none" />
        <div className="space-y-1">
          <p className="text-[10px] text-indigo-300 font-mono font-bold uppercase tracking-widest">Workspace Dashboard</p>
          <h2 className="text-xl font-bold tracking-tight">Welcome back, {currentUser?.name || "User"}</h2>
          <p className="text-xs text-slate-400 mt-1">
            System Identity: <span className="font-bold text-indigo-300 font-mono uppercase bg-slate-800 border border-slate-700 px-1.5 py-0.5 rounded text-[10px]">{currentUser?.role || "Administrator"}</span> 
            {currentUser?.department && <span className="ml-2">• Department: <b className="text-slate-200">{currentUser.department}</b></span>}
          </p>
        </div>
        <div className="text-xs bg-slate-800 border border-slate-700 px-4 py-2 rounded flex flex-col gap-0.5">
          <span className="text-slate-400 text-[10px] font-bold uppercase tracking-wide">Sync State</span>
          <span className="font-bold text-emerald-400 flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full"></span>
            <span>{stats.actualDataCount} Sheets Records Loaded</span>
          </span>
          {/* No demo label when empty */}
        </div>
      </div>

      {/* Daily Summary Widget */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded border border-indigo-100">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest">Daily Snapshot</h3>
            <p className="text-sm font-bold text-slate-800">{todayStats.formattedDate}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap items-center gap-4 w-full md:w-auto">
          {/* Today's Deposits Card */}
          <div className="flex-1 sm:flex-initial min-w-[160px] bg-emerald-50/40 border border-emerald-100/70 rounded p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-0.5">Today's Deposits</p>
              <p className="text-lg font-black text-emerald-800 font-mono">
                ₹{todayStats.deposits.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-700 shrink-0">
              <ArrowUpRight className="w-4 h-4" />
            </div>
          </div>

          {/* Today's Expenses Card */}
          <div className="flex-1 sm:flex-initial min-w-[160px] bg-rose-50/40 border border-rose-100/70 rounded p-3 flex items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-black text-rose-600 uppercase tracking-widest mb-0.5">Today's Expenses</p>
              <p className="text-lg font-black text-rose-800 font-mono">
                ₹{todayStats.expenses.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
              </p>
            </div>
            <div className="w-8 h-8 rounded-full bg-rose-100 flex items-center justify-center text-rose-700 shrink-0">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>

          {/* Today's Activity */}
          <div className="flex-1 sm:flex-initial min-w-[120px] bg-slate-50 border border-slate-150 rounded p-3 flex flex-col justify-center">
            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-0.5">Activity</span>
            <span className="text-sm font-bold text-slate-700 flex items-center gap-1.5">
              <span className={`w-2 h-2 rounded-full ${todayStats.count > 0 ? "bg-indigo-500 animate-pulse" : "bg-slate-300"}`}></span>
              {todayStats.count} {todayStats.count === 1 ? "transaction" : "transactions"}
            </span>
          </div>
        </div>
      </div>

      {/* Global Search Bar Panel */}
      <div className="bg-white border border-slate-200 rounded p-4 shadow-sm space-y-3">
        <div className="flex flex-col md:flex-row gap-4 items-center">
          <div className="relative flex-1 w-full">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search across entire dataset (by payee, category, vendor, department, method, UTR, voucher #, remarks)..."
              className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-xs font-semibold placeholder-slate-400 transition-all"
              id="global-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
                id="clear-search-btn"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2 shrink-0 w-full md:w-auto justify-between md:justify-end">
            {searchQuery ? (
              <span className="text-[10px] font-bold uppercase bg-indigo-50 border border-indigo-100 text-indigo-700 px-3 py-1.5 rounded tracking-wider">
                {stats.filteredDataCount} of {stats.actualDataCount} Matches
              </span>
            ) : (
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider bg-slate-50 border border-slate-150 px-3 py-1.5 rounded">
                All Records Active
              </span>
            )}
          </div>
        </div>


        {/* Date Filter & Export Row */}
        <div className="flex flex-col sm:flex-row gap-4 items-end sm:items-center justify-between border-t border-slate-100 pt-3">
          <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
            <div className="flex items-center gap-2">
              <Calendar className="w-3.5 h-3.5 text-indigo-500" />
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Date Range:</span>
            </div>
            
            <div className="flex items-center gap-1.5 w-full sm:w-auto">
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                placeholder="Start Date"
                title="Start Date"
              />
              <span className="text-[10px] font-bold text-slate-400">to</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded text-[11px] font-bold font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 text-slate-700"
                placeholder="End Date"
                title="End Date"
              />
              {(startDate || endDate) && (
                <div className="flex items-center gap-1.5 shrink-0">
                  <div className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-1 rounded uppercase flex items-center gap-1 shadow-sm">
                    <span>{startDate ? formatShortDate(startDate) : "ANY"}</span>
                    <span className="text-indigo-300 font-normal">to</span>
                    <span>{endDate ? formatShortDate(endDate) : "ANY"}</span>
                  </div>
                  <button
                    onClick={() => {
                      setStartDate("");
                      setEndDate("");
                    }}
                    className="p-1.5 hover:bg-slate-100 border border-slate-200 rounded text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                    title="Clear Date Filters"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="w-full sm:w-auto flex justify-end shrink-0">
            <button
              onClick={handleExportCSV}
              disabled={filteredTransactions.length === 0}
              title={filteredTransactions.length === 0 ? "No transactions to export" : "Export CSV Report"}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-bold uppercase tracking-wider rounded shadow-sm border transition-all cursor-pointer ${
                filteredTransactions.length === 0
                  ? "bg-slate-50 text-slate-300 border-slate-100 cursor-not-allowed"
                  : "bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 hover:border-indigo-700 active:scale-95"
              }`}
              id="export-csv-btn"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({filteredTransactions.length})</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Total Income Card */}
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Deposit</p>
            <p className="text-2xl font-black text-slate-900 font-mono">
              ₹{stats.totalIncome.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="mt-2 text-[10px] text-emerald-600 font-bold flex items-center gap-1">
            <ArrowUpRight className="w-3.5 h-3.5" /> {searchQuery ? "Filtered Total" : "12% vs last month"}
          </div>
        </div>

        {/* Total Expense Card */}
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Total Expense</p>
            <p className="text-2xl font-black text-rose-500 font-mono">
              ₹{stats.totalExpense.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold flex items-center gap-1">
            <span>{((stats.totalExpense / (stats.totalIncome || 1)) * 100).toFixed(0)}% of revenue</span>
          </div>
        </div>

        {/* Pending Vouchers Card */}
        <div className="bg-white border border-slate-200 p-4 rounded shadow-sm flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Pending Vouchers</p>
            <p className="text-2xl font-black text-amber-500 font-mono">
              {stats.isDemo ? 14 : Math.ceil(stats.filteredDataCount * 0.15)}
            </p>
          </div>
          <div className="mt-2 text-[10px] text-slate-400 font-bold">
            Requires manager approval
          </div>
        </div>

        {/* Net Balance Card */}
        <div className="bg-indigo-900 border border-indigo-800 p-4 rounded text-white shadow-md flex flex-col justify-between">
          <div>
            <p className="text-[10px] font-bold text-indigo-300 uppercase tracking-widest mb-1">Net Balance</p>
            <p className="text-2xl font-black font-mono">
              ₹{stats.netBalance.toLocaleString("en-IN", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}
            </p>
          </div>
          <div className="mt-2 text-[10px] text-indigo-300 font-bold">
            Updated just now
          </div>
        </div>

      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Department Progress Card */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between min-h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Top Expenses by Department</h3>
            <div className="flex gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full bg-indigo-500"></div>
              <div className="w-2.5 h-2.5 rounded-full bg-slate-200"></div>
            </div>
          </div>
          
          <div className="flex-1 flex flex-col justify-center space-y-4">
            {stats.departmentExpenses.length === 0 ? (
              <div className="text-center py-6 text-slate-400 text-xs italic">
                No expense data matches your filters.
              </div>
            ) : (
              stats.departmentExpenses.map((dept, idx) => {
                const maxVal = Math.max(...stats.departmentExpenses.map(d => d.value)) || 1;
                const widthPct = (dept.value / maxVal) * 100;
                return (
                  <div key={idx} className="space-y-1">
                    <div className="flex justify-between text-[11px] font-bold">
                      <span className="text-slate-600">{dept.name}</span>
                      <span className="text-slate-900 font-mono">₹{dept.value.toLocaleString("en-IN")}</span>
                    </div>
                    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                        style={{ width: `${widthPct}%` }}
                      />
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Historical/Monthly Trend */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between min-h-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Monthly Cashflow Trend</h3>
            <span className="text-[10px] font-bold bg-slate-100 text-slate-600 rounded px-2.5 py-1 uppercase tracking-wider font-mono">
              {searchQuery ? "FILTERED TREND" : "LAST 6 MONTHS"}
            </span>
          </div>
          
          <div className="flex-1 w-full h-[220px]">
            {stats.monthlyTrend.length === 0 ? (
              <div className="flex items-center justify-center h-full text-slate-400 text-xs italic">
                No monthly cashflow matches your filters.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyTrend} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="month" tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: "white", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "10px", fontFamily: "monospace" }}
                    formatter={(value: any) => [`₹${parseFloat(value).toLocaleString("en-IN")}`]}
                  />
                  <Legend wrapperStyle={{ fontSize: "10px", fontWeight: "bold" }} />
                  <Bar dataKey="income" name="Deposits" fill="#34d399" radius={[2, 2, 0, 0]} />
                  <Bar dataKey="expense" name="Expenses" fill="#f87171" radius={[2, 2, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Additional Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Category Expense Distribution (Pie Chart) */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between min-h-[320px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Expense Distribution by Category</h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded px-2.5 py-1 uppercase tracking-wider font-mono">
              Category Breakdown
            </span>
          </div>
          
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
            {stats.categoryExpenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic w-full">
                No expense categories to show.
              </div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.categoryExpenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.categoryExpenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "white", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "10px", fontFamily: "monospace" }}
                        formatter={(value: any) => [`₹${parseFloat(value).toLocaleString("en-IN")}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-2">
                  {stats.categoryExpenses.map((entry, index) => {
                    const totalVal = stats.categoryExpenses.reduce((sum, item) => sum + item.value, 0) || 1;
                    const percentage = ((entry.value / totalVal) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 max-w-[65%] truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[index % PIE_COLORS.length] }} />
                          <span className="text-slate-600 font-medium truncate" title={entry.name}>{entry.name}</span>
                        </div>
                        <div className="text-right font-mono text-slate-900 font-bold">
                          ₹{entry.value.toLocaleString("en-IN")} <span className="text-slate-400 text-[9px] font-normal">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Spending Employees */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between min-h-[320px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Top Spenders (Employee Outlay)</h3>
            <span className="text-[10px] font-bold bg-indigo-50 text-indigo-700 rounded px-2.5 py-1 uppercase tracking-wider font-mono">
              Employee Share
            </span>
          </div>
          
          <div className="flex-1 w-full h-[220px] flex flex-col justify-center">
            {stats.employeeExpenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic w-full">
                No employee expense data to show.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.employeeExpenses}
                  layout="vertical"
                  margin={{ top: 10, right: 20, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis type="number" tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis dataKey="name" type="category" tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} width={80} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "white", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "10px", fontFamily: "monospace" }}
                    formatter={(value: any) => [`₹${parseFloat(value).toLocaleString("en-IN")}`]}
                  />
                  <Bar dataKey="value" name="Total Spent" fill="#6366f1" radius={[0, 4, 4, 0]}>
                    {stats.employeeExpenses.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[index % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* New Visualizations Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Payment Method Distribution Chart */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between min-h-[320px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Payment Method Distribution</h3>
            <span className="text-[10px] font-bold bg-[#006b35]/10 text-[#006b35] rounded px-2.5 py-1 uppercase tracking-wider font-mono">
              Funds Outflow Matrix
            </span>
          </div>
          
          <div className="flex-1 flex flex-col sm:flex-row items-center justify-between gap-4">
            {stats.paymentMethodExpenses.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic w-full">
                No payment method data available.
              </div>
            ) : (
              <>
                <div className="w-full sm:w-1/2 h-[180px] flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={stats.paymentMethodExpenses}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        paddingAngle={3}
                        dataKey="value"
                      >
                        {stats.paymentMethodExpenses.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[(index + 2) % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ backgroundColor: "white", borderRadius: "4px", border: "1px solid #cbd5e1", fontSize: "10px", fontFamily: "monospace" }}
                        formatter={(value: any) => [`₹${parseFloat(value).toLocaleString("en-IN")}`]}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-full sm:w-1/2 flex flex-col justify-center space-y-2">
                  {stats.paymentMethodExpenses.map((entry, index) => {
                    const totalVal = stats.paymentMethodExpenses.reduce((sum, item) => sum + item.value, 0) || 1;
                    const percentage = ((entry.value / totalVal) * 100).toFixed(1);
                    return (
                      <div key={index} className="flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 max-w-[65%] truncate">
                          <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: PIE_COLORS[(index + 2) % PIE_COLORS.length] }} />
                          <span className="text-slate-600 font-medium truncate" title={entry.name}>{entry.name}</span>
                        </div>
                        <div className="text-right font-mono text-slate-900 font-bold">
                          ₹{entry.value.toLocaleString("en-IN")} <span className="text-slate-400 text-[9px] font-normal">({percentage}%)</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Top Expenses by Category (Peak Outlays) */}
        <div className="bg-white border border-slate-200 rounded p-5 flex flex-col justify-between min-h-[320px]">
          <div className="flex justify-between items-center mb-4 border-b border-slate-100 pb-2">
            <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider">Top Single Expenses by Category (Peak Outlays)</h3>
            <span className="text-[10px] font-bold bg-[#006b35]/10 text-[#006b35] rounded px-2.5 py-1 uppercase tracking-wider font-mono">
              Peak Transaction Size
            </span>
          </div>
          
          <div className="flex-1 w-full h-[220px] flex flex-col justify-center">
            {stats.topSingleExpensesByCategory.length === 0 ? (
              <div className="text-center py-12 text-slate-400 text-xs italic w-full">
                No single category expenses to show.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={stats.topSingleExpensesByCategory}
                  margin={{ top: 15, right: 10, left: -5, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="category" tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#64748b", fontWeight: "bold" }} axisLine={false} tickLine={false} />
                  <Tooltip
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div className="bg-white border border-slate-200 p-3 rounded shadow-lg text-[10px] space-y-1 font-sans">
                            <p className="font-bold text-slate-800 uppercase tracking-wide">{data.category}</p>
                            <p className="font-mono text-indigo-600 font-extrabold text-xs">₹{data.amount.toLocaleString("en-IN")}</p>
                            <div className="text-slate-500 space-y-0.5 border-t border-slate-100 pt-1 font-medium">
                              <p>Voucher: <span className="font-mono text-slate-700">{data.voucherNo}</span></p>
                              <p>Payee: <span className="text-slate-700">{data.employeeName}</span></p>
                              <p>Vendor: <span className="text-slate-700">{data.vendorName}</span></p>
                              <p>Date: <span className="font-mono text-slate-700">{data.date}</span></p>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="amount" name="Peak Expense" fill="#006b35" radius={[4, 4, 0, 0]}>
                    {stats.topSingleExpensesByCategory.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={BAR_COLORS[(index + 1) % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

      </div>

      {/* Bottom Data Table with Filters */}
      <div className="bg-white border border-slate-200 rounded shadow-sm mt-6 overflow-hidden">
        {/* Table Header Controls */}
        <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-slate-700 uppercase tracking-wider flex items-center gap-1.5">
                <SlidersHorizontal className="w-4 h-4 text-indigo-600" />
                <span>Transaction Ledger Table</span>
              </h3>
              <p className="text-[10px] text-slate-400 font-medium">
                Detailed transaction records with customizable columns and local filters.
              </p>
            </div>
            
            {/* Quick Summary Pill */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-wider bg-indigo-50 border border-indigo-100 text-indigo-700 px-2.5 py-1 rounded font-mono">
                {tableFilteredTransactions.length} of {filteredTransactions.length} Records Shown
              </span>
              <button
                onClick={() => {
                  setLocalCategory("All");
                  setLocalMethod("All");
                  setLocalDept("All");
                  setLocalType("All");
                  setLocalSearch("");
                  setCurrentPage(1);
                }}
                className="text-[10px] font-bold text-slate-500 hover:text-slate-800 transition-colors uppercase flex items-center gap-1 border border-slate-200 bg-white px-2.5 py-1 rounded cursor-pointer shadow-sm"
              >
                Reset Table Filters
              </button>
            </div>
          </div>

          {/* Filters Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
            {/* Local Search */}
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-2.5 pointer-events-none text-slate-400">
                <Search className="w-3.5 h-3.5" />
              </span>
              <input
                type="text"
                placeholder="Table search..."
                value={localSearch}
                onChange={(e) => {
                  setLocalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-8 pr-3 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-medium placeholder-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              />
            </div>

            {/* Type Selector */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Type:</span>
              <select
                value={localType}
                onChange={(e) => {
                  setLocalType(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Transactions</option>
                <option value="Expenses">Only Expenses</option>
                <option value="Deposits">Only Deposits</option>
              </select>
            </div>

            {/* Category Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Cat:</span>
              <select
                value={localCategory}
                onChange={(e) => {
                  setLocalCategory(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Categories</option>
                {uniqueCategories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            {/* Method Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Method:</span>
              <select
                value={localMethod}
                onChange={(e) => {
                  setLocalMethod(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Methods</option>
                {uniqueMethods.map(method => (
                  <option key={method} value={method}>{method}</option>
                ))}
              </select>
            </div>

            {/* Department Dropdown */}
            <div className="flex items-center gap-1">
              <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">Dept:</span>
              <select
                value={localDept}
                onChange={(e) => {
                  setLocalDept(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full px-2 py-1.5 bg-white border border-slate-200 rounded text-[11px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
              >
                <option value="All">All Depts</option>
                {uniqueDepartments.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* The Table Layout */}
        <div className="overflow-x-auto">
          {paginatedTransactions.length === 0 ? (
            <div className="text-center py-16 text-slate-400 text-xs space-y-2">
              <AlertCircle className="w-8 h-8 text-slate-300 mx-auto" />
              <p className="font-bold text-slate-500 uppercase tracking-wider">No matching transactions in this table</p>
              <p className="text-[10px]">Try clearing or adjusting the dropdown filters or table search terms.</p>
            </div>
          ) : (
            <table className="w-full text-left border-collapse border-b border-slate-100">
              <thead>
                <tr className="text-[10px] text-white bg-[#0F172B] uppercase h-10 font-black">
                  <th className="pl-5 pr-3 font-bold">Date</th>
                  <th className="px-3 font-bold">Voucher No</th>
                  <th className="px-3 font-bold">Payee / Employee</th>
                  <th className="px-3 font-bold">Category</th>
                  <th className="px-3 font-bold">Department</th>
                  <th className="px-3 font-bold">Method</th>
                  <th className="px-3 font-bold">Vendor / Remarks</th>
                  <th className="px-3 font-bold">Files</th>
                  <th className="px-3 font-bold text-right">Amount</th>
                  <th className="pr-5 pl-3 font-bold text-center">Actions</th>
                </tr>
              </thead>
              <tbody className="text-xs text-slate-700 divide-y divide-slate-100">
                {paginatedTransactions.map((tx, idx) => {
                  const isExpense = (parseFloat(String(tx.expenseAmount)) || 0) > 0;
                  const amt = isExpense ? tx.expenseAmount : tx.depositedAmount;
                  return (
                    <tr key={idx} className="hover:bg-indigo-50/70 transition-colors duration-200 h-11">
                      {/* Date */}
                      <td className="pl-5 pr-3 font-mono text-slate-500 font-semibold">
                        {formatShortDate(tx.dateOfExpense)}
                      </td>
                      {/* Voucher */}
                      <td className="px-3 font-mono font-bold text-slate-900">
                        {tx.voucherNo || <span className="text-slate-300 italic">N/A</span>}
                      </td>
                      {/* Employee */}
                      <td className="px-3 font-semibold text-slate-700 truncate max-w-[140px]">
                        {tx.employeeName || <span className="text-slate-300 italic">Self / System</span>}
                      </td>
                      {/* Category */}
                      <td className="px-3">
                        {tx.category ? (
                          <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-bold uppercase tracking-wider">
                            {tx.category}
                          </span>
                        ) : (
                          <span className="text-slate-300">—</span>
                        )}
                      </td>
                      {/* Department */}
                      <td className="px-3 font-semibold text-slate-600 uppercase text-[10px]">
                        {tx.department || <span className="text-slate-300 italic">—</span>}
                      </td>
                      {/* Payment Method */}
                      <td className="px-3 font-mono text-[10px] uppercase font-bold text-slate-500">
                        {tx.paymentMethod || <span className="text-slate-300">—</span>}
                      </td>
                      {/* Vendor & Remarks */}
                      <td className="px-3 truncate max-w-[200px]" title={tx.voucherRemarks}>
                        <div className="text-slate-800 font-medium truncate">
                          {tx.vendorName || <span className="text-slate-300 italic">No Vendor</span>}
                        </div>
                        {tx.voucherRemarks && (
                          <div className="text-[10px] text-slate-400 truncate">
                            {tx.voucherRemarks}
                          </div>
                        )}
                      </td>
                      {/* Attachment Links */}
                      <td className="px-3">
                        <div className="flex items-center gap-1">
                          {tx.billImage ? (
                            <a 
                              href={tx.billImage.startsWith("data:") ? "#" : tx.billImage} 
                              target={tx.billImage.startsWith("data:") ? undefined : "_blank"} 
                              rel="noreferrer"
                              title="View Bill"
                              className={`p-1 rounded transition-all flex items-center justify-center ${tx.billImage.startsWith("data:") ? "text-slate-300 cursor-not-allowed bg-slate-100" : "text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 bg-indigo-50/50"}`}
                              onClick={(e) => {
                                if (tx.billImage?.startsWith("data:")) {
                                  e.preventDefault();
                                  alert("Offline image is a Base64 string locally. Once synced to Sheets, this will become a clickable Drive URL.");
                                }
                              }}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          {tx.receiptImage ? (
                            <a 
                              href={tx.receiptImage.startsWith("data:") ? "#" : tx.receiptImage} 
                              target={tx.receiptImage.startsWith("data:") ? undefined : "_blank"} 
                              rel="noreferrer"
                              title="View Receipt"
                              className={`p-1 rounded transition-all flex items-center justify-center ${tx.receiptImage.startsWith("data:") ? "text-slate-300 cursor-not-allowed bg-slate-100" : "text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 bg-emerald-50/50"}`}
                              onClick={(e) => {
                                if (tx.receiptImage?.startsWith("data:")) {
                                  e.preventDefault();
                                  alert("Offline image is a Base64 string locally. Once synced to Sheets, this will become a clickable Drive URL.");
                                }
                              }}
                            >
                              <FileText className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          {tx.itemImage ? (
                            <a 
                              href={tx.itemImage.startsWith("data:") ? "#" : tx.itemImage} 
                              target={tx.itemImage.startsWith("data:") ? undefined : "_blank"} 
                              rel="noreferrer"
                              title="View Item"
                              className={`p-1 rounded transition-all flex items-center justify-center ${tx.itemImage.startsWith("data:") ? "text-slate-300 cursor-not-allowed bg-slate-100" : "text-amber-600 hover:text-amber-700 hover:bg-amber-50 bg-amber-50/50"}`}
                              onClick={(e) => {
                                if (tx.itemImage?.startsWith("data:")) {
                                  e.preventDefault();
                                  alert("Offline image is a Base64 string locally. Once synced to Sheets, this will become a clickable Drive URL.");
                                }
                              }}
                            >
                              <ImageIcon className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          {tx.securityStampImage ? (
                            <a 
                              href={tx.securityStampImage.startsWith("data:") ? "#" : tx.securityStampImage} 
                              target={tx.securityStampImage.startsWith("data:") ? undefined : "_blank"} 
                              rel="noreferrer"
                              title="View Security Stamp"
                              className={`p-1 rounded transition-all flex items-center justify-center ${tx.securityStampImage.startsWith("data:") ? "text-slate-300 cursor-not-allowed bg-slate-100" : "text-rose-600 hover:text-rose-700 hover:bg-rose-50 bg-rose-50/50"}`}
                              onClick={(e) => {
                                if (tx.securityStampImage?.startsWith("data:")) {
                                  e.preventDefault();
                                  alert("Offline image is a Base64 string locally. Once synced to Sheets, this will become a clickable Drive URL.");
                                }
                              }}
                            >
                              <Check className="w-3.5 h-3.5" />
                            </a>
                          ) : null}
                          {!tx.billImage && !tx.receiptImage && !tx.itemImage && !tx.securityStampImage && (
                            <span className="text-[10px] text-slate-300 italic">-</span>
                          )}
                        </div>
                      </td>
                      {/* Amount */}
                      <td className={`px-3 text-right font-black font-mono text-xs ${isExpense ? "text-rose-500" : "text-emerald-600"}`}>
                        {isExpense ? "-" : "+"}₹{parseFloat(String(amt)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                      </td>
                      {/* Actions */}
                      <td className="pr-5 pl-3 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenView(tx)}
                            className="p-1 rounded hover:bg-slate-100 text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
                            title="View Record"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          {currentUser && (currentUser.role?.toLowerCase() === "admin" || currentUser.role?.toLowerCase() === "administrator" || canUserEdit(tx.dateOfExpense, false)) ? (
                            <button
                              onClick={() => handleOpenEdit(tx)}
                              className="p-1 rounded hover:bg-indigo-50 text-indigo-600 hover:text-indigo-800 transition-colors cursor-pointer"
                              title="Edit Record"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                          ) : (
                            <button
                              disabled
                              className="p-1 rounded text-slate-300 bg-slate-50 cursor-not-allowed"
                              title="Edit Locked (Allowed only same day or 1 day before)"
                            >
                              <Lock className="w-3.5 h-3.5" />
                            </button>
                          )}
                          {currentUser && (currentUser.role?.toLowerCase() === "admin" || currentUser.role?.toLowerCase() === "administrator") ? (
                            <button
                              onClick={() => handleOpenDelete(tx)}
                              className="p-1 rounded hover:bg-rose-50 text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                              title="Delete Record"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          ) : null}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* Pagination Footer */}
        {tableFilteredTransactions.length > 0 && (
          <div className="px-5 py-4 border-t border-slate-150 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-50/30">
            <div className="text-[11px] text-slate-500 font-medium">
              Showing <span className="font-bold text-slate-800">{Math.min(tableFilteredTransactions.length, (safeCurrentPage - 1) * itemsPerPage + 1)}</span> to{" "}
              <span className="font-bold text-slate-800">{Math.min(tableFilteredTransactions.length, safeCurrentPage * itemsPerPage)}</span> of{" "}
              <span className="font-bold text-slate-800">{tableFilteredTransactions.length}</span> entries
            </div>

            <div className="flex items-center gap-4">
              {/* Rows Per Page */}
              <div className="flex items-center gap-1.5">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Show:</span>
                <select
                  value={itemsPerPage}
                  onChange={(e) => {
                    setItemsPerPage(Number(e.target.value));
                    setCurrentPage(1);
                  }}
                  className="px-2 py-1 bg-white border border-slate-200 rounded text-[10px] font-bold text-slate-700 focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                >
                  <option value={10}>10 rows</option>
                  <option value={20}>20 rows</option>
                  <option value={50}>50 rows</option>
                </select>
              </div>

              {/* Prev/Next buttons */}
              <div className="flex items-center gap-1">
                <button
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={safeCurrentPage === 1}
                  className={`p-1.5 rounded border transition-colors flex items-center justify-center ${
                    safeCurrentPage === 1
                      ? "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 cursor-pointer"
                  }`}
                  title="Previous Page"
                >
                  <ChevronLeft className="w-3.5 h-3.5" />
                </button>
                <div className="text-[11px] font-bold font-mono text-slate-700 bg-white border border-slate-200 px-3 py-1 rounded min-w-[50px] text-center">
                  {safeCurrentPage} / {totalPages}
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={safeCurrentPage === totalPages}
                  className={`p-1.5 rounded border transition-colors flex items-center justify-center ${
                    safeCurrentPage === totalPages
                      ? "text-slate-300 bg-slate-50 border-slate-100 cursor-not-allowed"
                      : "text-slate-600 hover:text-slate-900 hover:bg-slate-100 border-slate-200 cursor-pointer"
                  }`}
                  title="Next Page"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* VIEW DETAILS MODAL */}
      {isViewOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-2xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded">
                  <FileText className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black text-slate-800 uppercase tracking-wider">Transaction Detail: {selectedTx.voucherNo}</h4>
                  <p className="text-[10px] text-slate-400 font-mono">Date: {formatShortDate(selectedTx.dateOfExpense)}</p>
                </div>
              </div>
              <button
                onClick={() => {
                  setIsViewOpen(false);
                  setSelectedTx(null);
                }}
                className="p-1.5 hover:bg-slate-200 rounded text-slate-400 hover:text-slate-600 cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Body (Scrollable) */}
            <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-700">
              {/* Core Metadata Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">UTR / Ref Number</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{selectedTx.utrNumber || <i className="text-slate-300">N/A</i>}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Employee / Payee</span>
                  <span className="font-bold text-slate-800">{selectedTx.employeeName || "System / Self"}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</span>
                  <span className="font-bold text-slate-800 uppercase">{selectedTx.department || "General"}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Category</span>
                  <span className="px-2 py-0.5 bg-indigo-50 border border-indigo-100 text-indigo-700 rounded text-[9px] font-extrabold uppercase tracking-wider inline-block mt-0.5">
                    {selectedTx.category || "General"}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Payment Method</span>
                  <span className="font-bold text-slate-800 uppercase font-mono">{selectedTx.paymentMethod || "Cash"}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">GST Type</span>
                  <span className="font-bold text-slate-800 font-mono">{selectedTx.gst || "0%"}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Expense Amount</span>
                  <span className="font-bold font-mono text-rose-500 text-sm">
                    ₹{(selectedTx.expenseAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Deposited Amount</span>
                  <span className="font-bold font-mono text-emerald-600 text-sm">
                    ₹{(selectedTx.depositedAmount || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Authorised By</span>
                  <span className="font-bold text-indigo-700">{selectedTx.authorisedBy || "Pending"}</span>
                </div>
              </div>

              {/* Additional Metadata */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 border-b border-slate-100 pb-5">
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Vendor / Beneficiary</span>
                  <span className="font-bold text-slate-800 block text-xs">{selectedTx.vendorName || <i className="text-slate-300">No Vendor</i>}</span>
                </div>
                <div>
                  <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">System Operator</span>
                  <span className="text-slate-600 block">{selectedTx.operatorName || "System Auto"}</span>
                </div>
              </div>

              {/* Remarks */}
              <div>
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider mb-1">Remarks &amp; Particulars</span>
                <div className="bg-slate-50 border border-slate-150 p-3 rounded font-medium text-slate-600 leading-relaxed max-h-24 overflow-y-auto">
                  {selectedTx.voucherRemarks || <i className="text-slate-300">No remarks provided.</i>}
                </div>
              </div>

              {/* Attached Files & Images */}
              <div className="space-y-2">
                <span className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Attached Vouchers &amp; Proofs</span>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: "Uploaded Bill", img: selectedTx.billImage, color: "border-indigo-150 bg-indigo-50/10 text-indigo-700" },
                    { label: "Payment Receipt", img: selectedTx.receiptImage, color: "border-emerald-150 bg-emerald-50/10 text-emerald-700" },
                    { label: "Uploaded Item", img: selectedTx.itemImage, color: "border-amber-150 bg-amber-50/10 text-amber-700" },
                    { label: "Security Stamp", img: selectedTx.securityStampImage, color: "border-rose-150 bg-rose-50/10 text-rose-700" }
                  ].map((item, idx) => {
                    if (!item.img) return null;
                    const isBase64 = item.img.startsWith("data:");
                    return (
                      <div key={idx} className={`border rounded p-2 text-center space-y-1.5 flex flex-col items-center justify-between ${item.color}`}>
                        <span className="text-[9px] font-black uppercase tracking-wider leading-none block h-5 flex items-center justify-center">{item.label}</span>
                        <div className="w-20 h-20 border border-slate-200 bg-white rounded overflow-hidden shadow-sm shrink-0">
                          <img src={item.img} alt={item.label} className="w-full h-full object-cover" />
                        </div>
                        {!isBase64 ? (
                          <a
                            href={item.img}
                            target="_blank"
                            rel="noreferrer"
                            className="text-[9px] font-bold underline hover:opacity-80 block"
                          >
                            Open Link
                          </a>
                        ) : (
                          <span className="text-[8px] text-slate-400 block italic">Local Offline</span>
                        )}
                      </div>
                    );
                  })}
                </div>
                {!selectedTx.billImage && !selectedTx.receiptImage && !selectedTx.itemImage && !selectedTx.securityStampImage && (
                  <div className="text-center py-4 bg-slate-50 border border-slate-100 rounded text-slate-400 italic">No attachments for this voucher.</div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end bg-slate-50">
              <button
                onClick={() => {
                  setIsViewOpen(false);
                  setSelectedTx(null);
                }}
                className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-700 text-xs font-bold rounded cursor-pointer uppercase tracking-wider transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* EDIT DETAILS MODAL */}
      {isEditOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-white rounded-lg border border-slate-200 shadow-2xl max-w-3xl w-full max-h-[90vh] flex flex-col relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-indigo-900 text-white">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-800 text-white border border-indigo-700 rounded">
                  <Edit2 className="w-4 h-4" />
                </span>
                <div>
                  <h4 className="text-xs font-black uppercase tracking-wider">Modify Record: {editForm.voucherNo}</h4>
                  <p className="text-[10px] text-indigo-200 font-mono">Form Fields Modification Area</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsEditOpen(false);
                  setSelectedTx(null);
                }}
                disabled={isActionSubmitting}
                className="p-1.5 hover:bg-indigo-800 rounded text-indigo-300 hover:text-white cursor-pointer transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSaveEdit} className="flex-1 flex flex-col overflow-hidden">
              <div className="p-6 overflow-y-auto space-y-4 text-xs text-slate-700">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Date Of Expense */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date of Expense *</label>
                    <input
                      type="date"
                      required
                      value={editForm.dateOfExpense}
                      onChange={(e) => setEditForm({ ...editForm, dateOfExpense: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                    />
                  </div>

                  {/* Employee / Payee Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Employee / Payee *</label>
                    <select
                      value={isEditOtherEmployee ? "Others" : editForm.employeeName}
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === "Others") {
                          setIsEditOtherEmployee(true);
                          setEditCustomEmployeeName("");
                          setEditForm({ ...editForm, employeeName: "" });
                        } else {
                          setIsEditOtherEmployee(false);
                          setEditCustomEmployeeName("");
                          setEditForm({ ...editForm, employeeName: val });
                        }
                      }}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold cursor-pointer"
                    >
                      <option value="">-- Choose Employee --</option>
                      {(settings?.employees || []).map((emp: string) => (
                        <option key={emp} value={emp}>{emp}</option>
                      ))}
                      <option value="Others">Others</option>
                    </select>

                    {isEditOtherEmployee && (
                      <div className="mt-2 bg-indigo-50/20 p-2 rounded border border-indigo-100">
                        <label className="block text-[9px] font-bold text-indigo-600 uppercase tracking-widest mb-1">Enter Name Manually *</label>
                        <input
                          type="text"
                          required
                          value={editCustomEmployeeName}
                          onChange={(e) => {
                            const val = e.target.value;
                            setEditCustomEmployeeName(val);
                            setEditForm({ ...editForm, employeeName: val });
                          }}
                          placeholder="Type name here..."
                          className="w-full px-2.5 py-1.5 rounded border border-indigo-200 focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs bg-white font-semibold"
                        />
                      </div>
                    )}
                  </div>

                  {/* Department */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department *</label>
                    <select
                      value={editForm.department}
                      onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold cursor-pointer"
                    >
                      <option value="">-- Choose Department --</option>
                      {(settings?.departments || uniqueDepartments).map((dept: string) => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Category */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category *</label>
                    <select
                      value={editForm.category}
                      onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold cursor-pointer"
                    >
                      <option value="">-- Choose Category --</option>
                      {(settings?.categories || uniqueCategories).map((cat: string) => (
                        <option key={cat} value={cat}>{cat}</option>
                      ))}
                    </select>
                  </div>

                  {/* Payment Method */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payment Method *</label>
                    <select
                      value={editForm.paymentMethod}
                      onChange={(e) => setEditForm({ ...editForm, paymentMethod: e.target.value })}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold cursor-pointer"
                    >
                      <option value="">-- Choose Method --</option>
                      {(settings?.paymentMethods || uniqueMethods).map((method: string) => (
                        <option key={method} value={method}>{method}</option>
                      ))}
                    </select>
                  </div>

                  {/* GST */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">GST *</label>
                    <select
                      value={editForm.gst}
                      onChange={(e) => setEditForm({ ...editForm, gst: e.target.value })}
                      required
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold cursor-pointer"
                    >
                      {(settings?.gstOptions || ["0%", "5%", "12%", "18%", "28%"]).map((opt: string) => (
                        <option key={opt} value={opt}>{opt}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Expense Amount */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Expense Amount (INR)</label>
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={editForm.expenseAmount || ""}
                      onChange={(e) => setEditForm({ ...editForm, expenseAmount: parseFloat(e.target.value) || 0 })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold font-mono"
                      placeholder="0.00"
                    />
                  </div>

                  {/* UTR / Ref Number */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">UTR / Ref Number</label>
                    <input
                      type="text"
                      value={editForm.utrNumber}
                      onChange={(e) => setEditForm({ ...editForm, utrNumber: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-bold font-mono"
                      placeholder="UPI or Transaction ID"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Vendor Name */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Vendor / Beneficiary Name</label>
                    <input
                      type="text"
                      value={editForm.vendorName}
                      onChange={(e) => setEditForm({ ...editForm, vendorName: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                      placeholder="e.g. Amazon India"
                    />
                  </div>

                  {/* Authorised By */}
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Authorised By</label>
                    <input
                      type="text"
                      value={editForm.authorisedBy}
                      onChange={(e) => setEditForm({ ...editForm, authorisedBy: e.target.value })}
                      className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-semibold"
                      placeholder="e.g. General Manager"
                    />
                  </div>
                </div>

                {/* Remarks */}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Voucher Remarks</label>
                  <textarea
                    value={editForm.voucherRemarks}
                    onChange={(e) => setEditForm({ ...editForm, voucherRemarks: e.target.value })}
                    className="w-full p-2.5 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-1 focus:ring-indigo-500 text-xs font-medium"
                    rows={2}
                    placeholder="Enter purpose details..."
                  />
                </div>

                {/* Proof Attachments */}
                <div className="space-y-2 border-t border-slate-100 pt-3">
                  <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Proof Attachments (Max 1.5MB per image)</span>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {[
                      { label: "Bill Proof", key: "billImage" },
                      { label: "Payment Receipt", key: "receiptImage" },
                      { label: "Item Image", key: "itemImage" },
                      { label: "Security Clearance Stamp", key: "securityStampImage" }
                    ].map((field) => {
                      const imgValue = (editForm as any)[field.key];
                      return (
                        <div key={field.key} className="border border-slate-150 p-2 rounded bg-slate-50/50 flex flex-col justify-between h-28 space-y-2">
                          <span className="text-[8px] font-bold uppercase text-slate-400 block tracking-wide">{field.label}</span>
                          {imgValue ? (
                            <div className="flex-1 flex items-center justify-between gap-1.5 border border-slate-200 rounded p-1 bg-white">
                              <img src={imgValue} alt={field.label} className="w-10 h-10 object-cover rounded border border-slate-200 shrink-0" />
                              <button
                                type="button"
                                onClick={() => setEditForm({ ...editForm, [field.key]: "" })}
                                className="p-1 hover:bg-rose-50 rounded text-slate-400 hover:text-rose-600 transition-colors cursor-pointer"
                                title="Remove Image"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <label className="flex-1 flex flex-col items-center justify-center border border-dashed border-slate-300 hover:border-indigo-500 rounded cursor-pointer hover:bg-slate-50 text-slate-400 hover:text-indigo-600 transition-all text-center">
                              <Upload className="w-3.5 h-3.5" />
                              <span className="text-[8px] font-bold uppercase mt-1">Select</span>
                              <input
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={async (e) => {
                                  if (e.target.files && e.target.files[0]) {
                                    const file = e.target.files[0];
                                    if (file.size > 1.5 * 1024 * 1024) {
                                      alert("File too large. Choose an image under 1.5MB.");
                                      return;
                                    }
                                    try {
                                      const base64 = await new Promise<string>((resolve, reject) => {
                                        const rdr = new FileReader();
                                        rdr.readAsDataURL(file);
                                        rdr.onload = () => resolve(rdr.result as string);
                                        rdr.onerror = (err) => reject(err);
                                      });
                                      setEditForm({ ...editForm, [field.key]: base64 });
                                    } catch (err) {
                                      console.error(err);
                                    }
                                  }
                                }}
                              />
                            </label>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Footer Controls */}
              <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
                <button
                  type="button"
                  onClick={() => {
                    setIsEditOpen(false);
                    setSelectedTx(null);
                  }}
                  disabled={isActionSubmitting}
                  className="px-4 py-2 bg-slate-200 hover:bg-slate-300 disabled:opacity-50 text-slate-700 text-xs font-bold rounded cursor-pointer uppercase tracking-wider transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isActionSubmitting}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-xs font-bold rounded cursor-pointer uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
                >
                  {isActionSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Updating Sheets...</span>
                    </>
                  ) : (
                    <>
                      <Save className="w-3.5 h-3.5" />
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* DELETE CONFIRMATION MODAL */}
      {isDeleteOpen && selectedTx && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <div className="bg-white rounded border border-slate-200 shadow-2xl max-w-sm w-full relative overflow-hidden">
            {/* Header */}
            <div className="p-4 border-b border-slate-100 bg-rose-50 text-rose-800 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0" />
              <h4 className="text-xs font-black uppercase tracking-wider">Confirm Record Deletion</h4>
            </div>

            {/* Body */}
            <div className="p-5 text-xs text-slate-700 space-y-3 leading-relaxed">
              <p>Are you sure you want to permanently delete record <b className="font-mono text-slate-900 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200 text-[11px]">{selectedTx.voucherNo}</b>?</p>
              <div className="p-3 bg-rose-50/50 border border-rose-100 rounded text-rose-800 font-medium">
                This transaction represents an outlay of <b className="font-mono">₹{(selectedTx.expenseAmount || selectedTx.depositedAmount).toLocaleString("en-IN")}</b> and will be removed from your Google Sheet entirely. This operation cannot be undone.
              </div>
            </div>

            {/* Footer */}
            <div className="p-4 border-t border-slate-100 flex justify-end gap-2 bg-slate-50">
              <button
                type="button"
                onClick={() => {
                  setIsDeleteOpen(false);
                  setSelectedTx(null);
                }}
                disabled={isActionSubmitting}
                className="px-3 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 text-[10px] font-bold rounded cursor-pointer uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={isActionSubmitting}
                className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 disabled:bg-rose-400 text-white text-[10px] font-bold rounded cursor-pointer uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
              >
                {isActionSubmitting ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Permanently</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
