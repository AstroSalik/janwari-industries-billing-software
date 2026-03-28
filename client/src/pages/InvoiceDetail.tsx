import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ArrowLeft,
  Printer,
  MessageCircle,
  XCircle,
  FileText,
  User,
  Wrench,
  Calendar,
  CreditCard,
  Banknote,
  Smartphone,
  RotateCcw,
  Copy,
  Zap,
  PlusCircle,
} from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';
import { generateInvoicePDF } from '../lib/invoicePdf';
import { useAuthStore } from '../stores/authStore';
import { useCartStore } from '../stores/cartStore';

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

const formatDate = (dateStr: string) =>
  new Date(dateStr).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' });

// ─── Status Badge ───────────────────────────────────

const statusConfig: Record<string, { text: string; bg: string; dot: string; label: string }> = {
  PAID:      { text: 'text-emerald-600', bg: 'bg-emerald-50', dot: 'bg-emerald-600', label: 'Paid' },
  PARTIAL:   { text: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-600',   label: 'Partial' },
  PENDING:   { text: 'text-amber-600',   bg: 'bg-amber-50',   dot: 'bg-amber-600',   label: 'Pending' },
  FINALIZED: { text: 'text-blue-600',    bg: 'bg-blue-50',    dot: 'bg-blue-600',    label: 'Finalized' },
  CANCELLED: { text: 'text-red-600',     bg: 'bg-red-50',     dot: 'bg-red-600',     label: 'Cancelled' },
  DRAFT:     { text: 'text-slate-600',   bg: 'bg-slate-50',   dot: 'bg-slate-600',   label: 'Draft' },
};

// ─── Payment Mode Icon ──────────────────────────────

const paymentIcons: Record<string, typeof Banknote> = {
  CASH:   Banknote,
  UPI:    Smartphone,
  CREDIT: CreditCard,
  CHEQUE: FileText,
};

// ═══════════════════════════════════════════════════
// INVOICE DETAIL PAGE
// ═══════════════════════════════════════════════════

export default function InvoiceDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const [invoice, setInvoice] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);
  const [showReturnModal, setShowReturnModal] = useState(false);
  const [returnItems, setReturnItems] = useState<Record<string, number>>({});
  const [refundMode, setRefundMode] = useState<'CASH' | 'CREDIT'>('CREDIT');
  const [returnReason, setReturnReason] = useState('');
  const [processingReturn, setProcessingReturn] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [addingPayment, setAddingPayment] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    mode: 'CASH' as 'CASH' | 'UPI' | 'CHEQUE',
    amount: '',
    reference: '',
    notes: '',
  });

  const fetchInvoice = async () => {
    try {
      const res = await api.get(`/invoices/${id}`);
      setInvoice(res.data.data);
    } catch {
      toast.error('Failed to load invoice');
      navigate('/invoices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvoice();
  }, [id, navigate]);

  const handleCancel = async () => {
    if (!confirm('Are you sure you want to cancel this invoice? This cannot be undone.')) return;
    setCancelling(true);
    try {
      await api.put(`/invoices/${id}/cancel`);
      toast.success('Invoice cancelled');
      setInvoice((prev: any) => ({ ...prev, status: 'CANCELLED' }));
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to cancel');
    } finally {
      setCancelling(false);
    }
  };

  const handlePrint = async () => {
    if (!invoice) return;
    const isInterState = invoice.customer?.stateCode !== '01';
    const hasPaymentUpdates = invoice.payments.length > 1 || invoice.updatedAt !== invoice.createdAt;
    try {
      await generateInvoicePDF({
        invoiceNumber: invoice.invoiceNumber,
        date: formatDate(invoice.createdAt),
        documentTitle: invoice.type === 'QUOTE'
          ? 'Quote'
          : hasPaymentUpdates
            ? 'Updated Tax Invoice'
            : 'Tax Invoice',
        updateNote: hasPaymentUpdates
          ? `Updated on ${formatDate(invoice.updatedAt)} with ${invoice.payments.length} payment entr${invoice.payments.length === 1 ? 'y' : 'ies'}.`
          : undefined,
        customer: invoice.customer ? {
          name: invoice.customer.name,
          phone: invoice.customer.phone,
          address: invoice.customer.address,
          stateCode: invoice.customer.stateCode,
          gstin: invoice.customer.gstin,
        } : undefined,
        items: invoice.items.map((item: any) => ({
          name: item.product?.name || 'Product',
          hsnCode: item.product?.hsnCode || '',
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          gstRate: item.gstRate,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          lineTotal: item.lineTotal,
        })),
        subtotal: invoice.subtotal,
        totalDiscount: invoice.totalDiscount,
        totalTaxable: invoice.subtotal - invoice.totalDiscount,
        totalCGST: isInterState ? 0 : invoice.totalGst / 2,
        totalSGST: isInterState ? 0 : invoice.totalGst / 2,
        totalIGST: isInterState ? invoice.totalGst : 0,
        grandTotal: invoice.grandTotal,
        paidAmount: invoice.paidAmount,
        balanceAmount: invoice.balanceAmount,
        isInterState,
        payments: invoice.payments.map((p: any) => ({
          mode: p.mode,
          amount: p.amount,
          date: p.createdAt ? formatDate(p.createdAt) : undefined,
          reference: p.reference,
        })),
        notes: invoice.notes,
      });
      toast.success('PDF downloaded!');
    } catch (err) {
      console.error('PDF generation error:', err);
      toast.error('Failed to generate PDF');
    }
  };

  const handleWhatsApp = () => {
    if (!invoice) return;
    const text = encodeURIComponent(
      `Invoice: ${invoice.invoiceNumber}\n` +
      `Amount: ${formatINR(invoice.grandTotal)}\n` +
      `Status: ${invoice.status}\n` +
      `Date: ${formatDate(invoice.createdAt)}\n` +
      `\nFrom Janwari Industries, Sopore\nPh: 7006083933`
    );
    const phone = invoice.customer?.phone ? `91${invoice.customer.phone}` : '';
    window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
  };

  const handleDuplicate = () => {
    if (!invoice) return;
    
    const store = useCartStore.getState();
    store.clearCart();
    
    if (invoice.customer) {
      store.setCustomer({
        id: invoice.customer.id,
        name: invoice.customer.name,
        phone: invoice.customer.phone,
        address: invoice.customer.address,
        stateCode: invoice.customer.stateCode,
        gstin: invoice.customer.gstin,
        type: invoice.customer.type || 'RETAIL'
      });
    }
    
    if (invoice.mechanic) {
      store.setMechanic({
        id: invoice.mechanic.id,
        name: invoice.mechanic.name,
        commissionRate: invoice.mechanic.commissionRate
      });
    }
    
    if (invoice.notes) {
      store.setNotes(invoice.notes);
    }

    const mappedItems = invoice.items.map((item: any, index: number) => ({
      id: `cart-copy-${index}`,
      productId: item.productId,
      name: item.product?.name || 'Unknown',
      brand: item.product?.brand || '',
      sku: item.product?.sku || '',
      hsnCode: item.product?.hsnCode || '',
      mrp: item.rate, // Bill at the same rate they bought last time
      gstRate: item.gstRate,
      quantity: item.quantity,
      discount: item.discount / (item.quantity > 0 ? item.quantity : 1), 
      isBattery: item.isBattery,
      unit: item.product?.unit || 'PCS',
      serialNumber: undefined, // WIPE IT - force re-entry
      lineTotal: item.rate * item.quantity,
      lineTaxable: (item.rate * item.quantity) - item.discount,
      lineGST: item.cgst + item.sgst + item.igst,
      lineGrandTotal: item.lineTotal
    }));

    store.setItems(mappedItems);
    toast.success(`${invoice.type === 'QUOTE' ? 'Quote' : 'Invoice'} duplicated to cart!`);
    
    if (invoice.type === 'QUOTE') {
      navigate('/quotes/new');
    } else {
      navigate('/invoices/new');
    }
  };

  const handleAddPayment = async () => {
    if (!id || !invoice) return;

    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    setAddingPayment(true);
    try {
      const res = await api.post(`/invoices/${id}/payments`, {
        mode: paymentForm.mode,
        amount,
        reference: paymentForm.reference || undefined,
        notes: paymentForm.notes || undefined,
      });

      setInvoice(res.data.data);
      setShowPaymentModal(false);
      setPaymentForm({ mode: 'CASH', amount: '', reference: '', notes: '' });
      toast.success('Invoice payment updated');
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to update invoice payment');
    } finally {
      setAddingPayment(false);
    }
  };

  // ─── Loading State ────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center py-32">
        <div className="w-6 h-6 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!invoice) return null;

  const sc = statusConfig[invoice.status] || statusConfig.DRAFT;
  const isInterState = invoice.customer?.stateCode !== '01';

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
    >
      {/* ─── Header ──────────────────────────────────── */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 mb-8">
        <div className="flex items-start gap-5">
          <button
            onClick={() => navigate('/invoices')}
            className="w-12 h-12 flex items-center justify-center rounded-2xl text-ji-text-dim hover:text-ji-text bg-white hover:bg-ji-bg transition-all border border-ji-border shadow-sm group mt-1"
          >
            <ArrowLeft size={22} className="group-hover:-translate-x-1 transition-transform" />
          </button>
          <div>
            <div className="flex flex-wrap items-center gap-4">
              <h1 className="text-3xl font-['JetBrains_Mono'] font-black text-ji-text tracking-tighter uppercase">
                {invoice.invoiceNumber}
              </h1>
              <span className={`inline-flex items-center gap-2 px-4 py-2 rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] border border-current/10 ${sc.bg} ${sc.text}`}>
                <span className={`w-2 h-2 rounded-full ${sc.dot} animate-pulse`} />
                {sc.label}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-2">
              <div className="flex items-center gap-2 px-3 py-1 bg-ji-bg rounded-xl border border-ji-border shadow-inner">
                <Calendar size={12} className="text-ji-amber" />
                <span className="text-[10px] text-ji-text font-black uppercase tracking-widest">{formatDate(invoice.createdAt)}</span>
              </div>
              {invoice.updatedAt !== invoice.createdAt && (
                <div className="flex items-center gap-2 px-3 py-1 bg-amber-50 rounded-xl border border-amber-100 shadow-inner">
                  <RotateCcw size={12} className="text-amber-600" />
                  <span className="text-[10px] text-amber-700 font-black uppercase tracking-widest">
                    Updated {formatDate(invoice.updatedAt)}
                  </span>
                </div>
              )}
              <p className="text-[9px] text-ji-text-dim font-bold uppercase tracking-[0.2em] opacity-60">
                Recorded by <span className="text-ji-text font-black">{invoice.createdBy?.name || 'System Principal'}</span>
              </p>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center bg-white border border-ji-border p-1 rounded-xl shadow-sm">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 px-4 py-2 hover:bg-ji-bg text-ji-text-dim hover:text-ji-text font-bold rounded-lg transition-all text-xs uppercase tracking-widest"
            >
              <FileText size={14} />
              A4 Ledger
            </button>
            <div className="w-px h-4 bg-ji-border mx-1" />
            <button
              onClick={() => window.open(`/invoices/${invoice.id}/receipt`, '_blank', 'width=400,height=600')}
              className="flex items-center gap-2 px-4 py-2 hover:bg-ji-bg text-ji-text-dim hover:text-ji-text font-bold rounded-lg transition-all text-xs uppercase tracking-widest"
            >
              <Printer size={14} />
              80mm Slip
            </button>
          </div>

          <button
            onClick={handleWhatsApp}
            className="flex items-center gap-2 px-5 py-3 bg-emerald-50 border border-emerald-100/50 text-emerald-600 hover:bg-emerald-100 font-bold rounded-xl transition-all text-xs uppercase tracking-widest shadow-sm shadow-emerald-50"
          >
            <MessageCircle size={14} />
            Share
          </button>
          
          <button
            onClick={handleDuplicate}
            className="flex items-center gap-2 px-5 py-3 bg-ji-bg border border-ji-border text-ji-text hover:bg-ji-surface font-bold rounded-xl transition-all text-xs uppercase tracking-widest shadow-sm"
          >
            <Copy size={14} />
            Clone
          </button>

          {invoice.type === 'TAX_INVOICE' && invoice.status !== 'CANCELLED' && invoice.balanceAmount > 0 && (
            <button
              onClick={() => setShowPaymentModal(true)}
              className="flex items-center gap-2 px-5 py-3 bg-amber-50 border border-amber-100 text-amber-700 hover:bg-amber-100 font-bold rounded-xl transition-all text-xs uppercase tracking-widest shadow-sm shadow-amber-50"
            >
              <PlusCircle size={14} />
              Add Payment
            </button>
          )}
          
          {invoice.type === 'TAX_INVOICE' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={() => {
                const initialReturn: Record<string, number> = {};
                invoice.items.forEach((item: any) => {
                  initialReturn[item.id] = 0;
                });
                setReturnItems(initialReturn);
                setShowReturnModal(true);
              }}
              className="flex items-center gap-2 px-5 py-3 bg-blue-50 border border-blue-100 text-blue-600 hover:bg-blue-100 font-bold rounded-xl transition-all text-xs uppercase tracking-widest shadow-sm shadow-blue-50"
            >
              <RotateCcw size={14} />
              Return
            </button>
          )}

          {user?.role === 'ADMIN' && invoice.status !== 'CANCELLED' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="flex items-center gap-2 px-5 py-3 bg-red-50 hover:bg-red-100 border border-red-100 text-red-600 font-bold rounded-xl transition-all text-xs uppercase tracking-widest disabled:opacity-50 shadow-sm shadow-red-50"
            >
              <XCircle size={14} />
              Void
            </button>
          )}
        </div>
      </div>

      {/* ─── Two Column Layout ───────────────────────── */}
      <div className="grid grid-cols-3 gap-6">
        {/* Left: Items Table (2 cols wide) */}
        <div className="col-span-2 space-y-6">
          {/* Items Table */}
          <div className="bg-white border border-ji-border rounded-2xl overflow-hidden shadow-sm">
            <div className="px-6 py-4 border-b border-ji-border bg-ji-bg/30 flex items-center justify-between">
              <h3 className="text-[10px] text-ji-text font-black uppercase tracking-[0.2em]">
                Line Items ({invoice.items.length} assets)
              </h3>
              <div className="px-3 py-1 bg-ji-bg rounded-lg border border-ji-border">
                <span className="text-[9px] text-ji-text-dim font-black uppercase">HSN Classified</span>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-ji-border bg-ji-bg/10">
                    {['#', 'Line Item Asset', 'HSN', 'Qty', 'Unit Rate', 'Disc', 'GST', 'Total'].map((h) => (
                      <th key={h} className="text-left px-6 py-4 text-[10px] text-ji-text-dim font-black uppercase tracking-widest">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-ji-border/50">
                  {invoice.items.map((item: any, i: number) => (
                    <tr key={item.id} className="hover:bg-ji-bg transition-colors group">
                      <td className="px-6 py-5 text-xs text-ji-text-dim font-black font-['JetBrains_Mono']">{i + 1}</td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${item.isExchange ? 'bg-red-50 text-red-600' : 'bg-ji-bg text-ji-text'}`}>
                            {item.isExchange ? <RotateCcw size={16} /> : <Zap size={16} />}
                          </div>
                          <div>
                            <p className="text-sm font-black text-ji-text">{item.product?.name || 'Unknown SKU'}</p>
                            {item.serialNumber && (
                              <p className="text-[10px] text-ji-amber font-black font-['JetBrains_Mono'] mt-1 flex items-center gap-1.5">
                                <span className="w-1.5 h-1.5 rounded-full bg-ji-amber" />
                                SNR: {item.serialNumber.serial || item.serialNumber}
                              </p>
                            )}
                            {item.isExchange && (
                              <span className="text-[9px] text-red-600 font-black uppercase tracking-tighter mt-1 block">
                                Recycling Buyback
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-xs text-ji-text-dim font-black font-['JetBrains_Mono']">{item.product?.hsnCode || '8507'}</td>
                      <td className="px-6 py-5 text-xs text-ji-text font-black font-['JetBrains_Mono']">{item.quantity}</td>
                      <td className="px-6 py-5 text-xs text-ji-text-dim font-black font-['JetBrains_Mono']">{formatINR(item.rate)}</td>
                      <td className="px-6 py-5 text-xs text-emerald-600 font-black font-['JetBrains_Mono']">
                        {item.discount > 0 ? `-${formatINR(item.discount)}` : '—'}
                      </td>
                      <td className="px-6 py-5 text-xs text-ji-text-dim font-black font-['JetBrains_Mono']">{item.gstRate}%</td>
                      <td className="px-6 py-5 text-sm text-ji-text font-black font-['JetBrains_Mono'] italic">{formatINR(item.lineTotal)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Notes */}
          {invoice.notes && (
            <div className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 left-0 w-1 h-full bg-ji-amber/20 group-hover:bg-ji-amber transition-all" />
              <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-3 font-black">Admin Notes</p>
              <p className="text-sm text-ji-text font-bold italic leading-relaxed">{invoice.notes}</p>
            </div>
          )}
        </div>

        {/* Right: Customer, Totals, Payments */}
        <div className="space-y-4">
          {/* Customer Info */}
          <div className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-ji-amber/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
            <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-5 font-black flex items-center gap-2 relative z-10">
              <User size={12} className="text-ji-amber" /> Recipient Details
            </p>
            {invoice.customer ? (
              <div className="space-y-4 relative z-10">
                <div>
                  <h4 className="text-lg font-black text-ji-text">{invoice.customer.name}</h4>
                  <p className="text-xs text-ji-text font-bold font-['JetBrains_Mono'] mt-1">{invoice.customer.phone}</p>
                </div>
                
                <div className="space-y-2">
                  {invoice.customer.gstin && (
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 bg-ji-bg rounded text-[10px] text-ji-text-dim font-black uppercase tracking-tighter">GSTIN</span>
                      <span className="text-xs font-black font-['JetBrains_Mono'] text-ji-text">{invoice.customer.gstin}</span>
                    </div>
                  )}
                  {invoice.customer.address && (
                    <p className="text-xs text-ji-text-dim font-medium leading-relaxed italic">{invoice.customer.address}</p>
                  )}
                </div>

                {isInterState && (
                  <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-50 text-ji-amber rounded-lg border border-amber-100">
                    <Zap size={10} className="animate-pulse" />
                    <span className="text-[10px] font-black uppercase tracking-widest">Inter-state Logistics</span>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-3 relative z-10 bg-ji-bg p-4 rounded-xl border border-ji-border/50 border-dashed">
                <div className="w-10 h-10 rounded-full bg-ji-border flex items-center justify-center">
                  <User size={20} className="text-ji-text-dim" />
                </div>
                <span className="text-sm text-ji-text-dim font-bold uppercase tracking-widest italic tracking-tighter">Walk-in Customer</span>
              </div>
            )}
          </div>

          {/* Mechanic */}
          {invoice.mechanic && (
            <div className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -mr-16 -mt-16 transition-transform group-hover:scale-110" />
              <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-5 font-black flex items-center gap-2 relative z-10">
                <Wrench size={12} className="text-blue-600" /> Service Partner
              </p>
              <div className="flex items-center justify-between relative z-10">
                <div>
                  <h4 className="text-sm font-black text-ji-text">{invoice.mechanic.name}</h4>
                  <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mt-1">Sopore Cluster Member</p>
                </div>
                <div className="text-right">
                  <span className="block text-[10px] font-black text-ji-text-dim uppercase tracking-tighter">Comm. Rate</span>
                  <span className="text-lg font-black font-['JetBrains_Mono'] text-blue-600">{invoice.mechanic.commissionRate}%</span>
                </div>
              </div>
            </div>
          )}

          {/* Totals */}
          <div className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group">
            <div className="absolute bottom-0 left-0 w-full h-1 bg-ji-amber/10 group-hover:bg-ji-amber transition-colors" />
            <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-5 font-black">Account Summary</p>
            <div className="space-y-3 text-xs font-bold">
              <div className="flex justify-between text-ji-text-dim">
                <span>Subtotal (Net)</span>
                <span className="font-['JetBrains_Mono'] text-ji-text">{formatINR(invoice.subtotal)}</span>
              </div>
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between text-emerald-600 bg-emerald-50 px-3 py-2 rounded-xl">
                  <span className="flex items-center gap-1.5"><Zap size={10} /> Incentive</span>
                  <span className="font-['JetBrains_Mono']">-{formatINR(invoice.totalDiscount)}</span>
                </div>
              )}
              <div className="pt-2 space-y-2 border-t border-ji-border/50">
                {isInterState ? (
                  <div className="flex justify-between text-ji-text-dim">
                    <span>IGST (Integrated)</span>
                    <span className="font-['JetBrains_Mono']">{formatINR(invoice.totalGst)}</span>
                  </div>
                ) : (
                  <>
                    <div className="flex justify-between text-ji-text-dim font-bold">
                      <span className="text-[9px] uppercase">Central GST</span>
                      <span className="font-['JetBrains_Mono']">{formatINR(invoice.totalGst / 2)}</span>
                    </div>
                    <div className="flex justify-between text-ji-text-dim font-bold mt-1">
                      <span className="text-[9px] uppercase">State GST</span>
                      <span className="font-['JetBrains_Mono']">{formatINR(invoice.totalGst / 2)}</span>
                    </div>
                  </>
                )}
              </div>
              <div className="pt-4 flex justify-between items-end">
                <div>
                  <span className="block text-[8px] font-black text-ji-text-dim uppercase tracking-widest">Payable Net</span>
                  <span className="text-2xl font-black font-['JetBrains_Mono'] text-ji-text tracking-tighter">
                    {formatINR(invoice.grandTotal).replace('₹', '')}<span className="text-sm ml-0.5 text-ji-amber">INR</span>
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Payments */}
          <div className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm">
            <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-5 font-black">Settlement Audit</p>
            {invoice.payments.length > 0 ? (
              <div className="space-y-4">
                {invoice.payments.map((p: any) => {
                  const PayIcon = paymentIcons[p.mode] || CreditCard;
                  return (
                    <div key={p.id} className="flex items-center justify-between group/pay">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-ji-bg flex items-center justify-center border border-ji-border group-hover/pay:border-ji-amber transition-colors">
                          <PayIcon size={14} className="text-ji-text-dim group-hover/pay:text-ji-amber" />
                        </div>
                        <div>
                          <span className="text-xs font-black text-ji-text">{p.mode} Settlement</span>
                          <p className="text-[10px] text-ji-text-dim font-['JetBrains_Mono'] mt-0.5">
                            {formatDate(p.createdAt)}
                            {p.reference ? ` · Ref: ${p.reference}` : ''}
                          </p>
                        </div>
                      </div>
                      <span className="text-sm font-black font-['JetBrains_Mono'] text-ji-text">{formatINR(p.amount)}</span>
                    </div>
                  );
                })}
                <div className={`mt-4 pt-4 border-t border-ji-border border-dashed flex justify-between items-center ${invoice.balanceAmount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                  <div>
                    <span className="block text-[8px] font-black text-ji-text-dim uppercase tracking-widest">Dues Remaining</span>
                    <span className="text-lg font-black font-['JetBrains_Mono']">{formatINR(invoice.balanceAmount)}</span>
                  </div>
                  {invoice.balanceAmount === 0 && (
                    <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-100 flex items-center justify-center">
                      <Zap size={14} className="text-emerald-600" />
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <div className="py-4 text-center bg-ji-bg rounded-xl border border-ji-border border-dashed">
                <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-widest italic">No Ledger Entries</p>
              </div>
            )}
          </div>

          {/* Timeline */}
          <div className="bg-ji-bg border border-ji-border rounded-2xl p-6 shadow-inner">
            <p className="text-[10px] text-ji-text-dim uppercase tracking-[0.2em] mb-4 font-black">System Logs</p>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar size={12} className="text-ji-text-dim" />
                  <span className="text-[10px] text-ji-text-dim font-bold uppercase tracking-wider">Origination</span>
                </div>
                <span className="text-[10px] text-ji-text font-black font-['JetBrains_Mono']">{formatDate(invoice.createdAt)}</span>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <RotateCcw size={12} className="text-ji-text-dim" />
                  <span className="text-[10px] text-ji-text-dim font-bold uppercase tracking-wider">Synchronization</span>
                </div>
                <span className="text-[10px] text-ji-text font-black font-['JetBrains_Mono']">{formatDate(invoice.updatedAt)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Return Modal ────────────────────────────── */}
      {showReturnModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowReturnModal(false)} className="absolute inset-0 bg-ji-text/20 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white border border-ji-border p-8 rounded-[2rem] shadow-2xl w-full max-w-3xl overflow-hidden flex flex-col max-h-[90vh]"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-blue-600" />

            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center border border-blue-100">
                  <RotateCcw size={28} className="text-blue-600" />
                </div>
                <div>
                  <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text">Reverse Settlement</h2>
                  <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-widest mt-1">Process Item Return / Credit Note Alpha</p>
                </div>
              </div>
              <button
                onClick={() => setShowReturnModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-red-600 hover:bg-red-50 transition-all border border-ji-border shadow-sm"
              >
                <XCircle size={20} />
              </button>
            </div>
            
            <div className="overflow-y-auto flex-1 space-y-8 pr-2 scrollbar-thin scrollbar-thumb-ji-border">
              {/* Items to return */}
              <div className="space-y-3">
                <h3 className="text-[10px] text-ji-text font-black uppercase tracking-[0.2em] ml-1">Asset De-Allocation</h3>
                <div className="border border-ji-border rounded-2xl overflow-hidden bg-ji-bg divide-y divide-ji-border shadow-inner">
                  {invoice.items.map((item: any) => (
                    <div key={item.id} className="flex items-center justify-between p-4 group hover:bg-white transition-colors">
                      <div className="flex-1">
                        <p className="text-sm font-black text-ji-text group-hover:text-blue-600 transition-colors uppercase tracking-tight">{item.product?.name}</p>
                        <p className="text-[10px] text-ji-text-dim font-bold font-['JetBrains_Mono'] mt-1">Bought: {item.quantity} units @ {formatINR(item.rate)}</p>
                      </div>
                      <div className="flex items-center gap-4">
                        <span className="text-[10px] text-ji-text font-black uppercase tracking-tighter">Qty to Return</span>
                        <input
                          type="number"
                          min={0}
                          max={item.quantity}
                          value={returnItems[item.id] || 0}
                          onChange={(e) => {
                            let val = parseFloat(e.target.value) || 0;
                            if (val > item.quantity) val = item.quantity;
                            if (val < 0) val = 0;
                            setReturnItems(prev => ({ ...prev, [item.id]: val }));
                          }}
                          className="w-24 bg-white border border-ji-border rounded-xl px-4 py-2 text-sm text-ji-text font-bold font-['JetBrains_Mono'] focus:border-blue-600 outline-none shadow-sm text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Reason & Mode */}
              <div className="grid grid-cols-2 gap-8">
                <div className="space-y-3">
                  <label className="text-[10px] text-ji-text font-black uppercase tracking-[0.2em] ml-1">Refund Protocol</label>
                  <select
                    value={refundMode}
                    onChange={(e) => setRefundMode(e.target.value as any)}
                    className="w-full bg-ji-bg border border-ji-border rounded-2xl px-5 py-4 text-sm font-bold text-ji-text focus:border-blue-600 outline-none shadow-inner appearance-none cursor-pointer"
                  >
                    <option value="CREDIT">Digital Store Credit (Khata)</option>
                    <option value="CASH">Liquid Cash Settlement</option>
                  </select>
                </div>
                <div className="space-y-3">
                  <label className="text-[10px] text-ji-text font-black uppercase tracking-[0.2em] ml-1">Occurrence Reason</label>
                  <input
                    type="text"
                    value={returnReason}
                    onChange={(e) => setReturnReason(e.target.value)}
                    placeholder="e.g. Defective Core, Customer Rejection"
                    className="w-full bg-ji-bg border border-ji-border rounded-2xl px-5 py-4 text-sm font-bold text-ji-text focus:border-blue-600 outline-none shadow-inner"
                  />
                </div>
              </div>
            </div>

            <div className="mt-10 flex items-center justify-end gap-4">
              <button
                onClick={() => setShowReturnModal(false)}
                className="px-8 py-4 border border-ji-border text-ji-text-dim rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-ji-bg transition-all"
              >
                Abort
              </button>
              <button
                disabled={processingReturn || Object.values(returnItems).every(q => q === 0)}
                onClick={async () => {
                  const itemsToReturn = Object.entries(returnItems)
                    .filter(([_, qty]) => qty > 0)
                    .map(([id, qty]) => ({ invoiceItemId: id, returnQty: qty }));
                  
                  if (itemsToReturn.length === 0) return;
                  
                  setProcessingReturn(true);
                  try {
                    await api.post(`/invoices/${id}/return`, {
                      items: itemsToReturn,
                      refundMode,
                      returnReason,
                    });
                    toast.success('Return processed successfully');
                    setShowReturnModal(false);
                    window.location.reload();
                  } catch (err: any) {
                    toast.error(err.response?.data?.error || 'Failed to process return');
                  } finally {
                    setProcessingReturn(false);
                  }
                }}
                className="px-10 py-4 bg-blue-600 text-white font-black rounded-2xl hover:bg-blue-500 transition-all text-xs uppercase tracking-widest shadow-xl shadow-blue-600/20 disabled:opacity-20 disabled:grayscale"
              >
                {processingReturn ? 'Synchronizing...' : 'Execute Return'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {showPaymentModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setShowPaymentModal(false)} className="absolute inset-0 bg-ji-text/20 backdrop-blur-md" />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            className="relative bg-white border border-ji-border p-8 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
          >
            <div className="absolute top-0 left-0 w-full h-2 bg-amber-500" />
            <div className="flex items-center justify-between mb-8">
              <div>
                <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text">Add Payment</h2>
                <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-widest mt-1">
                  Update settlement for {invoice.invoiceNumber}
                </p>
              </div>
              <button
                onClick={() => setShowPaymentModal(false)}
                className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-red-600 hover:bg-red-50 transition-all border border-ji-border shadow-sm"
              >
                <XCircle size={20} />
              </button>
            </div>

            <div className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Payment Mode</label>
                  <select
                    value={paymentForm.mode}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, mode: e.target.value as 'CASH' | 'UPI' | 'CHEQUE' }))}
                    className="w-full bg-ji-bg border border-ji-border rounded-2xl px-4 py-3.5 text-sm font-bold text-ji-text focus:border-amber-500 outline-none shadow-inner"
                  >
                    <option value="CASH">Cash</option>
                    <option value="UPI">UPI</option>
                    <option value="CHEQUE">Cheque</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Amount</label>
                  <input
                    type="number"
                    min={0}
                    max={invoice.balanceAmount}
                    value={paymentForm.amount}
                    onChange={(e) => setPaymentForm((prev) => ({ ...prev, amount: e.target.value }))}
                    placeholder={`Max ${invoice.balanceAmount.toFixed(2)}`}
                    className="w-full bg-ji-bg border border-ji-border rounded-2xl px-4 py-3.5 text-sm font-bold font-['JetBrains_Mono'] text-ji-text focus:border-amber-500 outline-none shadow-inner"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Reference</label>
                <input
                  type="text"
                  value={paymentForm.reference}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, reference: e.target.value }))}
                  placeholder="UPI transaction id / cheque number"
                  className="w-full bg-ji-bg border border-ji-border rounded-2xl px-4 py-3.5 text-sm font-bold text-ji-text focus:border-amber-500 outline-none shadow-inner"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Update Note</label>
                <textarea
                  value={paymentForm.notes}
                  onChange={(e) => setPaymentForm((prev) => ({ ...prev, notes: e.target.value }))}
                  placeholder="Optional note to mention on the updated invoice"
                  rows={3}
                  className="w-full bg-ji-bg border border-ji-border rounded-2xl px-4 py-3.5 text-sm font-bold text-ji-text focus:border-amber-500 outline-none shadow-inner resize-none"
                />
              </div>

              <div className="rounded-2xl bg-amber-50 border border-amber-100 px-4 py-3">
                <p className="text-[10px] text-amber-700 font-black uppercase tracking-widest">Pending Balance</p>
                <p className="text-lg font-black font-['JetBrains_Mono'] text-amber-800 mt-1">{formatINR(invoice.balanceAmount)}</p>
              </div>
            </div>

            <div className="mt-8 flex items-center justify-end gap-4">
              <button
                onClick={() => setShowPaymentModal(false)}
                className="px-8 py-4 border border-ji-border text-ji-text-dim rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-ji-bg transition-all"
              >
                Cancel
              </button>
              <button
                disabled={addingPayment}
                onClick={handleAddPayment}
                className="px-10 py-4 bg-amber-500 text-white font-black rounded-2xl hover:bg-amber-400 transition-all text-xs uppercase tracking-widest shadow-xl shadow-amber-500/20 disabled:opacity-40"
              >
                {addingPayment ? 'Updating...' : 'Save Payment Update'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}
