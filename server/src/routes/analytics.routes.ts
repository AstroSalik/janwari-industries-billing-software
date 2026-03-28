import { Router } from 'express';
import prisma from '../lib/prisma';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── GET /analytics/dashboard ───────────────────────

router.get('/dashboard', async (_req, res) => {
  try {
    // Get date ranges
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // Revenue calculations
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' },
      },
      include: {
        items: { include: { product: true } }
      }
    });

    const thisMonthRevenue = invoices
      .filter((i: any) => i.createdAt >= startOfMonth)
      .reduce((sum: number, i: any) => sum + i.grandTotal, 0);

    const totalRevenue = invoices.reduce((sum: number, i: any) => sum + i.grandTotal, 0);

    // Top selling products (by volume)
    const productSales: Record<string, { name: string, quantity: number, revenue: number }> = {};
    
    invoices.forEach((inv: any) => {
      inv.items.forEach((item: any) => {
        if (!productSales[item.productId]) {
          productSales[item.productId] = {
            name: item.product.name,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[item.productId].quantity += item.quantity;
        productSales[item.productId].revenue += item.lineTotal;
      });
    });

    const topProducts = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 5);

    // Mechanic Performance
    const mechanics = await prisma.mechanic.findMany({
      include: {
        invoices: true
      }
    });

    const topMechanics = mechanics.map((m: any) => {
      const mechanicRevenue = m.invoices
        .filter((i: any) => i.status !== 'CANCELLED')
        .reduce((sum: number, i: any) => sum + i.grandTotal, 0);
      
      return {
        id: m.id,
        name: m.name,
        revenue: mechanicRevenue,
        invoicesCount: m.invoices.length
      };
    }).sort((a: any, b: any) => b.revenue - a.revenue).slice(0, 5);

    res.json({
      success: true,
      data: {
        thisMonthRevenue,
        totalRevenue,
        topProducts,
        topMechanics,
      }
    });
  } catch (error) {
    console.error('Dashboard analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate dashboard analytics' });
  }
});

// ─── GET /analytics/gstr ────────────────────────────

router.get('/gstr', async (_req, res) => {
  try {
    const invoices = await prisma.invoice.findMany({
      where: {
        status: { not: 'CANCELLED' }, // Finalized or Paid
      },
      include: {
        customer: true,
        items: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const b2b: any[] = []; // Business to Business (has GSTIN)
    const b2c: any[] = []; // Business to Consumer (no GSTIN)

    invoices.forEach((inv: any) => {
      const isB2B = Boolean(inv.customer?.gstin);
      
      const record = {
        invoiceNumber: inv.invoiceNumber,
        date: inv.createdAt,
        customerName: inv.customer?.name || 'Walk-in',
        gstin: inv.customer?.gstin || '',
        stateCode: inv.customer?.stateCode || '01',
        totalValue: inv.grandTotal,
        taxableValue: inv.totalAmount, // amount before GST and after discount
        totalIgst: 0,
        totalCgst: 0,
        totalSgst: 0,
      };

      inv.items.forEach((item: any) => {
        record.totalIgst += item.igst;
        record.totalCgst += item.cgst;
        record.totalSgst += item.sgst;
      });

      if (isB2B) {
        b2b.push(record);
      } else {
        b2c.push(record);
      }
    });

    res.json({
      success: true,
      data: {
        b2b,
        b2c,
      }
    });
  } catch (error) {
    console.error('GSTR analytics error:', error);
    res.status(500).json({ success: false, error: 'Failed to generate GSTR reports' });
  }
});

export default router;
