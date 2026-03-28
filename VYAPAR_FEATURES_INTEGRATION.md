# 📦 VYAPAR FEATURES INTEGRATION DOCUMENT
## Janwari Industries Billing Software — Vyapar Parity + Enhancement Guide

**Purpose:** Research-backed document for Antigravity to implement every Vyapar feature — and then go further.  
**Prepared by:** Zoonigia Build Team | March 2026  
**Status:** Add to Antigravity after Phase 2 core billing is complete.

---

## What Is Vyapar? (Research Summary)

Vyapar is India's leading small-business billing app with 5M+ downloads and 3M+ active users. It runs on Android, Windows, and Mac. It charges ₹3,399/year for premium features. Its core strength is simplicity — a shop owner with no accounting background can run their entire business on it.

**Where Vyapar wins:** Simplicity, GST compliance, offline functionality, WhatsApp integration, Indian market conventions.

**Where Vyapar falls short (based on 181+ user reviews):**
- No role-based privacy (employees can see owner's profit margins — caused real business conflict)
- WhatsApp invoice feature frequently sends blank files
- Barcode printing bugs, app hangs during business hours
- No domain-specific logic (no warranty tracking, no serial numbers, no industry intelligence)
- Customer support described as "nightmare" by multiple reviewers
- No API for third-party integrations
- Tablet layout broken (portrait-only design)
- Date field frustrating to change
- No multi-language support

**Our advantage:** Everything Vyapar does, we do — but built specifically for auto accessories and battery retail, with no generic compromises.

---

## THE COMPLETE VYAPAR FEATURE LIST

Below is every documented Vyapar feature, organized by category, researched from official Vyapar sources and verified user reviews.

---

### CATEGORY 1: INVOICING & BILLING

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-01 | GST-compliant invoices (CGST/SGST/IGST) | ✅ Already planned | + Auto HSN lookup, battery-specific 28% pre-filled |
| V-02 | 10+ invoice format/theme choices | ➕ Add | + Industrial Precision theme + 3 print layouts |
| V-03 | Company logo on invoice | ➕ Add | + Shop logo upload with auto-resize |
| V-04 | Custom invoice fields (editable labels) | ➕ Add | + Battery serial no field, vehicle reg field pre-built |
| V-05 | Invoice/bill auto-numbering | ✅ Already planned | + Fiscal-year-aware (JI/2025-26/0001) |
| V-06 | Cash sale by default (toggle) | ➕ Add | + One-key toggle, remembers last session's preference |
| V-07 | Estimates / Quotations | ✅ Already planned | + Validity timer on quote, expired quotes flagged amber |
| V-08 | Quote → Invoice one-click convert | ✅ Already planned | + No re-entry, preserves all line items and serial nos |
| V-09 | Sale Return / Credit Note | ➕ Add | + Links back to original invoice, restores inventory |
| V-10 | Proforma Invoice | ➕ Add | + Pre-billing for advance orders, especially fleet accounts |
| V-11 | Mixed Invoice (GST + non-GST items) | ✅ Already planned | + Auto-splits taxable vs exempt lines |
| V-12 | Credit Invoice | ➕ Add | + Linked to Khata, balance auto-updated |
| V-13 | Duplicate transaction (copy invoice) | ➕ Add | + One click — perfect for repeat battery orders |
| V-14 | Multi-page invoice support with page numbers | ➕ Add | + For fleet accounts with 20+ line items |
| V-15 | Print via laser + thermal printer | ✅ Already planned | + 80mm thermal direct ESC/POS |
| V-16 | Share via WhatsApp, Email, SMS | ✅ Already planned | + PDF attachment, not just link |
| V-17 | Barcode scan for item entry | ➕ Add | + Camera-based scan on mobile, USB scanner on desktop |
| V-18 | Barcode generation for loose items | ✅ Already planned | + QR code with item details encoded |
| V-19 | Multiple payment modes (cash/UPI/cheque/card) | ✅ Already planned | + Split payment, UPI reference number field |
| V-20 | Shortcut keys for billing speed | ✅ Already planned | + Full F-key map documented |
| V-21 | Auto-fill item info while billing | ✅ Already planned | + Debounced search, vehicle compatibility shown |
| V-22 | Terms & Conditions on invoice | ➕ Add | + Configurable per invoice type, defaults pre-set |

---

### CATEGORY 2: INVENTORY MANAGEMENT

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-23 | Item/product management | ✅ Already planned | + Battery-specific fields (Ah, voltage, polarity) |
| V-24 | Category-wise item organization | ✅ Already planned | + 7 default categories pre-seeded |
| V-25 | Stock quantity tracking | ✅ Already planned | + Per-location (shop floor, godown) |
| V-26 | Low stock alerts | ✅ Already planned | + Threshold per item, morning dashboard widget |
| V-27 | Stock expiry date tracking | ➕ Add | + Batch-level expiry for accessories with shelf life |
| V-28 | Batch number tracking | ➕ Add | + Lot/batch ID on inward, linked to invoice items |
| V-29 | Serial number tracking | ✅ Already planned (Enhanced) | + Full lifecycle: IN_STOCK → SOLD → EXCHANGED |
| V-30 | Stock valuation (FIFO/average cost) | ➕ Add | + FIFO default, average cost option in settings |
| V-31 | Multi-warehouse / godown support | ✅ Already planned | + Transfer requests between locations |
| V-32 | Stock transfer between locations | ✅ Already planned | + Transfer slip printable |
| V-33 | Item parameter tracking (slot, batch, expiry) | ➕ Add | + Custom parameter fields per category |
| V-34 | Manufacturing items from raw materials | ⛔ Skip (not relevant) | N/A for retail shop |
| V-35 | Stock ageing report | ✅ Already planned | + Dead stock (60/90/120 days flag) |
| V-36 | Stock valuation report | ➕ Add | + Total inventory value at cost and MRP |
| V-37 | Item-wise profit report | ➕ Add | + Margin % per product, best/worst margins |
| V-38 | Discount report | ➕ Add | + How much discount was given, by product/customer |

---

### CATEGORY 3: PURCHASE MANAGEMENT

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-39 | Purchase bill entry | ✅ Already planned | + Links to supplier ledger |
| V-40 | Purchase order creation | ✅ Already planned | + WhatsApp share to supplier |
| V-41 | Purchase order → Purchase bill convert | ➕ Add | + One click, received qty editable |
| V-42 | Purchase Return / Debit Note | ➕ Add | + Adjusts supplier ledger and stock |
| V-43 | Payment Out (supplier payment) | ➕ Add | + Mark invoice as paid, partial payment |
| V-44 | OCR for purchase bills (scan & extract) | ✅ Already planned (Snap-to-Bill) | + Claude API vision, not basic OCR — smarter |
| V-45 | Supplier management | ✅ Already planned | + Outstanding payable per supplier |
| V-46 | Auto-numbering for purchase transactions | ➕ Add | + PO-2025-26-001 format |

---

### CATEGORY 4: EXPENSE MANAGEMENT

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-47 | Expense entry with categories | ✅ Already planned (Petty Cash) | + More granular categories |
| V-48 | GST on expenses (input tax credit) | ➕ Add | + Track expenses with GST separately (ITC eligible) |
| V-49 | Expense reports | ➕ Add | + Category-wise monthly, YTD |
| V-50 | Other Income tracking | ➕ Add | + Scrap sale income, commission income, other |
| V-51 | Other Income categories | ➕ Add | + Scrap battery sales auto-linked to Graveyard ledger |

---

### CATEGORY 5: ACCOUNTS & CASH FLOW

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-52 | Cash & Bank account management | ➕ Add | + Multiple accounts (cash drawer, SBI account, PhonePe) |
| V-53 | Bank-to-bank transfer recording | ➕ Add | + Internal transfers between accounts |
| V-54 | Accounts Receivable tracking | ✅ Already planned (Khata) | + Aging report + WhatsApp reminders |
| V-55 | Accounts Payable tracking | ✅ Already planned (Suppliers) | + Aging report for what we owe |
| V-56 | Party-to-party balance transfer | ➕ Add | + e.g., credit from one customer applied to another |
| V-57 | Cash flow report (daily/monthly) | ➕ Add | + Cash in vs cash out, balance in hand |
| V-58 | Bank reconciliation | ➕ Add | + Compare cash book to bank statement |
| V-59 | Cheque management | ➕ Add | + Post-dated cheques, clearing date tracking |
| V-60 | Balance Sheet | ➕ Add | + Assets, liabilities, equity snapshot |
| V-61 | Trial Balance | ➕ Add | + Full accounting view for CA/accountant |
| V-62 | Credit limit per customer | ✅ Already planned | + Alert on billing screen if customer near limit |

---

### CATEGORY 6: CUSTOMER MANAGEMENT

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-63 | Customer/Party database | ✅ Already planned | + Vehicle linkage, mechanic flag |
| V-64 | Customer purchase history | ✅ Already planned | + Timeline view per customer |
| V-65 | Outstanding balance per customer | ✅ Already planned | + Color-coded (green/amber/red) |
| V-66 | Payment reminders (WhatsApp/SMS/email) | ✅ Already planned | + Templated message, one-click send |
| V-67 | Credit limit per customer | ✅ Already planned | + Counter staff warned on billing |
| V-68 | Loyalty points for customers | ➕ Add | + Points per ₹100 spent, redeemable as discount |
| V-69 | Customer statement printable | ✅ Already planned | + PDF with all transactions, balance |
| V-70 | Bulk WhatsApp messages to all parties | ➕ Add | + Festival greetings, scheme announcements |

---

### CATEGORY 7: DELIVERY & LOGISTICS

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-71 | Delivery Challan creation | ➕ Add | + For godown → shop transfers and customer delivery |
| V-72 | Challan → Invoice conversion | ➕ Add | + Goods delivered, now raise the bill |
| V-73 | Goods Return on Delivery Challan | ➕ Add | + Partial return before invoice |
| V-74 | Print amount on challan (toggle) | ➕ Add | + Some deliveries shouldn't show price |
| V-75 | E-Way Bill generation | ➕ Add | + Required for inter-state goods >₹50,000 |
| V-76 | Consignor/Consignee tracking | ➕ Add | + For batteries shipped to fleet customers |

---

### CATEGORY 8: GST & COMPLIANCE REPORTS

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-77 | GSTR-1 report | ✅ Already planned | + JSON export, direct portal upload ready |
| V-78 | GSTR-2 report (purchase summary) | ➕ Add | + B2B purchase reconciliation |
| V-79 | GSTR-3B report | ➕ Add | + Net tax payable summary |
| V-80 | GST Detail Report (HSN-wise) | ➕ Add | + HSN-wise sales breakdown |
| V-81 | GST on Expenses tracking | ➕ Add | + ITC on purchases with GSTIN |
| V-82 | E-invoice generation | ➕ Add (future-ready) | + IRN integration when threshold crossed |

---

### CATEGORY 9: ANALYTICS & REPORTS (50+ in Vyapar)

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-83 | Business Dashboard | ✅ Already planned | + Weather widget, J&K season predictor |
| V-84 | Sale Report (day/month/year) | ✅ Already planned | + Category filter, brand filter |
| V-85 | Purchase Report | ✅ Already planned | + Supplier-wise breakdown |
| V-86 | Profit & Loss Report | ✅ Already planned | + Item-wise margin analysis |
| V-87 | Bill-wise Profit | ➕ Add | + Margin on each individual invoice |
| V-88 | Cash Flow Report | ➕ Add | + Day-by-day cash position |
| V-89 | Stock Summary Report | ✅ Already planned | + Location-wise breakdown |
| V-90 | Item Report by Party | ➕ Add | + Which item sold to which customer most |
| V-91 | Party-wise Outstanding Report | ✅ Already planned | + Downloadable PDF |
| V-92 | Stock Valuation Report | ➕ Add | + At cost price + at MRP |
| V-93 | Stock Ageing Report | ✅ Already planned | + 30/60/90/120+ days buckets |
| V-94 | Discount Report | ➕ Add | + Item-wise, customer-wise, period-wise |
| V-95 | Salesman Tracking | ➕ Add (Enhanced) | + GPS check-in for delivery drivers |
| V-96 | Balance Sheet | ➕ Add | + Full accounting statement |
| V-97 | Day Book (daily transaction log) | ➕ Add | + All transactions in chronological order |
| V-98 | Expense Category Report | ➕ Add | + Where the money is going |
| V-99 | Other Income Report | ➕ Add | + Secondary revenue streams |

---

### CATEGORY 10: SETTINGS & PLATFORM

| # | Vyapar Feature | Status in Janwari App | Enhancement |
|---|---------------|----------------------|-------------|
| V-100 | Multi-user access with roles | ✅ Already planned | + Cashier can't see cost prices (fixes Vyapar's privacy flaw) |
| V-101 | Multi-firm management | ➕ Add | + If owner has another shop/business |
| V-102 | Auto backup to Google Drive | ➕ Add | + Daily backup, one-click restore |
| V-103 | Online + Offline functionality | ✅ Already planned | + SQLite local + PostgreSQL cloud sync |
| V-104 | Multi-device sync | ✅ Already planned | + Owner's laptop + counter desktop |
| V-105 | Customizable invoice language fields | ➕ Add | + English default, editable labels |
| V-106 | Online Store for customer orders | ➕ Add (Phase 6) | + Simple catalog page, WhatsApp-based order intake |
| V-107 | UPI payment collection | ➕ Add | + QR code on invoice for direct UPI payment |
| V-108 | Salesman Tracking (GPS) | ➕ Add | + For delivery staff, geo-tagged check-ins |

