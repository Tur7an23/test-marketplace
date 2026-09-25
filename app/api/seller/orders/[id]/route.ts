import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const { id } = await context.params;

    const order = await prisma.order.findUnique({ where: { id } });
    if (!order || order.userId !== session.user.id) {
      return NextResponse.json({ error: 'Заказ не найден' }, { status: 404 });
    }

    const updated = await prisma.order.update({
      where: { id },
      data: { status: 'DELIVERED' },
    });

    return NextResponse.json(updated);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}