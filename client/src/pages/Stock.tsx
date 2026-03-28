import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  Warehouse,
  Search,
  X,
  AlertTriangle,
  Battery,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

interface StockItem {
  id: string;
  name: string;
  brand: string;
  sku: string;
  mrp: number;
  isBattery: boolean;
  category: { name: string } | null;
  totalStock: number;
  stock: {
    id: string;
    quantity: number;
    lowStockAt: number;
    location: { id: string; name: string };
  }[];
}

export default function Stock() {
  const [products, setProducts] = useState<StockItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'low' | 'out'>('all');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = { limit: '200' };
      if (search) params.search = search;
      const res = await api.get('/products', { params });
      setProducts(res.data.data);
    } catch {
      toast.error('Failed to load stock data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);
  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Filtered products
  const filtered = products.filter((p) => {
    if (filter === 'low') return p.stock?.some((s) => s.quantity > 0 && s.quantity <= s.lowStockAt);
    if (filter === 'out') return p.totalStock <= 0;
    return true;
  });

  // Stats
  const totalProducts = products.length;
  const lowStockCount = products.filter((p) => p.stock?.some((s) => s.quantity > 0 && s.quantity <= s.lowStockAt)).length;
  const outOfStockCount = products.filter((p) => p.totalStock <= 0).length;
  const totalValue = products.reduce((sum, p) => sum + p.mrp * p.totalStock, 0);

  // Collect all unique locations
  const locations = Array.from(new Set(
    products.flatMap((p) => p.stock?.map((s) => s.location.name) || [])
  )).sort();

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Inventory Assets', value: totalProducts, icon: <Warehouse size={18} />, variant: 'default' },
          { label: 'Liquidity Value', value: totalValue, icon: <Warehouse size={18} />, isCurrency: true, variant: 'primary' },
          { label: 'Critical Threshold', value: lowStockCount, icon: <AlertTriangle size={18} />, variant: lowStockCount > 0 ? 'warning' : 'success' },
          { label: 'Depleted Stock', value: outOfStockCount, icon: <X size={18} />, variant: outOfStockCount > 0 ? 'danger' : 'success' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="p-6 bg-white border border-ji-border rounded-[2rem] relative overflow-hidden shadow-sm group"
          >
            <div className="absolute right-0 top-0 w-24 h-24 bg-ji-bg rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
            
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
                stat.variant === 'primary' ? 'bg-ji-amber text-white shadow-ji-amber/20' :
                stat.variant === 'warning' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                stat.variant === 'danger' ? 'bg-red-50 text-red-600 border border-red-100' :
                stat.variant === 'success' ? 'bg-emerald-50 text-emerald-600 border border-emerald-100' :
                'bg-ji-bg text-ji-text-dim border border-ji-border/50'
              }`}>
                {stat.icon}
              </div>
              <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">{stat.label}</span>
            </div>
            
            <div className="flex items-baseline gap-2 relative z-10">
              <span className={`text-2xl font-['JetBrains_Mono'] font-black tracking-tighter ${
                stat.variant === 'danger' ? 'text-red-600' : 
                stat.variant === 'warning' ? 'text-amber-600' :
                stat.variant === 'success' ? 'text-emerald-600' : 
                stat.variant === 'primary' ? 'text-ji-amber' : 'text-ji-text'
              }`}>
                {stat.isCurrency ? formatINR(stat.value as number).replace('₹', '') : stat.value}
              </span>
              {stat.isCurrency && <span className="text-[10px] font-black text-ji-text-dim opacity-40">INR</span>}
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
          <input
            type="text"
            placeholder="Search Stock Records (SKU, Brand, Model)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-ji-border rounded-2xl 
                       text-ji-text text-xs font-bold placeholder:text-ji-text-dim/40
                       focus:border-ji-amber focus:ring-4 focus:ring-ji-amber/5 outline-none transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-ji-bg text-ji-text-dim transition-all">
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-1.5 p-1.5 bg-ji-bg border border-ji-border rounded-3xl shrink-0 shadow-inner">
          {([
            { key: 'all', label: 'All Assets' },
            { key: 'info', label: 'Healthy Stock', count: totalProducts - lowStockCount - outOfStockCount, variant: 'neutral' },
            { key: 'low', label: 'Low Threshold', count: lowStockCount, variant: 'warning' },
            { key: 'out', label: 'Stock-Out', count: outOfStockCount, variant: 'danger' },
          ] as const).map((item) => {
            const label = 'label' in item ? item.label : '';
            const count = 'count' in item ? item.count : 0;
            const key = 'key' in item ? item.key : '';

            return (
              <button
                key={key}
                onClick={() => setFilter(key as any)}
                className={`px-4 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-2xl transition-all flex items-center gap-2 ${
                  filter === key
                    ? 'bg-white text-ji-text shadow-sm border border-ji-border'
                    : 'text-ji-text-dim hover:text-ji-text hover:bg-white/50'
                }`}
              >
                {label}
                {count !== undefined && (
                  <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-black ${
                    filter === key ? 'bg-ji-amber text-white' : 'bg-ji-bg text-ji-text-dim border border-ji-border'
                  }`}>
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Table */}
      <div className="bg-white border border-ji-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="border-b border-ji-border bg-ji-bg/30">
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em] w-1/4">Resource Specification</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">Tax Group</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">MRP</th>
                {locations.map((h) => (
                  <th key={h} className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">
                    {h.split(' ')[0]} Units
                  </th>
                ))}
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">Cumulative</th>
                <th className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5 + locations.length} className="text-center py-24 text-ji-text-dim">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-4 border-ji-amber border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Auditing Stock Ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={5 + locations.length} className="text-center py-24">
                    <div className="w-16 h-16 bg-ji-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Warehouse size={32} className="text-ji-text-dim opacity-30" />
                    </div>
                    <p className="text-ji-text font-black uppercase tracking-widest text-sm">Inventory Void</p>
                    <p className="text-[10px] text-ji-text-dim font-bold italic mt-2">Zero matching records found for current filter criteria</p>
                  </td>
                </tr>
              ) : (
                filtered.map((product, index) => {
                  const isLow = product.stock?.some((s) => s.quantity > 0 && s.quantity <= s.lowStockAt);
                  const isOut = product.totalStock <= 0;

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.01 }}
                      className="border-b border-ji-border/50 hover:bg-ji-bg transition-colors group"
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            product.isBattery ? 'bg-ji-amber/5 text-ji-amber' : 'bg-ji-bg text-ji-text-dim'
                          }`}>
                            {product.isBattery ? <Battery size={18} /> : <Warehouse size={18} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-ji-text">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                               <span className="text-[9px] text-ji-text-dim font-black uppercase tracking-widest">{product.brand}</span>
                               <span className="text-[9px] font-black font-['JetBrains_Mono'] text-ji-text-dim opacity-40 px-1.5 py-0.5 bg-ji-bg rounded border border-ji-border">{product.sku || 'CAT-REF'}</span>
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-8 py-6">
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-ji-bg text-ji-text border border-ji-border uppercase tracking-widest">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>
                      <td className="px-8 py-6 text-sm font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                        {formatINR(product.mrp).replace('₹', '')}
                      </td>
                      {locations.map((loc) => {
                        const stockEntry = product.stock?.find((s) => s.location.name === loc);
                        const qty = stockEntry?.quantity || 0;
                        const lowAt = stockEntry?.lowStockAt || 0;
                        const isLocLow = qty > 0 && qty <= lowAt;
                        const isLocOut = qty <= 0;
                        return (
                          <td key={loc} className="px-8 py-6">
                            <span className={`text-sm font-black font-['JetBrains_Mono'] tracking-tighter ${
                              isLocOut ? 'text-red-300' : isLocLow ? 'text-ji-amber' : 'text-ji-text'
                            }`}>
                              {qty}
                            </span>
                          </td>
                        );
                      })}
                      <td className="px-8 py-6">
                        <span className={`text-lg font-black font-['JetBrains_Mono'] tracking-tighter ${
                          isOut ? 'text-red-500' : isLow ? 'text-ji-amber' : 'text-emerald-600'
                        }`}>
                          {product.totalStock}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        {isOut ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-red-50 text-red-500 border border-red-100">
                             OUT
                          </span>
                        ) : isLow ? (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-amber-50 text-amber-600 border border-amber-100 italic font-black">
                             LOW
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest bg-emerald-50 text-emerald-600 border border-emerald-100 whitespace-nowrap">
                             OPTIMAL
                          </span>
                        )}
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
