import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const orders = await prisma.order.findMany({
      include: {
        user: { select: { name: true, email: true } },
        items: {
          include: {
            seller: { select: { name: true, email: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    console.error('API ADMIN ORDERS GET ERROR:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// Админ подтверждает отправку конкретного товара (OrderItem -> SHIPPED)
export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { orderItemId, status } = await request.json();
    console.log('ADMIN PATCH REQUEST:', { orderItemId, status });

    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { status: status || 'SHIPPED' },
    });

    console.log('ORDER ITEM UPDATED SUCCESSFULLY:', updated);
    return NextResponse.json(updated);
  } catch (error) {
    console.error('API ADMIN ORDERS PATCH ERROR:', error);
    return NextResponse.json({ error: 'Ошибка сервера', details: String(error) }, { status: 500 });
  }
}