import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, SearchIcon, Truck, Users, X, Activity, ChevronDown } from 'lucide-react';
import api from '../lib/api';
import toast from 'react-hot-toast';

export default function NewChallan() {
  const navigate = useNavigate();
  
  // State
  const [customers, setCustomers] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [customerId, setCustomerId] = useState<string | null>(null);
  const [vehicleId, setVehicleId] = useState<string | null>(null);
  const [customerSearch, setCustomerSearch] = useState('');
  const [productSearch, setProductSearch] = useState('');
  const [items, setItems] = useState<any[]>([]);
  const [showAmount, setShowAmount] = useState(false);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Fetch initial data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [custRes, prodRes] = await Promise.all([
          api.get('/customers', { params: { limit: '100' } }),
          api.get('/products', { params: { limit: '200' } })
        ]);
        setCustomers(custRes.data.data);
        setProducts(prodRes.data.data);
      } catch (error) {
        toast.error('Failed to load customers/products');
      }
    };
    fetchData();
  }, []);

  const selectedCustomer = customers.find(c => c.id === customerId);

  const addItem = (product: any) => {
    const existing = items.find(i => i.productId === product.id && !product.isBattery);
    if (existing && !product.isBattery) {
      setItems(items.map(i => i.productId === product.id ? { ...i, quantity: i.quantity + 1 } : i));
    } else {
      setItems([...items, {
        productId: product.id,
        name: product.name,
        isBattery: product.isBattery,
        quantity: 1,
        rate: product.mrp,
        discount: 0,
        gstRate: product.gstRate,
        serialNumberId: null,
        serialString: '' // for display/search
      }]);
    }
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const calculateTotals = () => {
    let subtotal = 0;
    items.forEach(item => {
      subtotal += (item.rate || 0) * item.quantity;
    });
    return subtotal;
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error('Add at least one item');
      return;
    }
    
    // Battery check
    for (const item of items) {
      if (item.isBattery && !item.serialNumberId) {
        toast.error(`Please provide a valid Serial Number for ${item.name}`);
        return;
      }
    }

    setSaving(true);
    try {
      const payload = {
        customerId: customerId || undefined,
        vehicleId: vehicleId || undefined,
        notes: notes || undefined,
        showAmount,
        items: items.map(i => ({
          productId: i.productId,
          quantity: i.quantity,
          rate: i.rate,
          discount: i.discount,
          gstRate: i.gstRate,
          serialNumberId: i.serialNumberId || undefined
        }))
      };

      const res = await api.post('/challans', payload);
      toast.success('Challan created successfully');
      navigate(`/challans/${res.data.data.id}`);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Failed to create challan');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="flex flex-col xl:flex-row gap-8 h-[calc(100vh-10rem)]">
      {/* ─── Left: Items ────────────────────────────── */}
      <div className="flex-[3] flex flex-col min-w-0 gap-6">
        {/* Product Search */}
        <div className="bg-white border border-ji-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm">
              <Truck size={20} />
            </div>
            <h2 className="text-sm font-black text-ji-text uppercase tracking-widest">Inventory Manifest</h2>
          </div>
          
          <div className="relative group">
            <SearchIcon size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
            <input
              type="text"
              placeholder="Query Asset Registry by Name or Specification..."
              value={productSearch}
              onChange={(e) => setProductSearch(e.target.value)}
              className="w-full pl-12 pr-6 py-4 bg-ji-bg/30 border border-ji-border rounded-xl text-ji-text text-xs font-bold placeholder:text-ji-text-dim/40 focus:border-ji-amber outline-none transition-all"
            />
          </div>
          
          {productSearch && (
            <div className="flex gap-3 overflow-x-auto py-6 custom-scrollbar scroll-smooth">
              {products
                .filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()))
                .slice(0, 12)
                .map(product => (
                  <button
                    key={product.id}
                    onClick={() => {
                      addItem(product);
                      setProductSearch('');
                    }}
                    className="flex-shrink-0 px-5 py-3 bg-white border border-ji-border hover:border-ji-amber rounded-xl text-left transition-all shadow-sm group active:scale-95"
                  >
                    <span className="block text-[10px] font-black text-ji-text uppercase tracking-widest group-hover:text-ji-amber">{product.name}</span>
                    <span className="block text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] mt-1 opacity-60">₹{product.mrp.toLocaleString()}</span>
                  </button>
                ))}
            </div>
          )}
        </div>

        {/* Selected Items */}
        <div className="bg-white border border-ji-border rounded-[2.5rem] flex-1 overflow-hidden flex flex-col shadow-sm">
          <div className="p-8 border-b border-ji-border bg-ji-bg/30 flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Activity size={18} className="text-ji-amber" />
              <h2 className="text-sm font-black text-ji-text uppercase tracking-widest">Manifest Timeline</h2>
            </div>
            <span className="text-[10px] font-black text-ji-text uppercase tracking-widest bg-white border border-ji-border px-4 py-1.5 rounded-full shadow-sm">{items.length} ACTIVE_NODES</span>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
            {items.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center gap-6 opacity-30">
                <div className="w-24 h-24 bg-ji-bg rounded-[3rem] flex items-center justify-center shadow-inner">
                   <Truck size={48} className="text-ji-text-dim" />
                </div>
                <div className="text-center">
                  <p className="text-sm font-black text-ji-text uppercase tracking-widest">Awaiting Payload</p>
                  <p className="text-[10px] text-ji-text-dim font-bold italic mt-1">Add items from the registry to initialize dispatch</p>
                </div>
              </div>
            ) : (
              items.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="group p-6 bg-white border border-ji-border hover:border-ji-amber/30 rounded-3xl transition-all shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-1 bg-ji-amber h-full opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex flex-col md:flex-row gap-8">
                    <div className="flex-[2] space-y-4">
                      <div className="flex items-start justify-between">
                        <p className="text-sm font-black text-ji-text uppercase tracking-tight">{item.name}</p>
                        <button onClick={() => removeItem(index)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:bg-red-500 hover:text-white transition-all duration-300">
                          <X size={14} />
                        </button>
                      </div>
                      
                      {item.isBattery && (
                        <div className="relative group/sn">
                          <label className="text-[9px] font-black text-ji-text-dim uppercase tracking-[0.2em] mb-2 block">SERIAL_IDENTITY_VERIFICATION</label>
                          <input
                            type="text"
                            placeholder="Scan/Verify UID [Min 8 Chars]..."
                            value={item.serialString}
                            onChange={async (e) => {
                              const val = e.target.value.toUpperCase();
                              const newItems = [...items];
                              newItems[index].serialString = val;
                              setItems(newItems);
                              
                              if (val.length >= 8) {
                                try {
                                  const res = await api.get(`/batteries/serial/${val}`);
                                  if (res.data.data.status === 'IN_STOCK') {
                                    newItems[index].serialNumberId = res.data.data.id;
                                    setItems([...newItems]);
                                    toast.success('Serial verified');
                                  } else {
                                    toast.error('Serial not IN_STOCK');
                                  }
                                } catch { }
                              }
                            }}
                            className={`w-full bg-ji-bg/30 border ${item.serialNumberId ? 'border-emerald-500 text-emerald-700' : 'border-ji-border text-ji-amber'} rounded-xl px-5 py-3 text-[10px] font-black font-['JetBrains_Mono'] uppercase tracking-widest outline-none transition-all shadow-inner placeholder:text-ji-text-dim/30`}
                          />
                          {item.serialNumberId && (
                            <div className="absolute right-4 top-[38px] w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                          )}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex-1 space-y-4">
                      <label className="text-[9px] font-black text-ji-text-dim uppercase tracking-[0.2em] mb-2 block">UNITS_MANIFEST</label>
                      <input
                        type="number"
                        min="1"
                        value={item.quantity}
                        onChange={(e) => {
                          const newItems = [...items];
                          newItems[index].quantity = parseInt(e.target.value) || 1;
                          setItems(newItems);
                        }}
                        disabled={item.isBattery}
                        className="w-full bg-ji-bg/30 border border-ji-border rounded-xl px-5 py-3 text-xs font-black text-ji-text font-['JetBrains_Mono'] outline-none focus:border-ji-amber disabled:opacity-30 shadow-inner"
                      />
                    </div>
                    
                    {showAmount && (
                      <div className="flex-1 space-y-4">
                        <label className="text-[9px] font-black text-ji-text-dim uppercase tracking-[0.2em] mb-2 block">MRP_PARITY_INR</label>
                        <input
                          type="number"
                          value={item.rate}
                          onChange={(e) => {
                            const newItems = [...items];
                            newItems[index].rate = parseFloat(e.target.value) || 0;
                            setItems(newItems);
                          }}
                          className="w-full bg-ji-bg/30 border border-ji-border rounded-xl px-5 py-3 text-xs font-black text-ji-text font-['JetBrains_Mono'] outline-none focus:border-ji-amber shadow-inner"
                        />
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
          
          {showAmount && items.length > 0 && (
             <div className="p-8 border-t border-ji-border bg-ji-bg/30 flex justify-between items-center shadow-inner">
               <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">Estimated Financial Footprint</span>
               <p className="text-2xl font-black font-['JetBrains_Mono'] text-ji-amber tracking-tighter">
                  ₹ {calculateTotals().toLocaleString('en-IN', { minimumFractionDigits: 2 })}
               </p>
             </div>
          )}
        </div>
      </div>

      {/* ─── Right: Customer & Details ──────────────── */}
      <div className="flex-[2] flex flex-col min-w-0 gap-6">
        {/* Customer Selection */}
        <div className="bg-white border border-ji-border rounded-[2rem] p-8 shadow-sm">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm">
              <Users size={18} />
            </div>
            <h2 className="text-sm font-black text-ji-text uppercase tracking-widest">Counterparty Identity</h2>
          </div>
          
          {!customerId ? (
            <div className="relative group">
              <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-ji-text-dim group-focus-within:text-ji-amber transition-colors" />
              <input
                type="text"
                placeholder="Query Stakeholder Registry..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="w-full pl-12 pr-6 py-4 bg-ji-bg/30 border border-ji-border rounded-xl text-ji-text text-xs font-bold focus:border-ji-amber outline-none transition-all shadow-inner"
              />
              {customerSearch && (
                <div className="absolute z-[100] top-full mt-2 left-0 right-0 bg-white border border-ji-border rounded-2xl shadow-2xl max-h-72 overflow-y-auto overflow-x-hidden custom-scrollbar divide-y divide-ji-border/50">
                  {customers
                    .filter(c => c.name.toLowerCase().includes(customerSearch.toLowerCase()) || (c.phone && c.phone.includes(customerSearch)))
                    .map(c => (
                      <button
                        key={c.id}
                        onClick={() => { setCustomerId(c.id); setCustomerSearch(''); }}
                        className="w-full text-left px-6 py-4 hover:bg-ji-bg transition-colors flex justify-between items-center group/btn"
                      >
                        <div className="space-y-1">
                          <span className="block text-sm font-black text-ji-text group-hover/btn:text-ji-amber transition-colors uppercase tracking-tight">{c.name}</span>
                          <span className="block text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] uppercase tracking-widest opacity-60">{c.phone || 'ID_NOT_REGISTERED'}</span>
                        </div>
                        <div className="w-8 h-8 rounded-lg bg-ji-bg border border-ji-border flex items-center justify-center text-ji-text-dim opacity-0 group-hover/btn:opacity-100 transition-opacity">
                          <Activity size={12} />
                        </div>
                      </button>
                    ))}
                </div>
              )}
            </div>
          ) : (
             <div className="flex items-center justify-between bg-ji-amber/5 border border-ji-amber/30 rounded-[1.5rem] p-6 shadow-sm">
                <div className="space-y-1">
                  <p className="text-sm font-black text-ji-amber uppercase tracking-tight">{selectedCustomer?.name}</p>
                  <p className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] uppercase tracking-widest opacity-70 italic">{selectedCustomer?.phone}</p>
                </div>
                <button 
                  onClick={() => { setCustomerId(null); setVehicleId(null); }} 
                  className="w-10 h-10 flex items-center justify-center rounded-xl bg-white border border-ji-amber/20 text-ji-amber hover:bg-ji-amber hover:text-white transition-all shadow-sm active:scale-95"
                >
                  <X size={18} />
                </button>
             </div>
          )}
        </div>

        {/* Vehicle Selection */}
        {customerId && selectedCustomer?.vehicles && selectedCustomer.vehicles.length > 0 && (
          <div className="bg-white border border-ji-border rounded-[2rem] p-8 shadow-sm">
             <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm">
                <Truck size={18} />
              </div>
              <h2 className="text-sm font-black text-ji-text uppercase tracking-widest">Linked Logistics Hub</h2>
            </div>
            <div className="relative">
              <select
                value={vehicleId || ''}
                onChange={(e) => setVehicleId(e.target.value || null)}
                className="w-full appearance-none bg-ji-bg/30 border border-ji-border rounded-xl px-6 py-4 text-[10px] font-black text-ji-text uppercase tracking-widest focus:border-ji-amber outline-none cursor-pointer shadow-inner"
              >
                <option value="">STATIC_DISPATCH_PROTOCOL</option>
                {selectedCustomer.vehicles.map((v: any) => (
                  <option key={v.id} value={v.id}>{v.regNumber} | {v.make ? `${v.make}_${v.model}` : 'GENERIC_UNIT'}</option>
                ))}
              </select>
              <div className="absolute right-5 top-1/2 -translate-y-1/2 pointer-events-none text-ji-text-dim opacity-50">
                <ChevronDown size={14} />
              </div>
            </div>
          </div>
        )}

        {/* Dispatch Protocol */}
        <div className="bg-white border border-ji-border rounded-[2.5rem] p-8 shadow-sm flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-xl bg-ji-amber/5 border border-ji-amber/20 flex items-center justify-center text-ji-amber shadow-sm">
              <Activity size={18} />
            </div>
            <h2 className="text-sm font-black text-ji-text uppercase tracking-widest">Dispatch Parameters</h2>
          </div>

          <button 
            type="button"
            onClick={() => setShowAmount(!showAmount)}
            className="w-full flex items-center gap-5 p-5 bg-ji-bg/30 border border-ji-border rounded-2xl mb-8 group transition-all hover:bg-white hover:border-ji-amber shadow-inner hover:shadow-md"
          >
            <div className={`relative w-12 h-7 rounded-full transition-colors flex items-center p-1 ${showAmount ? 'bg-ji-amber' : 'bg-ji-text-dim/20'}`}>
              <div className={`bg-white w-5 h-5 rounded-full shadow-sm transition-transform ${showAmount ? 'translate-x-5' : ''}`} />
            </div>
            <div className="text-left">
              <p className="text-[10px] font-black text-ji-text uppercase tracking-widest">Financial Disclosure</p>
              <p className="text-[9px] text-ji-text-dim font-bold italic mt-1 uppercase tracking-wider">Embed MRP parity in dispatch document</p>
            </div>
          </button>

          <div className="space-y-3 flex-1">
            <label className="text-[9px] font-black text-ji-text-dim uppercase tracking-[0.2em] ml-1 block">Protocol Annotation</label>
            <textarea
              placeholder="Annotate transit conditions, mechanic personnel, or special disposal route details..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full h-32 bg-ji-bg/30 border border-ji-border rounded-2xl p-5 text-sm font-black text-ji-text placeholder:text-ji-text-dim/30 placeholder:italic focus:outline-none focus:border-ji-amber custom-scrollbar shadow-inner"
            />
          </div>

          {/* Confirm Button */}
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="w-full mt-10 bg-ji-amber hover:bg-ji-amber/90 text-white font-black py-5 rounded-[1.5rem] shadow-xl shadow-ji-amber/30 transition-all flex items-center justify-center gap-4 disabled:opacity-30 disabled:grayscale group uppercase tracking-[0.2em] text-[10px] active:scale-95"
          >
            {saving ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Initializing...
              </>
            ) : (
              <>
                <Truck size={18} className="group-hover:translate-x-1 transition-transform" /> 
                Commit Dispatch Protocol
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
