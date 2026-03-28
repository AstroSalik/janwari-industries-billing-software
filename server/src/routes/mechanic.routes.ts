import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── Validation Schemas ─────────────────────────────

const mechanicSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  phone: z.string().min(10, 'Phone must be at least 10 digits'),
  commissionRate: z.number().min(0).max(100).default(5),
  specialization: z.string().optional().nullable(),
  active: z.boolean().default(true),
});

const settlementSchema = z.object({
  amount: z.number().positive(),
  periodFrom: z.string(),
  periodTo: z.string(),
  notes: z.string().optional(),
});

// ─── GET /mechanics — List mechanics with optional search ─

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const limit = parseInt(typeof req.query.limit === 'string' ? req.query.limit : '25', 10);

    const where: any = {};
    if (search) {
      where.OR = [
        { name: { contains: search } },
        { phone: { contains: search } },
      ];
    }

    const mechanics = await prisma.mechanic.findMany({
      where,
      orderBy: { name: 'asc' },
      take: limit,
    });

    res.json({ success: true, data: mechanics });
  } catch (error) {
    console.error('List mechanics error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch mechanics' });
  }
});

// ─── GET /mechanics/:id — Get single mechanic details ──

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const mechanic = await prisma.mechanic.findUnique({
      where: { id },
      include: {
        _count: { select: { invoices: true } }
      }
    });
    if (!mechanic) return res.status(404).json({ success: false, error: 'Mechanic not found' });
    res.json({ success: true, data: mechanic });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to fetch mechanic' });
  }
});

// ─── POST /mechanics — Create new mechanic ──────────

router.post('/', validate(mechanicSchema), async (req: Request, res: Response) => {
  try {
    const mechanic = await prisma.mechanic.create({
      data: req.body,
    });
    res.status(201).json({ success: true, data: mechanic });
  } catch (error: any) {
    if (error.code === 'P2002') {
      return res.status(400).json({ success: false, error: 'Phone number already registered' });
    }
    res.status(400).json({ success: false, error: 'Failed to create mechanic' });
  }
});

// ─── PUT /mechanics/:id — Update mechanic ───────────

router.put('/:id', validate(mechanicSchema.partial()), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const mechanic = await prisma.mechanic.update({
      where: { id },
      data: req.body,
    });
    res.json({ success: true, data: mechanic });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to update mechanic' });
  }
});

// ─── DELETE /mechanics/:id — Delete mechanic ────────

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    // Check if mechanic has invoices before deleting
    const mechanic = await (prisma.mechanic.findUnique({
      where: { id },
      include: { _count: { select: { invoices: true } } }
    }) as any);

    if (mechanic?._count?.invoices) {
      return res.status(400).json({ 
        success: false, 
        error: 'Cannot delete mechanic with existing invoices. Deactivate instead.' 
      });
    }

    await prisma.mechanic.delete({ where: { id } });
    res.json({ success: true, message: 'Mechanic deleted' });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to delete mechanic' });
  }
});

// ─── GET /mechanics/:id/ledger — Get commission history ─

router.get('/:id/ledger', async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    
    // Fetch invoices tagged to this mechanic
    const invoices = await prisma.invoice.findMany({
      where: { mechanicId: id, status: { not: 'CANCELLED' } },
      select: {
        id: true,
        invoiceNumber: true,
        grandTotal: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    // Fetch settlements record for this mechanic
    const settlements = await prisma.mechanicSettlement.findMany({
      where: { mechanicId: id },
      orderBy: { settledAt: 'desc' },
    });

    // Fetch mechanic for current rate
    const mechanic = await prisma.mechanic.findUnique({
      where: { id },
      select: { commissionRate: true }
    });

    if (!mechanic) return res.status(404).json({ success: false, error: 'Mechanic not found' });

    // Calculate details
    const ledgerEntries = [
      ...invoices.map(inv => ({
        id: inv.id,
        type: 'INVOICE',
        reference: inv.invoiceNumber,
        amount: (inv.grandTotal * mechanic.commissionRate) / 100,
        date: inv.createdAt,
      })),
      ...settlements.map(set => ({
        id: set.id,
        type: 'SETTLEMENT',
        reference: `Settlement #${set.id.slice(-4)}`,
        amount: -set.amount,
        date: set.settledAt,
        notes: set.notes
      }))
    ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    const totalEarned = invoices.reduce((sum, inv) => sum + (inv.grandTotal * mechanic.commissionRate) / 100, 0);
    const totalSettled = settlements.reduce((sum, set) => sum + set.amount, 0);

    res.json({
      success: true,
      data: {
        entries: ledgerEntries,
        summary: {
          totalEarned,
          totalSettled,
          balancePayable: totalEarned - totalSettled,
          commissionRate: mechanic.commissionRate
        }
      }
    });
  } catch (error) {
    console.error('Mechanic ledger error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch ledger' });
  }
});

// ─── POST /mechanics/:id/settlements — Record payout ──

router.post('/:id/settlements', validate(settlementSchema), async (req: Request, res: Response) => {
  try {
    const id = req.params.id as string;
    const { amount, periodFrom, periodTo, notes } = req.body;

    const settlement = await prisma.mechanicSettlement.create({
      data: {
        mechanicId: id,
        amount,
        periodFrom: new Date(periodFrom),
        periodTo: new Date(periodTo),
        notes,
      }
    });

    res.status(201).json({ success: true, data: settlement });
  } catch (error) {
    res.status(400).json({ success: false, error: 'Failed to record settlement' });
  }
});

export default router;
