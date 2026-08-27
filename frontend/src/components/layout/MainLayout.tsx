import React, { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '@/store';
import { logout, setSelectedGroup } from '@/store/slices/authSlice';
import { setIsSearchModalOpen } from '@/store/slices/filterSlice';
import { toggleTheme } from '@/store/slices/themeSlice';
import { clearToast } from '@/store/slices/notificationSlice';
import { useWebSocketNotifications } from '@/hooks/useWebSocketNotifications';
import { axiosClient } from '@/api/axiosClient';
import { Group } from '@/types';
import {
  LayoutDashboard,
  Ticket,
  Users,
  Sliders,
  History,
  Search,
  Bell,
  Sun,
  Moon,
  LogOut,
  ChevronDown,
  Menu,
  X,
  Layers,
  Shield,
  Building2,
  Pin,
  User as UserIcon,
} from 'lucide-react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { GlobalSearchModal } from './GlobalSearchModal';
import { NotificationDrawer } from './NotificationDrawer';

export const MainLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();

  useWebSocketNotifications();

  const { user, selectedGroup } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { unreadCount, toastNotification } = useSelector((state: RootState) => state.notifications);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [groups, setGroups] = useState<Group[]>([]);
  const [isGroupDropdownOpen, setIsGroupDropdownOpen] = useState(false);

  // Pinned Groups State
  const [pinnedGroupIds, setPinnedGroupIds] = useState<number[]>(() => {
    try {
      const saved = localStorage.getItem('pinned_group_ids');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const togglePinGroup = (groupId: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setPinnedGroupIds((prev) => {
      const next = prev.includes(groupId)
        ? prev.filter((id) => id !== groupId)
        : [...prev, groupId];
      localStorage.setItem('pinned_group_ids', JSON.stringify(next));
      return next;
    });
  };

  useEffect(() => {
    axiosClient
      .get('/groups/')
      .then((res) => {
        const groupList = res.data.results || res.data;
        if (Array.isArray(groupList)) {
          setGroups(groupList);
          if (groupList.length === 0) {
            dispatch(setSelectedGroup(null));
          } else if (!selectedGroup || !groupList.some((g) => g.id === selectedGroup.id)) {
            dispatch(setSelectedGroup(groupList[0]));
          }
        }
      })
      .catch(console.error);
  }, []);

  useEffect(() => {
    if (toastNotification) {
      const timer = setTimeout(() => {
        dispatch(clearToast());
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toastNotification, dispatch]);

  const navItems = [
    { label: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
    { label: 'Groups & Depts', path: '/groups', icon: Layers },
    { label: 'User & Access Rights', path: '/users', icon: Users, roleRequired: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'Dynamic Roles', path: '/roles', icon: Shield, roleRequired: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'Form Builder', path: '/form-builder', icon: Sliders, roleRequired: ['SUPER_ADMIN', 'ADMIN', 'MANAGER'] },
    { label: 'Audit Timeline', path: '/audit-logs', icon: History },
    { label: 'My DP Profile', path: '/profile', icon: UserIcon },
  ];

  return (
    <div className="min-h-screen bg-slate-100 text-slate-900 dark:bg-[#070A11] dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Real-time Toast Banner Popup */}
      {toastNotification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-4 py-3 rounded-2xl shadow-2xl flex items-center gap-3 border border-blue-400 animate-bounce">
          <Bell className="w-5 h-5" />
          <div className="text-sm">
            <span className="font-bold">{toastNotification.ticket_number || 'Real-time Alert'}</span>: {toastNotification.message}
          </div>
          <button onClick={() => dispatch(clearToast())} className="hover:opacity-80">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Global Search Modal */}
      <GlobalSearchModal />

      {/* Notification Drawer */}
      <NotificationDrawer isOpen={isNotificationOpen} onClose={() => setIsNotificationOpen(false)} />

      {/* Top Navigation Bar */}
      <header className="h-16 bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800/80 px-3 sm:px-4 flex items-center justify-between sticky top-0 z-40 transition-colors duration-200">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            aria-label="Toggle navigation menu"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex items-center gap-2 font-black text-lg sm:text-xl tracking-tight text-slate-900 dark:text-white font-heading">
            <Layers className="w-6 h-6 sm:w-7 sm:h-7 text-blue-500 flex-shrink-0" />
            <span>
              TRACKING<span className="text-blue-500 font-light">HUB</span>
            </span>
          </div>


        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-1.5 sm:gap-3">
          {/* Desktop Search Trigger */}
          <button
            onClick={() => dispatch(setIsSearchModalOpen(true))}
            className="hidden md:flex items-center gap-3 bg-slate-100 dark:bg-slate-950 hover:bg-slate-200 dark:hover:bg-slate-800/80 border border-slate-300 dark:border-slate-800/80 px-3.5 py-1.5 rounded-xl text-xs text-slate-600 dark:text-slate-400 font-medium transition-all"
          >
            <Search className="w-4 h-4 text-blue-500 dark:text-blue-400" />
            <span>Search tickets, comments, users...</span>
            <kbd className="bg-slate-200 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-mono text-[10px] px-1.5 py-0.5 rounded-md border border-slate-300 dark:border-slate-700">
              Ctrl K
            </kbd>
          </button>

          {/* Mobile Search Icon Trigger */}
          <button
            onClick={() => dispatch(setIsSearchModalOpen(true))}
            className="md:hidden p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
            title="Search"
          >
            <Search className="w-4 h-4 text-blue-500 dark:text-blue-400" />
          </button>

          {/* Dark / Light Toggle */}
          <button
            onClick={() => dispatch(toggleTheme())}
            className="p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
            title="Toggle theme"
          >
            {mode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-600" />}
          </button>

          {/* Notification Bell */}
          <button
            onClick={() => setIsNotificationOpen(true)}
            className="relative p-2 rounded-xl bg-slate-200/60 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer transition-colors"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </button>

          {/* User Profile */}
          <div className="flex items-center gap-2 sm:gap-3 border-l border-slate-300 dark:border-slate-800 pl-2 sm:pl-3">
            <Link
              to="/profile"
              className="flex items-center gap-2.5 px-3 py-1.5 rounded-2xl bg-slate-100/80 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-800 transition-all cursor-pointer shadow-sm group"
              title="View & Edit My DP Profile"
            >
              {/* Dynamic DP Avatar */}
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-600 border border-blue-400/30 overflow-hidden flex items-center justify-center font-bold text-xs text-white shadow-sm flex-shrink-0 group-hover:scale-105 transition-transform">
                {user?.avatar ? (
                  <img src={user.avatar} alt={user.username} className="w-full h-full object-cover" />
                ) : (
                  <span>{user?.first_name ? user.first_name[0].toUpperCase() : (user?.username ? user.username[0].toUpperCase() : 'U')}</span>
                )}
              </div>

              <div className="text-left leading-tight">
                <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1">
                  <span className="truncate max-w-[80px] sm:max-w-[140px]">{user?.username}</span>
                  <span className="text-[9px] font-mono text-blue-600 dark:text-blue-400 font-extrabold bg-blue-50 dark:bg-blue-500/20 px-1 py-0.5 rounded border border-blue-200 dark:border-blue-500/30 flex-shrink-0">
                    {user?.employee_id || 'TRA0001'}
                  </span>
                </div>
                <div className="text-[9px] text-slate-500 dark:text-slate-400 font-medium tracking-tight truncate max-w-[110px] hidden sm:block">
                  {user?.custom_role_details?.name || user?.role}
                </div>
              </div>
            </Link>

            {/* Desktop Header Logout Button */}
            <button
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
              className="hidden md:flex p-2 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-500 dark:text-red-400 cursor-pointer transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Mobile Backdrop Overlay */}
        {isSidebarOpen && (
          <div
            onClick={() => setIsSidebarOpen(false)}
            className="md:hidden fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm z-40 transition-opacity"
          />
        )}

        {/* Sidebar (Desktop Collapsible & Mobile Slide-over Drawer) */}
        <aside
          className={`fixed md:relative inset-y-0 left-0 z-50 md:z-auto transition-all duration-300 flex flex-col bg-white/95 dark:bg-slate-900/95 md:bg-white/80 md:dark:bg-slate-900/60 backdrop-blur-xl border-r border-slate-200 dark:border-slate-800/80 ${
            isSidebarOpen
              ? 'w-64 translate-x-0'
              : '-translate-x-full md:translate-x-0 md:w-16'
          }`}
        >
          <div className="md:hidden flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-800">
            <div className="flex items-center gap-2 font-bold text-sm text-slate-900 dark:text-white">
              <Layers className="w-5 h-5 text-blue-500" />
              <span>Navigation Menu</span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  dispatch(logout());
                  navigate('/login');
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-xs border border-red-500/20 shadow-sm cursor-pointer transition-all"
                title="Logout"
              >
                <LogOut className="w-3.5 h-3.5 text-red-500" /> Logout
              </button>
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-1.5 rounded-lg text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-200 dark:hover:bg-slate-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
            {navItems.map((item) => {
              if (item.roleRequired && user && !item.roleRequired.includes(user.role)) {
                return null;
              }
              const isActive = location.pathname.startsWith(item.path);
              const Icon = item.icon;

              return (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => {
                    if (window.innerWidth < 768) {
                      setIsSidebarOpen(false);
                    }
                  }}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isActive
                      ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-600/30'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-200/70 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                  }`}
                >
                  <Icon className="w-4 h-4 flex-shrink-0" />
                  <span className={`${!isSidebarOpen && 'md:hidden'}`}>{item.label}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer Logout Button (Mobile Only) */}
          <div className="md:hidden p-3 border-t border-slate-200 dark:border-slate-800">
            <button
              onClick={() => {
                dispatch(logout());
                navigate('/login');
              }}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 font-extrabold text-xs border border-red-500/20 hover:border-red-500/40 shadow-sm transition-all cursor-pointer group"
              title="Logout Account"
            >
              <div className="w-7 h-7 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 flex-shrink-0 group-hover:scale-110 transition-transform">
                <LogOut className="w-4 h-4" />
              </div>
              <span className={`text-xs font-extrabold ${!isSidebarOpen && 'md:hidden'}`}>
                Logout System
              </span>
            </button>
          </div>
        </aside>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 bg-slate-50 dark:bg-[#070A11] max-w-full overflow-x-hidden transition-colors duration-200">{children}</main>
      </div>
    </div>
  );
};
