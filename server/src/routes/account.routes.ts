import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';
import { validate } from '../middleware/validate.middleware';
import { AccountService } from '../services/account.service';

const router = Router();
router.use(authMiddleware);

/**
 * GET /api/accounts
 * Lists all cash, bank, and wallet accounts with their current balances.
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const accounts = await prisma.cashBankAccount.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: accounts });
  } catch (error) {
    console.error('List accounts error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch accounts' });
  }
});

/**
 * GET /api/accounts/:id/transactions
 * Fetches paginated transaction history for a specific account.
 */
router.get('/:id/transactions', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10);
    const limit = parseInt(typeof req.query.limit === 'string' ? req.query.limit : '50', 10);
    const skip = (page - 1) * limit;

    const [transactions, total] = await Promise.all([
      prisma.accountTransaction.findMany({
        where: { accountId: id as string },
        include: {
          createdBy: { select: { name: true } }
        },
        orderBy: { date: 'desc' },
        skip,
        take: limit,
      }),
      prisma.accountTransaction.count({ where: { accountId: id as string } }),
    ]);

    res.json({ success: true, data: transactions, total, page, limit });
  } catch (error) {
    console.error('List transactions error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch transaction history' });
  }
});

// ─── Transfers ──────────────────────────────────────

const transferSchema = z.object({
  fromAccountId: z.string().min(1, 'Source account is required'),
  toAccountId: z.string().min(1, 'Destination account is required'),
  amount: z.number().positive('Transfer amount must be positive'),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

/**
 * POST /api/accounts/transfer
 * Moves money BETWEEN two managed accounts (e.g., depositing cash to bank).
 */
router.post('/transfer', validate(transferSchema), async (req: Request, res: Response) => {
  try {
    const { fromAccountId, toAccountId, amount, reference, notes } = req.body;
    const userId = req.user!.userId;

    if (fromAccountId === toAccountId) {
      return res.status(400).json({ success: false, error: 'Cannot transfer to the same account' });
    }

    await AccountService.transfer({
      fromAccountId,
      toAccountId,
      amount,
      reference,
      notes,
      userId,
    });

    res.json({ success: true, message: 'Transfer completed successfully' });
  } catch (error: any) {
    console.error('Transfer error:', error);
    res.status(400).json({ success: false, error: error.message || 'Failed to complete transfer' });
  }
});

export default router;