---

## JANWARI-SPECIFIC ENHANCEMENTS OVER VYAPAR

These are features Vyapar will never have because it serves 200+ industries generically. We build them because Janwari is a battery shop.

| # | Janwari-Exclusive Feature | Why Vyapar Can't Do This |
|---|--------------------------|--------------------------|
| J-01 | Battery serial number lifecycle (IN_STOCK → SOLD → EXCHANGED → SCRAPPED) | No concept of serial numbers in Vyapar |
| J-02 | Warranty engine with pro-rata calculator | No warranty tracking in Vyapar |
| J-03 | Core exchange billing (old battery deduction) | No exchange/trade-in concept in Vyapar |
| J-04 | Battery Graveyard Ledger (scrap tracking → dealer settlement) | No scrap ledger in Vyapar |
| J-05 | Mechanic/Ustad commission system with leaderboard | No referral commission tracking |
| J-06 | Vehicle registration → customer auto-fill | No vehicle database in Vyapar |
| J-07 | Vehicle compatibility matrix (which battery fits which car) | No domain-specific catalogue in Vyapar |
| J-08 | Fleet account module (consolidated monthly billing) | No fleet-specific billing tier |
| J-09 | Kashmir Winter Surge Predictor (ML seasonal demand) | No ML in Vyapar |
| J-10 | Snap-to-Bill via Claude AI vision (smarter than Vyapar's basic OCR) | Vyapar's OCR is basic, no AI context |
| J-11 | Warranty claim slip print | No claim workflows in Vyapar |
| J-12 | Warranty expiry customer alerts | No proactive warranty management |
| J-13 | Scrap dealer settlement ledger | No scrap/secondary market tracking |
| J-14 | Morning dashboard with weather-aware alerts | No geo-contextual intelligence |

---

## ANTIGRAVITY BUILD INSTRUCTIONS

### How To Use This Document

This document is a feature integration guide. After completing Phase 2 (Core Billing) of the master roadmap, begin implementing features from this document in this order:

**Priority Order:**
1. **Must-have before launch** (⭐⭐⭐) — features shops expect as baseline
2. **Should-have by Month 2** (⭐⭐) — features that make us clearly better than Vyapar
3. **Nice-to-have in Month 3+** (⭐) — features that make us untouchable

---

## PHASE-BY-PHASE VYAPAR FEATURE INTEGRATION

### Phase 2.5: Vyapar Billing Parity (immediately after Phase 2)

Implement these before anything else — they fill gaps in the core billing experience.

#### 2.5.1 — Sale Return / Credit Note (⭐⭐⭐)

**What Vyapar does:** Create a return entry, reverse inventory, link to original invoice.
**What we do, better:**

Backend — add to `server/src/routes/invoices.routes.ts`:
```
POST /api/invoices/:id/return
Body: { items: [{ invoiceItemId, returnQty, reason }], refundMode: 'CASH' | 'CREDIT' }
```

Service logic (`invoice.service.ts`):
- Create a new invoice with type = `CREDIT_NOTE`
- Reference original invoice ID
- Restore stock quantities for returned items
- If battery with serial number: set SerialStatus back to IN_STOCK (if unused) or EXCHANGED
- If refundMode = CREDIT: create KhataEntry with type = CREDIT (customer's advance balance)
- If refundMode = CASH: record payment out

UI: Add "Return / Credit Note" button on finalized invoice detail page. Opens a slide-over where each line item can be partially or fully returned. Reason field required. Shows refund amount and asks payment mode.

Prisma additions:
```prisma
model Invoice {
  // Add these fields:
  originalInvoiceId  String?
  originalInvoice    Invoice?  @relation("CreditNoteRef", fields: [originalInvoiceId], references: [id])
  creditNotes        Invoice[] @relation("CreditNoteRef")
  returnReason       String?
}
```

Enhancement over Vyapar:
- Partial return by quantity (Vyapar supports this, we match it)
- Battery serial number automatically un-sold on return (Vyapar has no serial tracking)
- Return reason mandatory (audit trail Vyapar lacks)
- Credit amount automatically routed to Khata if customer wants store credit

---

#### 2.5.2 — Delivery Challan System (⭐⭐⭐)

**What Vyapar does:** Create a delivery challan, convert to invoice when goods reach customer.
**What we do, better:**

This is important for Janwari because:
- Batteries delivered to mechanics before billing (mechanic checks, then pays)
- Inter-godown transfers need paper trail
- Fleet deliveries often need challan before consolidated monthly invoice

New model:
```prisma
model DeliveryChallan {
  id              String          @id @default(cuid())
  challanNumber   String          @unique  // DC/2025-26/001
  customerId      String?
  customer        Customer?       @relation(fields: [customerId], references: [id])
  vehicleId       String?
  status          ChallanStatus   @default(PENDING)
  showAmount      Boolean         @default(false)  // toggle: print amount or not
  items           ChallanItem[]
  invoiceId       String?         @unique  // linked invoice after conversion
  invoice         Invoice?        @relation(fields: [invoiceId], references: [id])
  notes           String?
  deliveredAt     DateTime?
  createdAt       DateTime        @default(now())
}

enum ChallanStatus {
  PENDING       // created, not yet delivered
  DELIVERED     // delivered, awaiting invoice
  INVOICED      // converted to invoice
  RETURNED      // goods returned
  CANCELLED
}

model ChallanItem {
  id           String          @id @default(cuid())
  challanId    String
  challan      DeliveryChallan @relation(fields: [challanId], references: [id])
  productId    String
  product      Product         @relation(fields: [productId], references: [id])
  quantity     Int
  rate         Float?          // optional, hidden if showAmount = false
}
```

Routes:
```
GET  /api/challans
POST /api/challans           (create)
PUT  /api/challans/:id       (update status)
POST /api/challans/:id/convert  (convert to invoice)
```

UI: Delivery Challans page under the Billing section. List with status badges. "Convert to Invoice" button turns DELIVERED challan into a draft invoice pre-filled with all items.

Enhancement over Vyapar:
- "Show Amount" toggle preserved per challan (Vyapar has this, we match it)
- Battery serial numbers tracked on challan too (Vyapar can't do this)
- Mechanic-linked challan (so commission applies automatically when converted to invoice)
- Godown-to-shop-floor transfer challan type (internal, not customer-facing)

---

#### 2.5.3 — Duplicate Transaction (⭐⭐)

**What Vyapar does:** Copy any invoice as a new draft.

This is extremely useful for Janwari — fleet customers often buy the same batch of batteries monthly.

Implementation: Add "Duplicate" button on invoice detail page.

```typescript
// server/src/services/invoice.service.ts
async function duplicateInvoice(invoiceId: string, createdById: string) {
  const original = await prisma.invoice.findUnique({
    where: { id: invoiceId },
    include: { items: true, customer: true }
  });
  
  // Create new invoice with same items but:
  // - New invoice number (next in sequence)
  // - Status = DRAFT
  // - No serial numbers (batteries need new serials assigned)
  // - Today's date
  // - Remove all payment records (start fresh)
}
```

Enhancement over Vyapar:
- Battery serial numbers cleared on duplicate (forces fresh assignment — Vyapar has no such safety)
- Checks stock availability for all items before allowing duplicate

---

#### 2.5.4 — Batch Number & Expiry Tracking (⭐⭐)

**What Vyapar does:** Track items by batch number, expiry date, manufacturing date, slot number on inward.

Relevant for Janwari for:
- Wiper blades and bulbs have shelf lives
- Some accessories come in dated batches

Prisma additions to `PurchaseItem`:
```prisma
model PurchaseItem {
  // Add:
  batchNumber   String?
  expiryDate    DateTime?
  mfgDate       DateTime?
  slotNumber    String?
}
```

Inventory enhancement: When selling a batched item, use FIFO (first batch in = first batch out).

UI: On purchase entry, reveal batch/expiry fields for categories configured as "batch-tracked" in settings. Stock summary shows batches expiring in 30/60/90 days.

---

#### 2.5.5 — Proforma Invoice (⭐⭐)

**What Vyapar does:** Create a proforma invoice (advance billing document, not a tax invoice).

Useful for Janwari when:
- Fleet customer places an advance order, needs document for payment processing
- Distributor requests confirmation of an order before dispatching

Implementation: Add `PROFORMA` to `InvoiceType` enum. Proforma invoices:
- Don't update stock
- Don't go into GST reports
- Have "PROFORMA INVOICE" header (not "TAX INVOICE")
- Can be converted to Tax Invoice when goods are delivered

---

#### 2.5.6 — Loyalty Points System (⭐⭐)

**What Vyapar does:** Loyalty points for customers, redeemable as discount.

Enhancement for Janwari:
- Earn: ₹1 point per ₹100 spent (configurable in settings)
- Redeem: ₹1 cash equivalent per point (max 10% of invoice value redeemable)
- Excluded: Exchange items, credit-note invoices

Prisma additions:
```prisma
model Customer {
  // Add:
  loyaltyPoints     Int    @default(0)
  totalPointsEarned Int    @default(0)
  totalPointsUsed   Int    @default(0)
}

model LoyaltyTransaction {
  id          String            @id @default(cuid())
  customerId  String
  customer    Customer          @relation(fields: [customerId], references: [id])
  type        LoyaltyType
  points      Int
  invoiceId   String?
  createdAt   DateTime          @default(now())
}

enum LoyaltyType {
  EARNED
  REDEEMED
  EXPIRED
  MANUAL_CREDIT
  MANUAL_DEBIT
}
```

UI on billing screen: If customer has loyalty points, show "Use X points = ₹X discount" option. Toggle to apply.

Janwari enhancement over Vyapar:
- Battery purchases earn 2x points (configurable bonus category)
- Points expiry (Vyapar doesn't track expiry — ours expires in 1 year, generates WhatsApp reminder)
- Points balance shown on customer's WhatsApp invoice automatically

---

#### 2.5.7 — Cash & Bank Account Management (⭐⭐⭐)

**What Vyapar does:** Multiple bank/cash accounts, track inflows/outflows, bank reconciliation.

Essential for Janwari — they likely have:
- Cash drawer (physical)
- SBI savings account
- PhonePe / Google Pay wallet
- Possibly a cheque book

Prisma model:
```prisma
model CashBankAccount {
  id          String          @id @default(cuid())
  name        String          // "Cash Drawer", "SBI Account", "PhonePe"
  type        AccountType
  balance     Float           @default(0)
  accountNo   String?
  ifsc        String?
  transactions AccountTransaction[]
  createdAt   DateTime        @default(now())
}

enum AccountType {
  CASH
  BANK
  WALLET   // UPI wallets
}

model AccountTransaction {
  id          String          @id @default(cuid())
  accountId   String
  account     CashBankAccount @relation(fields: [accountId], references: [id])
  type        TxnType
  amount      Float
  reference   String?
  notes       String?
  invoiceId   String?
  date        DateTime        @default(now())
}

enum TxnType {
  DEBIT
  CREDIT
  TRANSFER_IN
  TRANSFER_OUT
}
```

UI: Cash & Bank page shows all accounts with current balance. Add transaction, transfer between accounts. Daily/monthly statement per account. "Day Close" button shows total cash in hand for that day.

Enhancement over Vyapar:
- **Day Close Report** — end-of-day cash balancing (Vyapar users constantly ask for this)
- UPI reconciliation: paste PhonePe statement CSV, auto-match to invoices
- Cheque tracking with post-dated cheque management (clearing date, bounce alerts)

---

#### 2.5.8 — Cheque Management (⭐)

Relevant for Janwari's fleet customers who often pay by cheque.

```prisma
model Cheque {
  id            String        @id @default(cuid())
  type          ChequeType    // RECEIVED / ISSUED
  partyId       String        // customer or supplier
  amount        Float
  chequeNo      String
  bankName      String
  clearingDate  DateTime
  status        ChequeStatus  @default(PENDING)
  invoiceId     String?
  notes         String?
  createdAt     DateTime      @default(now())
}

enum ChequeType { RECEIVED ISSUED }
enum ChequeStatus { PENDING CLEARED BOUNCED CANCELLED }
```

Alert: 3 days before cheque clearing date → dashboard notification + WhatsApp to owner.
On bounce: auto-add bounce charge to customer's Khata (configurable amount).

---

#### 2.5.9 — Multi-Firm Support (⭐)

**What Vyapar does:** Manage multiple businesses on one account.

Useful if the owner has a second shop or a separate trading entity.

Implementation: Add `firmId` to all data models. Firms switcher in the sidebar top.

Note to Antigravity: **Implement this as a setting that can be enabled later.** Do not build the full UI now — add `firmId: String?` to key models (Invoice, Customer, Product, etc.) so we can expand without migration later.

---

#### 2.5.10 — Bulk WhatsApp Messaging (⭐⭐)

**What Vyapar does:** Send bulk messages to all parties (e.g., festival greetings, scheme announcements).

Enhancement for Janwari:
- "Broadcast" section in Settings
- Message types: Payment Reminder (all overdue), Festival Greeting, New Product Announcement, Battery Check-up Campaign
- Audience filter: All Customers / Fleet Accounts Only / Mechanics Only / Customers with Outstanding > ₹X / Warranty Expiring in 30 days
- Implementation: Generate individual wa.me links (one per customer) or, if WhatsApp Business API is connected, send in batch

UI: Compose message → preview with customer name merge tag → select audience → "Send to 47 customers" → generates batch of WhatsApp links to open one by one (without API) or fires batch (with API).

---

#### 2.5.11 — Day Book / Transaction Log (⭐⭐)

**What Vyapar does:** Every transaction in chronological order, filterable by date.

Implementation: A `/daybook` page that shows all transactions for a selected date:
- Sales invoices
- Purchase entries
- Expense entries
- Payment received / paid
- Khata entries
- Cash transfers

Each entry shows: time, type badge, party name, amount, running balance.

Printable as a daily report — useful for owner to review end-of-day.

---

#### 2.5.12 — Bill-Wise Profit Report (⭐⭐)

**What Vyapar does:** Show profit/loss on each individual invoice.

Implementation: On the invoice list and detail pages, show:
- Revenue (invoice total)
- COGS (sum of cost prices of items sold)
- Gross Profit (Revenue - COGS)
- Margin % ((Gross Profit / Revenue) × 100)

Note: Only visible to ADMIN role (never to CASHIER — this was Vyapar's critical privacy flaw).

On the Reports page: a sortable table of all invoices with profit column. Filter by: date range, customer, category. Export to CSV.

---

#### 2.5.13 — GSTR-2 & GSTR-3B Reports (⭐⭐)

**What Vyapar does:** Generate GSTR-1, GSTR-2, GSTR-3B reports.

We already planned GSTR-1. Now add:

**GSTR-2 (Purchase Summary):**
- All purchases from GST-registered suppliers
- Grouped by supplier GSTIN
- Eligible ITC per tax rate

**GSTR-3B (Monthly Summary):**
- Output Tax (from sales) - Input Tax Credit (from purchases with GSTIN) = Net Payable
- This is the actual return the owner files monthly

UI: Reports > GST Reports > three tabs: GSTR-1 / GSTR-2 / GSTR-3B. Each tab: select month → view report → download PDF or JSON.

---

#### 2.5.14 — E-Way Bill Generation (⭐)

**What Vyapar does:** Generate E-Way bills for interstate consignments.

Relevant when Janwari sells to customers in other states (e.g., a Srinagar fleet company with J&K billing but goods transported across J&K districts).

Required when: goods value > ₹50,000 AND inter-state movement.

Implementation:
- E-Way Bill fields on invoice: Transporter Name, Vehicle No, Distance
- Generate E-Way Bill JSON in the format NIC portal accepts
- Future: Direct API integration with NIC E-Way Bill portal

For now: Show required fields, generate filled-in form PDF that can be manually uploaded.

---

#### 2.5.15 — Auto Backup (⭐⭐⭐)

**What Vyapar does:** Auto backup to Google Drive, one-click restore.

Implementation:
- Daily backup: Export all tables to a JSON file (or SQLite dump)
- Upload to Cloudflare R2 (already in our stack) with timestamp
- Settings page: "Backup & Restore" section
- Shows: Last backup time, backup size, "Backup Now" button, "Restore" button (admin only)
- Optional: also support Google Drive export (use Google Drive API — require OAuth)

Enhancement over Vyapar:
- Backup includes all serial numbers, warranty records, battery graveyard — Vyapar doesn't have these to back up
- Restore wizard walks through the process step-by-step with confirmation

---

#### 2.5.16 — UPI Payment QR on Invoice (⭐⭐)

**What Vyapar does:** Generate UPI QR code on the invoice for direct payment.

Implementation: In invoice PDF and WhatsApp share, embed a UPI payment QR code.

```
UPI URL format: upi://pay?pa=PHONE@upi&pn=Janwari+Industries&am=AMOUNT&cu=INR&tn=Invoice+JI/2025-26/0047
```

Fields from Settings: UPI ID (e.g., 7006083933@ybl). Generate QR from this URL + invoice amount.

Show on: PDF invoice bottom section, WhatsApp message, thermal receipt (if printer supports image printing).

---

#### 2.5.17 — Salesman / Delivery Tracking (⭐)

**What Vyapar does:** GPS-based salesman tracking with geo-tagged check-ins.

For Janwari: The "salesman" equivalent is a delivery boy who delivers batteries to mechanics or fleet customers.

Implementation (simplified version, no GPS needed yet):
- Delivery person assigned to a challan/invoice
- Mark as "Out for delivery", "Delivered", "Returned"
- Timestamp each status change
- Owner sees current status of all open deliveries on the dashboard

Enhancement: If GPS is desired later, add geolocation check-in button on the delivery page (runs in browser, no native app needed).

---

## SCHEMA ADDITIONS SUMMARY

Paste these additions into `server/prisma/schema.prisma` during Phase 2.5:

```prisma
// Add to Invoice model:
type           InvoiceType   @default(TAX_INVOICE)
// Update InvoiceType enum:
enum InvoiceType {
  TAX_INVOICE
  QUOTE
  PROFORMA        // NEW
  CREDIT_NOTE
  DELIVERY_CHALLAN
}

// New models to add:
// - DeliveryChallan + ChallanItem
// - CashBankAccount + AccountTransaction
// - Cheque
// - LoyaltyTransaction (+ add loyaltyPoints to Customer)
// - Batch fields on PurchaseItem
// - firmId (nullable) on core models for future multi-firm

// New enums to add:
// - ChallanStatus
// - AccountType
// - TxnType
// - ChequeType + ChequeStatus
// - LoyaltyType
```

---

## SETTINGS PAGE SPECIFICATION

The Settings page should have these sections (many new from Vyapar parity):

### Business Profile
- Shop name, address, phone, GSTIN, state code
- Logo upload
- Invoice terms & conditions (rich text, per invoice type)
- Signature image upload (appears on invoices)

### Invoice Preferences
- Invoice prefix (default: JI)
- Starting invoice number
- Cash sale by default (toggle)
- Show cost price to cashier (toggle — OFF by default, fixing Vyapar's flaw)
- Default payment mode
- Invoice theme (3 options: Industrial Precision / Clean Light / Minimal)
- Enable: Estimates, Proforma, Delivery Challans, Sale Orders, Purchase Orders (toggles)

### GST & Tax
- GSTIN
- State code
- Default GST rate per category (bulk-set)
- Enable reverse charge mechanism
- E-invoice settings (for future IRP integration)

### Inventory
- Low stock default threshold
- Enable batch/expiry tracking per category
- FIFO vs Average Cost method (radio)
- Enable serial number tracking per category

### Loyalty Program
- Enable/disable loyalty points
- Points per ₹100 spent
- Redemption rate (₹ per point)
- Max redemption per invoice (% of invoice value)
- Points expiry (months)
- Bonus points categories (e.g., batteries = 2x)

### Notifications & Reminders
- Payment reminder frequency (7 days, 15 days, 30 days)
- Low stock alert threshold
- Warranty expiry alert (7 days, 30 days before)
- Cheque clearing reminder (3 days before)
- Daily sales summary time (e.g., 8 PM)

### Users & Security
- User management (add/edit/deactivate users)
- Role assignment
- Activity log (who did what, when)
- Session timeout duration

### Backup & Restore
- Auto-backup schedule (daily/weekly)
- Last backup timestamp
- Backup now button
- Restore from file
- Google Drive connection (OAuth)

### Printers
- Default thermal printer (saved device)
- Default A4 printer
- Paper size (A4/A5/Letter)
- Test print button

### Integrations (Phase 5+)
- WhatsApp Business API (placeholder)
- UPI ID for payment QR
- E-Way Bill portal credentials
- IRN/E-invoice API credentials

---

## PRIORITY MATRIX FOR ANTIGRAVITY

When Antigravity asks "what should I build next?", refer to this table:

| Priority | Feature IDs | Reason |
|---------|------------|--------|
| ⭐⭐⭐ (Before launch) | V-09, V-10, V-71-76, V-52-62, V-100, V-103 | Core accounting features shops expect |
| ⭐⭐⭐ (Before launch) | V-13, V-77, V-105, V-107 | Parity features users will notice missing |
| ⭐⭐ (Month 2) | V-68, V-80-82, V-87-99, V-50-51 | Reports and analytics that make us better |
| ⭐⭐ (Month 2) | 2.5.6 (Loyalty), 2.5.7 (Cash/Bank), 2.5.10 (Bulk WA) | Stickiness features |
| ⭐ (Month 3) | V-101, 2.5.8 (Cheque), 2.5.17 (Salesman), V-75 (E-Way) | Power-user features |

**Janwari-exclusive features (J-01 to J-14) always take precedence over Vyapar parity features. Never skip them to implement Vyapar features first.**

---

## VYAPAR WEAKNESSES WE MUST EXPLICITLY FIX

These are documented pain points from Vyapar users. We must solve them:

| Vyapar Problem | Our Solution |
|---------------|-------------|
| Employees can see owner's profit margins → caused staff to quit | CASHIER role NEVER sees costPrice. It's never sent from the API to CASHIER-authenticated sessions |
| WhatsApp invoice sends blank files | We generate PDF server-side, send direct file attachment — not a link to a hosted page |
| App hangs during busy billing hours | Local-first architecture: all billing operations hit SQLite locally, never wait for network |
| Barcode printing bugs frequently | We use browser's native print + CSS media query for label printing. Simple and reliable |
| No privacy between users | Strict JWT middleware checks role before every API call. Cost prices stripped from responses for CASHIER role |
| Date field frustrating to change | We use a custom date picker component (shadcn/ui calendar) — click and done |
| Customer support non-existent | This is a custom-built app — Salik IS the support |
| Tablet layout broken | Min-width 1280px, built for landscape, never portrait-constrained |
| No API for third-party integrations | Our REST API is the integration layer — any future tool can connect |

---

*This document should be updated as new Vyapar features are released or as new Janwari-specific requirements emerge.*  
*Last researched: March 2026*
