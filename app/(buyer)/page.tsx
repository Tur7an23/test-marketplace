'use client';

import { useEffect, useState, useRef } from 'react';
import Link from 'next/link';
import { useCurrency } from '@/lib/CurrencyContext';

interface Product {
  id: string;
  title: string;
  description: string;
  price: number;
  images: string;
  category?: string;
  tags?: string;
}

export default function BuyerPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<string[]>(['Все']);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('Все');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [addedNotice, setAddedNotice] = useState<string | null>(null);
  const { formatPrice } = useCurrency();

  // Логика перетаскивания мышкой (Drag to Scroll)
  const sliderRef = useRef<HTMLDivElement>(null);
  const [isMouseDown, setIsMouseDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  useEffect(() => {
    async function initData() {
      try {
        const [prodRes, catRes] = await Promise.all([
          fetch('/api/buyer/products'),
          fetch('/api/categories'),
        ]);

        if (prodRes.ok) {
          const prodData = await prodRes.json();
          setProducts(prodData);
        }

        if (catRes.ok) {
          const catData = await catRes.json();
          const catNames = catData.map((c: { name: string }) => c.name);
          setCategories(['Все', ...catNames]);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    initData();
  }, []);

  // Хэндлеры захвата мыши для плавного слайдера
  const handleMouseDown = (e: React.MouseEvent) => {
    if (!sliderRef.current) return;
    setIsMouseDown(true);
    setStartX(e.pageX - sliderRef.current.offsetLeft);
    setScrollLeft(sliderRef.current.scrollLeft);
  };

  const handleMouseLeave = () => setIsMouseDown(false);
  const handleMouseUp = () => setIsMouseDown(false);

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isMouseDown || !sliderRef.current) return;
    e.preventDefault();
    const x = e.pageX - sliderRef.current.offsetLeft;
    const walk = (x - startX) * 1.8; // Скорость прокрутки
    sliderRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleAddToCart = (product: Product) => {
    const savedCart = localStorage.getItem('cart');
    let currentCart = [];
    if (savedCart) {
      try {
        currentCart = JSON.parse(savedCart);
      } catch (e) {}
    }

    const existingIndex = currentCart.findIndex((item: any) => item.id === product.id);

    if (existingIndex > -1) {
      currentCart[existingIndex].quantity += 1;
    } else {
      currentCart.push({
        id: product.id,
        title: product.title,
        price: product.price,
        images: product.images,
        quantity: 1,
      });
    }

    localStorage.setItem('cart', JSON.stringify(currentCart));
    setAddedNotice(`«${product.title}» добавлен в корзину!`);
    setTimeout(() => setAddedNotice(null), 3000);
  };

  const filteredProducts = products.filter((p) => {
    const matchesCategory =
      selectedCategory === 'Все' || p.category === selectedCategory;

    let tagsList: string[] = [];
    try {
      tagsList = JSON.parse(p.tags || '[]');
    } catch (e) {}

    const query = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !query ||
      p.title.toLowerCase().includes(query) ||
      p.description.toLowerCase().includes(query) ||
      tagsList.some((tag) => tag.toLowerCase().includes(query));

    return matchesCategory && matchesSearch;
  });

  if (loading) return <div className="p-8 text-black font-medium">Загрузка витрины...</div>;

  return (
    <main className="max-w-6xl mx-auto p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold text-black">Витрина товаров из Кореи</h1>

        {/* ПОИСК */}
        <div className="w-full md:w-72">
          <input
            type="text"
            placeholder="🔍 Поиск по названию или тегам..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full px-4 py-2 border rounded-xl text-sm text-black focus:ring-2 focus:ring-blue-500 outline-none bg-white shadow-2xs"
          />
        </div>
      </div>

      {/* МЯГКИЙ СЛАЙДЕР КАТЕГОРИЙ БЕЗ КНОПОК И СТРЕЛОК (DRAG & SWIPE) */}
      <div className="relative mb-6">
        <div
          ref={sliderRef}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          className={`flex gap-2 overflow-x-auto py-2 px-1 border-b pb-4 select-none cursor-grab active:cursor-grabbing ${
            isMouseDown ? 'scroll-auto' : 'scroll-smooth'
          }`}
          style={{
            scrollbarWidth: 'none', // Скрывает скроллбар в Firefox
            msOverflowStyle: 'none', // Скрывает скроллбар в IE
          }}
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-sm'
                  : 'bg-white text-gray-700 border hover:bg-gray-50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {addedNotice && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-3 rounded-xl shadow-lg font-medium transition z-50">
          🛒 {addedNotice}
        </div>
      )}

      {filteredProducts.length === 0 ? (
        <div className="bg-white p-12 border rounded-2xl text-center text-gray-500">
          По вашему запросу ничего не найдено.
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {filteredProducts.map((product) => {
            let imagesList: string[] = [];
            try { imagesList = JSON.parse(product.images || '[]'); } catch (e) {}

            let tagsList: string[] = [];
            try { tagsList = JSON.parse(product.tags || '[]'); } catch (e) {}

            return (
              <div key={product.id} className="border p-4 rounded-2xl shadow-2xs flex flex-col justify-between bg-white hover:shadow-md transition">
                <div>
                  <Link href={`/products/${product.id}`}>
                    <div className="relative w-full h-48 bg-gray-50 rounded-xl mb-4 overflow-hidden border flex items-center justify-center p-2">
                      {imagesList.length > 0 ? (
                        <img
                          src={imagesList[0]}
                          alt={product.title}
                          className="max-h-full max-w-full object-contain rounded-lg hover:scale-105 transition duration-200"
                        />
                      ) : (
                        <div className="text-gray-400 text-xs">Нет фото</div>
                      )}

                      {product.category && (
                        <span className="absolute top-2 left-2 bg-black/70 text-white text-[10px] px-2 py-0.5 rounded-full backdrop-blur-xs font-medium">
                          {product.category}
                        </span>
                      )}
                    </div>
                  </Link>

                  <Link href={`/products/${product.id}`}>
                    <h2 className="text-lg font-bold mb-1 text-black hover:text-blue-600 transition">
                      {product.title}
                    </h2>
                  </Link>
                  <p className="text-gray-600 text-xs mb-3 line-clamp-2">{product.description}</p>

                  {tagsList.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-4">
                      {tagsList.map((tag, idx) => (
                        <span
                          key={idx}
                          onClick={() => setSearchQuery(tag)}
                          className="text-[10px] bg-gray-100 text-gray-600 px-2 py-0.5 rounded cursor-pointer hover:bg-blue-50 hover:text-blue-600 font-medium"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex justify-between items-center mt-2 pt-3 border-t">
                  <span className="text-lg font-bold text-green-600">
                    {formatPrice(product.price)}
                  </span>
                  <button
                    onClick={() => handleAddToCart(product)}
                    className="bg-blue-600 text-white px-4 py-2 rounded-xl text-xs font-semibold hover:bg-blue-700 transition"
                  >
                    В корзину
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </main>
  );
}