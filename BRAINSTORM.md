# 🧠 BRAINSTORM — Janwari Industries Billing Software
**Date:** March 2026  
**Client:** Janwari Industries, Industrial Estate Sopore, District Baramulla, J&K — 193201  
**Phone:** 7006083933  
**Business Type:** Auto Accessories & Battery Shop  

---

## The Problem We're Solving

Generic billing software (Tally, Vyapar, Busy) frustrates auto parts shop owners because:
- They don't understand battery serial number tracking
- They can't handle warranty claims without the original bill
- They have no concept of "core exchange" (old battery return discount)
- GST slab differences between accessories and batteries aren't auto-handled
- Mechanic referral commissions are tracked in a separate notebook
- No concept of vehicle-linked purchase history
- Thermal printer support is clunky
- WhatsApp invoicing requires manual steps

Janwari Industries needs software that feels like it was *built for them specifically.*

---

## Feature Universe

### 🔋 TIER 1: BATTERY-SPECIFIC (The Core Differentiators)

#### 1. Serial Number Lifecycle Tracking
- Every battery sold is linked to: Serial No → Invoice No → Customer → Vehicle Reg No → Date
- One scan/type = full history
- Even if the customer loses their bill, the shop can pull it up in 3 seconds

#### 2. Warranty Engine
- Configurable warranty tiers per brand/SKU: e.g., "24M + 24M pro-rata"
- **Pro-rata Calculator**: Given today's date + purchase date, auto-calculates exact discount owed (e.g., "18 months used out of 24 = 75% of remaining value")
- One-click warranty claim slip print
- Warranty status dashboard: Active / Pro-rata Zone / Expired / Claimed
- Bulk warranty expiry alerts (30 days, 7 days, today)

#### 3. Core Exchange / Old Battery Return System
- Dedicated "Add Exchange" button on billing screen
- Enter old battery serial no. (if available) or just mark as "generic scrap"
- System auto-deducts scrap value from invoice total
- Old battery moves into **Battery Graveyard Ledger** (see below)
- Scrap weight estimate recorded for scrap dealer settlement

#### 4. Battery Graveyard Ledger
- All exchanged/returned batteries tracked separately
- Condition tagging: Dead / Damaged / Refurbishable / Good (resale)
- Aggregate scrap weight, estimated value
- Scrap dealer settlement ledger: when was it sold, how many kg, at what rate
- This turns "scrap" into a revenue stream the owner can actually see

#### 5. Fleet Account Module
- Tag customers as "Fleet Account" (transport companies, cab operators, ambulances, govt vehicles)
- Custom fleet pricing tiers per account
- Consolidated monthly invoice generation (all purchases in one bill)
- Single challan / delivery note
- Fleet battery replacement schedule tracker

#### 6. Kashmir Winter Surge Intelligence
- ML-powered seasonal demand predictor
- Input: 3 years of sales history + avg temperature data
- Output: "Based on last 3 years, truck battery demand peaks in Week 2 of November. You currently have 12 units. Recommended stock: 35 units."
- Push alert to owner's phone in October

---

### 🖥️ TIER 2: COUNTER & POS EXPERIENCE (Speed = Money)

#### 7. Keyboard-First Billing Flow
Complete billing without touching a mouse:
- `F2` = New Invoice
- `F3` = Search Customer
- `F4` = Add Item (opens searchable dropdown)
- `F5` = Add Exchange/Return Item
- `F6` = Apply Discount
- `F7` = Select Payment Mode
- `F8` = Finalize & Print
- `Ctrl+K` = Global search (anything: customer, item, vehicle, invoice)
- `Esc` = Cancel / Go Back

#### 8. Vehicle Number → Auto-Fill Magic
- Type vehicle registration number (e.g., JK02AB1234)
- System pulls: Customer name, phone, previous purchases, vehicle make/model
- Suggests compatible items from inventory based on vehicle model
- "Last time this car was in: 14 months ago — Amaron 100Ah. Due for check-up."

#### 9. Thermal Printer Native Support
- ESC/POS protocol (works with any 80mm USB/BT thermal printer)
- One keystroke print — no driver dialog, no "select printer" every time
- Custom receipt template with shop logo, GSTIN, warranty QR code
- A4 GST invoice print option (PDF)

#### 10. Quick Quote → Invoice Conversion
- Generate quote in under 10 seconds
- One-click WhatsApp share (formatted PDF)
- Customer says yes → convert to invoice with zero re-entry
- Quote expiry (valid for 24/48 hours)

