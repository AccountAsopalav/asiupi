import React, { useState } from "react";
import { 
  User as UserIcon, 
  UserPlus, 
  Shield, 
  Trash2, 
  Edit2, 
  X, 
  Check, 
  Lock, 
  Search, 
  CheckCircle2, 
  AlertCircle, 
  Eye, 
  EyeOff, 
  RefreshCw, 
  ShieldAlert,
  Save,
  Key,
  Database,
  LayoutDashboard,
  PlusCircle,
  FileText,
  Users as UsersIcon
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { User } from "../types";

interface UsersTabProps {
  users: User[];
  currentUser: User;
  appsScriptUrl: string;
  onRefresh: () => Promise<void>;
  showNotification: (type: "success" | "error", message: string) => void;
}

const AVAILABLE_PAGES = ["Dashboard", "Form", "Voucher", "Users"];

export default function UsersTab({ 
  users, 
  currentUser, 
  appsScriptUrl, 
  onRefresh, 
  showNotification 
}: UsersTabProps) {
  // Filters & UI States
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState("All");
  const [deptFilter, setDeptFilter] = useState("All");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);

  // Form State
  const [formNo, setFormNo] = useState<number | null>(null); // null = new user
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formName, setFormName] = useState("");
  const [formDesignation, setFormDesignation] = useState("");
  const [formRole, setFormRole] = useState("Staff");
  const [formDepartment, setFormDepartment] = useState("");
  const [formPages, setFormPages] = useState<string[]>(["Dashboard", "Form", "Voucher"]);
  const [showPasswordInput, setShowPasswordInput] = useState(false);

  // Lists extracted from existing users for filter options
  const uniqueRoles = ["All", ...new Set(users.map(u => u.role).filter(Boolean))];
  const uniqueDepts = ["All", ...new Set(users.map(u => u.department).filter(Boolean))];

  // Search/Filter logic
  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      (user.name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.username || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.designation || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (user.department || "").toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesRole = roleFilter === "All" || user.role === roleFilter;
    const matchesDept = deptFilter === "All" || user.department === deptFilter;

    return matchesSearch && matchesRole && matchesDept;
  });

  // Open form for adding a user
  const handleAddNew = () => {
    setFormNo(null);
    setFormUsername("");
    setFormPassword("");
    setFormName("");
    setFormDesignation("");
    setFormRole("Staff");
    setFormDepartment("");
    setFormPages(["Dashboard", "Form", "Voucher"]);
    setIsEditing(true);
  };

  // Open form for editing a user
  const handleEditUser = (user: User) => {
    setFormNo(user.no);
    setFormUsername(user.username);
    setFormPassword(""); // Keep blank to signify no password change
    setFormName(user.name);
    setFormDesignation(user.designation || "");
    setFormRole(user.role || "Staff");
    setFormDepartment(user.department || "");
    setFormPages(user.pages || ["Dashboard", "Form", "Voucher"]);
    setIsEditing(true);
  };

  // Toggle checklist permission page
  const handlePageToggle = (page: string) => {
    if (formPages.includes(page)) {
      setFormPages(formPages.filter(p => p !== page));
    } else {
      setFormPages([...formPages, page]);
    }
  };

  // Submit create or edit user
  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formUsername.trim() || !formName.trim()) {
      showNotification("error", "Username and Full Name are required.");
      return;
    }

    if (!formNo && !formPassword) {
      showNotification("error", "Password is required for new users.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      action: "saveUser",
      no: formNo,
      username: formUsername.trim().toLowerCase(),
      password: formPassword || undefined, // only send if non-empty
      name: formName.trim(),
      designation: formDesignation.trim(),
      role: formRole,
      department: formDepartment.trim(),
      pages: formPages.join(", ")
    };

    try {
      if (!appsScriptUrl) {
        // Fallback for offline demo mode
        showNotification("success", `[Sandbox Mode] User ${formName} saved locally!`);
        setIsEditing(false);
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error("HTTP connection failed");
      const result = await response.json();

      if (result.status === "success") {
        showNotification("success", result.message || "User record successfully updated.");
        setIsEditing(false);
        await onRefresh(); // reload user state
      } else {
        showNotification("error", result.message || "Failed to save user in Google Sheets.");
      }
    } catch (err: any) {
      console.error("Save user error:", err);
      showNotification("error", "Failed to connect to Google Sheets pipeline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Submit user deletion
  const handleDeleteUser = async (no: number, name: string) => {
    if (no === currentUser.no) {
      showNotification("error", "Security alert: You cannot delete your own logged-in user account!");
      setDeleteConfirmId(null);
      return;
    }

    setIsSubmitting(true);
    try {
      if (!appsScriptUrl) {
        showNotification("success", `[Sandbox Mode] User deleted locally.`);
        setDeleteConfirmId(null);
        setIsSubmitting(false);
        return;
      }

      const response = await fetch(appsScriptUrl, {
        method: "POST",
        mode: "cors",
        headers: {
          "Content-Type": "text/plain;charset=utf-8"
        },
        body: JSON.stringify({
          action: "deleteUser",
          no: no
        })
      });

      if (!response.ok) throw new Error("HTTP connection failed");
      const result = await response.json();

      if (result.status === "success") {
        showNotification("success", `Account of '${name}' removed successfully.`);
        setDeleteConfirmId(null);
        await onRefresh();
      } else {
        showNotification("error", result.message || "Failed to delete user.");
      }
    } catch (err: any) {
      console.error("Delete user error:", err);
      showNotification("error", "Failed to connect to Google Sheets pipeline.");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Helper to map tab names to clean icons
  const getPageIcon = (page: string) => {
    switch (page) {
      case "Dashboard":
        return <LayoutDashboard className="w-3.5 h-3.5" />;
      case "Form":
        return <PlusCircle className="w-3.5 h-3.5" />;
      case "Voucher":
        return <FileText className="w-3.5 h-3.5" />;
      case "Users":
        return <UsersIcon className="w-3.5 h-3.5" />;
      default:
        return <UserIcon className="w-3.5 h-3.5" />;
    }
  };

  return (
    <div className="space-y-6" id="users-tab-container">
      {/* Overview Card */}
      <div className="bg-white border border-slate-200 rounded p-6 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <UsersIcon className="w-5 h-5 text-[#006c35]" />
            <h2 className="text-sm font-black tracking-wider uppercase text-slate-900">User accounts &amp; Login Access</h2>
          </div>
          <p className="text-xs text-slate-500">
            Control employee login access, role privileges, and screen visibility mapped directly to your <code className="bg-slate-100 px-1 py-0.5 rounded font-mono text-[10px]">USERS</code> tab in Google Sheet.
          </p>
        </div>
        <button
          onClick={handleAddNew}
          className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs uppercase tracking-wider transition-colors shadow shadow-indigo-100 align-self-start md:align-self-auto"
          id="btn-add-user"
        >
          <UserPlus className="w-4 h-4" /> Add New Employee
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        
        {/* User Search and Listing Panel */}
        <div className="lg:col-span-2 space-y-4">
          
          {/* Controls Bar */}
          <div className="bg-white border border-slate-200 rounded p-4 shadow-sm flex flex-col sm:flex-row gap-3">
            {/* Search */}
            <div className="relative flex-1">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                placeholder="Search by name, username, title..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white"
                id="user-search-input"
              />
            </div>

            {/* Role Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Role:</label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="border border-slate-200 rounded bg-slate-50 px-2.5 py-1 text-xs focus:outline-none"
              >
                {uniqueRoles.map(role => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </div>

            {/* Dept Filter */}
            <div className="flex items-center gap-2">
              <label className="text-[10px] font-bold uppercase text-slate-400 tracking-wider">Dept:</label>
              <select
                value={deptFilter}
                onChange={(e) => setDeptFilter(e.target.value)}
                className="border border-slate-200 rounded bg-slate-50 px-2.5 py-1 text-xs focus:outline-none"
              >
                {uniqueDepts.map(dept => (
                  <option key={dept} value={dept}>{dept}</option>
                ))}
              </select>
            </div>
          </div>

          {/* User Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <AnimatePresence>
              {filteredUsers.length === 0 ? (
                <div className="col-span-full bg-slate-50 border border-slate-200/60 rounded p-12 text-center">
                  <UserIcon className="w-8 h-8 text-slate-300 mx-auto mb-3" />
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-wider">No Employees Found</p>
                  <p className="text-[11px] text-slate-400 mt-1">Try resetting search parameters or create a new user account.</p>
                </div>
              ) : (
                filteredUsers.map(user => {
                  const isSelf = user.no === currentUser.no;
                  const isDeletable = user.no !== currentUser.no;
                  
                  return (
                    <motion.div
                      key={user.no}
                      layoutId={`user-card-${user.no}`}
                      initial={{ opacity: 0, scale: 0.98 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className={`bg-white border rounded shadow-sm overflow-hidden flex flex-col justify-between transition-all ${
                        isSelf ? "border-emerald-200 ring-2 ring-emerald-50" : "border-slate-200"
                      }`}
                    >
                      {/* Body */}
                      <div className="p-5">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex items-center gap-3">
                            {/* User Avatar Initials */}
                            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold select-none shrink-0 ${
                              user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "administrator"
                                ? "bg-indigo-50 text-indigo-700 border border-indigo-200"
                                : "bg-slate-100 text-slate-600 border border-slate-200"
                            }`}>
                              {user.name ? user.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase() : "U"}
                            </div>
                            <div>
                              <div className="flex items-center gap-1.5">
                                <h3 className="text-xs font-bold text-slate-900 leading-tight">{user.name}</h3>
                                {isSelf && (
                                  <span className="bg-emerald-100 text-emerald-800 text-[9px] font-black uppercase px-1.5 py-0.5 rounded leading-none">You</span>
                                )}
                              </div>
                              <p className="text-[10px] text-slate-400 font-mono mt-0.5">@{user.username}</p>
                            </div>
                          </div>
                          <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                            user.role?.toLowerCase() === "admin" || user.role?.toLowerCase() === "administrator"
                              ? "bg-indigo-50 border-indigo-200 text-indigo-700"
                              : "bg-slate-50 border-slate-200 text-slate-600"
                          }`}>
                            {user.role || "Staff"}
                          </span>
                        </div>

                        {/* Details */}
                        <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px]">
                          <div>
                            <span className="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">Designation</span>
                            <span className="font-semibold text-slate-700 leading-normal block truncate">{user.designation || "Not Set"}</span>
                          </div>
                          <div>
                            <span className="block text-[9px] font-bold uppercase text-slate-400 tracking-wider">Department</span>
                            <span className="font-semibold text-slate-700 leading-normal block truncate">{user.department || "Not Set"}</span>
                          </div>
                        </div>

                        {/* Page Permissions badges */}
                        <div className="mt-4">
                          <span className="block text-[9px] font-bold uppercase text-slate-400 tracking-wider mb-1.5">Page Permissions</span>
                          <div className="flex flex-wrap gap-1.5">
                            {user.pages && user.pages.length > 0 ? (
                              user.pages.map(page => (
                                <span 
                                  key={page}
                                  className="inline-flex items-center gap-1 bg-slate-50 text-slate-600 border border-slate-200 rounded px-1.5 py-0.5 text-[9px] font-medium leading-none"
                                >
                                  {getPageIcon(page)}
                                  <span>{page}</span>
                                </span>
                              ))
                            ) : (
                              <span className="text-[10px] text-amber-600 font-medium">None configured</span>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Action buttons */}
                      <div className="bg-slate-50 px-5 py-3 border-t border-slate-150 flex items-center justify-between gap-3">
                        <button
                          onClick={() => handleEditUser(user)}
                          className="cursor-pointer text-slate-600 hover:text-indigo-600 text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 transition-colors border border-slate-200 bg-white hover:bg-slate-50 px-2.5 py-1.5 rounded"
                        >
                          <Edit2 className="w-3 h-3" /> Edit Profile
                        </button>

                        {isDeletable ? (
                          deleteConfirmId === user.no ? (
                            <div className="flex items-center gap-1.5 animate-pulse">
                              <span className="text-[9px] text-rose-600 font-bold uppercase">Confirm?</span>
                              <button
                                onClick={() => handleDeleteUser(user.no, user.name)}
                                className="cursor-pointer bg-rose-600 hover:bg-rose-700 text-white p-1 rounded transition-all text-xs"
                              >
                                <Check className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => setDeleteConfirmId(null)}
                                className="cursor-pointer bg-slate-200 hover:bg-slate-300 text-slate-600 p-1 rounded transition-all"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          ) : (
                            <button
                              onClick={() => setDeleteConfirmId(user.no)}
                              className="cursor-pointer text-slate-400 hover:text-rose-600 text-[10px] font-semibold uppercase tracking-wider flex items-center gap-1 transition-colors"
                            >
                              <Trash2 className="w-3.5 h-3.5" /> Delete
                            </button>
                          )
                        ) : (
                          <span className="text-[9px] text-slate-400 font-bold uppercase flex items-center gap-1 select-none">
                            <Lock className="w-3 h-3 text-slate-300" /> Default Account
                          </span>
                        )}
                      </div>
                    </motion.div>
                  );
                })
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Create/Edit Editor side drawer */}
        <div className="lg:col-span-1">
          <AnimatePresence mode="wait">
            {isEditing ? (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-white border border-indigo-600/30 rounded shadow-md overflow-hidden"
              >
                {/* Header */}
                <div className="bg-slate-900 px-5 py-4 text-white border-b border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shield className="w-4 h-4 text-indigo-400" />
                    <h3 className="text-xs font-black uppercase tracking-wider">
                      {formNo ? "Edit Employee Profile" : "Create Access Account"}
                    </h3>
                  </div>
                  <button
                    onClick={() => setIsEditing(false)}
                    className="text-slate-400 hover:text-white transition-colors cursor-pointer border border-slate-800 hover:bg-white/10 p-1 rounded"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleFormSubmit} className="p-5 space-y-4">
                  {/* Name */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Full Name</label>
                    <input
                      type="text"
                      required
                      value={formName}
                      onChange={(e) => setFormName(e.target.value)}
                      placeholder="e.g. Ramesh Shah"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Username */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Username (Login ID)</label>
                    <input
                      type="text"
                      required
                      disabled={!!formNo} // Username locked for existing
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      placeholder="e.g. ramesh"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-slate-800 font-semibold disabled:bg-slate-100 disabled:text-slate-400"
                    />
                  </div>

                  {/* Password */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">
                        {formNo ? "Change Password" : "Login Password"}
                      </label>
                      {formNo && (
                        <span className="text-[8px] text-indigo-500 font-bold uppercase">Optional (leave blank to keep same)</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type={showPasswordInput ? "text" : "password"}
                        required={!formNo} // Required only for new users
                        value={formPassword}
                        onChange={(e) => setFormPassword(e.target.value)}
                        placeholder={formNo ? "•••••••• (only to reset)" : "Enter login password"}
                        className="w-full pl-3 pr-8 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white font-mono text-slate-800"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordInput(!showPasswordInput)}
                        className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-slate-400 hover:text-slate-600"
                      >
                        {showPasswordInput ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                  </div>

                  {/* Role */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">System Role</label>
                    <select
                      value={formRole}
                      onChange={(e) => setFormRole(e.target.value)}
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white font-semibold text-slate-800"
                    >
                      <option value="Staff">Staff / Operator</option>
                      <option value="Manager">Manager</option>
                      <option value="Administrator">Administrator</option>
                    </select>
                  </div>

                  {/* Designation */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Official Designation</label>
                    <input
                      type="text"
                      value={formDesignation}
                      onChange={(e) => setFormDesignation(e.target.value)}
                      placeholder="e.g. Senior Accountant"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Department */}
                  <div className="space-y-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Department</label>
                    <input
                      type="text"
                      value={formDepartment}
                      onChange={(e) => setFormDepartment(e.target.value)}
                      placeholder="e.g. Finance, Procurement"
                      className="w-full px-3 py-1.5 border border-slate-200 rounded text-xs focus:outline-none focus:ring-1 focus:ring-indigo-500 bg-slate-50 focus:bg-white text-slate-800 font-semibold"
                    />
                  </div>

                  {/* Page Privileges */}
                  <div className="space-y-1.5 pt-1">
                    <label className="block text-[9px] font-bold text-slate-400 uppercase tracking-wider">Modular Page Access</label>
                    <div className="space-y-1 bg-slate-50 p-2.5 rounded border border-slate-200">
                      {AVAILABLE_PAGES.map(page => {
                        const isChecked = formPages.includes(page);
                        return (
                          <label key={page} className="flex items-center gap-2 py-1 cursor-pointer select-none text-[11px] font-semibold text-slate-700">
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => handlePageToggle(page)}
                              className="w-3.5 h-3.5 text-indigo-600 border-slate-300 rounded focus:ring-indigo-500"
                            />
                            <span className="flex items-center gap-1">
                              {getPageIcon(page)}
                              <span>{page}</span>
                            </span>
                          </label>
                        );
                      })}
                    </div>
                  </div>

                  {/* Action */}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full py-2 mt-4 bg-indigo-600 hover:bg-indigo-700 text-white rounded font-bold text-xs uppercase tracking-wider shadow transition-colors flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Saving changes...
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" /> Save User Profile
                      </>
                    )}
                  </button>
                </form>
              </motion.div>
            ) : (
              <div className="bg-indigo-950 text-indigo-200 border border-indigo-900 rounded p-6 shadow-sm text-center font-brand">
                <Shield className="w-8 h-8 text-indigo-400 mx-auto mb-3" />
                <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-1.5">Access Control Panel</h3>
                <p className="text-[11px] leading-relaxed mb-4 text-indigo-300">
                  Select an employee card to modify their login profiles or change their specific sheet access rights.
                </p>
                <button
                  onClick={handleAddNew}
                  className="cursor-pointer inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded text-[11px] font-bold uppercase tracking-wider transition-all shadow"
                >
                  <UserPlus className="w-3.5 h-3.5" /> Add Employee Account
                </button>
              </div>
            )}
          </AnimatePresence>
        </div>

      </div>
    </div>
  );
}
