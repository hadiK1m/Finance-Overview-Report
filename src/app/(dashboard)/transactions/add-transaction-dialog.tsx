// src/app/(dashboard)/transactions/add-transaction-dialog.tsx
'use client';

import * as React from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import * as z from 'zod';
import { format } from 'date-fns';
import {
  CalendarIcon,
  UploadCloud,
  PlusCircle,
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
  DialogTrigger,
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
import { ItemWithCategory } from '../items/columns';
import { BalanceSheet } from '../balancesheet/columns';
import { transactionFormSchema } from '@/lib/schemas';
import { AmountInput } from '@/components/ui/amount-input';
// --- PERUBAHAN DI SINI ---
import { Category } from '@/app/(dashboard)/categories/columns';

type TransactionType = 'income' | 'expense';

interface AddTransactionDialogProps {
  onTransactionAdded: () => void;
}

export function AddTransactionDialog({
  onTransactionAdded,
}: AddTransactionDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [items, setItems] = React.useState<ItemWithCategory[]>([]);
  const [balanceSheets, setBalanceSheets] = React.useState<BalanceSheet[]>([]);
  const [transactionType, setTransactionType] =
    React.useState<TransactionType>('expense');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const form = useForm<z.infer<typeof transactionFormSchema>>({
    resolver: zodResolver(transactionFormSchema),
    defaultValues: {
      date: new Date(),
      item: '',
      rkapName: '',
      payee: '',
      amount: undefined,
      balanceSheetId: '',
    },
  });

  // Ambil data untuk dropdown saat dialog dibuka
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

  // Efek untuk mengisi RKAP Name secara otomatis berdasarkan Item yang dipilih
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

  async function onSubmit(values: z.infer<typeof transactionFormSchema>) {
    let attachmentUrl: string | undefined = undefined;

    // 1. Upload file jika ada
    if (values.attachment) {
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
        attachmentUrl = result.url;
      } catch (error) {
        console.error('Failed to upload file:', error);
        form.setError('root.serverError', { message: 'File upload failed.' });
        return;
      }
    }

    const amountValue = values.amount ?? 0;
    const finalAmount =
      transactionType === 'expense'
        ? -Math.abs(amountValue)
        : Math.abs(amountValue);

    // 2. Kirim data form ke API transactions
    try {
      const { attachment, ...dataToSend } = values;

      const response = await fetch('/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...dataToSend,
          amount: finalAmount,
          attachmentUrl: attachmentUrl,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        console.error('Server validation failed:', errorData.errors);
        throw new Error(errorData.message || 'Failed to add transaction');
      }

      form.reset({
        date: new Date(),
        payee: '',
        item: '',
        rkapName: '',
        amount: undefined,
        balanceSheetId: '',
      });
      setIsOpen(false);
      onTransactionAdded();
    } catch (error: any) {
      console.error(error);
      form.setError('root.serverError', { message: error.message });
    }
  }

  const attachmentFile = form.watch('attachment');

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button>
          <PlusCircle className="mr-2 h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>RKAP Submission Form</DialogTitle>
          <DialogDescription>
            Fill in the details below to submit your request.
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Item</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select an item" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {items.map((item) => (
                          <SelectItem key={item.id} value={String(item.id)}>
                            {item.name}
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
                        >
                          <ToggleGroupItem
                            value="income"
                            aria-label="Toggle income"
                          >
                            <Plus className="h-4 w-4" />
                          </ToggleGroupItem>
                          <ToggleGroupItem
                            value="expense"
                            aria-label="Toggle expense"
                          >
                            <Minus className="h-4 w-4" />
                          </ToggleGroupItem>
                        </ToggleGroup>
                        <FormControl>
                          <Input
                            type="number"
                            placeholder="e.g., 5000"
                            className="rounded-l-none"
                            // Gunakan field.value dan field.onChange seperti biasa
                            value={field.value ?? ''}
                            onChange={(event) => {
                              const value = event.target.value;
                              // react-hook-form's onChange bisa menangani event atau nilai langsung
                              field.onChange(value === '' ? undefined : +value);
                            }}
                          />
                        </FormControl>
                      </div>
                      <FormMessage />
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
                {!attachmentFile ? (
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
                      <p className="text-xs text-gray-600">
                        PDF, PNG, JPG, DOCX, etc.
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
                ) : (
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
              </div>
            </div>
            {form.formState.errors.root?.serverError && (
              <p className="text-sm font-medium text-destructive">
                {form.formState.errors.root.serverError.message}
              </p>
            )}
            <DialogFooter>
              <Button
                type="submit"
                className="w-full sm:w-auto"
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting
                  ? 'Submitting...'
                  : 'Submit Request'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
