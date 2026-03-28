import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Printer, ArrowLeft, Truck, Users, Calendar, CheckCircle, Ban, ArrowRight } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const statusConfig: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  PENDING: { bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-400', label: 'Pending' },
  DELIVERED: { bg: 'bg-blue-500/10', text: 'text-blue-400', dot: 'bg-blue-400', label: 'Delivered' },
  INVOICED: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Invoiced' },
  RETURNED: { bg: 'bg-orange-500/10', text: 'text-orange-400', dot: 'bg-orange-400', label: 'Returned' },
  CANCELLED: { bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-400', label: 'Cancelled' },
};

export default function ChallanDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [challan, setChallan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [converting, setConverting] = useState(false);

  const fetchChallan = async () => {
    try {
      const res = await api.get(`/challans/${id}`);
      setChallan(res.data.data);
    } catch {
      toast.error('Failed to load challan details');
      navigate('/challans');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallan();
  }, [id]);

  if (loading || !challan) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin text-amber-500">⏳</div>
      </div>
    );
  }

  const conf = statusConfig[challan.status] || statusConfig.PENDING;

  const handleUpdateStatus = async (newStatus: string) => {
    if (!confirm(`Mark this challan as ${newStatus}?`)) return;
    try {
      await api.put(`/challans/${id}/status`, { status: newStatus });
      toast.success(`Challan marked as ${newStatus}`);
      fetchChallan();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update');
    }
  };

  const handleConvertToInvoice = async () => {
    if (!confirm('Convert this delivery challan perfectly to a Tax Invoice?')) return;
    setConverting(true);
    try {
      const res = await api.post(`/challans/${id}/convert`);
      toast.success('Successfully converted to invoice!');
      navigate(`/invoices/${res.data.data.id}`); // Navigate directly to the new draft invoice
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Conversion failed');
    } finally {
      setConverting(false);
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="max-w-[1400px] mx-auto pb-12">
      {/* ─── Header ────────────────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-start gap-4">
          <button
            onClick={() => navigate('/challans')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl text-ji-text-dim hover:text-ji-text bg-white hover:bg-ji-bg transition-all border border-ji-border shadow-sm group mt-1"
          >
            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter uppercase">
                {challan.challanNumber}
              </h1>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-current/10 bg-ji-bg/30 text-ji-text`}>
                <span className={`w-2 h-2 rounded-full ${conf.dot} animate-pulse`} />
                {conf.label}
              </span>
            </div>
            <div className="flex items-center gap-3 mt-2">
               <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-widest opacity-60 italic">
                  Originator: <span className="text-ji-text font-black not-italic">{challan.createdBy?.name || 'System Agent'}</span>
               </p>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={() => window.print()}
            className="flex items-center gap-3 bg-white border border-ji-border px-6 py-3.5 rounded-2xl hover:bg-ji-bg text-ji-text font-black transition-all text-[11px] uppercase tracking-widest shadow-sm active:scale-95"
          >
            <Printer size={18} />
            Initialize Print
          </button>

          {challan.status === 'PENDING' && (
            <>
              <button
                onClick={() => handleUpdateStatus('CANCELLED')}
                className="flex items-center gap-3 bg-red-50 border border-red-100 px-6 py-3.5 rounded-2xl hover:bg-red-100 text-red-600 font-black transition-all text-[11px] uppercase tracking-widest shadow-sm shadow-red-50 active:scale-95"
              >
                <Ban size={18} />
                Abort
              </button>
              <button
                onClick={() => handleUpdateStatus('DELIVERED')}
                className="flex items-center gap-3 bg-blue-50 border border-blue-100 px-6 py-3.5 rounded-2xl hover:bg-blue-100 text-blue-600 font-black transition-all text-[11px] uppercase tracking-widest shadow-sm shadow-blue-50 active:scale-95"
              >
                <CheckCircle size={18} />
                Register Delivery
              </button>
            </>
          )}

          {challan.status === 'DELIVERED' && (
             <button
               disabled={converting}
               onClick={handleConvertToInvoice}
               className="flex items-center gap-3 bg-ji-amber hover:bg-ji-amber/90 text-white px-8 py-3.5 rounded-2xl transition-all text-[11px] font-black uppercase tracking-widest shadow-xl shadow-ji-amber/20 disabled:opacity-50 active:scale-95"
             >
               <ArrowRight size={18} className="animate-pulse" />
               {converting ? 'Converting Module...' : 'Transform to Invoice'}
             </button>
          )}

          {challan.status === 'INVOICED' && challan.invoice && (
            <button
               onClick={() => navigate(`/invoices/${challan.invoiceId}`)}
               className="flex items-center gap-3 bg-emerald-50 border border-emerald-100 px-6 py-3.5 rounded-2xl text-emerald-600 hover:bg-emerald-100 transition-all text-[11px] font-black uppercase tracking-widest shadow-sm shadow-emerald-50 active:scale-95"
             >
               View Finalized Bill: {challan.invoice.invoiceNumber}
             </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* ─── Main Content ──────────────────────────────────────── */}
        <div className="col-span-1 lg:col-span-2 space-y-8">
          <div className="bg-white border border-ji-border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-ji-border bg-ji-bg/30 flex items-center justify-between">
              <h2 className="text-[10px] font-black text-ji-text uppercase tracking-[0.2em] flex items-center gap-2">
                <Truck size={14} className="text-ji-amber" />
                Asset Registry ({challan.items.length} units)
              </h2>
              <div className="px-3 py-1 bg-white rounded-lg border border-ji-border">
                 <span className="text-[9px] text-ji-text-dim font-bold uppercase tracking-widest">Formal Handover</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-ji-border bg-ji-bg/10">
                    <th className="px-8 py-4 text-[10px] font-black text-ji-text-dim uppercase tracking-widest w-16 text-center">#</th>
                    <th className="px-8 py-4 text-[10px] font-black text-ji-text-dim uppercase tracking-widest">Asset Specification</th>
                    <th className="px-8 py-4 text-[10px] font-black text-ji-text-dim uppercase tracking-widest w-24">Quantity</th>
                    {challan.showAmount && <th className="px-8 py-4 text-[10px] font-black text-ji-text-dim uppercase tracking-widest w-32">Valuation</th>}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ji-border/40">
                  {challan.items.map((item: any, i: number) => (
                    <tr key={item.id} className="hover:bg-ji-bg/30 transition-colors group">
                      <td className="px-8 py-5 text-xs text-ji-text-dim text-center font-['JetBrains_Mono'] font-black">{i + 1}</td>
                      <td className="px-8 py-5">
                        <p className="text-sm font-black text-ji-text uppercase tracking-tight group-hover:text-ji-amber transition-colors">{item.product?.name || 'Unknown Asset'}</p>
                        {item.serialNumber && (
                          <p className="text-[10px] text-ji-amber font-black font-['JetBrains_Mono'] mt-1 flex items-center gap-1.5 opacity-80">
                            <span className="w-1.5 h-1.5 rounded-full bg-ji-amber animate-pulse" />
                            SNR: {item.serialNumber.serial}
                          </p>
                        )}
                      </td>
                      <td className="px-8 py-5">
                         <span className="inline-flex items-center px-2.5 py-1 rounded-lg bg-ji-bg border border-ji-border text-xs font-black font-['JetBrains_Mono'] text-ji-text">
                            {item.quantity}
                         </span>
                      </td>
                      {challan.showAmount && (
                        <td className="px-8 py-5 text-sm text-ji-text font-black font-['JetBrains_Mono'] italic">
                          {item.rate ? formatINR(item.rate) : '—'}
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {challan.notes && (
            <div className="bg-white border border-ji-border rounded-[2rem] p-8 relative overflow-hidden group shadow-sm">
              <div className="absolute top-0 left-0 w-1.5 h-full bg-ji-amber/20 group-hover:bg-ji-amber transition-all" />
              <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-4 font-black">Special Handling Instructions</p>
              <p className="text-sm text-ji-text font-bold italic leading-relaxed">{challan.notes}</p>
            </div>
          )}
        </div>

        {/* ─── Sidebar info ──────────────────────────────────────── */}
        <div className="space-y-6">
          <div className="bg-white border border-ji-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ji-amber/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-6 font-black flex items-center gap-2 relative z-10">
              <Users size={12} className="text-ji-amber" /> Recipient Profile
            </p>
            {challan.customer ? (
              <div className="space-y-4 relative z-10">
                <div>
                   <h4 className="text-xl font-black text-ji-text">{challan.customer.name}</h4>
                   <p className="text-xs text-ji-text font-black font-['JetBrains_Mono'] mt-1 opacity-70">{challan.customer.phone}</p>
                </div>
                {challan.customer.address && (
                  <p className="text-xs text-ji-text-dim font-medium leading-relaxed italic border-l-2 border-ji-border pl-4">
                     {challan.customer.address}
                  </p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 relative z-10 bg-ji-bg p-5 rounded-2xl border border-ji-border/50 border-dashed">
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center border border-ji-border">
                  <Users size={18} className="text-ji-text-dim" />
                </div>
                <span className="text-xs text-ji-text-dim font-black uppercase tracking-widest italic tracking-tighter">Anonymous Recipient</span>
              </div>
            )}
          </div>

          {challan.vehicle && (
            <div className="bg-white border border-ji-border rounded-[2.5rem] p-8 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-6 font-black flex items-center gap-2 relative z-10">
                <Truck size={12} className="text-blue-600" /> Dispatch Vessel
              </p>
              <div className="relative z-10">
                <div className="flex items-center gap-3">
                  <div className="px-3 py-1.5 bg-blue-50 border border-blue-100 rounded-xl text-blue-600 font-black font-['JetBrains_Mono'] tracking-tighter">
                     {challan.vehicle.regNumber}
                  </div>
                </div>
                {challan.vehicle.make && (
                  <p className="text-xs text-ji-text-dim font-bold mt-3 opacity-60 uppercase tracking-widest">
                     {challan.vehicle.make} <span className="text-ji-text">/</span> {challan.vehicle.model}
                  </p>
                )}
              </div>
            </div>
          )}

          <div className="bg-ji-bg border border-ji-border rounded-[2.5rem] p-8 shadow-inner">
            <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-5 font-black flex items-center gap-2">
               <Calendar size={12} className="text-ji-text-dim opacity-50" /> System Timeline
            </p>
            <div className="space-y-4">
              <div className="flex items-center justify-between border-b border-ji-border pb-3">
                <span className="text-[10px] text-ji-text-dim font-bold uppercase tracking-wider">Origination</span>
                <span className="text-[10px] text-ji-text font-black font-['JetBrains_Mono']">{new Date(challan.createdAt).toLocaleDateString('en-IN')}</span>
              </div>
              {challan.deliveredAt && (
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-blue-600 font-bold uppercase tracking-wider">Synchronization</span>
                  <span className="text-[10px] text-blue-600 font-black font-['JetBrains_Mono']">{new Date(challan.deliveredAt).toLocaleDateString('en-IN')}</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
