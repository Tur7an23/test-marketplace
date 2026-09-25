import NextAuth, { NextAuthOptions } from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: 'Credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          const email = credentials.email.trim().toLowerCase();
          const DEMO_EMAILS = ['admin@test.com', 'seller@test.com', 'buyer@test.com'];

          // Если входим через тестовые аккаунты — автоматически создаем/актуализируем их!
          if (DEMO_EMAILS.includes(email)) {
            const hashedPassword = await bcrypt.hash('123456', 10);
            let role = 'BUYER';
            let name = 'Покупатель СНГ';

            if (email === 'admin@test.com') {
              role = 'ADMIN';
              name = 'Хост Админ';
            } else if (email === 'seller@test.com') {
              role = 'SELLER';
              name = 'Продавец Корея';
            }

            const user = await prisma.user.upsert({
              where: { email },
              update: { password: hashedPassword, role },
              create: { email, name, password: hashedPassword, role },
            });

            return {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            };
          }

          // Обычный вход по паролю из базы
          const user = await prisma.user.findUnique({ where: { email } });
          if (!user) return null;

          const isValid = await bcrypt.compare(credentials.password, user.password);
          if (!isValid) return null;

          return {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          };
        } catch (error) {
          console.error('Ошибка в процессе авторизации:', error);
          return null;
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.role = token.role as string;
      }
      return session;
    },
  },
  pages: {
    signIn: '/login',
    error: '/login',
  },
  session: {
    strategy: 'jwt',
  },
  secret: process.env.NEXTAUTH_SECRET || 'super-secret-key-12th-squad-2026',
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };