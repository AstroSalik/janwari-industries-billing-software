import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ShoppingCart,
  Plus,
  X,
  Truck,
  CheckCircle2,
  PackagePlus,
  Package,
  Trash2,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { useAccountStore } from '../stores/accountStore';
import { useLocation } from 'react-router-dom';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

export default function Purchases() {
  const location = useLocation();
  const [activeTab, setActiveTab] = useState<'purchases' | 'suppliers'>(
    new URLSearchParams(location.search).get('tab') === 'suppliers' ? 'suppliers' : 'purchases'
  );
  
  // Data
  const [purchases, setPurchases] = useState<any[]>([]);
  const [suppliers, setSuppliers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Forms
  const [showSupplierForm, setShowSupplierForm] = useState(false);
  const [showPurchaseForm, setShowPurchaseForm] = useState(false);

  const [supplierForm, setSupplierForm] = useState({ name: '', phone: '', gstin: '', paymentTerms: '' });
  
  const [purchaseForm, setPurchaseForm] = useState({
    supplierId: '',
    invoiceRef: '',
    invoiceDate: new Date().toISOString().split('T')[0],
    isPaid: false,
    paymentMode: '',
    reference: '',
    items: [] as { productId: string; quantity: number; rate: number; gstRate: number }[],
  });

  const { accounts, fetchAccounts: fetchStoreAccounts } = useAccountStore();

  const fetchData = async () => {
    try {
      setLoading(true);
      const [purchasesRes, suppliersRes, productsRes] = await Promise.all([
        api.get('/purchases'),
        api.get('/purchases/suppliers'),
        api.get('/products?limit=500'),
      ]);
      setPurchases(purchasesRes.data.data);
      setSuppliers(suppliersRes.data.data);
      setProducts(productsRes.data.data);
      fetchStoreAccounts();
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchData(); }, []);
  
  // Sync tab with URL search param
  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'suppliers' || tabParam === 'purchases') {
      setActiveTab(tabParam);
    }
  }, [location.search]);
  
  const handleSaveSupplier = async () => {
    if (!supplierForm.name.trim()) return toast.error('Name required');
    try {
      await api.post('/purchases/suppliers', supplierForm);
      toast.success('Supplier added');
      setShowSupplierForm(false);
      setSupplierForm({ name: '', phone: '', gstin: '', paymentTerms: '' });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to add supplier');
    }
  };

  const addPurchaseItem = () => {
    setPurchaseForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: '', quantity: 1, rate: 0, gstRate: 18 }],
    }));
  };

  const updatePurchaseItem = (index: number, field: string, value: any) => {
    const newItems = [...purchaseForm.items];
    (newItems[index] as any)[field] = value;
    if (field === 'productId') {
      const prod = products.find(p => p.id === value);
      if (prod) {
        newItems[index].rate = prod.costPrice || 0;
        newItems[index].gstRate = prod.gstRate || 18;
      }
    }
    setPurchaseForm({ ...purchaseForm, items: newItems });
  };

  const removePurchaseItem = (index: number) => {
    const newItems = [...purchaseForm.items];
    newItems.splice(index, 1);
    setPurchaseForm({ ...purchaseForm, items: newItems });
  };

  const handleSavePurchase = async () => {
    if (!purchaseForm.supplierId) return toast.error('Please select a supplier');
    if (purchaseForm.items.length === 0) return toast.error('Add at least one item');
    if (purchaseForm.items.some(i => !i.productId || i.quantity <= 0)) {
      return toast.error('Please complete all item lines');
    }
    try {
      await api.post('/purchases', purchaseForm);
      toast.success('Purchase logged & stock updated');
      setShowPurchaseForm(false);
      setPurchaseForm({
        supplierId: '', invoiceRef: '', invoiceDate: new Date().toISOString().split('T')[0], isPaid: false, paymentMode: '', reference: '', items: [],
      });
      fetchData();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to check inward stock');
    }
  };

  return (
    <div>
      {/* Tabs */}
      <div className="flex items-center gap-6 border-b border-ji-border mb-6 overflow-x-auto no-scrollbar">
        <button
          onClick={() => setActiveTab('purchases')}
          className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === 'purchases' ? 'text-ji-amber' : 'text-ji-text-muted hover:text-ji-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <ShoppingCart size={16} /> Inward Stock
          </div>
          {activeTab === 'purchases' && (
            <motion.div layoutId="purchaseTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-ji-amber" />
          )}
        </button>
        <button
          onClick={() => setActiveTab('suppliers')}
          className={`pb-3 text-sm font-semibold transition-colors relative whitespace-nowrap ${
            activeTab === 'suppliers' ? 'text-ji-amber' : 'text-ji-text-muted hover:text-ji-text'
          }`}
        >
          <div className="flex items-center gap-2">
            <Truck size={16} /> Suppliers
          </div>
          {activeTab === 'suppliers' && (
            <motion.div layoutId="purchaseTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-ji-amber" />
          )}
        </button>
      </div>

      {loading ? (
        <div className="py-20 flex justify-center text-ji-text-dim">
          <div className="w-6 h-6 border-2 border-ji-amber border-t-transparent rounded-full animate-spin" />
        </div>
      ) : activeTab === 'purchases' ? (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4">
            <div className="flex gap-3 w-full sm:w-auto">
              <div className="flex-1 sm:flex-none bg-ji-surface border border-ji-border px-4 py-2 rounded-lg shadow-sm">
                <span className="text-[10px] text-ji-text-dim uppercase font-bold block">Total Purchases</span>
                <span className="text-lg font-bold font-['JetBrains_Mono'] text-ji-text">{purchases.length}</span>
              </div>
              <div className="flex-1 sm:flex-none bg-ji-surface border border-ji-border px-4 py-2 rounded-lg shadow-sm">
                <span className="text-[10px] text-ji-text-dim uppercase font-bold block">Unpaid Bills</span>
                <span className="text-lg font-bold font-['JetBrains_Mono'] text-ji-amber">
                  {purchases.filter(p => !p.isPaid).length}
                </span>
              </div>
            </div>
            <button
              onClick={() => { setShowPurchaseForm(true); setShowSupplierForm(false); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2 bg-ji-amber hover:bg-ji-amber/90 text-white font-semibold rounded-md transition-colors text-sm shadow-md"
            >
              <PackagePlus size={16} /> Log Inward Stock
            </button>
          </div>

          <div className="bg-ji-surface border border-ji-border rounded-xl overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap">
                <thead>
                  <tr className="bg-ji-bg/50 border-b border-ji-border">
                    {['Date / Ref', 'Supplier', 'Items', 'Total Amount', 'Status'].map((h) => (
                      <th key={h} className="text-left px-6 py-4 text-[10px] text-ji-text-dim font-bold uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ji-border">
                  {purchases.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12 text-ji-text-muted italic">No purchases found</td>
                    </tr>
                  ) : (
                    purchases.map((p, i) => (
                      <motion.tr
                        key={p.id}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: i * 0.02 }}
                        className="hover:bg-ji-bg transition-colors"
                      >
                        <td className="px-6 py-4 font-['JetBrains_Mono']">
                          <div className="text-sm font-bold text-ji-text">{p.invoiceRef || 'No Ref'}</div>
                          <div className="text-[10px] text-ji-text-dim mt-0.5">
                            {p.invoiceDate ? new Date(p.invoiceDate).toLocaleDateString('en-GB') : new Date(p.createdAt).toLocaleDateString('en-GB')}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-ji-text flex items-center gap-2 font-medium">
                            <Truck size={14} className="text-ji-text-dim" /> {p.supplier?.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-ji-text-muted font-['JetBrains_Mono']">
                          {p.items.length} lines <span className="text-[10px] opacity-70">({p.items.reduce((sum: number, i: any) => sum + i.quantity, 0)} qty)</span>
                        </td>
                        <td className="px-6 py-4 text-sm font-['JetBrains_Mono'] font-bold text-ji-amber">
                          {formatINR(p.totalAmount)}
                        </td>
                        <td className="px-6 py-4">
                          {p.isPaid ? (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              <CheckCircle2 size={10} /> Paid
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-ji-amber/10 text-ji-amber border border-ji-amber/20">
                              Unpaid
                            </span>
                          )}
                        </td>
                      </motion.tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      ) : (
        <div>
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <div className="bg-ji-surface border border-ji-border px-5 py-3 rounded-xl shadow-sm w-full sm:w-auto">
              <span className="text-[10px] text-ji-text-dim uppercase font-bold block mb-1">Registered Suppliers</span>
              <span className="text-2xl font-bold font-['JetBrains_Mono'] text-ji-text">{suppliers.length}</span>
            </div>
            <button
              onClick={() => { setShowSupplierForm(true); setShowPurchaseForm(false); }}
              className="w-full sm:w-auto flex items-center justify-center gap-2 px-5 py-2.5 bg-ji-amber hover:bg-ji-amber/90 text-white font-semibold rounded-lg transition-all shadow-md active:scale-[0.98]"
            >
              <Plus size={18} /> Add Supplier
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {suppliers.map((s, i) => (
              <motion.div
                key={s.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-ji-surface border border-ji-border rounded-xl p-6 shadow-sm hover:shadow-md transition-all group hover:border-ji-amber/30"
              >
                <div className="w-10 h-10 rounded-lg bg-ji-bg border border-ji-border flex items-center justify-center text-ji-text-dim mb-4 group-hover:bg-ji-amber/10 group-hover:text-ji-amber transition-colors">
                  <Truck size={20} />
                </div>
                <h3 className="text-xl font-bold text-ji-text mb-1 font-['Playfair_Display']">{s.name}</h3>
                <p className="text-sm text-ji-text-dim font-['JetBrains_Mono'] mb-4 font-bold">{s.phone || 'No phone'}</p>
                <div className="space-y-2 pt-4 border-t border-ji-border">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-ji-text-dim uppercase font-bold tracking-wider">GSTIN</span>
                    <span className="text-xs text-ji-text font-['JetBrains_Mono'] font-bold">{s.gstin || '—'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-ji-text-dim uppercase font-bold tracking-wider">Terms</span>
                    <span className="text-xs text-ji-text font-medium">{s.paymentTerms || '—'}</span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* ─── MODALS ─── */}
      <AnimatePresence>
        {showPurchaseForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPurchaseForm(false)} className="fixed inset-0 bg-ji-text/20 backdrop-blur-md z-40" />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto"
            >
              <div className="bg-white border border-ji-border rounded-3xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden">
                <div className="flex justify-between items-center px-8 py-6 border-b border-ji-border bg-white">
                  <h2 className="text-xl font-bold font-['Playfair_Display'] text-ji-text flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-ji-amber/10 flex items-center justify-center">
                      <PackagePlus size={20} className="text-ji-amber" />
                    </div>
                    Log Inward Stock
                  </h2>
                  <button onClick={() => setShowPurchaseForm(false)} className="p-2 hover:bg-ji-bg rounded-full text-ji-text-dim hover:text-ji-text transition-all active:scale-90">
                    <X size={24} />
                  </button>
                </div>
                
                <div className="p-8 flex-1 overflow-y-auto space-y-8 bg-slate-50/30">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
                    <div className="col-span-1 sm:col-span-2 space-y-2">
                      <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Supplier *</label>
                      <select
                        value={purchaseForm.supplierId}
                        onChange={e => setPurchaseForm({ ...purchaseForm, supplierId: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-sm text-ji-text focus:border-ji-amber outline-none transition-all shadow-sm"
                      >
                        <option value="">Select supplier...</option>
                        {suppliers.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                      </select>
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Bill Reference</label>
                      <input
                        type="text"
                        value={purchaseForm.invoiceRef}
                        onChange={e => setPurchaseForm({ ...purchaseForm, invoiceRef: e.target.value })}
                        placeholder="e.g. JI/BILL/2024"
                        className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-sm text-ji-text font-['JetBrains_Mono'] font-bold focus:border-ji-amber outline-none transition-all shadow-sm"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Bill Date</label>
                      <input
                        type="date"
                        value={purchaseForm.invoiceDate}
                        onChange={e => setPurchaseForm({ ...purchaseForm, invoiceDate: e.target.value })}
                        className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-sm text-ji-text focus:border-ji-amber outline-none transition-all shadow-sm"
                      />
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex justify-between items-end px-1">
                      <h3 className="text-xs font-bold text-ji-text uppercase tracking-widest flex items-center gap-2">
                        <Package size={14} className="text-ji-text-dim" /> Stock Items
                      </h3>
                      <button onClick={addPurchaseItem} className="text-xs text-ji-amber flex items-center gap-1.5 font-bold hover:text-ji-amber/80 transition-all active:scale-95 bg-ji-amber/5 px-3 py-1.5 rounded-lg border border-ji-amber/20">
                        <Plus size={14} /> Add New Line
                      </button>
                    </div>
                    
                    <div className="bg-white border border-ji-border rounded-2xl overflow-hidden shadow-sm">
                      <div className="overflow-x-auto">
                        <table className="w-full whitespace-nowrap">
                          <thead className="bg-ji-bg/50 border-b border-ji-border">
                            <tr>
                              <th className="px-6 py-4 text-left text-[10px] font-bold text-ji-text-dim uppercase tracking-wider">Product Selection</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-ji-text-dim uppercase tracking-wider">Qty</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-ji-text-dim uppercase tracking-wider">Base Rate</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-ji-text-dim uppercase tracking-wider">GST%</th>
                              <th className="px-6 py-4 text-right text-[10px] font-bold text-ji-text-dim uppercase tracking-wider">Line Sum</th>
                              <th className="w-16 px-6 py-4"></th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-ji-border/50">
                            {purchaseForm.items.length === 0 ? (
                              <tr><td colSpan={6} className="text-center py-10 text-sm text-ji-text-dim italic font-medium">No items added to this purchase yet</td></tr>
                            ) : (
                              purchaseForm.items.map((item, index) => {
                                const lineTotal = item.quantity * item.rate * (1 + item.gstRate / 100);
                                return (
                                  <tr key={index} className="hover:bg-ji-bg/30 transition-colors group">
                                    <td className="px-4 py-3">
                                      <select
                                        value={item.productId}
                                        onChange={e => updatePurchaseItem(index, 'productId', e.target.value)}
                                        className="w-full min-w-[240px] px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text font-bold focus:border-ji-amber outline-none"
                                      >
                                        <option value="">Select product...</option>
                                        {products.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                                      </select>
                                    </td>
                                    <td className="px-4 py-3">
                                      <input type="number" min="1" value={item.quantity} onChange={e => updatePurchaseItem(index, 'quantity', Number(e.target.value))} className="w-20 px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text font-bold text-right ms-auto block focus:border-ji-amber outline-none shadow-inner font-['JetBrains_Mono']" />
                                    </td>
                                    <td className="px-4 py-3">
                                      <input type="number" min="0" value={item.rate} onChange={e => updatePurchaseItem(index, 'rate', Number(e.target.value))} className="w-28 px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text font-bold text-right ms-auto block focus:border-ji-amber outline-none shadow-inner font-['JetBrains_Mono']" />
                                    </td>
                                    <td className="px-4 py-3">
                                      <select value={item.gstRate} onChange={e => updatePurchaseItem(index, 'gstRate', Number(e.target.value))} className="w-20 px-3 py-2 bg-ji-bg border border-ji-border rounded-lg text-sm text-ji-text font-bold text-right ms-auto block focus:border-ji-amber outline-none">
                                        {[0, 5, 12, 18, 28].map(r => <option key={r} value={r}>{r}%</option>)}
                                      </select>
                                    </td>
                                    <td className="px-6 py-3 text-right font-['JetBrains_Mono'] text-sm font-bold text-ji-text">
                                      {formatINR(lineTotal || 0)}
                                    </td>
                                    <td className="px-6 py-3 text-center">
                                      <button onClick={() => removePurchaseItem(index)} className="text-ji-text-dim hover:text-red-500 p-2 rounded-lg hover:bg-red-50 transition-all"><Trash2 size={16}/></button>
                                    </td>
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center bg-white p-6 rounded-2xl border border-ji-border shadow-sm gap-6">
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="relative inline-flex items-center cursor-pointer">
                          <input 
                            type="checkbox" 
                            id="isPaid" 
                            checked={purchaseForm.isPaid} 
                            onChange={e => setPurchaseForm({...purchaseForm, isPaid: e.target.checked})} 
                            className="sr-only peer"
                          />
                          <div className="w-11 h-6 bg-ji-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-ji-border after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                          <label htmlFor="isPaid" className="ml-3 text-sm font-bold text-ji-text cursor-pointer">Mark as Settled/Paid</label>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {purchaseForm.isPaid && (
                          <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="flex flex-wrap gap-3 p-3 bg-emerald-50 rounded-xl border border-emerald-100"
                          >
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest ml-1">Paid From</label>
                              <select
                                value={purchaseForm.paymentMode}
                                onChange={e => setPurchaseForm({ ...purchaseForm, paymentMode: e.target.value })}
                                className="bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs text-ji-text font-bold focus:border-emerald-500 outline-none min-w-[160px]"
                                required
                              >
                                <option value="">Select Account...</option>
                                {accounts.map(acc => (
                                  <option key={acc.id} value={acc.id}>{acc.name}</option>
                                ))}
                              </select>
                            </div>
                            <div className="space-y-1">
                              <label className="text-[8px] font-bold text-emerald-600 uppercase tracking-widest ml-1">Payment Ref</label>
                              <input
                                type="text"
                                placeholder="Ref / Note"
                                value={purchaseForm.reference}
                                onChange={e => setPurchaseForm({ ...purchaseForm, reference: e.target.value })}
                                className="bg-white border border-emerald-200 rounded-lg px-3 py-2 text-xs text-ji-text font-bold w-32 focus:border-emerald-500 outline-none"
                              />
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                    <div className="text-right flex flex-col items-end">
                      <p className="text-[10px] text-ji-text-dim uppercase font-bold tracking-[0.2em] mb-1">Purchase Grand Total</p>
                      <p className="text-4xl font-bold font-['JetBrains_Mono'] text-ji-amber">
                        {formatINR(purchaseForm.items.reduce((s, i) => s + (i.quantity * i.rate * (1 + i.gstRate/100)), 0))}
                      </p>
                      <p className="text-[10px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded mt-2 border border-emerald-100">Round off included</p>
                    </div>
                  </div>
                </div>

                <div className="px-8 py-6 border-t border-ji-border flex justify-end gap-4 bg-white">
                  <button 
                    onClick={() => setShowPurchaseForm(false)} 
                    className="px-6 py-2.5 text-sm font-bold text-ji-text-dim hover:text-ji-text transition-all active:scale-95"
                  >
                    Cancel
                  </button>
                  <button 
                    onClick={handleSavePurchase} 
                    className="px-10 py-2.5 bg-ji-amber hover:bg-ji-amber/90 text-white font-bold rounded-xl text-sm shadow-xl shadow-ji-amber/20 transition-all active:scale-95 flex items-center gap-2"
                  >
                    <CheckCircle2 size={18} /> Consign & Save Stock
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}

        {/* Supplier Form Slideover */}
        {showSupplierForm && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowSupplierForm(false)} className="fixed inset-0 bg-ji-text/20 backdrop-blur-md z-40" />
            <motion.div
              initial={{ x: '100%' }} animate={{ x: 0 }} exit={{ x: '100%' }} transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed inset-y-0 right-0 w-full sm:w-[450px] bg-white border-l border-ji-border shadow-2xl z-50 flex flex-col"
            >
              <div className="flex justify-between items-center p-8 border-b border-ji-border bg-white shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-ji-amber/10 flex items-center justify-center">
                     <Plus className="text-ji-amber" size={24} />
                  </div>
                  <h2 className="text-2xl font-bold font-['Playfair_Display'] text-ji-text">New Supplier</h2>
                </div>
                <button onClick={() => setShowSupplierForm(false)} className="p-2 hover:bg-ji-bg rounded-full text-ji-text-dim hover:text-ji-text transition-all active:scale-90">
                   <X size={24} />
                </button>
              </div>

              <div className="p-8 flex-1 space-y-6 overflow-y-auto bg-slate-50/30">
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Supplier/Vendor Name *</label>
                  <input 
                    type="text" 
                    value={supplierForm.name} 
                    onChange={e => setSupplierForm({...supplierForm, name: e.target.value})} 
                    placeholder="Enter business name"
                    className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-sm text-ji-text font-bold focus:border-ji-amber outline-none shadow-sm transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Primary Contact</label>
                  <input 
                    type="text" 
                    value={supplierForm.phone} 
                    onChange={e => setSupplierForm({...supplierForm, phone: e.target.value})} 
                    placeholder="Phone or mobile"
                    className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-sm text-ji-text font-['JetBrains_Mono'] font-bold focus:border-ji-amber outline-none shadow-sm transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">GSTIN Number</label>
                  <input 
                    type="text" 
                    value={supplierForm.gstin} 
                    onChange={e => setSupplierForm({...supplierForm, gstin: e.target.value})} 
                    placeholder="22AAAAA0000A1Z5"
                    className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-sm text-ji-text font-['JetBrains_Mono'] font-bold uppercase placeholder:normal-case focus:border-ji-amber outline-none shadow-sm transition-all" 
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-bold text-ji-text-dim uppercase tracking-widest ml-1">Credit / Payment Terms</label>
                  <input 
                    type="text" 
                    value={supplierForm.paymentTerms} 
                    onChange={e => setSupplierForm({...supplierForm, paymentTerms: e.target.value})} 
                    placeholder="e.g. 15 Days Credit, Advance" 
                    className="w-full px-4 py-3 bg-white border border-ji-border rounded-xl text-sm text-ji-text font-bold focus:border-ji-amber outline-none shadow-sm transition-all" 
                  />
                </div>
              </div>

              <div className="p-8 border-t border-ji-border bg-white">
                <button 
                  onClick={handleSaveSupplier} 
                  className="w-full py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-bold rounded-2xl text-sm shadow-xl shadow-ji-amber/20 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={18} /> Register Supplier
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
