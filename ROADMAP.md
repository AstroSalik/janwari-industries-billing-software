# 🗺️ PROJECT ROADMAP
## Janwari Industries Billing Software
**Version:** 1.0 | **Last Updated:** March 2026

---

## Vision Statement

Build the billing software that becomes Janwari Industries' single source of truth — replacing every notebook, every separate ledger, every manual GST calculation — with a fast, beautiful, battery-aware system that the owner opens every morning like a dashboard to his business.

---

## Timeline Overview

```
Week 1-2  ████████░░░░░░░░░░░░  Phase 1: Foundation
Week 3-4  ░░░░████████░░░░░░░░  Phase 2: Core Billing
Week 5-6  ░░░░░░░░████████░░░░  Phase 3: Battery Intelligence
Week 7-8  ░░░░░░░░░░░░████████  Phase 4: Financial Layer
Week 9-10 ░░░░░░░░░░░░░░░░████  Phase 5: Analytics & AI Polish
```

---

## Phase 1: Foundation
**Duration:** Week 1–2  
**Goal:** Running skeleton with auth, navigation, database connected

### Milestones

#### 1.1 Project Scaffold ⬜
- [ ] Monorepo setup (`/client` + `/server` + `/shared`)
- [ ] React 18 + Vite + TypeScript configured
- [ ] Tailwind CSS + shadcn/ui installed
- [ ] Express.js server with TypeScript
- [ ] Prisma + SQLite local database
- [ ] Environment variables setup
- [ ] Google Fonts loaded (Playfair Display, IBM Plex Sans, JetBrains Mono)
- [ ] Design system CSS variables in tailwind.config.ts
- [ ] Git initialized with .gitignore

#### 1.2 Authentication ⬜
- [ ] User model seeded (admin + cashier)
- [ ] Login API (POST /auth/login → JWT)
- [ ] JWT middleware for protected routes
- [ ] Login page UI (dark industrial design, amber accents)
- [ ] Auth store (Zustand) with role-based flag
- [ ] Protected route wrapper component
- [ ] Session persistence (token in localStorage with expiry)

#### 1.3 App Shell ⬜
- [ ] Sidebar with navigation (icons + labels)
- [ ] Active route highlighting
- [ ] Top bar (current invoice indicator, user, logout)
- [ ] Page wrapper with Framer Motion page transitions
- [ ] Toast notification system (react-hot-toast)
- [ ] Global Ctrl+K search palette (empty state for now)
- [ ] Keyboard shortcut handler setup
- [ ] Responsive minimum 1280px

#### 1.4 Database Seed ⬜
- [ ] Admin user created
- [ ] Categories (7 default)
- [ ] Locations (Shop Floor, Godown)
- [ ] 5 sample products
- [ ] 3 sample customers
- [ ] 2 sample mechanics

**Phase 1 Exit Criteria:**
- Can log in as admin and cashier
- Sidebar navigation works between pages (all empty/placeholder)
- Database connected and seeded
- Design system visually correct

---

## Phase 2: Core Billing
**Duration:** Week 3–4  
**Goal:** Complete invoice creation → finalization → print/share flow

### Milestones

#### 2.1 Inventory Module ⬜
- [ ] Product listing page with search + filter
- [ ] Add/edit product form (with battery-specific fields conditional)
- [ ] Category management
- [ ] Stock view per location
- [ ] Low stock alert widgets
- [ ] Barcode/QR label print

#### 2.2 Customer Module ⬜
- [ ] Customer listing with search (name/phone/vehicle)
- [ ] Add/edit customer form
- [ ] Vehicle registration linkage
- [ ] Customer detail view (purchase history preview)
- [ ] Walk-in customer handling

#### 2.3 Billing Cart Engine ⬜
- [ ] Zustand cart store (items, customer, mechanics, payment)
- [ ] GST calculation service (line-level, handle all slabs)
- [ ] Invoice number generator (fiscal year aware)
- [ ] Draft auto-save (every 30 seconds)

#### 2.4 New Invoice Page ⬜
- [ ] Split-panel layout (60/40)
- [ ] Item search dropdown (debounced, shows stock qty)
- [ ] Cart item row (qty, discount, line total, serial number input for batteries)
- [ ] Core exchange "Add Exchange" button (opens scrap entry modal)
- [ ] Customer selector with vehicle number input
- [ ] Mechanic tagging (optional)
- [ ] All F-key shortcuts wired
- [ ] Global Ctrl+K search

