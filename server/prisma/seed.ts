/// <reference types="node" />
import 'dotenv/config';
import { neonConfig } from '@neondatabase/serverless';
import { PrismaNeon } from '@prisma/adapter-neon';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import ws from 'ws';

neonConfig.webSocketConstructor = ws;

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error('DATABASE_URL is not set.');
}

const adapter = new PrismaNeon({ connectionString });

// Initialize PrismaClient with Cloud URL
// @ts-ignore — Prisma 7 config-first type workaround
const prisma = new PrismaClient({
  adapter,
  log: ['error'], // Minimal logging for seed
});

async function main() {
  console.log('🌱 Seeding Janwari Industries database... (v2)\n');

  // ─── Users ──────────────────────────────────────────
  const adminPassword = await bcrypt.hash('janwari2024', 12);
  const cashierPassword = await bcrypt.hash('counter123', 12);

  const admin = await prisma.user.upsert({
    where: { username: 'admin' },
    update: {},
    create: {
      name: 'Janwari Admin',
      username: 'admin',
      password: adminPassword,
      role: 'ADMIN',
    },
  });

  const cashier = await prisma.user.upsert({
    where: { username: 'counter' },
    update: {},
    create: {
      name: 'Counter Staff',
      username: 'counter',
      password: cashierPassword,
      role: 'CASHIER',
    },
  });

  console.log('✅ Users created:');
  console.log(`   Admin:   ${admin.username} / janwari2024`);
  console.log(`   Cashier: ${cashier.username} / counter123\n`);

  // ─── Categories ─────────────────────────────────────
  const categories = [
    'Batteries',
    'Wipers',
    'Bulbs',
    'Electrical',
    'Belts',
    'Filters',
    'Accessories',
  ];

  for (const name of categories) {
    await prisma.category.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✅ Categories created: ${categories.join(', ')}\n`);

  // ─── Locations ──────────────────────────────────────
  const locations = ['Shop Floor', 'Godown'];

  for (const name of locations) {
    await prisma.location.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  console.log(`✅ Locations created: ${locations.join(', ')}\n`);

  // ─── Sample Products ────────────────────────────────
  const batteryCategory = await prisma.category.findUnique({ where: { name: 'Batteries' } });
  const wiperCategory = await prisma.category.findUnique({ where: { name: 'Wipers' } });
  const bulbCategory = await prisma.category.findUnique({ where: { name: 'Bulbs' } });
  const accCategory = await prisma.category.findUnique({ where: { name: 'Accessories' } });

  if (batteryCategory && wiperCategory && bulbCategory && accCategory) {
    const shopFloor = await prisma.location.findUnique({ where: { name: 'Shop Floor' } });
    const godown = await prisma.location.findUnique({ where: { name: 'Godown' } });

    const products = [
      {
        name: 'Amaron Black 100Ah',
        brand: 'Amaron',
        sku: 'AMR-BLK-100',
        hsnCode: '8507',
        gstRate: 28,
        mrp: 8500,
        costPrice: 6800,
        isBattery: true,
        voltage: 12,
        ahRating: 100,
        polarity: 'R',
        warrantyFreeMonths: 24,
        warrantyProRataMonths: 24,
        categoryId: batteryCategory.id,
      },
      {
        name: 'Exide Mileage 65Ah',
        brand: 'Exide',
        sku: 'EXD-MLG-65',
        hsnCode: '8507',
        gstRate: 28,
        mrp: 5200,
        costPrice: 4100,
        isBattery: true,
        voltage: 12,
        ahRating: 65,
        polarity: 'L',
        warrantyFreeMonths: 18,
        warrantyProRataMonths: 18,
        categoryId: batteryCategory.id,
      },
      {
        name: 'Bosch Aerofit Wiper 22"',
        brand: 'Bosch',
        sku: 'BSH-WPR-22',
        hsnCode: '8512',
        gstRate: 18,
        mrp: 650,
        costPrice: 450,
        isBattery: false,
        categoryId: wiperCategory.id,
      },
      {
        name: 'Osram H4 Halogen Bulb',
        brand: 'Osram',
        sku: 'OSR-H4-60',
        hsnCode: '8539',
        gstRate: 18,
        mrp: 320,
        costPrice: 180,
        isBattery: false,
        categoryId: bulbCategory.id,
      },
      {
        name: 'Universal Phone Mount',
        brand: 'Generic',
        sku: 'GEN-PHN-MNT',
        hsnCode: '3926',
        gstRate: 18,
        mrp: 450,
        costPrice: 200,
        isBattery: false,
        categoryId: accCategory.id,
      },
    ];

    for (const product of products) {
      const created = await prisma.product.upsert({
        where: { sku: product.sku! },
        update: {},
        create: product,
      });

      // Add stock at Shop Floor
      if (shopFloor) {
        await prisma.stock.upsert({
          where: {
            productId_locationId: {
              productId: created.id,
              locationId: shopFloor.id,
            },
          },
          update: {},
          create: {
            productId: created.id,
            locationId: shopFloor.id,
            quantity: product.isBattery ? 8 : 20,
            lowStockAt: product.isBattery ? 3 : 5,
          },
        });
      }

      // Add stock at Godown
      if (godown) {
        await prisma.stock.upsert({
          where: {
            productId_locationId: {
              productId: created.id,
              locationId: godown.id,
            },
          },
          update: {},
          create: {
            productId: created.id,
            locationId: godown.id,
            quantity: product.isBattery ? 15 : 30,
            lowStockAt: product.isBattery ? 5 : 10,
          },
        });
      }
    }

    console.log(`✅ ${products.length} sample products created with stock\n`);
  }

  // ─── Sample Customers ───────────────────────────────
  const customers = [
    {
      name: 'Mohammed Yusuf',
      phone: '9876543210',
      address: 'Main Chowk, Sopore',
      stateCode: '01',
      type: 'RETAIL' as const,
    },
    {
      name: 'Abdul Rashid',
      phone: '9876543211',
      address: 'Industrial Estate, Sopore',
      gstin: '01AABCU9603R1ZM',
      stateCode: '01',
      type: 'FLEET' as const,
    },
    {
      name: 'Fayaz Ahmad',
      phone: '9876543212',
      address: 'Baramulla Road, Sopore',
      stateCode: '01',
      type: 'MECHANIC' as const,
    },
  ];

  for (const customer of customers) {
    await prisma.customer.upsert({
      where: { phone: customer.phone },
      update: {},
      create: customer,
    });
  }

  console.log(`✅ ${customers.length} sample customers created\n`);

  // ─── Sample Mechanics ───────────────────────────────
  const mechanics = [
    {
      name: 'Ustad Bashir',
      phone: '9876543220',
      commissionRate: 5,
    },
    {
      name: 'Ustad Manzoor',
      phone: '9876543221',
      commissionRate: 3,
    },
  ];

  for (const mechanic of mechanics) {
    await prisma.mechanic.upsert({
      where: { phone: mechanic.phone },
      update: {},
      create: mechanic,
    });
  }

  console.log(`✅ ${mechanics.length} sample mechanics created\n`);

  // ─── Default Cash & Bank Accounts ───────────────
  const defaultAccounts = [
    { name: 'Cash Drawer', type: 'CASH' as const, balance: 5000 },
    { name: 'SBI Current Account', type: 'BANK' as const, balance: 25000 },
    { name: 'UPI Wallet (PhonePe)', type: 'WALLET' as const, balance: 1200 },
  ];

  for (const acc of defaultAccounts) {
    await (prisma as any).cashBankAccount.upsert({
      where: { name: acc.name },
      update: {},
      create: acc,
    });
  }
  console.log(`✅ ${defaultAccounts.length} default accounts created\n`);
  
  console.log('🎉 Seed complete! Database is ready.\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
