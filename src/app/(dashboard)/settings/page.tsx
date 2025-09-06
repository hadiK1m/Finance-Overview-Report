// src/app/(dashboard)/settings/page.tsx
'use client';

import * as React from 'react';
import Header from '@/components/Header';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { User } from '@/app/(dashboard)/teams/columns';
import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form'; // <-- Impor komponen form baru

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);

  const fetchCurrentUser = async () => {
    // Tidak perlu setLoading(true) di sini agar tidak ada flicker
    try {
      const response = await fetch('/api/auth/session');
      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user session', error);
    } finally {
      setLoading(false); // Hanya set loading false sekali di awal
    }
  };

  React.useEffect(() => {
    fetchCurrentUser();
  }, []);

  return (
    <>
      <Header />
      <div className="p-8">
        <div className="mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
          <p className="text-muted-foreground">Manage your account settings.</p>
        </div>

        {loading ? (
          <p>Loading user data...</p>
        ) : (
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Profile</CardTitle>
                <CardDescription>
                  This is how others will see you on the site.
                </CardDescription>
              </CardHeader>
              <ProfileForm
                user={currentUser}
                onProfileUpdate={fetchCurrentUser}
              />
            </Card>
            <Card>
              <CardHeader>
                <CardTitle>Password</CardTitle>
                <CardDescription>
                  Change your password here. After saving, you'll be logged out.
                </CardDescription>
              </CardHeader>
              {/* Ganti placeholder dengan komponen form yang sebenarnya */}
              <PasswordForm />
            </Card>
          </div>
        )}
      </div>
    </>
  );
}
