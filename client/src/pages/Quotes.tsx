import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { FileQuestion, Search, X, Eye, ArrowRightCircle, Activity } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Quote {
  id: string;
  invoiceNumber: string;
  type: string;
  status: string;
  customer: { name: string; phone: string } | null;
  grandTotal: number;
  _count: { items: number };
  createdBy: { name: string };
  createdAt: string;
}

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function Quotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [total, setTotal] = useState(0);

  const fetchQuotes = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { type: 'QUOTE' };
      if (search) params.search = search;
      const res = await api.get('/invoices', { params });
      setQuotes(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load quotes');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchQuotes(); }, []);
  useEffect(() => {
    const timer = setTimeout(fetchQuotes, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleConvert = async (quoteId: string, quoteNumber: string) => {
    if (!window.confirm(`Convert quote ${quoteNumber} to a Tax Invoice? This will deduct stock and generate an official invoice.`)) return;
    try {
      await api.post(`/invoices/${quoteId}/convert-to-invoice`);
      toast.success(`Quote ${quoteNumber} converted to Tax Invoice!`);
      fetchQuotes();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to convert quote');
    }
  };

  // Stats
  const totalValue = quotes.reduce((sum, inv) => sum + inv.grandTotal, 0);

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col lg:flex-row gap-8 items-start justify-between">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
             <div className="w-12 h-12 rounded-[1.25rem] bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm">
                <FileQuestion size={24} />
             </div>
             <div>
                <h1 className="text-3xl font-black text-ji-text tracking-tight uppercase">Pro-Forma Registry</h1>
                <p className="text-xs text-ji-text-dim font-bold tracking-widest uppercase opacity-60">Inventory Reservation & Quotes</p>
             </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-6 w-full lg:w-auto">
          {[
            { label: 'Pending Quotes', value: total, color: 'text-ji-text', icon: FileQuestion },
            { label: 'Projected Revenue', value: formatINR(totalValue).split('.')[0], color: 'text-ji-amber', icon: Activity },
          ].map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.1 }}
              className="bg-white border border-ji-border rounded-[2rem] p-6 min-w-[240px] shadow-sm group hover:border-ji-amber/30 transition-all active:scale-95"
            >
              <div className="flex items-center justify-between mb-3">
                <p className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">{stat.label}</p>
                <stat.icon size={14} className="text-ji-text-dim opacity-30 group-hover:text-ji-amber transition-colors" />
              </div>
              <p className={`text-2xl font-black font-['JetBrains_Mono'] ${stat.color} tracking-tighter`}>{stat.value}</p>
            </motion.div>
          ))}
        </div>
      </div>

      <div className="bg-white border border-ji-border rounded-[2.5rem] shadow-sm overflow-hidden flex flex-col h-[calc(100vh-22rem)]">
        {/* Toolbar */}
        <div className="p-8 border-b border-ji-border flex flex-col md:flex-row md:items-center justify-between gap-6 bg-ji-bg/30">
          <div className="relative group flex-1 max-w-md">
            <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
            <input
              type="text"
              placeholder="Query Quote ID or Counterparty Identity..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-10 py-4 bg-white border border-ji-border rounded-xl text-xs font-black text-ji-text placeholder:text-ji-text-dim/40 focus:border-ji-amber outline-none transition-all shadow-sm"
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

          <div className="flex items-center gap-3">
             <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest bg-ji-bg px-5 py-2 rounded-full border border-ji-border shadow-inner">
                {total} ENTRIES_LOGGED
             </span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full gap-4 opacity-50">
              <div className="w-8 h-8 border-4 border-ji-amber border-t-transparent rounded-full animate-spin" />
              <p className="text-[10px] font-black text-ji-text uppercase tracking-widest">Accessing Ledger...</p>
            </div>
          ) : quotes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full gap-6 opacity-30">
              <div className="w-20 h-20 bg-ji-bg rounded-[2.5rem] flex items-center justify-center shadow-inner">
                 <FileQuestion size={40} className="text-ji-text-dim" />
              </div>
              <div className="text-center">
                <p className="text-sm font-black text-ji-text uppercase tracking-widest">No Matches Found</p>
                <p className="text-[10px] text-ji-text-dim font-bold italic mt-1">Refine your query or initialize a new quote node</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-ji-bg/95 backdrop-blur-md z-10 border-b border-ji-border">
                <tr>
                  <th className="py-5 px-8 text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">IDENTIFIER / TEMPORAL</th>
                  <th className="py-5 px-8 text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">COUNTER_PARTY</th>
                  <th className="py-5 px-8 text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em] text-right">NODES</th>
                  <th className="py-5 px-8 text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em] text-right">VALUATION</th>
                  <th className="py-5 px-8 text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em] text-center">PROTOCOL</th>
                  <th className="py-5 px-8 text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em] text-right">COMMANDS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ji-border/40">
                {quotes.map((quote) => (
                  <motion.tr
                    key={quote.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="group hover:bg-ji-bg/50 transition-colors"
                  >
                    <td className="py-6 px-8 whitespace-nowrap">
                      <div className="font-['JetBrains_Mono'] text-ji-text font-black text-sm tracking-tight">{quote.invoiceNumber}</div>
                      <div className="text-[9px] text-ji-text-dim font-bold uppercase tracking-widest mt-1 opacity-60">
                        {new Date(quote.createdAt).toLocaleDateString('en-IN', {
                          day: '2-digit', month: 'short', year: 'numeric',
                        })} · {new Date(quote.createdAt).toLocaleTimeString('en-IN', {
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </div>
                    </td>
                    <td className="py-6 px-8">
                      {quote.customer ? (
                        <div className="space-y-1">
                          <div className="text-sm font-black text-ji-text uppercase tracking-tight">{quote.customer.name}</div>
                          <div className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] tracking-widest">{quote.customer.phone}</div>
                        </div>
                      ) : (
                        <span className="text-[10px] text-ji-text-dim font-black uppercase tracking-widest opacity-40 italic">STATION_DIRECT_CLIENT</span>
                      )}
                    </td>
                    <td className="py-6 px-8 text-right">
                      <span className="inline-flex items-center justify-center min-w-[2.5rem] h-10 rounded-xl bg-ji-bg border border-ji-border text-[10px] font-black text-ji-text font-['JetBrains_Mono'] shadow-inner">
                        {quote._count?.items || 0}
                      </span>
                    </td>
                    <td className="py-6 px-8 text-right">
                      <div className="font-['JetBrains_Mono'] text-ji-amber font-black text-base tracking-tighter">
                        {formatINR(quote.grandTotal)}
                      </div>
                    </td>
                    <td className="py-6 px-8 text-center">
                       <span className="inline-flex items-center px-4 py-1.5 rounded-full bg-ji-amber/5 text-ji-amber text-[9px] font-black uppercase tracking-widest border border-ji-amber/20 shadow-sm animate-pulse">
                         RESERVATION
                       </span>
                    </td>
                    <td className="py-6 px-8">
                      <div className="flex items-center justify-end gap-3 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0">
                        <button
                          onClick={() => handleConvert(quote.id, quote.invoiceNumber)}
                          className="flex items-center gap-2 px-5 py-2.5 bg-ji-amber text-white hover:shadow-lg hover:shadow-ji-amber/30 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all active:scale-95"
                        >
                          <ArrowRightCircle size={14} /> Commit_Tax
                        </button>
                        <button
                          onClick={() => navigate(`/invoices/${quote.id}`)}
                          className="w-10 h-10 flex items-center justify-center text-ji-text-dim hover:text-ji-amber bg-white border border-ji-border hover:border-ji-amber/50 rounded-xl transition-all shadow-sm active:scale-95"
                          title="Detailed Protocol View"
                        >
                          <Eye size={16} />
                        </button>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
