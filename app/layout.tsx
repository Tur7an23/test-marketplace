import './globals.css';
import Providers from './providers';
import Header from '../components/header';

export const metadata = {
  title: 'Marketplace СНГ-Корея',
  description: 'MVP международного маркетплейса',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ru">
      <body className="bg-gray-50 text-black min-h-screen flex flex-col font-sans antialiased">
        <Providers>
          <Header />
          <main className="flex-1">
            {children}
          </main>
        </Providers>
      </body>
    </html>
  );
}