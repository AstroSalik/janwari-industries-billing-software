import { Router } from 'express';
import express from 'express';
import { authMiddleware, requireRole } from '../middleware/auth.middleware';
import prisma from '../lib/prisma';
import fs from 'fs';
import path from 'path';

const router = Router();

// DB file path
const dbPath = path.join(__dirname, '../../prisma/dev.db');

// GET /api/backup/download
// Downloads the current SQLite database
router.get('/download', authMiddleware, requireRole('ADMIN'), async (req: any, res: any) => {
  try {
    if (!fs.existsSync(dbPath)) {
      return res.status(404).json({ success: false, error: 'Database file not found' });
    }

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `janwari-backup-${timestamp}.sqlite`;

    // Log the backup action
    await prisma.auditLog.create({
      data: {
        userId: req.user!.userId,
        action: 'BACKUP_DOWNLOADED',
      }
    });

    res.download(dbPath, filename, (err: any) => {
      if (err) {
        console.error('Download error:', err);
      }
    });

  } catch (error) {
    console.error('Backup download error:', error);
    res.status(500).json({ success: false, error: 'Failed to download backup' });
  }
});

// POST /api/backup/restore
// Uploads and overwrites the SQLite database
router.post('/restore', authMiddleware, requireRole('ADMIN'), express.raw({ type: 'application/octet-stream', limit: '100mb' }), async (req: any, res: any) => {
  try {
    if (!req.body || !Buffer.isBuffer(req.body)) {
      return res.status(400).json({ success: false, error: 'No file data received or invalid format. Must be application/octet-stream' });
    }

    // 1. Safely disconnect Prisma to release the file lock
    await prisma.$disconnect();

    // 2. Overwrite the file
    fs.writeFileSync(dbPath, req.body);

    // 3. Clear WAL and SHM files if they exist (to prevent corruption from old WAL files)
    const walPath = dbPath + '-wal';
    const shmPath = dbPath + '-shm';
    if (fs.existsSync(walPath)) fs.unlinkSync(walPath);
    if (fs.existsSync(shmPath)) fs.unlinkSync(shmPath);

    // 4. Re-connect Prisma 
    await prisma.$connect();

    // 5. Audit log on the newly restored DB
    try {
      await prisma.auditLog.create({
        data: {
          userId: req.user!.userId,
          action: 'BACKUP_RESTORED',
        }
      });
    } catch (auditErr) {
      console.error('Could not log restore (maybe admin ID changed in the restored DB?):', auditErr);
    }

    res.json({ success: true, message: 'Database restored successfully' });
  } catch (error) {
    console.error('Backup restore error:', error);
    // Try to reconnect just in case
    await prisma.$connect().catch(console.error);
    res.status(500).json({ success: false, error: 'Failed to restore backup. System may be unstable.' });
  }
});

export default router;
