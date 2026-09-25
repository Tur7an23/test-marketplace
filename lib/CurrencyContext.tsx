'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';

export type Currency = 'KRW' | 'RUB' | 'KZT' | 'UZS' | 'BYN' | 'USD';

interface CurrencyContextType {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (priceInKRW: number) => string;
  loadingRates: boolean;
}

// Символы и знаки после запятой для каждой валюты
const CURRENCY_META: Record<Currency, { symbol: string; decimals: number }> = {
  KRW: { symbol: '₩', decimals: 0 },
  RUB: { symbol: '₽', decimals: 0 },
  KZT: { symbol: '₸', decimals: 0 },
  UZS: { symbol: 'сум', decimals: 0 },
  BYN: { symbol: 'Br', decimals: 2 },
  USD: { symbol: '$', decimals: 2 },
};

// Запасные курсы на случай, если пропадет интернет
const FALLBACK_RATES: Record<Currency, number> = {
  KRW: 1,
  RUB: 0.068,
  KZT: 0.36,
  UZS: 9.6,
  BYN: 0.0024,
  USD: 0.00075,
};

const CurrencyContext = createContext<CurrencyContextType | undefined>(undefined);

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>('RUB');
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [loadingRates, setLoadingRates] = useState<boolean>(true);

  // 1. Загружаем сохраненную валюту из localStorage
  useEffect(() => {
    const saved = localStorage.getItem('selected_currency') as Currency;
    if (saved && CURRENCY_META[saved]) {
      setCurrencyState(saved);
    }
  }, []);

  // 2. Автоматически подтягиваем АКТУАЛЬНЫЕ курсы валют из открытого API
  useEffect(() => {
    async function fetchLiveRates() {
      try {
        const res = await fetch('https://open.er-api.com/v6/latest/KRW');
        if (res.ok) {
          const data = await res.json();
          if (data && data.rates) {
            setRates({
              KRW: 1,
              RUB: data.rates.RUB || FALLBACK_RATES.RUB,
              KZT: data.rates.KZT || FALLBACK_RATES.KZT,
              UZS: data.rates.UZS || FALLBACK_RATES.UZS,
              BYN: data.rates.BYN || FALLBACK_RATES.BYN,
              USD: data.rates.USD || FALLBACK_RATES.USD,
            });
          }
        }
      } catch (err) {
        console.warn('Не удалось загрузить живой курс валют, используем резервные:', err);
      } finally {
        setLoadingRates(false);
      }
    }

    fetchLiveRates();
  }, []);

  const setCurrency = (c: Currency) => {
    setCurrencyState(c);
    localStorage.setItem('selected_currency', c);
  };
const formatPrice = (priceInKRW: number): string => {
    const rate = rates[currency] ?? FALLBACK_RATES[currency] ?? 1;
    const meta = CURRENCY_META[currency] || CURRENCY_META.KRW;
    let converted = priceInKRW * rate;

    // «УМНОЕ КРАСИВОЕ ОКРУГЛЕНИЕ»
    if (currency === 'RUB') {
      converted = Math.round(converted / 10) * 10; // Округление до 10 ₽
    } else if (currency === 'KZT') {
      converted = Math.round(converted / 100) * 100; // Округление до 100 ₸
    } else if (currency === 'UZS') {
      converted = Math.round(converted / 1000) * 1000; // Округление до 1000 сум
    } else if (currency === 'BYN' || currency === 'USD') {
      converted = Math.round(converted); // Округление до целого числа
    } else {
      converted = Math.round(converted);
    }

    const formattedNumber = converted.toLocaleString('ru-RU', {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    });

    return `${formattedNumber} ${meta.symbol}`;
  };
  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, formatPrice, loadingRates }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const context = useContext(CurrencyContext);
  if (!context) {
    throw new Error('useCurrency must be used within CurrencyProvider');
  }
  return context;
}