// src/app/(dashboard)/drive/page.tsx
'use client';

import * as React from 'react';
import Header from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Folder,
  File,
  Search,
  Upload,
  LayoutGrid,
  List,
  Rows3,
  PanelTop,
  Trash2,
  ChevronRight,
  FolderOpen,
  Eye,
  Loader2,
} from 'lucide-react';
import './drive-styles.css';
import { DataTable } from '@/components/ui/data-table';
import { driveColumns } from './columns';
import { NewFolderDialog } from './new-folder-dialog';
import Link from 'next/link';
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from '@/components/ui/context-menu';

export type DriveItem = {
  id: number;
  name: string;
  type: 'file' | 'folder';
  path: string | null;
  size: number | null;
  parentId: number | null;
  userId: number;
  createdAt: string;
  modifiedAt: string;
};

type ViewMode = 'grid' | 'list' | 'detail' | 'content';

export default function DrivePage() {
  const [allItems, setAllItems] = React.useState<DriveItem[]>([]);
  const [searchQuery, setSearchQuery] = React.useState('');
  const [viewMode, setViewMode] = React.useState<ViewMode>('grid');
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [loading, setLoading] = React.useState(true);
  const [isUploading, setIsUploading] = React.useState(false);

  const [currentFolderId, setCurrentFolderId] = React.useState<number | null>(
    null
  );
  const [breadcrumbs, setBreadcrumbs] = React.useState<
    { id: number | null; name: string }[]
  >([{ id: null, name: 'My Drive' }]);

  const displayedItems = React.useMemo(() => {
    const lowercasedQuery = searchQuery.toLowerCase();

    // Jika ada query pencarian, cari di semua item
    if (lowercasedQuery) {
      return allItems.filter((item) =>
        item.name.toLowerCase().includes(lowercasedQuery)
      );
    }

    // Jika tidak ada query, tampilkan item di folder saat ini
    return allItems.filter((item) => item.parentId === currentFolderId);
  }, [allItems, currentFolderId, searchQuery]);

  const fetchDriveItems = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/drive');
      if (!response.ok) throw new Error('Failed to fetch items');
      const data = await response.json();
      setAllItems(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchDriveItems();
  }, []);

  const handleFolderClick = (folder: DriveItem) => {
    setSearchQuery('');
    setCurrentFolderId(folder.id);
    setBreadcrumbs((prev) => [...prev, { id: folder.id, name: folder.name }]);
  };

  const handleBreadcrumbClick = (folderId: number | null, index: number) => {
    setSearchQuery('');
    setCurrentFolderId(folderId);
    setBreadcrumbs((prev) => prev.slice(0, index + 1));
  };

  const handleFolderCreate = async (folderName: string) => {
    try {
      const response = await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'folder',
          name: folderName,
          parentId: currentFolderId,
        }),
      });
      if (!response.ok) throw new Error('Failed to create folder');
      fetchDriveItems();
    } catch (error) {
      console.error(error);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const formData = new FormData();
    formData.append('file', file);
    try {
      const uploadResponse = await fetch('/api/upload?destination=drive', {
        method: 'POST',
        body: formData,
      });
      const uploadResult = await uploadResponse.json();
      if (!uploadResult.success) throw new Error('File upload failed');
      await fetch('/api/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: 'file',
          name: file.name,
          path: uploadResult.url,
          size: uploadResult.size,
          parentId: currentFolderId,
        }),
      });
      fetchDriveItems();
    } catch (error) {
      console.error(error);
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDelete = async (itemId: number) => {
    if (
      confirm(
        'Are you sure you want to delete this item? This action cannot be undone.'
      )
    ) {
      try {
        const response = await fetch('/api/drive', {
          method: 'DELETE',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: itemId }),
        });
        if (!response.ok) throw new Error('Failed to delete item');
        fetchDriveItems();
      } catch (error) {
        console.error(error);
      }
    }
  };

  const renderItemWithContextMenu = (
    item: DriveItem,
    children: React.ReactNode
  ) => {
    const triggerNode =
      item.type === 'folder' ? (
        <div
          className="drive-item group w-full h-full"
          onClick={() => handleFolderClick(item)}
        >
          {children}
        </div>
      ) : (
        <Link
          href={item.path || '#'}
          target="_blank"
          rel="noopener noreferrer"
          className="drive-item group w-full h-full"
        >
          {children}
        </Link>
      );

    return (
      <ContextMenu key={item.id}>
        <ContextMenuTrigger asChild>{triggerNode}</ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          {item.type === 'folder' ? (
            <ContextMenuItem onSelect={() => handleFolderClick(item)}>
              <FolderOpen className="mr-2 h-4 w-4" />
              <span>Open</span>
            </ContextMenuItem>
          ) : (
            <ContextMenuItem asChild>
              <Link
                href={item.path || '#'}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Eye className="mr-2 h-4 w-4" />
                <span>Preview</span>
              </Link>
            </ContextMenuItem>
          )}
          <ContextMenuSeparator />
          <ContextMenuItem
            className="text-red-600 focus:text-red-600 focus:bg-red-50"
            onSelect={() => handleDelete(item.id)}
          >
            <Trash2 className="mr-2 h-4 w-4" />
            <span>Delete</span>
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>
    );
  };

  const renderContent = () => {
    if (loading)
      return <p className="text-center mt-10">Loading drive items...</p>;
    if (displayedItems.length === 0) {
      return (
        <p className="col-span-full text-center text-muted-foreground mt-10">
          {searchQuery
            ? 'No items found for your search.'
            : 'This folder is empty.'}
        </p>
      );
    }

    switch (viewMode) {
      case 'grid':
        return (
          <div className="drive-grid">
            {displayedItems.map((item) =>
              renderItemWithContextMenu(
                item,
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3 min-w-0">
                    {item.type === 'folder' ? (
                      <Folder className="h-6 w-6 text-blue-500 flex-shrink-0" />
                    ) : (
                      <File className="h-6 w-6 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{item.name}</span>
                  </div>
                </div>
              )
            )}
          </div>
        );
      case 'list':
        return (
          <div className="drive-list">
            {displayedItems.map((item) =>
              renderItemWithContextMenu(
                item,
                <div className="flex items-center justify-between w-full">
                  <div className="flex-1 min-w-0 flex items-center">
                    {item.type === 'folder' ? (
                      <Folder className="mr-3 h-5 w-5 text-blue-500 flex-shrink-0" />
                    ) : (
                      <File className="mr-3 h-5 w-5 text-gray-500 flex-shrink-0" />
                    )}
                    <span className="font-medium truncate">{item.name}</span>
                  </div>
                </div>
              )
            )}
          </div>
        );
      case 'detail':
        return (
          <DataTable
            columns={driveColumns}
            data={displayedItems}
            filterColumnPlaceholder="items..."
            dateFilterColumnId="modifiedAt"
            meta={{ onDelete: handleDelete, onFolderClick: handleFolderClick }}
          />
        );
      case 'content':
        return (
          <div className="drive-content">
            {displayedItems.map((item) =>
              renderItemWithContextMenu(
                item,
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center min-w-0 flex-1">
                    {item.type === 'folder' ? (
                      <Folder className="mr-4 h-8 w-8 text-blue-500 flex-shrink-0" />
                    ) : (
                      <File className="mr-4 h-8 w-8 text-gray-500 flex-shrink-0" />
                    )}
                    <div className="truncate">
                      <p className="font-medium truncate">{item.name}</p>
                      <p className="text-sm text-muted-foreground">
                        {`Modified: ${new Date(
                          item.modifiedAt
                        ).toLocaleDateString('en-GB')} | Size: ${
                          item.size
                            ? (item.size / 1024).toFixed(2) + ' KB'
                            : '--'
                        }`}
                      </p>
                    </div>
                  </div>
                </div>
              )
            )}
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
        <div className="mb-6 flex flex-col gap-4">
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
              />
              <Button
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
              >
                {isUploading ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                {isUploading ? 'Uploading...' : 'Upload'}
              </Button>
              <NewFolderDialog onFolderCreate={handleFolderCreate} />
            </div>
          </div>
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

        {!searchQuery && (
          <div className="flex items-center space-x-2 mb-4 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <React.Fragment key={crumb.id || 'root'}>
                <button
                  onClick={() => handleBreadcrumbClick(crumb.id, index)}
                  className="hover:text-primary disabled:hover:text-muted-foreground disabled:cursor-default"
                  disabled={index === breadcrumbs.length - 1}
                >
                  {crumb.name}
                </button>
                {index < breadcrumbs.length - 1 && (
                  <ChevronRight className="h-4 w-4" />
                )}
              </React.Fragment>
            ))}
          </div>
        )}

        {searchQuery && (
          <h2 className="text-lg font-semibold mb-4">
            Search Results for "{searchQuery}"
          </h2>
        )}

        <div>{renderContent()}</div>
      </div>
    </>
  );
}
