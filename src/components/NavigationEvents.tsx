// src/components/NavigationEvents.tsx
'use client';

import { useEffect } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import NProgress from 'nprogress';

export function NavigationEvents() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    // Memulai loading bar saat URL berubah
    NProgress.start();

    // Menghentikan loading bar setelah navigasi selesai
    // Kita gunakan setTimeout kecil untuk memastikan bar sempat terlihat
    const timer = setTimeout(() => NProgress.done(), 100);

    return () => {
      clearTimeout(timer);
      NProgress.done();
    };
  }, [pathname, searchParams]);

  return null; // Komponen ini tidak me-render apa pun
}
