import { create } from 'zustand';

// ─── Types ──────────────────────────────────────────

export interface CartItem {
  id: string;
  productId: string;
  name: string;
  brand: string;
  sku: string;
  hsnCode: string;
  mrp: number;
  gstRate: number;
  quantity: number;
  discount: number; // per unit discount
  serialNumber?: string; // for batteries
  isBattery: boolean;
  isExchange: boolean;
  isWarrantyClaim: boolean;
  isCustomItem?: boolean;
  claimType?: 'FREE' | 'PRO_RATA';
  originalSerialId?: string;
  originalSerialNumber?: string;
  sourceDescription?: string;
  unit: string;
  // Computed
  lineTotal: number;
  lineTaxable: number;
  lineGST: number;
  lineGrandTotal: number;
}

export interface CartCustomer {
  id: string;
  name: string;
  phone: string;
  address?: string;
  stateCode: string;
  gstin?: string;
  type: string;
}

export interface CartPayment {
  cash: number;
  upi: number;
  credit: number;
}

export interface CartMechanic {
  id: string;
  name: string;
  commissionRate: number;
}

interface CartState {
  items: CartItem[];
  customer: CartCustomer | null;
  mechanic: CartMechanic | null;
  payment: CartPayment;
  notes: string;

  // Computed totals
  subtotal: number;
  totalDiscount: number;
  totalTaxable: number;
  totalCGST: number;
  totalSGST: number;
  totalIGST: number;
  grandTotal: number;
  balance: number;

  // GST mode: intra-state (CGST+SGST) vs inter-state (IGST)
  isInterState: boolean;

  // Actions
  addItem: (product: any) => void;
  updateItem: (itemId: string, update: Partial<CartItem>) => void;
  removeItem: (itemId: string) => void;
  setCustomer: (customer: CartCustomer | null) => void;
  setMechanic: (mechanic: CartMechanic | null) => void;
  setPayment: (payment: Partial<CartPayment>) => void;
  setNotes: (notes: string) => void;
  setItems: (items: CartItem[]) => void;
  clearCart: () => void;
  recalculate: () => void;
}

// ─── GST Calculation ────────────────────────────────

function calculateLineGST(item: { mrp: number; quantity: number; discount: number; gstRate: number; isExchange?: boolean }) {
  const lineTotal = item.mrp * item.quantity;
  const lineDiscount = item.discount * item.quantity;
  const lineTaxable = lineTotal - lineDiscount;
  
  // Exchanges are usually net deductions (scrap buyback) with no GST applied by the retailer
  const lineGST = item.isExchange ? 0 : Math.round((lineTaxable * item.gstRate) / 100 * 100) / 100;
  const lineGrandTotal = Math.round((lineTaxable + lineGST) * 100) / 100;

  return {
    lineTotal: Math.round(lineTotal * 100) / 100,
    lineTaxable: Math.round(lineTaxable * 100) / 100,
    lineGST,
    lineGrandTotal,
  };
}

function recalculateCart(state: CartState): Partial<CartState> {
  let subtotal = 0;
  let totalDiscount = 0;
  let totalTaxable = 0;
  let totalGST = 0;

  const updatedItems = state.items.map((item) => {
    const calc = calculateLineGST(item);
    subtotal += calc.lineTotal;
    totalDiscount += item.discount * item.quantity;
    totalTaxable += calc.lineTaxable;
    totalGST += calc.lineGST;
    return { ...item, ...calc };
  });

  const grandTotal = Math.round((totalTaxable + totalGST) * 100) / 100;
  const totalPaid = state.payment.cash + state.payment.upi + state.payment.credit;
  const balance = Math.round((grandTotal - totalPaid) * 100) / 100;

  // J&K is state code 01 — if customer is from different state, use IGST
  const isInterState = state.customer ? state.customer.stateCode !== '01' : false;

  return {
    items: updatedItems,
    subtotal: Math.round(subtotal * 100) / 100,
    totalDiscount: Math.round(totalDiscount * 100) / 100,
    totalTaxable: Math.round(totalTaxable * 100) / 100,
    totalCGST: isInterState ? 0 : Math.round((totalGST / 2) * 100) / 100,
    totalSGST: isInterState ? 0 : Math.round((totalGST / 2) * 100) / 100,
    totalIGST: isInterState ? Math.round(totalGST * 100) / 100 : 0,
    grandTotal,
    balance,
    isInterState,
  };
}

// ─── Store ──────────────────────────────────────────

let itemIdCounter = 0;

export const useCartStore = create<CartState>((set) => ({
  items: [],
  customer: null,
  mechanic: null,
  payment: { cash: 0, upi: 0, credit: 0 },
  notes: '',

  subtotal: 0,
  totalDiscount: 0,
  totalTaxable: 0,
  totalCGST: 0,
  totalSGST: 0,
  totalIGST: 0,
  grandTotal: 0,
  balance: 0,
  isInterState: false,

  addItem: (product) => {
    const newItem: CartItem = {
      id: `cart-${++itemIdCounter}`,
      productId: product.id,
      name: product.name,
      brand: product.brand || '',
      sku: product.sku || '',
      hsnCode: product.hsnCode || '',
      mrp: product.mrp,
      gstRate: product.gstRate,
      quantity: 1,
      discount: 0,
      isBattery: product.isBattery,
      isExchange: product.isExchange || false,
      isWarrantyClaim: product.isWarrantyClaim || false,
      isCustomItem: product.isCustomItem || false,
      claimType: product.claimType,
      originalSerialId: product.originalSerialId,
      originalSerialNumber: product.originalSerialNumber,
      sourceDescription: product.sourceDescription,
      unit: product.unit || 'PCS',
      lineTotal: 0,
      lineTaxable: 0,
      lineGST: 0,
      lineGrandTotal: 0,
    };

    set((state) => {
      const newState = { ...state, items: [...state.items, newItem] };
      return { ...newState, ...recalculateCart(newState) };
    });
  },

  updateItem: (itemId, update) => {
    set((state) => {
      const items = state.items.map((item) =>
        item.id === itemId ? { ...item, ...update } : item
      );
      const newState = { ...state, items };
      return { ...newState, ...recalculateCart(newState) };
    });
  },

  removeItem: (itemId) => {
    set((state) => {
      const items = state.items.filter((item) => item.id !== itemId);
      const newState = { ...state, items };
      return { ...newState, ...recalculateCart(newState) };
    });
  },

  setCustomer: (customer) => {
    set((state) => {
      const newState = { ...state, customer };
      return { ...newState, ...recalculateCart(newState) };
    });
  },

  setMechanic: (mechanic) => set({ mechanic }),

  setPayment: (payment) => {
    set((state) => {
      const newPayment = { ...state.payment, ...payment };
      const totalPaid = newPayment.cash + newPayment.upi + newPayment.credit;
      return {
        payment: newPayment,
        balance: Math.round((state.grandTotal - totalPaid) * 100) / 100,
      };
    });
  },

  setNotes: (notes) => set({ notes }),

  setItems: (items) => {
    set((state) => {
      const newState = { ...state, items };
      return { ...newState, ...recalculateCart(newState) };
    });
  },

  clearCart: () =>
    set({
      items: [],
      customer: null,
      mechanic: null,
      payment: { cash: 0, upi: 0, credit: 0 },
      notes: '',
      subtotal: 0,
      totalDiscount: 0,
      totalTaxable: 0,
      totalCGST: 0,
      totalSGST: 0,
      totalIGST: 0,
      grandTotal: 0,
      balance: 0,
      isInterState: false,
    }),

  recalculate: () => {
    set((state) => ({ ...state, ...recalculateCart(state) }));
  },
}));
