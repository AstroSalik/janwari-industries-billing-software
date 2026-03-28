import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  TrendingUp,
  FileText,
  Users,
  Package,
  AlertTriangle,
  Plus,
  ArrowRight,
} from 'lucide-react';
import api from '../lib/api';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

interface DashboardStats {
  totalInvoices: number;
  totalRevenue: number;
  totalCustomers: number;
  totalProducts: number;
  recentInvoices: any[];
  lowStockProducts: any[];
}

export default function Dashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState<DashboardStats>({
    totalInvoices: 0,
    totalRevenue: 0,
    totalCustomers: 0,
    totalProducts: 0,
    recentInvoices: [],
    lowStockProducts: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const [invoicesRes, customersRes, productsRes] = await Promise.all([
          api.get('/invoices', { params: { limit: '5' } }),
          api.get('/customers', { params: { limit: '1' } }),
          api.get('/products', { params: { limit: '100' } }),
        ]);

        const invoices = invoicesRes.data.data || [];
        const revenue = invoices
          .filter((i: any) => i.status !== 'CANCELLED')
          .reduce((sum: number, i: any) => sum + i.grandTotal, 0);

        const products = productsRes.data.data || [];
        const lowStock = products.filter(
          (p: any) => p.stock?.some((s: any) => s.quantity <= s.lowStockAt)
        );

        setStats({
          totalInvoices: invoicesRes.data.total || 0,
          totalRevenue: revenue,
          totalCustomers: customersRes.data.total || 0,
          totalProducts: productsRes.data.total || 0,
          recentInvoices: invoices.slice(0, 5),
          lowStockProducts: lowStock.slice(0, 5),
        });
      } catch {
        // Silently fail — dashboard is non-critical
      } finally {
        setLoading(false);
      }
    };
    fetchStats();
  }, []);

  const metricCards = [
    {
      label: "Today's Revenue",
      value: formatINR(stats.totalRevenue),
      icon: TrendingUp,
      color: 'text-ji-amber',
      bgColor: 'bg-ji-amber/10',
      borderColor: 'border-ji-amber/20',
    },
    {
      label: 'Total Invoices',
      value: stats.totalInvoices,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-100',
    },
    {
      label: 'Customers',
      value: stats.totalCustomers,
      icon: Users,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-100',
    },
    {
      label: 'Products',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-ji-text-muted',
      bgColor: 'bg-ji-bg',
      borderColor: 'border-ji-border',
    },
  ];

  const statusConfig: Record<string, { text: string; bg: string; dot: string; label: string }> = {
    PAID:      { text: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-600', label: 'Paid' },
    PARTIAL:   { text: 'text-ji-amber',   bg: 'bg-ji-amber/10', dot: 'bg-ji-amber',   label: 'Partial' },
    FINALIZED: { text: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-600',    label: 'Finalized' },
    CANCELLED: { text: 'text-red-600',     bg: 'bg-red-50',     dot: 'bg-red-600',     label: 'Cancelled' },
    DRAFT:     { text: 'text-ji-text-dim', bg: 'bg-ji-bg',      dot: 'bg-ji-text-dim', label: 'Draft' },
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div>
      {/* ─── Morning Greeting Banner ───────────────── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="relative overflow-hidden bg-ji-surface border border-ji-border rounded-xl p-6 md:p-8 mb-8 shadow-sm"
      >
        {/* Subtle texture overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)',
          }}
        />

        <div className="relative">
          <p className="text-sm text-ji-text-muted font-['IBM_Plex_Sans']">
            {new Date().toLocaleDateString('en-IN', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </p>
          <h1 className="text-2xl md:text-3xl font-['Playfair_Display'] font-bold text-ji-text mt-1">
            {(() => {
              const hour = new Date().getHours();
              if (hour < 12) return 'Good morning,';
              if (hour < 17) return 'Good afternoon,';
              return 'Good evening,';
            })()}
            <span className="text-ji-amber"> Janwari Industries</span>
          </h1>
          <p className="text-ji-text-muted text-sm mt-2">
            {stats.lowStockProducts.length > 0
              ? `Low stock on ${stats.lowStockProducts.length} items`
              : 'All stock levels healthy'}
            {' · '}
            {stats.totalInvoices > 0
              ? `${stats.totalInvoices} invoices recorded`
              : 'No invoices yet — press F2 to start'}
          </p>
        </div>

        {/* Ambient amber glow */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      </motion.div>

      {/* ─── Quick Actions ──────────────────────────── */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2 scrollbar-none snap-x">
        <button
          onClick={() => navigate('/invoices/new')}
          className="snap-start shrink-0 flex items-center gap-2 px-5 py-2.5 bg-ji-amber hover:bg-ji-amber/90 text-white font-semibold rounded-md shadow-sm transition-all active:scale-95 text-sm font-['IBM_Plex_Sans']"
        >
          <Plus size={16} />
          New Invoice
          <kbd className="hidden sm:inline-block text-[10px] font-['JetBrains_Mono'] bg-white/20 px-1.5 py-0.5 rounded ml-1">F2</kbd>
        </button>
        <button
          onClick={() => navigate('/customers')}
          className="snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 border border-ji-border hover:border-ji-amber/40 bg-ji-surface text-ji-text-muted hover:text-ji-text font-medium rounded-md transition-colors text-sm shadow-sm"
        >
          <Users size={16} />
          Customers
        </button>
        <button
          onClick={() => navigate('/products')}
          className="snap-start shrink-0 flex items-center gap-2 px-4 py-2.5 border border-ji-border hover:border-ji-amber/40 bg-ji-surface text-ji-text-muted hover:text-ji-text font-medium rounded-md transition-colors text-sm shadow-sm"
        >
          <Package size={16} />
          Products
        </button>
      </div>

      {/* ─── Metric Cards ───────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {metricCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08, duration: 0.3 }}
            className={`bg-ji-surface border ${card.borderColor} rounded-lg p-5 shadow-sm`}
          >
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-slate-500 font-['IBM_Plex_Sans'] uppercase tracking-wider">
                {card.label}
              </p>
              <div className={`p-2 rounded-lg ${card.bgColor}`}>
                <card.icon size={16} className={card.color} />
              </div>
            </div>
            <p className={`text-3xl font-bold font-['JetBrains_Mono'] ${card.color}`}>
              {card.value}
            </p>
          </motion.div>
        ))}
      </div>

      {/* ─── Two Column Layout ──────────────────────── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Invoices */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white border border-ji-border rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-ji-border bg-ji-bg/30">
            <h3 className="text-[10px] font-black text-ji-text font-['IBM_Plex_Sans'] uppercase tracking-[0.2em]">
              Recent Protocol Activities
            </h3>
            <button
              onClick={() => navigate('/invoices')}
              className="flex items-center gap-2 text-[10px] font-black text-ji-amber hover:text-ji-amber/80 transition-all uppercase tracking-widest"
            >
              Expose All <ArrowRight size={12} />
            </button>
          </div>

          {stats.recentInvoices.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <FileText size={32} className="mx-auto text-ji-border mb-4" />
              <p className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest">Registry Vacuum Detected</p>
              <p className="text-[9px] text-ji-text-dim mt-2 italic">Initialize session via F2 catalyst</p>
            </div>
          ) : (
            <div className="divide-y divide-ji-border/40">
              {stats.recentInvoices.map((inv: any) => {
                const sc = statusConfig[inv.status] || statusConfig.DRAFT;
                return (
                  <div key={inv.id} className="px-6 py-4 hover:bg-ji-bg/50 transition-colors group">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-xl bg-ji-bg border border-ji-border flex items-center justify-center text-ji-text-dim group-hover:text-ji-amber group-hover:border-ji-amber transition-all shadow-inner">
                           <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-xs font-black font-['JetBrains_Mono'] text-ji-amber uppercase tracking-tight">{inv.invoiceNumber}</p>
                          <p className="text-[10px] text-ji-text font-bold mt-0.5">{inv.customer?.name || 'Walk-in Principle'}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">{formatINR(inv.grandTotal)}</p>
                        <span className={`inline-flex items-center gap-1.5 text-[9px] font-black uppercase tracking-widest mt-1.5 ${sc.text}`}>
                           <span className={`w-1.5 h-1.5 rounded-full ${sc.dot} animate-pulse`} />
                           {sc.label}
                        </span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Low Stock Alerts */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-white border border-ji-border rounded-2xl shadow-sm overflow-hidden"
        >
          <div className="flex items-center justify-between px-6 py-4 border-b border-ji-border bg-ji-bg/30">
            <h3 className="text-[10px] font-black text-ji-text font-['IBM_Plex_Sans'] uppercase tracking-[0.2em]">
              Critical Inventory Alerts
            </h3>
            <button
              onClick={() => navigate('/stock')}
              className="flex items-center gap-2 text-[10px] font-black text-ji-amber hover:text-ji-amber/80 transition-all uppercase tracking-widest"
            >
              Inventory Map <ArrowRight size={12} />
            </button>
          </div>

          {stats.lowStockProducts.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <Package size={32} className="mx-auto text-emerald-100 mb-4" />
              <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Asset Density Optimal</p>
              <p className="text-[9px] text-ji-text-dim mt-2 italic">All stock levels exceed low_threshold</p>
            </div>
          ) : (
            <div className="divide-y divide-ji-border/40">
              {stats.lowStockProducts.map((product: any) => (
                <div key={product.id} className="px-6 py-4 hover:bg-ji-bg/50 transition-colors group">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-xl bg-red-50 border border-red-100 flex items-center justify-center text-red-600 shadow-inner group-hover:scale-110 transition-transform">
                        <AlertTriangle size={16} />
                      </div>
                      <div>
                        <p className="text-xs font-black text-ji-text uppercase tracking-tight">{product.name}</p>
                        <p className="text-[10px] text-ji-text-dim font-bold mt-0.5">{product.brand}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-black font-['JetBrains_Mono'] text-red-600 tracking-tighter">
                        {product.totalStock} <span className="text-[8px] uppercase">Remaining</span>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
