import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Sidebar } from './components/common/Sidebar';
import { Header } from './components/common/Header';
import { ToastContainer } from './components/common/ToastContainer';
import { DashboardView } from './components/dashboard/DashboardView';
import { SalesView } from './components/sales/SalesView';
import { RegisterSaleModal } from './components/sales/RegisterSaleModal';
import { SaleDetailModal } from './components/sales/SaleDetailModal';
import { ProductsView } from './components/products/ProductsView';
import { InventoryView } from './components/inventory/InventoryView';
import { SmartAIView } from './components/smartai/SmartAIView';
import { SettingsView } from './components/settings/SettingsView';
import { MovementType, Sale } from './types';

function MainLayout() {
  const { activeTab } = useApp();

  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isNewSaleOpen, setIsNewSaleOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);

  return (
    <div className="min-h-screen bg-[#FAFAFC] text-[#1D1D1F] flex">
      {/* Streamlined Minimal Sidebar */}
      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        setIsMobileOpen={setIsMobileMenuOpen}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-w-0">
        <Header
          onOpenMobileMenu={() => setIsMobileMenuOpen(true)}
          onOpenNewSale={() => setIsNewSaleOpen(true)}
        />

        <main className="flex-1 p-4 sm:p-8 max-w-6xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onOpenNewMovement={() => {}}
            />
          )}

          {activeTab === 'sales' && (
            <SalesView
              onOpenNewSale={() => setIsNewSaleOpen(true)}
              onSelectSale={(sale) => setSelectedSale(sale)}
            />
          )}

          {activeTab === 'products' && <ProductsView />}

          {activeTab === 'inventory' && <InventoryView />}

          {activeTab === 'smartai' && <SmartAIView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Global Modals */}
      <RegisterSaleModal
        isOpen={isNewSaleOpen}
        onClose={() => setIsNewSaleOpen(false)}
      />

      <SaleDetailModal
        sale={selectedSale}
        onClose={() => setSelectedSale(null)}
      />

      {/* Toast Notifications */}
      <ToastContainer />
    </div>
  );
}

export default function App() {
  return (
    <AppProvider>
      <MainLayout />
    </AppProvider>
  );
}
