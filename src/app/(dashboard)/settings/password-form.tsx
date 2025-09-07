// src/app/(dashboard)/settings/password-form.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Loader2 } from 'lucide-react';
import { Section } from './section'; // Impor Section

const passwordFormSchema = z.object({
  currentPassword: z
    .string()
    .min(1, { message: 'Current password is required.' }),
  newPassword: z
    .string()
    .min(6, { message: 'New password must be at least 6 characters.' }),
});

export function PasswordForm() {
  const router = useRouter();
  const [error, setError] = React.useState<string | null>(null);

  const form = useForm<z.infer<typeof passwordFormSchema>>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  async function onSubmit(values: z.infer<typeof passwordFormSchema>) {
    setError(null);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'password',
          ...values,
        }),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.message);

      alert('Password updated successfully! You will now be logged out.');
      fetch('/api/auth/logout', { method: 'POST' }).then(() => {
        router.push('/login');
      });
    } catch (err: any) {
      setError(err.message);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Section title="Password" description="Modify your current password.">
          <div className="space-y-4">
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="currentPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Current Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>New Password</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                Save Password
              </Button>
            </div>
          </div>
        </Section>
      </form>
    </Form>
  );
}
