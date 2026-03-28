import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Wrench,
  Search,
  X,
  Plus,
  Phone,
  Percent,
  Edit2,
  Trash2,
  BookOpen,
  History,
  CheckCircle2,
  Receipt,
  ArrowUpRight,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Mechanic {
  id: string;
  name: string;
  phone: string;
  commissionRate: number;
  specialization: string | null;
  active: boolean;
  createdAt: string;
}

export default function Mechanics() {
  const [mechanics, setMechanics] = useState<Mechanic[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ name: '', phone: '', commissionRate: 5, specialization: '' });
  
  // Ledger & Settlement State
  const [selectedMechanicId, setSelectedMechanicId] = useState<string | null>(null);
  const [ledger, setLedger] = useState<{ entries: any[], summary: any } | null>(null);
  const [loadingLedger, setLoadingLedger] = useState(false);
  const [showSettlementModal, setShowSettlementModal] = useState(false);
  const [settlementForm, setSettlementForm] = useState({
    amount: '',
    periodFrom: new Date().toISOString().split('T')[0],
    periodTo: new Date().toISOString().split('T')[0],
    notes: ''
  });

  const fetchMechanics = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '100' };
      if (search) params.search = search;
      const res = await api.get('/mechanics', { params });
      setMechanics(res.data.data);
    } catch {
      toast.error('Failed to load mechanics');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchMechanics(); }, []);
  useEffect(() => {
    const timer = setTimeout(fetchMechanics, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.phone.trim()) { toast.error('Phone is required'); return; }
    try {
      if (editingId) {
        await api.put(`/mechanics/${editingId}`, form);
        toast.success('Mechanic updated');
      } else {
        await api.post('/mechanics', form);
        toast.success('Mechanic added');
      }
      setShowForm(false);
      setEditingId(null);
      setForm({ name: '', phone: '', commissionRate: 5, specialization: '' });
      fetchMechanics();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save mechanic');
    }
  };

  const handleEdit = (m: Mechanic) => {
    setForm({ name: m.name, phone: m.phone, commissionRate: m.commissionRate, specialization: m.specialization || '' });
    setEditingId(m.id);
    setShowForm(true);
  };

  const handleDelete = async (m: Mechanic) => {
    if (!confirm(`Delete mechanic "${m.name}"?`)) return;
    try {
      await api.delete(`/mechanics/${m.id}`);
      toast.success('Mechanic deleted');
      fetchMechanics();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };
  const fetchLedger = async (id: string) => {
    try {
      setLoadingLedger(true);
      const res = await api.get(`/mechanics/${id}/ledger`);
      setLedger(res.data.data);
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLoadingLedger(false);
    }
  };

  const handleSettle = async () => {
    if (!selectedMechanicId || !settlementForm.amount) return;
    try {
      await api.post(`/mechanics/${selectedMechanicId}/settlements`, {
        ...settlementForm,
        amount: parseFloat(settlementForm.amount)
      });
      toast.success('Settlement recorded');
      setShowSettlementModal(false);
      setSettlementForm({
        amount: '',
        periodFrom: new Date().toISOString().split('T')[0],
        periodTo: new Date().toISOString().split('T')[0],
        notes: ''
      });
      fetchLedger(selectedMechanicId);
      fetchMechanics(); // Refresh stats
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to settle');
    }
  };

  // Stats
  const activeMechanics = mechanics.filter((m) => m.active !== false);
  const avgCommission = activeMechanics.length > 0
    ? (activeMechanics.reduce((sum, m) => sum + m.commissionRate, 0) / activeMechanics.length).toFixed(1)
    : '0';

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { label: 'Total Mechanics', value: mechanics.length, color: 'text-ji-text' },
          { label: 'Active Mechanics', value: activeMechanics.length, color: 'text-emerald-600' },
          { label: 'Avg Commission', value: `${avgCommission}%`, color: 'text-ji-amber' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-ji-surface border border-ji-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow"
          >
            <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-wider">{stat.label}</p>
            <p className={`text-2xl font-bold font-['JetBrains_Mono'] mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Filters + Add */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-ji-text-dim" />
          <input
            type="text"
            placeholder="Search mechanics by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-ji-surface border border-ji-border rounded-xl text-ji-text text-sm placeholder:text-ji-text-dim focus:border-ji-amber focus:ring-1 focus:ring-ji-amber/20 outline-none transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-ji-text-dim hover:text-ji-text transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
        <button
          onClick={() => { setShowForm(true); setEditingId(null); setForm({ name: '', phone: '', commissionRate: 5, specialization: '' }); }}
          className="flex items-center justify-center gap-2 px-6 py-2.5 bg-ji-amber hover:bg-ji-amber/90 text-white font-bold rounded-xl transition-all text-sm shadow-md active:scale-[0.98]"
        >
          <Plus size={18} /> Add Mechanic
        </button>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <motion.div 
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: 'auto' }}
          className="bg-ji-surface border border-ji-border rounded-xl p-5 shadow-sm"
        >
          <div className="flex items-center gap-2 mb-4">
            <Wrench size={16} className="text-ji-amber" />
            <h3 className="text-sm font-bold text-ji-text uppercase tracking-wider">
              {editingId ? 'Edit Mechanic Details' : 'Register New Mechanic'}
            </h3>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
            <div className="space-y-1">
              <label className="text-[10px] text-ji-text-dim uppercase font-bold ml-1">Name</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Full name"
                className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text placeholder:text-ji-text-muted focus:border-ji-amber outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-ji-text-dim uppercase font-bold ml-1">Phone</label>
              <input
                type="text"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
                className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text placeholder:text-ji-text-muted focus:border-ji-amber outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-ji-text-dim uppercase font-bold ml-1">Commission %</label>
              <input
                type="number"
                value={form.commissionRate}
                onChange={(e) => setForm({ ...form, commissionRate: parseFloat(e.target.value) || 0 })}
                placeholder="Commission %"
                className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text placeholder:text-ji-text-muted focus:border-ji-amber outline-none transition-all"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] text-ji-text-dim uppercase font-bold ml-1">Specialization</label>
              <input
                type="text"
                value={form.specialization}
                onChange={(e) => setForm({ ...form, specialization: e.target.value })}
                placeholder="Specialization (optional)"
                className="w-full px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text placeholder:text-ji-text-muted focus:border-ji-amber outline-none transition-all"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-5">
            <button
              onClick={() => { setShowForm(false); setEditingId(null); }}
              className="px-4 py-2 text-xs font-bold text-ji-text-dim hover:text-ji-text border border-ji-border rounded-lg transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="px-6 py-2 text-xs bg-ji-amber hover:bg-ji-amber/90 text-white font-bold rounded-lg transition-all shadow-md active:scale-[0.98]"
            >
              {editingId ? 'Update Mechanic' : 'Save Mechanic'}
            </button>
          </div>
        </motion.div>
      )}

      {/* Table */}
      <div className="bg-ji-surface border border-ji-border rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-ji-bg/50 border-b border-ji-border">
                {['Name', 'Phone', 'Commission', 'Specialization', 'Added On', 'Status', ''].map((h) => (
                  <th key={h} className="text-left px-6 py-4 text-[10px] text-ji-text-dim font-bold uppercase tracking-wider">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ji-border">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-16 text-ji-text-dim">
                    <div className="flex flex-col items-center justify-center gap-3">
                      <div className="w-8 h-8 border-2 border-ji-amber border-t-transparent rounded-full animate-spin" />
                      <p className="text-xs font-medium uppercase tracking-widest">Loading database...</p>
                    </div>
                  </td>
                </tr>
              ) : mechanics.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-16">
                    <div className="max-w-[200px] mx-auto opacity-40 grayscale mb-4">
                      <Wrench size={48} className="mx-auto text-ji-text-dim" />
                    </div>
                    <p className="text-ji-text font-bold">No mechanics found</p>
                    <p className="text-ji-text-dim text-xs mt-1">Register a new mechanic to get started</p>
                  </td>
                </tr>
              ) : (
                mechanics.map((m, index) => (
                  <motion.tr
                    key={m.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: index * 0.02 }}
                    className="hover:bg-ji-bg transition-colors group"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-ji-amber/10 border border-ji-amber/20 flex items-center justify-center shrink-0">
                          <Wrench size={14} className="text-ji-amber" />
                        </div>
                        <span className="text-sm text-ji-text font-bold">{m.name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-ji-text-dim font-['JetBrains_Mono'] font-bold">
                        <Phone size={12} className="text-ji-text-muted" />
                        {m.phone}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-bold bg-ji-amber/10 text-ji-amber border border-ji-amber/20 font-['JetBrains_Mono']">
                        <Percent size={10} /> {m.commissionRate}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-xs text-ji-text-dim font-medium lowercase italic">{m.specialization || 'generalist'}</td>
                    <td className="px-6 py-4 text-xs text-ji-text-dim font-['JetBrains_Mono']">
                      {new Date(m.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                    </td>
                    <td className="px-6 py-4">
                      <button
                        onClick={() => { setSelectedMechanicId(m.id); fetchLedger(m.id); }}
                        className="flex items-center gap-2 px-3 py-1.5 bg-ji-surface border border-ji-border text-ji-amber hover:border-ji-amber/50 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all shadow-sm active:scale-95"
                      >
                        <History size={12} /> Ledger
                      </button>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity justify-end">
                        <button
                          onClick={() => handleEdit(m)}
                          className="p-2 rounded-lg hover:bg-ji-amber/10 text-ji-text-dim hover:text-ji-amber transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(m)}
                          className="p-2 rounded-lg hover:bg-red-500/10 text-ji-text-dim hover:text-red-500 transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* ─── Ledger Slide-over ───────────────────── */}
      <AnimatePresence>
        {selectedMechanicId && (
          <div className="fixed inset-0 z-50 flex items-center justify-end overflow-hidden">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }} 
              onClick={() => { setSelectedMechanicId(null); setLedger(null); }}
              className="absolute inset-0 bg-ji-text/20 backdrop-blur-sm" 
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-2xl h-full bg-ji-bg border-l border-ji-border shadow-2xl flex flex-col"
            >
              {/* Header */}
              <div className="p-8 border-b border-ji-border flex items-center justify-between bg-white shadow-sm">
                <div className="flex items-center gap-5">
                  <div className="w-14 h-14 rounded-2xl bg-ji-amber/10 border border-ji-amber/20 flex items-center justify-center">
                    <History className="text-ji-amber" size={28} />
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-ji-text font-['Playfair_Display']">
                      {mechanics.find(m => m.id === selectedMechanicId)?.name}
                    </h2>
                    <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-[0.2em] mt-1.5 flex items-center gap-2">
                       <BookOpen size={10} /> Commission & Settlement Ledger
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => { setSelectedMechanicId(null); setLedger(null); }}
                  className="p-2.5 hover:bg-ji-bg rounded-full text-ji-text-dim hover:text-ji-text transition-all active:scale-90"
                >
                  <X size={24} />
                </button>
              </div>

              {loadingLedger ? (
                <div className="flex-1 flex flex-col items-center justify-center text-ji-text-dim">
                  <div className="w-12 h-12 border-4 border-ji-amber border-t-transparent rounded-full animate-spin mb-4" />
                  <p className="font-bold text-xs uppercase tracking-widest">Compiling history...</p>
                </div>
              ) : ledger ? (
                <div className="flex-1 overflow-y-auto p-8 space-y-8 bg-slate-50/50">
                  {/* Summary Cards */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
                    <div className="bg-ji-surface border border-ji-border rounded-2xl p-5 shadow-sm">
                      <p className="text-[10px] text-ji-text-dim uppercase font-bold tracking-tighter mb-1.5">Total Accrued</p>
                      <p className="text-xl font-['JetBrains_Mono'] font-bold text-ji-text">₹{ledger.summary.totalEarned.toLocaleString()}</p>
                    </div>
                    <div className="bg-ji-surface border border-ji-border rounded-2xl p-5 shadow-sm">
                      <p className="text-[10px] text-ji-text-dim uppercase font-bold tracking-tighter mb-1.5">Total Settled</p>
                      <p className="text-xl font-['JetBrains_Mono'] font-bold text-emerald-600">₹{ledger.summary.totalSettled.toLocaleString()}</p>
                    </div>
                    <div className="bg-ji-amber/10 border border-ji-amber/20 rounded-2xl p-5 shadow-sm">
                      <p className="text-[10px] text-ji-amber uppercase font-bold tracking-tighter mb-1.5">Current Balance</p>
                      <p className="text-xl font-['JetBrains_Mono'] font-bold text-ji-amber">₹{ledger.summary.balancePayable.toLocaleString()}</p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-ji-text flex items-center gap-2 uppercase tracking-widest">
                      <History size={14} className="text-ji-text-dim" /> Transaction Timeline
                    </h3>
                    <button 
                      onClick={() => setShowSettlementModal(true)}
                      className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold rounded-xl transition-all shadow-lg shadow-emerald-600/10 active:scale-95"
                    >
                      <Plus size={14} /> Record Settlement
                    </button>
                  </div>

                  {/* Ledger Table */}
                  <div className="bg-ji-surface border border-ji-border rounded-2xl overflow-hidden shadow-sm">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-sm whitespace-nowrap">
                        <thead>
                          <tr className="bg-ji-bg/80 text-[10px] text-ji-text-dim uppercase tracking-widest border-b border-ji-border">
                            <th className="px-6 py-4 font-bold">Date</th>
                            <th className="px-6 py-4 font-bold">Details</th>
                            <th className="px-6 py-4 font-bold text-right">Amount</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-ji-border/50">
                          {ledger.entries.length === 0 ? (
                            <tr>
                              <td colSpan={3} className="px-6 py-16 text-center text-ji-text-dim font-medium italic">No transactions recorded for this period</td>
                            </tr>
                          ) : (
                            ledger.entries.map((entry: any) => (
                              <tr key={entry.id} className="hover:bg-ji-bg/30 transition-colors group">
                                <td className="px-6 py-5 text-ji-text font-['JetBrains_Mono'] font-bold text-xs">
                                  {new Date(entry.date).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                                </td>
                                <td className="px-6 py-5">
                                  <div className="flex items-center gap-2.5">
                                    {entry.type === 'INVOICE' ? (
                                      <div className="w-6 h-6 rounded bg-blue-500/10 flex items-center justify-center">
                                        <ArrowUpRight size={12} className="text-blue-600" />
                                      </div>
                                    ) : (
                                      <div className="w-6 h-6 rounded bg-emerald-500/10 flex items-center justify-center">
                                        <CheckCircle2 size={12} className="text-emerald-600" />
                                      </div>
                                    )}
                                    <span className="text-ji-text font-bold text-xs uppercase tracking-tight">{entry.reference}</span>
                                  </div>
                                  {entry.notes && <p className="text-[10px] text-ji-text-dim mt-1.5 ml-[34px] italic">{entry.notes}</p>}
                                </td>
                                <td className={`px-6 py-5 text-right font-['JetBrains_Mono'] font-bold ${
                                  entry.type === 'INVOICE' ? 'text-ji-text' : 'text-emerald-600'
                                }`}>
                                  {entry.type === 'SETTLEMENT' ? '−' : '+'}₹{Math.abs(entry.amount).toLocaleString()}
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="flex-1 flex flex-col items-center justify-center p-12 text-center bg-slate-50/50">
                   <div className="w-24 h-24 rounded-full bg-ji-bg border border-ji-border flex items-center justify-center mb-6 shadow-inner">
                      <Receipt size={40} className="text-ji-text-muted" />
                   </div>
                   <h3 className="text-ji-text font-bold text-lg">Select a mechanic</h3>
                   <p className="text-ji-text-dim text-sm max-w-[280px] mt-2 italic leading-relaxed">Choose a mechanic from the list to view their detailed transaction history and process settlements.</p>
                </div>
              )}
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* ─── Settlement Modal ─────────────────────────── */}
      <AnimatePresence>
        {showSettlementModal && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSettlementModal(false)} className="absolute inset-0 bg-ji-text/40 backdrop-blur-md" />
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white border border-ji-border rounded-3xl w-full max-w-md shadow-2xl overflow-hidden"
            >
              <div className="px-8 py-6 border-b border-ji-border flex items-center justify-between bg-white">
                <h2 className="text-xl font-bold text-ji-text flex items-center gap-3 font-['Playfair_Display']">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                    <Receipt className="text-emerald-600" size={18} />
                  </div>
                  Process Payout
                </h2>
                <button onClick={() => setShowSettlementModal(false)} className="text-ji-text-dim hover:text-ji-text transition-all active:scale-90">
                   <X size={24} />
                </button>
              </div>

              <div className="p-8 space-y-6">
                <div className="bg-emerald-600/5 border border-emerald-600/10 rounded-2xl p-6 text-center">
                  <p className="text-[10px] text-emerald-600/70 uppercase font-bold tracking-[0.2em] mb-2">Available Balance</p>
                  <p className="text-3xl font-['JetBrains_Mono'] font-bold text-emerald-600">₹{ledger?.summary.balancePayable.toLocaleString()}</p>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Payout Amount (₹)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-600 font-bold text-xl">₹</span>
                    <input
                      type="number"
                      value={settlementForm.amount}
                      onChange={(e) => setSettlementForm({ ...settlementForm, amount: e.target.value })}
                      className="w-full bg-ji-bg border border-ji-border rounded-2xl pl-10 pr-6 py-4 text-emerald-600 font-['JetBrains_Mono'] font-bold text-2xl focus:border-emerald-500 outline-none transition-all shadow-inner"
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Period From</label>
                    <input
                      type="date"
                      value={settlementForm.periodFrom}
                      onChange={(e) => setSettlementForm({ ...settlementForm, periodFrom: e.target.value })}
                      className="w-full bg-ji-bg border border-ji-border rounded-xl px-4 py-3 text-ji-text text-sm focus:border-ji-amber outline-none transition-all"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Period To</label>
                    <input
                      type="date"
                      value={settlementForm.periodTo}
                      onChange={(e) => setSettlementForm({ ...settlementForm, periodTo: e.target.value })}
                      className="w-full bg-ji-bg border border-ji-border rounded-xl px-4 py-3 text-ji-text text-sm focus:border-ji-amber outline-none transition-all"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Payout Notes</label>
                  <textarea
                    value={settlementForm.notes}
                    onChange={(e) => setSettlementForm({ ...settlementForm, notes: e.target.value })}
                    placeholder="e.g. UPI Transaction, Cash handed over..."
                    className="w-full bg-ji-bg border border-ji-border rounded-2xl px-5 py-4 text-ji-text text-sm focus:border-ji-amber outline-none h-28 resize-none transition-all shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <button
                    onClick={() => setShowSettlementModal(false)}
                    className="w-full py-4 bg-ji-bg border border-ji-border hover:bg-ji-border/30 text-ji-text font-bold rounded-2xl transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSettle}
                    disabled={!settlementForm.amount || parseFloat(settlementForm.amount) <= 0}
                    className="w-full py-4 bg-emerald-600 hover:bg-emerald-500 disabled:opacity-40 text-white font-bold rounded-2xl shadow-xl shadow-emerald-600/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Confirm Payout
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
