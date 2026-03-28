import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  Package,
  Plus,
  Search,
  Battery,
  Edit2,
  Trash2,
  ChevronDown,
  AlertTriangle,
  X,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import ProductForm from '../components/inventory/ProductForm';

// ─── Types ──────────────────────────────────────────

interface Category {
  id: string;
  name: string;
  _count?: { products: number };
}

interface StockItem {
  quantity: number;
  lowStockAt: number;
  location: { id: string; name: string };
}

interface Product {
  id: string;
  name: string;
  brand: string | null;
  sku: string | null;
  hsnCode: string | null;
  gstRate: number;
  mrp: number;
  costPrice: number | null;
  unit: string;
  isBattery: boolean;
  voltage: number | null;
  ahRating: number | null;
  polarity: string | null;
  warrantyFreeMonths: number | null;
  warrantyProRataMonths: number | null;
  categoryId: string | null;
  category: Category | null;
  stock: StockItem[];
  totalStock: number;
}

// ─── Format currency ────────────────────────────────

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

// ─── Products Page ──────────────────────────────────

export default function Products() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [batteryFilter, setBatteryFilter] = useState<string>('');
  const [showForm, setShowForm] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Fetch products
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;
      if (batteryFilter) params.isBattery = batteryFilter;

      const res = await api.get('/products', { params });
      setProducts(res.data.data);
    } catch (err) {
      toast.error('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await api.get('/categories');
      setCategories(res.data.data);
    } catch (err) {
      console.error('Failed to load categories');
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(fetchProducts, 300);
    return () => clearTimeout(timer);
  }, [search, categoryFilter, batteryFilter]);

  // Delete product
  const handleDelete = async (product: Product) => {
    if (!confirm(`Delete "${product.name}"? This cannot be undone.`)) return;
    try {
      await api.delete(`/products/${product.id}`);
      toast.success('Product deleted');
      fetchProducts();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete product');
    }
  };

  // Stats
  const stats = useMemo(() => {
    const totalProducts = products.length;
    const batteryCount = products.filter((p) => p.isBattery).length;
    const lowStock = products.filter(
      (p) => p.stock.some((s) => s.quantity <= s.lowStockAt)
    ).length;
    const totalValue = products.reduce((sum, p) => sum + p.mrp * p.totalStock, 0);
    return { totalProducts, batteryCount, lowStock, totalValue };
  }, [products]);

  return (
    <div>
      {/* ─── Stats Row ────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[
          { label: 'Asset Catalog', value: stats.totalProducts, icon: <Package size={18} />, variant: 'default' },
          { label: 'Battery Units', value: stats.batteryCount, icon: <Battery size={18} />, variant: 'primary' },
          { label: 'Critical Stock', value: stats.lowStock, icon: <AlertTriangle size={18} />, variant: stats.lowStock > 0 ? 'danger' : 'success' },
          { label: 'Estimated Value', value: stats.totalValue, icon: <Package size={18} />, isCurrency: true },
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

      {/* ─── Search + Filters + Add Button ────────── */}
      <div className="flex flex-col xl:flex-row items-stretch xl:items-center gap-4 mb-8">
        <div className="relative flex-1 group">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
          <input
            type="text"
            placeholder="Search Global Registry (SKU, Brand, Model)..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-ji-border rounded-2xl 
                       text-ji-text text-xs font-bold placeholder:text-ji-text-dim/40
                       focus:border-ji-amber focus:ring-4 focus:ring-ji-amber/5 outline-none transition-all shadow-sm"
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-xl hover:bg-ji-bg text-ji-text-dim transition-all"
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative group min-w-[180px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-4 bg-white border border-ji-border rounded-2xl 
                         text-xs font-bold text-ji-text focus:border-ji-amber outline-none cursor-pointer transition-all shadow-sm"
            >
              <option value="">All Categories</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-ji-text-dim pointer-events-none group-focus-within:rotate-180 transition-transform" />
          </div>

          <div className="relative group min-w-[160px]">
            <select
              value={batteryFilter}
              onChange={(e) => setBatteryFilter(e.target.value)}
              className="w-full appearance-none pl-4 pr-10 py-4 bg-white border border-ji-border rounded-2xl 
                         text-xs font-bold text-ji-text focus:border-ji-amber outline-none cursor-pointer transition-all shadow-sm"
            >
              <option value="">All Architectures</option>
              <option value="true">🔋 Batteries (8507)</option>
              <option value="false">Accessories (Misc)</option>
            </select>
            <ChevronDown size={14} className="absolute right-4 top-1/2 -translate-y-1/2 text-ji-text-dim pointer-events-none group-focus-within:rotate-180 transition-transform" />
          </div>

          <button
            onClick={() => {
              setEditingProduct(null);
              setShowForm(true);
            }}
            className="flex items-center justify-center gap-3 px-8 py-4 bg-ji-amber hover:bg-ji-amber/90 
                       text-white font-black rounded-2xl transition-all shadow-lg shadow-ji-amber/20 active:scale-95 text-[10px] uppercase tracking-widest whitespace-nowrap"
          >
            <Plus size={16} />
            New Entry
          </button>
        </div>
      </div>

      {/* ─── Products Table ───────────────────────── */}
      <div className="bg-white border border-ji-border rounded-[2.5rem] overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full whitespace-nowrap">
            <thead>
              <tr className="border-b border-ji-border bg-ji-bg/30">
                {['Item Specification', 'Registry SKU', 'Category', 'MRP / Unit', 'Tax Profile', 'Inventory Status', 'Control'].map(
                  (h) => (
                    <th
                      key={h}
                      className="text-left px-8 py-5 text-[10px] text-ji-text font-black uppercase tracking-[0.2em]"
                    >
                      {h}
                    </th>
                  )
                )}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-24 text-ji-text-dim">
                    <div className="flex flex-col items-center justify-center gap-4">
                      <div className="w-8 h-8 border-4 border-ji-amber border-t-transparent rounded-full animate-spin" />
                      <p className="text-[10px] font-black uppercase tracking-widest">Accessing Ledger...</p>
                    </div>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-24">
                    <div className="w-16 h-16 bg-ji-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
                      <Package size={32} className="text-ji-text-dim opacity-30" />
                    </div>
                    <p className="text-ji-text font-black uppercase tracking-widest text-sm">Registry Vacant</p>
                    <p className="text-[10px] text-ji-text-dim font-bold italic mt-2">
                      {search ? 'Search criteria returned zero records' : 'No items recorded in the inventory system'}
                    </p>
                  </td>
                </tr>
              ) : (
                products.map((product, index) => {
                  const isLowStock = product.stock.some((s) => s.quantity <= s.lowStockAt);

                  return (
                    <motion.tr
                      key={product.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-ji-border/50 hover:bg-ji-bg transition-colors cursor-pointer group"
                      onClick={() => {
                        setEditingProduct(product);
                        setShowForm(true);
                      }}
                    >
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm ${
                            product.isBattery ? 'bg-ji-amber/5 text-ji-amber' : 'bg-ji-bg text-ji-text-dim'
                          }`}>
                            {product.isBattery ? <Battery size={20} /> : <Package size={20} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-ji-text">{product.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-[10px] text-ji-text-dim font-black uppercase tracking-widest">{product.brand || 'No Brand'}</span>
                              {product.isBattery && product.voltage && product.ahRating && (
                                <span className="text-[9px] font-black font-['JetBrains_Mono'] px-1.5 py-0.5 bg-ji-amber/10 text-ji-amber rounded">
                                  {product.voltage}V / {product.ahRating}AH / {product.polarity}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="space-y-1">
                          <p className="text-[11px] font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                            {product.sku || 'N/A-SKU'}
                          </p>
                          <p className="text-[10px] font-black text-ji-text-dim/60 uppercase tracking-widest">
                            HSN: {product.hsnCode || '—'}
                          </p>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <span className="text-[9px] font-black px-2.5 py-1 rounded-lg bg-ji-bg text-ji-text border border-ji-border uppercase tracking-widest">
                          {product.category?.name || 'Uncategorized'}
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex flex-col">
                          <span className="text-sm font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                            {formatINR(product.mrp).replace('₹', '')}
                          </span>
                          <span className="text-[9px] font-black text-ji-text-dim uppercase tracking-widest opacity-40 italic">Per Unit (MRP)</span>
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <span className="text-[10px] font-black font-['JetBrains_Mono'] text-ji-text-dim bg-ji-bg px-2 py-1 rounded-md border border-ji-border">
                          {product.gstRate}% GST
                        </span>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-black font-['JetBrains_Mono'] tracking-tighter ${
                            isLowStock ? 'text-red-500' : product.totalStock > 0 ? 'text-emerald-600' : 'text-ji-text-dim'
                          }`}>
                            {product.totalStock}
                          </span>
                          {isLowStock && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                        <div className="flex flex-wrap gap-2 mt-1.5">
                          {product.stock.map((s) => (
                            <span key={s.location.id} className="text-[9px] font-black text-ji-text-dim/60 uppercase tracking-tighter">
                              {s.location.name.split(' ')[0]}: {s.quantity}
                            </span>
                          ))}
                        </div>
                      </td>

                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setEditingProduct(product);
                              setShowForm(true);
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-ji-border text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm"
                          >
                            <Edit2 size={14} />
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDelete(product);
                            }}
                            className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-ji-border text-ji-text-dim hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                          >
                            <Trash2 size={14} />
                          </button>
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

      {/* ─── Product Form Modal ───────────────────── */}
      {showForm && (
        <ProductForm
          product={editingProduct}
          categories={categories}
          onClose={() => {
            setShowForm(false);
            setEditingProduct(null);
          }}
          onSaved={() => {
            setShowForm(false);
            setEditingProduct(null);
            fetchProducts();
          }}
        />
      )}
    </div>
  );
}
