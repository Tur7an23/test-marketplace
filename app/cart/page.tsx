'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useSession } from 'next-auth/react';
import { useCurrency } from '@/lib/CurrencyContext';

interface CartItem {
  id: string;
  title: string;
  price: number;
  images: string;
  quantity: number;
}

export default function CartPage() {
  const { data: session } = useSession();
  const { formatPrice, currency } = useCurrency();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    const savedCart = localStorage.getItem('cart');
    if (savedCart) {
      try {
        setCart(JSON.parse(savedCart));
      } catch (e) {}
    }
  }, []);

  const updateQuantity = (id: string, delta: number) => {
    const updated = cart
      .map((item) => {
        if (item.id === id) {
          const newQty = item.quantity + delta;
          return newQty > 0 ? { ...item, quantity: newQty } : null;
        }
        return item;
      })
      .filter(Boolean) as CartItem[];

    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const removeItem = (id: string) => {
    const updated = cart.filter((item) => item.id !== id);
    setCart(updated);
    localStorage.setItem('cart', JSON.stringify(updated));
  };

  const totalKRW = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

  const handleCheckout = async () => {
    if (!session) {
      alert('Пожалуйста, войдите в аккаунт для оформления заказа!');
      return;
    }

    setLoading(true);

    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: cart,
          totalAmount: totalKRW,
          currency,
        }),
      });

      if (res.ok) {
        setCart([]);
        localStorage.removeItem('cart');
        setOrderSuccess(true);
      } else {
        alert('Ошибка при оформлении заказа.');
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (orderSuccess) {
    return (
      <main className="max-w-xl mx-auto p-8 my-12 bg-white border rounded-2xl text-center shadow-sm">
        <div className="text-5xl mb-4">🎉</div>
        <h1 className="text-2xl font-bold mb-2 text-black">Заказ успешно оформлен!</h1>
        <p className="text-gray-600 text-sm mb-6">
          Спасибо за покупку! Продавец из Кореи уже начал подготовку вашего товара.
        </p>
        <div className="flex justify-center gap-4">
          <Link
            href="/orders"
            className="bg-blue-600 text-white px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-blue-700 transition"
          >
            Мои заказы
          </Link>
          <Link
            href="/"
            className="bg-gray-100 text-gray-800 px-5 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-200 transition"
          >
            На витрину
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6 text-black">Корзина</h1>

      {cart.length === 0 ? (
        <div className="bg-white p-12 border rounded-2xl text-center text-gray-500">
          Ваша корзина пуста.{' '}
          <Link href="/" className="text-blue-600 font-semibold hover:underline">
            Перейти к покупкам
          </Link>
        </div>
      ) : (
        <div className="flex flex-col lg:flex-row gap-8">
          <div className="flex-1 flex flex-col gap-4">
            {cart.map((item) => {
              let imagesList: string[] = [];
              try { imagesList = JSON.parse(item.images || '[]'); } catch (e) {}

              return (
                <div key={item.id} className="bg-white border p-4 rounded-xl flex items-center justify-between gap-4 shadow-2xs">
                  <div className="flex items-center gap-4">
                    {imagesList[0] && (
                      <img src={imagesList[0]} alt="" className="w-16 h-16 object-cover rounded-lg border" />
                    )}
                    <div>
                      <h3 className="font-bold text-black text-sm">{item.title}</h3>
                      <p className="text-sm font-bold text-green-600">{formatPrice(item.price)}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <div className="flex items-center border rounded-lg bg-gray-50">
                      <button
                        onClick={() => updateQuantity(item.id, -1)}
                        className="px-2.5 py-1 text-black font-bold hover:bg-gray-200 rounded-l-lg"
                      >
                        -
                      </button>
                      <span className="px-3 text-xs font-bold text-black">{item.quantity}</span>
                      <button
                        onClick={() => updateQuantity(item.id, 1)}
                        className="px-2.5 py-1 text-black font-bold hover:bg-gray-200 rounded-r-lg"
                      >
                        +
                      </button>
                    </div>

                    <button
                      onClick={() => removeItem(item.id)}
                      className="text-red-500 hover:text-red-700 text-xs font-semibold p-1"
                    >
                      Удалить
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="w-full lg:w-80 bg-white border p-6 rounded-2xl shadow-sm h-fit">
            <h2 className="text-lg font-bold mb-4 text-black">Итого</h2>
            <div className="flex justify-between items-center mb-6 text-xl font-extrabold text-black">
              <span>Сумма:</span>
              <span className="text-green-600">{formatPrice(totalKRW)}</span>
            </div>

            <button
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-blue-600 text-white py-3.5 rounded-xl font-semibold hover:bg-blue-700 transition disabled:opacity-50 shadow-sm cursor-pointer"
            >
              {loading ? 'Оформление...' : 'Оформить заказ'}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}