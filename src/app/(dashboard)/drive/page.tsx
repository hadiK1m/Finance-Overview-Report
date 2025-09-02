// src/app/(dashboard)/drive/page.tsx
'use client';

import * as React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { driveData, DriveItem } from '@/lib/drive-data';
import {
  Folder,
  File,
  Search,
  Upload,
  Plus,
  LayoutGrid,
  List,
  Rows3,
  PanelTop,
} from 'lucide-react';
import './drive-styles.css';
import { DataTable } from '@/components/ui/data-table';
import { driveColumns } from './columns';
import { NewFolderDialog } from './new-folder-dialog';

// Definisikan tipe untuk mode tampilan
type ViewMode = 'grid' | 'list' | 'detail' | 'content';

export default function DrivePage() {
  const [searchQuery, setSearchQuery] = React.useState('');
  const [displayedItems, setDisplayedItems] =
    React.useState<DriveItem[]>(driveData);
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  // Logika untuk memfilter item berdasarkan query pencarian
  React.useEffect(() => {
    if (searchQuery === '') {
      setDisplayedItems(driveData);
      return;
    }

    const lowercasedQuery = searchQuery.toLowerCase();

    const searchItems = (items: DriveItem[]): DriveItem[] => {
      const results: DriveItem[] = [];
      for (const item of items) {
        if (item.name.toLowerCase().includes(lowercasedQuery)) {
          results.push(item);
        } else if (item.type === 'folder' && item.children) {
          const childrenResults = searchItems(item.children);
          if (childrenResults.length > 0) {
            results.push(...childrenResults);
          }
        }
      }
      return results;
    };

    setDisplayedItems(searchItems(driveData));
  }, [searchQuery]);

  // Handler untuk fungsionalitas tombol
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files) {
      console.log('Files selected:', files);
      // Logika untuk upload file bisa ditambahkan di sini
    }
  };

  const handleFolderCreate = (folderName: string) => {
    const newFolder: DriveItem = {
      id: `folder-${Date.now()}`,
      type: 'folder',
      name: folderName,
      modified: new Date().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    };
    setDisplayedItems((prevItems) => [newFolder, ...prevItems]);
    console.log('New folder created:', newFolder);
  };

  // Fungsi untuk me-render konten berdasarkan mode tampilan yang dipilih
  const renderContent = () => {
    if (displayedItems.length === 0) {
      return (
        <p className="col-span-full text-center text-muted-foreground mt-10">
          No items found.
        </p>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <div className="drive-grid">
            {displayedItems.map((item) => (
              <div key={item.id} className="drive-item group">
                <div className="flex items-center space-x-3">
                  {item.type === 'folder' ? (
                    <Folder className="h-6 w-6 text-blue-500" />
                  ) : (
                    <File className="h-6 w-6 text-gray-500" />
                  )}
                  <span className="font-medium truncate">{item.name}</span>
                </div>
              </div>
            ))}
          </div>
        );
      case 'list':
        return (
          <div className="drive-list">
            {displayedItems.map((item) => (
              <div key={item.id} className="drive-list-item">
                {item.type === 'folder' ? (
                  <Folder className="mr-3 h-5 w-5 text-blue-500 flex-shrink-0" />
                ) : (
                  <File className="mr-3 h-5 w-5 text-gray-500 flex-shrink-0" />
                )}
                <span className="font-medium truncate">{item.name}</span>
              </div>
            ))}
          </div>
        );
      case 'detail':
        return (
          <DataTable
            columns={driveColumns}
            data={displayedItems}
            filterColumnPlaceholder="items..."
            dateFilterColumnId="modified"
          />
        );
      case 'content':
        return (
          <div className="drive-content">
            {displayedItems.map((item) => (
              <div key={item.id} className="drive-content-item">
                {item.type === 'folder' ? (
                  <Folder className="mr-4 h-8 w-8 text-blue-500 flex-shrink-0" />
                ) : (
                  <File className="mr-4 h-8 w-8 text-gray-500 flex-shrink-0" />
                )}
                <div className="truncate">
                  <p className="font-medium truncate">{item.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {`Modified: ${item.modified} | Size: ${item.size || '--'}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <>
      <Header />
      <div className="p-8">
        {/*BLOK DIV DI BAWAH INI */}
        <div className="mb-6 flex flex-col gap-4">
          {/* Baris 1: Pencarian dan Tombol Aksi */}
          <div className="flex items-center justify-between">
            <div className="relative w-full max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search in Drive"
                className="pl-9"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
            <div className="flex items-center space-x-2">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                multiple
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
              >
                <Upload className="mr-2 h-4 w-4" />
                Upload
              </Button>
              <NewFolderDialog onFolderCreate={handleFolderCreate} />
            </div>
          </div>

          {/* Baris 2: Tombol View Switcher */}
          <div className="flex items-center space-x-1 border rounded-md p-1 w-fit">
            <Button
              variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'list' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('list')}
            >
              <List className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'detail' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('detail')}
            >
              <Rows3 className="h-4 w-4" />
            </Button>
            <Button
              variant={viewMode === 'content' ? 'secondary' : 'ghost'}
              size="icon"
              onClick={() => setViewMode('content')}
            >
              <PanelTop className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div>{renderContent()}</div>
      </div>
    </>
  );
}
