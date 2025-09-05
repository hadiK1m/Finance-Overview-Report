// src/app/(dashboard)/teams/page.tsx
'use client';

import * as React from 'react';
import Header from '@/components/Header';
import { columns, User } from './columns';
import { DataTable } from '@/components/ui/data-table';
import { ChangeRoleDialog } from './change-role-dialog'; // <-- Impor dialog

export default function TeamsPage() {
  const [data, setData] = React.useState<User[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [currentUser, setCurrentUser] = React.useState<User | null>(null);

  // State untuk dialog
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [selectedUser, setSelectedUser] = React.useState<User | null>(null);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const [usersRes, sessionRes] = await Promise.all([
        fetch('/api/users'),
        fetch('/api/auth/session'),
      ]);
      const usersData = await usersRes.json();
      const sessionData = await sessionRes.json();
      setData(usersData);
      setCurrentUser(sessionData.user);
    } catch (error) {
      console.error('Failed to fetch data:', error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchUsers();
  }, []);

  const handleChangeRole = (user: User) => {
    setSelectedUser(user);
    setIsDialogOpen(true);
  };

  return (
    <>
      <Header />
      <div className="p-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight">
              User Management
            </h2>
            <p className="text-muted-foreground">
              Manage users and their roles in the system.
            </p>
          </div>
        </div>
        {loading ? (
          <p>Loading...</p>
        ) : (
          <DataTable
            columns={columns}
            data={data}
            filterColumnPlaceholder="users by email..."
            dateFilterColumnId="createdAt"
            meta={{
              onChangeRole: handleChangeRole,
              currentUser: currentUser,
            }}
          />
        )}
      </div>
      <ChangeRoleDialog
        user={selectedUser}
        isOpen={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUserUpdated={fetchUsers}
      />
    </>
  );
}
