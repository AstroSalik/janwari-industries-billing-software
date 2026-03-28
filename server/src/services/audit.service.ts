import prisma from '../lib/prisma';

export interface AuditLogOptions {
  userId: string;
  action: string;
  entityId?: string;
  details?: any;
  ipAddress?: string;
}

export class AuditService {
  static async log({ userId, action, entityId, details, ipAddress }: AuditLogOptions) {
    try {
      await prisma.auditLog.create({
        data: {
          userId,
          action,
          entityId,
          details: details ? JSON.stringify(details) : null,
          ipAddress,
        },
      });
    } catch (error) {
      // Don't crash the main request if logging fails, but log to console
      console.error('Failed to create audit log:', error);
    }
  }

  /**
   * Special logger for invoice cancellations
   */
  static async logInvoiceCancel(userId: string, invoiceId: string, invoiceNumber: string) {
    return this.log({
      userId,
      action: 'INVOICE_CANCELLED',
      entityId: invoiceId,
      details: { invoiceNumber },
    });
  }

  /**
   * Special logger for price overrides (if we add that feature)
   */
  static async logPriceOverride(userId: string, productId: string, oldPrice: number, newPrice: number) {
    return this.log({
      userId,
      action: 'PRICE_OVERRIDE',
      entityId: productId,
      details: { oldPrice, newPrice },
    });
  }
}
