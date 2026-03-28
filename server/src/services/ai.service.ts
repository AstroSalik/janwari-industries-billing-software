import prisma from '../lib/prisma';

export interface ExtractedInvoiceItem {
  name: string;
  hsnCode?: string;
  quantity: number;
  rate: number;
  gstRate: number;
  discount?: number;
  suggestedProductId?: string;
}

export interface ExtractedInvoice {
  supplierName?: string;
  invoiceNumber?: string;
  date?: string;
  items: ExtractedInvoiceItem[];
  totalAmount?: number;
}

export class AIService {
  /**
   * Processes an invoice image and returns structured data.
   * Currently mocked for development.
   */
  static async processInvoiceImage(imageUri: string): Promise<ExtractedInvoice> {
    console.log('Processing invoice image:', imageUri);

    // Mock delay to simulate AI processing
    await new Promise(resolve => setTimeout(resolve, 2500));

    // Mock response following the "Industrial" theme
    return {
      supplierName: "Amaron Distrubutors Sopore",
      invoiceNumber: "AD/2026/789",
      date: new Date().toISOString(),
      items: [
        {
          name: "Amaron Hi-Life 65Ah Battery",
          hsnCode: "8507",
          quantity: 5,
          rate: 3200,
          gstRate: 28,
          discount: 100
        },
        {
          name: "Luminous Solar 150Ah",
          hsnCode: "8507",
          quantity: 2,
          rate: 8500,
          gstRate: 28,
        },
        {
          name: "Philips H7 Bulb",
          hsnCode: "8539",
          quantity: 10,
          rate: 150,
          gstRate: 18,
        }
      ],
      totalAmount: 34500
    };
  }

  /**
   * Attempts to match extracted items to existing products in DB
   */
  static async matchToProducts(extracted: ExtractedInvoice): Promise<ExtractedInvoice> {
    const enrichedItems = await Promise.all(extracted.items.map(async (item) => {
      // Simple name match
      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: item.name } },
            { sku: { contains: item.name } }
          ]
        }
      });

      return {
        ...item,
        suggestedProductId: product?.id
      };
    }));

    return { ...extracted, items: enrichedItems };
  }
}
