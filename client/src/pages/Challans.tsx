import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Truck, Search, X, ChevronDown, Eye, Ban } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Challan {
  id: string;
  challanNumber: string;
  status: string;
  customer: { name: string; phone: string } | null;
  vehicle: { regNumber: string } | null;
  _count: { items: number };
  createdAt: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: 'bg-ji-amber/5', text: 'text-ji-amber', dot: 'bg-ji-amber', label: 'PENDING_RECON' },
  DELIVERED: { bg: 'bg-emerald-50', text: 'text-emerald-600', dot: 'bg-emerald-600', label: 'TRANSIT_COMPLETE' },
  INVOICED: { bg: 'bg-ji-bg', text: 'text-ji-text', dot: 'bg-ji-text', label: 'FINANCIAL_POSTED' },
  RETURNED: { bg: 'bg-orange-50', text: 'text-orange-600', dot: 'bg-orange-600', label: 'ASSET_RETURNED' },
  CANCELLED: { bg: 'bg-red-50', text: 'text-red-500', dot: 'bg-red-500', label: 'VOID_PROTOCOL' },
};

export default function Challans() {
  const navigate = useNavigate();
  const [challans, setChallans] = useState<Challan[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchChallans = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/challans', { params });
      setChallans(res.data.data);
    } catch {
      toast.error('Failed to load challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchChallans(); }, []);
  useEffect(() => {
    const timer = setTimeout(fetchChallans, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const handleUpdateStatus = async (id: string, newStatus: string) => {
    if (!confirm(`Mark this challan as ${newStatus}?`)) return;
    try {
      await api.put(`/challans/${id}/status`, { status: newStatus });
      toast.success(`Challan updated to ${newStatus}`);
      fetchChallans();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-ji-border pb-10">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm shadow-ji-amber/5">
              <Truck size={24} />
            </div>
            <h1 className="text-4xl font-['Playfair_Display'] font-black text-ji-text tracking-tight">Delivery Logistics</h1>
          </div>
          <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] ml-1.5 italic">Asset Transit Registry & Challan Compliance</p>
        </div>
        
        <button
          onClick={() => navigate('/challans/new')}
          className="px-8 py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-ji-amber/20 transition-all flex items-center justify-center gap-3 active:scale-95"
        >
          <Truck size={16} /> Create Dispatch Protocol
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
          <input
            type="text"
            placeholder="Search Dispatch Records (Challan #, Customer Name, Vehicle Registry)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-ji-border rounded-xl text-ji-text text-xs font-bold placeholder:text-ji-text-dim/40 focus:border-ji-amber outline-none transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-ji-bg text-ji-text-dim transition-all">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="relative md:w-64">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full appearance-none px-6 py-4 bg-white border border-ji-border rounded-xl text-ji-text text-[10px] font-black uppercase tracking-widest focus:border-ji-amber outline-none cursor-pointer shadow-sm"
          >
            <option value="">Consolidated Protocol View</option>
            <option value="PENDING">Pending Reconcile</option>
            <option value="DELIVERED">Transit Complete</option>
            <option value="INVOICED">Financial Posted</option>
            <option value="RETURNED">Asset Returned</option>
            <option value="CANCELLED">Void Protocol</option>
          </select>
          <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-ji-text-dim pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-ji-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse whitespace-nowrap">
            <thead>
              <tr className="border-b border-ji-border bg-ji-bg/30">
                <th className="px-8 py-5 text-[10px] font-black text-ji-text uppercase tracking-[0.2em]">Temporal Mark</th>
                <th className="px-8 py-5 text-[10px] font-black text-ji-text uppercase tracking-[0.2em]">Logistics ID</th>
                <th className="px-8 py-5 text-[10px] font-black text-ji-text uppercase tracking-[0.2em]">Counterparty</th>
                <th className="px-8 py-5 text-[10px] font-black text-ji-text uppercase tracking-[0.2em]">State Analysis</th>
                <th className="px-8 py-5 text-[10px] font-black text-ji-text uppercase tracking-[0.2em]">Registry #</th>
                <th className="px-8 py-5 text-[10px] font-black text-ji-text uppercase tracking-[0.2em] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ji-border/50">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-10 h-10 border-4 border-ji-amber border-t-transparent rounded-full animate-spin shadow-lg shadow-ji-amber/10" />
                      <p className="text-ji-text-dim text-[10px] font-black uppercase tracking-widest">Querying Logistics Node Registry...</p>
                    </div>
                  </td>
                </tr>
              ) : challans.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-8 py-24 text-center">
                    <div className="w-20 h-20 bg-ji-bg rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-inner">
                      <Truck size={36} className="text-ji-text-dim opacity-30" />
                    </div>
                    <p className="text-ji-text text-sm font-black uppercase tracking-widest">Registry Nullified</p>
                    <p className="text-[10px] text-ji-text-dim font-bold italic mt-2">Zero active dispatch sessions detected in current partition</p>
                  </td>
                </tr>
              ) : (
                challans.map((ch, idx) => {
                  const conf = statusConfig[ch.status] || statusConfig.PENDING;
                  return (
                    <motion.tr
                      key={ch.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: idx * 0.01 }}
                      className="hover:bg-ji-bg transition-colors cursor-pointer group"
                      onClick={() => navigate(`/challans/${ch.id}`)}
                    >
                      <td className="px-8 py-6 text-[10px] font-black text-ji-text-dim font-['JetBrains_Mono'] tracking-widest">
                        {new Date(ch.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-sm font-black text-ji-text font-['JetBrains_Mono'] tracking-tighter bg-ji-bg/50 px-3 py-1.5 rounded-lg border border-ji-border">
                          {ch.challanNumber}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {ch.customer ? (
                          <div className="space-y-1">
                            <div className="text-sm text-ji-text font-black group-hover:translate-x-1 transition-transform">{ch.customer.name}</div>
                            <div className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] uppercase tracking-widest">{ch.customer.phone}</div>
                          </div>
                        ) : (
                          <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest italic opacity-50">Retail_Counterparty</span>
                        )}
                      </td>
                      <td className="px-8 py-6">
                        <span className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border transition-colors ${conf.bg} ${conf.text} border-current/20`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${conf.dot} shadow-sm shadow-current/30`} />
                          {conf.label}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-[10px] font-black text-ji-text-dim font-['JetBrains_Mono'] tracking-widest uppercase">
                        {ch.vehicle?.regNumber || 'STATIC_DISPATCH'}
                      </td>
                      <td className="px-8 py-6 text-right">
                        <div className="flex items-center justify-end gap-3" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => navigate(`/challans/${ch.id}`)}
                            className="w-10 h-10 flex items-center justify-center bg-white border border-ji-border rounded-xl text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm active:scale-95"
                            title="Audit Specification"
                          >
                            <Eye size={16} />
                          </button>
                          {ch.status === 'PENDING' && (
                            <button
                              onClick={() => handleUpdateStatus(ch.id, 'CANCELLED')}
                              className="w-10 h-10 flex items-center justify-center bg-white border border-ji-border rounded-xl text-ji-text-dim hover:text-red-500 hover:border-red-500 transition-all shadow-sm active:scale-95"
                              title="Void Protocol"
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

      {!loading && challans.length > 0 && (
        <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] text-center mt-6 italic opacity-50">
          Sync complete: Profiled {challans.length} sessions from logistics Registry
        </p>
      )}
    </div>
  );
}
