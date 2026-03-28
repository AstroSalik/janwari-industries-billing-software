# 🎨 UI/UX DESIGN SPECIFICATION
## Janwari Industries Billing Software — Industrial Precision Theme

---

## Design Philosophy

This software will be used 8+ hours a day by someone who cares about his business. It must feel like a precision instrument — not a form. Every pixel should communicate competence. The design borrows from:

- **Aircraft instrument panels** — dense data, perfectly legible, amber on dark
- **Premium Indian business aesthetics** — gravitas, serif typography for amounts
- **Modern SaaS dashboards** — clean structure, purposeful whitespace
- **Terminal/IDE tools** — monospace for codes, keyboard-first

The result: something that looks like it cost lakhs to build, but runs on their ₹20,000 laptop.

---

## Color System

### Base Palette
```
Background:     #0F1117   →  Deep space. The canvas.
Surface:        #161B27   →  Cards, panels. Slightly lifted.
Surface Alt:    #1A2233   →  Hover surfaces, nested panels
Border:         #1E2A3B   →  Subtle structure
Border Active:  #2A3A50   →  Hover + focus borders
```

### Accent Colors
```
Amber (Primary): #F59E0B   →  CTAs, active states, highlights
Amber Dark:      #D97706   →  Hover on amber buttons
Amber Glow:      rgba(245,158,11,0.12)  →  Ambient glow backgrounds
Amber Border:    rgba(245,158,11,0.3)   →  Subtle amber borders

Green (Success): #10B981   →  Paid, in stock, active, synced
Green Bg:        rgba(16,185,129,0.1)

Red (Alert):     #EF4444   →  Overdue, out of stock, error
Red Bg:          rgba(239,68,68,0.1)

Blue (Info):     #3B82F6   →  Links, info states
Blue Bg:         rgba(59,130,246,0.1)
```

### Text Hierarchy
```
Primary:    #F8FAFC   →  Main content, headings
Secondary:  #94A3B8   →  Labels, subtext, metadata
Dim:        #4B5563   →  Disabled, placeholder
Amber:      #F59E0B   →  Active values, highlighted numbers
```

---

## Typography System

### Font Stack
```html
<!-- In index.html head -->
<link href="https://fonts.googleapis.com/css2?
  family=Playfair+Display:wght@400;600;700&
  family=IBM+Plex+Sans:wght@300;400;500;600&
  family=JetBrains+Mono:wght@400;500;600&
  display=swap" rel="stylesheet">
```

### Usage Rules

| Font | Use Case | Class |
|------|----------|-------|
| `Playfair Display` | Page titles, section headers, invoice "TAX INVOICE" label | `font-['Playfair_Display']` |
| `IBM Plex Sans` | All body text, labels, buttons, navigation, forms | `font-['IBM_Plex_Sans']` |
| `JetBrains Mono` | Serial numbers, invoice numbers, amounts (₹), dates, GST codes | `font-['JetBrains_Mono']` |

### Size Scale (Tailwind)
```
text-xs     → 12px  → Metadata, tags, timestamps
text-sm     → 14px  → Table cells, secondary labels  
text-base   → 16px  → Body text, form labels
text-lg     → 18px  → Card titles, panel headers
text-xl     → 20px  → Section titles
text-2xl    → 24px  → Page titles
text-3xl    → 30px  → Dashboard metrics (revenue total)
text-4xl    → 36px  → Hero metrics
```

### Weight Rules
```
font-normal  → Regular body text
font-medium  → Labels, navigation
font-semibold → Card headers, table headers, buttons
font-bold    → Page titles, grand total amounts
```

---

## Spacing System

```
gap-1    → 4px   → Icon + label pairs
gap-2    → 8px   → Tight list items
gap-3    → 12px  → Form field spacing
gap-4    → 16px  → Card padding, section spacing
gap-6    → 24px  → Between card groups
gap-8    → 32px  → Page section separation
gap-12   → 48px  → Major layout divisions
p-4      → 16px  → Standard card padding
p-6      → 24px  → Comfortable card padding
```

---

## Component Library

### 1. Page Layout

