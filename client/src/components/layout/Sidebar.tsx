import { NavLink, useLocation } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuthStore } from '../../stores/authStore';
import {
  LayoutDashboard,
  FilePlus,
  FileText,
  FileQuestion,
  Package,
  Warehouse,
  ShoppingCart,
  Users,
  BookOpen,
  Hash,
  Shield,
  Skull,
  Wrench,
  Receipt,
  Wallet,
  Truck,
  BarChart3,
  TrendingUp,
  Settings,
  LogOut,
  ChevronDown,
  Scan,
  X,
} from 'lucide-react';
import { useState } from 'react';

// ─── Navigation Structure ───────────────────────────

interface NavItem {
  label: string;
  path: string;
  icon: React.ComponentType<{ size?: string | number; className?: string }>;
}

interface NavSection {
  title: string;
  items: NavItem[];
}

const navSections: NavSection[] = [
  {
    title: 'BILLING',
    items: [
      { label: 'Dashboard', path: '/', icon: LayoutDashboard },
      { label: 'New Invoice', path: '/invoices/new', icon: FilePlus },
      { label: 'Invoices', path: '/invoices', icon: FileText },
      { label: 'Quotes', path: '/quotes', icon: FileQuestion },
      { label: 'Delivery Challans', path: '/challans', icon: Truck },
    ],
  },
  {
    title: 'INVENTORY',
    items: [
      { label: 'Products', path: '/products', icon: Package },
      { label: 'Stock', path: '/stock', icon: Warehouse },
      { label: 'Purchase Orders', path: '/purchases', icon: ShoppingCart },
      { label: 'Snap-to-Bill', path: '/snap-to-bill', icon: Scan },
    ],
  },
  {
    title: 'CUSTOMERS',
    items: [
      { label: 'Customers', path: '/customers', icon: Users },
      { label: 'Khata / Udhaar', path: '/khata', icon: BookOpen },
    ],
  },
  {
    title: 'BATTERIES 🔋',
    items: [
      { label: 'Serial Numbers', path: '/serial-numbers', icon: Hash },
      { label: 'Warranty', path: '/warranty', icon: Shield },
      { label: 'Graveyard', path: '/graveyard', icon: Skull },
    ],
  },
  {
    title: 'FINANCES',
    items: [
      { label: 'Cash & Bank', path: '/accounts', icon: Wallet },
      { label: 'Mechanics', path: '/mechanics', icon: Wrench },
      { label: 'GSTR-1', path: '/gstr', icon: Receipt },
      { label: 'Petty Cash', path: '/petty-cash', icon: Wallet },
      { label: 'Suppliers', path: '/purchases?tab=suppliers', icon: Truck },
    ],
  },
  {
    title: 'ANALYTICS',
    items: [
      { label: 'Day Book', path: '/day-book', icon: BookOpen },
      { label: 'Reports', path: '/reports', icon: BarChart3 },
      { label: 'Analytics', path: '/analytics', icon: TrendingUp },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      { label: 'Settings', path: '/settings', icon: Settings },
    ],
  },
];

