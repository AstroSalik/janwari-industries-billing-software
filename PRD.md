# 📋 PRODUCT REQUIREMENTS DOCUMENT
## Janwari Industries Billing Software
**Version:** 1.0 | **Date:** March 2026  
**Client:** Janwari Industries, Industrial Estate Sopore, Baramulla, J&K — 193201  
**Prepared by:** Zoonigia Build Team  

---

## 1. Executive Summary

Janwari Industries requires a purpose-built billing and management system for their auto accessories and battery retail business in Sopore, J&K. The software must replace manual paper-based billing and generic accounting tools with a system that deeply understands the automotive battery domain — including warranty tracking, core exchange logic, vehicle compatibility, and J&K-specific business norms.

The product will be a **web application** with optional Electron desktop packaging, featuring offline-first architecture with cloud sync, keyboard-first UX optimized for counter speed, and an industrial-precision visual design.

---

## 2. Business Context

| Parameter | Details |
|-----------|---------|
| Business Name | Janwari Industries |
| Location | Industrial Estate, Sopore, Baramulla, J&K — 193201 |
| Phone | 7006083933 |
| Business Type | Auto Accessories & Battery Retail |
| Key Products | Automotive Batteries, Wipers, Bulbs, Electrical Accessories |
| Key Brands | Amaron, Exide, Luminous (batteries) + accessories |
| GST Registration | Active (J&K state, IGST on interstate) |
| Key Workflows | Counter billing, warranty claims, mechanic commission, udhaar/khata |
| Primary Users | Owner (admin), Counter Staff (cashier) |
| Peak Periods | October–February (Kashmir winter = high battery demand) |

---

## 3. User Personas

### 3.1 Owner / Admin (Primary)
- **Goal:** See real-time business health, catch unpaid dues, control inventory, manage staff
- **Pain Points:** Manual khata ledger, no warranty tracking, accountant takes too long for GST
- **Tech Level:** Moderate (uses WhatsApp, basic smartphone)
- **Needs:** Morning dashboard, P&L view, mechanic commission ledger, GSTR export

### 3.2 Counter Staff / Cashier
- **Goal:** Generate bills fast with zero errors, not slow down customers
- **Pain Points:** Looking up prices in paper catalogues, calculating GST manually, finding warranty info
- **Tech Level:** Low-moderate (comfortable with typing, basic navigation)
- **Needs:** Fast item search, keyboard shortcuts, one-click print, clear outstanding balance display

### 3.3 Mechanic / "Ustad" (External)
- **Goal:** Get commission settled accurately and on time
- **Interaction:** Indirect (not a software user, but their activity is tracked in the system)

---

## 4. Functional Requirements

### 4.1 Authentication & Access Control

| ID | Requirement | Priority |
|----|-------------|----------|
| AUTH-01 | Login with username + password | P0 |
| AUTH-02 | Two roles: Admin, Cashier | P0 |
| AUTH-03 | Admin can see cost prices, margins, analytics | P0 |
| AUTH-04 | Cashier sees only billing, inventory (no costs), customer balance | P0 |
| AUTH-05 | Session timeout after 30 min inactivity | P1 |
| AUTH-06 | Activity log per user (who created which invoice) | P1 |

---

### 4.2 Inventory Management

| ID | Requirement | Priority |
|----|-------------|----------|
| INV-01 | Add products with: Name, Brand, Category, HSN Code, GST Rate, MRP, Cost Price, Unit | P0 |
| INV-02 | Battery-specific fields: Voltage, Ah Rating, Polarity, Warranty Period (months), Warranty Type | P0 |
| INV-03 | Serial number tracking for batteries (one serial = one unit in inventory) | P0 |
| INV-04 | Barcode / QR code generation for custom items without manufacturer barcode | P1 |
| INV-05 | Multi-location stock: Shop Floor, Godown, In Transit | P1 |
| INV-06 | Low stock threshold per item, auto-alert when breached | P0 |
| INV-07 | Dead stock alert: items unsold > 90 days flagged | P1 |
| INV-08 | Vehicle compatibility matrix: map items to vehicle make/model/year | P1 |
| INV-09 | Bulk import via CSV | P1 |
| INV-10 | Stock adjustment (damage write-off, physical count correction) | P0 |
| INV-11 | Category management (Batteries, Wipers, Bulbs, Electrical, etc.) | P0 |

---

### 4.3 Customer Management

