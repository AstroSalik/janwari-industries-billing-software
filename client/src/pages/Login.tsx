import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, LogIn, AlertCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import toast from 'react-hot-toast';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const { login, isLoading, error, clearError, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as any)?.from?.pathname || '/';
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  // Clear error when inputs change
  useEffect(() => {
    if (error) clearError();
  }, [username, password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username.trim() || !password.trim()) {
      toast.error('Please enter both username and password');
      return;
    }

    try {
      await login(username.trim(), password);
      toast.success('Welcome to Janwari Industries!');
    } catch (err: any) {
      toast.error(err.message || error || 'Login failed.');
    }
  };

  return (
    <div className="min-h-screen bg-ji-bg flex items-center justify-center relative overflow-hidden">
      {/* Dynamic Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none opacity-40">
        <div className="absolute top-[-10%] right-[-10%] w-[40vw] h-[40vw] bg-ji-amber/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[30vw] h-[30vw] bg-emerald-500/5 rounded-full blur-[100px]" />
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-[480px] mx-6 relative z-10"
      >
        <div className="bg-white border border-ji-border rounded-[3.5rem] p-12 shadow-2xl shadow-ji-text/5 relative group overflow-hidden">
          {/* Subtle Scanline Animation */}
          <div className="absolute inset-0 bg-gradient-to-b from-transparent via-ji-amber/5 to-transparent h-24 w-full -translate-y-full group-hover:animate-[scan_4s_linear_infinite] pointer-events-none opacity-30" />

          <div className="relative z-10 space-y-10">
            {/* Branding Core */}
            <div className="text-center space-y-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: 0.2, duration: 0.6 }}
                className="w-24 h-24 bg-white rounded-[2.5rem] mx-auto p-1 border border-ji-border shadow-2xl shadow-ji-amber/10 flex items-center justify-center overflow-hidden bg-white group-hover:rotate-12 transition-transform duration-700"
              >
                <img src="ji-logo.jpg" alt="Janwari Industries" className="w-full h-full object-contain" />
              </motion.div>
              
              <div className="space-y-1">
                <h1 className="text-4xl font-black text-ji-text tracking-tighter uppercase font-['Playfair_Display']">
                   Janwari<span className="text-ji-amber">.</span>BIZ
                </h1>
                <p className="text-[10px] text-ji-text-dim font-black tracking-[0.4em] uppercase opacity-60">
                  Industrial Intelligence System
                </p>
              </div>
            </div>

            {/* Ingress Protocol */}
            <form onSubmit={handleSubmit} className="space-y-6">
              <AnimatePresence mode="wait">
                {error && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 text-red-600 border border-red-100 mb-2 overflow-hidden"
                  >
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <p className="text-[11px] font-black uppercase tracking-tight">{error}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              <div className="space-y-5">
                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em] ml-4 group-focus-within:text-ji-amber transition-colors">Credential_ID</label>
                  <div className="relative">
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="OPERATOR_IDENTITY"
                      className="w-full bg-ji-bg border border-ji-border rounded-2xl px-6 py-4.5 text-sm font-black text-ji-text placeholder:text-ji-text-dim/30 focus:border-ji-amber outline-none transition-all shadow-inner uppercase tracking-widest"
                    />
                  </div>
                </div>

                <div className="space-y-2 group">
                  <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em] ml-4 group-focus-within:text-ji-amber transition-colors">Access_Token</label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••••••••••"
                      className="w-full bg-ji-bg border border-ji-border rounded-2xl px-6 py-4.5 text-sm font-black text-ji-text focus:border-ji-amber outline-none transition-all shadow-inner"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 text-ji-text-dim/40 hover:text-ji-amber transition-colors active:scale-90"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-16 bg-ji-amber hover:bg-ji-amber/90 disabled:opacity-50 text-white font-black rounded-2xl transition-all shadow-xl shadow-ji-amber/20 flex items-center justify-center gap-3 group active:scale-[0.98] uppercase tracking-[0.3em] text-[11px]"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Initialize_Session
                    <LogIn size={18} className="group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-4 text-center border-t border-ji-border/50">
               <p className="text-[9px] font-black text-ji-text-dim uppercase tracking-[0.4em] opacity-40">
                  Secure Access Node v2.0.4 // Sopore, Jammu & Kashmir
               </p>
            </div>
          </div>
        </div>

        {/* Legal Trace */}
        <div className="mt-10 flex items-center justify-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-700">
           <img src="ji-logo.jpg" alt="Trace" className="h-6 w-auto" />
           <p className="text-[9px] font-black text-ji-text uppercase tracking-widest">
             © {new Date().getFullYear()} Janwari Industries · Industrial Estate
           </p>
        </div>
      </motion.div>

      {/* Background Aesthetic Text */}
      <div className="absolute bottom-10 right-10 pointer-events-none opacity-[0.03] select-none">
         <div className="text-[120px] font-black uppercase leading-none tracking-tighter">JI.INDUSTRIES</div>
      </div>
    </div>
  );
}
