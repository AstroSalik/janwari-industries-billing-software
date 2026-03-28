import { useEffect } from 'react';
import { Routes, Route } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import ProtectedRoute from './components/auth/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import Login from './pages/Login';
import PlaceholderPage from './components/shared/PlaceholderPage';
import Products from './pages/Products';
import Customers from './pages/Customers';
import NewInvoice from './pages/NewInvoice';
import Invoices from './pages/Invoices';
import Quotes from './pages/Quotes';
import Challans from './pages/Challans';
import NewChallan from './pages/NewChallan';
import ChallanDetail from './pages/ChallanDetail';
import Dashboard from './pages/Dashboard';
import BatteryTracker from './pages/BatteryTracker';
import InvoiceDetail from './pages/InvoiceDetail';
import Stock from './pages/Stock';
import Categories from './pages/Categories';
import Purchases from './pages/Purchases';
import Khata from './pages/Khata';
import Analytics from './pages/Analytics';
import Gstr from './pages/Gstr';
import Mechanics from './pages/Mechanics';
import Graveyard from './pages/Graveyard';
import Accounts from './pages/Accounts';
import DayBook from './pages/DayBook';
import SnapToBill from './pages/SnapToBill';
import ReceiptPrint from './pages/ReceiptPrint';
import CommandPalette from './components/shared/CommandPalette';
import { useShortcuts } from './lib/shortcuts';
import {
  FileQuestion,
  Wallet,
  BarChart3,
  Settings,
} from 'lucide-react';

// ─── App ────────────────────────────────────────────

function App() {
  const checkAuth = useAuthStore((s) => s.checkAuth);
  useShortcuts();

  useEffect(() => {
    checkAuth();
  }, [checkAuth]);

  return (
    <>
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* 80mm Print Receipt - no layout */}
      <Route 
        path="/invoices/:id/receipt" 
        element={
          <ProtectedRoute>
            <ReceiptPrint />
          </ProtectedRoute>
        } 
      />

      {/* Protected — All pages inside AppLayout */}
      <Route
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>

        }
      >
        {/* Billing */}
        <Route index element={<Dashboard />} />
        <Route path="invoices/new" element={<NewInvoice />} />
        <Route path="invoices/:id" element={<InvoiceDetail />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="quotes/new" element={<NewInvoice isQuote={true} />} />
        <Route path="quotes" element={<Quotes />} />
        <Route path="challans" element={<Challans />} />
        <Route path="challans/new" element={<NewChallan />} />
        <Route path="challans/:id" element={<ChallanDetail />} />

        {/* Inventory */}
        <Route path="categories" element={<Categories />} />
        <Route path="products" element={<Products />} />
        <Route path="stock" element={<Stock />} />
        <Route path="purchases" element={<Purchases />} />
        <Route path="snap-to-bill" element={<SnapToBill />} />

        {/* Customers */}
        <Route path="customers" element={<Customers />} />
        <Route path="khata" element={<Khata />} />

        {/* Battery */}
        <Route path="serial-numbers" element={<BatteryTracker />} />
        <Route path="warranty" element={<BatteryTracker />} />
        <Route path="graveyard" element={<Graveyard />} />

        {/* Finances */}
        <Route path="accounts" element={<Accounts />} />
        <Route path="mechanics" element={<Mechanics />} />
        <Route path="gstr" element={<Gstr />} />
        <Route path="petty-cash" element={<PlaceholderPage title="Petty Cash" subtitle="Daily expense register" icon={Wallet} />} />

        {/* Analytics */}
        <Route path="day-book" element={<DayBook />} />
        <Route path="reports" element={<PlaceholderPage title="Reports" subtitle="Business intelligence reports" icon={BarChart3} />} />
        <Route path="analytics" element={<Analytics />} />

        {/* Settings */}
        <Route path="settings" element={<PlaceholderPage title="Settings" subtitle="System configuration" icon={Settings} />} />
      </Route>

      {/* 404 */}
      <Route path="*" element={<PlaceholderPage title="404" subtitle="Page not found" icon={FileQuestion} />} />
    </Routes>

    {/* Global Command Palette — Ctrl+K */}
    <CommandPalette />
    </>
  );
}

export default App;