| ID | Requirement | Priority |
|----|-------------|----------|
| CUS-01 | Customer profile: Name, Phone, Address, GSTIN (optional), Type (Retail/Fleet/Mechanic) | P0 |
| CUS-02 | Vehicle registration number linked to customer (multiple vehicles per customer) | P0 |
| CUS-03 | Vehicle make/model/year stored per registration number | P1 |
| CUS-04 | Full purchase history per customer | P0 |
| CUS-05 | Outstanding balance visible on customer profile | P0 |
| CUS-06 | Customer search by: name, phone, vehicle number | P0 |
| CUS-07 | Fleet account designation with custom pricing tier | P1 |
| CUS-08 | Customer lifetime value summary (total spend, avg basket) | P2 |

---

### 4.4 Billing / POS Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| BILL-01 | New invoice creation in < 30 seconds for standard items | P0 |
| BILL-02 | Item search by: name, brand, barcode/QR scan, HSN code | P0 |
| BILL-03 | Customer search/select on invoice (or "walk-in" for non-registered) | P0 |
| BILL-04 | Quantity + discount (flat ₹ or %) per line item | P0 |
| BILL-05 | Auto GST calculation per line (CGST+SGST for intra-state, IGST for inter-state) | P0 |
| BILL-06 | Full keyboard navigation (F-key shortcuts for all primary actions) | P0 |
| BILL-07 | Core exchange / old battery return: deduct scrap value, log to Battery Graveyard | P0 |
| BILL-08 | Split payment: cash + UPI + credit in any combination | P0 |
| BILL-09 | Invoice → PDF → WhatsApp share in one click | P0 |
| BILL-10 | Invoice → thermal receipt print (ESC/POS, 80mm) | P0 |
| BILL-11 | Invoice → A4 GST tax invoice PDF | P0 |
| BILL-12 | Draft invoice save (incomplete bills saved automatically) | P0 |
| BILL-13 | Invoice numbering: Auto-sequential with prefix (e.g., JI/2025-26/001) | P0 |
| BILL-14 | Quote generation → convert to invoice with zero re-entry | P1 |
| BILL-15 | Return / credit note workflow | P1 |
| BILL-16 | Global search (Ctrl+K): customer, item, invoice, vehicle number | P0 |
| BILL-17 | Vehicle number input → auto-fill customer, show compatible items | P1 |
| BILL-18 | Smart bundle suggestion based on items in cart | P2 |

---

### 4.5 Battery Warranty Engine

| ID | Requirement | Priority |
|----|-------------|----------|
| WAR-01 | Warranty linked: Serial No → Invoice → Customer → Vehicle | P0 |
| WAR-02 | Configurable warranty tiers: Free Replacement + Pro-rata periods | P0 |
| WAR-03 | Pro-rata calculator: given serial no + today's date → exact claim amount | P0 |
| WAR-04 | Warranty claim workflow: lookup → verify → generate claim slip | P0 |
| WAR-05 | Warranty status dashboard: Active / Pro-rata / Expired / Claimed | P0 |
| WAR-06 | Bulk expiry alerts: 30-day, 7-day upcoming expirations | P1 |
| WAR-07 | Claim history per serial number | P0 |

---

### 4.6 Battery Graveyard Ledger

| ID | Requirement | Priority |
|----|-------------|----------|
| GRAVE-01 | Log every exchanged/returned battery: serial (if known), condition, weight estimate | P0 |
| GRAVE-02 | Condition tags: Dead / Damaged / Refurbishable / Good (resale) | P0 |
| GRAVE-03 | Scrap dealer ledger: settlement entries (date, kg sold, rate/kg, total) | P1 |
| GRAVE-04 | Aggregate pending scrap value (unsettled graveyard batteries) | P1 |

---

### 4.7 Khata / Udhaar Ledger

| ID | Requirement | Priority |
|----|-------------|----------|
| KHAT-01 | Per-customer credit balance tracking | P0 |
| KHAT-02 | Partial payment recording against outstanding invoices | P0 |
| KHAT-03 | Advance payment tracking | P0 |
| KHAT-04 | WhatsApp payment reminder with balance amount | P0 |
| KHAT-05 | Aging report: 0-30 / 30-60 / 60+ days buckets | P1 |
| KHAT-06 | Credit limit per customer (alert if exceeded) | P1 |
| KHAT-07 | Statement of account printable per customer | P1 |

---

### 4.8 Mechanic Commission System

