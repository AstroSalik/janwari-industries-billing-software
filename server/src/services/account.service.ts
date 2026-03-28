import prisma from '../lib/prisma';

/**
 * AccountService handles the business logic for Cash & Bank Accounts,
 * including recording transactions, updating balances, and handling transfers.
 */
export class AccountService {
  /**
   * Records a transaction and updates the account balance atomically.
   * Can be passed a prisma transaction client (tx) for multi-model operations.
   */
  static async recordTransaction(
    params: {
      accountId: string;
      type: 'DEBIT' | 'CREDIT' | 'TRANSFER_IN' | 'TRANSFER_OUT';
      amount: number;
      reference?: string;
      notes?: string;
      invoiceId?: string;
      createdById?: string;
    },
    tx: any = prisma
  ) {
    const { accountId, type, amount, reference, notes, invoiceId, createdById } = params;

    // 1. Update account balance
    // CREDIT and TRANSFER_IN increase the balance
    // DEBIT and TRANSFER_OUT decrease the balance
    const balanceChange = (type === 'CREDIT' || type === 'TRANSFER_IN') ? amount : -amount;

    await tx.cashBankAccount.update({
      where: { id: accountId },
      data: {
        balance: {
          increment: balanceChange
        }
      }
    });

    // 2. Create the transaction record
    return tx.accountTransaction.create({
      data: {
        accountId,
        type,
        amount,
        reference,
        notes,
        invoiceId,
        createdById,
        date: new Date(),
      }
    });
  }

  /**
   * Helper to automatically handle a payment coming from a Sale (Invoice).
   * Maps payment modes to default accounts.
   */
  static async handleSalePayment(
    params: {
      mode: 'CASH' | 'UPI' | 'CHEQUE';
      amount: number;
      reference?: string;
      invoiceId: string;
      userId: string;
    },
    tx: any = prisma
  ) {
    // Map modes to seeded account names
    let accountName = 'Cash Drawer';
    if (params.mode === 'UPI') accountName = 'UPI Wallet (PhonePe)';
    if (params.mode === 'CHEQUE') accountName = 'SBI Bank Account'; // Fixed from seed SBI name

    const account = await tx.cashBankAccount.findUnique({
      where: { name: accountName }
    });

    if (!account) {
      // Fallback to Cash Drawer if specific account doesn't exist (safety)
      const cashAccount = await tx.cashBankAccount.findFirst({
        where: { type: 'CASH' }
      });
      
      if (!cashAccount) {
        throw new Error(`No available accounts to process ${params.mode} payment`);
      }
      
      return this.recordTransaction({
        accountId: cashAccount.id,
        type: 'CREDIT',
        amount: params.amount,
        reference: params.reference,
        notes: `Sale payment via ${params.mode} (Routed to ${cashAccount.name})`,
        invoiceId: params.invoiceId,
        createdById: params.userId,
      }, tx);
    }

    return this.recordTransaction({
      accountId: account.id,
      type: 'CREDIT',
      amount: params.amount,
      reference: params.reference,
      notes: `Sale payment via ${params.mode}`,
      invoiceId: params.invoiceId,
      createdById: params.userId,
    }, tx);
  }

  /**
   * Helper to handle a payment for a Purchase.
   */
  static async handlePurchasePayment(
    params: {
      mode: 'CASH' | 'BANK' | 'UPI';
      amount: number;
      reference?: string;
      notes?: string;
      userId: string;
    },
    tx: any = prisma
  ) {
    let accountName = 'Cash Drawer';
    if (params.mode === 'UPI') accountName = 'UPI Wallet (PhonePe)';
    if (params.mode === 'BANK') accountName = 'SBI Bank Account';

    const account = await tx.cashBankAccount.findUnique({
      where: { name: accountName }
    });

    if (!account) {
      throw new Error(`Account for ${params.mode} (${accountName}) not found`);
    }

    return this.recordTransaction({
      accountId: account.id,
      type: 'DEBIT',
      amount: params.amount,
      reference: params.reference,
      notes: params.notes || `Purchase Payment`,
      createdById: params.userId,
    }, tx);
  }

  /**
   * Internal transfer between two managed accounts.
   */
  static async transfer(
    params: {
      fromAccountId: string;
      toAccountId: string;
      amount: number;
      reference?: string;
      notes?: string;
      userId: string;
    }
  ) {
    return prisma.$transaction(async (tx) => {
      // 1. Log the money moving OUT
      await this.recordTransaction({
        accountId: params.fromAccountId,
        type: 'TRANSFER_OUT',
        amount: params.amount,
        reference: params.reference,
        notes: params.notes || `Transfer to another account`,
        createdById: params.userId,
      }, tx);

      // 2. Log the money moving IN
      await this.recordTransaction({
        accountId: params.toAccountId,
        type: 'TRANSFER_IN',
        amount: params.amount,
        reference: params.reference,
        notes: params.notes || `Transfer from another account`,
        createdById: params.userId,
      }, tx);
    });
  }
}
