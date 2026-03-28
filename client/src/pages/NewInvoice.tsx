import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Trash2,
  Users,
  X,
  CreditCard,
  Banknote,
  Smartphone,
  ShoppingCart,
  Battery,
  Wrench,
  Printer,
  Zap,
  RefreshCcw,
} from 'lucide-react';
import { useCartStore } from '../stores/cartStore';
import { generateInvoicePDF } from '../lib/invoicePdf';
import api from '../lib/api';
import toast from 'react-hot-toast';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const getStateLabel = (stateCode?: string) => {
  if (!stateCode || stateCode === '01') return 'J&K';
  return `State Code ${stateCode}`;
};

// ═══════════════════════════════════════════════════
// NEW INVOICE PAGE — Optimized for Speed
// ═══════════════════════════════════════════════════

export default function NewInvoice({ isQuote = false }: { isQuote?: boolean }) {
  const navigate = useNavigate();
  const { items, customer, mechanic, payment, notes, clearCart, grandTotal,
    subtotal, totalDiscount, totalTaxable, totalCGST, totalSGST, totalIGST,
    isInterState, addItem, setCustomer, setMechanic: setMechanicStore, setPayment: setPaymentStore, setNotes: setNotesStore } = useCartStore();
  const [finalizing, setFinalizing] = useState(false);
  const [showExchangeModal, setShowExchangeModal] = useState(false);

  // ─── Draft Auto-Save (every 30s) ──────────────────
  const DRAFT_KEY = 'ji_invoice_draft';

  // Save draft every 30 seconds
  useEffect(() => {
    if (items.length === 0) return; // Don't save empty cart
    const interval = setInterval(() => {
      const draft = { items, customer, mechanic, payment, notes, savedAt: Date.now() };
      localStorage.setItem(DRAFT_KEY, JSON.stringify(draft));
    }, 30000);
    return () => clearInterval(interval);
  }, [items, customer, mechanic, payment, notes]);

  // Restore draft on mount
  useEffect(() => {
    if (items.length > 0) return; // Don't restore if cart has items
    const saved = localStorage.getItem(DRAFT_KEY);
    if (saved) {
      try {
        const draft = JSON.parse(saved);
        const ageMinutes = Math.round((Date.now() - draft.savedAt) / 60000);
        if (ageMinutes < 1440) { // Less than 24 hours old
          toast((t) => (
            <div className="flex items-center gap-3">
              <span className="text-sm">Restore draft? ({ageMinutes}m ago, {draft.items?.length || 0} items)</span>
              <button
                onClick={() => {
                  // Restore items by adding them back
                  draft.items?.forEach((item: any) => addItem({
                    id: item.productId, name: item.name, brand: item.brand, sku: item.sku,
                    hsnCode: item.hsnCode, mrp: item.mrp, gstRate: item.gstRate,
                    isBattery: item.isBattery, unit: item.unit, totalStock: 99,
                  }));
                  if (draft.customer) setCustomer(draft.customer);
                  if (draft.mechanic) setMechanicStore(draft.mechanic);
                  if (draft.payment) setPaymentStore(draft.payment);
                  if (draft.notes) setNotesStore(draft.notes);
                  toast.dismiss(t.id);
                  toast.success('Draft restored!');
                }}
                className="px-2 py-1 bg-ji-amber text-white text-xs font-semibold rounded"
              >
                Restore
              </button>
              <button
                onClick={() => {
                  localStorage.removeItem(DRAFT_KEY);
                  toast.dismiss(t.id);
                }}
                className="text-xs text-ji-text-muted hover:text-ji-text"
              >
                Discard
              </button>
            </div>
          ), { duration: 10000 });
        } else {
          localStorage.removeItem(DRAFT_KEY);
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
  }, [items, addItem, setCustomer, setMechanicStore, setPaymentStore, setNotesStore]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'F5') {
        e.preventDefault();
        setShowExchangeModal(true);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleFinalize = async () => {
    if (items.length === 0) { toast.error('Add at least one item'); return; }

    setFinalizing(true);
    try {
      const payload = {
        customerId: customer?.id,
        mechanicId: mechanic?.id,
        items: items.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          rate: item.mrp,
          discount: item.discount,
          gstRate: item.gstRate,
          hsnCode: item.hsnCode,
          serialNumber: item.serialNumber,
          isBattery: item.isBattery,
          isExchange: item.isExchange,
          isWarrantyClaim: item.isWarrantyClaim,
          isCustomItem: item.isCustomItem,
          claimType: item.claimType,
          originalSerialId: item.originalSerialId,
          descriptionText: item.sourceDescription || item.name,
          unit: item.unit,
        })),
        payments: [
          ...(payment.cash > 0 ? [{ mode: 'CASH' as const, amount: payment.cash }] : []),
          ...(payment.upi > 0 ? [{ mode: 'UPI' as const, amount: payment.upi }] : []),
          ...(payment.credit > 0 ? [{ mode: 'CREDIT' as const, amount: payment.credit }] : []),
        ],
        notes: notes || undefined,
        type: isQuote ? 'QUOTE' as const : 'TAX_INVOICE' as const,
      };

      const res = await api.post('/invoices/finalize', payload);
      const invoice = res.data.data;

      // Generate PDF
      await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        date: new Date(invoice.createdAt).toLocaleDateString('en-IN', {
          day: '2-digit', month: '2-digit', year: 'numeric',
        }),
        customer: customer ? {
          name: customer.name,
          phone: customer.phone,
          address: customer.address,
          stateCode: customer.stateCode,
          gstin: customer.gstin,
        } : undefined,
        items: items.map((item) => ({
          name: item.name,
          hsnCode: item.hsnCode,
          quantity: item.quantity,
          rate: item.mrp,
          discount: item.discount,
          gstRate: item.gstRate,
          cgst: isInterState ? 0 : Math.round((item.lineGST / 2) * 100) / 100,
          sgst: isInterState ? 0 : Math.round((item.lineGST / 2) * 100) / 100,
          igst: isInterState ? item.lineGST : 0,
          lineTotal: item.lineGrandTotal,
        })),
        subtotal,
        totalDiscount,
        totalTaxable,
        totalCGST,
        totalSGST,
        totalIGST,
        grandTotal,
        paidAmount: payment.cash + payment.upi + payment.credit,
        balanceAmount: Math.max(0, grandTotal - payment.cash - payment.upi - payment.credit),
        isInterState,
        payments: [
          ...(payment.cash > 0 ? [{ mode: 'Cash', amount: payment.cash }] : []),
          ...(payment.upi > 0 ? [{ mode: 'UPI', amount: payment.upi }] : []),
          ...(payment.credit > 0 ? [{ mode: 'Credit', amount: payment.credit }] : []),
        ],
        notes: notes || undefined,
      });

      toast.success(`${isQuote ? 'Quote' : 'Invoice'} ${invoice.invoiceNumber} saved & PDF downloaded!`);
      localStorage.removeItem(DRAFT_KEY);
      clearCart();
      navigate(isQuote ? '/quotes' : '/invoices');
    } catch (err: any) {
      toast.error(err.response?.data?.error || `Failed to save ${isQuote ? 'quote' : 'invoice'}`);
    } finally {
      setFinalizing(false);
    }
  };

  return (
    <div className="flex flex-col lg:flex-row gap-8 lg:h-[calc(100vh-8rem)] min-h-0 overflow-y-auto lg:overflow-visible pb-10 lg:pb-0">
      {/* ─── Left: Quick Add + Cart ───────────────── */}
      <div className="lg:flex-[3.5] flex flex-col min-w-0 gap-6">
        <QuickAddPanel />
        <CartTable />
      </div>

      {/* ─── Right: Customer + Mechanic + Totals + Payment ── */}
      <div className="lg:flex-[2] flex flex-col min-w-0 gap-6">
        <div className="space-y-4">
          <CustomerSelector />
          <MechanicSelector />
        </div>
        <TotalsPanel isQuote={isQuote} />
        <PaymentPanel onFinalize={handleFinalize} finalizing={finalizing} isQuote={isQuote} />
      </div>

      {/* Exchange Modal */}
      {showExchangeModal && (
        <ExchangeModal
          onClose={() => setShowExchangeModal(false)}
          onAdd={(exchange) => {
            addItem({
              id: `exchange-${Date.now()}`,
              name: `EXCHANGE: ${exchange.description}`,
              mrp: -Math.abs(exchange.value),
              gstRate: 0,
              isBattery: true,
              isExchange: true,
              serialNumber: exchange.serialNumber,
              brand: 'EXCHANGE_CORE',
              sku: 'SCRAP_IN',
              hsnCode: '8548',
            });
            setShowExchangeModal(false);
          }}
        />
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// QUICK ADD — Clickable product grid for fast billing
// ═══════════════════════════════════════════════════

function QuickAddPanel() {
  const [products, setProducts] = useState<any[]>([]);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const addItem = useCartStore((s) => s.addItem);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await api.get('/products', { params: { limit: '200' } });
        setProducts(res.data.data);
      } catch { /* ignore */ }
      finally { setLoading(false); }
    };
    fetchProducts();
  }, []);

  const filtered = products.filter((p) => {
    if (!search.trim()) return true;
    const q = search.toLowerCase();
    return p.name.toLowerCase().includes(q) ||
      p.brand?.toLowerCase().includes(q) ||
      p.sku?.toLowerCase().includes(q);
  });

  const handleAdd = (product: any) => {
    addItem(product);
    toast.success(`+ ${product.name}`, { 
      duration: 1000, 
      style: { 
        background: '#FFFFFF', 
        color: '#D97706', 
        border: '1px solid #E2E8F0', 
        fontSize: '12px',
        fontWeight: 'bold',
        borderRadius: '12px'
      } 
    });
  };

  return (
    <div className="bg-white border border-ji-border rounded-[2.5rem] flex flex-col shadow-sm overflow-hidden" style={{ maxHeight: '420px', minHeight: '340px' }}>
      {/* Search Header */}
      <div className="flex items-center gap-4 px-8 py-5 border-b border-ji-border bg-ji-bg/30">
        <div className="w-10 h-10 rounded-2xl bg-ji-amber/5 border border-ji-amber/10 flex items-center justify-center shrink-0">
          <Zap size={20} className="text-ji-amber animate-pulse" />
        </div>
        <div className="flex-1">
          <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.3em] mb-1">Quick Add Products</p>
          <div className="relative group">
            <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by product, brand, or SKU"
              className="w-full pl-11 pr-10 py-3.5 bg-white border border-ji-border rounded-2xl text-[11px] font-black text-ji-text placeholder:text-ji-text-dim/40 focus:border-ji-amber focus:ring-4 focus:ring-ji-amber/5 outline-none transition-all shadow-inner uppercase tracking-wider"
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-ji-text-dim hover:text-red-500">
                <X size={16} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Product Grid */}
      <div className="flex-1 overflow-y-auto p-6 grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 content-start scrollbar-thin scrollbar-thumb-ji-border">
        {loading ? (
          <div className="col-span-full flex flex-col items-center justify-center py-20 opacity-30">
            <div className="w-8 h-8 border-4 border-ji-amber border-t-transparent rounded-xl rotate-45 animate-spin mb-4" />
            <p className="text-[10px] font-black uppercase tracking-[0.4em]">Loading products...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="col-span-full py-20 text-center opacity-30">
             <p className="text-[10px] font-black uppercase tracking-[0.4em]">No matching products</p>
          </div>
        ) : (
          filtered.map((product) => (
            <button
              key={product.id}
              onClick={() => handleAdd(product)}
              className="flex flex-col items-start p-4 bg-ji-bg/30 border border-ji-border rounded-[1.5rem] hover:border-ji-amber/40 hover:bg-white hover:shadow-xl hover:shadow-ji-amber/5 active:scale-[0.96] transition-all text-left group relative overflow-hidden"
            >
              <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-6 h-6 bg-ji-amber rounded-xl flex items-center justify-center shadow-lg shadow-ji-amber/20">
                  <ShoppingCart size={10} className="text-white" />
                </div>
              </div>
              
              <div className="flex items-center gap-2 w-full mb-3">
                {product.isBattery ? (
                  <Battery size={14} className="text-ji-amber shrink-0" />
                ) : (
                  <Zap size={14} className="text-ji-text-dim shrink-0" />
                )}
                <p className="text-[10px] font-black text-ji-text uppercase tracking-tight truncate flex-1 leading-tight">
                  {product.name}
                </p>
              </div>

              <div className="flex items-end justify-between w-full mt-auto">
                <div className="space-y-0.5">
                   <p className="text-[8px] text-ji-text-dim font-black uppercase tracking-widest">{product.brand}</p>
                   <p className={`text-[8px] font-black uppercase tracking-tighter ${(product.totalStock || 0) > 0 ? 'text-emerald-600' : 'text-red-500'}`}>
                    {product.totalStock || 0} in stock
                   </p>
                </div>
                <div className="text-right">
                   <p className="text-sm font-black font-['JetBrains_Mono'] text-ji-amber tracking-tighter">
                     ₹{product.mrp}
                   </p>
                </div>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// CART TABLE — Compact, editable
// ═══════════════════════════════════════════════════

function CartTable() {
  const items = useCartStore((s) => s.items);
  const updateItem = useCartStore((s) => s.updateItem);
  const removeItem = useCartStore((s) => s.removeItem);

  if (items.length === 0) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center bg-white border border-ji-border border-dashed rounded-2xl py-12">
        <div className="w-16 h-16 bg-ji-bg rounded-full flex items-center justify-center mb-4 text-ji-text-dim">
          <ShoppingCart size={32} />
        </div>
        <p className="text-ji-text font-bold uppercase tracking-widest text-[10px]">Cart is empty</p>
        <p className="text-ji-text-dim text-xs mt-1 italic">Add products above to start the invoice</p>
      </div>
    );
  }

  return (
    <div className="flex-1 min-h-[300px] lg:min-h-0 bg-white border border-ji-border rounded-[2.5rem] overflow-hidden flex flex-col shadow-sm">
      <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-ji-border overflow-y-auto max-h-[500px]">
        <table className="w-full text-left border-collapse">
        <thead className="sticky top-0 bg-ji-bg/95 backdrop-blur-md z-10 border-b border-ji-border">
          <tr>
            {['#', 'Item', 'Unit Price', 'Qty', 'Disc %', 'Tax', 'Line Total', ''].map((h, i) => (
              <th key={h} className={`px-6 py-4 text-[9px] text-ji-text-dim font-black uppercase tracking-[0.2em] ${i > 1 && i < 7 ? 'text-right' : ''}`}>
                {h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-ji-border/40">
          {items.map((item, index) => (
            <motion.tr
              key={item.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`hover:bg-ji-bg/50 transition-colors group ${item.isExchange ? 'bg-ji-amber/5' : ''}`}
            >
              <td className="px-6 py-6 text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] opacity-40">{index + 1}</td>
              <td className="px-6 py-6">
                <div className="flex items-start gap-4">
                  <div className={`p-2.5 rounded-[1rem] shadow-sm ${item.isExchange ? 'bg-ji-amber/10 text-ji-amber' : item.isBattery ? 'bg-blue-50 text-blue-600' : 'bg-ji-bg text-ji-text-dim border border-ji-border'}`}>
                    {item.isExchange ? <RefreshCcw size={18} /> : item.isBattery ? <Battery size={18} /> : <Zap size={18} />}
                  </div>
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <p className={`text-xs font-black truncate max-w-[280px] uppercase tracking-tight ${
                      item.isExchange ? 'text-ji-amber' : 
                      item.isWarrantyClaim ? 'text-blue-600' : 
                      'text-ji-text'
                    }`}>
                      {item.name}
                    </p>
                    {item.isWarrantyClaim && (
                      <div className="flex items-center gap-1.5 px-2 py-0.5 bg-blue-50 border border-blue-100 rounded-md w-fit">
                        <Zap size={8} className="text-blue-600" />
                        <p className="text-[8px] text-blue-600 font-black uppercase tracking-widest">
                          Warranty claim against {item.originalSerialNumber}
                        </p>
                      </div>
                    )}
                    {(item.isBattery || item.isExchange) && (
                      <div className="relative w-fit">
                        <input
                          type="text"
                          value={item.serialNumber || ''}
                          onChange={(e) => updateItem(item.id, { serialNumber: e.target.value })}
                          placeholder={item.isExchange ? 'Exchange serial number' : 'Battery serial number'}
                          className="px-3 py-1.5 text-[9px] bg-white border border-ji-border rounded-xl text-ji-text font-black font-['JetBrains_Mono'] w-48 focus:border-ji-amber outline-none shadow-inner placeholder:text-ji-text-dim/30"
                        />
                      </div>
                    )}
                  </div>
                </div>
              </td>
              <td className="px-6 py-6 text-right">
                 <p className="text-xs font-black font-['JetBrains_Mono'] text-ji-text-dim tracking-tighter">
                   {item.isExchange ? '-' : ''}₹{Math.abs(item.mrp).toLocaleString('en-IN', { minimumFractionDigits: 2 })}
                 </p>
              </td>
              <td className="px-6 py-6 text-right">
                <div className="flex justify-end">
                  <input
                    type="number"
                    value={item.quantity}
                    onChange={(e) => updateItem(item.id, { quantity: Math.max(1, parseInt(e.target.value) || 1) })}
                    min={1}
                    className="w-14 px-2 py-2 bg-ji-bg border border-ji-border rounded-xl text-[10px] font-black font-['JetBrains_Mono'] text-center focus:border-ji-amber outline-none shadow-sm"
                  />
                </div>
              </td>
              <td className="px-6 py-6 text-right">
                <div className="flex justify-end">
                   <input
                    type="number"
                    value={item.discount || ''}
                    onChange={(e) => updateItem(item.id, { discount: parseFloat(e.target.value) || 0 })}
                    min={0}
                    placeholder="0"
                    className="w-14 px-2 py-2 bg-ji-bg border border-ji-border rounded-xl text-[10px] font-black font-['JetBrains_Mono'] text-center focus:border-ji-amber outline-none shadow-sm"
                  />
                </div>
              </td>
              <td className="px-6 py-6 text-right">
                 <span className="text-[10px] font-black font-['JetBrains_Mono'] text-ji-text-dim opacity-50">{item.gstRate}%</span>
              </td>
              <td className="px-6 py-6 text-right">
                 <p className="text-sm font-black font-['JetBrains_Mono'] text-ji-amber tracking-tighter italic">
                   {formatINR(item.lineGrandTotal)}
                 </p>
              </td>
              <td className="px-6 py-6 text-right">
                <button 
                  onClick={() => removeItem(item.id)} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100 shadow-sm border border-ji-border hover:border-red-200 bg-white"
                >
                  <Trash2 size={16} />
                </button>
              </td>
            </motion.tr>
          ))}
        </tbody>
        </table>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// CUSTOMER SELECTOR
// ═══════════════════════════════════════════════════

function CustomerSelector() {
  const customer = useCartStore((s) => s.customer);
  const setCustomer = useCartStore((s) => s.setCustomer);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/customers', { params: { search: query, limit: '5' } });
        setResults(res.data.data);
        setOpen(true);
      } catch { /* ignore */ }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (customer) {
    return (
      <div className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-ji-amber/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-ji-border flex items-center justify-center shrink-0 shadow-sm group-hover:border-ji-amber/30 transition-colors">
              <Users size={24} className="text-ji-amber" />
            </div>
            <div>
              <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] mb-0.5">Customer</p>
              <h4 className="text-sm font-black text-ji-text uppercase tracking-tight">{customer.name}</h4>
              <p className="text-[10px] font-black text-ji-text-dim font-['JetBrains_Mono'] tracking-widest mt-0.5">{customer.phone}</p>
            </div>
          </div>
          <button 
            onClick={() => setCustomer(null)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-red-500 hover:bg-red-50 border border-ji-border hover:border-red-200 transition-all bg-white shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
        {customer.stateCode !== '01' && (
          <div className="mt-4 px-4 py-2 bg-ji-amber shadow-[0_0_20px_rgba(217,119,6,0.1)] rounded-xl border border-ji-amber/20 flex items-center gap-2">
            <Zap size={10} className="text-white animate-pulse" />
            <p className="text-[9px] text-white font-black uppercase tracking-[0.25em]">Inter-state customer: IGST applies</p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="relative">
        <Users size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search Customer (F3) / Phone..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-ji-border rounded-xl text-sm text-ji-text placeholder:text-ji-text-dim font-bold focus:border-ji-amber focus:ring-4 focus:ring-ji-amber/5 outline-none transition-all shadow-sm"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ji-border rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 space-y-1">
          {results.map((c) => (
            <button
              key={c.id}
              onClick={() => {
                setCustomer({ id: c.id, name: c.name, phone: c.phone, address: c.address, stateCode: c.stateCode, gstin: c.gstin, type: c.type });
                setQuery('');
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-ji-bg rounded-xl transition-colors group/item"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-ji-text font-bold group-hover/item:text-ji-amber">{c.name}</p>
                <span className="text-[9px] px-2 py-0.5 bg-ji-bg rounded text-ji-text-dim uppercase font-black tracking-widest">{c.type}</span>
              </div>
              <p className="text-[10px] text-ji-text-dim font-['JetBrains_Mono'] mt-0.5">{c.phone} · {getStateLabel(c.stateCode)}</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// MECHANIC SELECTOR
// ═══════════════════════════════════════════════════

function MechanicSelector() {
  const mechanic = useCartStore((s) => s.mechanic);
  const setMechanic = useCartStore((s) => s.setMechanic);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      try {
        const res = await api.get('/mechanics', { params: { search: query, limit: '5' } });
        setResults(res.data.data);
        setOpen(true);
      } catch { /* ignore */ }
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  if (mechanic) {
    return (
      <div className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
        <div className="flex items-center justify-between relative z-10">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-white border border-ji-border flex items-center justify-center shrink-0 shadow-sm group-hover:border-blue-300 transition-colors">
              <Wrench size={24} className="text-blue-600" />
            </div>
            <div>
              <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] mb-0.5">Mechanic / Installer</p>
              <h4 className="text-sm font-black text-ji-text uppercase tracking-tight">{mechanic.name}</h4>
              <p className="text-[10px] font-black text-blue-600 tracking-widest mt-0.5">Commission: {mechanic.commissionRate}%</p>
            </div>
          </div>
          <button 
            onClick={() => setMechanic(null)} 
            className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-red-500 hover:bg-red-50 border border-ji-border hover:border-red-200 transition-all bg-white shadow-sm"
          >
            <X size={18} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative group">
      <div className="relative">
        <Wrench size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-blue-600 transition-colors" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Tag Mechanic / Installer..."
          className="w-full pl-11 pr-4 py-3.5 bg-white border border-ji-border rounded-xl text-sm text-ji-text placeholder:text-ji-text-dim font-bold focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all shadow-sm"
        />
      </div>
      {open && results.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white border border-ji-border rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2 space-y-1">
          {results.map((m) => (
            <button
              key={m.id}
              onClick={() => {
                setMechanic({ id: m.id, name: m.name, commissionRate: m.commissionRate });
                setQuery('');
                setOpen(false);
              }}
              className="w-full text-left px-4 py-3 hover:bg-blue-50/50 rounded-xl transition-colors group/item"
            >
              <div className="flex justify-between items-center">
                <p className="text-sm text-ji-text font-bold group-hover/item:text-blue-600">{m.name}</p>
                <span className="text-[9px] px-2 py-0.5 bg-blue-50 text-blue-600 rounded uppercase font-black tracking-widest">{m.commissionRate}%</span>
              </div>
              <p className="text-[10px] text-ji-text-dim font-['JetBrains_Mono'] mt-0.5">{m.phone} · Commission enabled</p>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════
// TOTALS PANEL — Compact
// ═══════════════════════════════════════════════════

function TotalsPanel({ isQuote }: { isQuote: boolean }) {
  const { subtotal, totalDiscount, totalCGST, totalSGST, totalIGST, grandTotal, isInterState, items } = useCartStore();

  return (
    <div className="bg-white border border-ji-border rounded-[2rem] p-8 flex-1 shadow-sm relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-48 h-48 bg-ji-amber/5 rounded-full -mr-24 -mt-24 pointer-events-none" />
      <h3 className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.3em] mb-6">
        {isQuote ? 'Quote Summary' : 'Invoice Summary'}
      </h3>

      <div className="space-y-4 text-xs font-black">
        <div className="flex justify-between text-ji-text-dim uppercase tracking-wider">
          <span>Subtotal ({items.length} item{items.length === 1 ? '' : 's'})</span>
          <span className="font-['JetBrains_Mono'] text-ji-text">{formatINR(subtotal)}</span>
        </div>

        {totalDiscount > 0 && (
          <div className="flex justify-between text-emerald-600 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-100/50 shadow-inner">
            <span className="flex items-center gap-2 uppercase tracking-tighter"><Zap size={10} /> Discount</span>
            <span className="font-['JetBrains_Mono']">-{formatINR(totalDiscount)}</span>
          </div>
        )}

        <div className="space-y-2 pt-2 border-t border-ji-border/40">
          {isInterState ? (
            <div className="flex justify-between text-ji-text-dim uppercase tracking-wider opacity-60">
              <span>IGST</span>
              <span className="font-['JetBrains_Mono']">{formatINR(totalIGST)}</span>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-ji-text-dim uppercase tracking-wider opacity-60">
                <span>CGST</span>
                <span className="font-['JetBrains_Mono']">{formatINR(totalCGST)}</span>
              </div>
              <div className="flex justify-between text-ji-text-dim uppercase tracking-wider opacity-60">
                <span>SGST</span>
                <span className="font-['JetBrains_Mono']">{formatINR(totalSGST)}</span>
              </div>
            </>
          )}
        </div>

        <div className="pt-6 mt-4 border-t-2 border-ji-border border-dashed flex justify-between items-end">
          <div className="space-y-1">
            <span className="block text-[10px] font-black text-ji-text-dim uppercase tracking-[0.3em]">Grand Total</span>
            <div className="flex items-baseline gap-2">
               <span className="text-4xl font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                ₹{grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-sm font-black text-ji-amber uppercase tracking-widest italic tracking-tighter">
                INR
              </span>
            </div>
          </div>
          <div className="w-12 h-12 rounded-2xl bg-ji-bg border border-ji-border flex items-center justify-center opacity-40">
             <CreditCard size={20} className="text-ji-text-dim" />
          </div>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════
// PAYMENT PANEL — With Finalize + PDF
// ═══════════════════════════════════════════════════

function PaymentPanel({ onFinalize, finalizing, isQuote }: { onFinalize: () => void; finalizing: boolean; isQuote: boolean }) {
  const { payment, setPayment, grandTotal, balance } = useCartStore();

  const fillCash = () => {
    setPayment({ cash: grandTotal, upi: 0, credit: 0 });
    toast.success('Applied Full Cash Settlement', { 
      duration: 1000,
      icon: '💰'
    });
  };

  return (
    <div className="bg-ji-bg border border-ji-border rounded-[2.5rem] p-8 shadow-inner flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h3 className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.3em]">
          Payment Details
        </h3>
        <button
          onClick={fillCash}
          className="text-[9px] px-5 py-2.5 bg-white text-emerald-600 border border-emerald-100 rounded-2xl hover:bg-emerald-50 transition-all font-black uppercase tracking-widest shadow-sm active:scale-95"
        >
          Fill Full Cash
        </button>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {[
          { icon: Banknote, label: 'Cash', color: 'text-emerald-600', bg: 'bg-emerald-50', key: 'cash' as const },
          { icon: Smartphone, label: 'UPI', color: 'text-blue-600', bg: 'bg-blue-50', key: 'upi' as const },
          { icon: CreditCard, label: 'Credit', color: 'text-ji-amber', bg: 'bg-amber-50', key: 'credit' as const },
        ].map(({ icon: Icon, label, color, bg, key }) => (
          <div key={key} className="relative group">
            <div className={`absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-[1rem] ${bg} flex items-center justify-center border border-current/10 z-10 transition-transform group-focus-within:scale-110`}>
              <Icon size={18} className={color} />
            </div>
            <input
              type="number"
              value={payment[key] || ''}
              onChange={(e) => setPayment({ [key]: parseFloat(e.target.value) || 0 })}
              placeholder={`Enter ${label.toLowerCase()} amount`}
              className="w-full pl-16 pr-6 py-5 bg-white border border-ji-border rounded-2xl text-xs font-black text-ji-text font-['JetBrains_Mono'] focus:border-ji-amber focus:ring-4 focus:ring-ji-amber/5 outline-none transition-all shadow-sm shadow-inner placeholder:text-ji-text-dim/20"
            />
            <span className="absolute right-4 bottom-2 text-[7px] font-black text-ji-text-dim uppercase tracking-[0.2em] opacity-30 group-focus-within:opacity-100 transition-opacity">{label}</span>
          </div>
        ))}
      </div>

      {/* Balance Registry */}
      <div className="mt-4 pt-6 border-t-2 border-white border-dashed flex justify-between items-center">
        <div className="space-y-1">
          <span className="block text-[9px] font-black text-ji-text-dim uppercase tracking-[0.3em] opacity-60">Balance Due</span>
          <span className={`text-2xl font-black font-['JetBrains_Mono'] tracking-tighter ${balance > 0 ? 'text-red-600' : balance === 0 ? 'text-emerald-600' : 'text-ji-amber'}`}>
            ₹{balance.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
        </div>
        {(balance > 0 && !isQuote) && (
          <div className="px-5 py-2 bg-red-50 rounded-2xl border border-red-100 shadow-[0_4px_12px_rgba(239,68,68,0.05)] animate-pulse">
             <p className="text-[9px] text-red-600 font-black uppercase tracking-[0.2em]">Pending credit sale</p>
          </div>
        )}
      </div>

      {/* Action Core */}
      <button
        onClick={onFinalize}
        disabled={grandTotal === 0 || finalizing}
        className={`w-full mt-4 h-16 flex items-center justify-center gap-4 ${isQuote ? 'bg-blue-600 hover:bg-blue-500 shadow-blue-500/20' : 'bg-ji-amber hover:bg-ji-amber/90 shadow-ji-amber/20'} text-white font-black rounded-3xl shadow-2xl transition-all active:scale-[0.98] disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed uppercase tracking-[0.3em] text-[11px] group`}
      >
        {finalizing ? (
          <div className="flex items-center gap-3">
             <div className="w-5 h-5 border-3 border-white/30 border-t-white rounded-full animate-spin" />
             <span className="animate-pulse">{isQuote ? 'Saving quote...' : 'Finalizing invoice...'}</span>
          </div>
        ) : (
          <>
            <Printer size={20} className="group-hover:rotate-12 transition-transform" /> 
            <span>{isQuote ? 'Save Quote' : 'Finalize & Print'}</span>
            <div className="px-3 py-1.5 bg-white/10 rounded-xl border border-white/5 backdrop-blur-md font-['JetBrains_Mono'] text-[9px]">
               F8
            </div>
          </>
        )}
      </button>
    </div>
  );
}
function ExchangeModal({ onClose, onAdd }: { onClose: () => void; onAdd: (e: any) => void }) {
  const [form, setForm] = useState({ description: '', value: 0, serialNumber: '' });

  const quickOptions = [
    { label: 'Auto (Car) Battery', value: 800 },
    { label: 'Inverter Battery (Flat)', value: 1500 },
    { label: 'Tubular Battery', value: 2500 },
    { label: 'Two-Wheeler Battery', value: 150 },
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-ji-text/20 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white border border-ji-border p-8 rounded-[2rem] shadow-2xl w-full max-w-md overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-ji-amber" />
        
        <div className="flex items-center gap-4 mb-8">
          <div className="w-14 h-14 rounded-2xl bg-ji-amber/10 flex items-center justify-center border border-ji-amber/20">
            <RefreshCcw size={28} className="text-ji-amber animate-spin-slow" />
          </div>
          <div>
            <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text">Buyback Core</h2>
            <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-widest mt-1">Add Exchange Recycling Asset</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="space-y-2">
            <label className="block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Asset Description</label>
            <input
              type="text"
              autoFocus
              value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })}
              placeholder="e.g. SF Sonic 150AH Scrap Core"
              className="w-full px-5 py-4 bg-ji-bg border border-ji-border rounded-2xl text-sm text-ji-text font-bold focus:border-ji-amber outline-none shadow-inner"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Buyback Evaluation (₹)</label>
            <div className="relative">
              <span className="absolute left-5 top-1/2 -translate-y-1/2 text-lg font-black text-ji-text-dim">₹</span>
              <input
                type="number"
                value={form.value || ''}
                onChange={e => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                className="w-full pl-10 pr-5 py-5 bg-ji-bg border border-ji-border rounded-2xl text-3xl font-['JetBrains_Mono'] font-black text-ji-amber focus:border-emerald-500 outline-none shadow-inner"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Source Serial # (Optional)</label>
            <input
              type="text"
              value={form.serialNumber}
              onChange={e => setForm({ ...form, serialNumber: e.target.value })}
              placeholder="SNR-EXCH-XXXX"
              className="w-full px-5 py-3.5 bg-ji-bg border border-ji-border rounded-2xl text-xs text-ji-text font-black font-['JetBrains_Mono'] focus:border-ji-amber outline-none shadow-inner uppercase"
            />
          </div>

          <div className="grid grid-cols-2 gap-2 mt-2">
            {quickOptions.map(opt => (
              <button
                key={opt.label}
                onClick={() => setForm({ ...form, description: opt.label, value: opt.value })}
                className="text-[10px] py-3 px-3 bg-white border border-ji-border rounded-xl text-ji-text-dim font-bold hover:border-ji-amber hover:text-ji-amber hover:bg-ji-amber/5 transition-all shadow-sm active:scale-95"
              >
                {opt.label} <span className="block font-black text-ji-text mt-0.5">₹{opt.value}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex gap-4 mt-10">
          <button 
            onClick={onClose} 
            className="flex-1 px-6 py-4 border border-ji-border text-ji-text-dim rounded-2xl text-xs font-bold hover:bg-ji-bg transition-all uppercase tracking-widest"
          >
            Abort
          </button>
          <button
            onClick={() => onAdd(form)}
            disabled={!form.description || form.value <= 0}
            className="flex-[1.5] px-8 py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-black rounded-2xl text-xs shadow-xl shadow-ji-amber/20 disabled:opacity-20 disabled:grayscale transition-all uppercase tracking-[0.2em]"
          >
            Insert Exchange
          </button>
        </div>
      </motion.div>
    </div>
  );
}