| ID | Requirement | Priority |
|----|-------------|----------|
| MECH-01 | Mechanic/Ustad registration with name, phone, address | P0 |
| MECH-02 | Invoice tagging to a specific mechanic | P0 |
| MECH-03 | Commission rate: flat % or per-sale flat amount, per mechanic | P0 |
| MECH-04 | Auto-accumulating commission ledger per mechanic | P0 |
| MECH-05 | Commission settlement entry with printable slip | P0 |
| MECH-06 | Top mechanics leaderboard by revenue attributed | P1 |

---

### 4.9 Purchase & Supplier Management

| ID | Requirement | Priority |
|----|-------------|----------|
| PUR-01 | Supplier database with name, GSTIN, phone, payment terms | P0 |
| PUR-02 | Purchase entry (inward stock) with supplier invoice reference | P0 |
| PUR-03 | Purchase order generation → shareable via WhatsApp | P1 |
| PUR-04 | Supplier outstanding payables | P1 |
| PUR-05 | Price history per item across suppliers | P2 |

---

### 4.10 GST & Compliance

| ID | Requirement | Priority |
|----|-------------|----------|
| TAX-01 | HSN code and GST rate per product (5%, 12%, 18%, 28%) | P0 |
| TAX-02 | Auto CGST/SGST split for intra-J&K sales | P0 |
| TAX-03 | IGST for inter-state B2B sales | P0 |
| TAX-04 | GSTIN validation | P0 |
| TAX-05 | GSTR-1 export (JSON format, GST portal compatible) | P1 |
| TAX-06 | Monthly tax summary report (output tax, input tax, net payable) | P1 |
| TAX-07 | E-invoice / IRN architecture ready (not live in Phase 1) | P2 |

---

### 4.11 Analytics & Dashboard

| ID | Requirement | Priority |
|----|-------------|----------|
| DASH-01 | Morning dashboard: today's balance, pending dues, low stock, yesterday's P&L | P0 |
| DASH-02 | Real-time sales total for current day | P0 |
| DASH-03 | Gross sales / returns / net sales / gross margin | P1 |
| DASH-04 | Top 10 products by revenue and by quantity | P1 |
| DASH-05 | Top 10 customers by revenue | P1 |
| DASH-06 | Category-wise sales breakdown | P1 |
| DASH-07 | Mechanic ROI: revenue generated vs commission paid | P1 |
| DASH-08 | Seasonal demand chart (month-over-month with previous year comparison) | P2 |
| DASH-09 | Predictive restock alerts (ML-based) | P2 |

---

### 4.12 Petty Cash Register

| ID | Requirement | Priority |
|----|-------------|----------|
| CASH-01 | Daily expense entry with category and description | P1 |
| CASH-02 | Petty cash categories: Transport, Meals, Stationery, Maintenance, Other | P1 |
| CASH-03 | Opening cash balance entry | P1 |
| CASH-04 | True daily P&L: Sales cash received - petty expenses = net cash in hand | P1 |

---

### 4.13 Snap-to-Bill (AI Vision) — Phase 4

| ID | Requirement | Priority |
|----|-------------|----------|
| AI-01 | Upload photo of distributor invoice → AI extracts line items | P2 |
| AI-02 | Upload photo of handwritten mechanic chit → AI extracts items | P2 |
| AI-03 | Split-screen review: image left, editable draft right | P2 |
| AI-04 | Low-confidence fields highlighted in amber | P2 |
| AI-05 | AI data NEVER auto-saved — always requires human approval | P2 |

---

### 4.14 Offline-First & Sync

| ID | Requirement | Priority |
|----|-------------|----------|
| SYNC-01 | Full functionality without internet connection | P0 |
| SYNC-02 | Local SQLite database on device | P0 |
| SYNC-03 | Background sync to cloud PostgreSQL when connected | P1 |
| SYNC-04 | Visual sync status indicator (Synced / Offline / Pending X) | P1 |
| SYNC-05 | Conflict resolution: last-write-wins with conflict log | P1 |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| Performance | Invoice creation to print in < 3 seconds |
| Performance | Item search results in < 200ms |
| Performance | Dashboard load in < 2 seconds |
| Reliability | 99.5% uptime (cloud); 100% availability offline |
| Security | Passwords hashed (bcrypt), HTTPS only for cloud, no PII in logs |
| Backup | Automated daily backup to cloud storage |
| Compatibility | Chrome, Firefox, Edge (latest 2 versions); 1280×720 minimum screen |
| Accessibility | Keyboard navigable, high contrast mode |
| Localization | Indian number formatting (₹ with Indian comma system) |
| Data Retention | All invoice data retained minimum 7 years (GST compliance) |

