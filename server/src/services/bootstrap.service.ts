import bcrypt from 'bcryptjs';
import prisma from '../lib/prisma';

export class BootstrapService {
  static async ensureReady() {
    await prisma.$queryRawUnsafe('SELECT 1');

    const username = (process.env.DEFAULT_ADMIN_USERNAME || 'admin').trim().toLowerCase();
    const password = process.env.DEFAULT_ADMIN_PASSWORD || 'janwari2024';

    const existingAdmin = await prisma.user.findUnique({
      where: { username },
      select: { id: true },
    });

    if (!existingAdmin) {
      const passwordHash = await bcrypt.hash(password, 12);

      await prisma.user.create({
        data: {
          name: 'Janwari Admin',
          username,
          password: passwordHash,
          role: 'ADMIN',
        },
      });

      console.log(`Created bootstrap admin user "${username}"`);
    }
  }
}
