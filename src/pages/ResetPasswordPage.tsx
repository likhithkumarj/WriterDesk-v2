import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { PenTool, Lock, Loader2, Eye, EyeOff } from "lucide-react";
import { supabaseService } from "../utils/supabaseService";

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password) return;
    if (password !== confirmPassword) {
      alert("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);

    if (!supabaseService.isConfigured()) {
      setTimeout(() => {
        setIsSubmitting(false);
        alert("Password updated successfully! (Simulated)");
        navigate("/login");
      }, 1200);
      return;
    }

    try {
      const { error } = await supabaseService.updatePassword(password);
      if (error) throw error;
      alert("Password updated successfully! You can now sign in.");
      
      // Sign out to clean the current auth state session
      await supabaseService.signOut();
      
      navigate("/login");
    } catch (err: any) {
      alert("Error updating password: " + err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative font-sans overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-amber-600/10 blur-[130px] pointer-events-none" />
      <div className="absolute bottom-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-violet-600/10 blur-[130px] pointer-events-none" />

      {/* Main Container */}
      <div className="relative w-full max-w-md bg-slate-900/40 border border-slate-800 rounded-3xl p-8 backdrop-blur-xl shadow-2xl">
        <div className="flex flex-col items-center mb-8">
          <div className="w-12 h-12 rounded-2xl bg-amber-500 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-4 cursor-pointer" onClick={() => navigate("/")}>
            <PenTool className="w-6 h-6 text-slate-950" />
          </div>
          <h2 className="text-2xl font-bold text-white tracking-tight">Create New Password</h2>
          <p className="text-slate-400 text-sm mt-1">Enter your new secure password below</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-11 pr-10 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-500 hover:text-slate-300"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">Confirm New Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-slate-500">
                <Lock className="w-4 h-4" />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950/60 border border-slate-800 focus:border-amber-500 focus:ring-1 focus:ring-amber-500 rounded-xl py-3 pl-11 pr-10 text-sm text-slate-200 placeholder-slate-500 transition-all outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3.5 rounded-xl bg-amber-500 text-slate-950 font-semibold text-sm hover:bg-amber-400 active:bg-amber-600 transition-all flex items-center justify-center gap-2 shadow-lg shadow-amber-500/10 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" /> Saving Password...
              </>
            ) : (
              "Save Password"
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
