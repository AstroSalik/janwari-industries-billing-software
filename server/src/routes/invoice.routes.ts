import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';
import { AccountService } from '../services/account.service';
import { AuditService } from '../services/audit.service';

const router = Router();
router.use(authMiddleware);

// ─── Invoice Number Generator ───────────────────────
// Format: JI/YYYY-YY/XXXX (e.g., JI/2025-26/0001)
// Fiscal year: April 1 to March 31

function getFiscalYear(date: Date): string {
  const month = date.getMonth(); // 0-indexed
  const year = date.getFullYear();
  if (month >= 3) { // April onwards
    return `${year}-${String(year + 1).slice(2)}`;
  }
  return `${year - 1}-${String(year).slice(2)}`;
}

function toSku(value: string, fallback: string) {
  const normalized = value
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 24);

  return normalized || fallback;
}

async function generateInvoiceNumber(): Promise<string> {
  const now = new Date();
  const fy = getFiscalYear(now);
  const prefix = `JI/${fy}/`;

  // Find the last invoice number for this fiscal year
  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.split('/').pop() || '0', 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

async function generateCreditNoteNumber(): Promise<string> {
  const now = new Date();
  const fy = getFiscalYear(now);
  const prefix = `CR/${fy}/`;

  const lastInvoice = await prisma.invoice.findFirst({
    where: { invoiceNumber: { startsWith: prefix } },
    orderBy: { invoiceNumber: 'desc' },
    select: { invoiceNumber: true },
  });

  let nextSeq = 1;
  if (lastInvoice) {
    const lastSeq = parseInt(lastInvoice.invoiceNumber.split('/').pop() || '0', 10);
    nextSeq = lastSeq + 1;
  }

  return `${prefix}${String(nextSeq).padStart(4, '0')}`;
}

// ─── Validation Schemas ─────────────────────────────

const invoiceItemSchema = z.object({
  productId: z.string(),
  quantity: z.number().positive(),
  rate: z.number().positive(),
  discount: z.number().min(0).default(0),
  gstRate: z.number().min(0),
  hsnCode: z.string().optional(),
  serialNumber: z.string().optional(),
  isBattery: z.boolean().default(false),
  isExchange: z.boolean().default(false),
  isWarrantyClaim: z.boolean().default(false),
  isCustomItem: z.boolean().default(false),
  claimType: z.enum(['FREE', 'PRO_RATA']).optional(),
  originalSerialId: z.string().optional(),
  descriptionText: z.string().optional(),
  unit: z.string().optional(),
});

const finalizeSchema = z.object({
  customerId: z.string().optional(),
  mechanicId: z.string().optional(),
  items: z.array(invoiceItemSchema).min(1, 'At least one item is required'),
  payments: z.array(z.object({
    mode: z.enum(['CASH', 'UPI', 'CHEQUE', 'CREDIT']),
    amount: z.number().positive(),
    reference: z.string().optional(),
  })).optional(),
  notes: z.string().optional(),
  type: z.enum(['TAX_INVOICE', 'QUOTE']).default('TAX_INVOICE'),
});

const returnItemSchema = z.object({
  invoiceItemId: z.string(),
  returnQty: z.number().positive(),
});

const returnSchema = z.object({
  items: z.array(returnItemSchema).min(1, 'At least one item is required'),
  refundMode: z.enum(['CASH', 'CREDIT']),
  returnReason: z.string().optional(),
});

const addPaymentSchema = z.object({
  mode: z.enum(['CASH', 'UPI', 'CHEQUE']),
  amount: z.number().positive(),
  reference: z.string().optional(),
  notes: z.string().optional(),
});

// ─── POST /invoices/finalize — Atomic invoice creation ─

router.post('/finalize', validate(finalizeSchema), async (req: Request, res: Response) => {
  try {
    const { customerId, mechanicId, items, payments = [], notes, type } = req.body;
    const userId = req.user!.userId;

    // Check if customer is inter-state
    let customer = null;
    if (customerId) {
      customer = await prisma.customer.findUnique({ where: { id: customerId } });
      if (!customer) {
        res.status(404).json({ success: false, error: 'Customer not found' });
        return;
      }
    }
    const isIGST = customer ? customer.stateCode !== '01' : false;

    // Calculate line-level GST
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;

    const itemsData = items.map((item: any) => {
      const lineTotal = item.rate * item.quantity;
      const lineDiscount = item.discount * item.quantity;
      const taxable = lineTotal - lineDiscount;
      const gst = Math.round((taxable * item.gstRate / 100) * 100) / 100;
      const lineFinal = Math.round((taxable + gst) * 100) / 100;

      subtotal += lineTotal;
      totalDiscount += lineDiscount;
      totalGst += gst;

      return {
        productId: item.productId,
        quantity: item.quantity,
        rate: item.rate,
        discount: item.discount,
        gstRate: item.gstRate,
        cgst: isIGST ? 0 : Math.round((gst / 2) * 100) / 100,
        sgst: isIGST ? 0 : Math.round((gst / 2) * 100) / 100,
        igst: isIGST ? gst : 0,
        lineTotal: lineFinal,
        description: item.hsnCode ? `HSN: ${item.hsnCode}` : undefined,
        serialNumber: item.serialNumber,
        isBattery: item.isBattery,
        isExchange: item.isExchange,
        isWarrantyClaim: item.isWarrantyClaim,
        isCustomItem: item.isCustomItem,
        claimType: item.claimType,
        originalSerialId: item.originalSerialId,
        descriptionText: item.descriptionText,
        unit: item.unit,
      };
    });

    const grandTotal = Math.round((subtotal - totalDiscount + totalGst) * 100) / 100;
    const totalPaid = payments.reduce((sum: number, p: any) => sum + p.amount, 0);
    const balanceAmount = Math.round((grandTotal - totalPaid) * 100) / 100;

    // Determine status
    let status: 'DRAFT' | 'FINALIZED' | 'PAID' | 'PARTIAL' = 'FINALIZED';
    if (type === 'QUOTE') {
      status = 'DRAFT';
    } else if (balanceAmount <= 0) {
      status = 'PAID';
    } else if (totalPaid > 0) {
      status = 'PARTIAL';
    }

    // Generate invoice number
    const invoiceNumber = await generateInvoiceNumber();

    // Atomic transaction: create invoice + items + payments + update stock
    const invoice = await prisma.$transaction(async (tx: any) => {
      let exchangeProductId: string | null = null;
      const customProducts = new Map<string, string>();

      // 1. Create invoice
      const inv = await tx.invoice.create({
        data: {
          invoiceNumber,
          type,
          status,
          customerId: customerId || undefined,
          mechanicId: mechanicId || undefined,
          createdById: userId,
          subtotal: Math.round(subtotal * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          totalGst: Math.round(totalGst * 100) / 100,
          grandTotal,
          paidAmount: totalPaid,
          balanceAmount,
          notes,
        },
      });

      // 2. Create invoice items
      for (const item of itemsData) {
        let resolvedProductId = item.productId;

        if (item.isExchange) {
          if (!exchangeProductId) {
            let exchangeProduct = await tx.product.findFirst({
              where: { sku: 'SCRAP_IN' },
              select: { id: true },
            });

            if (!exchangeProduct) {
              let exchangeCategory = await tx.category.findUnique({
                where: { name: 'Battery Exchange' },
                select: { id: true },
              });

              if (!exchangeCategory) {
                exchangeCategory = await tx.category.create({
                  data: { name: 'Battery Exchange' },
                  select: { id: true },
                });
              }

              exchangeProduct = await tx.product.create({
                data: {
                  name: 'Battery Exchange Credit',
                  brand: 'Janwari',
                  sku: 'SCRAP_IN',
                  hsnCode: '8548',
                  gstRate: 0,
                  mrp: 0,
                  isBattery: true,
                  unit: 'pcs',
                  categoryId: exchangeCategory.id,
                },
                select: { id: true },
              });
            }

            exchangeProductId = exchangeProduct.id;
          }

          resolvedProductId = exchangeProductId;
        }

        if (item.isCustomItem) {
          const customKey = `${item.descriptionText || item.productId}|${item.gstRate}|${item.hsnCode || ''}`;

          if (!customProducts.has(customKey)) {
            let customCategory = await tx.category.findUnique({
              where: { name: 'Custom Items' },
              select: { id: true },
            });

            if (!customCategory) {
              customCategory = await tx.category.create({
                data: { name: 'Custom Items' },
                select: { id: true },
              });
            }

            const customName = item.descriptionText || 'Custom Item';
            const customSku = `CUSTOM_${toSku(customName, 'ITEM')}`;

            let customProduct = await tx.product.findFirst({
              where: {
                name: customName,
                categoryId: customCategory.id,
              },
              select: { id: true },
            });

            if (!customProduct) {
              customProduct = await tx.product.create({
                data: {
                  name: customName,
                  brand: 'Custom',
                  sku: `${customSku}_${customProducts.size + 1}`,
                  hsnCode: item.hsnCode || '0000',
                  gstRate: item.gstRate,
                  mrp: item.rate,
                  isBattery: item.isBattery,
                  unit: item.unit || 'pcs',
                  categoryId: customCategory.id,
                },
                select: { id: true },
              });
            }

            customProducts.set(customKey, customProduct.id);
          }

          resolvedProductId = customProducts.get(customKey)!;
        }

        const itemData: any = {
          invoiceId: inv.id,
          productId: resolvedProductId,
          quantity: item.quantity,
          rate: item.rate,
          discount: item.discount,
          gstRate: item.gstRate,
          cgst: item.cgst,
          sgst: item.sgst,
          igst: item.igst,
          lineTotal: item.lineTotal,
          description: item.description,
        };

        // If serial number is provided, look up or create the SerialNumber record
        if (item.serialNumber && item.isBattery && type !== 'QUOTE') {
          let sn = await tx.serialNumber.findUnique({
            where: { serial: item.serialNumber },
          });
          if (!sn) {
            sn = await tx.serialNumber.create({
              data: {
                serial: item.serialNumber,
                productId: resolvedProductId,
                status: item.isExchange ? 'EXCHANGED' : 'SOLD',
              },
            });
          } else {
            await tx.serialNumber.update({
              where: { id: sn.id },
              data: { status: item.isExchange ? 'EXCHANGED' : 'SOLD' },
            });
          }
          itemData.serialNumberId = sn.id;
        }

        // If exchange, create Graveyard record
        if (item.isExchange && type !== 'QUOTE') {
          await tx.batteryGraveyard.create({
            data: {
              serialNumberId: itemData.serialNumberId,
              condition: 'DEAD',
              sourceInvoiceNo: invoiceNumber,
            }
          });
        }

        const createdItem = await tx.invoiceItem.create({ data: itemData });

        // Handle Warranty Claim
        if (item.isWarrantyClaim && type !== 'QUOTE') {
          await tx.warrantyClaim.create({
            data: {
              invoiceItemId: createdItem.id,
              claimType: item.claimType === 'FREE' ? 'FREE_REPLACEMENT' : 'PRO_RATA',
              status: 'APPROVED',
              notes: `Auto-created from claim for serial ${item.serialNumber}`,
            }
          });

          if (item.originalSerialId) {
            await tx.serialNumber.update({
              where: { id: item.originalSerialId },
              data: { status: 'EXCHANGED' }
            });

            await tx.batteryGraveyard.create({
              data: {
                serialNumberId: item.originalSerialId,
                condition: 'DEAD',
                sourceInvoiceNo: invoiceNumber,
              }
            });
          }
        }

        // 3. Deduct stock (SKIP for exchange items)
        if (type !== 'QUOTE' && !item.isExchange) {
          const shopFloor = await tx.location.findUnique({ where: { name: 'Shop Floor' } });
          if (shopFloor) {
            await tx.stock.updateMany({
              where: { productId: item.productId, locationId: shopFloor.id },
              data: { quantity: { decrement: Math.ceil(item.quantity) } },
            });
          }
        }
      }

      // 4. Create payments
      for (const payment of payments) {
        await tx.payment.create({
          data: {
            invoiceId: inv.id,
            mode: payment.mode,
            amount: payment.amount,
            reference: payment.reference,
          },
        });

        if (payment.mode !== 'CREDIT' && type !== 'QUOTE') {
          await AccountService.handleSalePayment({
            mode: payment.mode,
            amount: payment.amount,
            reference: payment.reference,
            invoiceId: inv.id,
            userId,
          }, tx);
        }
      }

      // 5. Khata
      if (balanceAmount > 0 && customerId && type !== 'QUOTE') {
        await tx.khataEntry.create({
          data: {
            customerId,
            invoiceId: inv.id,
            amount: balanceAmount,
            type: 'DEBIT',
            notes: `Invoice ${invoiceNumber}`,
          },
        });
      }

      return inv;
    });

    const fullInvoice = await prisma.invoice.findUnique({
      where: { id: invoice.id },
      include: {
        customer: true,
        mechanic: true,
        items: { include: { product: true } },
        payments: true,
        createdBy: { select: { id: true, name: true, username: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: fullInvoice,
      message: `Invoice ${invoiceNumber} created successfully`,
    });
  } catch (error) {
    console.error('Finalize invoice error:', error);
    res.status(500).json({ success: false, error: 'Failed to finalize invoice' });
  }
});

// ─── GET /invoices — List all invoices ──────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const status = typeof req.query.status === 'string' ? req.query.status : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10);
    const limit = parseInt(typeof req.query.limit === 'string' ? req.query.limit : '25', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      where.OR = [
        { invoiceNumber: { contains: search } },
        { customer: { is: { name: { contains: search } } } },
        { customer: { is: { phone: { contains: search } } } },
      ];
    }

    if (status) {
      where.status = status;
    }

    if (type) {
      where.type = type;
    }

    const [invoices, total] = await Promise.all([
      prisma.invoice.findMany({
        where,
        include: {
          customer: true,
          _count: { select: { items: true } },
          createdBy: { select: { name: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.invoice.count({ where }),
    ]);

    res.json({ success: true, data: invoices, total, page, limit });
  } catch (error) {
    console.error('List invoices error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoices' });
  }
});

// ─── GET /invoices/:id — Single invoice detail ──────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id as string;
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        customer: true,
        mechanic: true,
        items: { include: { product: true, serialNumber: true } },
        payments: true,
        createdBy: { select: { id: true, name: true, username: true } },
      },
    });

    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    res.json({ success: true, data: invoice });
  } catch (error) {
    console.error('Get invoice error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch invoice' });
  }
});

