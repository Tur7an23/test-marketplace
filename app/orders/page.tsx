'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCurrency } from '@/lib/CurrencyContext';

interface OrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  status: string;
  shippingProof: string | null;
}

interface Order {
  id: string;
  totalAmount: number;
  currency: string;
  status: string;
  createdAt: string;
  items: OrderItem[];
}

export default function BuyerOrdersPage() {
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalImage, setModalImage] = useState<string | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch('/api/buyer/orders', { cache: 'no-store' });
      if (res.ok) {
        setOrders(await res.json());
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (session) fetchOrders();
  }, [session]);

  const handleDeliver = async (orderItemId: string) => {
    try {
      const res = await fetch('/api/buyer/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId, status: 'DELIVERED' }),
      });
      if (res.ok) fetchOrders();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div className="p-8 text-black">Загрузка заказов...</div>;

  return (
    <main className="max-w-4xl mx-auto p-6 flex flex-col gap-6 relative">
      <h1 className="text-2xl font-bold text-black">📦 Мои заказы</h1>
      {orders.length === 0 ? (
        <p className="text-gray-500 text-sm">У вас пока нет заказов.</p>
      ) : (
        <div className="flex flex-col gap-4">
          {orders.map((order) => (
            <div key={order.id} className="border p-5 rounded-2xl bg-white shadow-sm flex flex-col gap-4">
              <div className="flex justify-between items-center pb-3 border-b">
                <div>
                  <span className="text-xs text-gray-400 font-mono">Заказ ID: {order.id}</span>
                  <p className="text-xs text-gray-500">Дата: {new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                <div className="text-right">
                  <span className="text-sm font-extrabold text-black">
                    {order.totalAmount.toLocaleString('ru-RU')} {order.currency}
                  </span>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                {order.items.map((item) => (
                  <div key={item.id} className="border p-3 rounded-xl bg-gray-50 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                    <div>
                      <h4 className="font-bold text-black text-sm">
                        {item.title} <span className="text-blue-600">x{item.quantity}</span>
                      </h4>
                      <p className="text-xs text-green-600 font-semibold mt-0.5">
                        {formatPrice(item.price * item.quantity)}
                      </p>
                    </div>

                    <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                      {/* СТАТУС ТОВАРА */}
                      <span
                        className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          item.status === 'SHIPPED'
                            ? 'bg-blue-100 text-blue-800'
                            : item.status === 'DELIVERED'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {item.status === 'PROCESSING'
                          ? '🕒 В обработке'
                          : item.status === 'SHIPPED'
                          ? '🚀 Отправлен'
                          : '✅ Доставлен'}
                      </span>

                      {/* КНОПКА ПРОСМОТРА ФОТООТЧЕТА ДЛЯ ПОКУПАТЕЛЯ */}
                      {item.shippingProof && (
                        <div className="flex items-center gap-2 bg-white p-2 rounded-lg border shadow-sm">
                          <img
                            src={item.shippingProof}
                            alt="Фотоотчет"
                            onClick={() => setModalImage(item.shippingProof)}
                            className="w-10 h-10 object-cover rounded cursor-pointer hover:opacity-80 transition"
                            title="Увеличить фото"
                          />
                          <button
                            type="button"
                            onClick={() => setModalImage(item.shippingProof)}
                            className="text-[10px] text-blue-600 underline font-medium bg-transparent border-none p-0 cursor-pointer text-left"
                          >
                            Посмотреть фотоотчет отправки
                          </button>
                        </div>
                      )}

                      {/* КНОПКА ПОДТВЕРЖДЕНИЯ ПОЛУЧЕНИЯ */}
                      {item.status === 'SHIPPED' && (
                        <button
                          type="button"
                          onClick={() => handleDeliver(item.id)}
                          className="bg-green-600 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-green-700 transition cursor-pointer w-full sm:w-auto mt-1"
                        >
                          📦 Я получил заказ
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* МОДАЛЬНОЕ ОКНО ДЛЯ ПРОСМОТРА ФОТО ПОКУПАТЕЛЕМ (ЛАЙТБОКС) */}
      {modalImage && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setModalImage(null)}
        >
          <div
            className="relative max-w-4xl max-h-[90vh] bg-white p-3 rounded-2xl shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setModalImage(null)}
              className="absolute -top-3 -right-3 bg-red-600 hover:bg-red-700 text-white font-bold w-9 h-9 rounded-full flex items-center justify-center transition cursor-pointer shadow-lg text-sm"
              title="Закрыть"
            >
              ✕
            </button>
            <img
              src={modalImage}
              alt="Фотоотчет отправки"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">Фотоотчет отправки от продавца</p>
          </div>
        </div>
      )}
    </main>
  );
}