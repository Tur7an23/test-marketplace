import { NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const files = formData.getAll('files') as File[];

    if (!files || files.length === 0) {
      return NextResponse.json({ error: 'Файлы не выбраны' }, { status: 400 });
    }

    const uploadDir = path.join(process.cwd(), 'public', 'uploads');
    await mkdir(uploadDir, { recursive: true });

    const savedUrls: string[] = [];

    for (const file of files) {
      if (!file.name) continue;
      const bytes = await file.arrayBuffer();
      const buffer = Buffer.from(bytes);

      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = path.extname(file.name) || '.jpg';
      const filename = `${uniqueSuffix}${ext}`;
      const filePath = path.join(uploadDir, filename);

      await writeFile(filePath, buffer);
      savedUrls.push(`/uploads/${filename}`);
    }

    return NextResponse.json({ urls: savedUrls });
  } catch (error) {
    console.error('Ошибка при сохранении файлов:', error);
    return NextResponse.json({ error: 'Не удалось сохранить файлы' }, { status: 500 });
  }
}