---

## 6. Technology Stack

### Frontend
- React 18 + Vite
- Tailwind CSS + shadcn/ui
- Framer Motion (animations)
- TanStack Query (server state)
- React Hook Form + Zod (validation)
- Recharts (analytics charts)
- @react-pdf/renderer (PDF generation)
- qrcode.react (QR codes)

### Backend
- Node.js + Express.js
- Prisma ORM
- PostgreSQL (Neon, cloud) + SQLite (local-first)
- JWT authentication

### Infrastructure
- Frontend: Vercel or Cloudflare Pages
- Backend: Render.com
- Database: Neon (PostgreSQL)
- Storage: Cloudflare R2 (PDF archive, backup)
- AI: Claude API (Snap-to-Bill feature)

---

## 7. Invoice Layout Specification

### GST Tax Invoice (A4)
```
┌─────────────────────────────────────────────────┐
│  [SHOP LOGO]          TAX INVOICE                │
│  Janwari Industries                              │
│  Industrial Estate, Sopore, Baramulla, J&K       │
│  Ph: 7006083933 | GSTIN: [GSTIN]                 │
├──────────────────────┬──────────────────────────┤
│  Invoice No: JI/25-26/0001  Date: DD/MM/YYYY    │
├──────────────────────┬──────────────────────────┤
│  Bill To:            │  Vehicle No: [VEH NO]    │
│  [Customer Name]     │  Battery SN: [SERIAL]    │
│  Ph: [Phone]         │  Warranty: 24M + 24M PR  │
│  GSTIN: [if B2B]     │                          │
├──────┬──────────┬────┴──┬────────┬──────┬───────┤
│ S.No │ Item     │ HSN  │  Qty   │ Rate │ Amount│
├──────┼──────────┼───────┼────────┼──────┼───────┤
│  1   │ [item]   │ 8507 │   1    │ XXXX │  XXXX │
│  2   │ Exchange │  -   │   1    │ -XXX │  -XXX │ ← scrap deduction
├──────┴──────────┴───────┴────────┴──────┼───────┤
│                              Sub Total: │  XXXX │
│                              CGST 14%:  │  XXXX │
│                              SGST 14%:  │  XXXX │
│                              Total:     │  XXXX │
│                              Paid:      │  XXXX │
│                              Balance:   │  XXXX │
├──────────────────────────────────────────────────┤
│  [Warranty QR Code]  Terms & Conditions          │
│  Scan for warranty   Goods once sold not returned│
│  claim online        Subject to Sopore juridiction│
└──────────────────────────────────────────────────┘
```

### Thermal Receipt (80mm)
Condensed version with: shop name, invoice no, items, totals, payment mode, warranty serial number, QR code for warranty claim.

---

## 8. Database Schema (High Level)

```
Users → Roles
Customers → Vehicles
Suppliers
Products → Categories, HSN codes, SerialNumbers
Inventory → Locations (shop/godown)
VehicleCompatibility (product ↔ vehicle make/model/year)

Invoices → InvoiceItems → Products
         → Customer (nullable for walk-in)
         → Payments (multiple per invoice)
         → Mechanic (optional)

WarrantyClaims → SerialNumbers → InvoiceItems
BatteryGraveyard → Invoices (exchange)
ScrapSettlements → BatteryGraveyard items

KhataEntries → Customers → Invoices
MechanicCommissions → Mechanics → Invoices
MechanicSettlements → Mechanics

Purchases → Suppliers → PurchaseItems → Products
PettyCash

SyncLog (for offline-first conflict tracking)
```

---

## 9. Success Metrics (6 Months Post-Launch)

| Metric | Target |
|--------|--------|
| Average billing time per invoice | < 90 seconds |
| Warranty claims resolved without paper receipt | > 95% |
| Monthly GSTR-1 prep time saved | > 3 hours |
| Outstanding dues tracked (vs. paper khata) | 100% |
| Owner reports "software saves time daily" | Yes |
| Zero data loss incidents | 0 |

---

## 10. Out of Scope (Phase 1)

- Mobile app (Android/iOS native)
- Customer-facing portal
- WhatsApp Business API (wa.me deep links used instead)
- E-invoice IRP integration
- Multi-branch (second shop) support
- Salary/payroll management
- Online selling / eCommerce
