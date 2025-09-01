// src/lib/data.tsx
import React from 'react';
import { 
  CheckIcon, 
  AlertTriangleIcon, 
  TrendingUpIcon, 
  BarChartIcon, 
  ZapIcon, 
  ActivityIcon 
} from '@/components/Icons';

// --- Definisi Tipe ---

export interface StatCardProps {
  title: string;
  value: string;
  description: string;
  trend: string;
  trendDirection: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
}

export type Priority = 'High' | 'Medium' | 'Low';

export interface ProjectCardProps {
  priority: Priority;
  tags: string[];
  title: string;
  description: string;
  chartData: { name: string; value: number }[];
  checklist: { text: string; completed: boolean }[];
  completion: number;
  team: string;
  eta: string;
}

// --- Data Konstan ---

export const STATS_DATA: StatCardProps[] = [
  {
    title: 'All Tasks',
    value: '1,280',
    description: 'Across all projects',
    trend: '+8% this week',
    trendDirection: 'up',
    icon: <BarChartIcon className="w-5 h-5 text-gray-500" />,
  },
  {
    title: 'Completed Tasks',
    value: '192',
    description: 'Compared to 156 last week',
    trend: '+23% efficiency',
    trendDirection: 'up',
    icon: <CheckIcon className="w-5 h-5 text-gray-500" />,
  },
  {
    title: 'Overdue',
    value: '35',
    description: 'Mostly from Marketing',
    trend: 'Needs attention',
    trendDirection: 'neutral',
    icon: <AlertTriangleIcon className="w-5 h-5 text-gray-500" />,
  },
  {
    title: 'Active Projects',
    value: '12',
    description: '3 new this week',
    trend: 'Growing steadily',
    trendDirection: 'up',
    icon: <TrendingUpIcon className="w-5 h-5 text-gray-500" />,
  },
  {
    title: 'Team Activity (Last 24h)',
    value: '147 updates',
    description: 'Tasks moved, comments & edits',
    trend: 'Spike after sprint planning',
    trendDirection: 'down',
    icon: <ActivityIcon className="w-5 h-5 text-gray-500" />,
  },
  {
    title: 'Automations Triggered',
    value: '89',
    description: 'Slack + Recurring tasks',
    trend: '+15% from last week',
    trendDirection: 'up',
    icon: <ZapIcon className="w-5 h-5 text-gray-500" />,
  },
];

const generateChartData = () => Array.from({ length: 15 }, (_, i) => ({ name: `Day ${i}`, value: Math.floor(Math.random() * 50) + 10 }));

// --- ISI KEMBALI DATA PROYEK DI SINI ---
export const PROJECTS_DATA: ProjectCardProps[] = [
  {
    priority: 'High',
    tags: ['QA', 'Audit'],
    title: 'Enable Real-Time Collaboration in Task View',
    description: 'Allow multiple users to edit tasks simultaneously with live syncing and conflict resolution.',
    chartData: generateChartData(),
    checklist: [
      { text: 'WebSocket service integrated and stable', completed: true },
      { text: 'Conflict handling logic implemented', completed: true },
      { text: 'Cursor avatars added for multi-user view', completed: false },
      { text: 'Latency under 120ms in staging', completed: false },
    ],
    completion: 75,
    team: 'Frontend, Platform',
    eta: 'July 10, 2025',
  },
  {
    priority: 'Low',
    tags: ['Research', 'Audit'],
    title: 'Build Task Dependency Logic for Timeline View',
    description: 'Allow users to set dependencies between tasks and visualize blocked or sequential workflows.',
    chartData: generateChartData(),
    checklist: [
      { text: 'Blocked by and Depends on logic completed', completed: true },
      { text: 'Gantt view integration finished', completed: true },
      { text: 'Circular dependency errors handled', completed: true },
      { text: 'Awaiting QA sign-off', completed: false },
    ],
    completion: 90,
    team: 'Frontend, Platform',
    eta: 'July 9, 2025',
  },
  {
    priority: 'Medium',
    tags: ['QA', 'Audit'],
    title: 'Improve Task Search Performance & Accuracy',
    description: 'Optimize search response time and enhance fuzzy matching for task names and tags.',
    chartData: generateChartData(),
    checklist: [
      { text: 'Switched to ElasticSearch backend', completed: true },
      { text: 'Debounced input + server-side throttling', completed: true },
      { text: 'Avg response time improved by 60%', completed: false },
      { text: 'Tag-based and fuzzy search enabled', completed: false },
    ],
    completion: 80,
    team: 'Infra Platform',
    eta: 'July 11, 2025',
  },
  {
    priority: 'Medium',
    tags: ['UI design', 'Interaction'],
    title: 'Setup Slack Integration for Task Updates',
    description: 'Allow teams to receive automated task activity alerts directly in Slack channels.',
    chartData: generateChartData(),
    checklist: [
      { text: 'OAuth flow complete', completed: true },
      { text: 'Supports task-created and status-change events', completed: false },
      { text: 'Channel selection UI deployed', completed: false },
      { text: 'Next: Add user-level controls', completed: false },
    ],
    completion: 65,
    team: 'Backend, Integrations',
    eta: 'July 14, 2025',
  },
];