
import React, { useState } from 'react';
import type { Page } from '../../types';
import { Menu, Bell, User, LogOut } from 'lucide-react';

interface HeaderProps {
    currentPage: Page;
    setSidebarOpen: (open: boolean) => void;
    onLogout: () => void;
}

const Header: React.FC<HeaderProps> = ({ currentPage, setSidebarOpen, onLogout }) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);

  const handleLogoutClick = (e: React.MouseEvent) => {
    e.preventDefault();
    setDropdownOpen(false);
    onLogout();
  };
  
  return (
    <header className="flex items-center justify-between px-6 py-4 bg-white dark:bg-dark-800 border-b dark:border-dark-700">
      <div className="flex items-center">
        <button onClick={() => setSidebarOpen(true)} className="text-gray-500 dark:text-gray-300 focus:outline-none lg:hidden">
          <Menu size={24} />
        </button>
        <h1 className="relative ml-3 text-2xl font-semibold text-gray-800 dark:text-gray-200">{currentPage}</h1>
      </div>

      <div className="flex items-center">
        <button className="flex text-gray-600 dark:text-gray-300 focus:outline-none mx-4">
          <Bell size={24} />
        </button>

        <div className="relative">
          <button onClick={() => setDropdownOpen(!dropdownOpen)} className="relative z-10 block h-8 w-8 rounded-full overflow-hidden border-2 border-primary-500 focus:outline-none">
            <User size={24} className="h-full w-full object-cover p-0.5 text-gray-600 dark:text-gray-300" />
          </button>
          
          {dropdownOpen && (
             <div 
                className="absolute right-0 mt-2 w-48 bg-white dark:bg-dark-800 rounded-md shadow-lg py-1 ring-1 ring-black ring-opacity-5 z-20"
                onMouseLeave={() => setDropdownOpen(false)}
             >
                <a
                  href="#"
                  onClick={handleLogoutClick}
                  className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-dark-700"
                >
                  <LogOut size={16} className="mr-3" />
                  Sair
                </a>
              </div>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;