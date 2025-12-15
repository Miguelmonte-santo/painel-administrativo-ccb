
import React, { useState } from 'react';
import Sidebar from './components/layout/Sidebar';
import Header from './components/layout/Header';
import Dashboard from './pages/Dashboard';
import EnrollmentRequests from './pages/EnrollmentRequests';
import Students from './pages/Students';
import LoginPage from './pages/LoginPage';
import StudentRegistration from './pages/StudentRegistration';
import LiveAttendance from './pages/LiveAttendance';
import type { Page } from './types';


const App: React.FC = () => {
  // Roteamento simples para a página de cadastro pública
  if (window.location.pathname === '/cadastro') {
    return <StudentRegistration />;
  }
  
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentPage, setCurrentPage] = useState<Page>('Dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const handleLogin = () => {
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentPage('Dashboard');
  };

  if (!isAuthenticated) {
    return <LoginPage onLogin={handleLogin} />;
  }

  const renderContent = () => {
    switch (currentPage) {
      case 'Dashboard':
        return <Dashboard />;
      case 'Solicitações de Matrícula':
        return <EnrollmentRequests />;
      case 'Alunos':
        return <Students />;
      case 'Professores':
        return <div className="p-6 text-gray-700 dark:text-gray-300">Página de Professores (Em construção)</div>;
      case 'Presença':
        return <LiveAttendance />;
      case 'Configurações':
        return <div className="p-6 text-gray-700 dark:text-gray-300">Página de Configurações (Em construção)</div>;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100 dark:bg-dark-900 text-gray-900 dark:text-gray-100">
      <Sidebar currentPage={currentPage} setCurrentPage={setCurrentPage} sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* FIX: Changed `onLogout` to `handleLogout` to pass the correct function to the Header component. */}
        <Header currentPage={currentPage} setSidebarOpen={setSidebarOpen} onLogout={handleLogout} />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 dark:bg-dark-900">
          <div className="container mx-auto px-6 py-8">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;