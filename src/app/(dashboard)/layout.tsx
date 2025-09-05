// src/app/(dashboard)/layout.tsx
'use client';

import { useState, Suspense } from 'react'; // Impor Suspense
import Sidebar from '@/components/Sidebar';
import { NavigationEvents } from '@/components/NavigationEvents'; // Impor komponen baru

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen text-[#1a1a1a]">
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      <main className="flex-1 flex flex-col">
        {children}
        {/* Tambahkan komponen ini di sini */}
        <Suspense fallback={null}>
          <NavigationEvents />
        </Suspense>
      </main>
    </div>
  );
}
