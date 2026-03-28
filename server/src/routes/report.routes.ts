import { Router, Request, Response } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

// ─── Day Book Routes ────────────────────────────────

const router = Router();
router.use(authMiddleware);

// ─── GET /reports/daybook — Daily Transaction Log ───

router.get('/daybook', async (req: Request, res: Response) => {
  try {
    const dateStr = typeof req.query.date === 'string' ? req.query.date : new Date().toISOString().split('T')[0];
    
    // Native start/end of day logic
    const start = new Date(dateStr);
    start.setHours(0, 0, 0, 0);
    const end = new Date(dateStr);
    end.setHours(23, 59, 59, 999);

    // 1. Fetch Invoices (Sales)
    const invoices = await prisma.invoice.findMany({
      where: { createdAt: { gte: start, lte: end }, status: { not: 'CANCELLED' } },
      include: { customer: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // 2. Fetch Payments (Cash Inflow)
    const payments = await prisma.payment.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { 
        invoice: { select: { invoiceNumber: true, customer: { select: { name: true } } } } 
      },
      orderBy: { createdAt: 'asc' },
    });

    // 3. Fetch Khata Entries
    const khataEntries = await prisma.khataEntry.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { 
        customer: { select: { name: true } }
      },
      orderBy: { createdAt: 'asc' },
    });

    // 4. Fetch Purchases (Cash Outflow)
    const purchases = await prisma.purchase.findMany({
      where: { createdAt: { gte: start, lte: end } },
      include: { supplier: { select: { name: true } } },
      orderBy: { createdAt: 'asc' },
    });

    // 5. Fetch Petty Cash (Expenses)
    const pettyCash = await prisma.pettyCash.findMany({
      where: { date: { gte: start, lte: end } },
      orderBy: { date: 'asc' },
    });

    // 6. Fetch Mechanic Settlements
    const settlements = await prisma.mechanicSettlement.findMany({
      where: { settledAt: { gte: start, lte: end } },
      include: { mechanic: { select: { name: true } } },
      orderBy: { settledAt: 'asc' },
    });

    // ─── Format Entries for Timeline ──────────────────

    const entries: any[] = [
      ...invoices.map(inv => ({
        id: `inv-${inv.id}`,
        type: 'SALE',
        reference: inv.invoiceNumber,
        party: inv.customer?.name || 'Walk-in',
        amount: inv.grandTotal,
        paymentMode: 'VARIES',
        time: inv.createdAt,
      })),
      ...payments.map(p => ({
        id: `pay-${p.id}`,
        type: 'PAYMENT_IN',
        reference: p.invoice?.invoiceNumber || p.reference || 'Payment',
        party: p.invoice?.customer?.name || 'Customer',
        amount: p.amount,
        paymentMode: p.mode,
        time: p.createdAt,
      })),
      ...pettyCash.map(pc => ({
        id: `pc-${pc.id}`,
        type: 'EXPENSE',
        reference: pc.category,
        party: pc.description,
        amount: -pc.amount,
        paymentMode: pc.paymentMode,
        time: pc.date,
      })),
      ...purchases.map(pur => ({
        id: `pur-${pur.id}`,
        type: 'PURCHASE',
        reference: pur.invoiceRef || 'Purchase',
        party: pur.supplier.name,
        amount: -pur.totalAmount,
        paymentMode: pur.paymentMode || 'CREDIT',
        time: pur.createdAt,
      })),
      ...settlements.map(s => ({
        id: `set-${s.id}`,
        type: 'MECH_PAYOUT',
        reference: 'Commission Payout',
        party: s.mechanic.name,
        amount: -s.amount,
        paymentMode: 'CASH',
        time: s.settledAt,
      }))
    ].sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());

    // ─── Summaries ────────────────────────────────────

    const totalSales = invoices.reduce((sum, i) => sum + i.grandTotal, 0);
    const totalCashIn = payments.filter(p => p.mode === 'CASH').reduce((sum, p) => sum + p.amount, 0);
    const totalUpiIn = payments.filter(p => p.mode === 'UPI').reduce((sum, p) => sum + p.amount, 0);
    const totalExpenses = pettyCash.reduce((sum, pc) => sum + pc.amount, 0) + settlements.reduce((sum, s) => sum + s.amount, 0);

    res.json({
      success: true,
      data: {
        entries,
        summary: {
          totalSales,
          totalCashIn,
          totalUpiIn,
          totalExpenses,
          netCash: totalCashIn - (pettyCash.filter(pc => pc.paymentMode === 'CASH').reduce((sum, pc) => sum + pc.amount, 0) + settlements.reduce((sum, s) => sum + s.amount, 0))
        }
      }
    });

  } catch (error) {
    res.status(500).json({ success: false, error: 'Failed to generate daybook' });
  }
});

/**
 * GET /reports/restock-alerts
 * Predictive inventory analysis based on sales velocity
 */
router.get('/restock-alerts', async (req: Request, res: Response) => {
  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 1. Get all products with current stock
    const products = await prisma.product.findMany({
      include: {
        stock: true,
        category: true,
      }
    });

    // 2. Get sales volume for last 30 days
    const recentSales = await prisma.invoiceItem.groupBy({
      by: ['productId'],
      where: {
        invoice: {
          createdAt: { gte: thirtyDaysAgo },
          status: { not: 'CANCELLED' }
        }
      },
      _sum: {
        quantity: true
      }
    });

    const salesMap = new Map(recentSales.map(s => [s.productId, s._sum.quantity || 0]));

    // 3. Analyze and filter for alerts
    const alerts = products.map(product => {
      const currentStock = product.stock.reduce((sum, s) => sum + s.quantity, 0);
      const totalSales30Days = salesMap.get(product.id) || 0;
      const dailyVelocity = totalSales30Days / 30;
      
      // Predicted days remaining (if sales continue)
      const daysRemaining = dailyVelocity > 0 ? Math.floor(currentStock / dailyVelocity) : 999;
      
      // Threshold: Either custom lowStockAt OR less than 7 days of stock (velocity based)
      // We use the highest of lowStockAt across locations (usually only 1 location anyway)
      const staticThreshold = Math.max(...product.stock.map(s => s.lowStockAt), 5);
      
      const isUrgent = currentStock <= staticThreshold || (dailyVelocity > 0 && daysRemaining <= 7);

      return {
        id: product.id,
        name: product.name,
        category: product.category.name,
        currentStock,
        dailyVelocity,
        daysRemaining,
        threshold: staticThreshold,
        isUrgent
      };
    }).filter(p => p.isUrgent)
      .sort((a, b) => a.daysRemaining - b.daysRemaining);

    res.json({
      success: true,
      data: alerts,
      message: `Found ${alerts.length} inventory alerts`
    });

  } catch (error) {
    console.error('Restock alerts error:', error);
    res.status(500).json({ success: false, error: 'Failed to analyze inventory' });
  }
});

export default router;
