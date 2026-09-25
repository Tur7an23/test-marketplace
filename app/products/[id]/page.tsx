'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { useCurrency } from '@/lib/CurrencyContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string;
  category?: string;
  tags?: string;
  shippingCountries?: string;
}

const COUNTRY_NAMES: Record<string, string> = {
  RU: '🇷🇺 Россия',
  KZ: '🇰🇿 Казахстан',
  UZ: '🇺🇿 Узбекистан',
  BY: '🇧🇾 Беларусь',
};

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [selectedCountry, setSelectedCountry] = useState('RU');
  const [quantity, setQuantity] = useState(1);
  const [addedNotice, setAddedNotice] = useState(false);

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/products/${params.id}`);
        if (res.ok) {
          const data = await res.json();
          setProduct(data);
          
          // Парсим доступные страны доставки
          try {
            const countries = JSON.parse(data.shippingCountries || '[]');
            if (countries.length > 0) setSelectedCountry(countries[0]);
          } catch (e) {}
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    if (params.id) fetchProduct();
  }, [params.id]);

  if (loading) return <div className="p-8 text-black font-medium">Загрузка товара...</div>;
  if (!product) return <div className="p-8 text-black font-medium">Товар не найден.</div>;

  let imagesList: string[] = [];
  try { imagesList = JSON.parse(product.images || '[]'); } catch (e) {}

  let tagsList: string[] = [];
  try { tagsList = JSON.parse(product.tags || '[]'); } catch (e) {}

  let shippingList: string[] = ['RU', 'KZ', 'UZ', 'BY'];
  try { shippingList = JSON.parse(product.shippingCountries || '["RU","KZ","UZ","BY"]'); } catch (e) {}

  const handleAddToCart = () => {
    const savedCart = localStorage.getItem('cart');
    let currentCart = [];
    if (savedCart) {
      try { currentCart = JSON.parse(savedCart); } catch (e) {}
    }

    const existingIndex = currentCart.findIndex((item: any) => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += quantity;
    } else {
      currentCart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images,
        quantity: quantity,
      });
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    setAddedNotice(true);
    setTimeout(() => setAddedNotice(false), 3000);
  };

  return (
    <main className="max-w-5xl mx-auto p-6">
      <button
        onClick={() => router.back()}
        className="mb-6 text-xs bg-gray-100 hover:bg-gray-200 text-black px-4 py-2 rounded-xl font-semibold transition cursor-pointer"
      >
        ← Назад к витрине
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 bg-white border p-6 rounded-2xl shadow-sm">
        {/* ГАЛЕРЕЯ КАРТИНОК */}
        <div className="flex flex-col gap-4">
          <div className="relative w-full h-80 bg-gray-50 rounded-xl border flex items-center justify-center p-2 overflow-hidden">
            {imagesList.length > 0 ? (
              <img
                src={imagesList[activeImageIndex]}
                alt={product.title}
                className="max-h-full max-w-full object-contain rounded-lg"
              />
            ) : (
              <div className="text-gray-400 text-sm">Нет изображений</div>
            )}
          </div>

          {imagesList.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {imagesList.map((img, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImageIndex(idx)}
                  className={`w-16 h-16 rounded-lg border overflow-hidden shrink-0 transition ${
                    activeImageIndex === idx ? 'border-blue-600 ring-2 ring-blue-500/20' : 'opacity-70 hover:opacity-100'
                  }`}
                >
                  <img src={img} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ИНФОРМАЦИЯ О ТОВАРЕ */}
        <div className="flex flex-col justify-between">
          <div>
            {product.category && (
              <span className="text-xs bg-blue-50 text-blue-600 px-3 py-1 rounded-full font-bold inline-block mb-3">
                {product.category}
              </span>
            )}

            <h1 className="text-2xl font-extrabold text-black mb-2">{product.title}</h1>
            <p className="text-2xl font-black text-green-600 mb-4">{formatPrice(product.price * quantity)}</p>

            <p className="text-gray-600 text-sm mb-6 leading-relaxed">{product.description}</p>

            {tagsList.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-6">
                {tagsList.map((tag, idx) => (
                  <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-lg font-medium">
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* ВЫБОР СТРАНЫ ДОСТАВКИ */}
            <div className="mb-6">
              <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-2">
                Доступно для доставки в страну:
              </label>
              <div className="flex flex-wrap gap-2">
                {shippingList.map((code) => (
                  <button
                    key={code}
                    onClick={() => setSelectedCountry(code)}
                    className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition cursor-pointer ${
                      selectedCountry === code
                        ? 'bg-blue-600 text-white shadow-sm'
                        : 'bg-gray-50 text-gray-700 border hover:bg-gray-100'
                    }`}
                  >
                    {COUNTRY_NAMES[code] || code}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-4 pt-4 border-t">
            {/* СЧЕТЧИК КОЛИЧЕСТВА */}
            <div className="flex items-center border rounded-xl bg-gray-50 h-12">
              <button
                onClick={() => setQuantity(Math.max(1, quantity - 1))}
                className="px-4 py-2 text-black font-bold hover:bg-gray-200 rounded-l-xl transition"
              >
                -
              </button>
              <span className="px-4 text-sm font-bold text-black">{quantity}</span>
              <button
                onClick={() => setQuantity(quantity + 1)}
                className="px-4 py-2 text-black font-bold hover:bg-gray-200 rounded-r-xl transition"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 bg-blue-600 text-white h-12 rounded-xl font-semibold text-sm hover:bg-blue-700 transition shadow-sm cursor-pointer"
            >
              Добавить в корзину
            </button>
          </div>

          {addedNotice && (
            <div className="mt-3 bg-green-600 text-white text-xs px-4 py-2 rounded-xl text-center font-medium animate-pulse">
              🛒 Товар успешно добавлен в корзину!
            </div>
          )}
        </div>
      </div>
    </main>
  );
}