import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  TrendingUp,
  TrendingDown,
  Info,
  DollarSign,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  PieChart,
  Percent,
} from 'lucide-react';

export const CostsView: React.FC = () => {
  const { products, recipes, ingredients, sales, filteredSales, calculateRecipeCost, getRecipeForProduct } = useApp();

  // Product profitability analysis
  const profitabilityAnalysis = useMemo(() => {
    return products.map((prod) => {
      const recipe = getRecipeForProduct(prod.id);
      const recipeCost = calculateRecipeCost(recipe);
      const profitUnit = prod.sellingPrice - recipeCost;
      const marginPct = prod.sellingPrice > 0 ? (profitUnit / prod.sellingPrice) * 100 : 0;

      // Filtered sales metrics
      let unitsSold = 0;
      let totalSales = 0;
      let totalCosts = 0;
      let totalProfit = 0;

      filteredSales.forEach((sale) => {
        if (sale.status === 'completed') {
          sale.items.forEach((item) => {
            if (item.productId === prod.id) {
              unitsSold += item.quantity;
              totalSales += item.total;
              totalCosts += item.totalRecipeCost;
              totalProfit += item.grossProfit;
            }
          });
        }
      });

      return {
        product: prod,
        recipe,
        recipeCost,
        profitUnit,
        marginPct,
        unitsSold,
        totalSales,
        totalCosts,
        totalProfit,
      };
    });
  }, [products, recipes, ingredients, filteredSales, calculateRecipeCost, getRecipeForProduct]);

  // Overall financial sums
  const overallTotals = useMemo(() => {
    const totalSales = profitabilityAnalysis.reduce((acc, p) => acc + p.totalSales, 0);
    const totalCosts = profitabilityAnalysis.reduce((acc, p) => acc + p.totalCosts, 0);
    const totalProfit = totalSales - totalCosts;
    const overallMargin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;

    return { totalSales, totalCosts, totalProfit, overallMargin };
  }, [profitabilityAnalysis]);

  // Rankings
  const topProfitable = useMemo(() => {
    return [...profitabilityAnalysis].sort((a, b) => b.profitUnit - a.profitUnit);
  }, [profitabilityAnalysis]);

  const lowestMargin = useMemo(() => {
    return [...profitabilityAnalysis].sort((a, b) => a.marginPct - b.marginPct);
  }, [profitabilityAnalysis]);

  const highestRecipeCosts = useMemo(() => {
    return [...profitabilityAnalysis].sort((a, b) => b.recipeCost - a.recipeCost);
  }, [profitabilityAnalysis]);

  return (
    <div className="space-y-6 pb-12">
      {/* Financial Transparency Callout (Mandatory per Section 11 of prompt) */}
      <div className="p-5 rounded-3xl bg-white border border-[#D6D6D6]/70 shadow-xs flex items-start gap-4">
        <div className="p-2.5 rounded-2xl bg-[#0071E3]/10 text-[#0071E3] shrink-0">
          <Info className="w-5 h-5" />
        </div>
        <div className="text-xs space-y-1">
          <h3 className="font-semibold text-sm text-[#1D1D1F]">
            Criterio Contable: Utilidad Bruta vs Utilidad Neta
          </h3>
          <p className="text-[#707070] leading-relaxed">
            Los cálculos financieros presentados en esta plataforma corresponden exclusivamente a la{' '}
            <strong className="text-[#1D1D1F]">Utilidad Bruta</strong> (Precio de venta menos costo real de ingredientes según la receta activa).{' '}
            <span className="text-[#1D1D1F] font-medium">No representan utilidad neta</span>, ya que no contemplan costos fijos u operativos como alquiler del local, planilla de personal, electricidad, agua, gas comercial, impuestos ni comisiones bancarias por punto de venta.
          </p>
        </div>
      </div>

      {/* Aggregate Financial Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Facturación Período</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            B/. {overallTotals.totalSales.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#707070] mt-1">Ingresos brutos</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Costo Total Insumos</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            B/. {overallTotals.totalCosts.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#86868B] mt-1">Materias primas</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Utilidad Bruta Total</p>
          <p className="text-2xl font-semibold text-[#0071E3] mt-1 tracking-tight">
            B/. {overallTotals.totalProfit.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#34C759] mt-1">Margen global: {overallTotals.overallMargin.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Margen Bruto Promedio</p>
          <p className="text-2xl font-semibold text-[#34C759] mt-1 tracking-tight">
            {overallTotals.overallMargin.toFixed(1)}%
          </p>
          <p className="text-[11px] text-[#707070] mt-1">Objetivo cafeterías: &gt;60%</p>
        </div>
      </div>

      {/* Main Table: Complete Product Profitability Analysis */}
      <div className="bg-white rounded-3xl border border-[#D6D6D6]/70 shadow-xs overflow-hidden">
        <div className="p-5 border-b border-[#D6D6D6]/60">
          <h3 className="text-base font-semibold text-[#1D1D1F]">
            Matriz de Costeo y Rentabilidad por Producto
          </h3>
          <p className="text-xs text-[#707070] mt-0.5">
            Cálculo unitario y consolidado basado en recetas e historial de ventas
          </p>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFC] border-b border-[#D6D6D6]/60 text-[#707070]">
              <tr>
                <th className="p-4 font-semibold">SKU / Producto</th>
                <th className="p-4 font-semibold text-right">Precio Venta</th>
                <th className="p-4 font-semibold text-right">Costo Receta</th>
                <th className="p-4 font-semibold text-right">Utilidad Unitaria</th>
                <th className="p-4 font-semibold text-right">Margen Bruto (%)</th>
                <th className="p-4 font-semibold text-center">Unid. Vendidas</th>
                <th className="p-4 font-semibold text-right">Ventas Totales</th>
                <th className="p-4 font-semibold text-right">Costos Totales</th>
                <th className="p-4 font-semibold text-right">Utilidad Bruta Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D6D6]/40">
              {profitabilityAnalysis.map((item) => {
                const isLowMargin = item.marginPct < 40;

                return (
                  <tr key={item.product.id} className="hover:bg-[#FAFAFC] transition-colors">
                    <td className="p-4 font-medium text-[#1D1D1F]">
                      <div className="font-semibold">{item.product.name}</div>
                      <div className="text-[10px] text-[#86868B]">{item.product.sku} · {item.product.category}</div>
                    </td>
                    <td className="p-4 text-right font-medium text-[#1D1D1F]">
                      B/. {item.product.sellingPrice.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-[#707070]">
                      B/. {item.recipeCost.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-semibold text-[#0071E3]">
                      B/. {item.profitUnit.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-semibold">
                      <span className={isLowMargin ? 'text-[#FF9500]' : 'text-[#34C759]'}>
                        {item.marginPct.toFixed(1)}%
                      </span>
                    </td>
                    <td className="p-4 text-center font-medium text-[#1D1D1F]">
                      {item.unitsSold} u.
                    </td>
                    <td className="p-4 text-right font-semibold text-[#1D1D1F]">
                      B/. {item.totalSales.toFixed(2)}
                    </td>
                    <td className="p-4 text-right text-[#707070]">
                      B/. {item.totalCosts.toFixed(2)}
                    </td>
                    <td className="p-4 text-right font-semibold text-[#0071E3]">
                      B/. {item.totalProfit.toFixed(2)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Comparisons & Insights Columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* 1. Productos con mayor ganancia por unidad */}
        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ArrowUpRight className="w-4 h-4 text-[#34C759]" />
            <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
              Mayor Utilidad Unitaria
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            {topProfitable.slice(0, 3).map((item) => (
              <div key={item.product.id} className="p-2.5 rounded-2xl bg-[#FAFAFC] flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[#1D1D1F]">{item.product.name}</p>
                  <p className="text-[10px] text-[#707070]">Precio B/. {item.product.sellingPrice.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#0071E3]">B/. {item.profitUnit.toFixed(2)}</p>
                  <p className="text-[10px] text-[#34C759]">{item.marginPct.toFixed(1)}% margen</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Productos con menor margen */}
        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <AlertTriangle className="w-4 h-4 text-[#FF9500]" />
            <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
              Menor Margen Porcentual
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            {lowestMargin.slice(0, 3).map((item) => (
              <div key={item.product.id} className="p-2.5 rounded-2xl bg-[#FAFAFC] flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[#1D1D1F]">{item.product.name}</p>
                  <p className="text-[10px] text-[#707070]">Costo B/. {item.recipeCost.toFixed(2)}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#FF9500]">{item.marginPct.toFixed(1)}%</p>
                  <p className="text-[10px] text-[#707070]">Ganancia: B/. {item.profitUnit.toFixed(2)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 3. Insumos y recetas de mayor costo */}
        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <ArrowDownRight className="w-4 h-4 text-[#86868B]" />
            <h4 className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
              Mayor Costo de Receta
            </h4>
          </div>
          <div className="space-y-2.5 text-xs">
            {highestRecipeCosts.slice(0, 3).map((item) => (
              <div key={item.product.id} className="p-2.5 rounded-2xl bg-[#FAFAFC] flex justify-between items-center">
                <div>
                  <p className="font-semibold text-[#1D1D1F]">{item.product.name}</p>
                  <p className="text-[10px] text-[#707070]">{item.recipe?.items.length || 0} materias primas</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[#1D1D1F]">B/. {item.recipeCost.toFixed(2)}</p>
                  <p className="text-[10px] text-[#86868B]">por porción</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
