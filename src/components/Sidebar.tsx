// src/components/Sidebar.tsx
'use client';

import React, { useEffect, useState } from 'react'; // Impor useState
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  SearchIcon,
  HomeIcon,
  UsersIcon,
  ChevronUpIcon,
  ChevronDownIcon,
  SettingsIcon,
  ArrowLeftIcon,
  TrelloIcon,
  BarChartHorizontal as ChartBarStacked,
  ListCollapse,
  CloudUpload,
  ArrowLeftRight,
  LogOut,
  WalletCards,
  Loader2, // 1. Impor ikon Loader2
} from 'lucide-react';
import Image from 'next/image';
import { User } from '@/app/(dashboard)/teams/columns';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

const NavItem = ({
  href,
  icon,
  children,
  isOpen,
}: {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isOpen: boolean;
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
        isActive
          ? 'bg-white text-gray-900 shadow-sm'
          : 'text-gray-600 hover:bg-gray-100'
      } ${!isOpen && 'justify-center'}`}
    >
      {icon}
      {isOpen && <span className="ml-3 truncate">{children}</span>}
    </Link>
  );
};

const CollapsibleSection = ({
  title,
  children,
  defaultOpen = false,
  isOpen,
}: {
  title: string;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  isOpen: boolean;
}) => {
  const [isSectionOpen, setSectionOpen] = useState(defaultOpen);

  if (!isOpen) {
    return <div className="pt-2">{children}</div>;
  }

  return (
    <div className="pt-2">
      <button
        onClick={() => setSectionOpen(!isSectionOpen)}
        className="flex items-center justify-between w-full text-sm font-semibold text-gray-500 hover:text-gray-800 py-2"
      >
        <span className="flex items-center truncate">{title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          {isSectionOpen ? (
            <ChevronUpIcon className="w-4 h-4" />
          ) : (
            <ChevronDownIcon className="w-4 h-4" />
          )}
        </div>
      </button>
      {isSectionOpen && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
};

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false); // 2. Tambahkan state loading
  const [currentUser, setCurrentUser] = useState<User | null>(null); // State untuk data pengguna

  // Ambil data pengguna saat komponen dimuat
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('/api/auth/session', {
          cache: 'no-store',
        });
        const data = await response.json();
        if (data.user) {
          setCurrentUser(data.user);
        }
      } catch (error) {
        console.error('Failed to fetch user for sidebar', error);
      }
    };
    fetchUser();
  }, []);

  // 3. Perbarui fungsi handleLogout
  const handleLogout = async () => {
    setIsLoggingOut(true); // Atur loading menjadi true
    try {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (response.ok) {
        router.push('/login');
        // Tidak perlu set loading ke false karena komponen akan unmount
      } else {
        console.error('Failed to logout');
        setIsLoggingOut(false); // Reset jika gagal
      }
    } catch (error) {
      console.error('An error occurred during logout:', error);
      setIsLoggingOut(false); // Reset jika ada error
    }
  };

  return (
    <aside
      className={`bg-gray-50/50 border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-in-out ${
        isOpen ? 'w-64 p-4 space-y-4' : 'w-20 p-2 space-y-2'
      }`}
    >
      {/* ... (Konten Sidebar lainnya tidak berubah) ... */}
      <div
        className={`flex items-center ${
          isOpen ? 'justify-between' : 'justify-center'
        }`}
      >
        <div
          className={`flex items-center overflow-hidden ${
            isOpen && 'space-x-3'
          }`}
        >
          {isOpen && (
            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 p-1">
              <Image
                src="/logo-pln.svg"
                alt="Logo PLN"
                width={32}
                height={32}
                className="object-contain"
              />
            </div>
          )}

          {isOpen && (
            <div>
              <p className="font-semibold text-sm truncate">
                {currentUser?.fullName || 'Loading...'}
              </p>
              <p className="text-xs text-gray-500 truncate">DEKOM DASHBOARD</p>
            </div>
          )}
        </div>
        <button
          onClick={toggle}
          className="text-gray-400 hover:text-gray-700 p-2 rounded-md"
        >
          <ArrowLeftIcon
            className={`w-5 h-5 transition-transform duration-300 ${
              !isOpen && 'rotate-180'
            }`}
          />
        </button>
      </div>

      {isOpen && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search"
            className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200/80 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-sm border border-gray-200">
            ⌘ F
          </div>
        </div>
      )}

      <nav className="flex-1 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {isOpen && (
            <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">
              Essentials
            </h3>
          )}
          <NavItem
            href="/"
            icon={<HomeIcon className="w-5 h-5" />}
            isOpen={isOpen}
          >
            Home
          </NavItem>
          <NavItem
            href="/categories"
            icon={<ChartBarStacked className="w-5 h-5" />}
            isOpen={isOpen}
          >
            Categories
          </NavItem>
          <NavItem
            href="/items"
            icon={<ListCollapse className="w-5 h-5" />}
            isOpen={isOpen}
          >
            Items
          </NavItem>
          <NavItem
            href="/transactions"
            icon={<ArrowLeftRight className="w-5 h-5" />}
            isOpen={isOpen}
          >
            Transactions
          </NavItem>
          <NavItem
            href="/balancesheet"
            icon={<WalletCards className="w-5 h-5" />}
            isOpen={isOpen}
          >
            Cash & Balance
          </NavItem>
          <NavItem
            href="/drive"
            icon={<CloudUpload className="w-5 h-5" />}
            isOpen={isOpen}
          >
            D Drive
          </NavItem>
        </div>

        <div className="border-t border-gray-200/80">
          <CollapsibleSection
            title="Management"
            isOpen={isOpen}
            defaultOpen={true}
          >
            <NavItem
              href="/teams"
              icon={<UsersIcon className="w-5 h-5" />}
              isOpen={isOpen}
            >
              Teams
            </NavItem>
          </CollapsibleSection>
        </div>

        <div className="border-t border-gray-200/80">
          <CollapsibleSection
            title="Support"
            defaultOpen={true}
            isOpen={isOpen}
          >
            <NavItem
              href="/settings"
              icon={<SettingsIcon className="w-5 h-5" />}
              isOpen={isOpen}
            >
              Settings
            </NavItem>
          </CollapsibleSection>
        </div>
      </nav>

      <div className="mt-auto border-t border-gray-200/80">
        <CollapsibleSection title="Apps" defaultOpen={true} isOpen={isOpen}>
          <NavItem
            href="/"
            icon={<TrelloIcon className="w-5 h-5" />}
            isOpen={isOpen}
          >
            DEKOM
          </NavItem>
        </CollapsibleSection>
      </div>

      {/* 4. Perbarui tombol Logout */}
      <div className="border-t border-gray-200/80 pt-2">
        <button
          onClick={handleLogout}
          disabled={isLoggingOut}
          className={`flex items-center w-full px-3 py-2 text-sm font-medium rounded-md text-gray-600 hover:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60 ${
            !isOpen && 'justify-center'
          }`}
        >
          {isLoggingOut ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <LogOut className="w-5 h-5" />
          )}
          {isOpen && (
            <span className="ml-3 truncate">
              {isLoggingOut ? 'Logging out...' : 'Logout'}
            </span>
          )}
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
