// src/app/(dashboard)/transactions/edit-transaction-dialog.tsx
'use client';

import * as React from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  UploadCloud,
  File as FileIcon,
  X,
  Plus,
  Minus,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
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
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group';
import { transactionFormSchema } from '@/lib/schemas';
import { TransactionWithRelations } from './columns';
import { Category } from '@/app/(dashboard)/categories/columns';
import { ItemWithCategory } from '../items/columns';
import { BalanceSheet } from '../balancesheet/columns';
import { toast } from 'sonner'; // Import toast untuk notifikasi

type TransactionType = 'income' | 'expense';

interface EditTransactionDialogProps {
  transaction: TransactionWithRelations | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated: () => void;
}

export function EditTransactionDialog({
  transaction,
  isOpen,
  onOpenChange,
  onTransactionUpdated,
}: EditTransactionDialogProps) {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [items, setItems] = React.useState<ItemWithCategory[]>([]);
  const [balanceSheets, setBalanceSheets] = React.useState<BalanceSheet[]>([]);
  const [transactionType, setTransactionType] =
    React.useState<TransactionType>('expense');
  const [existingAttachmentUrl, setExistingAttachmentUrl] = React.useState<
    string | null | undefined
  >(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
  });

  React.useEffect(() => {
    const fetchData = async () => {
      if (isOpen) {
        try {
          const [catRes, itemRes, sheetRes] = await Promise.all([
            fetch('/api/categories'),
            fetch('/api/items'),
            fetch('/api/balancesheet'),
          ]);
          setCategories(await catRes.json());
          setItems(await itemRes.json());
          setBalanceSheets(await sheetRes.json());
        } catch (error) {
          console.error('Failed to fetch data for form', error);
        }
      }
    };
    fetchData();
  }, [isOpen]);

  React.useEffect(() => {
    if (transaction && isOpen) {
      form.reset({
        date: new Date(transaction.date),
        item: String(transaction.itemId),
        rkapName: String(transaction.categoryId),
        payee: transaction.payee,
        amount: Math.abs(transaction.amount),
        balanceSheetId: String(transaction.balanceSheetId),
        attachment: undefined,
      });
      setTransactionType(transaction.amount >= 0 ? 'income' : 'expense');
      setExistingAttachmentUrl(transaction.attachmentUrl);
    }
  }, [transaction, isOpen, form]);

  const selectedItemId = form.watch('item');
  React.useEffect(() => {
    if (selectedItemId) {
      const selectedItem = items.find(
        (item) => String(item.id) === selectedItemId
      );
      if (selectedItem) {
        form.setValue('rkapName', String(selectedItem.categoryId));
      }
    }
  }, [selectedItemId, items, form]);

  // --- LOGIKA SEMPURNA UNTUK MENGHAPUS ATTACHMENT ---
  const handleRemoveExistingAttachment = async () => {
    if (!existingAttachmentUrl || !transaction) return;

    const promise = async () => {
      // 1. Hapus file fisik dari server
      await fetch(`/api/upload?fileUrl=${existingAttachmentUrl}`, {
        method: 'DELETE',
      });

      // 2. Update database untuk mengatur attachmentUrl menjadi null
      const dbUpdateResponse = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transaction.id,
          attachmentUrl: null, // Set ke null
        }),
      });

      if (!dbUpdateResponse.ok) {
        throw new Error('Failed to update the transaction in the database.');
      }

      // 3. Update state di frontend dan refresh data tabel utama
      setExistingAttachmentUrl(null);
      onTransactionUpdated();
    };

    toast.promise(promise, {
      loading: 'Deleting attachment...',
      success: 'Attachment deleted successfully.',
      error: 'Failed to delete attachment.',
    });
  };

  async function onSubmit(values: z.infer<typeof transactionFormSchema>) {
    if (!transaction) return;

    let attachmentUrlToUpdate: string | null | undefined =
      existingAttachmentUrl;

    if (values.attachment) {
      if (existingAttachmentUrl) {
        // Hapus file lama jika ada file baru yang diunggah
        await fetch(`/api/upload?fileUrl=${existingAttachmentUrl}`, {
          method: 'DELETE',
        });
      }
      const file = values.attachment;
      const formData = new FormData();
      formData.append('file', file);
      try {
        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData,
        });
        const result = await response.json();
        if (!result.success) throw new Error('File upload failed');
        attachmentUrlToUpdate = result.url;
      } catch (error) {
        console.error('Failed to upload file:', error);
        form.setError('root.serverError', { message: 'File upload failed.' });
        return;
      }
    }

    const finalAmount =
      transactionType === 'expense'
        ? -Math.abs(values.amount as number)
        : Math.abs(values.amount as number);

    try {
      const { attachment, ...dataToSend } = values;
      const response = await fetch('/api/transactions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transaction.id,
          ...dataToSend,
          amount: finalAmount,
          attachmentUrl: attachmentUrlToUpdate,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update transaction');
      }
      toast.success('Transaction updated successfully.');
      onOpenChange(false);
      onTransactionUpdated();
    } catch (error: any) {
      console.error(error);
      toast.error(error.message);
      form.setError('root.serverError', { message: error.message });
    }
  }

  const attachmentFile = form.watch('attachment');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Edit Transaction</DialogTitle>
          <DialogDescription>
            Make changes to your transaction here. Click save when you're done.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-6 pt-4"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem className="flex flex-col">
                    <FormLabel>Date</FormLabel>
                    <Popover>
                      <PopoverTrigger asChild>
                        <FormControl>
                          <Button
                            variant={'outline'}
                            className={cn(
                              'w-full justify-start text-left font-normal',
                              !field.value && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {field.value ? (
                              format(field.value, 'PPP')
                            ) : (
                              <span>Pick a date</span>
                            )}
                          </Button>
                        </FormControl>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={field.value}
                          onSelect={field.onChange}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="item"
                render={({ field }) => {
                  const [itemQuery, setItemQuery] = React.useState('');
                  const filteredItems = items.filter((it) =>
                    it.name.toLowerCase().includes(itemQuery.toLowerCase())
                  );

                  return (
                    <FormItem>
                      <FormLabel>Item</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select an item" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {/* Search box inside dropdown */}
                          <div className="px-3 py-2">
                            <Input
                              placeholder="Type to search..."
                              value={itemQuery}
                              onChange={(e) => setItemQuery(e.target.value)}
                              className="mb-2"
                            />
                          </div>
                          {(filteredItems.length ? filteredItems : items).map(
                            (item) => (
                              <SelectItem key={item.id} value={String(item.id)}>
                                {item.name}
                              </SelectItem>
                            )
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  );
                }}
              />
              <FormField
                control={form.control}
                name="rkapName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>RKAP Name</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      value={field.value}
                      disabled
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Auto-filled from item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((cat) => (
                          <SelectItem key={cat.id} value={String(cat.id)}>
                            {cat.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="payee"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payee</FormLabel>
                    <FormControl>
                      <Input placeholder="e.g., Google Ads" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="md:col-span-2 grid grid-cols-3 gap-6">
                <FormField
                  control={form.control}
                  name="amount"
                  render={({ field }) => (
                    <FormItem className="col-span-2">
                      <FormLabel>Amount</FormLabel>
                      <div className="flex items-center">
                        <ToggleGroup
                          type="single"
                          variant="outline"
                          value={transactionType}
                          onValueChange={(value: TransactionType) => {
                            if (value) setTransactionType(value);
                          }}
                          className="mr-2"
                        >
                          <ToggleGroupItem
                            value="income"
                            aria-label="Toggle income"
                            className={cn(
                              'p-2 rounded-md transition-transform duration-150 inline-flex items-center justify-center',
                              transactionType === 'income'
                                ? 'bg-emerald-600 text-white scale-105 shadow-md ring-2 ring-emerald-200/40'
                                : 'bg-transparent text-foreground hover:bg-emerald-50'
                            )}
                          >
                            <Plus className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="expense"
                            aria-label="Toggle expense"
                            className={cn(
                              'p-2 rounded-md transition-transform duration-150 inline-flex items-center justify-center',
                              transactionType === 'expense'
                                ? 'bg-rose-600 text-white scale-105 shadow-md ring-2 ring-rose-200/40'
                                : 'bg-transparent text-foreground hover:bg-rose-50'
                            )}
                          >
                            <Minus className="h-4 w-4" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 5000"
                            className="rounded-l-none"
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              field.onChange(value === '' ? undefined : +value);
                            }}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
                      {/* Small dynamic warning */}
                      <p
                        className={cn(
                          'mt-2 text-sm',
                          transactionType === 'income'
                            ? 'text-emerald-500'
                            : 'text-rose-500'
                        )}
                      >
                        {transactionType === 'income'
                          ? 'Income — this amount will be recorded as positive.'
                          : 'Expense — this amount will be recorded as negative.'}
                      </p>
                      {typeof field.value === 'number' &&
                        field.value !== 0 &&
                        ((transactionType === 'income' && field.value < 0) ||
                          (transactionType === 'expense' &&
                            field.value > 0)) && (
                          <p className="mt-1 text-xs text-yellow-600">
                            Warning: numeric sign and selected type do not
                            match. Value will be coerced on save.
                          </p>
                        )}
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="balanceSheetId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Balance Sheet</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a sheet" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {balanceSheets.map((sheet) => (
                            <SelectItem key={sheet.id} value={String(sheet.id)}>
                              {sheet.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <div className="md:col-span-2">
                <FormLabel>Attachment</FormLabel>
                {existingAttachmentUrl && !attachmentFile && (
                  <div className="mt-2 flex items-center justify-between rounded-lg border bg-muted p-3">
                    <a
                      href={existingAttachmentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 overflow-hidden hover:underline"
                    >
                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground truncate">
                        {existingAttachmentUrl.split('/').pop()}
                      </span>
                    </a>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={handleRemoveExistingAttachment}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {attachmentFile && (
                  <div className="mt-2 flex items-center justify-between rounded-lg border bg-muted p-3">
                    <div className="flex items-center gap-2 overflow-hidden">
                      <FileIcon className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                      <span className="text-sm font-medium text-muted-foreground truncate">
                        {attachmentFile.name}
                      </span>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => form.setValue('attachment', undefined)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                )}
                {!existingAttachmentUrl && !attachmentFile && (
                  <div
                    className="mt-2 flex justify-center rounded-lg border border-dashed border-gray-900/25 px-6 py-10 cursor-pointer"
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <div className="text-center">
                      <UploadCloud
                        className="mx-auto h-12 w-12 text-gray-300"
                        aria-hidden="true"
                      />
                      <p className="mt-4 text-sm text-gray-600">
                        <span className="font-semibold text-indigo-600">
                          Click to upload
                        </span>{' '}
                        or drag and drop
                      </p>
                      <input
                        ref={fileInputRef}
                        type="file"
                        className="hidden"
                        onChange={(e) =>
                          form.setValue('attachment', e.target.files?.[0])
                        }
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
            {form.formState.errors.root?.serverError && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.serverError.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
