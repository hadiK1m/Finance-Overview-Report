// src/components/Sidebar.tsx
'use client'
 
import React, { useState } from 'react';
import Link from 'next/link'; // 1. Impor komponen Link
import { usePathname } from 'next/navigation'; // 2. Impor hook untuk mendapatkan path URL
import { 
    SearchIcon, HomeIcon, CalendarIcon, UsersIcon, FileTextIcon, 
    BotIcon, BarChart2Icon, ChevronUpIcon, ChevronDownIcon, PlusIcon, 
    MoreHorizontalIcon, SettingsIcon, GitMergeIcon, ArrowLeftIcon, FigmaIcon, TrelloIcon,
    BarChartHorizontal as ChartBarStacked
} from 'lucide-react';

interface SidebarProps {
  isOpen: boolean;
  toggle: () => void;
}

// 3. Modifikasi NavItem untuk menggunakan <Link> dan dynamic active state
const NavItem = ({ href, icon, children, isOpen }: { href: string; icon: React.ReactNode; children: React.ReactNode; isOpen: boolean }) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={`flex items-center px-3 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${isActive ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600 hover:bg-gray-100'} ${!isOpen && 'justify-center'}`}>
      {icon}
      {isOpen && <span className="ml-3 truncate">{children}</span>}
    </Link>
  );
};

const CollapsibleSection = ({ title, children, defaultOpen = false, isOpen }: { title: string; children?: React.ReactNode; defaultOpen?: boolean; isOpen: boolean; }) => {
  const [isSectionOpen, setSectionOpen] = useState(defaultOpen);
  
  if (!isOpen) {
    return <div className="pt-2">{children}</div>;
  }

  return (
    <div className="pt-2">
      <button onClick={() => setSectionOpen(!isSectionOpen)} className="flex items-center justify-between w-full text-sm font-semibold text-gray-500 hover:text-gray-800 py-2">
        <span className="flex items-center truncate">{title}</span>
        <div className="flex items-center gap-2 flex-shrink-0">
          <PlusIcon className="w-4 h-4 text-gray-400 hover:text-gray-700" />
          <MoreHorizontalIcon className="w-4 h-4 text-gray-400 hover:text-gray-700" />
          {isSectionOpen ? <ChevronUpIcon className="w-4 h-4" /> : <ChevronDownIcon className="w-4 h-4" />}
        </div>
      </button>
      {isSectionOpen && <div className="mt-1 space-y-1">{children}</div>}
    </div>
  );
};

// 4. Modifikasi ProjectLink untuk menggunakan <Link>
const ProjectLink = ({ href, color, name, isOpen }: { href: string; color: string; name: string; isOpen: boolean }) => (
    <Link href={href} className={`flex items-center px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-100 ${!isOpen && 'justify-center'}`}>
        <span className={`w-2 h-2 rounded-full flex-shrink-0`} style={{ backgroundColor: color }}></span>
        {isOpen && <span className="ml-3 truncate">{name}</span>}
    </Link>
)

