'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export default function RegisterPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('BUYER');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const res = await fetch('/api/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name, role }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Ошибка при регистрации');
      } else {
        // После успешной регистрации отправляем на страницу входа
        router.push('/login?registered=true');
      }
    } catch (err) {
      setError('Не удалось связаться с сервером');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="max-w-md mx-auto mt-16 p-6 border rounded-xl shadow-md bg-white">
      <h1 className="text-2xl font-bold mb-6 text-center text-black">Регистрация аккаунта</h1>

      {error && (
        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 text-sm rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <div>
          <label className="block text-sm font-medium mb-1 text-black">Ваше имя</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full p-2 border rounded border-gray-300 text-black"
            placeholder="Иван Иванов"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-black">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full p-2 border rounded border-gray-300 text-black"
            placeholder="user@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-black">Пароль</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="w-full p-2 border rounded border-gray-300 text-black"
            placeholder="••••••••"
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1 text-black">Кто вы на маркетплейсе?</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            className="w-full p-2 border rounded border-gray-300 text-black bg-white"
          >
            <option value="BUYER">Покупатель</option>
            <option value="SELLER">Продавец</option>
          </select>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 text-white py-2 rounded font-medium hover:bg-blue-700 disabled:opacity-50 mt-2"
        >
          {loading ? 'Зарегистрироваться...' : 'Зарегистрироваться'}
        </button>
      </form>

      <p className="mt-4 text-center text-sm text-gray-600">
        Уже есть аккаунт?{' '}
        <Link href="/login" className="text-blue-600 font-medium hover:underline">
          Войти
        </Link>
      </p>
    </main>
  );
}