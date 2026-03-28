import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();

// All product routes require authentication
router.use(authMiddleware);

// ─── Validation Schemas ─────────────────────────────

const createProductSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  brand: z.string().optional(),
  sku: z.string().optional(),
  hsnCode: z.string().optional(),
  gstRate: z.number().min(0).max(100).default(18),
  mrp: z.number().positive('MRP must be positive'),
  costPrice: z.number().positive('Cost price must be positive').optional(),
  unit: z.string().default('PCS'),
  isBattery: z.boolean().default(false),
  voltage: z.number().optional(),
  ahRating: z.number().optional(),
  polarity: z.string().optional(),
  warrantyFreeMonths: z.number().optional(),
  warrantyProRataMonths: z.number().optional(),
  categoryId: z.string().optional(),
});

const updateProductSchema = createProductSchema.partial();

const listQuerySchema = z.object({
  search: z.string().optional(),
  category: z.string().optional(),
  isBattery: z.string().optional(),
  page: z.string().optional(),
  limit: z.string().optional(),
});

// ─── GET /products — List with search + filter ──────

router.get('/', async (req: Request, res: Response) => {
  try {
    const query = listQuerySchema.parse(req.query);
    const page = parseInt(query.page || '1', 10);
    const limit = parseInt(query.limit || '50', 10);
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    if (query.search) {
      where.OR = [
        { name: { contains: query.search } },
        { brand: { contains: query.search } },
        { sku: { contains: query.search } },
      ];
    }

    if (query.category) {
      where.categoryId = query.category;
    }

    if (query.isBattery === 'true') {
      where.isBattery = true;
    } else if (query.isBattery === 'false') {
      where.isBattery = false;
    }

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: {
          category: true,
          stock: {
            include: { location: true },
          },
        },
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.product.count({ where }),
    ]);

    // Calculate total stock per product and handle RBAC
    const productsWithStock = products.map((product: any) => {
      const p = {
        ...product,
        totalStock: product.stock.reduce(
          (sum: number, s: any) => sum + s.quantity,
          0
        ),
      };
      
      // Hide costPrice for non-admins
      if (req.user?.role !== 'ADMIN') {
        delete p.costPrice;
      }
      return p;
    });

    res.json({
      success: true,
      data: productsWithStock,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('List products error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch products',
    });
  }
});

// ─── GET /products/:id — Single product ─────────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const productId = req.params.id as string;
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        stock: {
          include: { location: true },
        },
      },
    });

    if (!product) {
      res.status(404).json({
        success: false,
        error: 'Product not found',
      });
      return;
    }

    const productData: any = { ...product };
    if (req.user?.role !== 'ADMIN') {
      delete productData.costPrice;
    }

    res.json({
      success: true,
      data: productData,
    });
  } catch (error) {
    console.error('Get product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch product',
    });
  }
});

// ─── POST /products — Create product (admin only) ───

router.post('/', validate(createProductSchema), async (req: Request, res: Response) => {
  try {
    // Check admin role
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only admins can create products',
        code: 'FORBIDDEN',
      });
      return;
    }

    // Check for duplicate SKU
    if (req.body.sku) {
      const existing = await prisma.product.findUnique({
        where: { sku: req.body.sku },
      });
      if (existing) {
        res.status(400).json({
          success: false,
          error: `Product with SKU "${req.body.sku}" already exists`,
          code: 'DUPLICATE_SKU',
        });
        return;
      }
    }

    const product = await prisma.product.create({
      data: req.body,
      include: {
        category: true,
        stock: { include: { location: true } },
      },
    });

    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully',
    });
  } catch (error) {
    console.error('Create product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to create product',
    });
  }
});

// ─── PUT /products/:id — Update product (admin only) ─

router.put('/:id', validate(updateProductSchema), async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only admins can update products',
        code: 'FORBIDDEN',
      });
      return;
    }

    const productId = req.params.id as string;
    const product = await prisma.product.update({
      where: { id: productId },
      data: req.body,
      include: {
        category: true,
        stock: { include: { location: true } },
      },
    });

    res.json({
      success: true,
      data: product,
      message: 'Product updated successfully',
    });
  } catch (error) {
    console.error('Update product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update product',
    });
  }
});

// ─── DELETE /products/:id — Remove (admin only) ─────

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({
        success: false,
        error: 'Only admins can delete products',
        code: 'FORBIDDEN',
      });
      return;
    }

    const productId = req.params.id as string;
    await prisma.product.delete({
      where: { id: productId },
    });

    res.json({
      success: true,
      message: 'Product deleted successfully',
    });
  } catch (error) {
    console.error('Delete product error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete product',
    });
  }
});

// ─── GET /categories — List all categories ──────────

export const categoryRouter = Router();
categoryRouter.use(authMiddleware);

categoryRouter.get('/', async (_req: Request, res: Response) => {
  try {
    const categories = await prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: { select: { products: true } },
      },
    });

    res.json({
      success: true,
      data: categories,
    });
  } catch (error) {
    console.error('List categories error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch categories',
    });
  }
});

// ─── POST /categories — Create category (admin) ─────

categoryRouter.post(
  '/',
  validate(z.object({ name: z.string().min(1, 'Category name is required') })),
  async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({
          success: false,
          error: 'Only admins can create categories',
        });
        return;
      }

      const category = await prisma.category.create({
        data: { name: req.body.name },
      });

      res.status(201).json({
        success: true,
        data: category,
        message: 'Category created successfully',
      });
    } catch (error) {
      console.error('Create category error:', error);
      res.status(500).json({
        success: false,
        error: 'Failed to create category',
      });
    }
  }
);

// ─── PUT /categories/:id — Update category (admin) ───

categoryRouter.put(
  '/:id',
  validate(z.object({ name: z.string().min(1, 'Category name is required') })),
  async (req: Request, res: Response) => {
    try {
      if (req.user?.role !== 'ADMIN') {
        res.status(403).json({ success: false, error: 'Only admins can update categories' });
        return;
      }

      const categoryId = req.params.id as string;
      const category = await prisma.category.update({
        where: { id: categoryId },
        data: { name: req.body.name },
      });

      res.json({ success: true, data: category, message: 'Category updated successfully' });
    } catch (error) {
      console.error('Update category error:', error);
      res.status(500).json({ success: false, error: 'Failed to update category' });
    }
  }
);

// ─── DELETE /categories/:id — Delete category (admin) ───

categoryRouter.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only admins can delete categories' });
      return;
    }

    const categoryId = req.params.id as string;
    // Check if products exist in category
    const productsCount = await prisma.product.count({
      where: { categoryId: categoryId }
    });

    if (productsCount > 0) {
      res.status(400).json({ 
        success: false, 
        error: `Cannot delete category: ${productsCount} products are still assigned to it. Please reassign them first.` 
      });
      return;
    }

    await prisma.category.delete({
      where: { id: categoryId },
    });

    res.json({ success: true, message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete category' });
  }
});

export default router;
