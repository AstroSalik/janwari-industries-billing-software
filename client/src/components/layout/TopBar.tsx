import { useLocation } from 'react-router-dom';
import { Search, Calendar, Menu } from 'lucide-react';

// Route → Title mapping
const pageTitles: Record<string, { title: string; subtitle: string }> = {
  '/': { title: 'Dashboard', subtitle: 'Business overview at a glance' },
  '/invoices/new': { title: 'New Invoice', subtitle: 'Create a new billing invoice' },
  '/invoices': { title: 'Invoices', subtitle: 'All billing records' },
  '/quotes': { title: 'Quotes', subtitle: 'Price quotations & estimates' },
  '/products': { title: 'Products', subtitle: 'Inventory catalog' },
  '/stock': { title: 'Stock', subtitle: 'Stock levels by location' },
  '/purchases': { title: 'Purchase Orders', subtitle: 'Inward stock management' },
  '/snap-to-bill': { title: 'Snap-to-Bill', subtitle: 'Scan a bill into a draft invoice' },
  '/customers': { title: 'Customers', subtitle: 'Customer database' },
  '/khata': { title: 'Khata / Udhaar', subtitle: 'Credit ledger & outstanding dues' },
  '/serial-numbers': { title: 'Serial Numbers', subtitle: 'Battery serial tracking' },
  '/warranty': { title: 'Warranty', subtitle: 'Warranty status & claims' },
  '/graveyard': { title: 'Battery Graveyard', subtitle: 'Exchanged & scrapped batteries' },
  '/mechanics': { title: 'Mechanics', subtitle: 'Commissions & settlements' },
  '/gstr': { title: 'GSTR-1 Export', subtitle: 'GST compliance data' },
  '/petty-cash': { title: 'Petty Cash', subtitle: 'Daily expense register' },
  '/suppliers': { title: 'Suppliers', subtitle: 'Vendor management' },
  '/reports': { title: 'Reports', subtitle: 'Business intelligence reports' },
  '/analytics': { title: 'Analytics', subtitle: 'Performance insights' },
  '/settings': { title: 'Settings', subtitle: 'System configuration' },
};

interface TopBarProps {
  onMenuClick?: () => void;
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation();
  const pageInfo = pageTitles[location.pathname] || { title: 'Page', subtitle: '' };

  const today = new Date().toLocaleDateString('en-IN', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  return (
    <header className="h-16 flex items-center justify-between px-4 md:px-8 border-b border-ji-border bg-ji-bg/80 backdrop-blur-sm sticky top-0 z-30">
      {/* Left: Menu & Title */}
      <div className="flex items-center gap-3 md:gap-0">
        <button
          onClick={onMenuClick}
          className="md:hidden p-2 -ml-2 text-ji-text-muted hover:text-ji-text hover:bg-ji-surface rounded-md transition-colors"
        >
          <Menu size={20} />
        </button>
        <div>
          <h1 className="text-lg md:text-xl font-['Playfair_Display'] font-bold text-ji-text">
            {pageInfo.title}
          </h1>
          <p className="hidden md:block text-xs font-['IBM_Plex_Sans'] text-ji-text-muted -mt-0.5">
            {pageInfo.subtitle}
          </p>
        </div>
      </div>

      {/* Right: Actions */}
      <div className="flex items-center gap-4">
        {/* Date */}
        <div className="flex items-center gap-1.5 text-ji-text-muted text-xs font-['IBM_Plex_Sans']">
          <Calendar size={14} />
          <span>{today}</span>
        </div>

        {/* Search Trigger */}
        <button
          className="flex items-center gap-2 px-3 py-1.5 rounded-md border border-ji-border 
                     hover:border-ji-amber/40 text-ji-text-muted hover:text-ji-text 
                     transition-colors text-sm font-['IBM_Plex_Sans']"
          title="Search (Ctrl+K)"
        >
          <Search size={14} />
          <span className="hidden sm:inline">Search</span>
          <kbd className="text-[10px] font-['JetBrains_Mono'] bg-ji-surface px-1.5 py-0.5 rounded text-ji-text-muted border border-ji-border">
            ⌘K
          </kbd>
        </button>
      </div>
    </header>
  );
}
