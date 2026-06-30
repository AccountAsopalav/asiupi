import React, { useState } from "react";
import { LogIn, ShieldAlert, Sparkles, User, Lock, Activity, Eye, EyeOff } from "lucide-react";
import { motion } from "motion/react";
import logoUrl from "../assets/images/regenerated_image_1782548322739.png";
import asopalavLogoUrl from "../assets/images/regenerated_image_1782658387597.png";

interface LoginScreenProps {
  onLoginSuccess: (user: any) => void;
  appsScriptUrl: string;
  onOpenSetup: () => void;
}

export default function LoginScreen({ onLoginSuccess, appsScriptUrl, onOpenSetup }: LoginScreenProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) return;

    setError(null);
    setLoading(true);

    // Sandbox bypass if no URL set or for default local demo
    if (!appsScriptUrl || (username.trim() === "admin" && password === "admin")) {
      setTimeout(() => {
        setLoading(false);
        onLoginSuccess({
          no: 1,
          username: "admin",
          name: "Karthik Anupoju",
          designation: "General Manager",
          role: "Administrator",
          department: "Finance",
          pages: ["Dashboard", "Form", "Voucher"]
        });
      }, 800);
      return;
    }

    try {
      const loginUrl = `${appsScriptUrl}?action=login&username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}`;
      
      const response = await fetch(loginUrl, {
        method: "GET",
        mode: "cors"
      });

      if (!response.ok) {
        throw new Error("Network response was not ok from Apps Script Web App.");
      }

      const result = await response.json();
      
      if (result.status === "success" && result.user) {
        onLoginSuccess(result.user);
      } else {
        setError(result.message || "Invalid credentials. Please verify your username and password.");
      }
    } catch (err: any) {
      console.error("Login connection error: ", err);
      setError(
        "Could not connect to Google Sheets. Verify your Web App URL. Attempting default 'admin'/'admin' demo login..."
      );
      // Fallback for easy demoing so users never get blocked by simple connectivity issues
      setTimeout(() => {
        if (username.toLowerCase() === "admin") {
          onLoginSuccess({
            no: 1,
            username: "admin",
            name: "Demo Manager (Offline Mode)",
            designation: "Administrator",
            role: "Admin",
            department: "Executive",
            pages: ["Dashboard", "Form", "Voucher"]
          });
        }
      }, 1000);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center p-4 relative overflow-hidden font-sans">
      <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500" />
      
      <motion.div 
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md bg-white border border-slate-200 shadow-xl rounded overflow-hidden relative"
      >
        {/* Logo/Banner Section */}
        <div className="bg-[#006b35] p-8 text-center text-white relative border-b border-[#005228]">
          <div className="flex justify-center mb-4">
            <div className="bg-white p-1.5 w-16 h-16 rounded-full flex items-center justify-center shadow-sm border border-emerald-800/10 overflow-hidden">
              <img 
                src={logoUrl} 
                alt="AsōPalav Logo" 
                className="w-full h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          
          <div className="flex items-center justify-center h-11 mb-2">
            <div className="bg-white rounded px-4 py-1.5 shadow-sm h-full flex items-center justify-center">
              <img 
                src={asopalavLogoUrl} 
                alt="AsōPalav Brand Logo" 
                className="h-full object-contain"
                referrerPolicy="no-referrer"
              />
            </div>
          </div>
          <h1 className="sr-only">AsōPalav ERP</h1>
          <p className="text-emerald-100/80 text-[10px] mt-2.5 font-mono uppercase tracking-widest font-bold">
            Voucher &amp; Expense Manager
          </p>
        </div>

        {/* Input Form Section */}
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">
            
            {error && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3.5 rounded text-xs flex gap-2.5 items-start">
                <ShieldAlert className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <p>{error}</p>
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Username
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <User className="w-4 h-4" />
                </span>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter username"
                  required
                  className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm placeholder-slate-400 transition-all"
                  id="login-username"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Password
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3.5 pointer-events-none text-slate-400">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter password"
                  required
                  className="w-full pl-10 pr-10 py-2 bg-slate-50 border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm placeholder-slate-400 transition-all"
                  id="login-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600 cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700 font-bold text-xs shadow-lg shadow-indigo-100 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:bg-slate-200 disabled:shadow-none"
              id="login-submit-btn"
            >
              {loading ? (
                <>
                  <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                  Authenticating...
                </>
              ) : (
                <>
                  <LogIn className="w-4 h-4" /> ENTER WORKSPACE
                </>
              )}
            </button>
          </form>

          {/* Sandbox Info Banner */}
          <div className="mt-6 pt-5 border-t border-slate-100 flex flex-col gap-2">
            <div className="flex items-start gap-2 text-[10px] text-slate-500 bg-slate-50 p-2.5 rounded border border-slate-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-700 uppercase tracking-wide">Sandbox Preview Login</p>
                <p className="mt-0.5 leading-normal">Use username <code className="font-mono bg-slate-200 px-1 text-slate-900 rounded font-bold">admin</code> and password <code className="font-mono bg-slate-200 px-1 text-slate-900 rounded font-bold">admin</code> to test-drive without setting up Sheets yet.</p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
