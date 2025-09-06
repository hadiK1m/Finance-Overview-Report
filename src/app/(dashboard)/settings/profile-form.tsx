// src/app/(dashboard)/settings/profile-form.tsx
'use client';

import * as React from 'react';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { CardContent, CardFooter } from '@/components/ui/card';
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
import { Loader2, Upload } from 'lucide-react';

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
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [avatarFile, setAvatarFile] = React.useState<File | null>(null);

  // State ini sekarang hanya untuk preview SEBELUM submit
  const [avatarPreview, setAvatarPreview] = React.useState<string | null>(null);

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof profileFormSchema>>({
    resolver: zodResolver(profileFormSchema),
    defaultValues: {
      fullName: user?.fullName || '',
    },
  });

  // === PERBAIKAN UTAMA ADA DI SINI ===
  React.useEffect(() => {
    // Efek ini akan berjalan setiap kali 'user' prop dari parent berubah
    if (user) {
      form.reset({ fullName: user.fullName || '' });
      // Selalu set preview ke URL dari database saat user prop diperbarui
      setAvatarPreview(user.avatarUrl || null);
    }
  }, [user]); // Hanya bergantung pada 'user'

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setAvatarFile(file);
      // Tampilkan preview instan dari file yang baru dipilih
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  async function onSubmit(values: z.infer<typeof profileFormSchema>) {
    setIsSubmitting(true);
    setError(null);
    setSuccess(null);

    let updatedAvatarUrl = user?.avatarUrl || null;

    try {
      if (avatarFile) {
        const formData = new FormData();
        formData.append('file', avatarFile);
        const uploadResponse = await fetch('/api/upload?destination=avatars', {
          method: 'POST',
          body: formData,
        });
        const uploadResult = await uploadResponse.json();
        if (!uploadResult.success) throw new Error('Avatar upload failed.');
        updatedAvatarUrl = uploadResult.url;
      }

      const response = await fetch('/api/account', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'profile',
          fullName: values.fullName,
          avatarUrl: updatedAvatarUrl,
        }),
      });

      const result = await response.json();
      if (!response.ok)
        throw new Error(result.message || 'Failed to update profile.');

      setSuccess(result.message);
      setAvatarFile(null); // Reset file yang dipilih setelah berhasil
      onProfileUpdate(); // Panggil callback untuk refresh data di parent
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)}>
        <CardContent className="space-y-6">
          <div className="flex items-center space-x-4">
            <Avatar className="h-20 w-20">
              {/* Gunakan avatarPreview untuk src, yang sekarang selalu sinkron dengan data terbaru */}
              <AvatarImage
                src={avatarPreview || undefined}
                key={avatarPreview}
              />
              <AvatarFallback className="text-2xl">
                {user?.fullName?.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="space-y-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, image/gif"
              />
              <Button
                type="button"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" /> Change Photo
              </Button>
              <p className="text-xs text-muted-foreground">
                JPG, GIF or PNG. 1MB max.
              </p>
            </div>
          </div>

          <FormField
            control={form.control}
            name="fullName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Full Name</FormLabel>
                <FormControl>
                  <Input placeholder="Your full name" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormItem>
            <FormLabel>Email</FormLabel>
            <Input type="email" value={user?.email || ''} disabled />
            <p className="text-xs text-muted-foreground">
              Email address cannot be changed.
            </p>
          </FormItem>
        </CardContent>
        <CardFooter className="border-t px-6 py-4 justify-between items-center">
          <div>
            {error && (
              <p className="text-sm font-medium text-destructive">{error}</p>
            )}
            {success && (
              <p className="text-sm font-medium text-green-600">{success}</p>
            )}
          </div>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Changes
          </Button>
        </CardFooter>
      </form>
    </Form>
  );
}
