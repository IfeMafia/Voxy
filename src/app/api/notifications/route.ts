import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(req: NextRequest) {
  try {
    const auth = getAuthUser(req);
    if (!auth) {
      return NextResponse.json({ success: true, notifications: [] });
    }

    const alerts = await prisma.alert.findMany({
      where: { businessId: auth.businessId, isRead: false },
      orderBy: { createdAt: 'desc' },
      take: 20,
    });

    const notifications = alerts.map((a: any) => ({
      id: a.id,
      customer_name: a.title || 'Alert',
      message: a.message,
      time: a.createdAt,
      link: '/business/inbox',
    }));

    return NextResponse.json({ success: true, notifications });
  } catch {
    return NextResponse.json({ success: true, notifications: [] });
  }
}
