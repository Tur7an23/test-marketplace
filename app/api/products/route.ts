import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

// GET: Получение одобренных товаров для витрины
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get('category');
    const search = searchParams.get('search');
    const country = searchParams.get('country');

    const where: any = {
      status: 'APPROVED', // На витрине только одобренные админом товары
    };

    if (category && category !== 'Все') {
      where.category = category;
    }

    if (search) {
      where.OR = [
        { title: { contains: search } },
        { description: { contains: search } },
        { tags: { contains: search } },
      ];
    }

    if (country) {
      where.shippingCountries = { contains: country };
    }

    const products = await prisma.product.findMany({
      where,
      include: { seller: { select: { email: true, name: true } } },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(products);
  } catch (error) {
    console.error('API PRODUCTS GET ERROR:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST: Создание товара продавцом
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || !['SELLER', 'ADMIN'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Доступ запрещен' }, { status: 403 });
    }

    const body = await request.json();
    const { title, description, category, tags, price, images, shippingCountries } = body;

    if (!title || !price) {
      return NextResponse.json({ error: 'Заполните обязательные поля' }, { status: 400 });
    }

    const newProduct = await prisma.product.create({
      data: {
        title,
        description: description || '',
        category: category || 'Разное',
        tags: tags || '[]',
        price: parseFloat(price),
        images: images || '[]',
        shippingCountries: shippingCountries || '["RU","KZ","UZ","BY"]',
        status: 'PENDING', // Требует модерации хост-админом
        sellerId: session.user.id,
      },
    });

    return NextResponse.json(newProduct, { status: 201 });
  } catch (error) {
    console.error('API PRODUCTS POST ERROR:', error);
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}