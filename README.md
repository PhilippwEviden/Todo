TodoGreen — Mobile-first Todo App with Green Reward System

Kurz: Next.js + TypeScript + Prisma + PostgreSQL. Mobile-first, accessible (WCAG-aware), star reward system.

Setup (local):
1) Copy .env.example → .env and set DATABASE_URL, JWT_SECRET
2) npm install
3) npx prisma generate
4) npx prisma migrate dev --name init
5) npm run dev

Auth: E-Mail/Passwort (bcrypt + JWT httpOnly cookie). To use OAuth/Supabase replace auth endpoints.

Design: Tailwind (emerald palette), Framer Motion & canvas-confetti for animations.

Open points: Email sending for password reset; production cookie Secure/Domain settings.
