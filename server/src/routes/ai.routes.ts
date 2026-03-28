import { Router, Request, Response } from 'express';
import { AIService } from '../services/ai.service';
import { authMiddleware } from '../middleware/auth.middleware';

const router = Router();
router.use(authMiddleware);

/**
 * POST /ai/process-invoice
 * Extracts data from an image and matches it to products
 */
router.post('/process-invoice', async (req: Request, res: Response) => {
  try {
    const { imageUri } = req.body;
    
    if (!imageUri) {
      res.status(400).json({ success: false, error: 'Image URI is required' });
      return;
    }

    // 1. Extract structured data
    const extracted = await AIService.processInvoiceImage(imageUri);

    // 2. Match with existing products
    const enriched = await AIService.matchToProducts(extracted);

    res.json({
      success: true,
      data: enriched,
      message: 'Invoice processed successfully'
    });

  } catch (error) {
    console.error('AI processing error:', error);
    res.status(500).json({ success: false, error: 'Failed to process invoice' });
  }
});

export default router;
