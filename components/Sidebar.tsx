import React from 'react';
import { CRAFT_DADDY_LOGO_URL } from '../assets/brand';

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: any) => void;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, onClose }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: 'M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6' },
    { id: 'invoices', label: 'Invoices', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
    { id: 'leads', label: 'Leads', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z' },
    { id: 'clients', label: 'Clients', icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4' },
  ];

  return (
    <aside className="w-72 lg:w-64 h-full bg-[#5c2c90] text-white flex flex-col no-print border-r border-white/10 shadow-2xl lg:shadow-none">
      <div className="p-6 flex items-center justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-3">
            <div className="bg-white p-1 rounded-lg">
               <img src={CRAFT_DADDY_LOGO_URL} className="h-10 w-auto object-contain" alt="Craft Daddy Logo" />
            </div>
          </div>
        </div>
        {onClose && (
          <button onClick={onClose} className="lg:hidden p-2 text-white/50 hover:text-white transition">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        )}
      </div>
      
      <nav className="flex-1 px-4 py-4 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`w-full flex items-center gap-3 px-4 py-4 lg:py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
              activeTab === item.id 
                ? 'bg-white/20 text-white shadow-lg translate-x-1 backdrop-blur-sm' 
                : 'text-white/70 hover:bg-white/10 hover:text-white'
            }`}
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
            </svg>
            {item.label}
          </button>
        ))}
      </nav>
      
      <div className="p-6 mt-auto">
        <div className="p-4 bg-white/10 rounded-2xl border border-white/5">
          <div className="flex items-center gap-3">
            <img src="https://picsum.photos/40/40" className="w-10 h-10 rounded-full border border-white/20" alt="Avatar" />
            <div className="text-sm overflow-hidden">
              <p className="font-bold text-white truncate">Administrator</p>
              <p className="text-white/60 text-[10px] uppercase font-black tracking-widest truncate">Craft Daddy</p>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;