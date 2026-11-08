import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  LayoutDashboard,
  Receipt,
  Package,
  Boxes,
  Sparkles,
  Settings,
  ChevronRight,
  Store,
  LogOut,
} from 'lucide-react';

interface SidebarProps {
  isMobileOpen: boolean;
  setIsMobileOpen: (open: boolean) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ isMobileOpen, setIsMobileOpen }) => {
  const { activeTab, setActiveTab, business, currentUser, alerts, logoutSession } = useApp();

  // Simplified to 6 essential, non-redundant sections
  const navItems = [
    { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
    { id: 'sales', label: 'Ventas', icon: Receipt },
    { id: 'products', label: 'Productos y Recetas', icon: Package },
    {
      id: 'inventory',
      label: 'Inventario y Mermas',
      icon: Boxes,
      badgeCount: alerts.filter((a) => a.type === 'critical' || a.type === 'warning').length,
    },
    { id: 'smartai', label: 'SmartAI', icon: Sparkles, isAi: true },
    { id: 'settings', label: 'Configuración', icon: Settings },
  ];

  const handleNavClick = (id: string) => {
    setActiveTab(id);
    setIsMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setIsMobileOpen(false)}
        />
      )}

      {/* Sidebar container */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-[#FAFAFC] border-r border-[#E5E5EA] flex flex-col transition-transform duration-200 ease-out lg:translate-x-0 ${
          isMobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* Brand Header */}
        <div className="p-6 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1D1D1F] flex items-center justify-center text-white font-semibold text-sm">
              S
            </div>
            <div>
              <span className="font-semibold text-sm tracking-tight text-[#1D1D1F]">SmartPyme</span>
              <p className="text-[11px] text-[#86868B] truncate leading-none mt-0.5">{business.name}</p>
            </div>
          </div>
        </div>

        {/* Navigation list */}
        <nav className="flex-1 px-3 py-3 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;

            return (
              <button
                key={item.id}
                onClick={() => handleNavClick(item.id)}
                className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13px] font-medium transition-all group ${
                  isActive
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#707070] hover:text-[#1D1D1F] hover:bg-black/[0.03]'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Icon
                    className={`w-4 h-4 transition-colors ${
                      isActive
                        ? 'text-[#0071E3]'
                        : item.isAi
                        ? 'text-[#0071E3]'
                        : 'text-[#86868B] group-hover:text-[#1D1D1F]'
                    }`}
                  />
                  <span className={isActive ? 'font-semibold text-[#1D1D1F]' : ''}>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {Boolean(item.badgeCount && item.badgeCount > 0) && (
                    <span className="w-2 h-2 rounded-full bg-[#FF9500]" />
                  )}
                  {item.isAi && (
                    <span className="text-[10px] font-semibold tracking-wide text-[#0071E3]">AI</span>
                  )}
                  {isActive && <ChevronRight className="w-3.5 h-3.5 text-[#86868B]" />}
                </div>
              </button>
            );
          })}
        </nav>

        {/* Minimal User indicator & Switch Profile trigger */}
        <div className="p-3 border-t border-[#E5E5EA]/70">
          <button
            onClick={() => {
              setIsMobileOpen(false);
              logoutSession();
            }}
            title="Cambiar de perfil / Cerrar turno"
            className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-black/[0.04] transition-colors group text-left"
          >
            <div className="flex items-center gap-2 truncate">
              <div className="w-7 h-7 rounded-full bg-[#E5E5EA] group-hover:bg-[#0071E3] group-hover:text-white transition-colors flex items-center justify-center font-semibold text-xs text-[#1D1D1F] shrink-0">
                {currentUser.name[0]}
              </div>
              <div className="truncate">
                <p className="truncate font-semibold text-xs text-[#1D1D1F] group-hover:text-[#0071E3] transition-colors">
                  {currentUser.name}
                </p>
                <p className="text-[10px] text-[#86868B]">
                  {currentUser.role === 'admin' ? 'Administrador' : 'Empleado'}
                </p>
              </div>
            </div>
            <LogOut className="w-3.5 h-3.5 text-[#86868B] group-hover:text-[#FF3B30] transition-colors shrink-0" />
          </button>
        </div>
      </aside>
    </>
  );
};
