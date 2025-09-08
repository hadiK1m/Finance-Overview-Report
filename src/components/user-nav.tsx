// src/components/user-nav.tsx

'use client';

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image'; // 1. Impor komponen Image

// Tipe User dari clean-dashboard
type User = {
  fullName: string | null;
  avatarUrl: string | null;
  email: string;
};

export const UserNav = () => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Ambil data sesi pengguna
    const fetchUser = async () => {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      }
    };
    fetchUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  const getInitials = (name: string | null | undefined) => {
    if (!name) return '';
    return name
      .split(' ')
      .map((n) => n[0])
      .join('');
  };

  return (
    // 2. Buat div pembungkus dengan flexbox
    <div className="flex items-center gap-x-4">
      {/* 3. Tambahkan Logo PLN */}
      <Image src="/logo-pln.svg" alt="Logo PLN" height={32} width={32} />

      {/* Dropdown Menu yang sudah ada */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-10 w-10 rounded-full">
            <Avatar className="h-10 w-10">
              <AvatarImage
                src={user?.avatarUrl || ''}
                alt={user?.fullName || ''}
              />
              <AvatarFallback>{getInitials(user?.fullName)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">
                {user?.fullName}
              </p>
              <p className="text-xs leading-none text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
};
