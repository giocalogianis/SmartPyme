import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { MovementType, InventoryMovement } from '../../types';
import { RegisterMovementModal } from './RegisterMovementModal';
import {
  Search,
  Plus,
  ArrowDownLeft,
  ArrowUpRight,
  AlertTriangle,
  Boxes,
  FileSpreadsheet,
  Calendar,
  Layers,
} from 'lucide-react';

interface MovementsViewProps {
  initialModalType?: MovementType;
  prefillIngredientId?: string;
}

export const MovementsView: React.FC<MovementsViewProps> = ({
  initialModalType = 'COMPRA',
  prefillIngredientId,
}) => {
  const { filteredMovements, ingredients, addToast } = useApp();

  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | MovementType>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalType, setModalType] = useState<MovementType>(initialModalType);

  // Filtered movements
  const displayedMovements = useMemo(() => {
    return filteredMovements.filter((m) => {
      const matchesType = typeFilter === 'all' || m.movementType === typeFilter;
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        m.ingredientName.toLowerCase().includes(term) ||
        m.reason.toLowerCase().includes(term) ||
        (m.supplier && m.supplier.toLowerCase().includes(term)) ||
        (m.reference && m.reference.toLowerCase().includes(term)) ||
        m.userName.toLowerCase().includes(term);

      return matchesType && matchesSearch;
    });
  }, [filteredMovements, typeFilter, searchTerm]);

  // Financial aggregates
  const aggregates = useMemo(() => {
    const compras = displayedMovements.filter((m) => m.movementType === 'COMPRA');
    const mermas = displayedMovements.filter((m) => m.movementType === 'MERMA');
    const consumos = displayedMovements.filter((m) => m.movementType === 'CONSUMO_VENTA');

    const totalCompras = compras.reduce((acc, m) => acc + m.totalCost, 0);
    const totalMermas = mermas.reduce((acc, m) => acc + m.totalCost, 0);
    const totalConsumos = consumos.reduce((acc, m) => acc + m.totalCost, 0);

    return { totalCompras, totalMermas, totalConsumos, count: displayedMovements.length };
  }, [displayedMovements]);

  const handleOpenModal = (type: MovementType) => {
    setModalType(type);
    setIsModalOpen(true);
  };

  const handleExportCSV = () => {
    if (displayedMovements.length === 0) {
      addToast('info', 'Sin registros', 'No hay movimientos para exportar con los filtros seleccionados.');
      return;
    }

    const headers = [
      'Fecha',
      'Hora',
      'Ingrediente',
      'Tipo Movimiento',
      'Cantidad',
      'Unidad',
      'Costo Unitario (B/.)',
      'Costo Total (B/.)',
      'Motivo',
      'Referencia / Factura',
      'Proveedor',
      'Usuario',
    ];

    const rows = displayedMovements.map((m) => {
      const d = new Date(m.date);
      const datePart = d.toLocaleDateString('es-PA');
      const timePart = d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' });

      return [
        datePart,
        timePart,
        `"${m.ingredientName}"`,
        m.movementType,
        m.quantity,
        m.unit,
        m.unitCost.toFixed(4),
        m.totalCost.toFixed(2),
        `"${m.reason}"`,
        `"${m.reference || ''}"`,
        `"${m.supplier || ''}"`,
        `"${m.userName}"`,
      ];
    });

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPyme_Movimientos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Archivo exportado', 'Historial de movimientos descargado en CSV compatible con Excel.');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Aggregates Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Total Compras Insumos</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            B/. {aggregates.totalCompras.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#34C759] mt-1">Ingreso a almacén</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Costo Total Mermas / Desperdicio</p>
          <p className="text-2xl font-semibold text-[#FF3B30] mt-1 tracking-tight">
            B/. {aggregates.totalMermas.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#FF9500] mt-1">Pérdida operativa</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Consumo por Ventas</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            B/. {aggregates.totalConsumos.toFixed(2)}
          </p>
          <p className="text-[11px] text-[#707070] mt-1">Deducido por recetas</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#D6D6D6]/70 shadow-xs">
          <p className="text-[11px] font-medium text-[#707070]">Movimientos Auditados</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] mt-1 tracking-tight">
            {aggregates.count}
          </p>
          <p className="text-[11px] text-[#707070] mt-1">Trazabilidad 100%</p>
        </div>
      </div>

      {/* Filter and Actions Bar */}
      <div className="bg-white p-4 rounded-3xl border border-[#D6D6D6]/70 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
        {/* Search Input */}
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 text-[#86868B] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por ingrediente, factura, motivo..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-[#F5F5F7] text-xs pl-9 pr-4 py-2.5 rounded-2xl border border-transparent focus:border-[#0071E3] focus:bg-white focus:outline-hidden transition-all"
          />
        </div>

        {/* Action CTAs */}
        <div className="flex items-center gap-2 w-full sm:w-auto justify-between sm:justify-end flex-wrap">
          {/* Movement Type Filter */}
          <div className="flex items-center bg-[#F5F5F7] p-1 rounded-2xl border border-[#D6D6D6]/60 text-xs">
            <button
              onClick={() => setTypeFilter('all')}
              className={`px-2.5 py-1 rounded-xl font-medium ${
                typeFilter === 'all' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#707070]'
              }`}
            >
              Todos
            </button>
            <button
              onClick={() => setTypeFilter('COMPRA')}
              className={`px-2.5 py-1 rounded-xl font-medium ${
                typeFilter === 'COMPRA' ? 'bg-white text-[#1D1D1F] shadow-xs' : 'text-[#707070]'
              }`}
            >
              Compras
            </button>
            <button
              onClick={() => setTypeFilter('MERMA')}
              className={`px-2.5 py-1 rounded-xl font-medium ${
                typeFilter === 'MERMA' ? 'bg-white text-[#FF9500] shadow-xs' : 'text-[#707070]'
              }`}
            >
              Mermas
            </button>
            <button
              onClick={() => setTypeFilter('CONSUMO_VENTA')}
              className={`px-2.5 py-1 rounded-xl font-medium ${
                typeFilter === 'CONSUMO_VENTA' ? 'bg-white text-[#0071E3] shadow-xs' : 'text-[#707070]'
              }`}
            >
              Ventas
            </button>
          </div>

          <button
            onClick={handleExportCSV}
            className="px-3.5 py-2 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#D6D6D6]/80 text-xs font-semibold rounded-2xl transition-colors flex items-center gap-1.5"
            title="Exportar movimientos"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-[#0071E3]" />
            <span className="hidden md:inline">Exportar</span>
          </button>

          <button
            onClick={() => handleOpenModal('COMPRA')}
            className="px-3.5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-2xl shadow-xs transition-colors flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Compra</span>
          </button>

          <button
            onClick={() => handleOpenModal('MERMA')}
            className="px-3.5 py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#FF9500] border border-[#FF9500]/30 text-xs font-semibold rounded-2xl transition-colors flex items-center gap-1"
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>+ Merma</span>
          </button>
        </div>
      </div>

      {/* Movements Audit Table */}
      <div className="bg-white rounded-3xl border border-[#D6D6D6]/70 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAFAFC] border-b border-[#D6D6D6]/60 text-[#707070]">
              <tr>
                <th className="p-4 font-semibold">Fecha y Hora</th>
                <th className="p-4 font-semibold">Tipo</th>
                <th className="p-4 font-semibold">Materia Prima</th>
                <th className="p-4 font-semibold text-right">Cantidad</th>
                <th className="p-4 font-semibold text-right">Costo Unitario</th>
                <th className="p-4 font-semibold text-right">Costo Total</th>
                <th className="p-4 font-semibold">Motivo / Notas</th>
                <th className="p-4 font-semibold">Referencia / Proveedor</th>
                <th className="p-4 font-semibold">Registrado por</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#D6D6D6]/40">
              {displayedMovements.length === 0 ? (
                <tr>
                  <td colSpan={9} className="p-8 text-center text-[#86868B]">
                    No hay movimientos de inventario que coincidan con la búsqueda.
                  </td>
                </tr>
              ) : (
                displayedMovements.map((m) => {
                  const d = new Date(m.date);
                  const isPositive = m.quantity > 0;

                  return (
                    <tr key={m.id} className="hover:bg-[#FAFAFC] transition-colors">
                      <td className="p-4 text-[#707070]">
                        <span>{d.toLocaleDateString('es-PA')}</span>{' '}
                        <span className="text-[#86868B]">
                          · {d.toLocaleTimeString('es-PA', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            m.movementType === 'COMPRA'
                              ? 'bg-[#34C759]/10 text-[#34C759]'
                              : m.movementType === 'MERMA'
                              ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                              : m.movementType === 'CONSUMO_VENTA'
                              ? 'bg-[#0071E3]/10 text-[#0071E3]'
                              : m.movementType === 'REVERSION_VENTA'
                              ? 'bg-[#5856D6]/10 text-[#5856D6]'
                              : 'bg-[#86868B]/10 text-[#707070]'
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#1D1D1F]">{m.ingredientName}</td>
                      <td className="p-4 text-right font-semibold">
                        <span className={isPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                        </span>
                      </td>
                      <td className="p-4 text-right text-[#707070]">
                        B/. {m.unitCost.toFixed(4)} /{m.unit}
                      </td>
                      <td className="p-4 text-right font-semibold text-[#1D1D1F]">
                        B/. {m.totalCost.toFixed(2)}
                      </td>
                      <td className="p-4 max-w-xs">
                        <p className="font-medium text-[#1D1D1F]">{m.reason}</p>
                        {m.notes && <p className="text-[10px] text-[#86868B]">{m.notes}</p>}
                      </td>
                      <td className="p-4 text-[#707070]">
                        <div>{m.reference || '—'}</div>
                        {m.supplier && <div className="text-[10px] text-[#86868B]">{m.supplier}</div>}
                      </td>
                      <td className="p-4 text-[#707070]">{m.userName}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <RegisterMovementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        initialType={modalType}
        prefillIngredientId={prefillIngredientId}
      />
    </div>
  );
};
