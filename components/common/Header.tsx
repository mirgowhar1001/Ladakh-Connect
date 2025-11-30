import React from 'react';
import { ChevronRight, User } from 'lucide-react';

interface HeaderProps {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  onBack?: () => void;
  rightAction?: React.ReactNode;
  theme?: 'dark' | 'light';
}

export const Header: React.FC<HeaderProps> = ({ title, subtitle, showBack, onBack, rightAction, theme = 'dark' }) => (
  <div className={`flex items-center p-3 sticky top-0 z-50 shadow-md ${theme === 'dark' ? 'bg-mmt-red text-white' : 'bg-white text-gray-800'}`}>
    {showBack && (
      <button onClick={onBack} className="mr-3 p-1 rounded-full hover:bg-black/10 transition">
        <ChevronRight className="rotate-180" size={24} />
      </button>
    )}
    <div className="flex-1">
        <h1 className="text-lg font-bold leading-tight">{title}</h1>
        {subtitle && <p className={`text-xs ${theme === 'dark' ? 'text-white/80' : 'text-gray-500'}`}>{subtitle}</p>}
    </div>
    {rightAction ? rightAction : (
      <div className={`p-2 rounded-full ${theme === 'dark' ? 'bg-white/20' : 'bg-gray-100'}`}>
        <User size={20} className={theme === 'dark' ? 'text-white' : 'text-gray-600'} />
      </div>
    )}
  </div>
);