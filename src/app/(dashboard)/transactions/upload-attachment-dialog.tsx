// src/app/(dashboard)/transactions/upload-attachment-dialog.tsx
'use client';

import * as React from 'react';
import * as z from 'zod';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { UploadCloud, File as FileIcon, X } from 'lucide-react';

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
  FormMessage,
} from '@/components/ui/form';
import { TransactionWithRelations } from './columns'; // Import tipe transaksi

const uploadAttachmentSchema = z.object({
  attachment: z.instanceof(File).optional().nullable(),
});

interface UploadAttachmentDialogProps {
  transaction: TransactionWithRelations | null;
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  onAttachmentUploaded: () => void;
}

export function UploadAttachmentDialog({
  transaction,
  isOpen,
  onOpenChange,
  onAttachmentUploaded,
}: UploadAttachmentDialogProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const form = useForm<z.infer<typeof uploadAttachmentSchema>>({
    resolver: zodResolver(uploadAttachmentSchema),
    defaultValues: {
      attachment: null,
    },
  });

  // Reset form saat dialog ditutup atau dibuka untuk transaksi baru
  React.useEffect(() => {
    if (!isOpen) {
      form.reset({ attachment: null });
    }
  }, [isOpen, form]);

  async function onSubmit(values: z.infer<typeof uploadAttachmentSchema>) {
    if (!transaction || !values.attachment) {
      form.setError('root', {
        message: 'No file selected or transaction not found.',
      });
      return;
    }

    let attachmentUrl: string | undefined = undefined;

    // 1. Upload file
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
      form.setError('root', { message: 'File upload failed.' });
      return;
    }

    // 2. Update attachmentUrl di transaksi
    try {
      const response = await fetch('/api/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: transaction.id,
          attachmentUrl: attachmentUrl,
        }),
      });
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.message || 'Failed to update transaction attachment'
        );
      }
      onOpenChange(false);
      onAttachmentUploaded(); // Trigger refresh data
    } catch (error: any) {
      console.error(error);
      form.setError('root', { message: error.message });
    }
  }

  const attachmentFile = form.watch('attachment');

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Upload Attachment for Transaction</DialogTitle>
          <DialogDescription>
            {transaction
              ? `Transaction: ${transaction.payee} (${transaction.amount})`
              : 'Select a file to upload.'}
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="space-y-4 pt-4"
          >
            <div>
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
                    onClick={() => form.setValue('attachment', null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <FormMessage>
                {form.formState.errors.attachment?.message}
              </FormMessage>
              {form.formState.errors.root && (
                <p className="text-sm font-medium text-destructive mt-2">
                  {form.formState.errors.root.message}
                </p>
              )}
            </div>
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
                disabled={form.formState.isSubmitting || !attachmentFile}
              >
                {form.formState.isSubmitting ? 'Uploading...' : 'Upload File'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
