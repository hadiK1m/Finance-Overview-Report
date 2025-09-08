// src/components/welcome-msg.tsx
'use client';
import { useState, useEffect } from 'react';

export const WelcomeMsg = () => {
  const [userName, setUserName] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      const response = await fetch('/api/auth/session');
      if (response.ok) {
        const data = await response.json();
        setUserName(data.user?.fullName || 'Guest');
      }
    };
    fetchUser();
  }, []);

  return (
    <div className="space-y-2 mb-4">
      <h2 className="text-2xl lg:text-4xl text-white font-medium">
        Welcome Back{userName && `, ${userName}`} 👋🏻
      </h2>
      <p className="text-sm lg:text-base text-[#89b6fd]">
        This is your Financial Overview Report
      </p>
    </div>
  );
};
