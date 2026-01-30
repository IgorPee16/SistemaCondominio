import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from './utils';
import { base44 } from '@/api/base44Client';
import {
  LayoutDashboard,
  Users,
  Building2,
  DollarSign,
  AlertTriangle,
  Calendar,
  CalendarDays,
  FileText,
  UserCog,
  Briefcase,
  MessageSquare,
  Bell,
  Menu,
  X,
  LogOut,
  Sun,
  Moon,
  ChevronDown,
  Settings,
  Package,
  ClipboardList
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, page: 'Dashboard' },
  { name: 'Moradores', icon: Users, page: 'Residents' },
  { name: 'Unidades', icon: Building2, page: 'Units' },
  { name: 'Financeiro', icon: DollarSign, page: 'Financial' },
  { name: 'Ocorrências', icon: AlertTriangle, page: 'Occurrences' },
  { name: 'Assembleias', icon: CalendarDays, page: 'Assemblies' },
  { name: 'Reservas', icon: Calendar, page: 'Reservations' },
  { name: 'Visitantes', icon: Package, page: 'Visitors' },
  { name: 'Comunicados', icon: MessageSquare, page: 'Announcements' },
  { name: 'Enquetes', icon: ClipboardList, page: 'Polls' },
  { name: 'Documentos', icon: FileText, page: 'Documents' },
  { name: 'Funcionários', icon: UserCog, page: 'Employees' },
  { name: 'Prestadores', icon: Briefcase, page: 'ServiceProviders' },
  { name: 'Configurações', icon: Settings, page: 'Settings' },
];

export default function Layout({ children, currentPageName }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const loadUser = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);
      } catch (e) {
        console.log('User not logged in');
      }
    };
    loadUser();

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
  }, []);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    if (!darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  };

  const handleLogout = () => {
    base44.auth.logout();
  };

  return (
    <div className={`min-h-screen ${darkMode ? 'dark' : ''}`}>
      <style>{`
        :root {
          --primary: #1e3a5f;
          --primary-light: #2d5a8f;
          --accent: #10b981;
          --accent-light: #34d399;
          --bg-light: #f8fafc;
          --bg-dark: #0f172a;
        }
        .dark {
          --bg-main: #0f172a;
          --bg-card: #1e293b;
          --text-main: #f1f5f9;
          --text-muted: #94a3b8;
          --border: #334155;
        }
        :root:not(.dark) {
          --bg-main: #f8fafc;
          --bg-card: #ffffff;
          --text-main: #1e293b;
          --text-muted: #64748b;
          --border: #e2e8f0;
        }
        body {
          background-color: var(--bg-main);
          color: var(--text-main);
        }
        .sidebar-gradient {
          background: linear-gradient(180deg, #1e3a5f 0%, #0f172a 100%);
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 12px 24px -8px rgba(0,0,0,0.15);
        }
        .nav-item-active {
          background: rgba(16, 185, 129, 0.15);
          border-left: 3px solid #10b981;
        }
        .scrollbar-thin::-webkit-scrollbar {
          width: 6px;
        }
        .scrollbar-thin::-webkit-scrollbar-track {
          background: transparent;
        }
        .scrollbar-thin::-webkit-scrollbar-thumb {
          background: #475569;
          border-radius: 3px;
        }
      `}</style>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed top-0 left-0 z-50 h-full w-64 sidebar-gradient text-white
        transform transition-transform duration-300 ease-in-out
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:translate-x-0
      `}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-5 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-500 flex items-center justify-center">
                <Building2 className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="font-bold text-lg">CondoGest</h1>
                <p className="text-xs text-white/60">Gestão Inteligente</p>
              </div>
            </div>
            <button 
              className="lg:hidden text-white/60 hover:text-white"
              onClick={() => setSidebarOpen(false)}
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto scrollbar-thin py-4 px-3">
            <div className="space-y-1">
              {navItems.map((item) => {
                const isActive = currentPageName === item.page;
                return (
                  <Link
                    key={item.page}
                    to={createPageUrl(item.page)}
                    onClick={() => setSidebarOpen(false)}
                    className={`
                      flex items-center gap-3 px-4 py-3 rounded-lg
                      transition-all duration-200 group
                      ${isActive 
                        ? 'nav-item-active text-emerald-400' 
                        : 'text-white/70 hover:text-white hover:bg-white/5'
                      }
                    `}
                  >
                    <item.icon className={`w-5 h-5 ${isActive ? 'text-emerald-400' : 'text-white/50 group-hover:text-white/80'}`} />
                    <span className="font-medium text-sm">{item.name}</span>
                  </Link>
                );
              })}
            </div>
          </nav>

          {/* User section */}
          {user && (
            <div className="p-4 border-t border-white/10">
              <div className="flex items-center gap-3">
                <Avatar className="w-10 h-10 border-2 border-emerald-500">
                  <AvatarImage src={user.photo_url} />
                  <AvatarFallback className="bg-emerald-600 text-white">
                    {user.full_name?.charAt(0) || user.email?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{user.full_name || 'Usuário'}</p>
                  <p className="text-xs text-white/50 truncate">{user.email}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main content */}
      <div className="lg:ml-64 min-h-screen bg-[var(--bg-main)]">
        {/* Top header */}
        <header className="sticky top-0 z-30 bg-[var(--bg-card)] border-b border-[var(--border)] backdrop-blur-lg bg-opacity-90">
          <div className="flex items-center justify-between px-4 lg:px-6 h-16">
            <div className="flex items-center gap-4">
              <button 
                className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
                onClick={() => setSidebarOpen(true)}
              >
                <Menu className="w-5 h-5" />
              </button>
              <h2 className="text-lg font-semibold text-[var(--text-main)]">
                {navItems.find(n => n.page === currentPageName)?.name || currentPageName}
              </h2>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleDarkMode}
                className="text-[var(--text-muted)] hover:text-[var(--text-main)]"
              >
                {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </Button>

              <Button variant="ghost" size="icon" className="relative text-[var(--text-muted)] hover:text-[var(--text-main)]">
                <Bell className="w-5 h-5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full" />
              </Button>

              {user && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="gap-2 pl-2 pr-3">
                      <Avatar className="w-8 h-8">
                        <AvatarImage src={user.photo_url} />
                        <AvatarFallback className="bg-emerald-500 text-white text-xs">
                          {user.full_name?.charAt(0) || user.email?.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                      <ChevronDown className="w-4 h-4 text-[var(--text-muted)]" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem asChild>
                      <Link to={createPageUrl('Settings')}>
                        <Settings className="w-4 h-4 mr-2" />
                        Configurações
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="p-4 lg:p-6">
          {children}
        </main>
      </div>
    </div>
  );
}