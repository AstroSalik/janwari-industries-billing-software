import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  Package,
  Wrench,
  IndianRupee,
  BarChart3,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function Analytics() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAnalytics = async () => {
      try {
        setLoading(true);
        const res = await api.get('/analytics/dashboard');
        setData(res.data.data);
      } catch {
        toast.error('Failed to load analytics data');
      } finally {
        setLoading(false);
      }
    };
    fetchAnalytics();
  }, []);

  if (loading || !data) {
    return (
      <div className="py-20 flex justify-center text-ji-text-dim">
        <div className="w-6 h-6 border-2 border-ji-amber border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-10">
      <div className="flex flex-col gap-2">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm shadow-ji-amber/5">
            <BarChart3 size={24} />
          </div>
          <h1 className="text-4xl font-['Playfair_Display'] font-black text-ji-text tracking-tight">Intelligence Quotient</h1>
        </div>
        <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] ml-1.5 italic">Real-time Performance & Market Analytics</p>
      </div>

      {/* Top Level KPIs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {[
          { 
            label: 'Monthly Growth Protocol', 
            value: data.thisMonthRevenue, 
            icon: <TrendingUp size={20} />, 
            variant: 'primary',
            desc: 'Consolidated revenue for current fiscal window'
          },
          { 
            label: 'Consolidated Asset Value', 
            value: data.totalRevenue, 
            icon: <IndianRupee size={20} />, 
            variant: 'success',
            desc: 'Aggregated historical liquidity across all sessions'
          },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="p-10 bg-white border border-ji-border rounded-[2.5rem] shadow-sm relative overflow-hidden group"
          >
            <div className={`absolute right-0 top-0 w-32 h-32 rounded-bl-[5rem] -mr-8 -mt-8 transition-transform group-hover:scale-110 ${
              stat.variant === 'primary' ? 'bg-ji-amber/5' : 'bg-emerald-50'
            }`} />
            
            <div className="flex items-center gap-5 mb-6 relative z-10">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6 ${
                stat.variant === 'primary' ? 'bg-ji-amber text-white shadow-ji-amber/20' : 'bg-emerald-600 text-white shadow-emerald-500/20'
              }`}>
                {stat.icon}
              </div>
              <div>
                <span className="text-[10px] font-black text-ji-text uppercase tracking-[0.2em] block">{stat.label}</span>
                <span className="text-[9px] text-ji-text-dim font-bold italic">{stat.desc}</span>
              </div>
            </div>
            
            <div className="flex items-baseline gap-3 relative z-10">
              <span className={`text-5xl font-['JetBrains_Mono'] font-black tracking-tighter ${
                stat.variant === 'primary' ? 'text-ji-amber' : 'text-emerald-700'
              }`}>
                {formatINR(stat.value).replace('₹', '')}
              </span>
              <span className="text-[10px] font-black text-ji-text-dim opacity-40 uppercase tracking-widest">INR Consolidate</span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Two Column Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Top Products */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white border border-ji-border rounded-[2.5rem] p-10 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ji-bg border border-ji-border flex items-center justify-center text-ji-text-dim">
                <Package size={20} />
              </div>
              <h2 className="text-xl font-['Playfair_Display'] font-black text-ji-text">High-Velocity SKUs</h2>
            </div>
            <span className="text-[9px] font-black text-ji-text-dim uppercase tracking-[0.2em] px-3 py-1 bg-ji-bg rounded-full border border-ji-border">Sales Density</span>
          </div>
          
          <div className="space-y-6">
            {data.topProducts.map((p: any, i: number) => (
              <div key={i} className="flex items-center justify-between group p-2 -m-2 rounded-2xl hover:bg-ji-bg transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-ji-bg border border-ji-border flex items-center justify-center text-[10px] text-ji-text-dim font-black group-hover:border-ji-amber/30 group-hover:text-ji-amber transition-all shadow-inner">
                    0{i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-black text-ji-text group-hover:translate-x-1 transition-transform">{p.name}</p>
                    <p className="text-[9px] text-ji-text-dim font-black uppercase tracking-widest mt-0.5">{p.brand || 'Consolidated Asset'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-ji-text font-['JetBrains_Mono'] tracking-tighter">
                    {p.quantity} <span className="text-[9px] font-black uppercase text-ji-text-dim tracking-widest">Units</span>
                  </p>
                  <p className="text-xs text-ji-amber font-black font-['JetBrains_Mono'] tracking-tighter mt-0.5">₹ {formatINR(p.revenue).replace('₹', '')}</p>
                </div>
              </div>
            ))}
            {data.topProducts.length === 0 && (
              <div className="py-10 text-center border-2 border-dashed border-ji-border rounded-3xl">
                 <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-widest italic leading-relaxed">No transaction entropy detected<br/>for asset velocity analysis</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Top Mechanics */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-ji-border rounded-[2.5rem] p-10 shadow-sm"
        >
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-ji-bg border border-ji-border flex items-center justify-center text-ji-text-dim">
                <Wrench size={20} />
              </div>
              <h2 className="text-xl font-['Playfair_Display'] font-black text-ji-text">Technician Efficiency</h2>
            </div>
            <span className="text-[9px] font-black text-ji-text-dim uppercase tracking-[0.2em] px-3 py-1 bg-ji-bg rounded-full border border-ji-border">Revenue Stream</span>
          </div>
          
          <div className="space-y-6">
            {data.topMechanics.map((m: any) => (
              <div key={m.id} className="flex items-center justify-between group p-2 -m-2 rounded-2xl hover:bg-ji-bg transition-all">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ji-bg to-white border border-ji-border flex items-center justify-center text-xs font-black text-ji-text-dim shadow-inner group-hover:border-ji-amber/30 group-hover:text-ji-amber transition-all uppercase">
                    {m.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-black text-ji-text group-hover:translate-x-1 transition-transform">{m.name}</p>
                    <p className="text-[10px] text-ji-text-dim font-bold italic">{m.invoicesCount} active commissions</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-[9px] text-ji-text-dim uppercase tracking-[0.1em] mb-1 font-black">Aggregate Commission</p>
                  <p className="text-xl font-black text-emerald-600 font-['JetBrains_Mono'] tracking-tighter">₹ {formatINR(m.revenue).replace('₹', '')}</p>
                </div>
              </div>
            ))}
            {data.topMechanics.length === 0 && (
              <div className="py-10 text-center border-2 border-dashed border-ji-border rounded-3xl">
                 <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-widest italic leading-relaxed">System awaiting technician<br/>engagement protocols</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
