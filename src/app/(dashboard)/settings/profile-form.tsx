// src/app/(dashboard)/settings/profile-form.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
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
import { User } from '@/app/(dashboard)/teams/columns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Loader2, Mail } from 'lucide-react';
import { Section } from './section'; // Impor komponen Section

const profileFormSchema = z.object({
  fullName: z
    .string()
    .min(3, { message: 'Full name must be at least 3 characters.' }),
});

interface ProfileFormProps {
  user: User | null;
  onProfileUpdate: () => void;
}

export function ProfileForm({ user, onProfileUpdate }: ProfileFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || '',
    },
  });

  React.useEffect(() => {
    if (user) {
      form.reset({ fullName: user.fullName || '' });
    }
  }, [user, form]);

  const handleFileChangeAndUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const uploadResponse = await fetch('/api/upload?destination=avatars', {
        method: 'POST',
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) throw new Error('Avatar upload failed.');

      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          fullName: user?.fullName, // Kirim nama yang ada
          avatarUrl: uploadResult.url,
        }),
      });
      if (!response.ok) throw new Error('Failed to save new avatar.');
      onProfileUpdate(); // Refresh data untuk menampilkan avatar baru
    } catch (err: any) {
      console.error(err);
      // Tambahkan notifikasi error jika perlu
    } finally {
      setIsSubmitting(false);
    }
  };

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsSubmitting(true);
    try {
      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          fullName: values.fullName,
          avatarUrl: user?.avatarUrl, // Kirim avatarUrl yang ada
        }),
      });
      if (!response.ok) throw new Error('Failed to update profile.');
      onProfileUpdate();
      alert('Profile saved successfully!');
    } catch (err: any) {
      console.error(err);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Section title="Profile picture" description="PNG, JPEG under 15MB">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              <AvatarImage
                src={user?.avatarUrl || undefined}
                key={user?.avatarUrl}
              />
              <AvatarFallback className="text-xl">
                {user?.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="flex items-center space-x-3">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChangeAndUpload}
                className="hidden"
                accept="image/*"
              />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSubmitting}
              >
                Upload new picture
              </Button>
              <Button
                type="button"
                variant="ghost"
                className="text-red-600 hover:text-red-700"
                disabled
              >
                Delete
              </Button>
            </div>
          </div>
        </Section>

        <Section title="Full name" description="">
          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </Section>

        <Section
          title="Contact email"
          description="Manage your account's email address for the invoices."
        >
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="email"
              value={user?.email || ''}
              disabled
              className="pl-9"
            />
          </div>
        </Section>

        <div className="flex justify-end pt-4">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </form>
    </Form>
  );
}