// ─── POST /invoices/:id/payments — add follow-up payment to existing invoice ───

router.post('/:id/payments', validate(addPaymentSchema), async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id as string;
    const { mode, amount, reference, notes } = req.body;
    const userId = req.user!.userId;

    const existingInvoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        payments: true,
      },
    });

    if (!existingInvoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    if (existingInvoice.type !== 'TAX_INVOICE') {
      res.status(400).json({ success: false, error: 'Payments can only be updated for tax invoices' });
      return;
    }

    if (existingInvoice.status === 'CANCELLED') {
      res.status(400).json({ success: false, error: 'Cancelled invoices cannot be updated' });
      return;
    }

    if (existingInvoice.balanceAmount <= 0) {
      res.status(400).json({ success: false, error: 'This invoice is already fully settled' });
      return;
    }

    if (amount > existingInvoice.balanceAmount) {
      res.status(400).json({
        success: false,
        error: `Payment cannot exceed pending balance of ${existingInvoice.balanceAmount.toFixed(2)}`,
      });
      return;
    }

    const updatedInvoice = await prisma.$transaction(async (tx: any) => {
      await tx.payment.create({
        data: {
          invoiceId,
          mode,
          amount,
          reference,
        },
      });

      await AccountService.handleSalePayment({
        mode,
        amount,
        reference,
        invoiceId,
        userId,
      }, tx);

      if (existingInvoice.customerId) {
        await tx.khataEntry.create({
          data: {
            customerId: existingInvoice.customerId,
            invoiceId,
            type: 'CREDIT',
            amount,
            notes: notes || `Payment received for ${existingInvoice.invoiceNumber} via ${mode}`,
          },
        });
      }

      const paidAmount = Math.round((existingInvoice.paidAmount + amount) * 100) / 100;
      const balanceAmount = Math.round((existingInvoice.grandTotal - paidAmount) * 100) / 100;
      const status = balanceAmount <= 0 ? 'PAID' : 'PARTIAL';

      return tx.invoice.update({
        where: { id: invoiceId },
        data: {
          paidAmount,
          balanceAmount,
          status,
          notes: notes
            ? [existingInvoice.notes, `Payment update: ${notes}`].filter(Boolean).join('\n')
            : existingInvoice.notes || undefined,
        },
        include: {
          customer: true,
          mechanic: true,
          items: { include: { product: true, serialNumber: true } },
          payments: true,
          createdBy: { select: { id: true, name: true, username: true } },
        },
      });
    });

    await AuditService.log({
      userId,
      action: 'INVOICE_PAYMENT_ADDED',
      entityId: invoiceId,
      details: {
        invoiceNumber: existingInvoice.invoiceNumber,
        mode,
        amount,
        reference,
        previousPaidAmount: existingInvoice.paidAmount,
        previousBalanceAmount: existingInvoice.balanceAmount,
        newPaidAmount: updatedInvoice.paidAmount,
        newBalanceAmount: updatedInvoice.balanceAmount,
      },
    });

    res.status(201).json({
      success: true,
      data: updatedInvoice,
      message: `Payment added to invoice ${existingInvoice.invoiceNumber}`,
    });
  } catch (error) {
    console.error('Add invoice payment error:', error);
    res.status(500).json({ success: false, error: 'Failed to update invoice payment' });
  }
});

