# AGENTS.md
## Janwari Industries Billing Software — Agent Instructions

This file governs how AI coding agents (Antigravity, Claude Code, or similar) must behave when working on this codebase.

---

## 🚨 Rule #1: NEVER Auto-Execute Commands

**You must never run terminal commands automatically.**

Whenever a task requires running a command (npm install, npx prisma migrate, etc.), you must:
1. Write the command in a labeled code block
2. Say: "Please run this in your terminal, then let me know when it's done."
3. Wait for user confirmation before generating the next file

Example of correct behavior:
```
Please run these commands in your terminal:

cd janwari-industries-billing-software
npm install

Let me know when done, and I'll generate the next files.
```

---

## 🏗️ Project Overview

**Product:** Billing + management system for auto accessories & battery retail shop  
**Client:** Janwari Industries, Sopore, J&K  
**Stack:** React 18 + Vite + TypeScript (frontend), Node.js + Express + Prisma + SQLite (backend)  
**Design Theme:** Industrial Precision — dark navy/slate, amber accent, IBM Plex Sans + Playfair Display + JetBrains Mono

---

## 📁 Directory Rules

| Path | Purpose | Rule |
|------|---------|------|
| `client/src/components/ui/` | shadcn/ui base components | Do not modify generated shadcn components |
| `client/src/components/billing/` | Invoice, cart, payment components | Core UX — test carefully |
| `client/src/components/battery/` | Warranty, graveyard components | Domain-specific, handle with precision |
| `client/src/pages/` | Route-level page components | One file per page/route |
| `client/src/stores/` | Zustand stores | Keep stores thin — logic in services |
| `server/src/routes/` | Express route handlers | No business logic here — delegate to services |
| `server/src/services/` | Business logic | This is where the real logic lives |
| `server/prisma/` | Database schema + migrations | Schema changes require migration + review |
| `shared/types/` | Shared TypeScript interfaces | Both client and server import from here |

---

## 🔒 Business Logic Rules (NEVER Break These)

### GST Calculation
- Batteries: HSN 8507, 28% GST
- Auto accessories: 18% default unless specified
- J&K intra-state → CGST 50% + SGST 50% of the GST rate
- Inter-state (customer from another state) → IGST = full GST rate
- Walk-in customers = intra-state (J&K)
- **Always calculate GST at the line item level, then sum — never apply GST to the total**

### Invoice Numbering
- Format: `JI/YYYY-YY/XXXX` (e.g., JI/2025-26/0001)
- Sequential, never skip or reuse
- Fiscal year: April 1 to March 31
- Stored in DB and incremented atomically

### Pro-Rata Warranty
- Free replacement period: up to `warrantyFreeMonths`
- Pro-rata period: `warrantyFreeMonths` to `warrantyFreeMonths + warrantyProRataMonths`
- After pro-rata period: expired, no claim
- Pro-rata amount = `originalMRP × (remainingProRataMonths / totalProRataMonths)`
- **Round all monetary values to 2 decimal places**

### Currency
- All monetary values stored as `Float` in SQLite (2 decimal precision)
- Display format: Indian Rupee format (₹1,00,000.00)
- Use `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`

### Dates
- Store all dates as UTC in the database
- Display in DD/MM/YYYY format in the UI
- Fiscal year: April 1 start

### Data Safety
- Invoice data once FINALIZED cannot be deleted — only cancelled (status = CANCELLED)
- Battery serial numbers once SOLD cannot be re-added to stock (only marked EXCHANGED)
- Khata entries are immutable once created (add correction entries instead)

---

## 🎨 Design System

### Color Variables (Tailwind classes → CSS variables)
```css
bg-[#0F1117]     → Deep background
bg-[#161B27]     → Card/surface
border-[#1E2A3B] → Subtle border
text-amber-400   → Primary amber accent (#F59E0B)
text-emerald-500 → Success (#10B981)
text-red-500     → Error/alert (#EF4444)
text-slate-100   → Primary text
text-slate-400   → Secondary text
```

### Typography Classes
```css
font-['Playfair_Display']  → Page titles, section headers
font-['IBM_Plex_Sans']     → All UI text, labels, body
font-['JetBrains_Mono']    → Serial numbers, invoice numbers, amounts
```

### Component Patterns
- Cards: `bg-[#161B27] border border-[#1E2A3B] rounded-lg`
- Amber buttons: `bg-amber-500 hover:bg-amber-400 text-black font-semibold`
- Ghost buttons: `border border-[#1E2A3B] hover:border-amber-500/50 text-slate-300`
- Input fields: `bg-[#0F1117] border border-[#1E2A3B] focus:border-amber-500 text-slate-100`
- Status: PAID `text-emerald-400 bg-emerald-500/10`, PENDING `text-amber-400 bg-amber-500/10`, OVERDUE `text-red-400 bg-red-500/10`

