import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, FileText, Users, Package, Hash } from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import api from '../../lib/api';

// ─── Types ──────────────────────────────────────────

interface SearchResult {
  id: string;
  type: 'INV' | 'CUST' | 'PROD' | 'SN';
  title: string;
  subtitle: string;
  path: string;
}

const typeConfig = {
  INV:  { bg: 'bg-amber-500/10',   text: 'text-amber-400',   icon: FileText },
  CUST: { bg: 'bg-blue-500/10',    text: 'text-blue-400',    icon: Users },
  PROD: { bg: 'bg-emerald-500/10', text: 'text-emerald-400', icon: Package },
  SN:   { bg: 'bg-purple-500/10',  text: 'text-purple-400',  icon: Hash },
};

const formatINR = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' }).format(amount);

// ─── Command Palette ────────────────────────────────

export default function CommandPalette() {
  const open = useUIStore((s) => s.commandPaletteOpen);
  const close = useUIStore((s) => s.closeCommandPalette);
  const navigate = useNavigate();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('');
      setResults([]);
      setSelectedIndex(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  // Debounced search
  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setSelectedIndex(0);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const q = query.trim();
        const searchResults: SearchResult[] = [];

        // Search in parallel
        const [invoicesRes, customersRes, productsRes] = await Promise.allSettled([
          api.get('/invoices', { params: { search: q, limit: '5' } }),
          api.get('/customers', { params: { search: q, limit: '5' } }),
          api.get('/products', { params: { search: q, limit: '5' } }),
        ]);

        // Invoices
        if (invoicesRes.status === 'fulfilled') {
          const invoices = invoicesRes.value.data.data || [];
          invoices.forEach((inv: any) => {
            searchResults.push({
              id: inv.id,
              type: 'INV',
              title: inv.invoiceNumber,
              subtitle: `${inv.customer?.name || 'Walk-in'} · ${formatINR(inv.grandTotal)} · ${inv.status}`,
              path: `/invoices`,
            });
          });
        }

        // Customers
        if (customersRes.status === 'fulfilled') {
          const customers = customersRes.value.data.data || [];
          customers.forEach((cust: any) => {
            searchResults.push({
              id: cust.id,
              type: 'CUST',
              title: cust.name,
              subtitle: `${cust.phone} · ${cust.type}`,
              path: `/customers`,
            });
          });
        }

        // Products
        if (productsRes.status === 'fulfilled') {
          const products = productsRes.value.data.data || [];
          products.forEach((prod: any) => {
            searchResults.push({
              id: prod.id,
              type: 'PROD',
              title: prod.name,
              subtitle: `${prod.brand || ''} · ${formatINR(prod.mrp)} · Stock: ${prod.totalStock ?? '?'}`,
              path: `/products`,
            });
          });
        }

        setResults(searchResults);
        setSelectedIndex(0);
      } catch {
        // Silently fail
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, results.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter' && results.length > 0) {
        e.preventDefault();
        const selected = results[selectedIndex];
        if (selected) {
          navigate(selected.path);
          close();
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        close();
      }
    },
    [results, selectedIndex, navigate, close]
  );

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selected = resultsRef.current.children[selectedIndex] as HTMLElement;
      selected?.scrollIntoView({ block: 'nearest' });
    }
  }, [selectedIndex]);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.12 }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-start justify-center pt-24"
          onClick={(e) => {
            if (e.target === e.currentTarget) close();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -8 }}
            transition={{ duration: 0.15 }}
            className="bg-white border border-ji-border rounded-2xl w-full max-w-xl shadow-2xl shadow-ji-text/10 overflow-hidden"
          >
            {/* Search Input */}
            <div className="flex items-center gap-3 px-6 py-4 border-b border-ji-border bg-ji-bg/30">
              <Search className="w-4 h-4 text-ji-amber shrink-0" />
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={handleKeyDown}
                autoFocus
                className="flex-1 bg-transparent text-ji-text text-sm outline-none placeholder-ji-text-dim font-['IBM_Plex_Sans'] font-bold"
                placeholder="Protocol Search: Invoices, Customers, Products..."
              />
              {loading && (
                <div className="w-3.5 h-3.5 border-2 border-ji-amber/30 border-t-ji-amber rounded-full animate-spin shrink-0" />
              )}
              <kbd
                className="bg-white text-ji-text-dim text-[10px] px-2 py-1 rounded-lg border border-ji-border font-['JetBrains_Mono'] shrink-0 cursor-pointer hover:border-ji-amber hover:text-ji-amber transition-colors"
                onClick={close}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div
              ref={resultsRef}
              className="max-h-80 overflow-y-auto"
            >
              {query.trim() && results.length === 0 && !loading ? (
                <div className="px-4 py-8 text-center">
                  <Search size={20} className="mx-auto text-slate-600 mb-2" />
                  <p className="text-xs text-slate-500">No results for "{query}"</p>
                  <p className="text-[10px] text-slate-600 mt-1">Try searching by invoice number, customer name, phone, or product name</p>
                </div>
              ) : !query.trim() && !loading ? (
                <div className="px-4 py-6 text-center">
                  <p className="text-xs text-slate-500">Start typing to search across</p>
                  <div className="flex items-center justify-center gap-3 mt-2">
                    {(['INV', 'CUST', 'PROD'] as const).map((type) => {
                      const cfg = typeConfig[type];
                      return (
                        <span key={type} className={`text-[10px] ${cfg.bg} ${cfg.text} px-2 py-0.5 rounded font-['JetBrains_Mono']`}>
                          {type === 'INV' ? 'Invoices' : type === 'CUST' ? 'Customers' : 'Products'}
                        </span>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div className="divide-y divide-ji-border/40">
                  {results.map((result, index) => {
                    const cfg = typeConfig[result.type];
                    const isSelected = index === selectedIndex;

                    return (
                      <div
                        key={`${result.type}-${result.id}`}
                        onClick={() => {
                          navigate(result.path);
                          close();
                        }}
                        className={`px-6 py-4 flex items-center gap-4 cursor-pointer transition-all ${
                          isSelected ? 'bg-ji-bg' : 'hover:bg-ji-bg/50'
                        }`}
                      >
                        <span className={`text-[9px] ${cfg.bg} ${cfg.text} px-2.5 py-1 rounded-lg font-['JetBrains_Mono'] font-black shrink-0 border border-current/10`}>
                          {result.type}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-black text-ji-text truncate uppercase tracking-tight">{result.title}</p>
                          <p className="text-[10px] text-ji-text-dim truncate italic">{result.subtitle}</p>
                        </div>
                        {isSelected && (
                          <kbd className="text-[10px] font-['JetBrains_Mono'] text-ji-amber bg-white border border-ji-amber/20 px-2 py-1 rounded-lg shrink-0 shadow-sm">
                            ENTER
                          </kbd>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Footer Hints */}
            <div className="px-6 py-3 border-t border-ji-border bg-ji-bg/30 flex items-center gap-6 text-[9px] font-black text-ji-text-dim uppercase tracking-widest">
              <span className="flex items-center gap-1.5"><kbd className="font-['JetBrains_Mono'] px-1.5 py-0.5 bg-white border border-ji-border rounded-md">↑↓</kbd> Select</span>
              <span className="flex items-center gap-1.5"><kbd className="font-['JetBrains_Mono'] px-1.5 py-0.5 bg-white border border-ji-border rounded-md">↵</kbd> Proceed</span>
              <span className="flex items-center gap-1.5"><kbd className="font-['JetBrains_Mono'] px-1.5 py-0.5 bg-white border border-ji-border rounded-md">Esc</kbd> Dismiss</span>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
