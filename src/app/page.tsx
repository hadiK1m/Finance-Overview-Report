// src/app/page.tsx
'use client'; // Tambahkan ini di baris paling atas

import { useState } from 'react'; // Impor useState
import Sidebar from '@/components/Sidebar';
import Header from '@/components/Header';
import StatCard from '@/components/StatCard';
import ProjectCard from '@/components/ProjectCard';
import { STATS_DATA, PROJECTS_DATA } from '@/lib/data';
import { PlusIcon } from '@/components/Icons';

export default function HomePage() {
  // 1. Tambahkan state untuk mengontrol visibilitas sidebar
  const [isSidebarOpen, setSidebarOpen] = useState(true);

  // 2. Buat fungsi untuk mengubah state (toggle)
  const toggleSidebar = () => {
    setSidebarOpen(!isSidebarOpen);
  };

  return (
    <div className="flex h-screen text-[#1a1a1a]">
      {/* 3. Kirim state dan fungsi toggle sebagai props ke Sidebar */}
      <Sidebar isOpen={isSidebarOpen} toggle={toggleSidebar} />
      
      <main className="flex-1 p-8 overflow-y-auto">
        <Header />
        
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-gray-800">Summary</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mt-4">
            {STATS_DATA.map((stat, index) => (
              <StatCard key={index} {...stat} />
            ))}
          </div>
        </div>

        <div className="mt-10">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800">Ongoing Works</h2>
            <button className="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900">
              <PlusIcon className="w-4 h-4" />
              New
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6 mt-4">
            {PROJECTS_DATA.map((project, index) => (
              <ProjectCard key={index} {...project} />
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}