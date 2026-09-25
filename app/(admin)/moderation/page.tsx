'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';

interface Category { id: string; name: string; }
interface Product { id: string; title: string; price: number; category: string; images: string; seller: { email: string; } }
interface AdminOrder {
  id: string; totalAmount: number; currency: string; createdAt: string;
  user: { name: string | null; email: string; };
  items: {
    id: string; title: string; price: number; quantity: number; status: string; shippingProof: string | null;
    seller: { name: string | null; email: string; };
  }[];
}

export default function ModerationPage() {
  const { data: session } = useSession();
  const router = useRouter();

  const [categories, setCategories] = useState<Category[]>([]);
  const [newCat, setNewCat] = useState('');
  const [pendingProducts, setPendingProducts] = useState<Product[]>([]);
  const [allOrders, setAllOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);

  // Состояние для модального окна просмотра фотоотчета
  const [modalImage, setModalImage] = useState<string | null>(null);

  useEffect(() => {
    if (session && session.user.role !== 'ADMIN') router.push('/');
  }, [session, router]);

  const fetchData = async () => {
    try {
      const [cRes, pRes, oRes] = await Promise.all([
        fetch('/api/categories'), fetch('/api/admin/products'), fetch('/api/admin/orders'),
      ]);
      if (cRes.ok) setCategories(await cRes.json());
      if (pRes.ok) setPendingProducts(await pRes.json());
      if (oRes.ok) setAllOrders(await oRes.json());
    } catch (e) { console.error(e); } finally { setLoading(false); }
  };

  useEffect(() => { if (session?.user?.role === 'ADMIN') fetchData(); }, [session]);

  const handleApproveShipped = async (orderItemId: string) => {
    try {
      const res = await fetch('/api/admin/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId, status: 'SHIPPED' }),
      });
      if (res.ok) fetchData();
    } catch (e) { console.error(e); }
  };

  if (loading) return <div className="p-8 text-black font-medium">Загрузка панели админа...</div>;

  return (
    <main className="max-w-6xl mx-auto p-6 flex flex-col gap-8 relative">
      <h1 className="text-3xl font-bold text-black">🛡️ Панель Хост-Админа</h1>

      {/* УПРАВЛЕНИЕ КАТЕГОРИЯМИ И ТОВАРАМИ */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="bg-white p-6 border rounded-2xl shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4 text-black">Категории витрины</h2>
          <form onSubmit={async (e) => {
            e.preventDefault();
            if (!newCat.trim()) return;
            await fetch('/api/categories', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: newCat }) });
            setNewCat(''); fetchData();
          }} className="flex gap-2 mb-4">
            <input type="text" placeholder="Категория..." value={newCat} onChange={(e) => setNewCat(e.target.value)} className="flex-1 p-2 border rounded-xl text-sm text-black outline-none" />
            <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded-xl text-sm font-semibold cursor-pointer hover:bg-blue-700">Добавить</button>
          </form>
          <div className="flex flex-col gap-2 max-h-64 overflow-y-auto">
            {categories.map((c) => (
              <div key={c.id} className="flex justify-between items-center p-2 bg-gray-50 border rounded-lg">
                <span className="text-sm text-black">{c.name}</span>
                <button onClick={async () => { await fetch('/api/categories', { method: 'DELETE', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name: c.name }) }); fetchData(); }} className="text-red-500 text-xs cursor-pointer hover:text-red-700">Удалить</button>
              </div>
            ))}
          </div>
        </div>

        <div className="lg:col-span-2 bg-white p-6 border rounded-2xl shadow-sm">
          <h2 className="text-xl font-bold mb-4 text-black">Товары на проверке</h2>
          {pendingProducts.length === 0 ? <p className="text-gray-500 text-sm">Нет товаров на модерации.</p> : (
            <div className="flex flex-col gap-3">
              {pendingProducts.map((p) => (
                <div key={p.id} className="border p-3 rounded-xl flex justify-between items-center bg-gray-50">
                  <div>
                    <h3 className="font-bold text-black text-sm">{p.title}</h3>
                    <p className="text-xs text-gray-500">Продавец: {p.seller?.email}</p>
                  </div>
                  <div className="flex gap-2">
                    <button onClick={async () => { await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, status: 'APPROVED' }) }); fetchData(); }} className="bg-green-600 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer">Одобрить</button>
                    <button onClick={async () => { await fetch('/api/admin/products', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ productId: p.id, status: 'REJECTED' }) }); fetchData(); }} className="bg-red-500 text-white px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer">Отклонить</button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* БУХГАЛТЕРИЯ ПЛАТФОРМЫ И ПРОВЕРКА ФОТООТЧЕТОВ ОТПРАВКИ */}
      <div className="bg-white p-6 border rounded-2xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-black">💰 Бухгалтерия платформы и проверка отправок по фотоотчетам</h2>
        {allOrders.length === 0 ? <p className="text-gray-500 text-sm">Нет заказов.</p> : (
          <div className="flex flex-col gap-4">
            {allOrders.map((order) => (
              <div key={order.id} className="border p-4 rounded-xl bg-gray-50">
                <div className="flex justify-between items-center mb-3 pb-2 border-b">
                  <div>
                    <span className="text-xs text-gray-400 font-mono">Заказ ID: {order.id}</span>
                    <p className="text-xs text-gray-600">Покупатель: <span className="font-semibold text-black">{order.user?.name || order.user?.email}</span></p>
                  </div>
                  <span className="text-xs font-bold text-gray-700">{order.totalAmount.toLocaleString('ru-RU')} {order.currency}</span>
                </div>

                <div className="flex flex-col gap-3">
                  {order.items.map((item) => (
                    <div key={item.id} className="bg-white p-3 rounded-xl border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                      <div>
                        <h4 className="font-bold text-black text-sm">{item.title} <span className="text-blue-600">x{item.quantity}</span></h4>
                        <p className="text-xs text-gray-500">Продавец: <span className="font-semibold text-black">{item.seller?.name || item.seller?.email}</span></p>
                        <p className="text-xs font-bold text-green-600 mt-0.5">Цена: {item.price.toLocaleString('ru-RU')} ₩</p>
                      </div>

                      <div className="flex flex-col sm:items-end gap-2 w-full sm:w-auto">
                        <span className={`text-[11px] px-2.5 py-0.5 rounded-full font-bold ${
                          item.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : item.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                        }`}>
                          {item.status === 'PROCESSING' ? '🕒 В обработке' : item.status === 'SHIPPED' ? '🚀 Отправлен' : '✅ Доставлен'}
                        </span>

                        {item.shippingProof ? (
                          <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-lg border">
                            {/* Клик по картинке открывает модальное окно */}
                            <div
                              onClick={() => setModalImage(item.shippingProof)}
                              className="cursor-pointer group relative"
                              title="Нажмите для просмотра на весь экран"
                            >
                              <img
                                src={item.shippingProof}
                                alt="Чек"
                                className="w-12 h-12 object-cover rounded border group-hover:opacity-80 transition shadow-sm"
                              />
                            </div>
                            <div className="flex flex-col">
                              <span className="text-[11px] font-bold text-black">Фотоотчет прикреплен</span>
                              <button
                                type="button"
                                onClick={() => setModalImage(item.shippingProof)}
                                className="text-[10px] text-blue-600 underline font-medium text-left cursor-pointer bg-transparent border-none p-0"
                              >
                                Увеличить на весь экран
                              </button>
                            </div>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 italic">Продавец еще не загрузил фото</span>
                        )}

                        {item.status === 'PROCESSING' && item.shippingProof && (
                          <button
                            onClick={() => handleApproveShipped(item.id)}
                            className="bg-blue-600 text-white text-xs px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer w-full sm:w-auto mt-1"
                          >
                            ✅ Подтвердить отправку (SHIPPED)
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
      </div>

      {/* МОДАЛЬНОЕ ОКНО ПРОСМОТРА ФОТООТЧЕТА (ЛАЙТБОКС) */}
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
              alt="Фотоотчет во весь экран"
              className="max-w-full max-h-[80vh] object-contain rounded-xl border"
            />
            <p className="text-xs text-gray-500 mt-2 font-medium">Проверка фотоотчета отправки от продавца</p>
          </div>
        </div>
      )}
    </main>
  );
}