import { Router, Request, Response } from 'express';
import multer from 'multer';
import { authMiddleware } from '../middleware/auth.middleware';
import { SnapToBillService } from '../services/snapToBill.service';

const router = Router();
router.use(authMiddleware);

const acceptedMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
]);

const imageMimeTypes = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
]);

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024,
  },
  fileFilter: (_req: any, file: any, cb: any) => {
    if (!acceptedMimeTypes.has(file.mimetype)) {
      cb(new Error('Unsupported file type'));
      return;
    }
    cb(null, true);
  },
});

router.post('/', upload.single('image'), async (req: Request, res: Response) => {
  try {
    const file = req.file;

    if (!file) {
      res.status(400).json({ success: false, error: 'Image file is required' });
      return;
    }

    if (!imageMimeTypes.has(file.mimetype)) {
      res.status(400).json({
        success: false,
        error: 'Snap-to-Bill currently supports JPG, PNG, and WEBP images. For PDFs or office files, export or screenshot the bill as an image first.',
      });
      return;
    }

    const result = await SnapToBillService.extractFromImage(file.buffer, file.mimetype);

    res.json({
      success: true,
      data: result,
      message: 'Bill extracted successfully',
    });
  } catch (error: any) {
    console.error('Snap-to-Bill error:', error);
    const message = error?.message?.includes('CLAUDE_API_KEY')
      ? 'Claude API key is not configured on the server'
      : 'Could not read bill. Please try again or enter items manually.';
    res.status(500).json({ success: false, error: message });
  }
});

export default router;