#### 11. Split Payment Support
- Single invoice settled via: Cash + UPI + Credit (any combination)
- e.g., ₹8,000 battery: ₹3,000 cash + ₹3,000 UPI + ₹2,000 udhaar
- Each payment leg recorded separately

#### 12. Offline-First Architecture
- App works 100% without internet (local SQLite database)
- Background sync to cloud when connection restores
- Clear indicator: "Synced / Offline / Pending X items"
- Counter never stops, even when BSNL is having a bad day

---

### 💰 TIER 3: FINANCIAL & COMPLIANCE ENGINE

#### 13. Automated GST & HSN Handling
- Batteries: HSN 8507, GST 28%
- Auto Parts/Accessories: Multiple slabs (5%, 12%, 18%, 28%)
- Customer state code auto-detects CGST+SGST vs IGST
- GSTIN validation via regex + optional API check
- Reverse charge mechanism flag

#### 14. Khata / Udhaar Ledger
- Per-customer outstanding balance
- Partial payment recording
- Advance payment tracking (customer pays ₹5,000 in advance for a battery order)
- Auto WhatsApp reminder: "Dear [Name], your balance of ₹[X] is due since [Date]. Please settle at your earliest convenience. — Janwari Industries"
- Aging report: 0-30 days / 30-60 days / 60+ days outstanding

#### 15. Mechanic / "Ustad" Commission System
- Tag any invoice to a specific mechanic
- Commission rate per mechanic (fixed % or flat per sale)
- Auto-accumulating commission ledger
- Weekly/monthly settlement slip printable
- Top mechanics leaderboard (motivates referrals)

#### 16. GSTR-1 Ready Export
- Monthly one-click export in GST JSON format
- B2B invoices (with customer GSTIN) auto-separated
- B2C invoices (without GSTIN) auto-grouped
- Compatible with GSTN portal direct upload and Tally import
- Saves accountant 3-4 hours every month

#### 17. E-Invoice / IRN Generation (Future-Ready)
- Architecture ready for IRP API integration when turnover crosses threshold
- QR code embed on invoice
- IRN number stored against each invoice

#### 18. Petty Cash Register
- Daily small expenses: chai, courier, cleaning, rickshaw
- Separate from main ledger
- Owner sees true daily P&L (Sales - COGS - Petty Cash - Salaries = Net)

#### 19. EMI / Installment Tracker
- Expensive batteries sold on installment
- e.g., ₹12,000 battery → ₹4,000 × 3 months
- Due date alerts per installment
- Payment receipt per installment with balance shown

#### 20. Purchase / Stock Inwarding
- Log purchases from distributors
- Link to supplier ledger (accounts payable)
- Verify received qty vs. billed qty
- Auto-update inventory on inward confirmation

---

### 📦 TIER 4: INVENTORY INTELLIGENCE

#### 21. Multi-Location Stock Tracking
- "Shop Floor" vs "Godown" vs "Vehicle" (for delivery stock)
- Transfer requests between locations
- Billing always shows: "Item available in Godown, not on shop floor"

#### 22. Vehicle Compatibility Matrix
- Type "Maruti Swift 2019" → see all compatible batteries, wipers, bulbs in stock
- Manually curated or CSV-imported compatibility data
- Flag out-of-stock compatible items with ETA if on order

#### 23. Barcode / QR Generation for Custom Items
- Loose items, cut wiring, custom brackets — no standard barcode
- One-click: generate QR sticker → print on label printer
- Scan at counter = instant item + price pull

#### 24. Dead Stock Intelligence
- Items unsold for 60 / 90 / 120+ days flagged
- Suggested markdown percentage to move them
- "Clearance bin" view for counter staff

#### 25. Supplier Management
- Supplier database with contact, GSTIN, payment terms
- Purchase order generation (send via WhatsApp/email)
- Outstanding payables per supplier
- Best price history per item across suppliers

---

### 📊 TIER 5: ANALYTICS & OWNER INTELLIGENCE

#### 26. Morning Dashboard
- Opens every morning: Today's opening balance, pending udhaars, low stock alerts, yesterday's sales + profit
- "3 customers' warranties expire this week" 
- Weather-aware: "Cold snap expected Friday — check truck battery stock"

#### 27. Real-Time P&L
- Gross Sales / Returns / Net Sales
- Cost of Goods (from purchase entries)
- Gross Profit + Gross Margin %
- Filterable by: Today / Week / Month / Custom Range / By Brand / By Category

#### 28. Top Products & Dead Stock Reports
- Best-selling items by revenue, by quantity, by margin
- Slowest-moving items with days-since-last-sale

