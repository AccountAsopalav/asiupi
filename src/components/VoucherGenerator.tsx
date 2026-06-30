import React, { useRef } from "react";
import { Printer, Download, Plus, Trash2, CheckCircle2, ShieldCheck } from "lucide-react";
import { motion } from "motion/react";
import logoUrl from "../assets/images/regenerated_image_1782548322739.png";
import asopalavLogoUrl from "../assets/images/regenerated_image_1782658387597.png";

interface VoucherGeneratorProps {
  initialData?: {
    voucherNo?: string;
    date?: string;
    employeeName?: string;
    particulars?: string;
    refBillDate?: string;
    staffPerson?: string;
    amount?: number;
    authorizedBy?: string;
    department?: string;
    category?: string;
  };
  onSaveVoucher?: (voucher: any) => void;
  nextVoucherNo: number;
  transactions?: any[];
}

// Helper functions to handle and format dates as DD-MM-YYYY
function normalizeDate(dateStr: any): string {
  if (!dateStr) return "";

  // If a real JavaScript Date object or has getMonth/getFullYear methods
  if (dateStr instanceof Date || (dateStr && typeof dateStr === "object" && typeof dateStr.getMonth === "function")) {
    try {
      const y = dateStr.getFullYear();
      const m = String(dateStr.getMonth() + 1).padStart(2, "0");
      const d = String(dateStr.getDate()).padStart(2, "0");
      return `${y}-${m}-${d}`;
    } catch (e) {
      // fallback
    }
  }

  let str = String(dateStr).trim();
  if (!str) return "";

  // If already YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return str;
  }

  // ISO string with T (e.g. 2026-06-28T08:30:19)
  // Ensure we only split if it is a valid date part preceding the T to avoid breaking GMT-0700
  if (str.includes("T") && /^\d{4}-\d{2}-\d{2}T/.test(str)) {
    const isoPart = str.split("T")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(isoPart)) {
      return isoPart;
    }
    str = isoPart;
  }

  // Space-separated with time (e.g. "2026-06-28 08:30:19")
  if (str.includes(" ")) {
    const spacePart = str.split(" ")[0];
    if (/^\d{4}-\d{2}-\d{2}$/.test(spacePart)) {
      return spacePart;
    }
    const tempNorm = normalizeDate(spacePart);
    if (/^\d{4}-\d{2}-\d{2}$/.test(tempNorm)) {
      return tempNorm;
    }
  }

  // Clean and split by common separators (hyphen, slash, space)
  const parts = str.replace(/[,/]/g, "-").replace(/\s+/g, "-").split("-").filter(Boolean);
  
  if (parts.length === 3) {
    let day = "";
    let month = "";
    let year = "";

    const months = ["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"];
    const fullMonths = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];

    // Helper to identify month index (0-11)
    const getMonthIndex = (s: string): number => {
      const lower = s.toLowerCase();
      let idx = months.indexOf(lower.slice(0, 3));
      if (idx === -1) {
        idx = fullMonths.indexOf(lower);
      }
      if (idx === -1) {
        const parsed = parseInt(s, 10);
        if (!isNaN(parsed) && parsed >= 1 && parsed <= 12) {
          return parsed - 1;
        }
      }
      return idx;
    };

    // Case 1: Year first (YYYY-MM-DD or YYYY-MMM-DD)
    if (parts[0].length === 4) {
      year = parts[0];
      const mIdx = getMonthIndex(parts[1]);
      if (mIdx !== -1) {
        month = String(mIdx + 1).padStart(2, "0");
        day = parts[2].replace(/\D/g, "");
      }
    } 
    // Case 2: Year last (DD-MM-YYYY or DD-MMM-YYYY)
    else if (parts[2].length === 4 || parts[2].length === 2) {
      let y = parts[2];
      if (y.length === 2) {
        const yNum = parseInt(y, 10);
        y = yNum > 50 ? `19${y}` : `20${y}`;
      }
      year = y;

      const mIdx = getMonthIndex(parts[1]);
      if (mIdx !== -1) {
        month = String(mIdx + 1).padStart(2, "0");
        day = parts[0].replace(/\D/g, "");
      } else {
        // Maybe Month is the first element, and Day is the second (e.g., MM-DD-YYYY)
        const firstMIdx = getMonthIndex(parts[0]);
        if (firstMIdx !== -1) {
          month = String(firstMIdx + 1).padStart(2, "0");
          day = parts[1].replace(/\D/g, "");
        }
      }
    }

    if (year && month && day) {
      return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
    }
  }

  // Fallback to JS Date parser
  try {
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      const y = parsed.getFullYear();
      const m = String(parsed.getMonth() + 1).padStart(2, '0');
      const d = String(parsed.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
    }
  } catch (e) {
    // Ignore
  }

  return str;
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
    
    let fullYear = year;
    if (year.length === 2) {
      fullYear = "20" + year;
    }
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${fullYear}`; // e.g., "11-06-2026"
  }
  return String(dateStr);
}

function formatVoucherDate(dateStr: string | undefined | null): string {
  if (!dateStr) return "";
  const normalized = normalizeDate(dateStr);
  if (!normalized) return String(dateStr);

  const parts = normalized.split("-");
  if (parts.length === 3) {
    const year = parts[0];
    const month = parts[1];
    const day = parts[2];

    let fullYear = year;
    if (year.length === 2) {
      fullYear = "20" + year;
    }
    return `${day.padStart(2, '0')}-${month.padStart(2, '0')}-${fullYear}`; // e.g., "11-06-2026"
  }
  return String(dateStr);
}


function formatDatesInText(text: string | undefined | null): string {
  if (!text) return "";
  let val = String(text);
  
  // 1. Match standard ISO dates or YYYY-MM-DD
  const yyyymmddRegex = /\b(\d{4})-(\d{2})-(\d{2})\b/g;
  val = val.replace(yyyymmddRegex, (match, y, m, d) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(m, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      const shortMonth = months[monthIndex];
      return `${d}-${shortMonth}-${y}`;
    }
    return match;
  });
  
  // 2. Match standard DD-MM-YYYY or DD/MM/YYYY
  const ddmmyyyyRegex = /\b(\d{1,2})[-/](\d{1,2})[-/](\d{4})\b/g;
  val = val.replace(ddmmyyyyRegex, (match, d, m, y) => {
    const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthIndex = parseInt(m, 10) - 1;
    if (monthIndex >= 0 && monthIndex < 12) {
      const shortMonth = months[monthIndex];
      return `${d.padStart(2, '0')}-${shortMonth}-${y}`;
    }
    return match;
  });

  return val;
}

// Function to convert numbers to Indian Rupees Words
function numberToRupeesWords(amount: number): string {
  if (amount === 0) return "Zero Rupees Only";
  
  const ones = ["", "One", "Two", "Three", "Four", "Five", "Six", "Seven", "Eight", "Nine", "Ten", "Eleven", "Twelve", "Thirteen", "Fourteen", "Fifteen", "Sixteen", "Seventeen", "Eighteen", "Nineteen"];
  const tens = ["", "", "Twenty", "Thirty", "Forty", "Fifty", "Sixty", "Seventy", "Eighty", "Ninety"];
  
  function convertLessThanOneThousand(n: number): string {
    if (n < 20) return ones[n];
    const tensPlace = Math.floor(n / 10);
    const onesPlace = n % 10;
    if (n < 100) return tens[tensPlace] + (onesPlace ? " " + ones[onesPlace] : "");
    
    const hundredsPlace = Math.floor(n / 100);
    const remainder = n % 100;
    return ones[hundredsPlace] + " Hundred" + (remainder ? " and " + convertLessThanOneThousand(remainder) : "");
  }

  let words = "";
  let remaining = Math.floor(amount);
  
  // Crores
  if (remaining >= 10000000) {
    const crores = Math.floor(remaining / 10000000);
    words += convertLessThanOneThousand(crores) + " Crore ";
    remaining %= 10000000;
  }
  
  // Lakhs
  if (remaining >= 100000) {
    const lakhs = Math.floor(remaining / 100000);
    words += convertLessThanOneThousand(lakhs) + " Lakh ";
    remaining %= 100000;
  }
  
  // Thousands
  if (remaining >= 1000) {
    const thousands = Math.floor(remaining / 1000);
    words += convertLessThanOneThousand(thousands) + " Thousand ";
    remaining %= 1000;
  }
  
  // Hundreds / Tens
  if (remaining > 0) {
    words += convertLessThanOneThousand(remaining);
  }
  
  return words.trim() + " Rupees Only";
}

export default function VoucherGenerator({ initialData, onSaveVoucher, nextVoucherNo, transactions }: VoucherGeneratorProps) {
  const [voucherNo, setVoucherNo] = React.useState(initialData?.voucherNo || `AP-${nextVoucherNo}`);
  const [date, setDate] = React.useState(() => {
    const raw = initialData?.date || new Date().toISOString().split("T")[0];
    const normalized = normalizeDate(raw);
    return /^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : new Date().toISOString().split("T")[0];
  });
  const [name, setName] = React.useState(initialData?.employeeName || "");
  const [authorizedBy, setAuthorizedBy] = React.useState(initialData?.authorizedBy || "");
  const [isCustomVoucher, setIsCustomVoucher] = React.useState(false);
  
  const [department, setDepartment] = React.useState(initialData?.department || "");
  const [category, setCategory] = React.useState(initialData?.category || "");
  const [remarks, setRemarks] = React.useState(initialData?.particulars || "");
  
  // Table rows in physical voucher
  const [rows, setRows] = React.useState<any[]>([
    {
      id: 1,
      particulars: initialData?.particulars || "",
      refBill: initialData?.refBillDate || "",
      staffPerson: initialData?.staffPerson || "",
      amount: initialData?.amount || 0
    }
  ]);

  // Extract unique voucher numbers from Google Sheets transactions
  const uniqueVouchers = React.useMemo(() => {
    const list = new Set<string>();
    
    // Always include current state/default voucher number as an option
    const defaultVNo = initialData?.voucherNo || `AP-${nextVoucherNo}`;
    if (defaultVNo) {
      list.add(defaultVNo.trim());
    }
    
    if (transactions && transactions.length > 0) {
      transactions.forEach(tx => {
        if (tx.voucherNo) {
          list.add(tx.voucherNo.trim());
        }
      });
    }
    
    return Array.from(list);
  }, [transactions, nextVoucherNo, initialData]);

  // Handle dropdown selection to automatically fetch and populate all data fields from sheets
  const handleVoucherNoChange = (selectedVoucherNo: string) => {
    setVoucherNo(selectedVoucherNo);
    
    if (transactions && transactions.length > 0) {
      const matchedTx = transactions.find(tx => {
        const txVNo = String(tx.voucherNo || "").trim().toUpperCase();
        const selVNo = String(selectedVoucherNo).trim().toUpperCase();
        return txVNo && selVNo && txVNo === selVNo;
      });
      if (matchedTx) {
        const rawDate = matchedTx.dateOfExpense || matchedTx.date || "";
        const dateVal = normalizeDate(rawDate);
        setDate(/^\d{4}-\d{2}-\d{2}$/.test(dateVal) ? dateVal : (typeof rawDate === "string" && rawDate.match(/^\d{4}-\d{2}-\d{2}$/) ? rawDate : new Date().toISOString().split("T")[0]));
        setName(matchedTx.employeeName || "");
        setAuthorizedBy(matchedTx.authorisedBy || "");
        setDepartment(matchedTx.department || "");
        setCategory(matchedTx.category || "");
        setRemarks(matchedTx.voucherRemarks || "");
        setRows([
          {
            id: 1,
            particulars: matchedTx.voucherRemarks || matchedTx.category || "",
            refBill: matchedTx.utrNumber ? `Ref: ${matchedTx.utrNumber}` : "",
            staffPerson: matchedTx.operatorName || "",
            amount: matchedTx.expenseAmount || matchedTx.depositedAmount || 0
          }
        ]);
      } else if (selectedVoucherNo.trim().toUpperCase() === (initialData?.voucherNo || `AP-${nextVoucherNo}`).trim().toUpperCase()) {
        const raw = initialData?.date || new Date().toISOString().split("T")[0];
        const normalized = normalizeDate(raw);
        setDate(/^\d{4}-\d{2}-\d{2}$/.test(normalized) ? normalized : new Date().toISOString().split("T")[0]);
        setName(initialData?.employeeName || "");
        setAuthorizedBy(initialData?.authorizedBy || "");
        setDepartment(initialData?.department || "");
        setCategory(initialData?.category || "");
        setRemarks(initialData?.particulars || "");
        setRows([
          {
            id: 1,
            particulars: initialData?.particulars || "",
            refBill: initialData?.refBillDate || "",
            staffPerson: initialData?.staffPerson || "",
            amount: initialData?.amount || 0
          }
        ]);
      }
    }
  };

  const totalAmount = rows.reduce((sum, row) => sum + (parseFloat(row.amount) || 0), 0);

  const addRow = () => {
    setRows([
      ...rows,
      {
        id: rows.length + 1,
        particulars: "",
        refBill: "",
        staffPerson: "",
        amount: 0
      }
    ]);
  };

  const removeRow = (id: number) => {
    if (rows.length === 1) return;
    setRows(rows.filter(row => row.id !== id).map((r, idx) => ({ ...r, id: idx + 1 })));
  };

  const updateRow = (id: number, field: string, val: any) => {
    setRows(rows.map(row => {
      if (row.id === id) {
        return { ...row, [field]: val };
      }
      return row;
    }));
  };

  const printVoucher = () => {
    const printContent = document.getElementById("printable-voucher-card");
    if (!printContent) return;
    
    const printWindow = window.open("", "_blank");
    if (printWindow) {
      printWindow.document.write(`
        <html>
          <head>
            <title>Asopalav Payment Voucher - ${voucherNo}</title>
            <script src="https://cdn.tailwindcss.com"></script>
            <style>
              @page {
                size: A5 landscape;
                margin: 0 !important;
              }
              @media print {
                html, body {
                  width: 210mm !important;
                  height: 148mm !important;
                  overflow: hidden !important;
                  background: white !important;
                  margin: 0 !important;
                  padding: 0 !important;
                }
                body { padding: 0 !important; margin: 0 !important; }
                .no-print { display: none !important; }
                * {
                  -webkit-print-color-adjust: exact !important;
                  print-color-adjust: exact !important;
                  box-sizing: border-box !important;
                }
                thead th {
                  border-bottom: 2px solid #0f172a !important;
                }
                /* Compact spacing to ensure single page A5 landscape */
                .print-container {
                  display: flex !important;
                  flex-direction: column !important;
                  justify-content: space-between !important;
                  width: 210mm !important;
                  height: 148mm !important;
                  padding: 5mm 8mm !important;
                  box-sizing: border-box !important;
                  border: 2px solid #0f172a !important;
                  border-radius: 4px !important;
                  margin: 0 !important;
                  background: white !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                
                /* Compact header elements */
                .print-header {
                  margin-bottom: 4px !important;
                  padding-bottom: 4px !important;
                  border-bottom-width: 1.5px !important;
                  gap: 0.5rem !important;
                }
                .print-logo-container {
                  width: 38px !important;
                  height: 38px !important;
                }
                .print-brand-logo {
                  height: 18px !important;
                }
                .print-address {
                  font-size: 7px !important;
                  line-height: 8px !important;
                  margin-top: 1px !important;
                }
                .print-meta-item {
                  font-size: 9px !important;
                  margin-bottom: 1px !important;
                }
                .print-voucher-badge {
                  font-size: 12px !important;
                  padding: 1px 5px !important;
                }

                /* Dept & Cat Row compact */
                .print-dept-cat-row {
                  margin-bottom: 4px !important;
                  gap: 8px !important;
                }
                .print-dept-cat-label {
                  font-size: 9px !important;
                }
                .print-dept-cat-value {
                  font-size: 10px !important;
                  padding-bottom: 1px !important;
                }

                /* Payee Row compact */
                .print-payee-row {
                  margin-bottom: 6px !important;
                  gap: 8px !important;
                }
                .print-payee-label {
                  font-size: 9px !important;
                }
                .print-payee-value {
                  font-size: 11px !important;
                  padding-bottom: 1px !important;
                }

                /* Table compact styling */
                .print-table-container {
                  margin-bottom: 6px !important;
                }
                .print-table-container th {
                  padding: 3px 5px !important;
                  font-size: 9px !important;
                }
                .print-table-container td {
                  padding: 3px 5px !important;
                  font-size: 9px !important;
                }

                /* Rupees and Total block */
                .print-rupees-total-row {
                  margin-bottom: 4px !important;
                  gap: 8px !important;
                }
                .print-rupees-label {
                  font-size: 9px !important;
                }
                .print-rupees-value {
                  font-size: 10px !important;
                  padding-bottom: 1px !important;
                }
                .print-total-badge {
                  padding: 3px 6px !important;
                }
                .print-total-label {
                  font-size: 9px !important;
                }
                .print-total-value {
                  font-size: 12px !important;
                }

                /* Remarks Row compact */
                .print-remarks-row {
                  margin-bottom: 6px !important;
                  gap: 8px !important;
                }
                .print-remarks-label {
                  font-size: 9px !important;
                }
                .print-remarks-value {
                  font-size: 10px !important;
                  padding-bottom: 1px !important;
                }

                /* Signatures section */
                .print-signatures-row {
                  border-top-width: 1.5px !important;
                  padding-top: 6px !important;
                  margin-top: 0 !important;
                  gap: 8px !important;
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .print-sig-col {
                  page-break-inside: avoid !important;
                  break-inside: avoid !important;
                }
                .print-sig-box {
                  height: 48px !important; /* Restored generous vertical space for signing */
                  display: flex !important;
                  align-items: flex-end !important;
                  justify-content: center !important;
                  padding-bottom: 3px !important;
                }
                .print-sig-label {
                  margin-top: 2px !important;
                  font-size: 8.5px !important;
                }
              }
              body { font-family: 'Inter', sans-serif; }
            </style>
          </head>
          <body class="bg-white p-1">
            <div class="w-full border-2 border-slate-900 p-4 rounded bg-white print-container">
              ${printContent.innerHTML}
            </div>
            <script>
              window.onload = function() {
                window.print();
                setTimeout(function() { window.close(); }, 500);
              };
            </script>
          </body>
        </html>
      `);
      printWindow.document.close();
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start font-sans">
      
      {/* Configuration panel */}
      <div className="lg:col-span-4 bg-white border border-slate-200 shadow-md rounded p-6 space-y-5">
        <div className="border-b border-slate-100 pb-3">
          <h3 className="text-sm font-bold text-slate-950 uppercase tracking-wider">Configure Voucher</h3>
          <p className="text-xs text-slate-400">Generate a high-contrast corporate payment receipt</p>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Voucher No.</label>
              {!isCustomVoucher ? (
                <select
                  value={voucherNo}
                  onChange={(e) => {
                    if (e.target.value === "ADD_NEW_VOUCHER") {
                      setIsCustomVoucher(true);
                      setVoucherNo("");
                    } else {
                      handleVoucherNoChange(e.target.value);
                    }
                  }}
                  className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-mono font-bold bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 cursor-pointer"
                  id="config-voucherno"
                >
                  {uniqueVouchers.map((v) => (
                    <option key={v} value={v}>
                      {v}
                    </option>
                  ))}
                  <option value="ADD_NEW_VOUCHER" className="text-indigo-600 font-bold">+ Add Voucher</option>
                </select>
              ) : (
                <div className="space-y-1">
                  <input
                    type="text"
                    value={voucherNo}
                    onChange={(e) => setVoucherNo(e.target.value)}
                    placeholder="Type Voucher No"
                    className="w-full px-3 py-1.5 border border-indigo-300 rounded text-xs font-mono font-bold focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-indigo-50/10"
                    id="config-voucherno-input"
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setIsCustomVoucher(false);
                      if (uniqueVouchers.length > 0) {
                        handleVoucherNoChange(uniqueVouchers[0]);
                      }
                    }}
                    className="text-[9px] text-indigo-600 font-bold hover:underline block"
                  >
                    ← Select from list
                  </button>
                </div>
              )}
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Date</label>
              <input
                type="date"
                value={date}
                readOnly
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-mono font-bold bg-slate-50 text-slate-500 cursor-not-allowed"
                id="config-date"
              />
              <div className="mt-1">
                <span className="text-[10px] font-mono font-black text-indigo-600 bg-indigo-50 px-2.5 py-0.5 rounded border border-indigo-100 uppercase">
                  {formatShortDate(date)}
                </span>
              </div>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Payee Name</label>
            <input
              type="text"
              value={name}
              readOnly
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
              id="config-name"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Department</label>
              <input
                type="text"
                value={department}
                readOnly
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
                id="config-department"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Category</label>
              <input
                type="text"
                value={category}
                readOnly
                className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
                id="config-category"
              />
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Voucher Remarks</label>
            <textarea
              value={remarks}
              onChange={(e) => setRemarks(e.target.value)}
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-medium focus:outline-none focus:ring-1 focus:ring-indigo-500"
              id="config-remarks"
              rows={2}
              placeholder="Voucher Remarks"
            />
          </div>

          <div>
            <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">Authorised By</label>
            <input
              type="text"
              value={authorizedBy}
              readOnly
              className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs font-semibold bg-slate-50 text-slate-500 cursor-not-allowed"
              id="config-authorised"
            />
          </div>

          {/* Table Items Configuration */}
          <div className="space-y-3 pt-2">
            <div className="flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Voucher Items</span>
            </div>

            <div className="space-y-3 max-h-[220px] overflow-y-auto pr-1">
              {rows.map((row) => (
                <div key={row.id} className="p-3 border border-slate-200 rounded bg-slate-50 space-y-2 text-xs relative">
                  <div className="font-bold text-slate-400 text-[9px] uppercase tracking-wider">Item #{row.id}</div>
                  
                  <div>
                    <input
                      type="text"
                      placeholder="Particulars"
                      value={row.particulars}
                      readOnly
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-slate-100 text-slate-500 font-semibold cursor-not-allowed"
                      id={`row-particulars-${row.id}`}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <input
                      type="text"
                      placeholder="Ref. Bill / Date"
                      value={row.refBill}
                      readOnly
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold cursor-not-allowed"
                      id={`row-ref-${row.id}`}
                    />
                    <input
                      type="text"
                      placeholder="Staff Person"
                      value={row.staffPerson}
                      readOnly
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-slate-100 text-slate-500 text-[11px] font-semibold cursor-not-allowed"
                      id={`row-staff-${row.id}`}
                    />
                  </div>

                  <div>
                    <input
                      type="number"
                      placeholder="Amount (₹)"
                      value={row.amount || ""}
                      readOnly
                      className="w-full px-2.5 py-1.5 border border-slate-200 rounded bg-slate-100 text-slate-500 text-[11px] font-bold font-mono cursor-not-allowed"
                      id={`row-amount-${row.id}`}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="pt-2">
          <button
            onClick={printVoucher}
            className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs flex items-center justify-center gap-2 cursor-pointer transition-colors shadow-md shadow-indigo-100"
            id="print-action-btn"
          >
            <Printer className="w-4 h-4" /> Print / Save Voucher PDF
          </button>
        </div>
      </div>

      {/* Visual Render panel */}
      <div className="lg:col-span-8 space-y-4">
        
        {/* Physical Voucher Mockup Container */}
        <div 
          id="printable-voucher-card" 
          className="bg-white border-2 border-slate-900 p-6 md:p-8 rounded shadow-xl max-w-3xl mx-auto text-slate-900 leading-relaxed font-sans relative overflow-hidden"
        >
          {/* Header row */}
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center border-b-2 border-slate-900 pb-4 mb-4 gap-4 print-header">
            
            {/* Logo and Address */}
            <div className="flex items-start gap-3">
              <div className="w-12 h-12 bg-white border border-slate-200 rounded flex items-center justify-center shadow-sm overflow-hidden shrink-0 p-0.5 print-logo-container">
                <img 
                  src={logoUrl} 
                  alt="AsōPalav Logo" 
                  className="w-full h-full object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <div>
                <div className="flex items-baseline gap-1.5">
                  <div className="flex items-center h-6">
                    <img 
                      src={asopalavLogoUrl} 
                      alt="AsōPalav Brand Logo" 
                      className="h-full object-contain print-brand-logo"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <span className="text-slate-600 font-bold text-lg font-caveat">Endeavours LLP.</span>
                </div>
                <p className="text-[8px] text-slate-400 font-bold max-w-sm mt-0.5 uppercase tracking-wide leading-[9.5px] text-left print-address">
                  "Asopalav House" Opp. Keshav Baugh Party Plot, <br />
                  132 Ft. Ring Road, Satellite, Ahmedabad-380 015. <br />
                  Ph. : 26765590-91-92
                </p>
              </div>
            </div>

            {/* Voucher Metadata */}
            <div className="text-right flex flex-col items-end shrink-0 w-full md:w-auto font-mono">
              <div className="flex items-center gap-2 mb-1 justify-end w-full print-meta-item">
                <span className="text-[10px] font-bold uppercase text-slate-400">VOUCHER NO:</span>
                <span className="text-base font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded print-voucher-badge">{voucherNo || "—"}</span>
              </div>
              <div className="flex items-center gap-2 justify-end w-full print-meta-item">
                <span className="text-[10px] font-bold uppercase text-slate-400">DATE:</span>
                <span className="text-xs font-bold text-slate-900 border-b border-slate-900 min-w-[100px] text-center pb-0.5">{formatVoucherDate(date) || "—"}</span>
              </div>
            </div>

          </div>

          {/* Department & Category Row */}
          <div className="grid grid-cols-2 gap-6 mb-4 print-dept-cat-row">
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0 print-dept-cat-label">DEPARTMENT:</span>
              <div className="border-b border-dashed border-slate-400 flex-1 font-bold text-slate-900 text-sm pb-0.5 px-2 bg-slate-50 print-dept-cat-value">
                {department || <span className="text-slate-300 font-normal italic">—</span>}
              </div>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0 print-dept-cat-label">CATEGORY:</span>
              <div className="border-b border-dashed border-slate-400 flex-1 font-bold text-slate-900 text-sm pb-0.5 px-2 bg-slate-50 print-dept-cat-value">
                {category || <span className="text-slate-300 font-normal italic">—</span>}
              </div>
            </div>
          </div>

          {/* Name Field */}
          <div className="flex items-baseline gap-3 mb-5 print-payee-row">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0 print-payee-label">PAYEE NAME:</span>
            <div className="border-b border-dashed border-slate-400 flex-1 font-bold text-slate-900 text-sm pb-0.5 px-2 bg-slate-50 print-payee-value">
              {name || <span className="text-slate-300 font-normal italic">No Payee specified</span>}
            </div>
          </div>

          {/* Table */}
          <div className="border border-slate-900 rounded overflow-hidden bg-white shadow-sm mb-5 print-table-container">
            <table className="w-full text-xs text-left border-collapse">
              <thead>
                <tr className="bg-slate-900 text-white font-bold uppercase tracking-wider text-[10px] border-b-2 border-slate-900">
                  <th className="py-2.5 px-3 border-r border-slate-800 w-12 text-center font-bold border-b-2 border-slate-900">SR. NO.</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 font-bold border-b-2 border-slate-900">PARTICULARS</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 w-36 font-bold border-b-2 border-slate-900">REF. BILL / DATE</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 w-28 font-bold border-b-2 border-slate-900">STAFF</th>
                  <th className="py-2.5 px-3 border-r border-slate-800 w-16 text-center font-bold border-b-2 border-slate-900">VERIFIED</th>
                  <th className="py-2.5 px-3 text-right w-24 font-bold border-b-2 border-slate-900">AMOUNT</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {rows.map((row, index) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="py-2 px-3 border-r border-slate-200 text-center font-mono font-bold text-slate-400 bg-slate-50/40">{index + 1}</td>
                    <td className="py-2 px-3 border-r border-slate-200 font-bold text-slate-800">
                      {row.particulars || <span className="text-slate-300 font-normal">No details</span>}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-500 font-mono text-[11px]">
                      {formatDatesInText(row.refBill) || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-slate-700 font-semibold">
                      {row.staffPerson || <span className="text-slate-300">—</span>}
                    </td>
                    <td className="py-2 px-3 border-r border-slate-200 text-center text-emerald-600 font-bold text-[10px]">
                      {row.amount > 0 ? "✓ Approved" : "—"}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900 bg-slate-50/20">
                      ₹{(parseFloat(row.amount) || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Rupees In Words and Total block */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-baseline mb-4 print-rupees-total-row">
            <div className="md:col-span-8 flex items-baseline gap-2">
              <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0 print-rupees-label">RUPEES IN WORDS:</span>
              <div className="border-b border-dashed border-slate-400 flex-1 font-bold text-slate-800 text-xs py-0.5 px-2 italic bg-slate-50 print-rupees-value">
                {numberToRupeesWords(totalAmount)}
              </div>
            </div>
            
            <div className="md:col-span-4 bg-slate-900 text-white rounded p-2.5 flex justify-between items-center shadow-inner print-total-badge">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-300 print-total-label">TOTAL:</span>
              <span className="text-base font-bold font-mono text-emerald-400 print-total-value">
                ₹{totalAmount.toLocaleString("en-IN", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>

          {/* Remarks Row */}
          <div className="flex items-baseline gap-3 mb-6 print-remarks-row">
            <span className="text-xs font-bold uppercase tracking-widest text-slate-400 shrink-0 print-remarks-label">VOUCHER REMARKS:</span>
            <div className="border-b border-dashed border-slate-400 flex-1 font-bold text-slate-800 text-xs py-0.5 px-2 bg-slate-50 print-remarks-value">
              {remarks || <span className="text-slate-300 font-normal italic">—</span>}
            </div>
          </div>

          {/* Footer / Signature Rows */}
          <div className="grid grid-cols-3 gap-4 border-t border-slate-200 pt-8 mt-4 text-center text-[10px] text-slate-400 font-bold uppercase tracking-widest print-signatures-row">
            
            <div className="flex flex-col items-center print-sig-col">
              <div className="h-10 print-sig-box flex items-end justify-center pb-1">
                <div className="border-b border-slate-300 w-32 pb-0.5 text-[10px] text-slate-400 italic font-bold">
                  PENDING SIGNATURE
                </div>
              </div>
              <span className="mt-1.5 text-[10px] text-slate-600 font-bold print-sig-label">ACCOUNTANT</span>
            </div>

            <div className="flex flex-col items-center print-sig-col">
              <div className="h-10 print-sig-box flex items-end justify-center pb-1">
                {authorizedBy ? (
                  <div className="flex flex-col items-center">
                    <span className="text-[9px] text-indigo-600 font-mono font-bold flex items-center gap-0.5 bg-indigo-50 border border-indigo-100 px-1.5 py-0.5 rounded">
                      <ShieldCheck className="w-3.5 h-3.5" /> VERIFIED
                    </span>
                    <span className="text-xs text-slate-900 font-bold leading-none">{authorizedBy}</span>
                  </div>
                ) : (
                  <div className="border-b border-slate-300 w-32" />
                )}
              </div>
              <span className="mt-1.5 text-[10px] text-slate-600 font-bold font-sans print-sig-label">AUTHORISED SIGNATORY</span>
            </div>

            <div className="flex flex-col items-center print-sig-col">
              <div className="h-10 print-sig-box flex items-end justify-center pb-1">
                <div className="border-b border-slate-300 w-32" />
              </div>
              <span className="mt-1.5 text-[10px] text-slate-600 font-bold print-sig-label">RECEIVER'S SIGNATURE</span>
            </div>

          </div>

        </div>
      </div>

    </div>
  );
}