// ─── Sidebar Component ──────────────────────────────

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const logout = useAuthStore((s) => s.logout);
  const location = useLocation();
  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>({});

  const toggleSection = (title: string) => {
    setCollapsedSections((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside 
      className={`fixed left-0 top-0 bottom-0 w-64 bg-ji-surface border-r border-ji-border flex flex-col z-50 transform transition-transform duration-300 ease-in-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } md:translate-x-0`}
    >
      {/* ─── Logo ─────────────────────────────────── */}
      <div className="h-20 flex items-center justify-between px-5 border-b border-ji-border">
        <div className="flex items-center gap-3">
          <img 
            src="ji-logo.jpg" 
            alt="Janwari Industries" 
            className="w-10 h-10 rounded-lg object-cover shadow-sm border border-ji-border"
          />
          <div className="flex flex-col justify-center">
            <h1 className="font-['Playfair_Display'] text-ji-amber text-base font-bold leading-tight">
              Janwari Industries
            </h1>
            <p className="font-['IBM_Plex_Sans'] text-ji-text-muted text-[9px] uppercase tracking-wider font-semibold">
              Auto & Battery Expert
            </p>
          </div>
        </div>
        
        {/* Mobile Close Button */}
        <button 
          onClick={onClose}
          className="md:hidden p-1.5 -mr-1 text-ji-text-muted hover:text-ji-text hover:bg-ji-bg rounded-md transition-colors"
        >
          <X size={18} />
        </button>
      </div>

      {/* ─── Navigation ───────────────────────────── */}
      <nav className="flex-1 overflow-y-auto py-4 px-3 scrollbar-thin">
        {navSections.map((section) => {
          const isCollapsed = collapsedSections[section.title];
          return (
            <div key={section.title} className="mb-3">
              {/* Section Header */}
              <button
                onClick={() => toggleSection(section.title)}
                className="w-full flex items-center justify-between px-3 py-1.5 group"
              >
                <span className="text-[10px] font-['IBM_Plex_Sans'] font-semibold tracking-[0.15em] text-ji-text-muted group-hover:text-ji-text transition-colors">
                  {section.title}
                </span>
                <ChevronDown
                  size={12}
                  className={`text-ji-text-muted transition-transform duration-200 ${
                    isCollapsed ? '-rotate-90' : ''
                  }`}
                />
              </button>

              {/* Section Items */}
              <motion.div
                initial={false}
                animate={{
                  height: isCollapsed ? 0 : 'auto',
                  opacity: isCollapsed ? 0 : 1,
                }}
                transition={{ duration: 0.2, ease: 'easeInOut' }}
                className="overflow-hidden"
              >
                {section.items.map((item) => {
                  const isActive =
                    item.path === '/'
                      ? location.pathname === '/'
                      : location.pathname.startsWith(item.path);

                  return (
                    <NavLink
                      key={item.path}
                      to={item.path}
                      className={`
                        flex items-center gap-3 px-3 py-2 rounded-md text-sm font-['IBM_Plex_Sans'] font-medium
                        transition-all duration-150 relative group
                        ${
                          isActive
                            ? 'text-ji-amber bg-ji-amber/10'
                            : 'text-ji-text-muted hover:text-ji-text hover:bg-ji-bg'
                        }
                      `}
                    >
                      {/* Active indicator bar */}
                      {isActive && (
                        <motion.div
                          layoutId="sidebar-active"
                          className="absolute left-0 top-1 bottom-1 w-[3px] bg-ji-amber rounded-r-full"
                          transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                        />
                      )}
                      <item.icon
                        size={18}
                        className={isActive ? 'text-ji-amber' : 'text-ji-text-muted group-hover:text-ji-text'}
                      />
                      <span>{item.label}</span>

                      {/* Keyboard shortcut hints */}
                      {item.path === '/invoices/new' && (
                        <span className="ml-auto text-[10px] font-['JetBrains_Mono'] text-ji-text-muted bg-ji-bg px-1.5 py-0.5 rounded border border-ji-border">
                          F2
                        </span>
                      )}
                    </NavLink>
                  );
                })}
              </motion.div>
            </div>
          );
        })}
      </nav>

      {/* ─── User Info ────────────────────────────── */}
      <div className="border-t border-ji-border p-4">
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div className="w-9 h-9 rounded-full bg-ji-amber/20 border border-ji-amber/30 flex items-center justify-center">
            <span className="text-ji-amber font-['IBM_Plex_Sans'] font-semibold text-sm">
              {user?.name?.charAt(0) || 'U'}
            </span>
          </div>

          {/* Name + Role */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-['IBM_Plex_Sans'] font-medium text-ji-text truncate">
              {user?.name || 'User'}
            </p>
            <span
              className={`text-[10px] font-['JetBrains_Mono'] px-1.5 py-0.5 rounded-full ${
                user?.role === 'ADMIN'
                  ? 'text-ji-amber bg-ji-amber/10'
                  : 'text-emerald-600 bg-emerald-100'
              }`}
            >
              {user?.role || 'ROLE'}
            </span>
          </div>

          {/* Logout */}
          <button
            onClick={logout}
            className="p-2 rounded-md text-ji-text-muted hover:text-red-500 hover:bg-red-50 transition-colors"
            title="Logout"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
