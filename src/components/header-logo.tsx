// src/components/header-logo.tsx
import Link from 'next/link';
import Image from 'next/image';

export const HeaderLogo = () => {
  return (
    <Link href="/">
      <div className="items-center hidden lg:flex">
        <Image src="/logo-danantara.svg" alt="Logo" height={80} width={120} />
        <p className="font-semibold text-white text-2xl ml-2.5">DEKOM</p>
      </div>
    </Link>
  );
};
