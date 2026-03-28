import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Database, 
  Download, 
  Upload, 
  AlertTriangle, 
  CheckCircle2,
  Lock,
  User,
  ShieldAlert
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAuthStore } from '../stores/authStore';

export default function Settings() {
  const user = useAuthStore((s) => s.user);
  const [activeTab, setActiveTab] = useState<'backups' | 'profile'>('backups');
  const [isRestoring, setIsRestoring] = useState(false);
  const [file, setFile] = useState<File | null>(null);

  const handleDownloadBackup = async () => {
    try {
      const res = await api.get('/backup/download', { responseType: 'blob' });
      // Create blob link to download
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      const date = new Date().toISOString().replace(/[:.]/g, '-');
      link.setAttribute('download', `janwari-backup-${date}.sqlite`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Backup downloaded successfully!');
    } catch (err: any) {
      toast.error('Failed to download backup. You may not have permission.');
    }
  };

  const handleRestore = async () => {
    if (!file) return;
    
    if (!confirm('CRITICAL WARNING: This will overwrite the entire database. All current data will be lost and replaced with the backup file. This cannot be undone. Are you absolutely sure?')) {
      return;
    }

    setIsRestoring(true);
    try {
      // Read file as ArrayBuffer
      const buffer = await file.arrayBuffer();
      
      await api.post('/backup/restore', buffer, {
        headers: {
          'Content-Type': 'application/octet-stream',
        }
      });
      
      toast.success('Database restored successfully! Reloading...');
      setTimeout(() => {
        window.location.reload();
      }, 1500);
      
    } catch (err: any) {
      console.error(err);
      toast.error(err.response?.data?.error || 'Failed to restore database');
    } finally {
      setIsRestoring(false);
      setFile(null);
    }
  };

  if (user?.role !== 'ADMIN') {
    return (
      <div className="flex flex-col items-center justify-center py-32 text-center">
        <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mb-6 border border-red-100">
          <ShieldAlert className="text-red-500" size={40} />
        </div>
        <h2 className="text-3xl font-bold font-['Playfair_Display'] text-ji-text mb-3">Access Denied</h2>
        <p className="text-ji-text-dim font-medium max-w-sm italic">
          You do not have administrative privileges to access the system settings or database backups.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-5xl mx-auto space-y-8"
    >
      <div>
        <h1 className="text-3xl font-bold font-['Playfair_Display'] text-ji-text">
          System Settings
        </h1>
        <p className="text-sm text-ji-text-dim font-bold uppercase tracking-widest mt-2 flex items-center gap-2">
          <Database size={14} /> Mission Critical Configuration
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-10">
        {/* Sidebar Nav */}
        <div className="w-full lg:w-72 shrink-0 space-y-2">
          {[
            { id: 'backups', label: 'Safety & Backups', icon: Database },
            { id: 'profile', label: 'System Profile', icon: User },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`w-full flex items-center gap-4 px-6 py-4 rounded-2xl text-sm font-bold transition-all ${
                activeTab === tab.id 
                  ? 'bg-ji-amber text-white shadow-lg shadow-ji-amber/20' 
                  : 'text-ji-text-dim hover:text-ji-text hover:bg-ji-surface border border-transparent hover:border-ji-border'
              }`}
            >
              <tab.icon size={20} />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content Area */}
        <div className="flex-1">
          <AnimatePresence mode="wait">
            {activeTab === 'backups' && (
              <motion.div 
                key="backups"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="space-y-8"
              >
                {/* Download Backup */}
                <div className="bg-white border border-ji-border p-8 rounded-3xl shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
                  <div className="flex items-start gap-6 mb-8 relative z-10">
                    <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center shrink-0 border border-blue-100">
                      <Download size={28} className="text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ji-text mb-2">Export Data Archive</h3>
                      <p className="text-sm text-ji-text-dim leading-relaxed font-medium">
                        Securely download a complete snapshot of your entire business database (.sqlite format). 
                        This file contains every invoice, customer, and inventory record.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleDownloadBackup}
                    className="flex items-center gap-3 bg-ji-surface hover:bg-ji-bg border border-ji-border text-ji-text px-8 py-3.5 rounded-2xl font-bold transition-all text-sm shadow-sm active:scale-95"
                  >
                    <Download size={18} className="text-blue-600" />
                    Secure Export Snapshot
                  </button>
                </div>

                {/* Restore Backup */}
                <div className="bg-white border border-red-100 p-8 rounded-3xl shadow-sm relative overflow-hidden group">
                  <div className="absolute top-0 left-0 w-full h-1.5 bg-red-500/20"></div>
                  
                  <div className="flex items-start gap-6 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-red-50 flex items-center justify-center shrink-0 border border-red-100">
                      <AlertTriangle size={28} className="text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-ji-text mb-2">Database Restoration</h3>
                      <p className="text-sm text-red-600/70 leading-relaxed font-bold uppercase tracking-tight">
                        Warning: This will permanently overwrite current data.
                      </p>
                      <p className="text-xs text-ji-text-dim mt-2 leading-relaxed">
                        Restoring replaces the entire system state with the backup file. Any changes made after the backup was taken will be lost forever.
                      </p>
                    </div>
                  </div>

                  <div className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-ji-border border-dashed">
                    <div className="space-y-3">
                      <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Attach Backup File (.sqlite)</label>
                      <input
                        type="file"
                        accept=".sqlite,.db"
                        onChange={(e) => setFile(e.target.files?.[0] || null)}
                        className="block w-full text-sm text-ji-text-dim
                          file:mr-4 file:py-2.5 file:px-6
                          file:rounded-xl file:border-0
                          file:text-xs file:font-bold file:uppercase
                          file:bg-ji-text file:text-white
                          hover:file:bg-ji-text/90 transition-all
                          bg-white border border-ji-border rounded-xl
                          focus:outline-none focus:border-red-500 shadow-sm"
                      />
                    </div>
                    
                    {file && (
                      <motion.div 
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="flex items-center gap-3 text-xs text-emerald-600 bg-emerald-50 p-4 rounded-xl border border-emerald-100 font-bold"
                      >
                        <CheckCircle2 size={16} />
                        File Staged: <span className="font-['JetBrains_Mono']">{file.name}</span> ({Math.round(file.size / 1024)} KB)
                      </motion.div>
                    )}

                    <button
                      onClick={handleRestore}
                      disabled={!file || isRestoring}
                      className="w-full sm:w-auto flex items-center justify-center gap-3 bg-red-600 hover:bg-red-500 text-white px-10 py-4 rounded-2xl font-bold transition-all text-sm disabled:opacity-40 disabled:grayscale shadow-xl shadow-red-600/10 active:scale-95"
                    >
                      {isRestoring ? (
                        <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
                      ) : (
                        <Upload size={18} />
                      )}
                      {isRestoring ? 'Restoring System State...' : 'Commit Database Overwrite'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile"
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                className="bg-white border border-ji-border p-8 rounded-3xl shadow-sm space-y-8"
              >
                <div className="flex items-start gap-6">
                  <div className="w-16 h-16 rounded-2xl bg-ji-amber/10 flex items-center justify-center shrink-0 border border-ji-amber/20">
                    <User size={32} className="text-ji-amber" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-ji-text font-['Playfair_Display']">Operational Profile</h3>
                    <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-[0.2em] mt-2 italic leading-relaxed">
                      Authenticated administrative session parameters.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Operator Name</label>
                    <div className="px-5 py-4 bg-ji-bg border border-ji-border rounded-2xl text-ji-text font-bold shadow-inner">
                      {user?.name}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Access Credential</label>
                    <div className="px-5 py-4 bg-ji-bg border border-ji-border rounded-2xl text-ji-text font-['JetBrains_Mono'] font-bold shadow-inner flex items-center gap-2">
                      <Lock size={14} className="text-ji-text-dim" />
                      {user?.username}
                    </div>
                  </div>
                  <div className="space-y-2 col-span-1 md:col-span-2">
                    <label className="text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Assigned Privilege Rule</label>
                    <div className="px-5 py-4 bg-ji-amber/5 border border-ji-amber/20 rounded-2xl flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-ji-amber animate-pulse shadow-[0_0_8px_rgba(245,158,11,0.5)]" />
                      <p className="text-ji-amber font-black uppercase tracking-widest text-sm">{user?.role}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </motion.div>
  );
}
