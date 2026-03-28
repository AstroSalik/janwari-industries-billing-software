import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Skull,
  Search,
  Plus,
  X,
  Battery,
  Weight,
  FileText,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface GraveyardEntry {
  id: string;
  condition: 'DEAD' | 'DAMAGED' | 'REFURBISHABLE' | 'GOOD';
  estimatedWeight: number | null;
  sourceInvoiceNo: string | null;
  isSettled: boolean;
  createdAt: string;
  serialNumber: {
    serial: string;
    product: {
      name: string;
      brand: string;
    };
  } | null;
}

const conditionConfig = {
  DEAD: { color: 'text-ji-text-dim', bg: 'bg-ji-bg', label: 'DECOMMISSIONED' },
  DAMAGED: { color: 'text-red-500', bg: 'bg-red-50', label: 'STRUCTURAL DAMAGE' },
  REFURBISHABLE: { color: 'text-ji-amber', bg: 'bg-ji-amber/5', label: 'RESTORATION POTENTIAL' },
  GOOD: { color: 'text-emerald-600', bg: 'bg-emerald-50', label: 'OPERATIONAL' },
};

export default function Graveyard() {
  const [entries, setEntries] = useState<GraveyardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    serialNumberId: '', // Optional
    condition: 'DEAD' as const,
    estimatedWeight: '',
    sourceInvoiceNo: '',
  });

  const fetchEntries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/batteries/graveyard/list');
      setEntries(res.data.data);
    } catch {
      toast.error('Failed to load graveyard entries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchEntries(); }, []);

  const handleSave = async () => {
    try {
      const payload: any = { condition: form.condition };
      if (form.serialNumberId) payload.serialNumberId = form.serialNumberId;
      if (form.estimatedWeight) payload.estimatedWeight = parseFloat(form.estimatedWeight);
      if (form.sourceInvoiceNo) payload.sourceInvoiceNo = form.sourceInvoiceNo;

      await api.post('/batteries/graveyard', payload);
      toast.success('Battery added to graveyard');
      setShowForm(false);
      setForm({ serialNumberId: '', condition: 'DEAD', estimatedWeight: '', sourceInvoiceNo: '' });
      fetchEntries();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add battery');
    }
  };

  // Filter local search
  const filtered = entries.filter((e) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (
      e.serialNumber?.serial.toLowerCase().includes(q) ||
      e.serialNumber?.product.name.toLowerCase().includes(q) ||
      e.sourceInvoiceNo?.toLowerCase().includes(q)
    );
  });

  return (
    <div>
      {/* Header / Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Scrap Inventory', value: entries.length, icon: <Skull size={18} />, variant: 'default' },
          { label: 'Critical Failure', value: entries.filter((e) => e.condition === 'DEAD' || e.condition === 'DAMAGED').length, icon: <AlertCircle size={18} />, variant: 'danger' },
          { label: 'Salvageable', value: entries.filter((e) => e.condition === 'REFURBISHABLE').length, icon: <Battery size={18} />, variant: 'warning' },
          { label: 'Asset Settlement', value: entries.filter((e) => e.isSettled).length, icon: <CheckCircle2 size={18} />, variant: 'success' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-white border border-ji-border rounded-[2rem] shadow-sm relative overflow-hidden group"
          >
            <div className="absolute right-0 top-0 w-20 h-20 bg-ji-bg rounded-bl-[3rem] -mr-6 -mt-6 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center gap-4 mb-3 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                stat.variant === 'danger' ? 'bg-red-50 text-red-500 border border-red-100' :
                stat.variant === 'warning' ? 'bg-amber-50 text-ji-amber border border-ji-amber/20' :
                stat.variant === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                'bg-ji-bg text-ji-text-dim border border-ji-border/50'
              }`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            
            <p className={`text-2xl font-['JetBrains_Mono'] font-black tracking-tighter relative z-10 ${
              stat.variant === 'danger' ? 'text-red-600' : 
              stat.variant === 'warning' ? 'text-ji-amber' :
              stat.variant === 'success' ? 'text-emerald-600' : 'text-ji-text'
            }`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
          <input
            type="text"
            placeholder="Search Graveyard Analytics (Serial, Invoice, Asset)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-ji-border rounded-2xl text-ji-text text-xs font-bold placeholder:text-ji-text-dim/40 focus:border-ji-amber outline-none transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-ji-bg text-ji-text-dim transition-all">
              <X size={14} />
            </button>
          )}
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="px-8 py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-ji-amber/20 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Plus size={16} /> Asset Decommission
        </button>
      </div>

      {/* Add Form */}
      {showForm && (
        <motion.div
          initial={{ opacity: 0, scale: 0.98, y: -10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          className="bg-ji-bg border-2 border-dashed border-ji-border rounded-[2rem] p-8 mb-8 relative"
        >
          <div className="flex items-center justify-between mb-8">
             <div className="flex items-center gap-3">
               <div className="w-10 h-10 rounded-xl bg-ji-amber text-white flex items-center justify-center shadow-lg shadow-ji-amber/20">
                 <Plus size={20} />
               </div>
               <h3 className="text-xl font-['Playfair_Display'] font-black text-ji-text">Log Disposal Asset</h3>
             </div>
             <button onClick={() => setShowForm(false)} className="text-ji-text-dim hover:text-ji-text transition-colors">
               <X size={20} />
             </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Asset Serial (ID)</label>
              <input
                type="text"
                value={form.serialNumberId}
                onChange={(e) => setForm({ ...form, serialNumberId: e.target.value })}
                placeholder="Unique Track ID"
                className="w-full px-5 py-4 bg-white border border-ji-border rounded-xl text-xs font-bold text-ji-text focus:border-ji-amber outline-none transition-all shadow-sm"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Physical Condition</label>
              <select
                value={form.condition}
                onChange={(e: any) => setForm({ ...form, condition: e.target.value })}
                className="w-full px-5 py-4 bg-white border border-ji-border rounded-xl text-xs font-black text-ji-text focus:border-ji-amber outline-none cursor-pointer appearance-none shadow-sm"
              >
                <option value="DEAD">☠️ FULL SCRAP (DEAD)</option>
                <option value="DAMAGED">⚠️ STRUCTURAL DAMAGE</option>
                <option value="REFURBISHABLE">♻️ REFURBISHABLE</option>
                <option value="GOOD">✅ TESTED OPTIMAL</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Net Mass (KG)</label>
              <div className="relative">
                <Weight size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim" />
                <input
                  type="number"
                  step="0.1"
                  value={form.estimatedWeight}
                  onChange={(e) => setForm({ ...form, estimatedWeight: e.target.value })}
                  placeholder="0.00"
                  className="w-full pl-10 pr-5 py-4 bg-white border border-ji-border rounded-xl text-xs font-bold font-['JetBrains_Mono'] text-ji-text focus:border-ji-amber outline-none transition-all shadow-sm"
                />
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Reference Protocol</label>
              <div className="relative">
                <FileText size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim" />
                <input
                  type="text"
                  value={form.sourceInvoiceNo}
                  onChange={(e) => setForm({ ...form, sourceInvoiceNo: e.target.value })}
                  placeholder="JI/YYYY-YY/XXXX"
                  className="w-full pl-10 pr-5 py-4 bg-white border border-ji-border rounded-xl text-xs font-bold font-['JetBrains_Mono'] text-ji-text focus:border-ji-amber outline-none transition-all shadow-sm"
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSave}
              className="px-10 py-5 bg-ji-text text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl transition-all hover:bg-ji-amber active:scale-95"
            >
               Authorize Disposal Record
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-white border border-ji-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="border-b border-ji-border bg-ji-bg/30">
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em] w-1/3">Asset / Serial Audit</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">State Analysis</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">Mass (KG)</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">Procurement Ref</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">Liquidation</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">Ingress Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="text-center py-24 text-ji-text-dim">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-4 border-ji-amber border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Querying Scrap Vault...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-24">
                    <div className="w-16 h-16 bg-ji-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Skull size={32} className="text-ji-text-dim opacity-30" />
                    </div>
                    <p className="text-ji-text font-black uppercase tracking-widest text-sm">Graveyard Vacant</p>
                    <p className="text-[10px] text-ji-text-dim font-bold italic mt-2">No decommissioned hardware detected in current records</p>
                  </td>
                </tr>
              ) : (
                filtered.map((entry, i) => {
                  const conf = conditionConfig[entry.condition] || conditionConfig.DEAD;
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.01 }}
                      className="border-b border-ji-border/50 hover:bg-ji-bg transition-colors"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            entry.serialNumber ? 'bg-ji-amber/5 text-ji-amber' : 'bg-ji-bg text-ji-text-dim'
                          }`}>
                            <Battery size={18} />
                          </div>
                          <div>
                            <p className="text-sm font-black text-ji-text">
                              {entry.serialNumber?.product.name || 'Unknown Asset Specification'}
                            </p>
                            {entry.serialNumber && (
                              <p className="text-[10px] font-black font-['JetBrains_Mono'] text-ji-amber uppercase tracking-widest mt-1">
                                SN-ISO-{entry.serialNumber.serial}
                              </p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                         <span className={`inline-flex items-center px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${conf.bg} ${conf.color} border-current/20`}>
                            {conf.label}
                         </span>
                      </td>
                      <td className="px-8 py-6 text-sm font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                        {entry.estimatedWeight ? `${entry.estimatedWeight.toFixed(2)} KG` : 'N/A'}
                      </td>
                      <td className="px-8 py-6 text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] tracking-widest">
                        {entry.sourceInvoiceNo || 'DIRECT_INTAKE'}
                      </td>
                      <td className="px-8 py-6">
                        {entry.isSettled ? (
                          <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-emerald-600">
                             <CheckCircle2 size={12} /> Liquidated
                          </span>
                        ) : (
                          <span className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-ji-amber italic">
                             <AlertCircle size={12} /> Pending Settlement
                          </span>
                        )}
                      </td>
                      <td className="px-8 py-6 text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] tracking-widest">
                        {new Date(entry.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
