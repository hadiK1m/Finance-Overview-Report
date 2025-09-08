// next.config.ts
import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    // Menambahkan konfigurasi untuk kualitas gambar, ini akan menghilangkan peringatan di console.
    qualities: [80, 100],

    // Meskipun gambar Anda lokal, terkadang Next.js memerlukan pola ini
    // untuk mengenali sumber gambar di environment development.
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      },
    ],
  },
};

export default nextConfig;
