'use client';

import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useCurrency } from '@/lib/CurrencyContext';

export default function Header() {
  const { data: session } = useSession();
  const { currency, setCurrency } = useCurrency();

  return (
    <header className="bg-white border-b sticky top-0 z-40">
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="font-extrabold text-xl text-black flex items-center gap-2">
          Marketplace <span className="text-xs font-normal text-gray-500">СНГ-Корея</span>
        </Link>

        <nav className="flex items-center gap-6">
          <Link href="/" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
            Витрина
          </Link>

          {session && (
            <Link href="/orders" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
              📦 Мои заказы
            </Link>
          )}

          <Link href="/cart" className="text-sm font-semibold text-gray-700 hover:text-blue-600 transition">
            🛒 Корзина
          </Link>

          {session?.user?.role === 'SELLER' && (
            <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
              🛍️ Кабинет продавца
            </Link>
          )}

          {session?.user?.role === 'ADMIN' && (
            <>
              <Link href="/dashboard" className="text-sm font-semibold text-blue-600 hover:text-blue-800 transition">
                🛍️ Кабинет продавца
              </Link>
              <Link href="/moderation" className="text-sm font-semibold text-red-600 hover:text-red-800 transition">
                🛡️ Модерация
              </Link>
            </>
          )}
        </nav>

        <div className="flex items-center gap-4">
          <select
            value={currency}
            onChange={(e) => setCurrency(e.target.value as 'RUB' | 'KZT' | 'UZS' | 'BYN' | 'USD' | 'KRW')}
            className="text-xs font-bold border rounded-lg px-2.5 py-1.5 bg-gray-50 text-black outline-none cursor-pointer"
          >
            <option value="RUB">RU RUB (₽)</option>
            <option value="KZT">KZ KZT (₸)</option>
            <option value="UZS">UZ UZS (сум)</option>
            <option value="BYN">BY BYN (Br)</option>
            <option value="USD">US USD ($)</option>
            <option value="KRW">KR KRW (₩)</option>
          </select>

          {session ? (
            <div className="flex items-center gap-3 border-l pl-4">
              <div className="flex flex-col text-right">
                <span className="text-xs font-bold text-black">{session.user.name || 'Пользователь'}</span>
                <span className="text-[10px] bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded font-mono font-bold w-fit ml-auto">
                  {session.user.role}
                </span>
              </div>
              <button
                onClick={() => signOut()}
                className="text-xs bg-red-50 hover:bg-red-100 text-red-600 border border-red-200 px-3 py-1.5 rounded-lg font-semibold transition cursor-pointer"
              >
                Выйти
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link
                href="/login"
                className="text-xs bg-gray-100 hover:bg-gray-200 text-black px-3.5 py-2 rounded-lg font-semibold transition"
              >
                Войти
              </Link>
              <Link
                href="/register"
                className="text-xs bg-blue-600 hover:bg-blue-700 text-white px-3.5 py-2 rounded-lg font-semibold transition shadow-sm"
              >
                Регистрация
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}