import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Wallet, 
  RefreshCw, 
  ArrowRightLeft, 
  Search,
  ChevronRight,
  TrendingDown,
  TrendingUp,
  Landmark,
  Smartphone,
  BookOpen
} from 'lucide-react';
import { useAccountStore } from '../stores/accountStore';
import { toast } from 'react-hot-toast';

// ─── Formatting Helpers ──────────────────────────────

const formatCurrency = (amount: number) => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 2,
  }).format(amount);
};

// ─── Accounts Page ───────────────────────────────────

export default function Accounts() {
  const { 
    accounts, 
    totalBalance, 
    transactions, 
    loading, 
    fetchAccounts, 
    fetchTransactions,
    transfer 
  } = useAccountStore();

  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferData, setTransferData] = useState({
    fromAccountId: '',
    toAccountId: '',
    amount: '',
    notes: ''
  });

  useEffect(() => {
    fetchAccounts();
  }, [fetchAccounts]);

  useEffect(() => {
    if (selectedAccountId) {
      fetchTransactions(selectedAccountId);
    }
  }, [selectedAccountId, fetchTransactions]);

  const selectedAccount = accounts.find(a => a.id === selectedAccountId);

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferData.fromAccountId || !transferData.toAccountId || !transferData.amount) {
      toast.error('Please fill all required fields');
      return;
    }
    if (transferData.fromAccountId === transferData.toAccountId) {
      toast.error('Source and destination accounts must be different');
      return;
    }

    try {
      await transfer({
        ...transferData,
        amount: parseFloat(transferData.amount)
      });
      toast.success('Transfer successful');
      setShowTransferModal(false);
      setTransferData({ fromAccountId: '', toAccountId: '', amount: '', notes: '' });
      if (selectedAccountId) fetchTransactions(selectedAccountId);
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Transfer failed');
    }
  };

  const getAccountIcon = (type: string) => {
    switch (type) {
      case 'CASH': return <Wallet size={20} className="text-ji-amber" />;
      case 'BANK': return <Landmark size={20} className="text-emerald-600" />;
      case 'WALLET': return <Smartphone size={20} className="text-blue-500" />;
      default: return <Wallet size={20} />;
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="p-4 sm:p-6 space-y-6 max-w-[1600px] mx-auto"
    >
      {/* ─── Header ────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-ji-amber/10 border border-ji-amber/20 flex items-center justify-center">
            <Landmark size={28} className="text-ji-amber" />
          </div>
          <div>
            <h1 className="text-3xl font-['Playfair_Display'] font-black text-ji-text tracking-tight">Liquid Assets</h1>
            <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] mt-1 italic">Treasury & Internal Settlement Protocol</p>
          </div>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <button 
            onClick={() => fetchAccounts()}
            className="w-12 h-12 flex items-center justify-center border border-ji-border bg-white rounded-xl text-ji-text-dim hover:text-ji-amber hover:border-ji-amber transition-all shadow-sm group"
            title="Synchronize Registry"
          >
            <RefreshCw size={20} className={loading ? "animate-spin" : "group-hover:rotate-180 transition-transform duration-500"} />
          </button>
          <button 
            onClick={() => setShowTransferModal(true)}
            className="flex items-center justify-center gap-3 px-8 h-12 bg-ji-amber hover:bg-ji-amber/90 text-white font-black rounded-xl transition-all text-[10px] uppercase tracking-widest shadow-lg shadow-ji-amber/20 active:scale-95 flex-1 sm:flex-none"
          >
            <ArrowRightLeft size={16} />
            Transfer Liquidity
          </button>
        </div>
      </div>

      {/* ─── Stats Overview ────────────────────────── */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <StatCard 
          label="Total Liquidity" 
          value={totalBalance} 
          icon={<Wallet size={18} />} 
          variant="primary"
        />
        <StatCard 
          label="Vault / Cash" 
          value={accounts.filter(a => a.type === 'CASH').reduce((s, a) => s + a.balance, 0)} 
          icon={<Wallet size={18} />} 
        />
        <StatCard 
          label="Bank Reserves" 
          value={accounts.filter(a => a.type === 'BANK').reduce((s, a) => s + a.balance, 0)} 
          icon={<Landmark size={18} />} 
        />
        <StatCard 
          label="Digital Wallets" 
          value={accounts.filter(a => a.type === 'WALLET').reduce((s, a) => s + a.balance, 0)} 
          icon={<Smartphone size={18} />} 
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* ─── Accounts List ───────────────────────── */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white border border-ji-border rounded-[2rem] overflow-hidden shadow-sm">
            <div className="px-8 py-5 border-b border-ji-border flex items-center justify-between bg-ji-bg/30">
              <h2 className="text-[10px] font-black text-ji-text uppercase tracking-widest">Treasury Channels</h2>
              <span className="text-[9px] font-black text-ji-text-dim bg-white px-2 py-0.5 rounded-lg border border-ji-border">{accounts.length} TOTAL</span>
            </div>
            <div className="divide-y divide-ji-border/50">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccountId(acc.id)}
                  className={`w-full text-left px-8 py-6 flex items-center gap-5 transition-all hover:bg-ji-bg group relative ${
                    selectedAccountId === acc.id ? 'bg-ji-amber/5' : ''
                  }`}
                >
                  {selectedAccountId === acc.id && (
                    <motion.div layoutId="active-acc" className="absolute left-0 top-0 bottom-0 w-1.5 bg-ji-amber" />
                  )}
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${
                    selectedAccountId === acc.id ? 'bg-white border-2 border-ji-amber shadow-ji-amber/10' : 'bg-ji-bg border border-ji-border'
                  }`}>
                    {getAccountIcon(acc.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-black truncate transition-colors ${selectedAccountId === acc.id ? 'text-ji-text' : 'text-ji-text-dim group-hover:text-ji-text'}`}>
                      {acc.name}
                    </p>
                    <p className="text-[9px] text-ji-text-dim font-black uppercase tracking-widest mt-1 opacity-60">{acc.type}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-['JetBrains_Mono'] font-black text-base tracking-tighter ${selectedAccountId === acc.id ? 'text-ji-amber' : 'text-ji-text'}`}>
                      {formatCurrency(acc.balance).replace('₹', '')}
                    </p>
                    <div className="flex items-center justify-end gap-1 text-[9px] font-black text-ji-text-dim mt-1 uppercase opacity-40">
                      INR <ChevronRight size={10} className={`transition-transform ${selectedAccountId === acc.id ? 'translate-x-1 text-ji-amber opacity-100' : ''}`} />
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Ledger / Transactions ───────────────── */}
        <div className="lg:col-span-8 flex flex-col h-full min-h-[600px]">
          {selectedAccountId ? (
            <motion.div
              key={selectedAccountId}
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white border border-ji-border rounded-[2.5rem] flex flex-col h-full overflow-hidden shadow-sm"
            >
              {/* Ledger Header */}
              <div className="p-8 border-b border-ji-border flex flex-col md:flex-row items-center justify-between bg-ji-bg/30 gap-6">
                <div className="flex items-center gap-5">
                  <div className="w-16 h-16 rounded-2xl bg-white border border-ji-border shadow-sm flex items-center justify-center shrink-0">
                    {getAccountIcon(selectedAccount?.type || 'CASH')}
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text">{selectedAccount?.name}</h2>
                    <div className="flex items-center gap-3 mt-1.5 font-['JetBrains_Mono']">
                      <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest">Available Liquidity</span>
                      <span className="text-emerald-600 font-black text-base tracking-tighter">{formatCurrency(selectedAccount?.balance || 0)}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 bg-white border border-ji-border px-5 py-3 rounded-2xl w-full md:w-auto shadow-inner group focus-within:border-ji-amber transition-all">
                  <Search size={16} className="text-ji-text-dim group-focus-within:text-ji-amber" />
                  <input 
                    type="text" 
                    placeholder="Search Archive..." 
                    className="bg-transparent border-none text-xs font-bold text-ji-text placeholder:text-ji-text-dim/50 focus:ring-0 md:w-48 outline-none"
                  />
                </div>
              </div>

              {/* Transactions Table */}
              <div className="flex-1 overflow-x-auto">
                <table className="w-full text-left border-collapse whitespace-nowrap">
                  <thead>
                    <tr className="bg-ji-bg/50 text-[10px] text-ji-text-dim font-black uppercase tracking-[0.2em] border-b border-ji-border">
                      <th className="px-8 py-5">Timestamp</th>
                      <th className="px-8 py-5">Event Description</th>
                      <th className="px-8 py-5">Reference ID</th>
                      <th className="px-8 py-5 text-right">Settlement Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-ji-border/50">
                    {transactions.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-8 py-24 text-center">
                          <div className="flex flex-col items-center gap-4">
                            <div className="w-16 h-16 bg-ji-bg rounded-2xl flex items-center justify-center mb-2">
                              <BookOpen size={32} className="text-ji-text-dim opacity-30" />
                            </div>
                            <p className="text-ji-text font-black uppercase tracking-widest text-sm">Clear History</p>
                            <p className="text-[10px] text-ji-text-dim font-bold italic max-w-xs">No transactions identified for this treasury channel yet.</p>
                          </div>
                        </td>
                      </tr>
                    ) : (
                      transactions.map((txn) => (
                        <tr key={txn.id} className="hover:bg-ji-bg transition-colors group">
                          <td className="px-8 py-6">
                            <div className="flex flex-col">
                              <span className="text-xs font-black text-ji-text">{new Date(txn.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                              <span className="text-[10px] text-ji-text-dim font-black font-['JetBrains_Mono'] mt-1 opacity-60">
                                {new Date(txn.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-3">
                              <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                                txn.type.includes('CREDIT') || txn.type.includes('IN') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
                              }`}>
                                {txn.type.includes('CREDIT') || txn.type.includes('IN') ? <TrendingUp size={14} /> : <TrendingDown size={14} />}
                              </div>
                              <div>
                                <p className="text-sm font-bold text-ji-text italic">{txn.notes || 'Automated Protocol Settlement'}</p>
                                <p className="text-[9px] text-ji-text-dim font-black uppercase tracking-widest mt-1 opacity-50">Auth: {txn.createdBy?.name || 'System'}</p>
                              </div>
                            </div>
                          </td>
                          <td className="px-8 py-6">
                            <span className="text-[10px] font-black font-['JetBrains_Mono'] text-ji-text bg-ji-bg px-3 py-1.5 rounded-lg border border-ji-border">
                              {txn.reference || '—'}
                            </span>
                          </td>
                          <td className="px-8 py-6 text-right">
                            <p className={`font-['JetBrains_Mono'] font-black text-lg tracking-tighter ${
                              txn.type.includes('CREDIT') || txn.type.includes('IN')
                                ? 'text-emerald-600'
                                : 'text-red-500'
                            }`}>
                              {(txn.type.includes('CREDIT') || txn.type.includes('IN')) ? '↓' : '↑'} {formatCurrency(txn.amount).replace('₹', '')}
                            </p>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </motion.div>
          ) : (
            <div className="flex-1 border-2 border-dashed border-ji-border rounded-xl flex flex-col items-center justify-center p-12 text-center bg-ji-bg/20">
              <div className="w-20 h-20 rounded-full bg-ji-surface shadow-sm flex items-center justify-center mb-6">
                <Wallet size={40} className="text-ji-text-dim" />
              </div>
              <h3 className="text-xl font-['Playfair_Display'] font-semibold text-ji-text">Select an Account</h3>
              <p className="text-ji-text-muted max-w-sm mt-2">Pick an account from the left to view its detailed ledger and transaction history.</p>
            </div>
          )}
        </div>
      </div>

      {/* ─── Transfer Modal ───────────────────────── */}
      <AnimatePresence>
        {showTransferModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowTransferModal(false)}
              className="absolute inset-0 bg-ji-text/10 backdrop-blur-md"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 20 }}
              className="relative bg-white border border-ji-border rounded-[2.5rem] w-full max-w-lg shadow-2xl overflow-hidden"
            >
              <div className="p-10 border-b border-ji-border flex items-center justify-between bg-ji-bg/30">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-white border border-ji-border flex items-center justify-center shadow-sm">
                    <ArrowRightLeft className="text-ji-amber" />
                  </div>
                  <div>
                    <h2 className="text-2xl font-['Playfair_Display'] font-black text-ji-text">Transfer Liquidity</h2>
                    <p className="text-[10px] text-ji-text-dim font-black uppercase tracking-widest mt-1">Strategic Asset Realignment</p>
                  </div>
                </div>
                <button onClick={() => setShowTransferModal(false)} className="w-10 h-10 flex items-center justify-center rounded-xl text-ji-text-dim hover:text-ji-text hover:bg-ji-bg transition-all border border-ji-border">
                  ✕
                </button>
              </div>
              
              <form onSubmit={handleTransfer} className="p-10 space-y-8">
                <div className="grid grid-cols-2 gap-6 relative">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Source Account</label>
                    <select 
                      className="w-full bg-ji-bg border border-ji-border rounded-2xl p-4 text-xs font-bold text-ji-text focus:border-ji-amber outline-none shadow-inner"
                      value={transferData.fromAccountId}
                      onChange={(e) => setTransferData({...transferData, fromAccountId: e.target.value})}
                      required
                    >
                      <option value="">Select source...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>

                  <div className="absolute left-1/2 top-[55%] -translate-x-1/2 -translate-y-1/2 z-10">
                    <div className="w-10 h-10 rounded-full bg-white border border-ji-border flex items-center justify-center text-ji-amber shadow-lg transform rotate-90">
                      <ArrowRightLeft size={18} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Terminal Account</label>
                    <select 
                      className="w-full bg-ji-bg border border-ji-border rounded-2xl p-4 text-xs font-bold text-ji-text focus:border-ji-amber outline-none shadow-inner"
                      value={transferData.toAccountId}
                      onChange={(e) => setTransferData({...transferData, toAccountId: e.target.value})}
                      required
                    >
                      <option value="">Select target...</option>
                      {accounts.map(acc => (
                        <option key={acc.id} value={acc.id}>{acc.name} ({formatCurrency(acc.balance)})</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Liquidity Volume (INR)</label>
                  <div className="relative">
                    <span className="absolute left-5 top-1/2 -translate-y-1/2 text-sm font-black text-ji-text-dim">₹</span>
                    <input 
                      type="number"
                      step="0.01"
                      className="w-full bg-ji-bg border border-ji-border rounded-2xl pl-10 pr-5 py-4 text-lg font-black font-['JetBrains_Mono'] text-ji-text focus:border-ji-amber outline-none shadow-inner tracking-tighter"
                      placeholder="0.00"
                      value={transferData.amount}
                      onChange={(e) => setTransferData({...transferData, amount: e.target.value})}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-ji-text-dim uppercase tracking-widest ml-1">Strategic Protocol Notes</label>
                  <textarea 
                    className="w-full bg-ji-bg border border-ji-border rounded-2xl p-4 text-xs font-bold text-ji-text focus:border-ji-amber outline-none h-24 resize-none shadow-inner italic"
                    placeholder="Document transaction purpose..."
                    value={transferData.notes}
                    onChange={(e) => setTransferData({...transferData, notes: e.target.value})}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4 pt-4">
                  <button 
                    type="button"
                    onClick={() => setShowTransferModal(false)}
                    className="w-full py-4 border border-ji-border hover:bg-ji-bg text-ji-text-dim font-black uppercase tracking-widest text-[10px] rounded-2xl transition-all"
                  >
                    Abort
                  </button>
                  <button 
                    type="submit"
                    className="w-full py-4 bg-ji-amber hover:bg-ji-amber/90 text-white font-black uppercase tracking-widest text-[10px] rounded-2xl shadow-xl shadow-ji-amber/20 transition-all active:scale-95"
                  >
                    Authorize Transfer
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// ─── Stat Card Component ─────────────────────────────

function StatCard({ label, value, icon, variant = 'default' }: { label: string, value: number, icon: any, variant?: 'default' | 'primary' }) {
  return (
    <div className={`p-6 rounded-[2rem] border border-ji-border relative overflow-hidden transition-all hover:border-ji-amber/30 group shadow-sm bg-white`}>
      {/* Background UI Element */}
      <div className="absolute right-0 top-0 w-24 h-24 bg-ji-bg rounded-bl-[4rem] -mr-8 -mt-8 transition-transform group-hover:scale-110" />
      
      <div className="flex items-center gap-4 mb-4 relative z-10">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-sm ${
          variant === 'primary' 
          ? 'bg-ji-amber text-white shadow-ji-amber/20' 
          : 'bg-ji-bg text-ji-text-dim border border-ji-border/50'
        }`}>
          {icon}
        </div>
        <span className="text-[10px] font-black text-ji-text-dim uppercase tracking-[0.2em]">{label}</span>
      </div>
      
      <div className="flex items-baseline gap-2 relative z-10">
        <span className={`text-2xl font-['JetBrains_Mono'] font-black tracking-tighter ${variant === 'primary' ? 'text-ji-amber' : 'text-ji-text'}`}>
          {formatCurrency(value).replace('₹', '')}
        </span>
        <span className="text-[10px] font-black text-ji-text-dim opacity-40">INR</span>
      </div>
    </div>
  );
}