// ─── PUT /invoices/:id/cancel — Cancel invoice ──────

router.put('/:id/cancel', async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only admins can cancel invoices' });
      return;
    }

    const invoiceId = req.params.id as string;
    const invoice = await prisma.invoice.findUnique({ where: { id: invoiceId } });
    if (!invoice) {
      res.status(404).json({ success: false, error: 'Invoice not found' });
      return;
    }

    await prisma.invoice.update({
      where: { id: invoiceId },
      data: { status: 'CANCELLED' },
    });

    await AuditService.logInvoiceCancel(req.user!.userId, invoiceId, invoice.invoiceNumber);

    res.json({ success: true, message: `Invoice ${invoice.invoiceNumber} cancelled` });
  } catch (error) {
    console.error('Cancel invoice error:', error);
    res.status(500).json({ success: false, error: 'Failed to cancel invoice' });
  }
});

// ─── POST /invoices/:id/convert-to-invoice ───────────

router.post('/:id/convert-to-invoice', async (req: Request, res: Response) => {
  try {
    const invoiceId = req.params.id as string;
    
    // Get full quote with items
    const quote = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: {
        items: true,
      }
    });

    if (!quote) {
      res.status(404).json({ success: false, error: 'Quote not found' });
      return;
    }

    if (quote.type !== 'QUOTE') {
      res.status(400).json({ success: false, error: 'Document is not a quote' });
      return;
    }

    if (quote.status === 'CANCELLED') {
      res.status(400).json({ success: false, error: 'Cannot convert a cancelled quote' });
      return;
    }

    // Determine new status based on payments
    let newStatus = 'FINALIZED';
    if (quote.balanceAmount <= 0) {
      newStatus = 'PAID';
    } else if (quote.paidAmount > 0) {
      newStatus = 'PARTIAL';
    }

    // Perform atomic update: deduct stock, mark SN sold, create khata, change status
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Update quote to TAX_INVOICE
      const updatedInvoice = await tx.invoice.update({
        where: { id: quote.id },
        data: {
          type: 'TAX_INVOICE',
          status: newStatus,
        }
      });

      // 2. Process items for stock and serial numbers
      const shopFloor = await tx.location.findUnique({ where: { name: 'Shop Floor' } });
      
      for (const item of quote.items) {
        // A. Mutate SerialNumber if present
        if (item.serialNumberId) {
          await tx.serialNumber.update({
            where: { id: item.serialNumberId },
            data: { status: 'SOLD' },
          });
        }

        // B. Deduct Stock
        if (shopFloor) {
          await tx.stock.updateMany({
            where: { productId: item.productId, locationId: shopFloor.id },
            data: { quantity: { decrement: Math.ceil(item.quantity) } },
          });
        }
      }

      // 3. Create Khata if balance > 0
      if (quote.balanceAmount > 0 && quote.customerId) {
        await tx.khataEntry.create({
          data: {
            customerId: quote.customerId,
            invoiceId: quote.id,
            amount: quote.balanceAmount,
            type: 'DEBIT',
            notes: `Converted Invoice ${quote.invoiceNumber}`,
          },
        });
      }

      // 4. Record existing payments to ledger (since they were not recorded during Quote stage)
      const payments = await tx.payment.findMany({ where: { invoiceId: quote.id } });
      for (const payment of payments) {
        if (payment.mode !== 'CREDIT') {
          await AccountService.handleSalePayment({
            mode: payment.mode as any,
            amount: payment.amount,
            reference: payment.reference || undefined,
            invoiceId: quote.id,
            userId: quote.createdById, // Use original creator or current user? Original is safer.
          }, tx);
        }
      }

      return updatedInvoice;
    });

    res.json({ success: true, data: result, message: 'Quote converted to Tax Invoice successfully' });
  } catch (error) {
    console.error('Convert quote error:', error);
    res.status(500).json({ success: false, error: 'Failed to convert quote' });
  }
});

