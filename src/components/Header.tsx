'use client'

import React from 'react';
import { PlusIcon } from './Icons';

const Header: React.FC = () => {
  return (
    <div className="flex justify-between items-center">
      <h1 className="text-4xl font-bold text-gray-800">Home</h1>
      <div className="flex items-center space-x-2">
        <button className="flex items-center bg-gray-800 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-gray-700">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
          New Project
        </button>
        <button className="flex items-center bg-white border border-gray-300 px-4 py-2 rounded-lg text-sm font-semibold text-gray-700 hover:bg-gray-50">
           <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
          New Task
        </button>
      </div>
    </div>
  );
};

export default Header;
