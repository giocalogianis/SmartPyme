import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import {
  FileSpreadsheet,
  Printer,
  Download,
  Calendar,
  Filter,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';

type ReportId =
  | 'daily_sales'
  | 'weekly_sales'
  | 'monthly_sales'
  | 'product_perf'
  | 'inventory_status'
  | 'movements'
  | 'purchases'
  | 'waste'
  | 'recipe_costs'
  | 'product_profit'
  | 'gross_profit'
  | 'low_stock';

interface ReportMeta {
  id: ReportId;
  title: string;
  category: 'Ventas' | 'Inventario' | 'Financiero';
  description: string;
}

export const ReportsView: React.FC = () => {
  const {
    sales,
    filteredSales,
    ingredients,
    products,
    recipes,
    movements,
    filteredMovements,
    calculateRecipeCost,
    getRecipeForProduct,
    dateFilter,
    addToast,
  } = useApp();

  const [selectedReportId, setSelectedReportId] = useState<ReportId>('daily_sales');
  const [searchTerm, setSearchTerm] = useState('');

  const reportList: ReportMeta[] = [
    { id: 'daily_sales', title: '1. Ventas Diarias', category: 'Ventas', description: 'Desglose detallado de ventas por día con recetas y utilidad.' },
    { id: 'weekly_sales', title: '2. Ventas Semanales', category: 'Ventas', description: 'Consolidado acumulado de facturación de los últimos 7 días.' },
    { id: 'monthly_sales', title: '3. Ventas Mensuales', category: 'Ventas', description: 'Comportamiento mensual de ingresos y promedio diario.' },
    { id: 'product_perf', title: '4. Rendimiento de Productos', category: 'Ventas', description: 'Unidades vendidas, recaudación y contribución por ítem.' },
    { id: 'inventory_status', title: '5. Estado de Inventario', category: 'Inventario', description: 'Existencias actuales, costos unitarios y valoración total.' },
    { id: 'movements', title: '6. Movimientos de Inventario', category: 'Inventario', description: 'Kardex completo de compras, salidas por recetas y mermas.' },
    { id: 'purchases', title: '7. Reporte de Compras', category: 'Inventario', description: 'Inversión en insumos, facturas y proveedores asociados.' },
    { id: 'waste', title: '8. Reporte de Mermas y Desperdicio', category: 'Inventario', description: 'Registro de pérdidas operativas, causas y valor económico.' },
    { id: 'recipe_costs', title: '9. Costos de Recetas', category: 'Financiero', description: 'Desglose de materias primas por porción y costo teórico.' },
    { id: 'product_profit', title: '10. Rentabilidad por Producto', category: 'Financiero', description: 'Precio vs costo de insumos y porcentaje de margen bruto.' },
    { id: 'gross_profit', title: '11. Utilidad Bruta Consolidada', category: 'Financiero', description: 'Ingresos totales menos costo de recetas en el período.' },
    { id: 'low_stock', title: '12. Reporte de Bajo Stock', category: 'Inventario', description: 'Insumos que alcanzaron su nivel mínimo para reposición.' },
  ];

  const currentMeta = reportList.find((r) => r.id === selectedReportId) || reportList[0];

  // Dynamic Data Computation based on selected report
  const reportData = useMemo(() => {
    switch (selectedReportId) {
      case 'daily_sales':
      case 'weekly_sales':
      case 'monthly_sales': {
        const list = filteredSales.filter((s) => s.status === 'completed');
        const headers = ['N° Venta', 'Fecha y Hora', 'Cajero', 'Productos', 'Total Venta', 'Costo Receta', 'Utilidad Bruta', 'Margen %'];
        const rows = list.map((s) => [
          s.saleNumber,
          new Date(s.date).toLocaleString('es-PA'),
          s.userName,
          s.items.map((i) => `${i.quantity}x ${i.productName}`).join('; '),
          `B/. ${s.totalSale.toFixed(2)}`,
          `B/. ${s.totalRecipeCost.toFixed(2)}`,
          `B/. ${s.grossProfit.toFixed(2)}`,
          `${s.grossProfitMargin.toFixed(1)}%`,
        ]);
        const summary = [
          { label: 'Total Ventas', value: `B/. ${list.reduce((acc, s) => acc + s.totalSale, 0).toFixed(2)}` },
          { label: 'Costo Insumos', value: `B/. ${list.reduce((acc, s) => acc + s.totalRecipeCost, 0).toFixed(2)}` },
          { label: 'Utilidad Bruta', value: `B/. ${list.reduce((acc, s) => acc + s.grossProfit, 0).toFixed(2)}` },
          { label: 'Órdenes', value: `${list.length}` },
        ];
        return { headers, rows, summary };
      }

      case 'product_perf': {
        const prodMap = new Map<string, { sku: string; name: string; qty: number; sales: number; profit: number }>();
        filteredSales.filter((s) => s.status === 'completed').forEach((s) => {
          s.items.forEach((item) => {
            const cur = prodMap.get(item.productId) || { sku: item.productSku, name: item.productName, qty: 0, sales: 0, profit: 0 };
            cur.qty += item.quantity;
            cur.sales += item.total;
            cur.profit += item.grossProfit;
            prodMap.set(item.productId, cur);
          });
        });
        const list = Array.from(prodMap.values()).sort((a, b) => b.sales - a.sales);
        const headers = ['SKU', 'Producto', 'Unidades Vendidas', 'Facturación Total', 'Utilidad Bruta', 'Margen %'];
        const rows = list.map((p) => [
          p.sku,
          p.name,
          `${p.qty} u.`,
          `B/. ${p.sales.toFixed(2)}`,
          `B/. ${p.profit.toFixed(2)}`,
          `${p.sales > 0 ? ((p.profit / p.sales) * 100).toFixed(1) : 0}%`,
        ]);
        const summary = [
          { label: 'Total Facturado', value: `B/. ${list.reduce((a, b) => a + b.sales, 0).toFixed(2)}` },
          { label: 'Total Unidades', value: `${list.reduce((a, b) => a + b.qty, 0)}` },
        ];
        return { headers, rows, summary };
      }

      case 'inventory_status': {
        const headers = ['SKU', 'Materia Prima', 'Categoría', 'Stock Actual', 'Stock Mínimo', 'Costo Unitario', 'Valor Total'];
        const rows = ingredients.map((i) => [
          i.sku,
          i.name,
          i.category,
          `${i.currentStock} ${i.unit}`,
          `${i.minStock} ${i.unit}`,
          `B/. ${i.unitCost.toFixed(4)}`,
          `B/. ${(i.currentStock * i.unitCost).toFixed(2)}`,
        ]);
        const totalVal = ingredients.reduce((acc, i) => acc + i.currentStock * i.unitCost, 0);
        const summary = [
          { label: 'Valorización Total Almacén', value: `B/. ${totalVal.toFixed(2)}` },
          { label: 'Total Materias Primas', value: `${ingredients.length} insumos` },
        ];
        return { headers, rows, summary };
      }

      case 'movements': {
        const headers = ['Fecha', 'Tipo', 'Materia Prima', 'Cantidad', 'Costo Unitario', 'Costo Total', 'Motivo', 'Usuario'];
        const rows = filteredMovements.map((m) => [
          new Date(m.date).toLocaleString('es-PA'),
          m.movementType,
          m.ingredientName,
          `${m.quantity > 0 ? '+' : ''}${m.quantity} ${m.unit}`,
          `B/. ${m.unitCost.toFixed(4)}`,
          `B/. ${m.totalCost.toFixed(2)}`,
          m.reason,
          m.userName,
        ]);
        const summary = [
          { label: 'Total Movimientos', value: `${filteredMovements.length}` },
          { label: 'Compras Registradas', value: `${filteredMovements.filter(m => m.movementType === 'COMPRA').length}` },
          { label: 'Mermas Registradas', value: `${filteredMovements.filter(m => m.movementType === 'MERMA').length}` },
        ];
        return { headers, rows, summary };
      }

      case 'purchases': {
        const list = filteredMovements.filter((m) => m.movementType === 'COMPRA');
        const headers = ['Fecha', 'Insumo', 'Cantidad', 'Costo Unitario', 'Inversión Total', 'Proveedor', 'Factura', 'Usuario'];
        const rows = list.map((m) => [
          new Date(m.date).toLocaleString('es-PA'),
          m.ingredientName,
          `+${m.quantity} ${m.unit}`,
          `B/. ${m.unitCost.toFixed(4)}`,
          `B/. ${m.totalCost.toFixed(2)}`,
          m.supplier || '—',
          m.reference || '—',
          m.userName,
        ]);
        const totalPurchases = list.reduce((a, b) => a + b.totalCost, 0);
        const summary = [
          { label: 'Inversión en Compras', value: `B/. ${totalPurchases.toFixed(2)}` },
          { label: 'Órdenes de Compra', value: `${list.length}` },
        ];
        return { headers, rows, summary };
      }

      case 'waste': {
        const list = filteredMovements.filter((m) => m.movementType === 'MERMA');
        const headers = ['Fecha', 'Insumo Desperdiciado', 'Cantidad', 'Costo Unitario', 'Costo Pérdida', 'Causa / Motivo', 'Responsable'];
        const rows = list.map((m) => [
          new Date(m.date).toLocaleString('es-PA'),
          m.ingredientName,
          `${m.quantity} ${m.unit}`,
          `B/. ${m.unitCost.toFixed(4)}`,
          `B/. ${m.totalCost.toFixed(2)}`,
          m.reason,
          m.userName,
        ]);
        const totalWaste = list.reduce((a, b) => a + b.totalCost, 0);
        const summary = [
          { label: 'Costo Total de Desperdicio', value: `B/. ${totalWaste.toFixed(2)}` },
          { label: 'Eventos de Merma', value: `${list.length}` },
        ];
        return { headers, rows, summary };
      }

      case 'recipe_costs': {
        const headers = ['Producto', 'Versión', 'Insumos Usados', 'Costo Total Insumos', 'Precio Venta', 'Margen Proyectado'];
        const rows = products.map((p) => {
          const rec = getRecipeForProduct(p.id);
          const cost = calculateRecipeCost(rec);
          const margin = p.sellingPrice > 0 ? ((p.sellingPrice - cost) / p.sellingPrice) * 100 : 0;
          return [
            p.name,
            rec ? `v${rec.version}` : 'Sin receta',
            rec ? `${rec.items.length} insumos` : '0',
            `B/. ${cost.toFixed(2)}`,
            `B/. ${p.sellingPrice.toFixed(2)}`,
            `${margin.toFixed(1)}%`,
          ];
        });
        const summary = [
          { label: 'Productos con Receta', value: `${products.filter(p => Boolean(getRecipeForProduct(p.id))).length} de ${products.length}` },
        ];
        return { headers, rows, summary };
      }

      case 'product_profit':
      case 'gross_profit': {
        const headers = ['Producto', 'Precio de Venta', 'Costo de Receta', 'Utilidad Unitaria', 'Margen Bruto %'];
        const rows = products.map((p) => {
          const rec = getRecipeForProduct(p.id);
          const cost = calculateRecipeCost(rec);
          const profit = p.sellingPrice - cost;
          const margin = p.sellingPrice > 0 ? (profit / p.sellingPrice) * 100 : 0;
          return [
            p.name,
            `B/. ${p.sellingPrice.toFixed(2)}`,
            `B/. ${cost.toFixed(2)}`,
            `B/. ${profit.toFixed(2)}`,
            `${margin.toFixed(1)}%`,
          ];
        });
        const summary = [
          { label: 'Criterio', value: 'Utilidad Bruta (Sin gastos fijos)' },
          { label: 'Moneda Oficial', value: 'Balboas (B/. / USD)' },
        ];
        return { headers, rows, summary };
      }

      case 'low_stock': {
        const list = ingredients.filter((i) => i.currentStock <= i.minStock);
        const headers = ['SKU', 'Materia Prima', 'Stock Actual', 'Stock Mínimo', 'Déficit para Mínimo', 'Costo Unitario', 'Proveedor'];
        const rows = list.map((i) => [
          i.sku,
          i.name,
          `${i.currentStock} ${i.unit}`,
          `${i.minStock} ${i.unit}`,
          `${(i.minStock - i.currentStock).toFixed(1)} ${i.unit}`,
          `B/. ${i.unitCost.toFixed(4)}`,
          i.supplier || '—',
        ]);
        const summary = [
          { label: 'Insumos en Alerta', value: `${list.length}` },
          { label: 'Agotados (0)', value: `${list.filter(i => i.currentStock <= 0).length}` },
        ];
        return { headers, rows, summary };
      }

      default:
        return { headers: [], rows: [], summary: [] };
    }
  }, [selectedReportId, filteredSales, filteredMovements, ingredients, products, recipes, calculateRecipeCost, getRecipeForProduct]);

  // Export CSV
  const handleExportCSV = () => {
    if (reportData.rows.length === 0) {
      addToast('info', 'Sin datos', 'No hay registros para exportar.');
      return;
    }

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [reportData.headers.join(','), ...reportData.rows.map((row) => row.map(c => `"${c}"`).join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPyme_${selectedReportId}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Reporte descargado', `El informe "${currentMeta.title}" fue exportado a Excel/CSV.`);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="space-y-6 pb-12">
      {/* 12 Reports Selector Grid */}
      <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
        <div className="flex items-center justify-between pb-3 border-b border-[#D6D6D6]/50 mb-3">
          <h3 className="text-base font-semibold text-[#1D1D1F]">
            Catálogo de los 12 Reportes Oficiales
          </h3>
          <span className="text-xs text-[#707070]">Selecciona para visualizar o exportar</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2.5">
          {reportList.map((rep) => {
            const isSelected = rep.id === selectedReportId;
            return (
              <button
                key={rep.id}
                onClick={() => setSelectedReportId(rep.id)}
                className={`p-3 rounded-2xl text-left text-xs transition-all border ${
                  isSelected
                    ? 'bg-[#0071E3]/5 border-[#0071E3] text-[#0071E3] font-semibold shadow-xs'
                    : 'bg-[#FAFAFC] border-[#D6D6D6]/60 text-[#1D1D1F] hover:bg-[#F5F5F7]'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-semibold text-[#707070] uppercase">
                    {rep.category}
                  </span>
                  {isSelected && <span className="w-1.5 h-1.5 rounded-full bg-[#0071E3]" />}
                </div>
                <p className="mt-1 font-semibold truncate">{rep.title}</p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Selected Report Header and Actions */}
      <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-semibold text-[#1D1D1F]">{currentMeta.title}</h2>
          <p className="text-xs text-[#707070] mt-0.5">{currentMeta.description}</p>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold rounded-2xl border border-[#D6D6D6]/80 transition-colors flex items-center gap-1.5"
          >
            <Printer className="w-3.5 h-3.5" />
            <span>Imprimir / PDF</span>
          </button>
          <button
            onClick={handleExportCSV}
            className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-2xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Descargar en Excel</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Badges for current report */}
      {reportData.summary.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5">
          {reportData.summary.map((sum, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl border border-[#D6D6D6]/60 shadow-xs">
              <p className="text-[11px] font-medium text-[#707070]">{sum.label}</p>
              <p className="text-lg font-semibold text-[#1D1D1F] mt-0.5">{sum.value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Dynamic Report Table */}
      <div className="bg-white rounded-3xl border border-[#D6D6D6]/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFC] border-b border-[#D6D6D6]/60 text-[#707070]">
              <tr>
                {reportData.headers.map((head, i) => (
                  <th key={i} className="p-4 font-semibold">
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D6D6]/40">
              {reportData.rows.length === 0 ? (
                <tr>
                  <td colSpan={reportData.headers.length} className="p-8 text-center text-[#86868B]">
                    No se encontraron registros para este reporte en el período seleccionado.
                  </td>
                </tr>
              ) : (
                reportData.rows.map((row, rIdx) => (
                  <tr key={rIdx} className="hover:bg-[#FAFAFC] transition-colors">
                    {row.map((cell, cIdx) => (
                      <td key={cIdx} className="p-4 text-[#1D1D1F] font-medium">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
