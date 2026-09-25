import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

// Дефолтные категории для первой инициализации
const INITIAL_CATEGORIES = [
  '💄 K-Beauty & Косметика',
  '🎤 K-Pop & Мерч',
  '📱 Электроника & Гаджеты',
  '👟 Одежда & Обувь',
  '🍜 Еда & Сладости',
  '📦 Разное',
];

// GET: Получить все категории (автоматически создаст базовые, если база пустая)
export async function GET() {
  try {
    let categories = await prisma.category.findMany({
      orderBy: { createdAt: 'asc' },
    });

    // Если в базе еще нет категорий — наполняем стартовыми!
    if (categories.length === 0) {
      await prisma.category.createMany({
        data: INITIAL_CATEGORIES.map((name) => ({ name })),
      });
      categories = await prisma.category.findMany({
        orderBy: { createdAt: 'asc' },
      });
    }

    return NextResponse.json(categories);
  } catch (error) {
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}

// POST: Добавить новую категорию (Только для ADMIN!)
export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Доступ только для Хост-Администратора' }, { status: 403 });
    }

    const { name } = await request.json();

    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Название категории не может быть пустым' }, { status: 400 });
    }

    const newCategory = await prisma.category.create({
      data: { name: name.trim() },
    });

    return NextResponse.json(newCategory);
  } catch (error: any) {
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Такая категория уже существует' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Ошибка сервера' }, { status: 500 });
  }
}