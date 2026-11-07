import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import {
  Search,
  Filter,
  Download,
  Plus,
  Eye,
  RotateCcw,
  Receipt,
  CheckCircle2,
  XCircle,
  FileSpreadsheet,
} from 'lucide-react';

interface SalesViewProps {
  onOpenNewSale: () => void;
  onSelectSale: (sale: Sale) => void;
}

export const SalesView: React.FC<SalesViewProps> = ({ onOpenNewSale, onSelectSale }) => {
  const { filteredSales, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  // Filtered and searched sales
  const displayedSales = useMemo(() => {
    return filteredSales.filter((sale) => {
      const matchesStatus = statusFilter === 'all' || sale.status === statusFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        sale.saleNumber.toLowerCase().includes(term) ||
        sale.userName.toLowerCase().includes(term) ||
        sale.items.some((i) => i.productName.toLowerCase().includes(term) || i.productSku.toLowerCase().includes(term));

      return matchesStatus && matchesSearch;
    });
  }, [filteredSales, statusFilter, searchTerm]);

  // Aggregate totals
  const totals = useMemo(() => {
    const active = displayedSales.filter((s) => s.status === 'completed');
    const totalSales = active.reduce((acc, s) => acc + s.totalSale, 0);
    const totalCosts = active.reduce((acc, s) => acc + s.totalRecipeCost, 0);
    const totalProfit = totalSales - totalCosts;
    const margin = totalSales > 0 ? (totalProfit / totalSales) * 100 : 0;
    const totalQty = active.reduce((acc, s) => acc + s.totalQuantity, 0);

    return { totalSales, totalCosts, totalProfit, margin, totalQty };
  }, [displayedSales]);

  // Export to Excel / CSV
  const handleExportCSV = () => {
    if (displayedSales.length === 0) {
      addToast('info', 'Sin datos', 'No hay registros de ventas para exportar con los filtros actuales.');
      return;
    }

    const headers = [
      'N° Venta',
      'Fecha',
      'Hora',
      'Cajero',
      'Productos',
      'Cantidad Total',
      'Total Venta (B/.)',
      'Costo Receta (B/.)',
      'Utilidad Bruta (B/.)',
      'Margen Bruto (%)',
      'Estado',
      'Notas',
    ];

    const rows = displayedSales.map((s) => {
      const d = new Date(s.date);
      const datePart = d.toLocaleDateString('es-PA');
      const timePart = d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });
      const productsSummary = s.items.map((i) => `${i.quantity}x ${i.productName}`).join('; ');

      return [
        s.saleNumber,
        datePart,
        timePart,
        `"${s.userName}"`,
        `"${productsSummary}"`,
        s.totalQuantity,
        s.totalSale.toFixed(2),
        s.totalRecipeCost.toFixed(2),
        s.grossProfit.toFixed(2),
        s.grossProfitMargin.toFixed(1) + '%',
        s.status === 'completed' ? 'Completada' : 'Anulada',
        `"${s.notes || ''}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPyme_Ventas_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Archivo exportado', 'Se descargó el reporte de ventas en formato CSV compatible con Excel.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Financial Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Facturación Total</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            B/. {totals.totalSales.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#707070] mt-1">{totals.totalQty} unidades cobradas</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Costo Insumos (Recetas)</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            B/. {totals.totalCosts.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#707070] mt-1">Deducido de inventario</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Utilidad Bruta</p>
          <p className="text-2xl font-semibold text-[#0071E3] mt-1 tracking-tight">
            B/. {totals.totalProfit.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#34C759] mt-1">Margen: {totals.margin.toFixed(1)}%</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Transacciones</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            {displayedSales.length}
          </p>
          <p className="text-[11px] text-[#707070] mt-1">
            {displayedSales.filter((s) => s.status === 'cancelled').length} anuladas
          </p>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#D6D6D6]/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por N° Venta, cajero o producto..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F7] text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-hidden transition-all"
          />
        </div>

        {/* Status Filters & Actions */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          <div className="flex items-center bg-[#F5F5F7] p-1 rounded-2xl border border-[#D6D6D6]/60 text-xs">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'all'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#707070] hover:text-[#1D1D1F]'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setStatusFilter('completed')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'completed'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#707070] hover:text-[#1D1D1F]'
              }`}
            >
              Completadas
            </button>
            <button
              onClick={() => setStatusFilter('cancelled')}
              className={`px-3 py-1.5 rounded-xl font-medium transition-all ${
                statusFilter === 'cancelled'
                  ? 'bg-white text-[#1D1D1F] shadow-xs'
                  : 'text-[#707070] hover:text-[#1D1D1F]'
              }`}
            >
              Anuladas
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#D6D6D6]/80 text-xs font-semibold rounded-2xl transition-colors flex items-center gap-1.5"
            title="Exportar a Excel"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0071E3]" />
            <span className="hidden md:inline">Exportar Excel</span>
          </button>

          <button
            onClick={onOpenNewSale}
            className="px-4 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-2xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nueva venta</span>
          </button>
        </div>
      </div>

      {/* Sales Table */}
      <div className="bg-white rounded-3xl border border-[#D6D6D6]/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFC] border-b border-[#D6D6D6]/60 text-[#707070]">
              <tr>
                <th className="p-4 font-semibold">N° Venta</th>
                <th className="p-4 font-semibold">Fecha y Hora</th>
                <th className="p-4 font-semibold">Cajero</th>
                <th className="p-4 font-semibold">Productos</th>
                <th className="p-4 font-semibold text-right">Total Venta</th>
                <th className="p-4 font-semibold text-right">Costo Recetas</th>
                <th className="p-4 font-semibold text-right">Utilidad Bruta</th>
                <th className="p-4 font-semibold text-center">Estado</th>
                <th className="p-4 font-semibold text-center">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D6D6]/40">
              {displayedSales.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#86868B]">
                    No se encontraron ventas que coincidan con la búsqueda o filtro.
                  </td>
                </tr>
              ) : (
                displayedSales.map((sale) => {
                  const d = new Date(sale.date);
                  const dateStr = d.toLocaleDateString('es-PA', { day: '2-digit', month: '2-digit', year: 'numeric' });
                  const timeStr = d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });

                  return (
                    <tr
                      key={sale.id}
                      onClick={() => onSelectSale(sale)}
                      className="hover:bg-[#FAFAFC] transition-colors cursor-pointer group"
                    >
                      <td className="p-4 font-semibold text-[#1D1D1F]">{sale.saleNumber}</td>
                      <td className="p-4 text-[#707070]">
                        <span>{dateStr}</span> <span className="text-[#86868B]">· {timeStr}</span>
                      </td>
                      <td className="p-4 text-[#1D1D1F]">{sale.userName}</td>
                      <td className="p-4 max-w-xs">
                        <p className="font-medium text-[#1D1D1F] truncate">
                          {sale.items.map((i) => `${i.quantity}x ${i.productName}`).join(', ')}
                        </p>
                        <p className="text-[10px] text-[#86868B]">{sale.totalQuantity} unidades en total</p>
                      </td>
                      <td className="p-4 text-right font-semibold text-[#1D1D1F]">
                        B/. {sale.totalSale.toFixed(2)}
                      </td>
                      <td className="p-4 text-right text-[#707070]">
                        B/. {sale.totalRecipeCost.toFixed(2)}
                      </td>
                      <td className="p-4 text-right font-semibold text-[#0071E3]">
                        B/. {sale.grossProfit.toFixed(2)}
                        <span className="block text-[10px] text-[#86868B] font-normal">
                          {sale.grossProfitMargin.toFixed(1)}% margen
                        </span>
                      </td>
                      <td className="p-4 text-center">
                        {sale.status === 'completed' ? (
                          <span className="text-[#34C759] font-medium text-[11px] flex items-center justify-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Completada</span>
                          </span>
                        ) : (
                          <span className="text-[#FF3B30] font-medium text-[11px] flex items-center justify-center gap-1">
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Anulada</span>
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            onSelectSale(sale);
                          }}
                          className="px-2.5 py-1 text-xs font-semibold text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg transition-colors"
                        >
                          Ver detalle
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
