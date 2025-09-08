// src/app/(dashboard)/layout.tsx
'use client';

import { Header } from '@/components/Header';
import { Toaster } from '@/components/ui/sonner';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <Header />
      {/* Tambahkan 'relative' dan 'z-10' di sini */}
      <div className="relative z-10 px-4 lg:px-14 -mt-24">
        <main className="bg-white rounded-xl shadow-sm p-4 md:p-8">
          {children}
        </main>
      </div>
      <Toaster richColors position="bottom-right" />
    </>
  );
}