#### 2.5 Totals & Payment ⬜
- [ ] Live totals panel (subtotal, GST breakdown, grand total)
- [ ] Split payment input (Cash + UPI + Credit)
- [ ] Balance calculation (grand total - paid)
- [ ] Payment mode validation

#### 2.6 Invoice Finalization ⬜
- [ ] Finalize API (validates, saves, updates stock)
- [ ] Prisma transaction (invoice + items + serial updates + stock + payment all atomic)
- [ ] Invoice detail view page
- [ ] PDF generation (A4 GST invoice, @react-pdf/renderer)
- [ ] Thermal print (browser print with 80mm CSS media query)
- [ ] WhatsApp share button (wa.me link with invoice summary)
- [ ] Invoice list page with filters (date, status, customer)

#### 2.7 Quote Workflow ⬜
- [ ] Quote creation (same as invoice but type=QUOTE)
- [ ] Quote → Invoice conversion (one click, no re-entry)
- [ ] Quote expiry display

**Phase 2 Exit Criteria:**
- Full billing cycle works end-to-end
- PDF generates correctly (tested with thermal printer)
- GST math verified on paper against multiple test cases
- Counter staff can complete a bill in < 90 seconds

---

## Phase 3: Battery Intelligence
**Duration:** Week 5–6  
**Goal:** Complete battery lifecycle tracking — from serial number to warranty claim to scrap

### Milestones

#### 3.1 Serial Number System ⬜
- [ ] Serial number intake form (add serials on purchase)
- [ ] Serial number pool per product (available serials)
- [ ] Serial auto-assignment on invoice (or manual select)
- [ ] Duplicate serial protection
- [ ] Serial number search page

#### 3.2 Warranty Engine ⬜
- [ ] Warranty config per battery product (free months + pro-rata months)
- [ ] Warranty lookup: type serial → see full status
- [ ] Pro-rata calculator (service + UI display)
- [ ] Warranty claim creation workflow
- [ ] Claim slip PDF generation
- [ ] Warranty dashboard (Active / Pro-rata / Expiring / Expired)
- [ ] Expiry alerts (7-day and 30-day)

#### 3.3 Battery Graveyard ⬜
- [ ] Auto-entry when "Add Exchange" is used in billing
- [ ] Manual graveyard entry (for batteries brought in outside billing)
- [ ] Condition tagging UI
- [ ] Graveyard list view with totals
- [ ] Scrap settlement entry (dealer name, kg, rate)
- [ ] Pending scrap value calculation

**Phase 3 Exit Criteria:**
- Any battery can be looked up by serial number in < 3 seconds
- Warranty claim produces accurate pro-rata amount
- Exchange batteries auto-populate graveyard

---

## Phase 4: Financial Layer
**Duration:** Week 7–8  
**Goal:** Complete financial picture — credit, commissions, taxes, expenses

### Milestones

#### 4.1 Khata / Udhaar System ⬜
- [ ] Credit sale flow (balance added to khata on invoice finalize)
- [ ] Khata entry list per customer (debits, credits, balance)
- [ ] Partial payment recording
- [ ] Advance payment recording
- [ ] Customer statement PDF
- [ ] Aging report (0-30 / 30-60 / 60+ days)
- [ ] WhatsApp payment reminder (wa.me link with balance)
- [ ] Credit limit enforcement

#### 4.2 Mechanic Commission System ⬜
- [ ] Mechanic CRUD
- [ ] Invoice-mechanic tagging (billing screen already has this)
- [ ] Commission auto-calculation on finalize
- [ ] Commission ledger per mechanic
- [ ] Settlement entry + printable slip
- [ ] Top mechanics leaderboard

#### 4.3 GST & Compliance ⬜
- [ ] Monthly GSTR-1 data summary UI
- [ ] GSTR-1 JSON export (B2B + B2C separated)
- [ ] Monthly tax liability report (output - input = payable)
- [ ] HSN-wise sales summary

#### 4.4 Petty Cash Register ⬜
- [ ] Daily expense entry form
- [ ] Category breakdown chart
- [ ] Daily P&L with petty cash deducted

#### 4.5 Purchase & Supplier Management ⬜
- [ ] Supplier CRUD
- [ ] Purchase entry (inward stock)
- [ ] Purchase invoice reference
- [ ] Stock auto-update on purchase confirmation
- [ ] Supplier outstanding payables
- [ ] Purchase order generation + WhatsApp share

