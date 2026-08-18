import React, { useState } from 'react';
import { Search, Bell, ChevronRight, Clock } from 'lucide-react';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';

const Header = ({
  user,
  activeTabLabel = 'Dashboard',
  searchTerm = '',
  setSearchTerm = () => {},
  notifications = [],
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const { t } = useLanguage();

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="h-16 border-b border-slate-800/80 bg-slate-950/60 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Breadcrumbs */}
      <div className="flex items-center gap-2 text-xs font-semibold text-slate-400">
        <span className="hover:text-slate-200 cursor-pointer">{t('platformNav')}</span>
        <ChevronRight size={14} className="text-slate-600" />
        <span className="capitalize text-amber-400 font-heading">{t(user?.role + 'Role') || user?.role}</span>
        <ChevronRight size={14} className="text-slate-600" />
        <span className="text-slate-200 font-bold capitalize">{activeTabLabel}</span>
      </div>

      {/* Right Controls: Language Toggle, Search, Notifications, Profile */}
      <div className="flex items-center gap-3">
        {/* Language Switcher */}
        <LanguageToggle />

        {/* Search Bar */}
        <div className="relative hidden md:block">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            type="text"
            placeholder={t('searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-56 lg:w-64 pl-9 pr-4 py-1.5 text-xs bg-slate-900/80 border border-slate-800 rounded-xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500/50 transition-all"
          />
        </div>

        {/* Notifications Bell Dropdown */}
        <div className="relative">
          <button
            onClick={() => setShowNotifications(!showNotifications)}
            className="relative p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700 transition-all"
          >
            <Bell size={18} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-amber-500 text-[10px] font-bold text-slate-950 flex items-center justify-center animate-pulse">
                {unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Popover */}
          {showNotifications && (
            <div className="absolute right-0 mt-2 w-80 panel-glass p-4 border border-slate-700/80 shadow-2xl z-50">
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase tracking-wider text-slate-300">{t('notifications')}</span>
                <span className="text-[10px] text-amber-400 font-semibold">{notifications.length} {t('alerts')}</span>
              </div>
              <div className="py-2 space-y-2 max-h-64 overflow-y-auto">
                {notifications.length === 0 ? (
                  <p className="text-xs text-slate-500 py-3 text-center">{t('noAlerts')}</p>
                ) : (
                  notifications.map((n, idx) => (
                    <div key={idx} className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800/80 text-xs flex gap-2.5 items-start">
                      <Clock size={14} className="text-amber-400 shrink-0 mt-0.5" />
                      <div>
                        <div className="font-semibold text-slate-200">{n.title}</div>
                        <div className="text-[11px] text-slate-400 mt-0.5">{n.message}</div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Profile Chip */}
        <div className="flex items-center gap-2 pl-2 border-l border-slate-800">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400 font-bold text-xs">
            {user?.companyName?.charAt(0) || 'M'}
          </div>
          <div className="hidden lg:flex flex-col text-left">
            <span className="text-xs font-bold text-slate-200 truncate max-w-[120px]">
              {user?.companyName || 'Merchant Firm'}
            </span>
            <span className="text-[10px] text-slate-400 font-mono">
              {user?.userId || 'ADMIN'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;
