// src/app/(dashboard)/layout.tsx
'use client';

import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation'; // Impor usePathname
import Sidebar from '@/components/Sidebar';
import { Loader2 } from 'lucide-react'; // Impor ikon loader

// Komponen untuk loading overlay
const LoadingOverlay = () => (
  <div className="absolute inset-0 z-50 flex items-center justify-center bg-gray-100/50 backdrop-blur-sm">
    <Loader2 className="h-10 w-10 animate-spin text-gray-400" />
  </div>
);

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const [isPageLoading, setIsPageLoading] = useState(false); // State untuk loading
  const pathname = usePathname();

  // Efek ini akan berjalan setiap kali URL berubah (navigasi selesai)
  useEffect(() => {
    setIsPageLoading(false);
  }, [pathname]);

  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen text-[#1a1a1a]">
      <Sidebar
        isOpen={isSidebarOpen}
        toggle={toggleSidebar}
        setIsPageLoading={setIsPageLoading} // Kirim fungsi set loading ke Sidebar
      />
      {/* Bungkus main content dengan div relatif */}
      <main className="relative flex-1 flex flex-col">
        {isPageLoading && <LoadingOverlay />}
        {children}
      </main>
    </div>
  );
}
