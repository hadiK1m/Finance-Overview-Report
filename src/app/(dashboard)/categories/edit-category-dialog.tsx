// src/app/(dashboard)/categories/edit-category-dialog.tsx
'use client';

import { useEffect } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
// --- PERUBAHAN DI SINI ---
import { Category } from './columns';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Category name is required.' }),
  budget: z.number().min(0, { message: 'Budget cannot be negative.' }),
});

interface EditCategoryDialogProps {
  category: Category | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onCategoryUpdated: () => void;
}

export function EditCategoryDialog({
  category,
  isOpen,
  onOpenChange,
  onCategoryUpdated,
}: EditCategoryDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  // Mengisi form dengan data kategori saat dialog dibuka atau kategori berubah
  useEffect(() => {
    if (category) {
      form.reset({
        name: category.name,
        budget: category.budget,
      });
    }
  }, [category, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!category) return;

    try {
      const response = await fetch('/api/categories', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: category.id, ...values }),
      });

      if (!response.ok) {
        throw new Error('Failed to update category');
      }

      onOpenChange(false);
      onCategoryUpdated();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Category</DialogTitle>
          <DialogDescription>
            Make changes to the category details here.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Category Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Office Supplies" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="budget"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Budget (IDR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 5000000"
                      {...field}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? undefined
                            : +event.target.value
                        )
                      }
                      value={field.value ?? ''}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={form.formState.isSubmitting}>
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