```jsx
// Standard page structure
<div className="min-h-screen bg-[#0F1117] text-slate-100 font-['IBM_Plex_Sans']">
  <Sidebar />
  <main className="ml-64 p-8">
    <PageHeader title="Invoices" subtitle="All billing records" />
    <div className="mt-6">
      {/* Page content */}
    </div>
  </main>
</div>
```

### 2. Sidebar

```
Width: 256px (ml-64)
Background: #161B27
Border-right: 1px solid #1E2A3B

Logo area (top, 72px):
  - Janwari Industries wordmark (Playfair Display, amber)
  - Tagline: "Auto & Battery" (IBM Plex Sans, text-slate-500, text-xs)

Nav items:
  - Icon (20px) + Label (IBM Plex Sans, font-medium)
  - Active: amber text + amber-500/10 background + left amber 3px border
  - Inactive: text-slate-400, hover text-slate-200

Nav sections:
  BILLING        → Dashboard, New Invoice, Invoices, Quotes
  INVENTORY      → Products, Stock, Purchase Orders
  CUSTOMERS      → Customers, Khata/Udhaar
  BATTERIES 🔋   → Serial Numbers, Warranty, Graveyard
  FINANCES       → Mechanics, GSTR, Petty Cash, Suppliers
  ANALYTICS      → Reports, Analytics
  SETTINGS       → Settings, Users

Bottom: user avatar + name + role badge + logout
```

### 3. Card

```jsx
// Base card
<div className="bg-[#161B27] border border-[#1E2A3B] rounded-lg p-6">
  {children}
</div>

// Highlighted card (amber glow)
<div className="bg-[#161B27] border border-amber-500/30 rounded-lg p-6 
                shadow-[0_0_20px_rgba(245,158,11,0.05)]">
  {children}
</div>

// Alert card (red)
<div className="bg-red-500/5 border border-red-500/30 rounded-lg p-4">
  {children}
</div>
```

### 4. Dashboard Metric Widget

```jsx
// Large metric card (top row of dashboard)
<div className="bg-[#161B27] border border-[#1E2A3B] rounded-lg p-6">
  <p className="text-sm text-slate-400 font-['IBM_Plex_Sans'] uppercase tracking-wider">
    Today's Sales
  </p>
  <p className="text-3xl font-bold text-amber-400 font-['JetBrains_Mono'] mt-2">
    ₹48,500
  </p>
  <p className="text-xs text-slate-500 mt-1">
    +12% vs yesterday
  </p>
  <div className="mt-4 h-1 bg-[#1E2A3B] rounded-full">
    <div className="h-1 bg-amber-500 rounded-full" style={{ width: '72%' }} />
  </div>
</div>
```

### 5. Status Badges

```jsx
const StatusBadge = ({ status }) => {
  const configs = {
    PAID:     { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Paid' },
    PARTIAL:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Partial' },
    PENDING:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Pending' },
    OVERDUE:  { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'Overdue' },
    DRAFT:    { bg: 'bg-slate-500/10',   text: 'text-slate-400',   dot: 'bg-slate-400',   label: 'Draft' },
    ACTIVE:   { bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-400', label: 'Active' },
    EXPIRED:  { bg: 'bg-red-500/10',     text: 'text-red-400',     dot: 'bg-red-400',     label: 'Expired' },
    PRO_RATA: { bg: 'bg-amber-500/10',   text: 'text-amber-400',   dot: 'bg-amber-400',   label: 'Pro-rata' },
  };
  const c = configs[status];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${c.bg} ${c.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${c.dot}`} />
      {c.label}
    </span>
  );
};
```

### 6. Buttons

```jsx
// Primary (amber, for main CTAs)
<button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold 
                   px-4 py-2 rounded-md transition-colors duration-150 
                   font-['IBM_Plex_Sans'] text-sm">
  Finalize Invoice
</button>

// Secondary (ghost)
<button className="border border-[#1E2A3B] hover:border-amber-500/40 
                   text-slate-300 hover:text-slate-100 font-medium
                   px-4 py-2 rounded-md transition-colors duration-150 text-sm">
  Cancel
