'use client';

import { useState } from 'react';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email,
      password,
      redirect: false,
    });

    if (res?.error) {
      setError('Неверный email или пароль');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  const handleDemoLogin = async (demoEmail: string) => {
    setLoading(true);
    setError(null);

    const res = await signIn('credentials', {
      email: demoEmail,
      password: '123456',
      redirect: false,
    });

    if (res?.error) {
      setError('Ошибка демо-входа');
      setLoading(false);
    } else {
      router.push('/');
      router.refresh();
    }
  };

  return (
    <main className="max-w-md mx-auto my-12 p-6 bg-white border rounded-2xl shadow-sm">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Вход в аккаунт</h1>

      {error && (
        <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-200">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-black">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            placeholder="user@example.com"
            className="w-full p-2.5 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-black">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            placeholder="••••••••"
            className="w-full p-2.5 border rounded-lg text-black focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition disabled:opacity-50 cursor-pointer"
        >
          {loading ? 'Вход...' : 'Войти'}
        </button>
      </form>

      <p className="text-xs text-center text-gray-500 my-4">
        Нет аккаунта?{' '}
        <Link href="/register" className="text-blue-600 font-semibold hover:underline">
          Зарегистрироваться
        </Link>
      </p>

      <hr className="my-4 border-gray-200" />

      {/* КНОПКИ ДЕМО-ВХОДА */}
      <div className="flex flex-col gap-2">
        <p className="text-[11px] text-gray-400 text-center uppercase tracking-wider mb-1 font-semibold">
          Быстрый вход для тестов
        </p>

        <button
          onClick={() => handleDemoLogin('admin@test.com')}
          disabled={loading}
          className="w-full bg-red-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-red-700 transition shadow-2xs cursor-pointer"
        >
          Войти как Админ (admin@test.com)
        </button>

        <button
          onClick={() => handleDemoLogin('seller@test.com')}
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-2xs cursor-pointer"
        >
          Войти как Продавец (seller@test.com)
        </button>

        <button
          onClick={() => handleDemoLogin('buyer@test.com')}
          disabled={loading}
          className="w-full bg-gray-800 text-white py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-900 transition shadow-2xs cursor-pointer"
        >
          Войти как Покупатель (buyer@test.com)
        </button>
      </div>
    </main>
  );
}