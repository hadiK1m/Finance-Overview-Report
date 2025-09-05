// src/app/(dashboard)/balancesheet/edit-balancesheet-dialog.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
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
import { BalanceSheet } from './columns';

const formSchema = z.object({
  name: z.string().min(1, { message: 'Balance sheet name is required.' }),
  balance: z.number(), // Saldo bisa positif atau negatif
});

interface EditBalanceSheetDialogProps {
  sheet: BalanceSheet | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onSheetUpdated: () => void;
}

export function EditBalanceSheetDialog({
  sheet,
  isOpen,
  onOpenChange,
  onSheetUpdated,
}: EditBalanceSheetDialogProps) {
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
  });

  React.useEffect(() => {
    if (sheet) {
      form.reset({
        name: sheet.name,
        balance: sheet.balance,
      });
    }
  }, [sheet, form]);

  async function onSubmit(values: z.infer<typeof formSchema>) {
    if (!sheet) return;

    try {
      const response = await fetch('/api/balancesheet', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: sheet.id, ...values }),
      });

      if (!response.ok) {
        throw new Error('Failed to update balance sheet');
      }

      onOpenChange(false);
      onSheetUpdated();
    } catch (error) {
      console.error(error);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Balance Sheet</DialogTitle>
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
                  <FormLabel>Balance Sheet Name</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Bank Account" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="balance"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Balance (IDR)</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      placeholder="e.g., 100000000"
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
