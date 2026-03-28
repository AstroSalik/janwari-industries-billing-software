import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Search, ChevronDown, Shield, Filter, PackageSearch, Clock } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../stores/cartStore';

interface BatterySerial {
  id: string;
  serial: string;
  status: string;
  createdAt: string;
  product: {
    name: string;
    brand: string;
    voltage: number | null;
    ahRating: number | null;
    warrantyFreeMonths: number | null;
    warrantyProRataMonths: number | null;
  };
  invoiceItem: {
    invoice: {
      invoiceNumber: string;
      createdAt: string;
      customer: { name: string; phone: string } | null;
    };
  } | null;
}

export default function BatteryTracker() {
  const navigate = useNavigate();
  const { setCustomer, addItem, clearCart } = useCartStore();
  const [batteries, setBatteries] = useState<BatterySerial[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [total, setTotal] = useState(0);
  const [warrantyModal, setWarrantyModal] = useState<any>(null);

  const fetchBatteries = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get('/batteries', { params });
      setBatteries(res.data.data);
      setTotal(res.data.total);
    } catch {
      toast.error('Failed to load batteries');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchBatteries(); }, []);
  useEffect(() => {
    const timer = setTimeout(fetchBatteries, 300);
    return () => clearTimeout(timer);
  }, [search, statusFilter]);

  const checkWarranty = async (battery: BatterySerial) => {
    try {
      const res = await api.get(`/batteries/${battery.id}/warranty`);
      setWarrantyModal(res.data.data);
    } catch {
      toast.error('Failed to check warranty');
    }
  };
 
  const handleProcessClaim = () => {
    if (!warrantyModal) return;
    
    // 1. Prepare for new transaction
    clearCart();
    
    // 2. Set customer
    if (warrantyModal.customer) {
      setCustomer(warrantyModal.customer);
    }
    
    // 3. Add replacement battery
    const battery = warrantyModal.serial;
    const isFree = warrantyModal.warranty.status === 'FREE_REPLACEMENT';
    const credit = warrantyModal.warranty.proRataAmount || 0;
    
    addItem({
      ...battery.product,
      mrp: isFree ? 0 : Math.max(0, battery.product.mrp - credit),
      isWarrantyClaim: true,
      claimType: isFree ? 'FREE' : 'PRO_RATA',
      originalSerialId: battery.id,
      originalSerialNumber: battery.serial,
    });
    
    toast.success(`Started ${isFree ? 'Free' : 'Pro-rata'} claim for ${battery.serial}`);
    navigate('/billing');
  };

  // Stats
  const inStock = batteries.filter((b) => b.status === 'IN_STOCK').length;
  const sold = batteries.filter((b) => b.status === 'SOLD').length;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Total Serials', value: total, color: 'text-ji-text' },
          { label: 'In Stock', value: inStock, color: 'text-emerald-500' },
          { label: 'Sold', value: sold, color: 'text-blue-500' },
          { label: 'Exchanged/Scrapped', value: total - inStock - sold, color: 'text-ji-amber' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-ji-surface border border-ji-border rounded-xl p-4 shadow-sm"
          >
            <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-wider">{stat.label}</p>
            <p className={`text-xl font-bold font-['JetBrains_Mono'] mt-1 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>


      <div className="bg-ji-surface border border-ji-border rounded-xl p-4 sm:p-6 shadow-sm mb-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="md:col-span-2 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-ji-text-dim" size={18} />
            <input 
              type="text"
              placeholder="Search Serial Number (Partial or Full)..."
              className="w-full bg-ji-bg border border-ji-border rounded-lg pl-10 pr-4 py-2.5 text-ji-text placeholder-ji-text-dim focus:border-ji-amber focus:ring-1 focus:ring-ji-amber/20 outline-none transition-all font-['JetBrains_Mono'] shadow-inner"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-ji-text-dim" size={18} />
            <select 
              className="w-full bg-ji-bg border border-ji-border rounded-lg pl-10 pr-4 py-2.5 text-ji-text focus:border-ji-amber outline-none transition-all shadow-inner appearance-none"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="IN_STOCK">In Stock</option>
              <option value="SOLD">Sold</option>
              <option value="EXCHANGED">Exchanged</option>
              <option value="SCRAPPED">Scrapped</option>
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-ji-text-dim pointer-events-none" />
          </div>
        </div>
      </div>

      {/* ─── Product Table ─────────────────────── */}
      <div className="bg-ji-surface border border-ji-border rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto overflow-y-auto max-h-[600px] scrollbar-thin scrollbar-thumb-ji-border scrollbar-track-transparent">
          <table className="w-full text-left border-collapse min-w-[1000px]">
            <thead className="sticky top-0 z-10">
              <tr className="bg-ji-bg/80 backdrop-blur-md text-[10px] text-ji-text-muted uppercase tracking-widest border-b border-ji-border">
                <th className="px-6 py-4 font-bold">Serial Number</th>
                <th className="px-6 py-4 font-bold">Base Product</th>
                <th className="px-6 py-4 font-bold">Current Status</th>
                <th className="px-6 py-4 font-bold">Batch/Purchase Info</th>
                <th className="px-6 py-4 font-bold">Sale Info</th>
                <th className="px-6 py-4 font-bold">Warranty</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ji-border">
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-12 text-ji-text-dim">
                  <div className="w-4 h-4 border-2 border-ji-amber border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  Loading...
                </td>
              </tr>
            ) : batteries.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-20 text-center text-ji-text-dim">
                  <PackageSearch size={48} className="mx-auto mb-4 opacity-20" />
                  <p className="text-lg font-['Playfair_Display'] font-semibold">No batteries found</p>
                  <p className="text-sm">Try adjusting your search or filters</p>
                </td>
              </tr>
            ) : (
              batteries.map((bat, i) => {
                return (
                  <motion.tr
                    key={bat.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: i * 0.02 }}
                    className="hover:bg-ji-bg transition-colors"
                  >
                    <td className="px-6 py-4">
                      <p className="font-['JetBrains_Mono'] font-bold text-ji-text flex items-center gap-2">
                        {bat.serial}
                        <div className="w-1.5 h-1.5 rounded-full bg-ji-amber animate-pulse" title="Live tracked" />
                      </p>
                    </td>
                    <td className="px-6 py-4">
                      <p className="text-sm font-medium text-ji-text">{bat.product.name}</p>
                      <p className="text-[10px] text-ji-text-muted mt-0.5">{bat.product.brand}</p>
                    </td>
                    <td className="px-6 py-4">
                      <StatusBadge status={bat.status} />
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-1.5 text-xs text-ji-text font-medium">
                          <Clock size={12} className="text-ji-text-dim" />
                          <span>Bought: {new Date(bat.createdAt).toLocaleDateString('en-GB')}</span>
                        </div>
                        {bat.invoiceItem && (
                          <p className="text-[10px] text-ji-text-muted">Inv. Date: {new Date(bat.invoiceItem.invoice.createdAt).toLocaleDateString('en-GB')}</p>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      {bat.invoiceItem ? (
                        <div className="flex flex-col gap-1">
                          <p className="text-sm text-ji-text">{bat.invoiceItem.invoice.customer?.name || 'Walk-in'}</p>
                          <p className="text-[10px] font-['JetBrains_Mono'] text-ji-text-muted">
                            Inv: #{bat.invoiceItem.invoice.invoiceNumber}
                          </p>
                        </div>
                      ) : (
                        <span className="text-ji-text-dim text-sm">—</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {bat.status === 'SOLD' && (
                        <button
                          onClick={() => checkWarranty(bat)}
                          className="flex items-center gap-1 px-2 py-1 text-xs bg-ji-amber/10 hover:bg-ji-amber/20 text-ji-amber rounded transition-colors"
                        >
                          <Shield size={12} />
                          Check
                        </button>
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

    {/* Warranty Modal */}
      {warrantyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setWarrantyModal(null)} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative w-full max-w-md bg-ji-surface border border-ji-border rounded-xl shadow-2xl p-5 sm:p-6"
          >
            <h3 className="text-lg font-['Playfair_Display'] font-bold text-ji-text mb-4">Warranty Status</h3>

            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-ji-text-muted">Serial</span>
                <span className="font-['JetBrains_Mono'] text-ji-amber">{warrantyModal.serial?.serial}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ji-text-muted">Product</span>
                <span className="text-ji-text">{warrantyModal.serial?.product?.name}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ji-text-muted">Customer</span>
                <span className="text-ji-text">{warrantyModal.customer?.name || 'Walk-in'}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-ji-text-muted">Purchase Date</span>
                <span className="font-['JetBrains_Mono'] text-ji-text">
                  {warrantyModal.purchaseDate
                    ? new Date(warrantyModal.purchaseDate).toLocaleDateString('en-IN')
                    : '—'}
                </span>
              </div>

              <div className="border-t border-ji-border pt-3">
                <div className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-semibold ${
                  warrantyModal.warranty.status === 'FREE_REPLACEMENT'
                    ? 'bg-emerald-500/10 text-emerald-500'
                    : warrantyModal.warranty.status === 'PRO_RATA'
                      ? 'bg-ji-amber/10 text-ji-amber'
                      : 'bg-red-500/10 text-red-500'
                }`}>
                  <Shield size={16} />
                  {warrantyModal.warranty.message}
                </div>

                {warrantyModal.warranty.proRataAmount && (
                  <div className="mt-3 p-3 bg-ji-bg rounded-lg">
                    <p className="text-xs text-ji-text-muted mb-1">Pro-rata credit amount:</p>
                    <p className="text-xl font-bold font-['JetBrains_Mono'] text-ji-amber">
                      {new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(warrantyModal.warranty.proRataAmount)}
                    </p>
                    <p className="text-[10px] text-ji-text-dim mt-1">
                      Original MRP: ₹{warrantyModal.warranty.originalMRP} × {warrantyModal.warranty.remainingProRata}/{warrantyModal.warranty.proRataMonths} months
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setWarrantyModal(null)}
                className="flex-1 px-4 py-2 border border-ji-border hover:border-ji-amber/40 text-ji-text font-medium rounded-md transition-colors text-sm"
              >
                Close
              </button>
              {(warrantyModal.warranty.status === 'FREE_REPLACEMENT' || warrantyModal.warranty.status === 'PRO_RATA') && (
                <button
                  onClick={handleProcessClaim}
                  className="flex-1 px-4 py-2 bg-ji-amber hover:bg-ji-amber/80 text-black font-semibold rounded-md transition-colors text-sm"
                >
                  Process Claim
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    IN_STOCK: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
    SOLD: 'bg-ji-amber/10 text-ji-amber border-ji-amber/20',
    EXCHANGED: 'bg-ji-bg text-ji-text-dim border-ji-border',
    SCRAPPED: 'bg-red-500/10 text-red-600 border-red-500/20'
  };

  const labels: Record<string, string> = {
    IN_STOCK: 'In Stock',
    SOLD: 'Sold',
    EXCHANGED: 'Exchanged',
    SCRAPPED: 'Scrapped'
  };

  const config = styles[status] || styles.IN_STOCK;

  return (
    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${config}`}>
      {labels[status] || status}
    </span>
  );
}
