// src/components/header.tsx

import { HeaderLogo } from '@/components/header-logo';
import { Navigation } from '@/components/navigation';
import { WelcomeMsg } from '@/components/welcome-msg';
import { UserNav } from '@/components/user-nav';

export const Header = () => {
  return (
    <header
      className="relative px-4 py-8 lg:px-14 pb-36"
      style={{
        backgroundImage: `url('/danantara.jpeg')`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        backgroundRepeat: 'no-repeat',
      }}
    >
      {/* Div ini berfungsi sebagai lapisan overlay gelap di atas gambar */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-700/80 to-blue-500/80" />

      {/* Semua konten header berada di atas overlay */}
      <div className="relative z-10">
        <div className="max-w-screen-2xl mx-auto">
          <div className="w-full flex items-center justify-between mb-14">
            <div className="flex items-center lg:gap-x-16">
              <HeaderLogo />
              <Navigation />
            </div>
            <UserNav />
          </div>
          <WelcomeMsg />
        </div>
      </div>
    </header>
  );
};
