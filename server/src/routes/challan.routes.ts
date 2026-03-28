import express from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = express.Router();
router.use(authMiddleware);

// ─── Helpers ────────────────────────────────────────────────

function getFiscalYear(date: Date): string {
  const month = date.getMonth();
  const year = date.getFullYear();
  if (month >= 3) {
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

async function generateChallanNumber(): Promise<string> {
  const now = new Date();
  const fy = getFiscalYear(now);
  const prefix = `DC/${fy}/`;

  const lastChallan = await prisma.deliveryChallan.findFirst({
    where: { challanNumber: { startsWith: prefix } },
    orderBy: { challanNumber: 'desc' },
    select: { challanNumber: true },
  });

  let nextSeq = 1;
  if (lastChallan) {
    const lastSeq = parseInt(lastChallan.challanNumber.split('/').pop() || '0', 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ─── Schemas ────────────────────────────────────────────────

const challanItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  rate: z.number().optional().nullable(),
  discount: z.number().default(0),
  gstRate: z.number().default(0),
  serialNumberId: z.string().optional().nullable(),
});

const createChallanSchema = z.object({
  customerId: z.string().optional().nullable(),
  vehicleId: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
  showAmount: z.boolean().default(false),
  items: z.array(challanItemSchema).min(1, 'At least one item required'),
});

// ─── Routes ─────────────────────────────────────────────────

// Create a Delivery Challan
router.post('/', async (req, res) => {
  try {
    const data = createChallanSchema.parse(req.body);
    const userId = (req as any).user.id;
    const challanNumber = await generateChallanNumber();

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the Challan
      const challan = await tx.deliveryChallan.create({
        data: {
          challanNumber,
          customerId: data.customerId || undefined,
          vehicleId: data.vehicleId || undefined,
          notes: data.notes,
          showAmount: data.showAmount,
          createdById: userId,
          status: 'PENDING',
          items: {
            create: data.items.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              rate: item.rate,
              discount: item.discount,
              gstRate: item.gstRate,
              serialNumberId: item.serialNumberId || undefined,
            })),
          },
        },
        include: { items: true },
      });

      // 2. Deduct Stock from Shop Floor
      const shopFloor = await tx.location.findUnique({ where: { name: 'Shop Floor' } });
      if (shopFloor) {
        for (const item of data.items) {
          // If product is a battery, ensure serial is provided and mark as SOLD
          if (item.serialNumberId) {
            await tx.serialNumber.update({
              where: { id: item.serialNumberId },
              data: { status: 'SOLD' }, // Mark sold/dispatched
            });
          }
          
          await tx.stock.updateMany({
            where: { productId: item.productId, locationId: shopFloor.id },
            data: { quantity: { decrement: item.quantity } },
          });
        }
      }

      return challan;
    });

    res.status(201).json({ success: true, data: result });
  } catch (error: any) {
    console.error('Create challan error:', error);
    res.status(400).json({ success: false, error: error.message });
  }
});

// List Challans
router.get('/', async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 50;
    const status = req.query.status as any;

    const where = status ? { status } : {};

    const [challans, total] = await Promise.all([
      prisma.deliveryChallan.findMany({
        where,
        include: {
          customer: { select: { name: true, phone: true } },
          _count: { select: { items: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.deliveryChallan.count({ where }),
    ]);

    res.json({ success: true, data: challans, total, page, limit });
  } catch (error: any) {
    console.error('List challans error:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get Single Challan
router.get('/:id', async (req, res) => {
  try {
    const challan = await prisma.deliveryChallan.findUnique({
      where: { id: req.params.id },
      include: {
        customer: true,
        createdBy: { select: { name: true } },
        items: {
          include: {
            product: true,
            serialNumber: true,
          },
        },
        invoice: { select: { invoiceNumber: true } },
      },
    });

    if (!challan) {
      return res.status(404).json({ success: false, error: 'Challan not found' });
    }

    res.json({ success: true, data: challan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Update Status
router.put('/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['PENDING', 'DELIVERED', 'RETURNED', 'CANCELLED'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const challan = await prisma.deliveryChallan.update({
      where: { id: req.params.id },
      data: { 
        status,
        deliveredAt: status === 'DELIVERED' ? new Date() : undefined 
      },
    });

    res.json({ success: true, data: challan });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Convert to Invoice
router.post('/:id/convert', async (req, res) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const challan = await prisma.deliveryChallan.findUnique({
      where: { id },
      include: { items: true },
    });

    if (!challan) {
      return res.status(404).json({ success: false, error: 'Challan not found' });
    }

    if (challan.status === 'INVOICED') {
      return res.status(400).json({ success: false, error: 'Challan is already invoiced' });
    }

    if (challan.status === 'CANCELLED' || challan.status === 'RETURNED') {
      return res.status(400).json({ success: false, error: 'Cannot convert a cancelled or returned challan' });
    }

    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Get next invoice number
      // We'll calculate a fresh one just like in finalize
      const prefix = `JI/${getFiscalYear(new Date())}/`;
      const lastInvoice = await tx.invoice.findFirst({
        where: { invoiceNumber: { startsWith: prefix } },
        orderBy: { invoiceNumber: 'desc' },
        select: { invoiceNumber: true },
      });
      let nextSeq = 1;
      if (lastInvoice) {
        nextSeq = parseInt(lastInvoice.invoiceNumber.split('/').pop() || '0', 10) + 1;
      }
      const invoiceNumber = `${prefix}${String(nextSeq).padStart(4, '0')}`;

      // Calculate totals
      let subtotal = 0;
      let totalDiscount = 0;
      let totalGst = 0;
      const invoiceItems = challan.items.map(item => {
        const lineVal = (item.rate || 0) * item.quantity;
        const lineTaxable = lineVal - item.discount;
        const lineGst = Math.round((lineTaxable * item.gstRate / 100) * 100) / 100;
        
        subtotal += lineVal;
        totalDiscount += item.discount;
        totalGst += lineGst;

        return {
          productId: item.productId,
          serialNumberId: item.serialNumberId,
          quantity: item.quantity,
          rate: item.rate || 0,
          discount: item.discount,
          gstRate: item.gstRate,
          cgst: lineGst / 2,
          sgst: lineGst / 2,
          igst: 0, // Assume intra-state for simplicity, UI editing handles inter-state
          lineTotal: Math.round((lineTaxable + lineGst) * 100) / 100,
        };
      });

      const grandTotal = Math.round((subtotal - totalDiscount + totalGst) * 100) / 100;

      // 2. Create the invoice
      const invoice = await tx.invoice.create({
        data: {
          invoiceNumber,
          type: 'TAX_INVOICE',
          status: 'DRAFT', // Creates a draft invoice to be finalized by the UI
          customerId: challan.customerId || undefined,
          vehicleId: challan.vehicleId || undefined,
          createdById: userId,
          subtotal: Math.round(subtotal * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          totalGst: Math.round(totalGst * 100) / 100,
          grandTotal,
          paidAmount: 0,
          balanceAmount: grandTotal,
          items: {
            create: invoiceItems
          }
        }
      });

      // 3. Update challan status & link invoice
      await tx.deliveryChallan.update({
        where: { id },
        data: { 
          status: 'INVOICED',
          invoiceId: invoice.id 
        }
      });

      return invoice;
    });

    res.json({ success: true, data: result });
  } catch (error: any) {
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