**Phase 4 Exit Criteria:**
- Owner can see every rupee owed to him (khata) and owed by him (suppliers)
- Mechanic commission settled accurately for a test month
- GSTR-1 export opens correctly in GST portal (test with sample data)

---

## Phase 5: Analytics & AI Polish
**Duration:** Week 9–10  
**Goal:** Intelligence layer, UI polish, performance, Snap-to-Bill

### Milestones

#### 5.1 Analytics Dashboard ⬜
- [ ] Morning dashboard (full design with all widgets)
- [ ] Real-time sales ticker (today's revenue)
- [ ] 30-day sales trend chart (Recharts)
- [ ] Category-wise pie chart
- [ ] Top 10 products by revenue (bar chart)
- [ ] Top 10 customers table
- [ ] Month-over-month comparison (current vs same period last year)

#### 5.2 Business Reports ⬜
- [ ] P&L report (date-range filterable)
- [ ] Dead stock report (90+ days unsold)
- [ ] Mechanic ROI report
- [ ] Seasonal demand chart (battery-specific, month-by-month)

#### 5.3 Snap-to-Bill (AI Vision) ⬜
- [ ] Image upload component (drag & drop + camera capture)
- [ ] Claude API integration (vision → structured JSON)
- [ ] Split-screen review UI (image left, editable draft right)
- [ ] Confidence highlighting (amber = uncertain field)
- [ ] Approve → create purchase/invoice with one click
- [ ] Reject → clear and try again

#### 5.4 Smart Suggestions ⬜
- [ ] Predictive restock alerts (sales velocity analysis)
- [ ] Smart bundle suggestions on billing (co-purchase analysis)
- [ ] Dead stock markdown suggestions

#### 5.5 Final Polish ⬜
- [ ] Offline indicator + sync status
- [ ] Background cloud sync (SQLite → PostgreSQL)
- [ ] Performance audit (Lighthouse)
- [ ] Print stylesheet refinement
- [ ] Mobile-responsive (owner viewing on phone)
- [ ] Data export (full CSV backup)
- [ ] One-click database backup to file

**Phase 5 Exit Criteria:**
- Morning dashboard tells the owner everything he needs to know in 30 seconds
- Snap-to-Bill correctly reads 80%+ of distributor invoice items
- App loads in < 2 seconds on local machine

---

## Technical Debt & Risk Register

| Risk | Likelihood | Impact | Mitigation |
|------|------------|--------|------------|
| Antigravity gets stuck on npm commands | High | Medium | AGENTS.md rule: always show commands, never auto-run |
| GST calculation errors | Medium | High | Unit test the GST service with 20+ cases before integration |
| Serial number race conditions (two invoices grab same serial) | Low | High | Prisma transaction + unique constraint |
| SQLite vs PostgreSQL schema drift | Medium | Medium | Prisma handles both; test migrations carefully |
| PDF generation memory leak | Medium | Low | Stream PDFs, don't buffer large files |
| Owner doesn't like the design | Medium | High | Show UI mockup before full build |

---

## Post-Launch Roadmap (Phase 6+)

| Feature | Timeline | Priority |
|---------|---------|----------|
| Electron desktop packaging | Month 3 | High |
| WhatsApp Business API (vs wa.me links) | Month 4 | Medium |
| Customer portal (view own invoices) | Month 5 | Medium |
| Multi-branch support (second shop) | Month 6 | Low |
| E-Invoice / IRN generation | Month 6 | Medium |
| Kashmir Winter Surge ML predictor | Month 7 | Medium |
| Android PWA with camera for Snap-to-Bill | Month 8 | Low |
| Vehicle number plate OCR (camera scan) | Month 9 | Low |

---

## Definition of Done

A feature is "Done" when:
1. ✅ Backend API works and is tested
2. ✅ Frontend UI renders correctly with real data
3. ✅ Loading / error / empty states all handled
4. ✅ Follows design system (colors, fonts, spacing)
5. ✅ Keyboard accessible
6. ✅ At least one happy-path test confirmed working end-to-end
7. ✅ No TypeScript errors (`tsc --noEmit` passes)
8. ✅ Checked against PRD requirement IDs

---

## Team

| Role | Name |
|------|------|
| Product Owner | Salik Riyaz (Zoonigia) |
| Lead Developer | Antigravity (AI-assisted) |
| Reviewer | Salik Riyaz |
| Client | Janwari Industries |

---

*"Build it like it's yours. Polish it like you'll use it every day."*
