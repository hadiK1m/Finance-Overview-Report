// src/app/layout.tsx
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { cn } from '@/lib/utils'; // cn diimpor dari utilitas shadcn

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Project Dashboard',
  description: 'A modern project management dashboard UI.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn(inter.className, 'bg-[#F9F9F8]')}>{children}</body>
    </html>
  );
}
