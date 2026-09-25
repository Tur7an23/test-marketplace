'use client';

import { SessionProvider } from 'next-auth/react';
import { CurrencyProvider } from '@/lib/CurrencyContext';

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <CurrencyProvider>
        {children}
      </CurrencyProvider>
    </SessionProvider>
  );
}