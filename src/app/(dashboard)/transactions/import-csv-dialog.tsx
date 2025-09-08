// src/app/(dashboard)/transactions/import-csv-dialog.tsx
'use client';

import * as React from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload } from 'lucide-react';
import Papa from 'papaparse';
import { toast } from 'sonner';

interface ImportCsvDialogProps {
  onImportSuccess: () => void;
}

// Komponen untuk menampilkan detail error di dalam toast
const SkippedRowsDetail = ({
  rows,
}: {
  rows: { row: any; reason: string }[];
}) => (
  <div className="mt-2 text-xs">
    <p className="font-semibold">Details:</p>
    <ul className="list-disc pl-4 max-h-40 overflow-y-auto">
      {rows.map(({ row, reason }) => (
        <li key={`line-${row.lineNumber}`}>
          <b>Line {row.lineNumber}:</b> {reason} (Item: {row.itemName || 'N/A'})
        </li>
      ))}
    </ul>
  </div>
);

export function ImportCsvDialog({ onImportSuccess }: ImportCsvDialogProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const [file, setFile] = React.useState<File | null>(null);
  const [isProcessing, setIsProcessing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.files && event.target.files.length > 0) {
      setFile(event.target.files[0]);
      setError(null);
    }
  };

  const handleImport = async () => {
    if (!file) {
      setError('Please select a file to import.');
      return;
    }

    setIsProcessing(true);
    setError(null);

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        try {
          const response = await fetch('/api/transactions/import', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ data: results.data }),
          });

          const resultData = await response.json();

          if (!response.ok) {
            throw new Error(resultData.message || 'Failed to import data.');
          }

          // === PERUBAHAN LOGIKA NOTIFIKASI ===
          if (resultData.successCount > 0) {
            toast.success(
              `${resultData.successCount} transactions imported successfully.`
            );
          }

          if (resultData.skippedRows && resultData.skippedRows.length > 0) {
            toast.warning(
              `${resultData.skippedRows.length} rows were skipped.`,
              {
                description: (
                  <SkippedRowsDetail rows={resultData.skippedRows} />
                ),
                duration: 10000, // Tampilkan lebih lama agar bisa dibaca
              }
            );
          }

          if (
            resultData.successCount === 0 &&
            resultData.skippedRows.length > 0
          ) {
            toast.error('Import failed. No valid data was found.');
          }

          if (
            resultData.successCount === 0 &&
            (!resultData.skippedRows || resultData.skippedRows.length === 0)
          ) {
            toast.info('The CSV file appears to be empty or contains no data.');
          }

          setIsOpen(false);
          setFile(null);
          onImportSuccess();
        } catch (err: any) {
          setError(err.message);
          toast.error(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (err) => {
        setError('Failed to parse CSV file: ' + err.message);
        toast.error('Failed to parse CSV file.');
        setIsProcessing(false);
      },
    });
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Upload className="mr-2 h-4 w-4" />
          Import CSV
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Import Transactions from CSV</DialogTitle>
          <DialogDescription>
            Select a CSV file. Headers must include: `date`, `itemName`,
            `payee`, `amount`, and `balanceSheetName`. The RKAP Name will be
            auto-detected from the item.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid w-full max-w-sm items-center gap-1.5">
            <Label htmlFor="csv-file">CSV File</Label>
            <Input
              id="csv-file"
              type="file"
              accept=".csv"
              onChange={handleFileChange}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setIsOpen(false)}
            disabled={isProcessing}
          >
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!file || isProcessing}>
            {isProcessing ? 'Importing...' : 'Import Data'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
