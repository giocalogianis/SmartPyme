import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Ingredient, MovementType } from '../../types';
import { IngredientModal } from './IngredientModal';
import { RegisterMovementModal } from '../movements/RegisterMovementModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  FileSpreadsheet,
  Boxes,
  ArrowDownLeft,
} from 'lucide-react';

interface InventoryViewProps {
  onOpenMovement?: (type: MovementType, prefillIngredientId?: string) => void;
}

export const InventoryView: React.FC<InventoryViewProps> = () => {
  const {
    ingredients,
    deleteIngredient,
    movements,
    filteredMovements,
    currentUser,
    addToast,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'stock' | 'movements'>('stock');
  const [searchTerm, setSearchTerm] = useState('');
  const [isIngredientModalOpen, setIsIngredientModalOpen] = useState(false);
  const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

  // Movement modal
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false);
  const [movementType, setMovementType] = useState<MovementType>('COMPRA');
  const [movementPrefillId, setMovementPrefillId] = useState<string | undefined>(undefined);

  const displayedIngredients = useMemo(() => {
    return ingredients.filter((ing) => {
      const term = searchTerm.toLowerCase();
      return (
        ing.name.toLowerCase().includes(term) ||
        ing.sku.toLowerCase().includes(term) ||
        ing.category.toLowerCase().includes(term)
      );
    });
  }, [ingredients, searchTerm]);

  const displayedMovements = useMemo(() => {
    return filteredMovements.filter((m) => {
      const term = searchTerm.toLowerCase();
      return (
        m.ingredientName.toLowerCase().includes(term) ||
        m.reason.toLowerCase().includes(term) ||
        m.movementType.toLowerCase().includes(term)
      );
    });
  }, [filteredMovements, searchTerm]);

  // Aggregates
  const totalValuation = useMemo(() => {
    return ingredients.reduce((acc, i) => acc + i.currentStock * i.unitCost, 0);
  }, [ingredients]);

  const lowStockCount = useMemo(() => {
    return ingredients.filter((i) => i.currentStock <= i.minStock).length;
  }, [ingredients]);

  const totalWaste = useMemo(() => {
    return movements
      .filter((m) => m.movementType === 'MERMA')
      .reduce((acc, m) => acc + m.totalCost, 0);
  }, [movements]);

  const handleOpenMovement = (type: MovementType, ingredientId?: string) => {
    setMovementType(type);
    setMovementPrefillId(ingredientId);
    setIsMovementModalOpen(true);
  };

  const handleExportCSV = () => {
    if (movements.length === 0) {
      addToast('info', 'Sin datos', 'No hay movimientos para exportar.');
      return;
    }

    const headers = ['Fecha', 'Tipo', 'Insumo', 'Cantidad', 'Unidad', 'Costo Total', 'Motivo', 'Usuario'];
    const rows = movements.map((m) => [
      new Date(m.date).toLocaleDateString('es-PA'),
      m.movementType,
      `"${m.ingredientName}"`,
      m.quantity,
      m.unit,
      m.totalCost.toFixed(2),
      `"${m.reason}"`,
      `"${m.userName}"`,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,\uFEFF' +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `SmartPyme_Inventario_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    addToast('success', 'Exportado', 'Kardex de inventario descargado con éxito.');
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <p className="text-xs font-medium text-[#86868B]">Valor Total Inventario</p>
          <p className="text-2xl font-semibold text-[#1D1D1F] tracking-tight mt-1">
            B/. {totalValuation.toFixed(2)}
          </p>
          <p className="text-xs text-[#707070] mt-1">{ingredients.length} materias primas</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <p className="text-xs font-medium text-[#86868B]">Insumos con Bajo Stock</p>
          <p className={`text-2xl font-semibold tracking-tight mt-1 ${lowStockCount > 0 ? 'text-[#FF9500]' : 'text-[#34C759]'}`}>
            {lowStockCount} ítems
          </p>
          <p className="text-xs text-[#707070] mt-1">Por debajo del mínimo</p>
        </div>

        <div className="bg-white p-5 rounded-3xl border border-[#E5E5EA]/70 shadow-xs">
          <p className="text-xs font-medium text-[#86868B]">Pérdidas por Mermas</p>
          <p className="text-2xl font-semibold text-[#FF3B30] tracking-tight mt-1">
            B/. {totalWaste.toFixed(2)}
          </p>
          <p className="text-xs text-[#707070] mt-1">Desperdicio y daño</p>
        </div>
      </div>

      {/* Controls & Sub-tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center bg-[#E5E5EA]/60 p-1 rounded-2xl w-fit text-xs">
          <button
            onClick={() => setActiveTab('stock')}
            className={`px-4 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'stock'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#707070] hover:text-[#1D1D1F]'
            }`}
          >
            Materias Primas
          </button>
          <button
            onClick={() => setActiveTab('movements')}
            className={`px-4 py-1.5 rounded-xl font-medium transition-all ${
              activeTab === 'movements'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#707070] hover:text-[#1D1D1F]'
            }`}
          >
            Historial de Movimientos
          </button>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar materia prima..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#E5E5EA] focus:outline-hidden focus:border-[#0071E3] w-48"
            />
          </div>

          {activeTab === 'stock' ? (
            <>
              <button
                onClick={() => handleOpenMovement('COMPRA')}
                className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#D6D6D6]/70 transition-colors"
              >
                + Compra
              </button>
              <button
                onClick={() => handleOpenMovement('MERMA')}
                className="px-3 py-1.5 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#FF9500] text-xs font-semibold rounded-xl border border-[#FF9500]/30 transition-colors"
              >
                + Merma
              </button>
              <button
                onClick={() => {
                  setEditingIngredient(null);
                  setIsIngredientModalOpen(true);
                }}
                className="px-3.5 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nuevo insumo</span>
              </button>
            </>
          ) : (
            <button
              onClick={handleExportCSV}
              className="px-3.5 py-1.5 bg-white hover:bg-[#F5F5F7] text-[#1D1D1F] border border-[#E5E5EA] text-xs font-semibold rounded-xl transition-colors flex items-center gap-1"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-[#0071E3]" />
              <span>Exportar</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: Materias Primas */}
      {activeTab === 'stock' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA]/70 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFC] border-b border-[#E5E5EA] text-[#707070]">
                <tr>
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold">Materia Prima</th>
                  <th className="p-4 font-semibold text-right">Stock Actual</th>
                  <th className="p-4 font-semibold text-right">Stock Mínimo</th>
                  <th className="p-4 font-semibold text-right">Costo Unitario</th>
                  <th className="p-4 font-semibold text-right">Valor Total</th>
                  <th className="p-4 font-semibold text-center">Estado</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]/60">
                {displayedIngredients.map((ing) => {
                  const isOut = ing.currentStock <= 0;
                  const isLow = ing.currentStock > 0 && ing.currentStock <= ing.minStock;

                  return (
                    <tr key={ing.id} className="hover:bg-[#FAFAFC] transition-colors">
                      <td className="p-4 font-medium text-[#707070]">{ing.sku}</td>
                      <td className="p-4">
                        <p className="font-semibold text-[#1D1D1F]">{ing.name}</p>
                        <p className="text-[11px] text-[#86868B]">{ing.category}</p>
                      </td>
                      <td className="p-4 text-right font-semibold text-[#1D1D1F]">
                        {ing.currentStock.toLocaleString('es-PA')} {ing.unit}
                      </td>
                      <td className="p-4 text-right text-[#707070]">
                        {ing.minStock} {ing.unit}
                      </td>
                      <td className="p-4 text-right text-[#707070]">
                        B/. {ing.unitCost.toFixed(4)}
                      </td>
                      <td className="p-4 text-right font-semibold text-[#1D1D1F]">
                        B/. {(ing.currentStock * ing.unitCost).toFixed(2)}
                      </td>
                      <td className="p-4 text-center">
                        {isOut ? (
                          <span className="text-[10px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-full">
                            Agotado
                          </span>
                        ) : isLow ? (
                          <span className="text-[10px] font-semibold text-[#FF9500] bg-[#FF9500]/10 px-2 py-0.5 rounded-full">
                            Bajo stock
                          </span>
                        ) : (
                          <span className="text-[10px] font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                            Normal
                          </span>
                        )}
                      </td>
                      <td className="p-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => handleOpenMovement('COMPRA', ing.id)}
                            className="px-2 py-1 text-[11px] font-medium text-[#0071E3] hover:bg-[#0071E3]/10 rounded-lg transition-colors"
                          >
                            + Compra
                          </button>
                          <button
                            onClick={() => {
                              setEditingIngredient(ing);
                              setIsIngredientModalOpen(true);
                            }}
                            className="p-1.5 text-[#707070] hover:text-[#0071E3] rounded-lg hover:bg-[#F5F5F7]"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          {currentUser.role === 'admin' && (
                            <button
                              onClick={() => {
                                if (confirm(`¿Eliminar materia prima "${ing.name}"?`)) {
                                  deleteIngredient(ing.id);
                                }
                              }}
                              className="p-1.5 text-[#86868B] hover:text-[#FF3B30] rounded-lg hover:bg-[#F5F5F7]"
                              title="Eliminar"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Movimientos Auditados */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA]/70 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFC] border-b border-[#E5E5EA] text-[#707070]">
                <tr>
                  <th className="p-4 font-semibold">Fecha</th>
                  <th className="p-4 font-semibold">Tipo</th>
                  <th className="p-4 font-semibold">Insumo</th>
                  <th className="p-4 font-semibold text-right">Cantidad</th>
                  <th className="p-4 font-semibold text-right">Total</th>
                  <th className="p-4 font-semibold">Motivo</th>
                  <th className="p-4 font-semibold">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]/60">
                {displayedMovements.map((m) => {
                  const isPositive = m.quantity > 0;
                  return (
                    <tr key={m.id} className="hover:bg-[#FAFAFC] transition-colors">
                      <td className="p-4 text-[#707070]">
                        {new Date(m.date).toLocaleDateString('es-PA')}
                      </td>
                      <td className="p-4">
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            m.movementType === 'COMPRA'
                              ? 'bg-[#34C759]/10 text-[#34C759]'
                              : m.movementType === 'MERMA'
                              ? 'bg-[#FF3B30]/10 text-[#FF3B30]'
                              : 'bg-[#0071E3]/10 text-[#0071E3]'
                          }`}
                        >
                          {m.movementType}
                        </span>
                      </td>
                      <td className="p-4 font-semibold text-[#1D1D1F]">{m.ingredientName}</td>
                      <td className="p-4 text-right font-medium">
                        <span className={isPositive ? 'text-[#34C759]' : 'text-[#FF3B30]'}>
                          {isPositive ? `+${m.quantity}` : m.quantity} {m.unit}
                        </span>
                      </td>
                      <td className="p-4 text-right font-semibold text-[#1D1D1F]">
                        B/. {m.totalCost.toFixed(2)}
                      </td>
                      <td className="p-4 text-[#707070] max-w-xs truncate">{m.reason}</td>
                      <td className="p-4 text-[#707070]">{m.userName}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modals */}
      <IngredientModal
        isOpen={isIngredientModalOpen}
        onClose={() => setIsIngredientModalOpen(false)}
        ingredientToEdit={editingIngredient}
      />

      <RegisterMovementModal
        isOpen={isMovementModalOpen}
        onClose={() => {
          setIsMovementModalOpen(false);
          setMovementPrefillId(undefined);
        }}
        initialType={movementType}
        prefillIngredientId={movementPrefillId}
      />
    </div>
  );
};
