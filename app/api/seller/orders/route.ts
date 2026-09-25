import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic'; // Запрещаем кэшировать этот эндпоинт

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SELLER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const items = await prisma.orderItem.findMany({
      where: { sellerId: session.user.id },
      include: {
        order: {
          include: { user: { select: { name: true, email: true } } },
        },
      },
      orderBy: { order: { createdAt: 'desc' } },
    });

    return NextResponse.json(items);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SELLER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const { orderItemId, shippingProof } = await request.json();

    const updated = await prisma.orderItem.update({
      where: { id: orderItemId },
      data: { shippingProof },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}