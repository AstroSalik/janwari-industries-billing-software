import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── GET /khata/summary — List customers with outstanding balances ─

router.get('/summary', async (req: Request, res: Response) => {
  try {
    // Get all customers with their khata entries
    const customers = await prisma.customer.findMany({
      include: {
        khataEntries: true,
      },
      orderBy: { name: 'asc' },
    });

    const allSummary = customers.map((customer: any) => {
      let balance = 0;
      customer.khataEntries.forEach((entry: any) => {
        if (entry.type === 'DEBIT') balance += entry.amount;
        else if (entry.type === 'CREDIT' || entry.type === 'ADVANCE') balance -= entry.amount;
      });

      return {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        type: customer.type,
        stateCode: customer.stateCode,
        creditLimit: customer.creditLimit,
        outstandingBalance: balance,
        entryCount: customer.khataEntries.length,
      };
    });

    res.json({ success: true, data: allSummary });
  } catch (error) {
    console.error('List khata summary error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch khata summary' });
  }
});

// ─── GET /khata/customer/:id — Detailed ledger for a customer ───

router.get('/customer/:id', async (req: Request, res: Response) => {
  try {
    const customerId = req.params.id as string;
    const customer = await prisma.customer.findUnique({
      where: { id: customerId },
    });

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    const entries = await prisma.khataEntry.findMany({
      where: { customerId },
      include: {
        invoice: { select: { invoiceNumber: true } }
      },
      orderBy: { createdAt: 'desc' },
    });

    let balance = 0;
    // Calculate running balance from oldest to newest
    const entriesWithRunningBalance = [...entries].reverse().map(entry => {
      if (entry.type === 'DEBIT') balance += entry.amount;
      else if (entry.type === 'CREDIT' || entry.type === 'ADVANCE') balance -= entry.amount;
      return { ...entry, runningBalance: balance };
    }).reverse();

    res.json({
      success: true,
      data: {
        customer: {
          ...customer,
          currentBalance: balance,
        },
        entries: entriesWithRunningBalance,
      },
    });
  } catch (error) {
    console.error('Get khata ledger error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ledger' });
  }
});

// ─── POST /khata — Record a manual entry (Payment or Manual Due) ───

const createKhataSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  type: z.enum(['DEBIT', 'CREDIT', 'ADVANCE']),
  amount: z.number().positive('Amount must be positive'),
  notes: z.string().optional(),
});

router.post('/', validate(createKhataSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, type, amount, notes } = req.body;

    const entry = await prisma.khataEntry.create({
      data: {
        customerId,
        type,
        amount,
        notes,
      },
    });

    res.status(201).json({ success: true, data: entry, message: 'Khata entry recorded' });
  } catch (error) {
    console.error('Create khata entry error:', error);
    res.status(500).json({ success: false, error: 'Failed to record entry' });
  }
});

export default router;
