import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Авторизуйтесь для оформления заказа' }, { status: 401 });
    }

    const { items, totalAmount, currency } = await request.json();

    if (!items || items.length === 0) {
      return NextResponse.json({ error: 'Корзина пуста' }, { status: 400 });
    }

    // Создаем заказ и привязываем items с sellerId каждого товара
    const order = await prisma.order.create({
      data: {
        userId: session.user.id,
        totalAmount,
        currency: currency || 'KRW',
        items: {
          create: await Promise.all(
            items.map(async (item: any) => {
              const product = await prisma.product.findUnique({ where: { id: item.id } });
              return {
                productId: item.id,
                sellerId: product ? product.sellerId : 'unknown',
                title: item.title,
                price: item.price,
                quantity: item.quantity,
              };
            })
          ),
        },
      },
      include: { items: true },
    });

    return NextResponse.json(order);
  } catch (error) {
    console.error('Ошибка при создании заказа:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Не авторизован' }, { status: 401 });
    }

    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(orders);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}