</button>

// Danger
<button className="bg-red-500/10 hover:bg-red-500/20 border border-red-500/30
                   text-red-400 font-medium px-4 py-2 rounded-md transition-colors text-sm">
  Delete
</button>

// With keyboard shortcut label
<button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold 
                   px-4 py-2 rounded-md flex items-center gap-2 text-sm">
  Finalize Invoice
  <span className="bg-black/20 text-xs px-1.5 py-0.5 rounded font-mono">F8</span>
</button>
```

### 7. Form Inputs

```jsx
// Text input
<div className="space-y-1.5">
  <label className="text-sm text-slate-400 font-medium">Customer Phone</label>
  <input 
    className="w-full bg-[#0F1117] border border-[#1E2A3B] rounded-md px-3 py-2
               text-slate-100 text-sm placeholder-slate-600
               focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30
               transition-colors font-['IBM_Plex_Sans']"
    placeholder="Enter phone number..."
  />
</div>

// Search input (with icon)
<div className="relative">
  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
  <input 
    className="w-full bg-[#0F1117] border border-[#1E2A3B] rounded-md 
               pl-10 pr-4 py-2.5 text-slate-100 text-sm placeholder-slate-600
               focus:outline-none focus:border-amber-500/60
               font-['IBM_Plex_Sans']"
    placeholder="Search items (Ctrl+K)..."
  />
  <kbd className="absolute right-3 top-1/2 -translate-y-1/2 
                  bg-[#1E2A3B] text-slate-500 text-xs px-1.5 py-0.5 rounded 
                  font-['JetBrains_Mono']">
    ⌘K
  </kbd>
</div>
```

### 8. Table

```jsx
<table className="w-full">
  <thead>
    <tr className="border-b border-[#1E2A3B]">
      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider 
                     pb-3 font-['IBM_Plex_Sans']">Invoice #</th>
      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-3">Customer</th>
      <th className="text-right text-xs text-slate-500 font-medium uppercase tracking-wider pb-3">Amount</th>
      <th className="text-left text-xs text-slate-500 font-medium uppercase tracking-wider pb-3">Status</th>
    </tr>
  </thead>
  <tbody className="divide-y divide-[#1E2A3B]">
    <tr className="hover:bg-[#1A2233] transition-colors cursor-pointer">
      <td className="py-3.5 text-sm text-amber-400 font-['JetBrains_Mono']">
        JI/2025-26/0047
      </td>
      <td className="py-3.5 text-sm text-slate-200">Mohammed Yusuf</td>
      <td className="py-3.5 text-sm text-right text-slate-100 font-['JetBrains_Mono'] font-medium">
        ₹10,200.00
      </td>
      <td className="py-3.5"><StatusBadge status="PAID" /></td>
    </tr>
  </tbody>
</table>
```

### 9. Billing Page — Cart Item Row

```jsx
<div className="flex items-start gap-3 py-3 border-b border-[#1E2A3B] 
                group hover:bg-[#1A2233] px-3 -mx-3 rounded transition-colors">
  {/* Item info */}
  <div className="flex-1 min-w-0">
    <div className="flex items-center gap-2">
      <span className="text-sm text-slate-100 font-medium truncate">Amaron 100Ah Black Pro</span>
      {item.isBattery && (
        <span className="text-xs bg-amber-500/10 text-amber-400 px-1.5 py-0.5 rounded">🔋 Battery</span>
      )}
    </div>
    <div className="flex items-center gap-3 mt-1">
      {/* Serial number input for batteries */}
      {item.isBattery && (
        <input 
          placeholder="Enter serial no."
          className="text-xs bg-transparent border-b border-[#1E2A3B] focus:border-amber-500 
                     text-amber-400 font-['JetBrains_Mono'] outline-none w-36 pb-0.5"
        />
      )}
      <span className="text-xs text-slate-500">HSN: 8507</span>
      <span className="text-xs text-slate-500">GST: 28%</span>
    </div>
  </div>
  
  {/* Qty */}
  <div className="flex items-center border border-[#1E2A3B] rounded">
    <button className="px-2 py-1 text-slate-400 hover:text-amber-400 text-sm">−</button>
    <span className="px-3 py-1 text-sm text-slate-100 font-['JetBrains_Mono'] border-x border-[#1E2A3B]">1</span>
    <button className="px-2 py-1 text-slate-400 hover:text-amber-400 text-sm">+</button>
  </div>
  
  {/* Rate + discount */}
  <div className="text-right w-28">
    <p className="text-sm text-slate-100 font-['JetBrains_Mono']">₹8,500.00</p>
    <p className="text-xs text-slate-500">Disc: 5% (−₹425)</p>
  </div>
  
  {/* Line total */}
  <div className="text-right w-28">
    <p className="text-sm font-semibold text-slate-100 font-['JetBrains_Mono']">₹8,075.00</p>
    <p className="text-xs text-emerald-400">+GST ₹2,261</p>
  </div>
  
  {/* Remove */}
  <button className="opacity-0 group-hover:opacity-100 text-slate-500 hover:text-red-400 transition-all">
    ✕
  </button>
</div>
```

### 10. Warranty Status Card

```jsx
<div className="bg-[#161B27] border border-[#1E2A3B] rounded-lg p-5">
  <div className="flex items-start justify-between">
    <div>
      <p className="text-xs text-slate-500 uppercase tracking-wider">Serial Number</p>
      <p className="text-lg text-amber-400 font-['JetBrains_Mono'] font-semibold mt-1">
        AMR2023XXXX1234
      </p>
    </div>
    <StatusBadge status="PRO_RATA" />
  </div>
  
  {/* Warranty timeline visual */}
  <div className="mt-4">
    <div className="flex justify-between text-xs text-slate-500 mb-1">
      <span>Purchased: 14/08/2023</span>
      <span>18 months used</span>
    </div>
    <div className="h-2 bg-[#0F1117] rounded-full overflow-hidden">
      <div className="h-full rounded-full" style={{ 
        width: '75%',
        background: 'linear-gradient(to right, #10B981, #F59E0B)' 
      }} />
    </div>
    <div className="flex justify-between text-xs mt-1">
      <span className="text-emerald-400">Free: 24M ✓</span>
      <span className="text-amber-400">Pro-rata: 6M left</span>
      <span className="text-slate-500">Expires: 14/08/2025</span>
    </div>
  </div>
  
  <div className="mt-4 pt-4 border-t border-[#1E2A3B] flex items-center justify-between">
    <div>
      <p className="text-xs text-slate-500">Pro-rata Claim Value</p>
      <p className="text-xl font-bold text-amber-400 font-['JetBrains_Mono']">₹2,125.00</p>
      <p className="text-xs text-slate-500">25% of ₹8,500 MRP</p>
    </div>
    <button className="bg-amber-500 hover:bg-amber-400 text-black font-semibold 
                       text-sm px-4 py-2 rounded-md">
      Process Claim
    </button>
  </div>
</div>
```

### 11. Morning Dashboard Header

```jsx
<div className="relative overflow-hidden bg-[#161B27] border border-[#1E2A3B] 
                rounded-xl p-8 mb-8">
  {/* Subtle texture overlay */}
  <div className="absolute inset-0 opacity-[0.03]" 
       style={{ backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,0.1) 2px, rgba(255,255,255,0.1) 3px)' }} />
  
  <div className="relative">
    <p className="text-sm text-slate-500 font-['IBM_Plex_Sans']">Tuesday, 24 March 2026</p>
    <h1 className="text-3xl font-['Playfair_Display'] font-bold text-slate-100 mt-1">
      Good morning, 
      <span className="text-amber-400"> Janwari Industries</span>
    </h1>
    <p className="text-slate-400 text-sm mt-2">
      3 warranty claims due this week · 2 customers with overdue balance · Low stock on 4 items
    </p>
  </div>
  
  {/* Ambient amber glow */}
  <div className="absolute top-0 right-0 w-64 h-64 
                  bg-amber-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
</div>
```

### 12. Global Command Palette (Ctrl+K)

```jsx
// Overlay + centered modal
<div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24">
  <div className="bg-[#161B27] border border-[#1E2A3B] rounded-xl w-full max-w-xl shadow-2xl 
                  shadow-black/50 overflow-hidden">
    {/* Search input */}
    <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1E2A3B]">
      <Search className="w-4 h-4 text-amber-400" />
      <input 
        autoFocus
        className="flex-1 bg-transparent text-slate-100 text-sm outline-none 
                   placeholder-slate-500 font-['IBM_Plex_Sans']"
        placeholder="Search invoices, customers, products, serial numbers..."
      />
      <kbd className="bg-[#1E2A3B] text-slate-500 text-xs px-1.5 py-0.5 rounded font-['JetBrains_Mono']">
        Esc
      </kbd>
    </div>
    
    {/* Results */}
    <div className="max-h-80 overflow-y-auto divide-y divide-[#1E2A3B]">
      {/* Result item */}
      <div className="px-4 py-3 flex items-center gap-3 hover:bg-[#1A2233] cursor-pointer">
        <span className="text-xs bg-amber-500/10 text-amber-400 px-2 py-0.5 rounded font-mono">
          INV
        </span>
        <div>
          <p className="text-sm text-slate-200">JI/2025-26/0047</p>
          <p className="text-xs text-slate-500">Mohammed Yusuf · ₹10,200 · Paid</p>
        </div>
      </div>
    </div>
    
    {/* Footer hints */}
    <div className="px-4 py-2 border-t border-[#1E2A3B] flex items-center gap-4 text-xs text-slate-600">
      <span><kbd className="font-mono">↑↓</kbd> navigate</span>
      <span><kbd className="font-mono">↵</kbd> select</span>
      <span><kbd className="font-mono">Esc</kbd> close</span>
    </div>
  </div>
</div>
```

---

## Page-by-Page Design Notes

### Login Page
- Full-screen dark background (#0F1117)
- Centered card (max-w-md) with amber top border accent
- Shop name in Playfair Display, large
- Subtle amber radial glow in bottom-right corner
- "Industrial Estate, Sopore" in small text below logo
- Login button: full-width amber

### Dashboard
- Top greeting banner (see component #11 above)
- 4 metric cards in a row: Today's Sales, Pending Udhaar, Low Stock, Month Revenue
- Sales trend chart (30 days, Recharts LineChart with amber line)
- Two columns: Recent Invoices (left) + Alerts/Tasks (right)
- Alerts: low stock items, expiring warranties, overdue khata

### New Invoice Page
- No sidebar on this page (full-screen focus mode)
- Split panel: 60% cart / 40% totals
- Top bar: invoice number + status chip + save/finalize buttons with F-key labels
- Item search bar: autofocus, debounced
- Cart: scrollable, each row shows serial number input field for batteries
- Totals panel: sticky, shows live calculation
- Payment: three inputs (cash, UPI, credit) with balance shown prominently
- "Add Exchange" button: amber outline, battery icon, opens slide-over

### Warranty Lookup
- Single large search bar at top (serial number or customer phone)
- Results: warranty status card (see component #10)
- If multiple results: card list
- Claim button → modal with confirmation + claim slip preview

### Battery Graveyard
- Dark aesthetic with slight red tint on cards
- Table: condition badge, source invoice, weight, age in graveyard, settle button
- Summary bar: total batteries, total estimated weight, total pending scrap value
- "Mark as Settled" → scrap settlement modal

---

## Animation Specifications

### Page Transitions
```js
// Framer Motion - for all pages
const pageVariants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0, transition: { duration: 0.2, ease: 'easeOut' } },
  exit: { opacity: 0, y: -8, transition: { duration: 0.15 } }
};
```

### Staggered List Items
```js
const listVariants = {
  animate: { transition: { staggerChildren: 0.04 } }
};
const itemVariants = {
  initial: { opacity: 0, x: -8 },
  animate: { opacity: 1, x: 0 }
};
```

### Modal
```js
const modalVariants = {
  initial: { opacity: 0, scale: 0.95 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.15 } },
  exit: { opacity: 0, scale: 0.95 }
};
```

### Cart Item Add
- New cart item slides in from top with fade
- Running total animates (count-up animation using framer-motion's `animate` prop)

### Amber Glow on Focus
```css
/* On any focused interactive element with amber accent */
box-shadow: 0 0 0 1px rgba(245,158,11,0.5), 0 0 12px rgba(245,158,11,0.1);
```

---

## PDF Invoice Design

### A4 Tax Invoice

```
Background: white
Top stripe: 6px solid #F59E0B (amber)

