'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useCurrency } from '@/lib/CurrencyContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string;
  category: string;
  tags: string;
  status: string;
  shippingCountries: string;
}

interface Category {
  id: string;
  name: string;
}

interface SellerOrderItem {
  id: string;
  title: string;
  price: number;
  quantity: number;
  status: string;
  shippingProof: string | null;
  order: {
    id: string;
    createdAt: string;
    user: {
      name: string | null;
      email: string;
    };
  };
}

const MARKETPLACE_FEE_PERCENT = 5;
const COUNTRY_OPTIONS = [
  { code: 'RU', name: '🇷🇺 Россия', rate: 0.068, symbol: '₽', round: 10 },
  { code: 'KZ', name: '🇰🇿 Казахстан', rate: 0.36, symbol: '₸', round: 100 },
  { code: 'UZ', name: '🇺🇿 Узбекистан', rate: 9.6, symbol: 'сум', round: 1000 },
  { code: 'BY', name: '🇧🇾 Беларусь', rate: 0.0024, symbol: 'Br', round: 1 },
];

export default function SellerDashboard() {
  const { data: session } = useSession();
  const { formatPrice } = useCurrency();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [categories, setCategories] = useState<Category[]>([]);
  const [category, setCategory] = useState('');
  const [tagsInput, setTagsInput] = useState('');
  const [priceInput, setPriceInput] = useState('');
  const [selectedCountries, setSelectedCountries] = useState<string[]>(['RU', 'KZ', 'UZ', 'BY']);
  const [files, setFiles] = useState<FileList | null>(null);
  const [myProducts, setMyProducts] = useState<Product[]>([]);
  const [sellerOrders, setSellerOrders] = useState<SellerOrderItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [proofFiles, setProofFiles] = useState<{ [key: string]: File }>({});

  // Состояние для модального окна просмотра фотоотчета
  const [modalImage, setModalImage] = useState<string | null>(null);

 const fetchData = async () => {
    try {
      const [prodRes, catRes, ordRes] = await Promise.all([
        fetch('/api/seller/products', { cache: 'no-store' }),
        fetch('/api/categories', { cache: 'no-store' }),
        fetch('/api/seller/orders', { cache: 'no-store' }),
      ]);

      if (prodRes.ok) setMyProducts(await prodRes.json());
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
        if (catData.length > 0) setCategory(catData[0].name);
      }
      if (ordRes.ok) setSellerOrders(await ordRes.json());
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (session) fetchData();
  }, [session]);

  const handlePriceInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawDigits = e.target.value.replace(/\D/g, '');
    if (!rawDigits) { setPriceInput(''); return; }
    setPriceInput(parseInt(rawDigits, 10).toLocaleString('en-US').replace(/,/g, ', '));
  };

  const handleCountryToggle = (code: string) => {
    setSelectedCountries((prev) => prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code]);
  };

  const sellerBasePrice = parseFloat(priceInput.replace(/\D/g, '')) || 0;
  const buyerFinalPriceKRW = sellerBasePrice * (1 + MARKETPLACE_FEE_PERCENT / 100);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!buyerFinalPriceKRW || buyerFinalPriceKRW <= 0) return;
    setLoading(true);

    const tagsArray = tagsInput.split(',').map((t) => t.trim().toLowerCase()).filter((t) => t.length > 0);

    try {
      let imageUrls: string[] = [];
      if (files && files.length > 0) {
        const formData = new FormData();
        Array.from(files).forEach((file) => formData.append('files', file));
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          imageUrls = uploadData.urls;
        }
      }

      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title, description, category: category || 'Разное',
          tags: JSON.stringify(tagsArray), price: buyerFinalPriceKRW,
          images: JSON.stringify(imageUrls), shippingCountries: JSON.stringify(selectedCountries),
        }),
      });

      if (res.ok) {
        setTitle(''); setDescription(''); setTagsInput(''); setPriceInput(''); setFiles(null);
        fetchData();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleUploadProof = async (orderItemId: string) => {
    const file = proofFiles[orderItemId];
    if (!file) return;

    try {
      const formData = new FormData();
      formData.append('files', file);
      const uploadRes = await fetch('/api/upload', { method: 'POST', body: formData });
      if (!uploadRes.ok) return;
      const uploadData = await uploadRes.json();
      const imageUrl = uploadData.urls[0];

      const res = await fetch('/api/seller/orders', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderItemId, shippingProof: imageUrl }),
      });
      if (res.ok) fetchData();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <main className="max-w-5xl mx-auto p-6 flex flex-col gap-8 relative">
      <div className="flex flex-col md:flex-row gap-8">
        {/* ФОРМА ТОВАРА */}
        <div className="flex-1 bg-white p-6 border rounded-xl shadow-sm">
          <h1 className="text-2xl font-bold mb-4 text-black">Кабинет продавца — Добавить товар</h1>
          <form onSubmit={handleSubmit} className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-medium mb-1 text-black">Название товара</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} required className="w-full p-2.5 border rounded-lg text-black outline-none" placeholder="COSRX Snail" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Категория</label>
                <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-2.5 border rounded-lg text-black bg-white">
                  {categories.map((cat) => <option key={cat.id} value={cat.name}>{cat.name}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1 text-black">Теги</label>
                <input type="text" value={tagsInput} onChange={(e) => setTagsInput(e.target.value)} placeholder="косметика" className="w-full p-2.5 border rounded-lg text-black outline-none" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-black">Описание</label>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} required rows={3} className="w-full p-2.5 border rounded-lg text-black outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-black">Ваша цена (₩)</label>
              <input type="text" placeholder="100,000" value={priceInput} onChange={handlePriceInput} required className="w-full p-2.5 border rounded-lg text-black font-bold text-lg outline-none" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-black font-semibold">Страны доставки:</label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {COUNTRY_OPTIONS.map((c) => {
                  const isChecked = selectedCountries.includes(c.code);
                  return (
                    <label key={c.code} className={`flex flex-col p-3 border rounded-xl cursor-pointer ${isChecked ? 'bg-blue-50/65 border-blue-400' : 'bg-gray-50 opacity-50'}`}>
                      <div className="flex items-center gap-2.5">
                        <input type="checkbox" checked={isChecked} onChange={() => handleCountryToggle(c.code)} className="w-4 h-4" />
                        <span className="text-sm font-semibold text-black">{c.name}</span>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1 text-black">Фотографии</label>
              <input type="file" multiple accept="image/*" onChange={(e) => setFiles(e.target.files)} className="w-full p-2 border rounded-lg text-black text-sm" />
            </div>
            <button type="submit" disabled={loading} className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition cursor-pointer">
              {loading ? 'Публикация...' : 'Опубликовать товар'}
            </button>
          </form>
        </div>

        {/* СПИСОК ТОВАРОВ */}
        <div className="flex-1 bg-white p-6 border rounded-xl shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4 text-black">Мои товары</h2>
          {myProducts.length === 0 ? <p className="text-gray-500 text-sm">Нет товаров.</p> : (
            <div className="flex flex-col gap-3">
              {myProducts.map((p) => {
                let img = []; try { img = JSON.parse(p.images); } catch(e){}
                return (
                  <div key={p.id} className="border p-3 rounded-xl flex justify-between items-center bg-gray-50">
                    <div className="flex gap-3 items-center">
                      {img[0] && <img src={img[0]} className="w-12 h-12 object-cover rounded-lg border" />}
                      <div>
                        <h3 className="font-semibold text-black text-sm">{p.title}</h3>
                        <p className="text-xs text-green-600 font-bold">{formatPrice(p.price)}</p>
                      </div>
                    </div>
                    <span className={`text-[11px] px-2.5 py-1 rounded-full font-bold ${p.status === 'APPROVED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                      {p.status === 'APPROVED' ? 'Одобрен' : 'На проверке'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ЗАКАЗЫ НА ОТПРАВКУ И ЗАГРУЗКА ФОТООТЧЕТА */}
      <div className="bg-white p-6 border rounded-xl shadow-sm">
        <h2 className="text-xl font-bold mb-4 text-black">📦 Заказы для отправки (Ваши продажи)</h2>
        {sellerOrders.length === 0 ? <p className="text-gray-500 text-sm">Пока нет заказов на ваши товары.</p> : (
          <div className="flex flex-col gap-4">
            {sellerOrders.map((item) => (
              <div key={item.id} className="border p-4 rounded-xl bg-gray-50 flex flex-col gap-3">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-black text-sm">{item.title} <span className="text-blue-600">x{item.quantity}</span></h3>
                    <p className="text-xs text-gray-500">Покупатель: <span className="font-medium text-black">{item.order.user.name || item.order.user.email}</span></p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-green-600">{formatPrice(item.price * item.quantity)}</p>
                    <span className={`text-[10px] px-2 py-0.5 rounded font-bold ${
                      item.status === 'SHIPPED' ? 'bg-blue-100 text-blue-800' : item.status === 'DELIVERED' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {item.status === 'PROCESSING' ? '🕒 В обработке' : item.status === 'SHIPPED' ? '🚀 Отправлен' : '✅ Доставлен'}
                    </span>
                  </div>
                </div>

                {/* БЛОК ЗАГРУЗКИ ФОТООТЧЕТА */}
                <div className="pt-2 border-t flex flex-col sm:flex-row gap-3 items-center">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        setProofFiles({ ...proofFiles, [item.id]: e.target.files[0] });
                      }
                    }}
                    className="flex-1 p-2 border rounded-lg text-xs bg-white text-black outline-none file:mr-3 file:py-1 file:px-3 file:rounded-md file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100 cursor-pointer"
                  />
                  <button
                    onClick={() => handleUploadProof(item.id)}
                    className="bg-blue-600 text-white text-xs px-4 py-2.5 rounded-lg font-semibold hover:bg-blue-700 transition cursor-pointer w-full sm:w-auto"
                  >
                    {item.shippingProof ? '🔄 Заменить фото' : '📤 Загрузить фотоотчет'}
                  </button>
                </div>

                {item.shippingProof && (
                  <div className="flex items-center gap-3 mt-1 bg-white p-2.5 rounded-lg border">
                    <img
                      src={item.shippingProof}
                      alt="Фотоотчет"
                      onClick={() => setModalImage(item.shippingProof)}
                      className="w-14 h-14 object-cover rounded-lg border shrink-0 cursor-pointer hover:opacity-80 transition shadow-sm"
                      title="Кликните для увеличения"
                    />
                    <div>
                      <span className="text-xs font-bold text-green-600">Фотоотчет успешно загружен!</span>
                      <p className="text-[11px] text-gray-500">Ожидает проверки и подтверждения хост-админом.</p>
                      <button
                        type="button"
                        onClick={() => setModalImage(item.shippingProof)}
                        className="text-xs text-blue-600 underline font-medium block mt-0.5 bg-transparent border-none p-0 cursor-pointer text-left"
                      >
                        🔗 Увеличить фото на весь экран
                      </button>
                    </div>
                  </div>
                )}
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
            <p className="text-xs text-gray-500 mt-2 font-medium">Просмотр фотоотчета отправки</p>
          </div>
        </div>
      )}
    </main>
  );
}