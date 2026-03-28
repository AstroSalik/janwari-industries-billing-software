import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { AccountService } from '../services/account.service';

const router = Router();
router.use(authMiddleware);

// ─── SUPPLIERS ──────────────────────────────────────

router.get('/suppliers', async (req: Request, res: Response) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: suppliers });
  } catch (error) {
    console.error('List suppliers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch suppliers' });
  }
});

const createSupplierSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  phone: z.string().optional(),
  gstin: z.string().optional(),
  address: z.string().optional(),
  stateCode: z.string().default('01'),
  paymentTerms: z.string().optional(),
});

router.post('/suppliers', validate(createSupplierSchema), async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.create({ data: req.body });
    res.status(201).json({ success: true, data: supplier, message: 'Supplier added successfully' });
  } catch (error) {
    console.error('Create supplier error:', error);
    res.status(500).json({ success: false, error: 'Failed to create supplier' });
  }
});

router.put('/suppliers/:id', validate(createSupplierSchema.partial()), async (req: Request, res: Response) => {
  try {
    const supplier = await prisma.supplier.update({
      where: { id: req.params.id as string },
      data: req.body,
    });
    res.json({ success: true, data: supplier, message: 'Supplier updated successfully' });
  } catch (error) {
    console.error('Update supplier error:', error);
    res.status(500).json({ success: false, error: 'Failed to update supplier' });
  }
});

// ─── PURCHASES ──────────────────────────────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10);
    const limit = parseInt(typeof req.query.limit === 'string' ? req.query.limit : '50', 10);
    const skip = (page - 1) * limit;

    const [purchases, total] = await Promise.all([
      prisma.purchase.findMany({
        include: {
          supplier: true,
          items: { include: { product: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.purchase.count(),
    ]);

    res.json({ success: true, data: purchases, total, page, limit });
  } catch (error) {
    console.error('List purchases error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch purchases' });
  }
});

const createPurchaseSchema = z.object({
  supplierId: z.string().min(1, 'Supplier is required'),
  invoiceRef: z.string().optional(),
  invoiceDate: z.string().optional(),
  isPaid: z.boolean().default(false),
  items: z.array(z.object({
    productId: z.string().min(1, 'Product is required'),
    quantity: z.number().positive(),
    rate: z.number().nonnegative(),
    gstRate: z.number().nonnegative(),
  })).min(1, 'At least one item is required'),
  paymentMode: z.enum(['CASH', 'BANK', 'UPI']).optional(),
  reference: z.string().optional(),
});

router.post('/', validate(createPurchaseSchema), async (req: Request, res: Response) => {
  try {
    const { supplierId, invoiceRef, invoiceDate, isPaid, items, paymentMode, reference } = req.body;
    const userId = req.user!.userId;

    // Calculate totals
    let totalAmount = 0;
    const itemsData = items.map((item: any) => {
      const lineTotal = item.quantity * item.rate * (1 + item.gstRate / 100);
      totalAmount += lineTotal;
      return {
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
        gstRate: item.gstRate,
        lineTotal: Math.round(lineTotal * 100) / 100,
      };
    });

    // Run in transaction: create purchase + update stock
    const purchase = await prisma.$transaction(async (tx) => {
      const p = await tx.purchase.create({
        data: {
          supplierId,
          invoiceRef,
          invoiceDate: invoiceDate ? new Date(invoiceDate) : null,
          isPaid,
          paymentMode,
          reference,
          totalAmount: Math.round(totalAmount * 100) / 100,
          items: {
            create: itemsData,
          },
        },
      });

      // If paid, record in logical accounts
      if (isPaid && paymentMode) {
        await AccountService.handlePurchasePayment({
          mode: paymentMode as any,
          amount: totalAmount,
          reference: reference || invoiceRef,
          notes: `Purchase from supplier (Ref: ${invoiceRef || 'N/A'})`,
          userId,
        }, tx);
      }

      // Update stock for each item (in Shop Floor by default for now)
      const shopFloor = await tx.location.findUnique({ where: { name: 'Shop Floor' } });
      if (shopFloor) {
        for (const item of itemsData) {
          // Find if stock entry exists
          const stock = await tx.stock.findFirst({
            where: { productId: item.productId, locationId: shopFloor.id },
          });

          if (stock) {
            await tx.stock.update({
              where: { id: stock.id },
              data: { quantity: { increment: item.quantity } },
            });
          } else {
            // It shouldn't happen usually if products are seeded correctly, but just in case
            await tx.stock.create({
              data: {
                productId: item.productId,
                locationId: shopFloor.id,
                quantity: item.quantity,
              },
            });
          }
        }
      }

      return p;
    });

    res.status(201).json({ success: true, data: purchase, message: 'Purchase order created & stock updated' });
  } catch (error) {
    console.error('Create purchase error:', error);
    res.status(500).json({ success: false, error: 'Failed to create purchase' });
  }
});

export default router;
