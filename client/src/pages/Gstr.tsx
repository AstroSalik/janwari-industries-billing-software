import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Receipt,
  Download,
  AlertCircle,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function Gstr() {
  const [data, setData] = useState<{ b2b: any[], b2c: any[] } | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'B2B' | 'B2C'>('B2B');

  useEffect(() => {
    const fetchGstr = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/gstr');
        setData(res.data.data);
      } catch {
        toast.error('Failed to load GSTR data');
      } finally {
        setLoading(false);
      }
    };
    fetchGstr();
  }, []);

  const exportToCSV = () => {
    if (!data) return;
    const records = activeTab === 'B2B' ? data.b2b : data.b2c;
    
    // Create CSV header
    const headers = ['Invoice Number', 'Date', 'Customer Name', 'GSTIN', 'State Code', 'Taxable Value', 'IGST', 'CGST', 'SGST', 'Total Invoice Value'];
    
    // Map data to rows
    const rows = records.map(r => [
      r.invoiceNumber,
      new Date(r.date).toLocaleDateString('en-IN'),
      r.customerName,
      r.gstin || '',
      r.stateCode || '',
      r.taxableValue.toFixed(2),
      r.totalIgst.toFixed(2),
      r.totalCgst.toFixed(2),
      r.totalSgst.toFixed(2),
      r.totalValue.toFixed(2)
    ]);

    // Construct CSV content
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `GSTR-1_${activeTab}_Extract_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  };

  if (loading || !data) {
    return (
      <div className="py-20 flex justify-center text-slate-500">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const activeData = activeTab === 'B2B' ? data.b2b : data.b2c;
  
  // Calc totals
  const totalTaxable = activeData.reduce((sum, r) => sum + r.taxableValue, 0);
  const totalTax = activeData.reduce((sum, r) => sum + r.totalIgst + r.totalCgst + r.totalSgst, 0);

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-6 border-b border-ji-border pb-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm shadow-ji-amber/5">
              <Receipt size={20} />
            </div>
            <h1 className="text-3xl font-['Playfair_Display'] font-black text-ji-text tracking-tight">Taxation Ledger</h1>
          </div>
          <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] ml-1">Compliance Protocol | GSTR-1 Automated Extract</p>
        </div>
        
        <button
          onClick={exportToCSV}
          disabled={activeData.length === 0}
          className="flex items-center gap-3 px-6 py-3 bg-white border border-ji-border hover:border-ji-amber text-ji-text-dim hover:text-ji-amber rounded-xl transition-all text-[10px] font-black uppercase tracking-widest shadow-sm disabled:opacity-30 disabled:grayscale group active:scale-95"
        >
          <Download size={14} className="group-hover:-translate-y-0.5 transition-transform" /> Export Data Protocol
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <button
          onClick={() => setActiveTab('B2B')}
          className={`relative p-8 rounded-[2rem] border-2 transition-all group ${
            activeTab === 'B2B' 
            ? 'bg-ji-amber/5 border-ji-amber shadow-lg shadow-ji-amber/10' 
            : 'bg-white border-ji-border hover:border-ji-amber/30'
          }`}
        >
          {activeTab === 'B2B' && (
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-ji-amber animate-pulse" />
          )}
          <div className="flex flex-col items-start gap-1">
            <span className={`text-[10px] font-black tracking-[0.2em] mb-2 px-3 py-1 rounded-lg ${
              activeTab === 'B2B' ? 'bg-ji-amber text-white shadow-md shadow-ji-amber/20' : 'bg-ji-bg text-ji-text-dim border border-ji-border'
            }`}>
              B2B REGISTERED
            </span>
            <div className="flex items-baseline gap-3 mt-2">
              <p className={`text-4xl font-black font-['JetBrains_Mono'] tracking-tighter ${
                activeTab === 'B2B' ? 'text-ji-text' : 'text-ji-text-dim'
              }`}>
                {data.b2b.length}
              </p>
              <span className="text-[10px] font-black text-ji-text-dim opacity-40 uppercase tracking-widest">Entities</span>
            </div>
          </div>
        </button>

        <button
          onClick={() => setActiveTab('B2C')}
           className={`relative p-8 rounded-[2rem] border-2 transition-all group ${
            activeTab === 'B2C' 
            ? 'bg-emerald-50 border-emerald-500 shadow-lg shadow-emerald-500/10' 
            : 'bg-white border-ji-border hover:border-emerald-500/30'
          }`}
        >
          {activeTab === 'B2C' && (
            <div className="absolute top-4 right-4 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          )}
          <div className="flex flex-col items-start gap-1">
            <span className={`text-[10px] font-black tracking-[0.2em] mb-2 px-3 py-1 rounded-lg ${
              activeTab === 'B2C' ? 'bg-emerald-600 text-white shadow-md shadow-emerald-600/20' : 'bg-ji-bg text-ji-text-dim border border-ji-border'
            }`}>
              B2C UNREGISTERED
            </span>
            <div className="flex items-baseline gap-3 mt-2">
              <p className={`text-4xl font-black font-['JetBrains_Mono'] tracking-tighter ${
                activeTab === 'B2C' ? 'text-ji-text' : 'text-ji-text-dim'
              }`}>
                {data.b2c.length}
              </p>
              <span className="text-[10px] font-black text-ji-text-dim opacity-40 uppercase tracking-widest">Retail Assets</span>
            </div>
          </div>
        </button>
      </div>

      <div className="bg-ji-bg border border-ji-border rounded-2xl p-6 mb-8 grid grid-cols-1 sm:grid-cols-2 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-ji-border">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em]">Net Taxable Base</span>
          <span className="text-2xl font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">{formatINR(totalTaxable)}</span>
        </div>
        <div className="flex flex-col gap-1 sm:pl-8 pt-4 sm:pt-0">
          <span className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em]">Aggregate Tax Liability</span>
          <span className="text-2xl font-black font-['JetBrains_Mono'] text-ji-amber tracking-tighter">{formatINR(totalTax)}</span>
        </div>
      </div>

      <div className="bg-white border border-ji-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="border-b border-ji-border bg-ji-bg/30">
                {['Reference / Temporal', 'Entity Spec', 'GSTIN Identity', 'Base Value', 'Consol. IGST', 'Consol. CGST', 'Consol. SGST', 'Net Payable'].map((h, i) => (
                  <th key={h} className={`text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em] ${i === 7 ? 'bg-ji-bg/50' : ''}`}>
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {activeData.length === 0 ? (
                <tr>
                  <td colSpan={8} className="text-center py-20 px-8">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-16 h-16 bg-ji-bg rounded-2xl flex items-center justify-center text-ji-text-dim opacity-30">
                        <AlertCircle size={32} />
                      </div>
                      <div className="space-y-1">
                        <p className="text-sm font-black text-ji-text uppercase tracking-widest">No transaction entropy</p>
                        <p className="text-[10px] text-ji-text-dim font-bold italic">Awaiting GSTR data for current filtering protocol</p>
                      </div>
                    </div>
                  </td>
                </tr>
              ) : (
                activeData.map((row: any, i: number) => (
                  <motion.tr
                    key={row.invoiceNumber}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.01 }}
                    className="border-b border-ji-border/50 hover:bg-ji-bg transition-colors"
                  >
                    <td className="px-8 py-6">
                      <div className="text-sm font-black text-ji-text font-['JetBrains_Mono'] tracking-tighter">{row.invoiceNumber}</div>
                      <div className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] mt-1 opacity-60">
                        {new Date(row.date).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black text-ji-text">
                      {row.customerName}
                    </td>
                    <td className="px-8 py-6">
                      <div className="text-[10px] font-black text-ji-text font-['JetBrains_Mono'] tracking-widest">
                         {row.gstin || 'UNREGISTERED_ENTITY'}
                      </div>
                      <div className="text-[9px] text-ji-text-dim font-black uppercase mt-1">
                        STATE_UID: {row.stateCode}
                      </div>
                    </td>
                    <td className="px-8 py-6 text-sm font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                      {formatINR(row.taxableValue).replace('₹', '')}
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black font-['JetBrains_Mono'] text-ji-text-dim tracking-tight">
                      {row.totalIgst > 0 ? formatINR(row.totalIgst).replace('₹', '') : '—'}
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black font-['JetBrains_Mono'] text-ji-text-dim tracking-tight">
                      {row.totalCgst > 0 ? formatINR(row.totalCgst).replace('₹', '') : '—'}
                    </td>
                    <td className="px-8 py-6 text-[10px] font-black font-['JetBrains_Mono'] text-ji-text-dim tracking-tight">
                      {row.totalSgst > 0 ? formatINR(row.totalSgst).replace('₹', '') : '—'}
                    </td>
                    <td className="px-8 py-6 text-md font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter bg-ji-bg/20">
                      ₹ {formatINR(row.totalValue).replace('₹', '')}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
