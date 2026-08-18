import React, { useState } from 'react';
import Logo from './Logo';
import Badge from './Badge';
import LanguageToggle from './LanguageToggle';
import { useLanguage } from '../../context/LanguageContext';
import { 
  LayoutDashboard, Layers, ShoppingBag, Users, Settings, 
  BarChart3, LogOut, ChevronLeft, ChevronRight, Sprout
} from 'lucide-react';

const Sidebar = ({
  activeTab,
  setActiveTab,
  user,
  logout,
  pendingApprovalsCount = 0,
  ordersCount = 0,
}) => {
  const [collapsed, setCollapsed] = useState(false);
  const { t } = useLanguage();

  const getRoleNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', label: t('dashboardOverview'), icon: LayoutDashboard },
        { id: 'orders', label: t('tradeOrdersOms'), icon: ShoppingBag, badge: ordersCount },
        { id: 'inventory', label: t('activeInventory'), icon: Layers },
        { id: 'users', label: t('approvalsPipeline'), icon: Users, badge: pendingApprovalsCount },
        { id: 'pricing', label: t('pricingMatrix'), icon: Settings },
        { id: 'ledger', label: t('revenueLedger'), icon: BarChart3 },
      ];
    } else if (user?.role === 'supplier') {
      return [
        { id: 'stocks', label: t('myInventory'), icon: Layers },
        { id: 'orders', label: t('tradeMatches'), icon: ShoppingBag, badge: ordersCount },
        { id: 'add', label: t('addSpiceBatch'), icon: Sprout },
      ];
    } else {
      // Buyer
      return [
        { id: 'marketplace', label: t('spotMarketplace'), icon: Layers },
        { id: 'orders', label: t('myOrders'), icon: ShoppingBag, badge: ordersCount },
      ];
    }
  };

  const navItems = getRoleNavItems();

  const roleAccents = {
    admin: {
      badge: 'admin',
      activeItem: 'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-400 border-l-4 border-amber-400',
    },
    supplier: {
      badge: 'supplier',
      activeItem: 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border-l-4 border-emerald-400',
    },
    buyer: {
      badge: 'buyer',
      activeItem: 'bg-gradient-to-r from-cyan-500/20 to-transparent text-cyan-300 border-l-4 border-cyan-400',
    },
  };

  const roleStyle = roleAccents[user?.role] || roleAccents.admin;

  return (
    <aside className={`h-screen sticky top-0 bg-slate-950/90 backdrop-blur-xl border-r border-slate-800/80 flex flex-col justify-between transition-all duration-300 z-40 shrink-0 ${
      collapsed ? 'w-20' : 'w-64'
    }`}>
      {/* Top Header & Logo */}
      <div className="p-5 border-b border-slate-800/80 flex items-center justify-between">
        {!collapsed ? (
          <Logo size="small" />
        ) : (
          <div className="p-2 rounded-xl bg-amber-500/20 border border-amber-500/30 text-amber-400 mx-auto">
            <Sprout size={20} />
          </div>
        )}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="hidden md:flex p-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-400 hover:text-white hover:border-slate-700"
          title={collapsed ? "Expand Sidebar" : "Collapse Sidebar"}
        >
          {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
        </button>
      </div>

      {/* Role Indicator Banner */}
      {!collapsed && (
        <div className="px-4 py-3 border-b border-slate-800/50 bg-slate-900/40 flex items-center justify-between">
          <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">{t('portalAccess')}</span>
          <Badge variant={roleStyle.badge}>{t(user?.role + 'Role') || user?.role?.toUpperCase()}</Badge>
        </div>
      )}

      {/* Navigation Link List */}
      <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs sm:text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? roleStyle.activeItem
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
              } ${collapsed ? 'justify-center px-0' : ''}`}
              title={collapsed ? item.label : ''}
            >
              <Icon size={18} className={isActive ? 'text-current' : 'text-slate-400'} />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge > 0 && (
                <span className="ml-auto px-2 py-0.5 text-xs font-bold rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* User Profile & Logout Bottom Bar */}
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 space-y-3">
        {!collapsed && (
          <div className="flex justify-center">
            <LanguageToggle />
          </div>
        )}
        <div className="flex items-center justify-between">
          {!collapsed ? (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500/20 to-emerald-500/20 border border-amber-500/40 flex items-center justify-center font-bold text-amber-300 shrink-0">
                {user?.companyName?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <div className="flex flex-col truncate">
                <span className="text-xs font-bold text-slate-200 truncate">
                  {user?.companyName || user?.email}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">
                  {user?.userId || 'ID: PENDING'}
                </span>
              </div>
            </div>
          ) : null}

          <button
            onClick={logout}
            className={`p-2.5 rounded-xl bg-slate-900 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-slate-800 hover:border-red-500/30 transition-all ${
              collapsed ? 'mx-auto' : ''
            }`}
            title={t('signOut')}
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;
