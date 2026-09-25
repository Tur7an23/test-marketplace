import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    // Распаковываем params через await, чтобы поддерживать новые версии Next.js!
    const resolvedParams = await params;
    const productId = resolvedParams.id;

    if (!productId) {
      return NextResponse.json({ error: 'ID товара не указан' }, { status: 400 });
    }

    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        seller: {
          select: { name: true, email: true },
        },
      },
    });

    if (!product) {
      return NextResponse.json({ error: 'Товар не найден' }, { status: 404 });
    }

    return NextResponse.json(product);
  } catch (error) {
    console.error('Ошибка сервера при получении товара:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}