const Sidebar: React.FC<SidebarProps> = ({ isOpen, toggle }) => {
  return (
    <aside className={`bg-gray-50/50 border-r border-gray-200/50 flex flex-col transition-all duration-300 ease-in-out ${isOpen ? 'w-64 p-4 space-y-4' : 'w-20 p-2 space-y-2'}`}>
      <div className={`flex items-center ${isOpen ? 'justify-between' : 'justify-center'}`}>
        <div className={`flex items-center overflow-hidden ${isOpen && 'space-x-3'}`}>
          {isOpen && (
            <div className="w-10 h-10 bg-gray-800 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <circle cx="8" cy="8" r="4" fill="white"/><circle cx="16" cy="16" r="4" fill="white"/><circle cx="8" cy="16" r="4" fill="white" fillOpacity="0.5"/><circle cx="16" cy="8" r="4" fill="white" fillOpacity="0.5"/>
              </svg>
            </div>
          )}
          {isOpen && (
            <div>
              <p className="font-semibold text-sm truncate">Courtney Henry</p>
              <p className="text-xs text-gray-500 truncate">The Walt Disney Company</p>
            </div>
          )}
        </div>
        <button onClick={toggle} className="text-gray-400 hover:text-gray-700 p-2 rounded-md">
            <ArrowLeftIcon className={`w-5 h-5 transition-transform duration-300 ${!isOpen && 'rotate-180'}`} />
        </button>
      </div>

      {isOpen && (
        <div className="relative">
          <SearchIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input type="text" placeholder="Search" className="w-full pl-10 pr-4 py-2 text-sm bg-white border border-gray-200/80 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-gray-400 bg-gray-100 px-1.5 py-0.5 rounded-sm border border-gray-200">⌘ F</div>
        </div>
      )}
      
      <nav className="flex-1 space-y-2 overflow-y-auto">
        <div className="space-y-1">
          {isOpen && <h3 className="px-3 text-xs font-semibold text-gray-400 uppercase tracking-wider">Essentials</h3>}
          {/* 5. Ganti semua href menjadi link yang valid */}
          <NavItem href="/" icon={<HomeIcon className="w-5 h-5" />} isOpen={isOpen}>Home</NavItem>
          <NavItem href="/categories" icon={<ChartBarStacked className="w-5 h-5" />} isOpen={isOpen}>Categories</NavItem>
          <NavItem href="/calendar" icon={<CalendarIcon className="w-5 h-5" />} isOpen={isOpen}>Calendar</NavItem>
          <NavItem href="/teams" icon={<UsersIcon className="w-5 h-5" />} isOpen={isOpen}>Teams</NavItem>
          <NavItem href="/docs" icon={<FileTextIcon className="w-5 h-5" />} isOpen={isOpen}>Docs</NavItem>
          <NavItem href="/automations" icon={<BotIcon className="w-5 h-5" />} isOpen={isOpen}>Automations</NavItem>
          <NavItem href="/reporting" icon={<BarChart2Icon className="w-5 h-5" />} isOpen={isOpen}>Reporting</NavItem>
        </div>

        <div className="border-t border-gray-200/80">
          <CollapsibleSection title="Projects" defaultOpen={true} isOpen={isOpen}>
             <ProjectLink href="/projects/atlas" color="#63d393" name="Atlas CRM Revamp" isOpen={isOpen} />
             <ProjectLink href="/projects/nimbus" color="#f19953" name="Nimbus Dashboard" isOpen={isOpen} />
             <ProjectLink href="/projects/orion" color="#4f80e1" name="Orion API Gateway" isOpen={isOpen} />
             <ProjectLink href="/projects/helio" color="#e14f82" name="Helio Task System" isOpen={isOpen} />
          </CollapsibleSection>
        </div>
        
        <div className="border-t border-gray-200/80">
          <CollapsibleSection title="Management" isOpen={isOpen} />
        </div>
        
        <div className="border-t border-gray-200/80">
          <CollapsibleSection title="Support" defaultOpen={true} isOpen={isOpen}>
              <NavItem href="/settings" icon={<SettingsIcon className="w-5 h-5" />} isOpen={isOpen}>Settings</NavItem>
              <NavItem href="/releases" icon={<GitMergeIcon className="w-5 h-5" />} isOpen={isOpen}>Releases</NavItem>
          </CollapsibleSection>
        </div>
      </nav>

      <div className="mt-auto border-t border-gray-200/80">
        <CollapsibleSection title="Apps" defaultOpen={true} isOpen={isOpen}>
            <NavItem href="/apps/trello" icon={<TrelloIcon className="w-5 h-5" />} isOpen={isOpen}>Trello</NavItem>
            <NavItem href="/apps/figma" icon={<FigmaIcon className="w-5 h-5" />} isOpen={isOpen}>Figma</NavItem>
        </CollapsibleSection>
      </div>
    </aside>
  );
};

export default Sidebar;