### Animation Standards
- Page transitions: Framer Motion `initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}`
- List items: staggered fade-in with `transition={{ delay: index * 0.05 }}`
- Modal: scale + fade `initial={{ opacity: 0, scale: 0.95 }}`
- Hover states: 150ms ease transitions

---

## ⌨️ Keyboard Shortcut Map

| Shortcut | Action |
|---------|--------|
| `F2` | New invoice |
| `F3` | Search customer |
| `F4` | Add item to cart |
| `F5` | Add exchange/return item |
| `F6` | Apply discount |
| `F7` | Payment screen |
| `F8` | Finalize & print |
| `Ctrl+K` | Global search palette |
| `Escape` | Cancel / close modal / go back |
| `Enter` | Confirm selection in dropdowns |
| `Tab` | Move to next field |

Implement keyboard shortcuts using a global event listener in `client/src/lib/shortcuts.ts`. Register shortcuts in the billing page component with `useEffect`.

---

## 🧪 Testing Standards

Before marking any module complete:
1. Test the happy path (normal use case works)
2. Test empty state (no data — does the UI degrade gracefully?)
3. Test error state (API fails — does a toast appear? Does it not crash?)
4. Test edge cases specific to the feature:
   - Billing: What if the same serial number is added twice?
   - Warranty: What if claimDate is before purchaseDate?
   - GST: What if gstRate is 0? What if the customer has no state code?

---

## 📦 Package Management

- Package manager: **npm only** (not yarn, not pnpm)
- Node version: 18+ (LTS)
- Never use `--legacy-peer-deps` unless absolutely necessary (and if you must, explain why)
- Pin major versions in package.json (e.g., `"react": "^18.0.0"`)
- Separate `devDependencies` properly

---

## 🔐 Security Rules

- Passwords: always hash with `bcryptjs` (salt rounds: 12)
- JWT: expire in 8 hours, store in httpOnly cookie or memory (not localStorage)
- All API routes (except `/auth/login`) require JWT middleware
- Admin-only routes: check `req.user.role === 'ADMIN'`
- Never expose `costPrice` to CASHIER role users
- Input validation: all routes use Zod schemas before DB access
- Never return raw Prisma errors to the client

---

## 🔄 API Response Format

All API endpoints must return:
```typescript
// Success
{ success: true, data: T, message?: string }

// Paginated success
{ success: true, data: T[], total: number, page: number, limit: number }

// Error
{ success: false, error: string, code?: string }
```

HTTP status codes:
- 200: OK
- 201: Created
- 400: Bad request (validation error)
- 401: Unauthorized
- 403: Forbidden (wrong role)
- 404: Not found
- 500: Server error

---

## 📋 Module Completion Checklist

When marking any module "done", verify:

- [ ] Backend route exists with proper auth middleware
- [ ] Zod validation on all inputs
- [ ] Service layer has the business logic (not in route)
- [ ] Prisma query is correct (check with Prisma Studio if unsure)
- [ ] Frontend component renders correctly with real data
- [ ] Loading state shown while fetching
- [ ] Error state handled with toast
- [ ] Empty state UI for empty lists/data
- [ ] Responsive to minimum 1280px width
- [ ] Keyboard accessible
- [ ] Follows design system colors and typography

---

## 🚦 Phase Status Tracking

Update this section as phases complete:

| Phase | Status | Notes |
|-------|--------|-------|
| Phase 1: Foundation | ✅ Complete | Fully featured |
| Phase 2: Core Billing | ✅ Complete | Quotes & Categories done |
| Phase 3: Battery Intelligence | ✅ Complete | Graveyard implemented |
| Phase 4: Financial Layer | ✅ Complete | Khata & Purchases built |
| Phase 5: Analytics & AI | ✅ Complete | GSTR & Analytics built |
| Phase 6: Battery Exchange Flow | ✅ Complete | Buyback logic integrated into cart |
| Phase 7: Warranty Claim Management | ✅ Complete | Free Replacement & Pro-Rata tracking |
| Phase 8: Financial Maturity & BI | ✅ Complete | Day Book, Commission Ledger |
| Phase 9: Security & AI Operations | ✅ Complete | RBAC, Audit, AI Snap-to-Bill, Alerts |
| Phase 10: Launch Readiness | ✅ Complete | Thermal Print, DB Auto-Backup, Electron App |
| Phase 11: Responsive UI Polish | ✅ Complete | Mobile-first drawer, stacked grids, scrolling tables |

Status symbols: 🔲 Not Started | 🔄 In Progress | ✅ Complete | ⚠️ Blocked

---

## 💡 When You're Unsure

If any requirement is ambiguous, say:
> "I want to clarify this before coding: [specific question]. Which approach should I take?"

If a module is complex, say:
> "This is a complex module. Here's my plan: [outline]. Shall I proceed?"

Never guess on business logic (especially GST, warranty math, invoice numbering). Always ask.

---

## 📞 Client Reference

**Janwari Industries**  
Industrial Estate, Sopore, Baramulla, J&K — 193201  
Phone: 7006083933  
State Code: 01 (J&K)
