'use client';

import React from 'react';
import type { StatCardProps } from '@/lib/data';
import { TrendingUpIcon, TrendingDownIcon } from './Icons';

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  description,
  trend,
  trendDirection,
  icon,
}) => {
  const trendColor =
    trendDirection === 'up'
      ? 'text-green-600'
      : trendDirection === 'down'
      ? 'text-red-600'
      : 'text-gray-600';
  const TrendIcon =
    trendDirection === 'up'
      ? TrendingUpIcon
      : trendDirection === 'down'
      ? TrendingDownIcon
      : null;

  return (
    <div className="bg-white p-4 rounded-xl border border-gray-200/80 flex flex-col justify-between h-full hover:shadow-md transition-shadow duration-200">
      <div>
        <p className="text-sm font-medium text-gray-500">{title}</p>
        <p className="text-3xl font-semibold text-gray-800 mt-2">{value}</p>
        <p className="text-xs text-gray-400 mt-1">{description}</p>
      </div>
      <div className="flex items-center justify-between mt-4">
        {icon}
        <div className={`flex items-center text-xs font-medium ${trendColor}`}>
          {TrendIcon && <TrendIcon className="w-4 h-4 mr-1" />}
          <span>{trend}</span>
        </div>
      </div>
    </div>
  );
};

export default StatCard;
