import { create } from 'zustand';
import api from '../lib/api';

export interface CashBankAccount {
  id: string;
  name: string;
  type: 'CASH' | 'BANK' | 'WALLET';
  balance: number;
  accountNo?: string;
  ifsc?: string;
  createdAt: string;
}

export interface AccountTransaction {
  id: string;
  accountId: string;
  type: 'DEBIT' | 'CREDIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
  amount: number;
  reference?: string;
  notes?: string;
  invoiceId?: string;
  date: string;
  createdBy?: { name: string };
}

interface AccountState {
  accounts: CashBankAccount[];
  transactions: AccountTransaction[];
  totalBalance: number;
  loading: boolean;
  fetchAccounts: () => Promise<void>;
  fetchTransactions: (accountId: string, page?: number) => Promise<{ total: number }>;
  transfer: (data: {
    fromAccountId: string;
    toAccountId: string;
    amount: number;
    reference?: string;
    notes?: string;
  }) => Promise<void>;
}

export const useAccountStore = create<AccountState>((set, get) => ({
  accounts: [],
  transactions: [],
  totalBalance: 0,
  loading: false,

  fetchAccounts: async () => {
    set({ loading: true });
    try {
      const response = await api.get('/accounts');
      const accounts = response.data.data;
      const total = accounts.reduce((sum: number, acc: CashBankAccount) => sum + acc.balance, 0);
      set({ accounts, totalBalance: total });
    } catch (error) {
      console.error('Fetch accounts error:', error);
    } finally {
      set({ loading: false });
    }
  },

  fetchTransactions: async (accountId, page = 1) => {
    set({ loading: true });
    try {
      const response = await api.get(`/accounts/${accountId}/transactions?page=${page}`);
      const { data, total } = response.data;
      set({ transactions: data });
      return { total };
    } catch (error) {
      console.error('Fetch transactions error:', error);
      return { total: 0 };
    } finally {
      set({ loading: false });
    }
  },

  transfer: async (data) => {
    await api.post('/accounts/transfer', data);
    // Refresh accounts after transfer
    await get().fetchAccounts();
  },
}));
