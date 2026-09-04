import { prisma } from '@/lib/prisma';
import { WalletService } from './wallet-service';

export class OperationsService {
  /**
   * Logs an AI agent action for auditing and owner visibility.
   */
  static async logAgentActivity(params: {
    businessId: string;
    customerId?: string;
    conversationId?: string;
    action: string;
    resourceType?: string;
    resourceId?: string;
    initiator?: string;
    result?: string;
    details?: Record<string, any>;
  }) {
    return prisma.agentActivity.create({
      data: {
        businessId: params.businessId,
        customerId: params.customerId,
        conversationId: params.conversationId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        initiator: params.initiator || 'AGENT',
        result: params.result || 'SUCCESS',
        details: params.details || {},
      },
    });
  }

  /**
   * Logs a system-level audit event.
   */
  static async logAuditEvent(params: {
    businessId?: string;
    actorType: 'SYSTEM' | 'BUSINESS_USER' | 'AGENT' | 'WEBHOOK';
    actorId?: string;
    action: string;
    resourceType: string;
    resourceId?: string;
    metadata?: Record<string, any>;
  }) {
    return prisma.auditLog.create({
      data: {
        businessId: params.businessId,
        actorType: params.actorType,
        actorId: params.actorId,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId,
        metadata: params.metadata || {},
      },
    });
  }

  /**
   * Creates an operational alert notification for a business.
   */
  static async createAlert(params: {
    businessId: string;
    type: 'PAYMENT_SUCCESS' | 'PAYMENT_FAILED' | 'WITHDRAWAL_SUCCESS' | 'WITHDRAWAL_FAILED' | 'UNUSUAL_EVENT';
    title: string;
    message: string;
    metadata?: Record<string, any>;
  }) {
    return prisma.alert.create({
      data: {
        businessId: params.businessId,
        type: params.type,
        title: params.title,
        message: params.message,
        metadata: params.metadata || {},
      },
    });
  }

  /**
   * Fetches aggregated dashboard metrics for the business dashboard.
   */
  static async getDashboardOverview(businessId: string) {
    const [balanceInfo, ordersCount, paidOrdersCount, recentOrders, recentPayments, recentLedger, agentActivities, alerts] = await Promise.all([
      WalletService.getBalanceInfo(businessId),
      prisma.order.count({ where: { businessId } }),
      prisma.order.count({ where: { businessId, status: 'paid' } }),
      prisma.order.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { id: true, name: true, phone: true, email: true } },
          items: { include: { product: { select: { name: true } } } },
        },
      }),
      prisma.payment.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: {
          customer: { select: { id: true, name: true } },
          order: { select: { id: true, totalKobo: true } },
        },
      }),
      prisma.ledgerTransaction.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 5,
      }),
      prisma.agentActivity.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
      prisma.alert.findMany({
        where: { businessId },
        orderBy: { createdAt: 'desc' },
        take: 10,
      }),
    ]);

    return {
      businessId,
      metrics: {
        totalOrders: ordersCount,
        paidOrders: paidOrdersCount,
        availableBalanceKobo: balanceInfo.availableBalanceKobo,
        pendingBalanceKobo: balanceInfo.pendingBalanceKobo,
        totalReceivedKobo: balanceInfo.totalReceivedKobo,
        totalWithdrawnKobo: balanceInfo.totalWithdrawnKobo,
        formattedAvailableBalance: balanceInfo.formattedAvailableBalance,
        formattedTotalReceived: balanceInfo.formattedTotalReceived,
        formattedTotalWithdrawn: balanceInfo.formattedTotalWithdrawn,
      },
      recentOrders,
      recentPayments,
      recentLedgerTransactions: recentLedger,
      recentAgentActivities: agentActivities,
      recentAlerts: alerts,
    };
  }
}