Header:
  Left: Shop name (Playfair Display, 22pt, #0F1117)
         Address block (IBM Plex Sans, 9pt, #4B5563)
         Phone | GSTIN (9pt)
  Right: "TAX INVOICE" (IBM Plex Sans, 14pt, bold, #0F1117, right-aligned)
          Invoice No: JI/2025-26/0047 (JetBrains Mono, 10pt, #F59E0B)
          Date: 24/03/2026 (9pt)

Divider: 1px solid #E2E8F0

Customer block:
  Left: Bill To → Name, Phone, Address, GSTIN
  Right: Vehicle No, Battery SN, Warranty

Items table:
  Header: #F1F5F9 background, 8pt uppercase
  Rows: alternating white / #FAFAFA
  Exchange rows: light amber background #FFFBEB

Totals block (right-aligned):
  Subtotal, Discount, CGST, SGST, Grand Total (bold, larger)
  Grand total row: amber left border, bold

Footer:
  Left: Warranty QR Code (links to warranty lookup)
  Right: Terms & conditions, signature line
  Bottom: "Thank you for your business — Janwari Industries"
```

### 80mm Thermal Receipt

```
[JANWARI INDUSTRIES]         ← Bold, centered
Industrial Estate, Sopore
Ph: 7006083933
GST: [GSTIN]
--------------------------------
INV: JI/25-26/0047
Date: 24/03/2026  Time: 14:32
Cashier: Admin
--------------------------------
CUST: Mohammed Yusuf
Ph: 98XXXXXXXX
Veh: JK02AB1234
--------------------------------
1 Amaron 100Ah       ₹8,500
  (SN: AMR2024XXXX)
  CGST 14%             ₹1,190
  SGST 14%             ₹1,190
  Exchange Disc         -₹500
--------------------------------
TOTAL              ₹10,380
CASH               ₹10,380
BALANCE                  ₹0
--------------------------------
WARRANTY: 24M + 24M Pro-rata
Claim: [QR CODE]
--------------------------------
Thank you! Drive safe!
```

---

## Iconography

Use **Lucide React** icons throughout. Key icons:

| Feature | Icon |
|---------|------|
| New Invoice | `FilePlus` |
| Battery | `BatteryCharging` |
| Customer | `User` |
| Warranty | `ShieldCheck` |
| Graveyard | `Archive` |
| Khata/Udhaar | `BookOpen` |
| Mechanic | `Wrench` |
| Analytics | `BarChart2` |
| Settings | `Settings` |
| Search | `Search` |
| Print | `Printer` |
| WhatsApp | `MessageCircle` (use green color) |
| Exchange | `RefreshCw` |
| Low Stock | `AlertTriangle` |
| Sync | `RefreshCw` (animate spin when syncing) |
| Offline | `WifiOff` |

---

## Responsive Breakpoints

| Breakpoint | Layout |
|-----------|--------|
| < 1280px | Minimum supported — show "For best experience, use 1280px+ screen" banner |
| 1280px–1440px | Standard layout, sidebar visible |
| 1440px–1920px | Standard layout, more table columns visible |
| > 1920px | max-w-screen-2xl centered |

The billing screen (New Invoice) is never responsive — it's always the full 60/40 split. This is a desktop-first, counter-use application.

---

## Accessibility

- All interactive elements keyboard-focusable
- Focus rings: `focus:ring-2 focus:ring-amber-500/50`
- Minimum contrast ratio: 4.5:1 for all text
- Status badges never rely on color alone (always include text label)
- Loading states announced to screen readers via `aria-live="polite"`
- Serial number inputs: `aria-label="Battery serial number"`
