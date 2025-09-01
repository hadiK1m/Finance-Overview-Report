// src/app/(dashboard)/layout.tsx
'use client';

import { useState } from 'react';
import Sidebar from '@/components/Sidebar';

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
      {/* Main tag sekarang membungkus children secara langsung */}
      <main className="flex-1 flex flex-col overflow-y-auto">
        {children}
      </main>
    </div>
  );
}