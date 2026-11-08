import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Menu, Plus, ChevronDown, Check, Users, LogOut } from 'lucide-react';
import { DateFilterType } from '../../types';

interface HeaderProps {
  onOpenMobileMenu: () => void;
  onOpenNewSale: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onOpenMobileMenu, onOpenNewSale }) => {
  const { activeTab, dateFilter, setDateFilter, users, currentUser, switchUser, logoutSession } = useApp();
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const tabTitles: Record<string, string> = {
    dashboard: 'Inicio',
    sales: 'Ventas',
    products: 'Productos y Recetas',
    inventory: 'Inventario y Mermas',
    smartai: 'SmartAI',
    settings: 'Configuración',
  };

  const filterOptions: { id: DateFilterType; label: string }[] = [
    { id: 'all', label: 'Todo' },
    { id: 'today', label: 'Hoy' },
    { id: 'last7days', label: '7 días' },
    { id: 'thisMonth', label: 'Este mes' },
  ];

  return (
    <header className="sticky top-0 z-30 bg-[#FAFAFC]/90 backdrop-blur-md border-b border-[#E5E5EA]/70 px-4 sm:px-8 py-3">
      <div className="flex items-center justify-between gap-4">
        {/* Left: Mobile Trigger & Section Title */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenMobileMenu}
            className="p-1.5 -ml-1.5 rounded-lg text-[#1D1D1F] hover:bg-black/[0.04] lg:hidden"
            aria-label="Abrir menú"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg sm:text-xl font-semibold text-[#1D1D1F] tracking-tight">
            {tabTitles[activeTab] || 'SmartPyme'}
          </h1>
        </div>

        {/* Right: Date Filter, Primary CTA & User */}
        <div className="flex items-center gap-3">
          {['dashboard', 'sales'].includes(activeTab) && (
            <div className="hidden sm:flex items-center bg-[#E5E5EA]/50 p-0.5 rounded-xl text-xs">
              {filterOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setDateFilter(opt.id)}
                  className={`px-3 py-1 rounded-lg font-medium transition-all ${
                    dateFilter === opt.id
                      ? 'bg-white text-[#1D1D1F] shadow-xs'
                      : 'text-[#707070] hover:text-[#1D1D1F]'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          )}

          {/* Quick Sale Button */}
          <button
            onClick={onOpenNewSale}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-xs transition-colors"
          >
            <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Nueva venta</span>
          </button>

          {/* User Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="flex items-center gap-2 p-1 rounded-full hover:bg-black/[0.04] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-[#E5E5EA] flex items-center justify-center font-medium text-xs text-[#1D1D1F]">
                {currentUser.name[0]}
              </div>
            </button>

            {isUserMenuOpen && (
              <>
                <div className="fixed inset-0 z-30" onClick={() => setIsUserMenuOpen(false)} />
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-lg border border-[#E5E5EA] p-2 z-40 text-xs">
                  <p className="text-[10px] uppercase font-semibold text-[#86868B] px-3 py-1.5">
                    Perfil activo
                  </p>
                  {users.map((u) => (
                    <button
                      key={u.id}
                      onClick={() => {
                        switchUser(u.id);
                        setIsUserMenuOpen(false);
                      }}
                      className={`w-full flex items-center justify-between p-2 rounded-xl text-left transition-colors ${
                        u.id === currentUser.id
                          ? 'bg-[#0071E3]/10 text-[#0071E3] font-medium'
                          : 'hover:bg-[#F5F5F7] text-[#1D1D1F]'
                      }`}
                    >
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-[10px] text-[#707070]">
                          {u.role === 'admin' ? 'Administrador' : 'Empleado'}
                        </p>
                      </div>
                      {u.id === currentUser.id && <Check className="w-3.5 h-3.5 text-[#0071E3]" />}
                    </button>
                  ))}

                  <div className="pt-2 mt-2 border-t border-[#E5E5EA]">
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logoutSession();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-medium text-[#1D1D1F] hover:bg-[#F5F5F7] transition-colors"
                    >
                      <Users className="w-3.5 h-3.5 text-[#0071E3]" />
                      <span>Cambiar de perfil (Pantalla de inicio)</span>
                    </button>
                    <button
                      onClick={() => {
                        setIsUserMenuOpen(false);
                        logoutSession();
                      }}
                      className="w-full flex items-center gap-2 p-2 rounded-xl text-left text-xs font-medium text-[#FF3B30] hover:bg-[#FF3B30]/10 transition-colors"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Cerrar sesión</span>
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
