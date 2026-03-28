import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BookOpen,
  Calendar,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Wallet,
  Receipt,
  ArrowUpRight,
  ArrowDownRight,
  User,
  Search,
  Filter,
  Download,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface DayBookEntry {
  id: string;
  type: 'SALE' | 'PAYMENT_IN' | 'EXPENSE' | 'PURCHASE' | 'MECH_PAYOUT';
  reference: string;
  party: string;
  amount: number;
  paymentMode: string;
  time: string;
}

export default function DayBook() {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<{ entries: DayBookEntry[], summary: any } | null>(null);
  const [search, setSearch] = useState('');

  const fetchDayBook = async () => {
    try {
      setLoading(true);
      const res = await api.get('/reports/daybook', { params: { date } });
      setData(res.data.data);
    } catch {
      toast.error('Failed to load day book');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDayBook();
  }, [date]);

  const formatINR = (amount: number) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

  const typeConfig: Record<string, { label: string, color: string, icon: any, bg: string }> = {
    SALE: { label: 'Revenue Ingress', color: 'text-ji-amber', icon: Receipt, bg: 'bg-ji-amber/5' },
    PAYMENT_IN: { label: 'Credit Settlement', color: 'text-emerald-600', icon: ArrowDownRight, bg: 'bg-emerald-50' },
    EXPENSE: { label: 'Debit Outflow', color: 'text-red-500', icon: ArrowUpRight, bg: 'bg-red-50' },
    PURCHASE: { label: 'Asset Procurement', color: 'text-ji-text', icon: TrendingDown, bg: 'bg-ji-bg' },
    MECH_PAYOUT: { label: 'Commission Liq', color: 'text-purple-600', icon: User, bg: 'bg-purple-50' },
  };

  const filteredEntries = data?.entries.filter(e => 
    e.party.toLowerCase().includes(search.toLowerCase()) || 
    e.reference.toLowerCase().includes(search.toLowerCase())
  ) || [];

  return (
    <div className="space-y-10 pb-12">
      {/* ─── Header & Date Picker ──────────────────── */}
      <div className="flex flex-col xl:flex-row items-start xl:items-end justify-between gap-8 border-b border-ji-border pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm shadow-ji-amber/5">
              <BookOpen size={24} />
            </div>
            <h1 className="text-4xl font-['Playfair_Display'] font-black text-ji-text tracking-tight">Financial Daybook</h1>
          </div>
          <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] ml-1.5 italic">Consolidated Daily Liquidity & Recon Registry</p>
        </div>

        <div className="flex items-center gap-3 bg-ji-bg border border-ji-border p-2 rounded-[2rem] w-full xl:w-auto shadow-inner">
           <button 
             onClick={() => {
               const d = new Date(date);
               d.setDate(d.getDate() - 1);
               setDate(d.toISOString().split('T')[0]);
             }}
             className="w-12 h-12 flex items-center justify-center bg-white border border-ji-border rounded-full text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm active:scale-95"
           >
             <ChevronLeft size={20} />
           </button>
           
           <div className="relative flex-1 xl:w-64">
             <Calendar size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-ji-amber" />
             <input 
               type="date" 
               value={date}
               onChange={(e) => setDate(e.target.value)}
               className="bg-white border border-ji-border rounded-[1.5rem] pl-14 pr-6 py-4 text-xs font-black text-ji-text focus:border-ji-amber outline-none font-['JetBrains_Mono'] w-full shadow-sm"
             />
           </div>

           <button 
             onClick={() => {
               const d = new Date(date);
               d.setDate(d.getDate() + 1);
               setDate(d.toISOString().split('T')[0]);
             }}
             className="w-12 h-12 flex items-center justify-center bg-white border border-ji-border rounded-full text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm active:scale-95"
           >
             <ChevronRight size={20} />
           </button>
        </div>
      </div>

      {/* ─── Summary Cards ──────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Ingress Volume', value: data?.summary.totalSales || 0, icon: TrendingUp, variant: 'primary' },
          { label: 'Liquidity Inflow', value: data?.summary.totalCashIn || 0, icon: ArrowDownRight, variant: 'success' },
          { label: 'Operational Outflow', value: data?.summary.totalExpenses || 0, icon: TrendingDown, variant: 'danger' },
          { label: 'Net Surplus', value: data?.summary.netCash || 0, icon: Wallet, variant: 'neutral' },
        ].map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-white border border-ji-border rounded-[2rem] shadow-sm relative overflow-hidden group"
          >
             <div className="absolute right-0 top-0 w-20 h-20 bg-ji-bg rounded-bl-[3rem] -mr-6 -mt-6 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-md transition-transform group-hover:rotate-6 ${
                card.variant === 'primary' ? 'bg-ji-amber text-white' :
                card.variant === 'success' ? 'bg-emerald-600 text-white' :
                card.variant === 'danger' ? 'bg-red-500 text-white' : 'bg-ji-text text-white'
              }`}>
                <card.icon size={18} />
              </div>
              <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">{card.label}</span>
            </div>
            
            <p className={`text-2xl font-['JetBrains_Mono'] font-black tracking-tighter relative z-10 ${
              card.variant === 'primary' ? 'text-ji-amber' :
              card.variant === 'success' ? 'text-emerald-700' :
              card.variant === 'danger' ? 'text-red-700' : 'text-ji-text'
            }`}>
              {formatINR(card.value).replace('₹', '')}
              <span className="text-[10px] ml-2 font-black text-ji-text-dim opacity-40 uppercase tracking-widest">INR</span>
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── Transaction Feed ───────────────────────── */}
      <div className="bg-white border border-ji-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="p-8 border-b border-ji-border flex flex-col lg:flex-row items-stretch lg:items-center justify-between bg-ji-bg/30 gap-6">
           <div className="flex flex-col md:flex-row items-stretch md:items-center gap-6">
              <div className="flex items-center gap-3">
                <BookOpen size={18} className="text-ji-text-dim" />
                <h3 className="text-sm font-black text-ji-text uppercase tracking-widest font-['IBM_Plex_Sans']">Timeline Profile</h3>
              </div>
              <div className="hidden md:block h-6 w-px bg-ji-border" />
              <div className="relative group">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
                <input 
                  type="text"
                  placeholder="Filter by Party, Ref or ID..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="bg-white border border-ji-border rounded-xl pl-12 pr-6 py-3 text-[10px] font-bold text-ji-text focus:border-ji-amber outline-none w-full md:w-80 shadow-inner"
                />
              </div>
           </div>
           
           <div className="flex items-center gap-3">
             <button className="w-12 h-12 flex items-center justify-center bg-white border border-ji-border rounded-xl text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm active:scale-95">
                <Filter size={16} />
             </button>
             <button className="px-6 py-3 bg-white border border-ji-border rounded-xl text-[10px] font-black uppercase tracking-widest text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm flex items-center gap-3 active:scale-95">
                <Download size={14} /> Export Protocol
             </button>
           </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left whitespace-nowrap">
            <thead>
              <tr className="bg-ji-bg/20 text-[10px] text-ji-text font-black uppercase tracking-[0.2em] border-b border-ji-border">
                <th className="px-8 py-5">Temporal Mark</th>
                <th className="px-8 py-5">Transaction Protocol</th>
                <th className="px-8 py-5">Counterparty Identity</th>
                <th className="px-8 py-5">Reference Auth</th>
                <th className="px-8 py-5">Settlement</th>
                <th className="px-8 py-5 text-right">Net Value</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ji-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-12 h-12 border-4 border-ji-amber border-t-transparent rounded-full animate-spin shadow-lg shadow-ji-amber/10" />
                      <p className="text-ji-text-dim text-[10px] font-black uppercase tracking-widest">Reconciling Node Registry...</p>
                    </div>
                  </td>
                </tr>
              ) : filteredEntries.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-32 text-center">
                    <div className="w-20 h-20 bg-ji-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <BookOpen size={36} className="text-ji-text-dim opacity-30" />
                    </div>
                    <p className="text-ji-text text-sm font-black uppercase tracking-widest">Registry Nullified</p>
                    <p className="text-[10px] text-ji-text-dim font-bold italic mt-2">Zero fiscal movements detected for specified coordinate</p>
                  </td>
                </tr>
              ) : (
                filteredEntries.map((entry, idx) => {
                  const conf = typeConfig[entry.type];
                  return (
                    <motion.tr
                      key={entry.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="hover:bg-ji-bg transition-colors group"
                    >
                      <td className="px-8 py-6 text-[10px] font-black font-['JetBrains_Mono'] text-ji-text-dim tracking-widest">
                        {new Date(entry.time).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit', hour12: true })}
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <div className={`w-8 h-8 rounded-xl flex items-center justify-center shadow-sm ${conf.bg} ${conf.color}`}>
                            <conf.icon size={16} />
                          </div>
                          <span className={`text-[10px] font-black uppercase tracking-widest ${conf.color}`}>
                            {conf.label}
                          </span>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <p className="text-sm font-black text-ji-text group-hover:translate-x-1 transition-transform">{entry.party}</p>
                      </td>
                      <td className="px-8 py-6 text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] tracking-widest">
                        {entry.reference}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[9px] px-3 py-1 rounded-full border border-ji-border bg-ji-bg text-ji-text font-black uppercase tracking-widest">
                          {entry.paymentMode}
                        </span>
                      </td>
                      <td className={`px-8 py-6 text-right font-['JetBrains_Mono'] font-black text-base tracking-tighter ${
                        entry.amount >= 0 ? 'text-ji-text' : 'text-red-600'
                      }`}>
                        {entry.amount >= 0 ? '+' : ''} {Math.abs(entry.amount).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                        <span className="text-[9px] ml-2 opacity-40 uppercase tracking-widest">INR</span>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        
        {/* Footer Summary */}
        {!loading && filteredEntries.length > 0 && (
           <div className="px-8 py-6 bg-ji-bg/30 border-t border-ji-border flex flex-col md:flex-row items-center justify-between gap-6">
              <p className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest">Profiled {filteredEntries.length} fiscal nodes for temporal mark {new Date(date).toLocaleDateString()}</p>
              <div className="flex items-center gap-8">
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-md shadow-emerald-500/20" />
                    <span className="text-[10px] font-black text-ji-text uppercase tracking-widest">Inflow: <span className="text-sm font-['JetBrains_Mono'] tracking-tighter text-emerald-700 ml-1">{formatINR(filteredEntries.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0)).replace('₹', '')}</span></span>
                 </div>
                 <div className="flex items-center gap-3">
                    <div className="w-2.5 h-2.5 rounded-full bg-red-500 shadow-md shadow-red-500/20" />
                    <span className="text-[10px] font-black text-ji-text uppercase tracking-widest">Outflow: <span className="text-sm font-['JetBrains_Mono'] tracking-tighter text-red-700 ml-1">{formatINR(Math.abs(filteredEntries.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0))).replace('₹', '')}</span></span>
                 </div>
              </div>
           </div>
        )}
      </div>
    </div>
  );
}
