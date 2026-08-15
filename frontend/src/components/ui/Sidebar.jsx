import React, { useState } from 'react';
import Logo from './Logo';
import Badge from './Badge';
import { 
  LayoutDashboard, Layers, ShoppingBag, Users, Settings, 
  BarChart3, LogOut, ChevronLeft, ChevronRight, Sprout, ShieldCheck, UserCheck
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

  const getRoleNavItems = () => {
    if (user?.role === 'admin') {
      return [
        { id: 'dashboard', label: 'Dashboard Overview', icon: LayoutDashboard },
        { id: 'orders', label: 'Trade Orders (OMS)', icon: ShoppingBag, badge: ordersCount },
        { id: 'inventory', label: 'Active Inventory', icon: Layers },
        { id: 'users', label: 'Approvals Pipeline', icon: Users, badge: pendingApprovalsCount },
        { id: 'pricing', label: 'Pricing Matrix', icon: Settings },
        { id: 'ledger', label: 'Revenue Ledger', icon: BarChart3 },
      ];
    } else if (user?.role === 'supplier') {
      return [
        { id: 'stocks', label: 'My Inventory', icon: Layers },
        { id: 'orders', label: 'Trade Matches', icon: ShoppingBag, badge: ordersCount },
        { id: 'add', label: 'Add Spice Batch', icon: Sprout },
      ];
    } else {
      // Buyer
      return [
        { id: 'marketplace', label: 'Spot Marketplace', icon: Layers },
        { id: 'orders', label: 'My Orders', icon: ShoppingBag, badge: ordersCount },
      ];
    }
  };

  const navItems = getRoleNavItems();

  const roleAccents = {
    admin: {
      badge: 'admin',
      border: 'border-amber-500/30',
      activeItem: 'bg-gradient-to-r from-amber-500/20 to-transparent text-amber-400 border-l-4 border-amber-400',
    },
    supplier: {
      badge: 'supplier',
      border: 'border-emerald-500/30',
      activeItem: 'bg-gradient-to-r from-emerald-500/20 to-transparent text-emerald-400 border-l-4 border-emerald-400',
    },
    buyer: {
      badge: 'buyer',
      border: 'border-cyan-500/30',
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
        <div className="px-5 py-3 border-b border-slate-800/50 bg-slate-900/40 flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">PORTAL ACCESS</span>
          <Badge variant={roleStyle.badge}>{user?.role?.toUpperCase()}</Badge>
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
              className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
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
      <div className="p-4 border-t border-slate-800/80 bg-slate-900/50 flex items-center justify-between">
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
          title="Sign Out"
        >
          <LogOut size={16} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
