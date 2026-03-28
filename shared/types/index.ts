// ─── Shared Types: Janwari Industries Billing Software ─────
// These types are used by both client and server.

// ─── API Response Wrappers ──────────────────────────

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiPaginatedResponse<T> {
  success: true;
  data: T[];
  total: number;
  page: number;
  limit: number;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ─── Enums (mirror Prisma enums for client use) ─────

export type Role = 'ADMIN' | 'CASHIER';
export type CustomerType = 'RETAIL' | 'FLEET' | 'MECHANIC';
export type InvoiceType = 'TAX_INVOICE' | 'QUOTE' | 'CREDIT_NOTE';
export type InvoiceStatus = 'DRAFT' | 'FINALIZED' | 'PAID' | 'PARTIAL' | 'CANCELLED';
export type PaymentMode = 'CASH' | 'UPI' | 'CHEQUE' | 'CREDIT';
export type SerialStatus = 'IN_STOCK' | 'SOLD' | 'EXCHANGED' | 'SCRAPPED';
export type WarrantyStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'SETTLED';
export type ClaimType = 'FREE_REPLACEMENT' | 'PRO_RATA';
export type BatteryCondition = 'DEAD' | 'DAMAGED' | 'REFURBISHABLE' | 'GOOD';
export type KhataType = 'DEBIT' | 'CREDIT' | 'ADVANCE';
export type PettyCategory = 'TRANSPORT' | 'MEALS' | 'STATIONERY' | 'MAINTENANCE' | 'STAFF' | 'OTHER';

// ─── Auth Types ─────────────────────────────────────

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: {
    id: string;
    name: string;
    username: string;
    role: Role;
  };
}

export interface JWTPayload {
  userId: string;
  username: string;
  role: Role;
}

// ─── GST Types ──────────────────────────────────────

export interface GSTLineResult {
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
}

export interface GSTResult {
  subtotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  grandTotal: number;
}

// ─── Pro-Rata Warranty Types ────────────────────────

export interface ProRataResult {
  type: 'FREE_REPLACEMENT' | 'PRO_RATA' | 'EXPIRED';
  claimAmount: number;
  percentageRemaining: number;
}

// ─── Cart Types (for billing) ───────────────────────

export interface CartItem {
  id: string;              // temp client-side ID
  productId: string;
  name: string;
  brand?: string;
  hsnCode: string;
  gstRate: number;
  mrp: number;
  rate: number;            // selling price (after markup/markdown)
  quantity: number;
  discount: number;        // percentage
  isBattery: boolean;
  serialNumber?: string;
  serialNumberId?: string;
  isExchange: boolean;
  // Calculated fields
  taxableAmount: number;
  cgst: number;
  sgst: number;
  igst: number;
  totalGst: number;
  lineTotal: number;
}

export interface CartState {
  items: CartItem[];
  customerId?: string;
  customerName?: string;
  customerStateCode: string;  // default "01" for J&K
  vehicleId?: string;
  vehicleRegNumber?: string;
  mechanicId?: string;
  mechanicName?: string;
  notes?: string;
  // Calculated totals
  subtotal: number;
  totalDiscount: number;
  totalGst: number;
  grandTotal: number;
}
