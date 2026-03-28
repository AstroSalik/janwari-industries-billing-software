import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── GET /batteries — All serial numbers with status ─

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10);
    const limit = parseInt(typeof req.query.limit === 'string' ? req.query.limit : '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};
    if (search) {
      where.OR = [
        { serial: { contains: search } },
        { product: { name: { contains: search } } },
      ];
    }
    if (status) {
      where.status = status;
    }

    const [batteries, total] = await Promise.all([
      prisma.serialNumber.findMany({
        where,
        include: {
          product: { select: { name: true, brand: true, voltage: true, ahRating: true, warrantyFreeMonths: true, warrantyProRataMonths: true } },
          invoiceItem: {
            select: {
              invoice: {
                select: { invoiceNumber: true, createdAt: true, customer: { select: { name: true, phone: true } } },
              },
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.serialNumber.count({ where }),
    ]);

    res.json({ success: true, data: batteries, total, page, limit });
  } catch (error) {
    console.error('List batteries error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch batteries' });
  }
});

// ─── GET /batteries/:id/warranty — Warranty status ──

router.get('/:id/warranty', async (req: Request, res: Response) => {
  try {
    const serial: any = await prisma.serialNumber.findUnique({
      where: { id: req.params.id as string },
      include: {
        product: true,
        invoiceItem: {
          include: {
            invoice: { include: { customer: true } },
            warranty: true,
          },
        },
      },
    });

    if (!serial) {
      res.status(404).json({ success: false, error: 'Serial number not found' });
      return;
    }

    // Calculate warranty status
    const product = serial.product;
    const invoiceItem = serial.invoiceItem;
    const purchaseDate = invoiceItem?.invoice?.createdAt;

    let warrantyResult: any = { status: 'UNKNOWN', message: 'Battery not yet sold' };

    if (purchaseDate && product.warrantyFreeMonths != null) {
      const now = new Date();
      const purchaseDateObj = new Date(purchaseDate);
      const monthsElapsed = (now.getFullYear() - purchaseDateObj.getFullYear()) * 12 +
        (now.getMonth() - purchaseDateObj.getMonth());

      const freeMonths = product.warrantyFreeMonths;
      const proRataMonths = product.warrantyProRataMonths || 0;
      const totalWarrantyMonths = freeMonths + proRataMonths;

      if (monthsElapsed <= freeMonths) {
        warrantyResult = {
          status: 'FREE_REPLACEMENT',
          message: `Within free replacement period (${freeMonths - monthsElapsed} months remaining)`,
          monthsElapsed,
          freeMonths,
          proRataMonths,
        };
      } else if (monthsElapsed <= totalWarrantyMonths) {
        const remainingProRata = totalWarrantyMonths - monthsElapsed;
        const proRataAmount = Math.round((product.mrp * remainingProRata / proRataMonths) * 100) / 100;
        warrantyResult = {
          status: 'PRO_RATA',
          message: `Pro-rata warranty (${remainingProRata} months remaining)`,
          monthsElapsed,
          freeMonths,
          proRataMonths,
          remainingProRata,
          proRataAmount,
          originalMRP: product.mrp,
        };
      } else {
        warrantyResult = {
          status: 'EXPIRED',
          message: `Warranty expired (${monthsElapsed - totalWarrantyMonths} months ago)`,
          monthsElapsed,
          freeMonths,
          proRataMonths,
        };
      }
    }

    res.json({
      success: true,
      data: {
        serial,
        warranty: warrantyResult,
        customer: invoiceItem?.invoice?.customer || null,
        purchaseDate,
      },
    });
  } catch (error) {
    console.error('Get warranty error:', error);
    res.status(500).json({ success: false, error: 'Failed to check warranty' });
  }
});

// ─── GET /batteries/graveyard — Scrap batteries ─────

router.get('/graveyard/list', async (req: Request, res: Response) => {
  try {
    const entries = await prisma.batteryGraveyard.findMany({
      include: {
        serialNumber: { include: { product: { select: { name: true, brand: true } } } },
      },
      orderBy: { createdAt: 'desc' },
      take: 100,
    });

    res.json({ success: true, data: entries });
  } catch (error) {
    console.error('List graveyard error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch graveyard' });
  }
});

// ─── POST /batteries/graveyard — Add to graveyard ───

const addGraveyardSchema = z.object({
  serialNumberId: z.string().optional(),
  condition: z.enum(['DEAD', 'DAMAGED', 'REFURBISHABLE', 'GOOD']),
  estimatedWeight: z.number().optional(),
  sourceInvoiceNo: z.string().optional(),
});

router.post('/graveyard', validate(addGraveyardSchema), async (req: Request, res: Response) => {
  try {
    const entry = await prisma.batteryGraveyard.create({ data: req.body });
    res.status(201).json({ success: true, data: entry, message: 'Battery added to graveyard' });
  } catch (error) {
    console.error('Add graveyard error:', error);
    res.status(500).json({ success: false, error: 'Failed to add to graveyard' });
  }
});

export default router;
