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

interface ImportCsvDialogProps {
  onImportSuccess: () => void;
}

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

          if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'Failed to import data.');
          }

          setIsOpen(false);
          setFile(null);
          onImportSuccess(); // Refresh data di halaman utama
        } catch (err: any) {
          setError(err.message);
        } finally {
          setIsProcessing(false);
        }
      },
      error: (err) => {
        setError('Failed to parse CSV file: ' + err.message);
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
            Select a CSV file to import. The file must have headers: `date`,
            `rkapName`, `itemName`, `payee`, `amount`, and `balanceSheetName`.
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
