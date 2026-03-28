import { Router, Request, Response } from 'express';
import { z } from 'zod';
import prisma from '../lib/prisma';
import { validate } from '../middleware/validate.middleware';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

// ─── Validation Schemas ─────────────────────────────

const createCustomerSchema = z.object({
  name: z.string().min(1, 'Customer name is required'),
  phone: z.string().min(10, 'Valid phone number is required'),
  address: z.string().optional(),
  gstin: z.string().optional(),
  stateCode: z.string().default('01'),
  type: z.enum(['RETAIL', 'FLEET', 'MECHANIC']).default('RETAIL'),
  creditLimit: z.number().optional(),
});

const updateCustomerSchema = createCustomerSchema.partial();

// ─── GET /customers — List with search ──────────────

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = typeof req.query.search === 'string' ? req.query.search : undefined;
    const type = typeof req.query.type === 'string' ? req.query.type : undefined;
    const page = parseInt(typeof req.query.page === 'string' ? req.query.page : '1', 10);
    const limit = parseInt(typeof req.query.limit === 'string' ? req.query.limit : '50', 10);
    const skip = (page - 1) * limit;

    const where: any = {};

    if (search) {
      const normalizedSearch = search.trim();
      where.OR = [
        { name: { contains: normalizedSearch, mode: 'insensitive' } },
        { phone: { contains: search } },
        { gstin: { contains: normalizedSearch, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        orderBy: { name: 'asc' },
        skip,
        take: limit,
      }),
      prisma.customer.count({ where }),
    ]);

    res.json({
      success: true,
      data: customers,
      total,
      page,
      limit,
    });
  } catch (error) {
    console.error('List customers error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customers' });
  }
});

// ─── GET /customers/:id — Single customer ───────────

router.get('/:id', async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.findUnique({
      where: { id: req.params.id as string },
      include: {
        invoices: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          select: {
            id: true,
            invoiceNumber: true,
            grandTotal: true,
            status: true,
            createdAt: true,
          },
        },
      },
    });

    if (!customer) {
      res.status(404).json({ success: false, error: 'Customer not found' });
      return;
    }

    res.json({ success: true, data: customer });
  } catch (error) {
    console.error('Get customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to fetch customer' });
  }
});

// ─── POST /customers — Create customer ──────────────

router.post('/', validate(createCustomerSchema), async (req: Request, res: Response) => {
  try {
    // Check for duplicate phone
    const existing = await prisma.customer.findUnique({
      where: { phone: req.body.phone },
    });
    if (existing) {
      res.status(400).json({
        success: false,
        error: `Customer with phone "${req.body.phone}" already exists`,
        code: 'DUPLICATE_PHONE',
      });
      return;
    }

    const customer = await prisma.customer.create({ data: req.body });

    res.status(201).json({
      success: true,
      data: customer,
      message: 'Customer created successfully',
    });
  } catch (error) {
    console.error('Create customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to create customer' });
  }
});

// ─── PUT /customers/:id — Update customer ───────────

router.put('/:id', validate(updateCustomerSchema), async (req: Request, res: Response) => {
  try {
    const customer = await prisma.customer.update({
      where: { id: req.params.id as string },
      data: req.body,
    });

    res.json({
      success: true,
      data: customer,
      message: 'Customer updated successfully',
    });
  } catch (error) {
    console.error('Update customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to update customer' });
  }
});

// ─── DELETE /customers/:id ──────────────────────────

router.delete('/:id', async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== 'ADMIN') {
      res.status(403).json({ success: false, error: 'Only admins can delete customers' });
      return;
    }

    await prisma.customer.delete({ where: { id: req.params.id as string } });
    res.json({ success: true, message: 'Customer deleted successfully' });
  } catch (error) {
    console.error('Delete customer error:', error);
    res.status(500).json({ success: false, error: 'Failed to delete customer' });
  }
});

export default router;
