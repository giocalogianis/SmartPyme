import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  Receipt,
  Boxes,
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ArrowUpRight,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenNewSale: () => void;
  onOpenNewMovement: (type: 'COMPRA' | 'MERMA' | 'AJUSTE') => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenNewSale,
  onOpenNewMovement,
}) => {
  const {
    business,
    kpiMetrics,
    filteredSales,
    dateFilter,
    ingredients,
    products,
    alerts,
    setActiveTab,
  } = useApp();

  const filterNames: Record<string, string> = {
    today: 'hoy',
    last7days: 'los últimos 7 días',
    thisMonth: 'este mes',
    yesterday: 'ayer',
    prevMonth: 'el mes anterior',
    last30days: 'los últimos 30 días',
    custom: 'el período seleccionado',
  };

  // Top products
  const topProducts = useMemo(() => {
    const map = new Map<string, { name: string; qty: number; total: number; profit: number }>();
    filteredSales.forEach((s) => {
      if (s.status === 'completed') {
        s.items.forEach((item) => {
          const cur = map.get(item.productId) || {
            name: item.productName,
            qty: 0,
            total: 0,
            profit: 0,
          };
          cur.qty += item.quantity;
          cur.total += item.total;
          cur.profit += item.grossProfit;
          map.set(item.productId, cur);
        });
      }
    });
    return Array.from(map.values())
      .sort((a, b) => b.total - a.total)
      .slice(0, 4);
  }, [filteredSales]);

  // Clean daily trend
  const trendData = useMemo(() => {
    const map = new Map<string, { label: string; sales: number; profit: number }>();
    const sorted = [...filteredSales]
      .filter((s) => s.status === 'completed')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    if (sorted.length === 0) {
      return [
        { label: 'Lun', sales: 0, profit: 0 },
        { label: 'Mar', sales: 0, profit: 0 },
        { label: 'Mié', sales: 0, profit: 0 },
        { label: 'Jue', sales: 0, profit: 0 },
        { label: 'Vie', sales: 0, profit: 0 },
      ];
    }

    sorted.forEach((sale) => {
      const d = new Date(sale.date);
      const key = `${d.getDate()}/${d.getMonth() + 1}`;
      const cur = map.get(key) || { label: key, sales: 0, profit: 0 };
      cur.sales += sale.totalSale;
      cur.profit += sale.grossProfit;
      map.set(key, cur);
    });

    return Array.from(map.values());
  }, [filteredSales]);

  const maxVal = Math.max(...trendData.map((d) => d.sales), 10) * 1.15;

  return (
    <div className="space-y-8 pb-12 max-w-5xl mx-auto">
      {/* Calm Overview Header */}
      <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
        <div>
          <h2 className="text-2xl sm:text-3xl font-semibold tracking-tight text-[#1D1D1F]">
            Resumen de {filterNames[dateFilter] || 'operaciones'}
          </h2>
          <p className="text-xs text-[#707070] mt-1">
            {business.name} · Todas las ventas descuentan ingredientes automáticamente.
          </p>
        </div>

        <button
          onClick={() => setActiveTab('smartai')}
          className="text-xs font-semibold text-[#0071E3] hover:text-[#0077ED] flex items-center gap-1.5 self-start sm:self-auto transition-colors"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Consultar asistente SmartAI</span>
        </button>
      </div>

      {/* 4 Minimalist Primary Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* 1. Facturación */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <p className="text-xs font-medium text-[#86868B]">Ventas Registradas</p>
          <p className="text-3xl font-semibold text-[#1D1D1F] tracking-tight mt-1.5">
            B/. {kpiMetrics.salesToday.toFixed(2)}
          </p>
          <p className="text-xs text-[#707070] mt-2">
            Hoy · Mes: <span className="font-medium text-[#1D1D1F]">B/. {kpiMetrics.salesThisMonth.toFixed(2)}</span>
          </p>
        </div>

        {/* 2. Utilidad Bruta */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <p className="text-xs font-medium text-[#86868B]">Utilidad Bruta</p>
          <p className="text-3xl font-semibold text-[#0071E3] tracking-tight mt-1.5">
            B/. {kpiMetrics.grossProfit.toFixed(2)}
          </p>
          <p className="text-xs text-[#34C759] font-medium mt-2">
            Margen: {kpiMetrics.grossProfitMargin.toFixed(1)}%
          </p>
        </div>

        {/* 3. Valor de Inventario */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <p className="text-xs font-medium text-[#86868B]">Valor en Inventario</p>
          <p className="text-3xl font-semibold text-[#1D1D1F] tracking-tight mt-1.5">
            B/. {kpiMetrics.inventoryValue.toFixed(2)}
          </p>
          <p className="text-xs text-[#707070] mt-2">
            {ingredients.length} materias primas
          </p>
        </div>

        {/* 4. Estado de Stock */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <p className="text-xs font-medium text-[#86868B]">Salud de Insumos</p>
          <p
            className={`text-3xl font-semibold tracking-tight mt-1.5 ${
              kpiMetrics.lowStockCount > 0 ? 'text-[#FF9500]' : 'text-[#34C759]'
            }`}
          >
            {kpiMetrics.lowStockCount > 0
              ? `${kpiMetrics.lowStockCount} bajo stock`
              : 'En orden'}
          </p>
          <button
            onClick={() => setActiveTab('inventory')}
            className="text-xs text-[#0071E3] hover:underline mt-2 inline-block font-medium"
          >
            Revisar inventario →
          </button>
        </div>
      </div>

      {/* Main Minimalist Chart */}
      <div className="bg-white p-6 sm:p-8 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Evolución de Ingresos y Utilidad</h3>
            <p className="text-xs text-[#86868B]">Cálculo neto de materias primas por día</p>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#0071E3]" />
              <span className="text-[#1D1D1F] font-medium">Ventas</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-[#34C759]" />
              <span className="text-[#1D1D1F] font-medium">Utilidad</span>
            </div>
          </div>
        </div>

        {/* SVG Chart */}
        <div className="h-48 w-full">
          <div className="h-full flex items-end gap-3 sm:gap-8 justify-between border-b border-[#E5E5EA]">
            {trendData.map((d, index) => {
              const salesH = (d.sales / maxVal) * 100;
              const profitH = (d.profit / maxVal) * 100;

              return (
                <div key={index} className="flex-1 flex flex-col items-center h-full justify-end group relative">
                  <div className="w-full max-w-[36px] flex items-end justify-center gap-1 h-full">
                    <div
                      style={{ height: `${Math.max(salesH, 4)}%` }}
                      className="w-1/2 bg-[#0071E3] rounded-t-sm transition-all"
                    />
                    <div
                      style={{ height: `${Math.max(profitH, 4)}%` }}
                      className="w-1/2 bg-[#34C759] rounded-t-sm transition-all"
                    />
                  </div>
                  <span className="text-[11px] text-[#86868B] mt-2 font-medium">{d.label}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Two Clean Columns: Top Products & Quick Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Top Products */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[#1D1D1F]">Productos Más Vendidos</h3>
            <button
              onClick={() => setActiveTab('products')}
              className="text-xs text-[#0071E3] hover:underline font-medium"
            >
              Ver todos →
            </button>
          </div>

          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="text-xs text-[#86868B] py-6 text-center">Sin ventas en este período</p>
            ) : (
              topProducts.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-xs py-1 border-b border-[#E5E5EA]/50 last:border-0">
                  <div>
                    <p className="font-semibold text-[#1D1D1F]">{p.name}</p>
                    <p className="text-[11px] text-[#86868B]">{p.qty} unidades vendidas</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-[#1D1D1F]">B/. {p.total.toFixed(2)}</p>
                    <p className="text-[11px] text-[#34C759]">B/. {p.profit.toFixed(2)} ganancia</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Active Alerts or Calm state */}
        <div className="bg-white p-6 rounded-3xl border border-[#E5E5EA]/70 shadow-xs flex flex-col justify-between">
          <div>
            <h3 className="text-sm font-semibold text-[#1D1D1F] mb-4">Atención Operativa</h3>
            <div className="space-y-2.5">
              {alerts.length === 0 ? (
                <div className="p-6 text-center bg-[#FAFAFC] rounded-2xl">
                  <p className="text-xs font-semibold text-[#1D1D1F]">Todo en orden</p>
                  <p className="text-xs text-[#707070] mt-0.5">
                    No hay alertas de inventario ni productos con márgenes críticos.
                  </p>
                </div>
              ) : (
                alerts.slice(0, 3).map((alert) => (
                  <div
                    key={alert.id}
                    className="p-3 rounded-2xl bg-[#FAFAFC] border border-[#E5E5EA] text-xs flex items-center justify-between gap-2"
                  >
                    <div>
                      <p className="font-semibold text-[#1D1D1F]">{alert.title}</p>
                      <p className="text-[11px] text-[#707070]">{alert.message}</p>
                    </div>
                    {alert.actionLabel && (
                      <button
                        onClick={() => {
                          if (alert.tabTarget) setActiveTab(alert.tabTarget);
                        }}
                        className="text-xs font-semibold text-[#0071E3] shrink-0 hover:underline"
                      >
                        {alert.actionLabel}
                      </button>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-[#E5E5EA]/60 flex items-center justify-between text-xs text-[#86868B]">
            <span>Moneda: B/. (USD) · Panamá</span>
            <button
              onClick={onOpenNewSale}
              className="text-[#0071E3] font-semibold hover:underline"
            >
              + Registrar venta
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
