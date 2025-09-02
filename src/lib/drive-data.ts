// src/lib/drive-data.ts
export type DriveItem = {
  id: string;
  type: 'folder' | 'file';
  name: string;
  modified: string;
  size?: string;
  children?: DriveItem[]; // properti children untuk folder
};

export const driveData: DriveItem[] = [
  {
    id: '1',
    type: 'folder',
    name: 'Project Alpha',
    modified: 'Aug 28, 2025',
    children: [
      {
        id: '1a',
        type: 'file',
        name: 'Alpha_Roadmap.docx',
        modified: 'Aug 28, 2025',
        size: '1.2 MB',
      },
      {
        id: '1b',
        type: 'file',
        name: 'Alpha_Budget.xlsx',
        modified: 'Aug 27, 2025',
        size: '780 KB',
      },
    ],
  },
  { id: '2', type: 'folder', name: 'Q3 Budgets', modified: 'Aug 25, 2025' },
  {
    id: '3',
    type: 'folder',
    name: 'Marketing Assets',
    modified: 'Aug 22, 2025',
  },
  {
    id: '4',
    type: 'file',
    name: 'Final_Report.pdf',
    modified: 'Aug 20, 2025',
    size: '2.5 MB',
  },
  {
    id: '5',
    type: 'file',
    name: 'Meeting_Notes.docx',
    modified: 'Aug 19, 2025',
    size: '512 KB',
  },
  {
    id: '6',
    type: 'file',
    name: 'Onboarding_Video.mp4',
    modified: 'Aug 15, 2025',
    size: '128 MB',
  },
];
