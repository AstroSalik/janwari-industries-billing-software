import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.routes';
import productRoutes, { categoryRouter } from './routes/product.routes';
import customerRoutes from './routes/customer.routes';
import invoiceRoutes from './routes/invoice.routes';
import batteryRoutes from './routes/battery.routes';
import mechanicRoutes from './routes/mechanic.routes';
import khataRoutes from './routes/khata.routes';
import purchaseRoutes from './routes/purchase.routes';
import analyticsRoutes from './routes/analytics.routes';
import challanRoutes from './routes/challan.routes';
import accountRoutes from './routes/account.routes';
import reportRoutes from './routes/report.routes';
import aiRoutes from './routes/ai.routes';
import backupRoutes from './routes/backup.routes';
import snapToBillRoutes from './routes/snapToBill.routes';
import { BootstrapService } from './services/bootstrap.service';
import prisma from './lib/prisma';

const app = express();
const PORT = process.env.PORT || 3000;
const isProd = process.env.NODE_ENV === 'production';
const allowedOrigins = (process.env.ALLOWED_ORIGINS || '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean);

const corsOrigin = (origin: string | undefined, callback: (error: Error | null, allow?: boolean) => void) => {
  if (!isProd) {
    callback(null, true);
    return;
  }

  if (!origin || origin === 'null' || origin.startsWith('file://')) {
    callback(null, true);
    return;
  }

  if (allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
    callback(null, true);
    return;
  }

  callback(new Error(`CORS blocked for origin: ${origin}`));
};

app.use(cors({
  origin: corsOrigin,
  credentials: true,
}));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  prisma.$queryRawUnsafe('SELECT 1')
    .then(() => {
      res.json({
        success: true,
        data: {
          status: 'OK',
          database: 'CONNECTED',
          runtime: process.env.RENDER ? 'render' : process.env.NODE_ENV || 'development',
        },
        message: 'Janwari Industries API is running',
      });
    })
    .catch((error) => {
      console.error('Health check DB error:', error);
      res.status(503).json({
        success: false,
        error: 'Database unavailable',
        code: 'DATABASE_UNAVAILABLE',
      });
    });
});

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/categories', categoryRouter);
app.use('/api/customers', customerRoutes);
app.use('/api/invoices', invoiceRoutes);
app.use('/api/batteries', batteryRoutes);
app.use('/api/mechanics', mechanicRoutes);
app.use('/api/khata', khataRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/challans', challanRoutes);
app.use('/api/accounts', accountRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/snap-to-bill', snapToBillRoutes);
app.use('/api/backup', backupRoutes);

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    success: false,
    error: process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
  });
});

BootstrapService.ensureReady()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Janwari Industries API running on http://localhost:${PORT}`);
      console.log(`Health check: http://localhost:${PORT}/api/health`);
    });
  })
  .catch((error) => {
    console.error('Server bootstrap failed:', error);
    process.exit(1);
  });

export default app;
