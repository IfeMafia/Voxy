import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auth = getAuthUser(req);
    let businessId = searchParams.get('businessId') || auth?.businessId || auth?.id;

    // Fallback: If not passed, find first matching business or user
    if (!businessId) {
      const firstBiz = await prisma.business.findFirst({ select: { id: true } });
      businessId = firstBiz?.id;
    }

    if (!businessId) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    // 1. Fetch unread alerts from Alert table
    const alerts = await prisma.alert.findMany({
      where: { businessId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const alertNotifications = alerts.map((a: any) => {
      let link = '/business/inbox';
      if (a.type?.includes('ORDER') || a.type?.includes('PAYMENT')) {
        link = '/business/orders';
      }
      return {
        id: a.id,
        customer_name: a.title || 'Notification',
        message: a.message,
        time: a.createdAt,
        type: a.type || 'ALERT',
        link,
      };
    });

    // 2. Also fetch recent orders (last 24 hours) as live notifications if alert list is small
    const recentOrders = await prisma.order.findMany({
      where: {
        businessId,
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
      },
      include: {
        customer: { select: { name: true, phone: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 5
    });

    const orderNotifications = recentOrders.map((o) => ({
      id: `ord_${o.id}`,
      customer_name: o.status === 'paid' ? `Payment Received (${o.customer?.name || 'Customer'})` : `New Order #${o.id.slice(-6)}`,
      message: `${o.customer?.name || 'Customer'} placed an order for NGN ${(o.totalKobo / 100).toLocaleString()} • Status: ${o.status.toUpperCase()}`,
      time: o.createdAt,
      type: o.status === 'paid' ? 'PAYMENT_SUCCESS' : 'ORDER_CREATED',
      link: '/business/orders',
    }));

    // Deduplicate notifications by id or combine alerts + recent orders
    const combined = [...alertNotifications];
    const seenIds = new Set(alertNotifications.map((n) => n.id));

    for (const ordNotif of orderNotifications) {
      if (!seenIds.has(ordNotif.id)) {
        combined.push(ordNotif);
        seenIds.add(ordNotif.id);
      }
    }

    // Sort by latest time
    combined.sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime());

    return NextResponse.json({ success: true, notifications: combined });
  } catch (err: any) {
    console.error('[NotificationsAPI] Error fetching notifications:', err?.message);
    return NextResponse.json({ success: true, notifications: [] });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const auth = getAuthUser(req);
    let businessId = searchParams.get('businessId') || auth?.businessId || auth?.id;

    if (!businessId) {
      const firstBiz = await prisma.business.findFirst({ select: { id: true } });
      businessId = firstBiz?.id;
    }

    if (businessId) {
      await prisma.alert.updateMany({
        where: { businessId, isRead: false },
        data: { isRead: true },
      });
    }

    return NextResponse.json({ success: true, message: 'All notifications marked as read' });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}