#### 29. Customer Lifetime Value
- Total spent, total purchases, avg basket size per customer
- "Your top 10 customers account for X% of revenue"

#### 30. Mechanic ROI Report
- Which mechanic sends the most business?
- Revenue attributed per mechanic vs commission paid = ROI

---

### 🤖 TIER 6: AI & MAGIC FEATURES

#### 31. Snap-to-Bill (AI Vision)
Two modes:
1. **Purchase Invoice Snap**: Photograph distributor bill → AI extracts items, qty, rate, GST → draft inward entry → human review → approve
2. **Mechanic Chit Snap**: WhatsApp photo of handwritten parts list → AI reads it → draft sales estimate → send back to mechanic for confirmation

UX Flow:
- Image → Split screen (photo left, editable draft right)
- Yellow highlight on low-confidence fields
- Approve & Save (never auto-commit AI data)

#### 32. Smart Bundle Suggestions
- Based on historical co-purchase data
- "Customers who bought this fog light set also bought Relay + Wiring Harness"
- One-click add to cart

#### 33. Predictive Restock Alerts
- Learning from sales velocity + lead time from suppliers
- "At current sales rate, you'll run out of Amaron 65Ah in 8 days. Last order took 5 days."
- One-click purchase order generation from alert

---

### 📱 TIER 7: COMMUNICATION & ENGAGEMENT

#### 34. WhatsApp Integration (Business API or wa.me links)
- Invoice PDF → WhatsApp in one click
- Payment reminders → WhatsApp
- Warranty expiry alerts → WhatsApp to customer
- Daily sales summary → WhatsApp to owner's personal number at 8 PM

#### 35. Customer Portal (Phase 2)
- Customer accesses their own purchase history via phone + OTP
- View warranties, outstanding balance, invoices
- No calls needed for "what battery did I buy last time?"

---

## Tech Stack Recommendation

### Frontend
- **React 18** + **Vite** (fast, modern)
- **Tailwind CSS** + **shadcn/ui** components
- **Framer Motion** for UI animations
- **React Query (TanStack)** for server state

### Backend
- **Node.js** + **Express.js** (or Fastify for speed)
- **Prisma ORM** for type-safe DB access
- **better-sqlite3** for offline-first local database
- **PostgreSQL (Neon)** for cloud sync

### Key Libraries
- `react-hot-toast` for notifications
- `react-hook-form` + `zod` for form validation
- `recharts` for analytics charts
- `@react-pdf/renderer` for PDF generation
- `qrcode.react` for QR generation
- `escpos` for thermal printer

### Infrastructure
- **Electron** wrapper for desktop app (Phase 2)
- **Cloudflare R2** for image/backup storage
- **Resend** for email
- **Twilio** or **WhatsApp Business API** for messaging

---

## Design Philosophy: "Industrial Precision"

**Aesthetic Direction**: Dark industrial command center meets premium Indian business ledger.

**Palette:**
- Background: `#0F1117` (deep space black)
- Surface: `#161B27` (dark navy card)
- Border: `#1E2A3B` (subtle steel)
- Primary Accent: `#F59E0B` (warm amber — like instrument warning lights)
- Success: `#10B981` (green)
- Danger: `#EF4444` (red alert)
- Text Primary: `#F8FAFC` (near white)
- Text Secondary: `#94A3B8` (steel grey)

**Typography:**
- Display/Headers: `DM Serif Display` or `Playfair Display` — gravitas, Indian ledger feel
- UI Labels: `IBM Plex Sans` — technical precision
- Numbers/Serial Codes: `JetBrains Mono` or `IBM Plex Mono` — critical for battery serial numbers

**UI Motifs:**
- Amber glowing borders on active states
- Subtle scanline texture on dashboard header
- Battery charge indicator for warranty % remaining (visual)
- Gauge-style metrics on morning dashboard
- Status pills: not generic badges but precision indicators

---

## Phased Build Plan

### Phase 1 — Core Billing (Week 1-2)
Inventory setup, customer management, basic invoicing, GST handling, thermal print, WhatsApp share

### Phase 2 — Battery Intelligence (Week 3-4)
Serial number tracking, warranty engine, core exchange, battery graveyard, warranty claims

### Phase 3 — Financial Layer (Week 5-6)
Khata/Udhaar, mechanic commissions, GSTR-1 export, petty cash, installment tracker

### Phase 4 — Analytics + AI (Week 7-8)
Morning dashboard, P&L reports, Snap-to-Bill AI, predictive restocking, smart bundles

### Phase 5 — Polish & Electron (Week 9-10)
Offline sync, Electron desktop wrapper, customer portal, WhatsApp API, performance tuning
