// src/app/(dashboard)/settings/page.tsx
'use client';

import * as React from 'react';

import { User } from '@/app/(dashboard)/teams/columns';
import { ProfileForm } from './profile-form';
import { PasswordForm } from './password-form';
import { Button } from '@/components/ui/button';
import { useRouter } from 'next/navigation';
import { Section } from './section'; // Impor Section

export default function SettingsPage() {
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);
  const [loading, setLoading] = React.useState(true);
  const router = useRouter();

  const fetchCurrentUser = async () => {
    try {
      const response = await fetch('/api/auth/session', { cache: 'no-store' });
      const data = await response.json();
      if (data.user) {
        setCurrentUser(data.user);
      }
    } catch (error) {
      console.error('Failed to fetch user session', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCurrentUser();
  }, []);

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  };

  return (
    <>
      <div className="p-8 max-w-4xl mx-auto">
        <div className="mb-6 pb-6">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900">
            Account
          </h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time information and activities of your property.
          </p>
        </div>

        {loading ? (
          <p>Loading user data...</p>
        ) : (
          <div className="space-y-6">
            <ProfileForm
              user={currentUser}
              onProfileUpdate={fetchCurrentUser}
            />
            <PasswordForm />
            <Section
              title="Account security"
              description="Manage your account security."
            >
              <div className="flex items-center space-x-3">
                <Button variant="outline" onClick={handleLogout}>
                  Log out
                </Button>
                <Button variant="destructive" disabled>
                  Delete my account
                </Button>
              </div>
            </Section>
          </div>
        )}
      </div>
    </>
  );
}
