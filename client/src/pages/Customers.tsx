import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Plus, Search, Phone, MapPin, X, Edit2, Trash2, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string | null;
  gstin: string | null;
  stateCode: string;
  type: 'RETAIL' | 'FLEET' | 'MECHANIC' | 'DEALER';
  vehicleNumber: string | null;
  creditLimit: number | null;
  createdAt: string;
}

const typeColors: Record<string, string> = {
  RETAIL:   'text-slate-600 bg-slate-50 border-slate-200',
  FLEET:    'text-blue-600 bg-blue-50 border-blue-200',
  MECHANIC: 'text-amber-600 bg-amber-50 border-amber-200',
  DEALER:   'text-emerald-600 bg-emerald-50 border-emerald-200',
};


export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);

  const fetchCustomers = async () => {
    try {
      setLoading(true);
      const params: Record<string, string> = {};
      if (search) params.search = search;
      if (typeFilter) params.type = typeFilter;
      const res = await api.get('/customers', { params });
      setCustomers(res.data.data);
    } catch {
      toast.error('Failed to load customers');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchCustomers(); }, []);

  useEffect(() => {
    const timer = setTimeout(fetchCustomers, 300);
    return () => clearTimeout(timer);
  }, [search, typeFilter]);

  const handleDelete = async (customer: Customer) => {
    if (!confirm(`Delete "${customer.name}"?`)) return;
    try {
      await api.delete(`/customers/${customer.id}`);
      toast.success('Customer deleted');
      fetchCustomers();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to delete');
    }
  };

  return (
    <div>
      {/* ─── Stats ────────────────────────────────── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Total Registry', value: customers.length, color: 'text-ji-text', icon: Users, bg: 'bg-ji-bg' },
          { label: 'Retail Active', value: customers.filter(c => c.type === 'RETAIL').length, color: 'text-slate-600', icon: Users, bg: 'bg-slate-50' },
          { label: 'Fleet Assets', value: customers.filter(c => c.type === 'FLEET').length, color: 'text-blue-600', icon: Users, bg: 'bg-blue-50' },
          { label: 'Mechanic Network', value: customers.filter(c => c.type === 'MECHANIC').length, color: 'text-ji-amber', icon: Users, bg: 'bg-ji-amber/5' },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-white border border-ji-border rounded-2xl p-6 shadow-sm relative overflow-hidden group"
          >
            <div className={`absolute top-0 right-0 w-16 h-16 ${stat.bg} rounded-full -mr-8 -mt-8 transition-transform group-hover:scale-110`} />
            <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] mb-1 relative z-10">{stat.label}</p>
            <p className={`text-3xl font-black font-['JetBrains_Mono'] tracking-tighter relative z-10 ${stat.color}`}>{stat.value}</p>
          </motion.div>
        ))}
      </div>

      {/* ─── Search + Filters ─────────────────────── */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center gap-4 mb-8">
        <div className="relative flex-1">
          <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim" />
          <input
            type="text"
            placeholder="Search by name, phone, or vehicle ID..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-white border border-ji-border rounded-2xl text-sm font-bold text-ji-text placeholder:text-ji-text-dim focus:border-ji-amber focus:outline-none transition-all shadow-sm"
          />
          {search && (
            <button onClick={() => setSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 w-8 h-8 flex items-center justify-center rounded-lg hover:bg-ji-bg text-ji-text-dim hover:text-red-500 transition-colors">
              <X size={16} />
            </button>
          )}
        </div>

        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:flex-none min-w-[160px]">
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full appearance-none pl-5 pr-12 py-4 bg-white border border-ji-border rounded-2xl text-xs font-black uppercase tracking-widest text-ji-text focus:border-ji-amber focus:outline-none cursor-pointer shadow-sm"
            >
              <option value="">All Tiers</option>
              <option value="RETAIL">Retail</option>
              <option value="FLEET">Fleet</option>
              <option value="MECHANIC">Mechanic</option>
              <option value="DEALER">Dealer</option>
            </select>
            <ChevronDown size={14} className="absolute right-5 top-1/2 -translate-y-1/2 text-ji-text-dim pointer-events-none" />
          </div>

          <button
            onClick={() => { setEditingCustomer(null); setShowForm(true); }}
            className="flex items-center justify-center gap-2 px-8 py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-black rounded-2xl transition-all text-xs uppercase tracking-[0.2em] shadow-lg shadow-ji-amber/20 flex-1 md:flex-none"
          >
            <Plus size={18} />
            Add Entry
          </button>
        </div>
      </div>

      {/* ─── Customer Cards Grid ──────────────────── */}
      {loading ? (
        <div className="text-center py-32 text-ji-text-dim">
          <div className="w-8 h-8 border-4 border-ji-amber border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-[10px] font-black uppercase tracking-widest">Synchronizing Registry...</p>
        </div>
      ) : customers.length === 0 ? (
        <div className="text-center py-32 bg-white border border-ji-border border-dashed rounded-[2rem]">
          <div className="w-16 h-16 bg-ji-bg rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Users size={32} className="text-ji-text-dim" />
          </div>
          <p className="text-ji-text font-black uppercase tracking-widest text-sm">No Entities Found</p>
          <p className="text-[10px] text-ji-text-dim font-bold mt-2 italic px-8">No customer records match your current criteria or search query.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {customers.map((customer, index) => (
            <motion.div
              key={customer.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.03 }}
              className="bg-white border border-ji-border rounded-2xl p-6 hover:border-ji-amber hover:shadow-xl hover:shadow-ji-amber/5 transition-all group cursor-pointer relative overflow-hidden"
              onClick={() => { setEditingCustomer(customer); setShowForm(true); }}
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-ji-bg rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
              
              {/* Header */}
              <div className="flex items-start justify-between mb-5 relative z-10">
                <div className="flex-1 mr-4">
                  <h3 className="text-lg font-black text-ji-text leading-tight group-hover:text-ji-amber transition-colors line-clamp-1">{customer.name}</h3>
                  <div className="flex items-center gap-2 mt-1.5 px-3 py-1 bg-ji-bg rounded-lg border border-ji-border w-fit">
                    <Phone size={10} className="text-ji-amber" />
                    <span className="text-[10px] font-black font-['JetBrains_Mono'] text-ji-text">{customer.phone}</span>
                  </div>
                </div>
                <span className={`text-[9px] px-3 py-1 rounded-lg font-black uppercase tracking-widest border border-current/10 ${typeColors[customer.type]}`}>
                  {customer.type}
                </span>
              </div>

              {/* Details */}
              <div className="space-y-3 relative z-10">
                {customer.address && (
                  <div className="flex items-start gap-3 p-3 bg-ji-bg/30 rounded-xl">
                    <MapPin size={14} className="text-ji-text-dim mt-0.5 shrink-0" />
                    <p className="text-[10px] text-ji-text font-bold italic leading-relaxed line-clamp-2">{customer.address}</p>
                  </div>
                )}

                <div className="flex flex-wrap gap-2">
                  {customer.vehicleNumber && (
                    <div className="px-3 py-1.5 bg-ji-text text-white rounded-lg text-[10px] font-black font-['JetBrains_Mono'] shadow-sm">
                      JK-{customer.vehicleNumber.toUpperCase()}
                    </div>
                  )}

                  {customer.gstin && (
                    <div className="px-3 py-1.5 bg-ji-bg border border-ji-border rounded-lg text-[9px] font-black font-['JetBrains_Mono'] text-ji-text-dim">
                      GST: {customer.gstin}
                    </div>
                  )}
                </div>
              </div>

              {/* Actions Overlay */}
              <div className="absolute bottom-4 right-4 flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-all translate-y-2 group-hover:translate-y-0 relative z-10 mt-4">
                <button
                  onClick={(e) => { e.stopPropagation(); setEditingCustomer(customer); setShowForm(true); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-ji-bg border border-ji-border text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm"
                >
                  <Edit2 size={14} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); handleDelete(customer); }}
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 border border-red-100 text-red-400 hover:text-red-600 hover:border-red-200 transition-all shadow-sm"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* ─── Customer Form Modal ──────────────────── */}
      {showForm && (
        <CustomerFormModal
          customer={editingCustomer}
          onClose={() => { setShowForm(false); setEditingCustomer(null); }}
          onSaved={() => { setShowForm(false); setEditingCustomer(null); fetchCustomers(); }}
        />
      )}
    </div>
  );
}

// ─── Inline Customer Form Modal ─────────────────────

function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!customer;
  const [form, setForm] = useState({
    name: customer?.name || '',
    phone: customer?.phone || '',
    address: customer?.address || '',
    gstin: customer?.gstin || '',
    stateCode: customer?.stateCode || '01',
    type: customer?.type || 'RETAIL',
    vehicleNumber: customer?.vehicleNumber || '',
    creditLimit: customer?.creditLimit || 0,
  });
  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) { toast.error('Name is required'); return; }
    if (!form.phone.trim() || form.phone.length < 10) { toast.error('Valid phone required'); return; }

    setSaving(true);
    try {
      const payload = {
        ...form,
        address: form.address || undefined,
        gstin: form.gstin || undefined,
        vehicleNumber: form.vehicleNumber || undefined,
        creditLimit: form.creditLimit || undefined,
      };

      if (isEdit) {
        await api.put(`/customers/${customer!.id}`, payload);
        toast.success('Customer updated');
      } else {
        await api.post('/customers', payload);
        toast.success('Customer created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save customer');
    } finally {
      setSaving(false);
    }
  };

  const inputClass = 'w-full px-5 py-4 bg-ji-bg border border-ji-border rounded-2xl text-sm text-ji-text font-bold focus:border-ji-amber outline-none shadow-inner transition-all placeholder:text-ji-text-dim/50';
  const labelClass = 'block text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1 mb-2';

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-ji-text/20 backdrop-blur-md" />
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        className="relative bg-white border border-ji-border p-8 rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-ji-amber" />
        
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-ji-amber/10 flex items-center justify-center border border-ji-amber/20">
              <Users size={28} className="text-ji-amber" />
            </div>
            <div>
              <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text">{isEdit ? 'Modify Entity' : 'New Prospect'}</h2>
              <p className="text-[10px] text-ji-text-dim font-bold uppercase tracking-widest mt-1">Registry Management Protocol</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-ji-text hover:bg-ji-bg transition-all border border-ji-border shadow-sm"
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Customer Identity *</label>
              <input type="text" value={form.name} onChange={(e) => handleChange('name', e.target.value)} placeholder="Full Name" className={inputClass} autoFocus />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Contact Link *</label>
              <input type="text" value={form.phone} onChange={(e) => handleChange('phone', e.target.value)} placeholder="Phone Number" className={inputClass} />
            </div>
          </div>

          <div className="space-y-2">
            <label className={labelClass}>Operational Address</label>
            <input type="text" value={form.address} onChange={(e) => handleChange('address', e.target.value)} placeholder="Street, City, ZIP" className={inputClass} />
          </div>

          <div className="grid grid-cols-3 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Classification</label>
              <select value={form.type} onChange={(e) => handleChange('type', e.target.value)} className={`${inputClass} appearance-none cursor-pointer`}>
                <option value="RETAIL">Retail</option>
                <option value="FLEET">Fleet</option>
                <option value="MECHANIC">Mechanic</option>
                <option value="DEALER">Dealer</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className={labelClass}>State ID</label>
              <input type="text" value={form.stateCode} onChange={(e) => handleChange('stateCode', e.target.value)} className={`${inputClass} text-center font-['JetBrains_Mono']`} />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Asset ID (Vehicle)</label>
              <input type="text" value={form.vehicleNumber} onChange={(e) => handleChange('vehicleNumber', e.target.value)} placeholder="JK01..." className={`${inputClass} font-['JetBrains_Mono'] uppercase`} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className={labelClass}>Taxation (GSTIN)</label>
              <input type="text" value={form.gstin} onChange={(e) => handleChange('gstin', e.target.value)} placeholder="ID Code" className={`${inputClass} font-['JetBrains_Mono'] uppercase`} />
            </div>
            <div className="space-y-2">
              <label className={labelClass}>Credit Threshold (₹)</label>
              <input type="number" value={form.creditLimit || ''} onChange={(e) => handleChange('creditLimit', parseFloat(e.target.value) || 0)} placeholder="0.00" className={`${inputClass} font-['JetBrains_Mono'] text-ji-amber`} />
            </div>
          </div>

          <div className="flex items-center gap-4 pt-6">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-6 py-4 border border-ji-border text-ji-text-dim rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-ji-bg transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex-[2] px-8 py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-black rounded-2xl text-xs uppercase tracking-[0.2em] shadow-xl shadow-ji-amber/20 transition-all disabled:opacity-20"
            >
              {saving ? 'Processing...' : isEdit ? 'Sync Changes' : 'Commit Entry'}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
