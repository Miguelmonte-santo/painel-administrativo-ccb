import React from 'react';
import type { Page } from '../../types';
import { LayoutDashboard, UserCheck, Users, Settings, X, BookUser, ClipboardCheck, FileBarChart } from 'lucide-react';

interface SidebarProps {
  currentPage: Page;
  setCurrentPage: (page: Page) => void;
  sidebarOpen: boolean;
  setSidebarOpen: (open: boolean) => void;
}

const navItems: { name: Page; icon: React.ElementType }[] = [
  { name: 'Dashboard', icon: LayoutDashboard },
  { name: 'Solicitações de Matrícula', icon: UserCheck },
  { name: 'Alunos', icon: Users },
  { name: 'Professores', icon: BookUser },
  { name: 'Presença', icon: ClipboardCheck },
  { name: 'Relatórios', icon: FileBarChart },
  { name: 'Configurações', icon: Settings },
];

const Sidebar: React.FC<SidebarProps> = ({ currentPage, setCurrentPage, sidebarOpen, setSidebarOpen }) => {
  
  const handleNavClick = (page: Page) => {
    setCurrentPage(page);
    if (sidebarOpen) {
      setSidebarOpen(false);
    }
  };

  return (
    <>
      <div className={`fixed inset-0 z-20 bg-black bg-opacity-50 transition-opacity lg:hidden ${sidebarOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={() => setSidebarOpen(false)}></div>
      <aside className={`fixed inset-y-0 left-0 z-30 w-64 bg-dark-800 text-white transform ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0`}>
        <div className="flex items-center justify-between p-4 border-b border-dark-700">
          <h1 className="text-xl font-bold">Cursinho Bonsucesso</h1>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white">
            <X size={24} />
          </button>
        </div>
        <nav className="mt-4">
          {navItems.map((item) => (
            <a
              key={item.name}
              href="#"
              onClick={(e) => {
                e.preventDefault();
                handleNavClick(item.name);
              }}
              className={`flex items-center px-4 py-3 mx-2 rounded-lg transition-colors duration-200 ${
                currentPage === item.name
                  ? 'bg-primary-800 text-white'
                  : 'text-gray-400 hover:bg-dark-700 hover:text-white'
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span className="ml-3">{item.name}</span>
            </a>
          ))}
        </nav>
      </aside>
    </>
  );
};

export default Sidebar;