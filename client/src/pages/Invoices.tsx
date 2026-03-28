import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileText, Search, X, ChevronDown, Eye, Ban, MessageCircle, Activity } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Invoice {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  customer: { name: string; phone: string } | null;
  grandTotal: number;
  paidAmount: number;
  balanceAmount: number;
  _count: { items: number };
  createdBy: { name: string };
  createdAt: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  DRAFT: { bg: 'bg-slate-100', text: 'text-slate-600', dot: 'bg-slate-400', label: 'Draft' },
  FINALIZED: { bg: 'bg-blue-50', text: 'text-blue-600', dot: 'bg-blue-500', label: 'Finalized' },
  PAID: { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-500', label: 'Paid' },
  PARTIAL: { bg: 'bg-ji-amber/10', text: 'text-ji-amber', dot: 'bg-ji-amber', label: 'Partial' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-700', dot: 'bg-red-500', label: 'Cancelled' },
};

export default function Invoices() {
  const navigate = useNavigate();
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/invoices', { params });
      setInvoices(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchInvoices(); }, []);
  useEffect(() => {
    const timer = setTimeout(fetchInvoices, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleCancel = async (invoice: Invoice) => {
    if (!confirm(`Cancel invoice ${invoice.invoiceNumber}? This cannot be undone.`)) return;
    try {
      await api.put(`/invoices/${invoice.id}/cancel`);
      toast.success(`Invoice ${invoice.invoiceNumber} cancelled`);
      fetchInvoices();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    }
  };

  const handleWhatsApp = (inv: Invoice) => {
    const text = encodeURIComponent(
      `Invoice: ${inv.invoiceNumber}\n` +
      `Amount: ${formatINR(inv.grandTotal)}\n` +
      `Status: ${inv.status}\n` +
      `Date: ${new Date(inv.createdAt).toLocaleDateString('en-IN')}\n` +
      `\nFrom Janwari Industries, Sopore\nPh: 7006083933`
    );
    const phone = inv.customer?.phone ? `91${inv.customer.phone}` : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  // Stats
  const totalRevenue = invoices.reduce((sum, inv) => inv.status !== 'CANCELLED' ? sum + inv.grandTotal : sum, 0);
  const paidCount = invoices.filter((i) => i.status === 'PAID').length;
  const pendingAmount = invoices.reduce((sum, inv) =>
    inv.status !== 'CANCELLED' && inv.status !== 'PAID' ? sum + inv.balanceAmount : sum, 0);

  return (
    <div className="space-y-8">
      {/* Header & Local Actions */}
      <div className="flex flex-col lg:flex-row items-center justify-between gap-6 pb-2 border-b border-ji-border/30">
        <div className="flex items-center gap-4 self-start">
           <div className="w-14 h-14 rounded-[1.5rem] bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm group">
              <FileText size={28} className="group-hover:scale-110 transition-transform" />
           </div>
           <div>
              <h1 className="text-3xl font-black text-ji-text tracking-tight uppercase">Tax Registry</h1>
              <p className="text-xs text-ji-text-dim font-bold tracking-widest uppercase opacity-60">Revenue & Accounts Ledger</p>
           </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
           <button 
             onClick={() => navigate('/billing')}
             className="flex-1 lg:flex-none px-8 py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-black rounded-2xl transition-all shadow-xl shadow-ji-amber/20 active:scale-95 text-[10px] uppercase tracking-[0.2em]"
           >
             Initialize New Session [F2]
           </button>
        </div>
      </div>

      {/* Stats Layer */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Node_Count', value: total, color: 'text-ji-text' },
          { label: 'Aggregate_Revenue', value: formatINR(totalRevenue).split('.')[0], color: 'text-ji-amber' },
          { label: 'Settled_Protocols', value: paidCount, color: 'text-emerald-600' },
          { label: 'Active_Liabilities', value: formatINR(pendingAmount).split('.')[0], color: pendingAmount > 0 ? 'text-red-600' : 'text-emerald-600' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            className="bg-white border border-ji-border rounded-[2rem] p-6 shadow-sm group hover:border-ji-amber/20 transition-all active:scale-[0.98]"
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">{stat.label}</p>
              <div className="w-6 h-6 rounded-full bg-ji-bg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                 <Activity size={10} className="text-ji-amber" />
              </div>
            </div>
            <p className={`text-2xl font-black font-['JetBrains_Mono'] tracking-tighter ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="bg-white border border-ji-border rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col min-h-[500px]">
        {/* Advanced Filter Toolbar */}
        <div className="p-8 border-b border-ji-border flex flex-col xl:flex-row xl:items-center justify-between gap-6 bg-ji-bg/30">
          <div className="relative group flex-1 max-w-2xl">
            <Search size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
            <input
              type="text"
              placeholder="Query Invoice ID, Client Alias, or Comms Node..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-4.5 bg-white border border-ji-border rounded-2xl text-xs font-black text-ji-text placeholder:text-ji-text-dim/40 focus:border-ji-amber focus:ring-4 focus:ring-ji-amber/5 outline-none transition-all shadow-sm"
            />
            {search && (
              <button
                onClick={() => setSearch('')}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-ji-text-dim hover:text-red-500 transition-colors"
              >
                <X size={16} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-4">
             <div className="relative group w-full xl:w-56">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="w-full appearance-none pl-6 pr-12 py-4.5 bg-white border border-ji-border rounded-2xl text-[10px] font-black text-ji-text-dim uppercase tracking-widest focus:border-ji-amber outline-none cursor-pointer transition-all shadow-sm shadow-inner"
                >
                  <option value="">Protocol: ALL_MODES</option>
                  <option value="PAID">SETTLED [PAID]</option>
                  <option value="PARTIAL">PARTIAL_EXTRACT</option>
                  <option value="FINALIZED">FINALIZED [UNPAID]</option>
                  <option value="CANCELLED">VOID_NULLIFIED</option>
                </select>
                <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ji-text-dim pointer-events-none group-focus-within:rotate-180 transition-transform" />
             </div>

             <div className="hidden lg:flex items-center px-6 py-4.5 bg-ji-bg rounded-2xl border border-ji-border shadow-sm text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">
                {invoices.length} ACTIVE_ENTRIES
             </div>
          </div>
        </div>

        {/* High-Performance Table */}
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] custom-scrollbar">
          <table className="w-full text-left border-collapse min-w-[1200px]">
            <thead className="sticky top-0 bg-ji-bg/95 backdrop-blur-md z-10 border-b border-ji-border">
              <tr>
                {[
                  'NODE_IDENTIFIER', 'CLIENT_PARITY', 'NODES', 'AGGR_TOTAL', 'SETTLED', 'ACTIVE_DEBT', 'PROTOCOL_STATUS', 'TEMPORAL_STAMP', ''
                ].map((h, i) => (
                  <th key={h} className={`py-5 px-8 text-[9px] font-black text-ji-text-dim uppercase tracking-[0.25em] ${i > 2 && i < 6 ? 'text-right' : ''} ${i === 6 ? 'text-center' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-ji-border/40">
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-32">
                    <div className="flex flex-col items-center justify-center gap-4 opacity-50">
                      <div className="w-10 h-10 border-4 border-ji-amber border-t-transparent rounded-2xl rotate-45 animate-spin" />
                      <p className="text-[10px] font-black text-ji-text uppercase tracking-[0.4em]">Decoding Ledger Stream...</p>
                    </div>
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan={9} className="py-32">
                    <div className="flex flex-col items-center justify-center text-center space-y-6 opacity-30">
                       <div className="w-24 h-24 bg-ji-bg rounded-[2.5rem] flex items-center justify-center shadow-inner">
                         <FileText size={40} className="text-ji-text-dim" />
                       </div>
                       <div className="space-y-1">
                         <h3 className="text-sm font-black text-ji-text uppercase tracking-widest">Registry_Void_Matches</h3>
                         <p className="text-[10px] text-ji-text-dim font-bold italic">Adjust your search parameters or initialize a new record node</p>
                       </div>
                    </div>
                  </td>
                </tr>
              ) : (
                invoices.map((inv, index) => {
                  const sc = statusConfig[inv.status] || statusConfig.DRAFT;
                  return (
                    <motion.tr
                      key={inv.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.03 }}
                      className="group hover:bg-ji-bg/50 transition-all cursor-pointer relative"
                      onClick={() => navigate(`/invoices/${inv.id}`)}
                    >
                      <td className="py-6 px-8 whitespace-nowrap">
                        <span className="text-sm font-['JetBrains_Mono'] text-ji-amber font-black tracking-tighter flex items-center gap-2">
                          <div className="w-1.5 h-1.5 rounded-full bg-ji-amber/30 animate-pulse" />
                          {inv.invoiceNumber}
                        </span>
                      </td>
                      <td className="py-6 px-8">
                        <div className="space-y-1">
                           <p className="text-xs font-black text-ji-text uppercase tracking-tight">{inv.customer?.name || 'STATION_DIRECT_CLIENT'}</p>
                           {inv.customer && (
                             <p className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] tracking-widest opacity-60 italic">{inv.customer.phone}</p>
                           )}
                        </div>
                      </td>
                      <td className="py-6 px-8">
                         <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-ji-bg border border-ji-border text-[10px] font-black text-ji-text font-['JetBrains_Mono'] shadow-inner">
                           {inv._count.items.toString().padStart(2, '0')}
                         </span>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <p className="text-sm font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                          {formatINR(inv.grandTotal).split('.')[0]}<span className="opacity-30">.{formatINR(inv.grandTotal).split('.')[1]}</span>
                        </p>
                      </td>
                      <td className="py-6 px-8 text-right">
                         <p className="text-sm font-black font-['JetBrains_Mono'] text-emerald-600 tracking-tighter">
                          {formatINR(inv.paidAmount).split('.')[0]}<span className="opacity-30">.{formatINR(inv.paidAmount).split('.')[1]}</span>
                        </p>
                      </td>
                      <td className="py-6 px-8 text-right">
                        <p className={`text-sm font-black font-['JetBrains_Mono'] tracking-tighter ${inv.balanceAmount > 0 ? 'text-red-500' : 'text-ji-text-dim opacity-30'}`}>
                           {formatINR(inv.balanceAmount).split('.')[0]}<span className="opacity-30">.{formatINR(inv.balanceAmount).split('.')[1]}</span>
                        </p>
                      </td>
                      <td className="py-6 px-8 text-center">
                        <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest ${sc.bg} ${sc.text} border border-current/10 shadow-sm relative overflow-hidden group/status`}>
                           <div className={`absolute inset-0 ${sc.bg} opacity-50 group-hover/status:scale-110 transition-transform`} />
                           <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} relative z-10 shadow-[0_0_8px_rgba(0,0,0,0.15)]`} />
                           <span className="relative z-10">{sc.label}</span>
                        </span>
                      </td>
                      <td className="py-6 px-8">
                         <p className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] uppercase tracking-widest text-right">
                           {new Date(inv.createdAt).toLocaleDateString('en-IN', {
                             day: '2-digit', month: 'short', year: 'numeric',
                           })}
                         </p>
                      </td>
                      <td className="py-6 px-8">
                        <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                          <button
                            onClick={(e) => { e.stopPropagation(); navigate(`/invoices/${inv.id}`); }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-ji-border text-ji-text-dim hover:text-ji-amber hover:border-ji-amber/50 transition-all shadow-sm active:scale-90"
                            title="Access Node Files"
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleWhatsApp(inv); }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-ji-border text-ji-text-dim hover:text-emerald-500 hover:border-emerald-500/50 transition-all shadow-sm active:scale-90"
                            title="Signal via Wave"
                          >
                            <MessageCircle size={16} />
                          </button>
                          {inv.status !== 'CANCELLED' && (
                            <button
                              onClick={(e) => { e.stopPropagation(); handleCancel(inv); }}
                              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-ji-border text-ji-text-dim hover:text-red-500 hover:border-red-500/50 transition-all shadow-sm active:scale-90"
                              title="Nullify Protocol"
                            >
                              <Ban size={16} />
                            </button>
                          )}
                        </div>
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
