// src/app/(dashboard)/settings/section.tsx
import React from 'react';

interface SectionProps {
  title: string;
  description: string;
  children: React.ReactNode;
}

export function Section({ title, description, children }: SectionProps) {
  return (
    <div className="py-8 grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4 border-b">
      <div className="md:col-span-1">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="mt-1 text-sm text-gray-600">{description}</p>
      </div>
      <div className="md:col-span-2">{children}</div>
    </div>
  );
}
