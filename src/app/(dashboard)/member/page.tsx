// src/app/(dashboard)/member/page.tsx

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { ShieldAlert } from 'lucide-react';

export default function MemberPage() {
  return (
    <>
      <div className="flex flex-1 items-center justify-center p-8 bg-gray-100/50">
        <Card className="w-full max-w-lg text-center">
          <CardHeader>
            <div className="mx-auto bg-yellow-100 rounded-full p-3 w-fit">
              <ShieldAlert className="h-8 w-8 text-yellow-600" />
            </div>
            <CardTitle className="mt-4">Account Pending Approval</CardTitle>
            <CardDescription>
              Your account has been successfully created but requires admin
              approval for full access.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Please contact an administrator to have your role updated. Once
              your role is changed from "Member", you will be able to access the
              dashboard features.
            </p>
          </CardContent>
        </Card>
      </div>
    </>
  );
}
