export interface User {
  no: number;
  username: string;
  name: string;
  designation: string;
  role: string;
  department: string;
  pages: string[]; // split by comma, e.g. ["Dashboard", "Form", "Voucher"]
}

export interface SettingsData {
  employees: string[];
  departments: string[];
  categories: string[];
  angadias: string[];
  gstOptions: string[];
  paymentMethods: string[];
}

export interface Transaction {
  timestamp: string;
  utrNumber: string;
  operatorName: string;
  dateOfExpense: string;
  voucherNo: string;
  employeeName: string;
  department: string;
  category: string;
  vendorName: string;
  gst: string;
  paymentMethod: string;
  expenseAmount: number;
  depositedAmount: number;
  voucherRemarks: string;
  billImage: string; // Base64 or URL
  receiptImage: string; // Base64 or URL
  itemImage: string; // Base64 or URL
  securityStampImage: string; // Base64 or URL
  authorisedBy: string;
}

export interface DashboardStats {
  totalIncome: number;
  totalExpense: number;
  netBalance: number;
  departmentExpenses: { name: string; value: number }[];
  categoryExpenses: { name: string; value: number }[];
  employeeExpenses: { name: string; value: number }[];
  monthlyTrend: { month: string; income: number; expense: number }[];
}
