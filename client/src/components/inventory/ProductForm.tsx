import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Battery, Package } from 'lucide-react';
import api from '../../lib/api';
import toast from 'react-hot-toast';

interface Category {
  id: string;
  name: string;
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
}

interface ProductFormProps {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
}

const inputClass =
  'w-full bg-ji-bg border border-ji-border rounded-2xl px-5 py-4 text-xs font-bold text-ji-text focus:border-ji-amber outline-none shadow-inner transition-all placeholder:text-ji-text-dim/30';

const labelClass = "text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1 mb-1.5 block";

export default function ProductForm({ product, categories, onClose, onSaved }: ProductFormProps) {
  const isEdit = !!product;

  const [form, setForm] = useState({
    name: product?.name || '',
    brand: product?.brand || '',
    sku: product?.sku || '',
    hsnCode: product?.hsnCode || '',
    gstRate: product?.gstRate ?? 18,
    mrp: product?.mrp || 0,
    costPrice: product?.costPrice || 0,
    unit: product?.unit || 'PCS',
    isBattery: product?.isBattery || false,
    voltage: product?.voltage || 12,
    ahRating: product?.ahRating || 0,
    polarity: product?.polarity || 'R',
    warrantyFreeMonths: product?.warrantyFreeMonths || 0,
    warrantyProRataMonths: product?.warrantyProRataMonths || 0,
    categoryId: product?.categoryId || '',
  });

  const [saving, setSaving] = useState(false);

  const handleChange = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!form.name.trim()) {
      toast.error('Product name is required');
      return;
    }
    if (form.mrp <= 0) {
      toast.error('MRP must be greater than 0');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        ...form,
        categoryId: form.categoryId || undefined,
        brand: form.brand || undefined,
        sku: form.sku || undefined,
        hsnCode: form.hsnCode || undefined,
        costPrice: form.costPrice || undefined,
        voltage: form.isBattery ? form.voltage : undefined,
        ahRating: form.isBattery ? form.ahRating : undefined,
        polarity: form.isBattery ? form.polarity : undefined,
        warrantyFreeMonths: form.isBattery ? form.warrantyFreeMonths : undefined,
        warrantyProRataMonths: form.isBattery ? form.warrantyProRataMonths : undefined,
      };

      if (isEdit) {
        await api.put(`/products/${product!.id}`, payload);
        toast.success('Product updated');
      } else {
        await api.post('/products', payload);
        toast.success('Product created');
      }
      onSaved();
    } catch (err: any) {
      toast.error(err.response?.data?.error || 'Failed to save product');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="absolute inset-0 bg-ji-text/10 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="relative w-full max-w-3xl max-h-[90vh] overflow-y-auto bg-white border border-ji-border rounded-[2.5rem] shadow-2xl no-scrollbar"
      >
        {/* Header */}
        <div className="flex items-center justify-between p-10 border-b border-ji-border sticky top-0 bg-white/80 backdrop-blur-md z-10">
          <div className="flex items-center gap-5">
            <div className={`w-14 h-14 rounded-2xl flex items-center justify-center shadow-sm ${
              form.isBattery ? 'bg-ji-amber/5 text-ji-amber border border-ji-amber/20' : 'bg-ji-bg text-ji-text-dim border border-ji-border'
            }`}>
              {form.isBattery ? <Battery size={24} /> : <Package size={24} />}
            </div>
            <div>
              <h3 className="text-3xl font-['Playfair_Display'] font-black text-ji-text leading-none">
                {isEdit ? 'Archive Modification' : 'Catalog Ingress'}
              </h3>
              <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] mt-2 italic">
                {form.isBattery ? 'Energy Storage Hardware (HSN 8507)' : 'Ancillary Component Asset'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-12 h-12 flex items-center justify-center rounded-2xl text-ji-text-dim hover:text-ji-text hover:bg-ji-bg transition-all border border-ji-border"
          >
            <X size={20} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-10 space-y-8">
          {/* Status Alert/Tip */}
          <div className={`p-6 rounded-2xl border flex items-center gap-4 transition-colors ${
            form.isBattery ? 'bg-ji-amber/5 border-ji-amber/20' : 'bg-ji-bg border-ji-border'
          }`}>
             <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
               form.isBattery ? 'bg-ji-amber text-white shadow-lg shadow-ji-amber/20' : 'bg-white border border-ji-border text-ji-text-dim'
             }`}>
               {form.isBattery ? <Battery size={18} /> : <Package size={18} />}
             </div>
             <div className="flex-1">
               <div className="flex items-center justify-between mb-1">
                 <p className="text-[10px] font-black uppercase tracking-widest text-ji-text">Classification Protocol</p>
                 <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      className="sr-only peer"
                      checked={form.isBattery}
                      onChange={(e) => {
                        handleChange('isBattery', e.target.checked);
                        if (e.target.checked) {
                          handleChange('hsnCode', '8507');
                          handleChange('gstRate', 28);
                        } else {
                          handleChange('gstRate', 18);
                        }
                      }}
                    />
                    <div className="w-11 h-6 bg-ji-border peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-ji-amber"></div>
                  </label>
               </div>
               <p className="text-[10px] text-ji-text-dim font-bold italic">
                 {form.isBattery ? 'Automated High-Tax Engine engaged (28% GST + HSN 8507)' : 'Switch toggle for advanced battery warranty math'}
               </p>
             </div>
          </div>

          {/* Row 1: Name + Brand */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-1">
              <label className={labelClass}>Asset Nomenclature *</label>
              <input
                type="text"
                value={form.name}
                onChange={(e) => handleChange('name', e.target.value)}
                placeholder="Exide Mileage 35Ah R"
                className={inputClass}
                required
              />
            </div>
            <div>
              <label className={labelClass}>Manufacturer / Brand</label>
              <input
                type="text"
                value={form.brand}
                onChange={(e) => handleChange('brand', e.target.value)}
                placeholder="Amaron / Exide / Power"
                className={inputClass}
              />
            </div>
          </div>

          {/* Row 2: SKU + HSN + Category */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <label className={labelClass}>Inventory SKU</label>
              <input
                type="text"
                value={form.sku}
                onChange={(e) => handleChange('sku', e.target.value)}
                placeholder="JI-BATT-001"
                className={`${inputClass} font-['JetBrains_Mono'] tracking-tighter`}
              />
            </div>
            <div>
              <label className={labelClass}>HSN Protocol</label>
              <input
                type="text"
                value={form.hsnCode}
                onChange={(e) => handleChange('hsnCode', e.target.value)}
                placeholder="8507 / 2800"
                className={`${inputClass} font-['JetBrains_Mono'] tracking-tighter`}
              />
            </div>
            <div>
              <label className={labelClass}>Asset Category</label>
              <div className="relative group">
                <select
                  value={form.categoryId}
                  onChange={(e) => handleChange('categoryId', e.target.value)}
                  className={`${inputClass} appearance-none cursor-pointer`}
                >
                  <option value="">Ungrouped</option>
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>{c.name}</option>
                  ))}
                </select>
                <div className="absolute right-4 top-1/2 -translate-y-1/2 text-ji-text-dim pointer-events-none group-focus-within:rotate-180 transition-transform">
                  <Package size={14} />
                </div>
              </div>
            </div>
          </div>

          {/* Row 3: MRP + Cost + GST + Unit */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div>
              <label className={labelClass}>Consumer MRP (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-ji-text-dim">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.mrp || ''}
                  onChange={(e) => handleChange('mrp', parseFloat(e.target.value) || 0)}
                  className={`${inputClass} pl-8 font-['JetBrains_Mono'] text-lg tracking-tighter`}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Acquisition Cost (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-ji-text-dim">₹</span>
                <input
                  type="number"
                  step="0.01"
                  value={form.costPrice || ''}
                  onChange={(e) => handleChange('costPrice', parseFloat(e.target.value) || 0)}
                  className={`${inputClass} pl-8 font-['JetBrains_Mono'] text-lg tracking-tighter`}
                  placeholder="0.00"
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>GST Percentage</label>
              <div className="relative">
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-ji-text-dim">%</span>
                <input
                  type="number"
                  value={form.gstRate}
                  onChange={(e) => handleChange('gstRate', parseFloat(e.target.value) || 0)}
                  className={`${inputClass} font-['JetBrains_Mono'] text-lg tracking-tighter`}
                />
              </div>
            </div>
            <div>
              <label className={labelClass}>Dispense Unit</label>
              <select
                value={form.unit}
                onChange={(e) => handleChange('unit', e.target.value)}
                className={inputClass}
              >
                <option value="PCS">PIECES</option>
                <option value="SET">SET (GROUP)</option>
                <option value="PAIR">DUAL PAIR</option>
                <option value="BOX">CONTAINER / BOX</option>
              </select>
            </div>
          </div>

          {/* Battery-specific fields */}
          <AnimatePresence>
            {form.isBattery && (
              <motion.div
                initial={{ opacity: 0, y: -20, height: 0 }}
                animate={{ opacity: 1, y: 0, height: 'auto' }}
                exit={{ opacity: 0, y: -20, height: 0 }}
                className="space-y-8 p-10 rounded-[2rem] bg-ji-bg border-2 border-dashed border-ji-amber/20 overflow-hidden"
              >
                <div className="flex items-center justify-between border-b border-ji-amber/10 pb-4">
                   <p className="text-[10px] font-black font-['JetBrains_Mono'] text-ji-amber uppercase tracking-[0.2em] flex items-center gap-2">
                     <Battery size={14} /> Energy Technical Specification
                   </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                  <div className="space-y-2">
                    <label className={labelClass}>Nominal Voltage</label>
                    <div className="relative group">
                      <select
                        value={form.voltage ?? 12}
                        onChange={(e) => handleChange('voltage', parseInt(e.target.value) || 0)}
                        className={inputClass}
                      >
                        <option value={6}>6.0 Volts</option>
                        <option value={12}>12.0 Volts</option>
                        <option value={24}>24.0 Volts</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Amperage (Ah)</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.ahRating || ''}
                        onChange={(e) => handleChange('ahRating', parseInt(e.target.value) || 0)}
                        className={`${inputClass} font-['JetBrains_Mono'] text-lg tracking-tighter`}
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-ji-text-dim uppercase tracking-widest">AH</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Cell Mapping (Polarity)</label>
                    <select
                      value={form.polarity || 'R'}
                      onChange={(e) => handleChange('polarity', e.target.value)}
                      className={inputClass}
                    >
                      <option value="R">RIGHT TERMINAL (R)</option>
                      <option value="L">LEFT TERMINAL (L)</option>
                      <option value="C">CENTER / UNI (C)</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-2">
                    <label className={labelClass}>Free Replacement Window</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.warrantyFreeMonths || ''}
                        onChange={(e) => handleChange('warrantyFreeMonths', parseInt(e.target.value) || 0)}
                        className={`${inputClass} font-['JetBrains_Mono'] text-lg tracking-tighter`}
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-ji-text-dim uppercase tracking-widest">Months</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Pro-Rata Lifecycle</label>
                    <div className="relative">
                      <input
                        type="number"
                        value={form.warrantyProRataMonths || ''}
                        onChange={(e) => handleChange('warrantyProRataMonths', parseInt(e.target.value) || 0)}
                        className={`${inputClass} font-['JetBrains_Mono'] text-lg tracking-tighter`}
                        placeholder="0"
                      />
                      <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[9px] font-black text-ji-text-dim uppercase tracking-widest">Months</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Actions */}
          <div className="flex items-center justify-end gap-6 pt-10 border-t border-ji-border">
            <button
              type="button"
              onClick={onClose}
              className="px-10 py-5 border border-ji-border hover:bg-ji-bg text-ji-text-dim font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all active:scale-95"
            >
              Discard Changes
            </button>
            <button
              type="submit"
              disabled={saving}
              className="flex items-center gap-3 px-10 py-5 bg-ji-amber hover:bg-ji-amber/90 
                         text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-ji-amber/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Finalizing...
                </>
              ) : (
                <>
                  <Package size={14} />
                  {isEdit ? 'Authorize Update' : 'Commit to Catalog'}
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
