import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Search,
  X,
  Plus,
  History,
  AlertCircle,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

interface CustomerKhata {
  id: string;
  name: string;
  phone: string;
  type: string;
  outstandingBalance: number;
  entryCount: number;
}

interface KhataEntry {
  id: string;
  amount: number;
  type: 'DEBIT' | 'CREDIT' | 'ADVANCE';
  notes: string | null;
  createdAt: string;
  runningBalance: number;
  invoice?: { invoiceNumber: string } | null;
}

export default function Khata() {
  const [customers, setCustomers] = useState<CustomerKhata[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modal State
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);
  const [ledgerLoading, setLedgerLoading] = useState(false);
  const [ledgerData, setLedgerData] = useState<{
    customer?: any;
    entries: KhataEntry[];
  } | null>(null);

  // Add Entry Form
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ amount: '', type: 'CREDIT', notes: '' });

  const fetchSummary = async () => {
    try {
      setLoading(true);
      const res = await api.get('/khata/summary');
      setCustomers(res.data.data);
    } catch {
      toast.error('Failed to load Khata summary');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchSummary(); }, []);

  const fetchLedger = async (customerId: string) => {
    try {
      setLedgerLoading(true);
      const res = await api.get(`/khata/customer/${customerId}`);
      setLedgerData(res.data.data);
    } catch {
      toast.error('Failed to load ledger');
    } finally {
      setLedgerLoading(false);
    }
  };

  const handleOpenLedger = (customerId: string) => {
    setSelectedCustomerId(customerId);
    setShowForm(false);
    fetchLedger(customerId);
  };

  const handleSaveEntry = async () => {
    if (!form.amount || isNaN(Number(form.amount))) {
      toast.error('Invalid amount');
      return;
    }
    
    try {
      await api.post('/khata', {
        customerId: selectedCustomerId,
        type: form.type,
        amount: parseFloat(form.amount),
        notes: form.notes,
      });
      toast.success('Entry recorded');
      setShowForm(false);
      setForm({ amount: '', type: 'CREDIT', notes: '' });
      
      // Refresh both ledger and main summary
      fetchLedger(selectedCustomerId!);
      fetchSummary();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save entry');
    }
  };

  // Filtered Summary
  const activeKhataCustomers = customers.filter(c => c.outstandingBalance > 0 || c.entryCount > 0);
  const filtered = activeKhataCustomers.filter(c => {
    if (!search) return true;
    const q = search.toLowerCase();
    return c.name.toLowerCase().includes(q) || c.phone.includes(q);
  });

  const totalOutstanding = activeKhataCustomers.reduce((sum, c) => sum + Math.max(0, c.outstandingBalance), 0);
  const totalAdvance = activeKhataCustomers.reduce((sum, c) => sum + Math.abs(Math.min(0, c.outstandingBalance)), 0);

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
        {[
          { label: 'Total Outstanding', value: formatINR(totalOutstanding), color: 'text-ji-amber', bg: 'bg-ji-amber/5' },
          { label: 'Total Advances', value: formatINR(totalAdvance), color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Accounts', value: activeKhataCustomers.length.toString(), color: 'text-ji-text', bg: 'bg-slate-50' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bg} rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
            <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] mb-1 relative z-10">{stat.label}</p>
            <p className={`text-2xl font-black font-['JetBrains_Mono'] tracking-tighter relative z-10 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* Main List view */}
      <div className="flex items-center gap-3 mb-8">
        <div className="relative flex-1 max-w-md">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim" />
          <input
            type="text"
            placeholder="Filter Ledger by name or contact..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-ji-border rounded-2xl text-sm font-bold text-ji-text placeholder:text-ji-text-dim focus:border-ji-amber focus:outline-none transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ji-bg text-ji-text-dim hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      <div className="bg-white border border-ji-border rounded-[2rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="bg-ji-bg/50 border-b border-ji-border">
                <th className="text-left px-8 py-5 text-[10px] text-ji-text-dim font-black uppercase tracking-widest">Customer Entity</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text-dim font-black uppercase tracking-widest">Classification</th>
                <th className="text-right px-8 py-5 text-[10px] text-ji-text-dim font-black uppercase tracking-widest">Outstanding Position</th>
                <th className="text-center px-8 py-5 text-[10px] text-ji-text-dim font-black uppercase tracking-widest">Events</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-20 text-ji-text-dim">
                    <div className="w-6 h-6 border-2 border-ji-amber border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                     Synchronizing Ledger...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-24">
                    <div className="w-16 h-16 bg-ji-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <BookOpen size={32} className="text-ji-text-dim" />
                    </div>
                    <p className="text-ji-text font-black uppercase tracking-widest text-sm">No Ledger History</p>
                    <p className="text-[10px] text-ji-text-dim font-bold mt-2 italic">Records are clear for the current selection.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((c, i) => (
                  <motion.tr
                    key={c.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    onClick={() => handleOpenLedger(c.id)}
                    className="border-b border-ji-border/50 hover:bg-ji-bg transition-colors cursor-pointer group"
                  >
                    <td className="px-8 py-6">
                      <div className="flex flex-col">
                        <span className="text-sm font-black text-ji-text group-hover:text-ji-amber transition-colors">{c.name}</span>
                        <span className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] mt-1 tracking-wider">{c.phone}</span>
                      </div>
                    </td>
                    <td className="px-8 py-6">
                      <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest px-3 py-1 bg-ji-bg rounded-lg">
                        {c.type}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-black font-['JetBrains_Mono'] ${
                          c.outstandingBalance > 0 ? 'text-ji-amber' 
                          : c.outstandingBalance < 0 ? 'text-emerald-600' 
                          : 'text-ji-text-dim'
                        }`}>
                          {formatINR(Math.abs(c.outstandingBalance))}
                          {c.outstandingBalance < 0 && <span className="text-[9px] ml-1 opacity-60">ADV</span>}
                        </span>
                      </div>
                    </td>
                    <td className="px-8 py-6 text-center">
                      <span className="inline-flex items-center justify-center bg-ji-text text-white text-[10px] font-black px-3 py-1 rounded-lg">
                        {c.entryCount}
                      </span>
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Ledger Modal */}
      <AnimatePresence>
        {selectedCustomerId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedCustomerId(null)}
              className="fixed inset-0 bg-ji-text/10 backdrop-blur-md z-40"
            />
            <motion.div
              initial={{ opacity: 0, x: '100%' }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full sm:w-[500px] bg-white border-l border-ji-border z-50 flex flex-col shadow-2xl"
            >
              {ledgerLoading || !ledgerData ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
                </div>
              ) : (
                <>
                  {/* Header */}
                  <div className="p-8 border-b border-ji-border bg-ji-bg/30">
                    <div className="flex items-start justify-between mb-8">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-white border border-ji-border flex items-center justify-center shadow-sm">
                          <History size={24} className="text-ji-amber" />
                        </div>
                        <div>
                          <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text tracking-tight">
                            {ledgerData.customer?.name}
                          </h2>
                          <p className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] mt-1 flex items-center gap-2 uppercase tracking-widest">
                            <span className="w-1.5 h-1.5 rounded-full bg-ji-amber" />
                            {ledgerData.customer?.phone}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setSelectedCustomerId(null)}
                        className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-ji-text hover:bg-ji-bg transition-all border border-ji-border"
                      >
                        <X size={20} />
                      </button>
                    </div>

                    <div className="p-6 bg-white rounded-3xl border border-ji-border shadow-sm flex items-center justify-between relative overflow-hidden group">
                      <div className="absolute top-0 right-0 w-16 h-16 bg-ji-bg rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110" />
                      <div className="relative z-10">
                        <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] mb-1">Financial Position</p>
                        <p className={`text-3xl font-black font-['JetBrains_Mono'] tracking-tighter ${
                          ledgerData.customer?.currentBalance > 0 ? 'text-ji-amber' 
                          : ledgerData.customer?.currentBalance < 0 ? 'text-emerald-600' 
                          : 'text-ji-text'
                        }`}>
                          {formatINR(Math.abs(ledgerData.customer?.currentBalance || 0))}
                          {ledgerData.customer?.currentBalance < 0 && <span className="text-xs ml-2 opacity-60">ADV</span>}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowForm(!showForm)}
                        className="relative z-10 w-12 h-12 flex items-center justify-center bg-ji-amber text-white rounded-2xl shadow-lg shadow-ji-amber/25 hover:scale-105 transition-transform"
                      >
                        <Plus size={24} />
                      </button>
                    </div>

                    {/* Add Entry Form Slide-down */}
                    <AnimatePresence>
                      {showForm && (
                        <motion.div
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: 'auto' }}
                          exit={{ opacity: 0, height: 0 }}
                          className="mt-6 overflow-hidden"
                        >
                          <div className="p-6 border border-ji-amber/20 rounded-3xl bg-ji-amber/5 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Protocol Type</label>
                                <select
                                  value={form.type}
                                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                                  className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-xs font-bold text-ji-text focus:border-ji-amber outline-none cursor-pointer"
                                >
                                  <option value="CREDIT">Payment (Credit)</option>
                                  <option value="DEBIT">Charge (Debit)</option>
                                  <option value="ADVANCE">Advance (Credit)</option>
                                </select>
                              </div>
                              <div className="space-y-1.5">
                                <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Volume</label>
                                <div className="relative">
                                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-black text-ji-text-dim">₹</span>
                                  <input
                                    type="number"
                                    value={form.amount}
                                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                                    placeholder="0.00"
                                    className="w-full pl-8 pr-4 py-3 bg-white border border-ji-border rounded-xl text-xs font-black font-['JetBrains_Mono'] text-ji-text focus:border-ji-amber outline-none"
                                  />
                                </div>
                              </div>
                            </div>
                            <div className="space-y-1.5">
                              <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Reference/Notes</label>
                              <input
                                type="text"
                                value={form.notes}
                                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                                placeholder="e.g. Cash, Transaction ID..."
                                className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-xs font-bold text-ji-text focus:border-ji-amber outline-none italic"
                              />
                            </div>
                            <div className="flex gap-3 pt-2">
                              <button
                                onClick={() => setShowForm(false)}
                                className="flex-1 py-3 border border-ji-border text-ji-text-dim rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                              >
                                Abort
                              </button>
                              <button
                                onClick={handleSaveEntry}
                                className="flex-[2] py-3 bg-ji-amber text-white rounded-xl text-[10px] font-black uppercase tracking-widest shadow-lg shadow-ji-amber/20 hover:scale-[1.02] transition-all"
                              >
                                Commit Record
                              </button>
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Ledger Entries */}
                  <div className="flex-1 overflow-y-auto p-8 bg-ji-bg/10">
                    <div className="flex items-center justify-between mb-8">
                      <h3 className="text-[10px] font-black text-ji-text uppercase tracking-[0.2em] flex items-center gap-2">
                        <History size={14} className="text-ji-amber" /> Event History
                      </h3>
                      <span className="text-[10px] font-black text-ji-text-dim bg-ji-bg px-2 py-1 rounded-lg border border-ji-border">
                        {ledgerData.entries.length} RECORDS
                      </span>
                    </div>

                    {ledgerData.entries.length === 0 ? (
                      <div className="text-center py-20 bg-white border border-ji-border border-dashed rounded-3xl">
                        <AlertCircle size={32} className="mx-auto text-ji-text-dim mb-3 opacity-20" />
                        <p className="text-ji-text-dim text-[10px] font-black uppercase tracking-widest">Archive Empty</p>
                      </div>
                    ) : (
                      <div className="relative border-l border-ji-border ml-2 pl-8 space-y-8">
                        {ledgerData.entries.map((entry) => {
                          const isCredit = entry.type === 'CREDIT' || entry.type === 'ADVANCE';
                          return (
                            <div key={entry.id} className="relative group">
                              {/* Timeline dot */}
                              <div className={`absolute -left-[37px] top-6 w-4 h-4 rounded-full border-4 border-white shadow-sm transition-transform group-hover:scale-125 z-10 ${
                                isCredit ? 'bg-emerald-500' : 'bg-ji-amber'
                              }`} />
                              
                              <div className="bg-white border border-ji-border rounded-[1.5rem] p-5 shadow-sm hover:shadow-md transition-all">
                                <div className="flex justify-between items-start mb-4">
                                  <div className="flex flex-col gap-1.5">
                                    <span className={`text-[9px] font-black px-2 py-1 rounded-lg uppercase tracking-widest w-fit border border-current/10 ${
                                      isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-ji-amber/5 text-ji-amber'
                                    }`}>
                                      {entry.type}
                                    </span>
                                    <span className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] tracking-tight">
                                      {new Date(entry.createdAt).toLocaleDateString('en-IN', {
                                        day: '2-digit', month: 'short', year: 'numeric'
                                      })} · {new Date(entry.createdAt).toLocaleTimeString('en-IN', {
                                        hour: '2-digit', minute: '2-digit'
                                      })}
                                    </span>
                                  </div>
                                  <span className={`text-lg font-black font-['JetBrains_Mono'] tracking-tighter ${isCredit ? 'text-emerald-600' : 'text-ji-amber'}`}>
                                    {isCredit ? '↓' : '↑'} {formatINR(entry.amount)}
                                  </span>
                                </div>
                                
                                <p className="text-[11px] font-bold text-ji-text italic leading-relaxed mb-4">
                                  {entry.invoice ? `Automated Entry: Invoice ${entry.invoice.invoiceNumber}` : entry.notes || 'No meta description recorded.'}
                                </p>
                                
                                <div className="flex items-center justify-between px-4 py-3 bg-ji-bg rounded-xl border border-ji-border/50">
                                  <span className="text-[9px] font-black text-ji-text-dim uppercase tracking-widest">Position After Event</span>
                                  <span className={`text-xs font-black font-['JetBrains_Mono'] ${
                                    entry.runningBalance > 0 ? 'text-ji-amber' : entry.runningBalance < 0 ? 'text-emerald-600' : 'text-ji-text-dim'
                                  }`}>
                                    {formatINR(Math.abs(entry.runningBalance))}
                                    {entry.runningBalance < 0 && <span className="text-[8px] ml-1 opacity-60">ADV</span>}
                                  </span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