// ─── POST /invoices/:id/return — Sale Return / Credit Note ──

router.post('/:id/return', validate(returnSchema), async (req: Request, res: Response) => {
  try {
    const originalInvoiceId = req.params.id as string;
    const { items, refundMode, returnReason } = req.body;
    const userId = req.user!.userId;

    // 1. Get original invoice and items
    const original = await prisma.invoice.findUnique({
      where: { id: originalInvoiceId },
      include: { items: true },
    });

    if (!original) {
      res.status(404).json({ success: false, error: 'Original invoice not found' });
      return;
    }

    if (original.type !== 'TAX_INVOICE') {
      res.status(400).json({ success: false, error: 'Can only return finalized tax invoices' });
      return;
    }

    if (refundMode === 'CREDIT' && !original.customerId) {
      res.status(400).json({ success: false, error: 'Cannot issue Store Credit to a walk-in customer. Please select Cash refund.' });
      return;
    }

    // 2. Compute return totals
    let subtotal = 0;
    let totalDiscount = 0;
    let totalGst = 0;
    
    // We need to build the new invoice items for the credit note
    const returnItemsData: any[] = [];
    const stockUpdates: { productId: string, quantity: number }[] = [];
    const serialUpdates: string[] = [];

    for (const returnReq of items) {
      const origItem = original.items.find(i => i.id === returnReq.invoiceItemId);
      if (!origItem) {
        res.status(400).json({ success: false, error: `Item ${returnReq.invoiceItemId} not found in invoice` });
        return;
      }
      
      if (returnReq.returnQty > origItem.quantity) {
        res.status(400).json({ success: false, error: `Cannot return more than purchased for product` });
        return;
      }

      // Calculate prorated amounts
      const ratio = returnReq.returnQty / origItem.quantity;
      const lineTotal = origItem.rate * returnReq.returnQty;
      const lineDiscount = origItem.discount * ratio;
      const taxable = lineTotal - lineDiscount;
      const gst = Math.round((taxable * origItem.gstRate / 100) * 100) / 100;
      const lineFinal = Math.round((taxable + gst) * 100) / 100;

      subtotal += lineTotal;
      totalDiscount += lineDiscount;
      totalGst += gst;

      returnItemsData.push({
        productId: origItem.productId,
        quantity: returnReq.returnQty,
        rate: origItem.rate,
        discount: lineDiscount,
        gstRate: origItem.gstRate,
        cgst: origItem.cgst * ratio,
        sgst: origItem.sgst * ratio,
        igst: origItem.igst * ratio,
        lineTotal: lineFinal,
        description: origItem.description ? `${origItem.description} (Returned)` : 'Returned Item',
      });

      stockUpdates.push({ productId: origItem.productId, quantity: returnReq.returnQty });
      
      if (origItem.serialNumberId && Math.ceil(returnReq.returnQty) >= 1) {
        serialUpdates.push(origItem.serialNumberId);
      }
    }

    const grandTotal = Math.round((subtotal - totalDiscount + totalGst) * 100) / 100;

    // Generate credit note number
    const crNumber = await generateCreditNoteNumber();

    // 3. Execute atomic transaction
    const creditNote = await prisma.$transaction(async (tx: any) => {
      // A. Create Credit Note Invoice using return parameters
      const cr = await tx.invoice.create({
        data: {
          invoiceNumber: crNumber,
          type: 'CREDIT_NOTE',
          status: 'PAID', // A return is inherently settled
          originalInvoiceId: original.id,
          returnReason: returnReason,
          customerId: original.customerId || undefined,
          mechanicId: original.mechanicId || undefined,
          createdById: userId,
          subtotal: Math.round(subtotal * 100) / 100,
          totalDiscount: Math.round(totalDiscount * 100) / 100,
          totalGst: Math.round(totalGst * 100) / 100,
          grandTotal: grandTotal,
          paidAmount: grandTotal, 
          balanceAmount: 0,
          items: {
            create: returnItemsData
          }
        }
      });

      // B. Process ledger entries for refund
      if (refundMode === 'CASH') {
        const cashAccount = await tx.cashBankAccount.findFirst({ where: { type: 'CASH' } });
        if (cashAccount) {
          await AccountService.recordTransaction({
            accountId: cashAccount.id,
            type: 'DEBIT',
            amount: grandTotal,
            notes: `Refund for Return ${crNumber}`,
            invoiceId: cr.id,
            createdById: userId,
          }, tx);
        }
      }

      // B. Restore Stock
      const shopFloor = await tx.location.findUnique({ where: { name: 'Shop Floor' } });
      if (shopFloor) {
        for (const update of stockUpdates) {
          await tx.stock.updateMany({
            where: { productId: update.productId, locationId: shopFloor.id },
            data: { quantity: { increment: Math.ceil(update.quantity) } },
          });
        }
      }

      // C. Restore Serial Numbers
      for (const snId of serialUpdates) {
        await tx.serialNumber.update({
          where: { id: snId },
          data: { status: 'IN_STOCK' }
        });
      }

      // D. Financial Refund
      // CREDIT -> customer's prepaid balance rises 
      if (refundMode === 'CREDIT' && original.customerId) {
        await tx.khataEntry.create({
          data: {
            customerId: original.customerId,
            invoiceId: cr.id,
            amount: grandTotal,
            type: 'CREDIT', 
            notes: `Credit Note for return ${crNumber}`,
          }
        });
      } else if (refundMode === 'CASH') {
        // Log payment out against the credit note
        await tx.payment.create({
          data: {
            invoiceId: cr.id,
            mode: 'CASH',
            amount: grandTotal,
            reference: 'Return Refund',
          }
        });
      }

      return cr;
    });

    await AuditService.log({
      userId,
      action: 'SALE_RETURN',
      entityId: originalInvoiceId,
      details: {
        returnInvoiceNumber: crNumber,
        grandTotal,
        refundMode
      }
    });

    res.json({ success: true, data: creditNote, message: 'Return processed successfully' });
  } catch (error) {
    console.error('Return process error:', error);
    res.status(500).json({ success: false, error: 'Failed to process return' });
  }
});

export default router;
