'use client'

import React from 'react';
import { BarChart, Bar, ResponsiveContainer, Cell } from 'recharts';
import type { ProjectCardProps } from '@/lib/data';
import { CheckCircleIcon } from './Icons';

const PriorityBadge: React.FC<{ priority: 'High' | 'Medium' | 'Low' }> = ({ priority }) => {
  const styles = {
    High: 'bg-red-100 text-red-700',
    Medium: 'bg-yellow-100 text-yellow-700',
    Low: 'bg-purple-100 text-purple-700',
  };
  return <span className={`px-2 py-1 text-xs font-medium rounded-full ${styles[priority]}`}>{priority}</span>;
};

const Tag: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span className="px-2 py-1 text-xs font-medium text-gray-600 bg-gray-100 border border-gray-200/80 rounded-full">{children}</span>
);

const ProjectCard: React.FC<ProjectCardProps> = ({ priority, tags, title, description, chartData, checklist }) => {
  const priorityColors = {
    High: '#ef4444',
    Medium: '#f59e0b',
    Low: '#a855f7',
  };
  const barColor = priorityColors[priority];

  return (
    <div className="bg-white p-5 rounded-xl border border-gray-200/80 flex flex-col space-y-4 hover:shadow-lg transition-shadow duration-200">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2 flex-wrap">
          <PriorityBadge priority={priority} />
          {tags.map((tag) => <Tag key={tag}>{tag}</Tag>)}
        </div>
      </div>
      
      <div>
        <h3 className="font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-500 mt-1">{description}</p>
      </div>

      <div className="h-20 -mx-5">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} margin={{ top: 5, right: 5, left: 5, bottom: 5 }}>
            <Bar dataKey="value" barSize={4} radius={[10, 10, 10, 10]}>
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={barColor} opacity={index % 2 === 0 ? 1 : 0.4} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
      
      <div className="space-y-2 pt-2">
        {checklist.slice(0, 5).map((item, index) => (
          <div key={index} className="flex items-start text-sm">
            <CheckCircleIcon className={`w-4 h-4 mr-2 mt-0.5 flex-shrink-0 ${item.completed ? 'text-green-500' : 'text-gray-300'}`} />
            <span className={item.completed ? 'text-gray-700' : 'text-gray-500'}>
              {item.text}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ProjectCard;
