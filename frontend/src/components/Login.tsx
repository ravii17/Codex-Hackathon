import React, { useState } from 'react';
import { useDisputes } from '../context/DisputeContext';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Lock, Mail, Shield, Loader2 } from 'lucide-react';
import { Button, Card } from './PortalUI';

export const Login: React.FC = () => {
  const { login, showToast } = useDisputes();
  const [email, setEmail] = useState('david.k@amex.com');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (val: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!email.trim()) {
      const msg = 'Please enter your cardmember email address.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    if (!validateEmail(email)) {
      const msg = 'Please enter a valid cardmember email address.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    if (!password.trim()) {
      const msg = 'Please enter your account password.';
      setError(msg);
      showToast(msg, 'error');
      return;
    }

    setIsLoading(true);
    try {
      const signedIn = await login(email, password);
      if (!signedIn) {
        const msg = 'Authentication failed. Use david.k@amex.com with password123 to access this demo.';
        setError(msg);
        showToast(msg, 'error');
        setIsLoading(false);
      }
    } catch (err) {
      const msg = 'Authentication failed. Please verify credentials.';
      setError(msg);
      showToast(msg, 'error');
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f4f7fb] flex items-center justify-center p-4 font-sans">
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Card className="border border-slate-200 bg-white rounded-lg p-8 sm:p-10 shadow-[0_18px_40px_rgba(15,23,42,0.08)]">
          <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-[#016FD0] flex flex-col justify-between p-2.5 rounded border border-[#005eb8] mb-4">
              <span className="text-[9px] font-black text-white leading-none tracking-[0.18em]">AMER</span>
              <span className="text-[9px] font-black text-white leading-none text-right tracking-[0.18em] self-end">EXPR</span>
            </div>
            
            <h1 className="text-sm font-black text-slate-950 tracking-[0.18em] uppercase text-center mb-1">
              AMERICAN EXPRESS
            </h1>
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">
              Cardmember Services
            </p>
          </div>

          <div className="text-center mb-8">
            <h2 className="text-xl font-extrabold text-slate-950 tracking-tight">
              Sign In
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Access your dispute claims and recent statement activity.
            </p>
          </div>

          {error && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="mb-6 p-3.5 bg-rose-50 border border-rose-200 rounded text-rose-700 text-xs font-semibold flex items-start gap-2.5"
            >
              <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shrink-0 mt-1.5" />
              <span>{error}</span>
            </motion.div>
          )}

          <form onSubmit={handleSignIn} className="space-y-5 text-left text-xs font-semibold">
            <div className="space-y-2">
              <label htmlFor="email" className="font-extrabold text-slate-700 block uppercase tracking-wider text-[10px]">
                Email
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-[#016FD0] transition-colors">
                  <Mail className="w-4 h-4" />
                </span>
                <input
                  id="email"
                  type="text"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  placeholder="Enter email address"
                  className="w-full pl-11 pr-4 py-3 border border-slate-300 bg-white text-xs rounded outline-none focus:border-[#016FD0] focus:ring-2 focus:ring-[#016FD0]/15 text-slate-900 font-semibold transition-all placeholder-slate-400 disabled:opacity-50"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label htmlFor="password" className="font-extrabold text-slate-700 block uppercase tracking-wider text-[10px]">
                Password
              </label>
              <div className="relative group">
                <span className="absolute left-3.5 top-3 text-slate-400 group-focus-within:text-[#016FD0] transition-colors">
                  <Lock className="w-4 h-4" />
                </span>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (error) setError(null);
                  }}
                  disabled={isLoading}
                  placeholder="Enter password"
                  className="w-full pl-11 pr-11 py-3 border border-slate-300 bg-white text-xs rounded outline-none focus:border-[#016FD0] focus:ring-2 focus:ring-[#016FD0]/15 text-slate-900 font-semibold transition-all placeholder-slate-400 disabled:opacity-50"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  disabled={isLoading}
                  className="absolute right-3.5 top-3 text-slate-500 hover:text-slate-900 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff className="w-4.5 h-4.5" /> : <Eye className="w-4.5 h-4.5" />}
                </button>
              </div>
            </div>

            <div className="flex justify-between items-center text-[10px] text-slate-600 font-bold select-none pt-1">
              <label className="flex items-center gap-2 cursor-pointer hover:text-slate-900 transition-colors">
                <input type="checkbox" defaultChecked className="rounded border-slate-300 bg-white text-[#016FD0] focus:ring-[#016FD0] w-3.5 h-3.5 accent-[#016FD0]" />
                Remember Me
              </label>
              <button type="button" className="hover:text-[#016FD0] hover:underline transition-colors cursor-pointer">
                Forgot password?
              </button>
            </div>

            <div className="pt-2">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full py-3.5 text-xs font-black tracking-widest uppercase relative overflow-hidden rounded"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-white" />
                    Signing In...
                  </span>
                ) : (
                  'Sign In'
                )}
              </Button>
            </div>
          </form>

          <div className="mt-8 pt-6 border-t border-slate-200 flex items-center justify-center gap-2 text-slate-500 font-bold select-none text-[10px] tracking-wider uppercase">
            <span className="p-1 rounded bg-slate-100 border border-slate-200 text-[#016FD0] flex items-center justify-center">
              <Shield className="w-3.5 h-3.5" />
            </span>
            <span className="flex items-center gap-1">
              Secure American Express sign in
            </span>
          </div>
        </Card>
      </motion.div>
    </div>
  );
};
