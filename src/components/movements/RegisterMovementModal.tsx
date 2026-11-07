import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { MovementType } from '../../types';
import { X, Boxes, AlertTriangle, SlidersHorizontal } from 'lucide-react';

interface RegisterMovementModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialType?: MovementType;
  prefillIngredientId?: string;
}

export const RegisterMovementModal: React.FC<RegisterMovementModalProps> = ({
  isOpen,
  onClose,
  initialType = 'COMPRA',
  prefillIngredientId,
}) => {
  const { ingredients, addMovement, currentUser } = useApp();

  const [movementType, setMovementType] = useState<MovementType>(initialType);
  const [ingredientId, setIngredientId] = useState(prefillIngredientId || ingredients[0]?.id || '');
  const [quantity, setQuantity] = useState('100');
  const [unitCost, setUnitCost] = useState('');
  const [reason, setReason] = useState('Compra a proveedor');
  const [supplier, setSupplier] = useState('');
  const [reference, setReference] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  const selectedIngredient = ingredients.find((i) => i.id === ingredientId);

  useEffect(() => {
    setMovementType(initialType);
    if (prefillIngredientId) {
      setIngredientId(prefillIngredientId);
    } else if (ingredients[0]) {
      setIngredientId(ingredients[0].id);
    }

    if (initialType === 'COMPRA') {
      setReason('Compra a proveedor');
    } else if (initialType === 'MERMA') {
      setReason('Derrame o desperdicio');
    } else {
      setReason('Diferencia de inventario');
    }
  }, [initialType, prefillIngredientId, ingredients, isOpen]);

  useEffect(() => {
    if (selectedIngredient && !unitCost) {
      setUnitCost(selectedIngredient.unitCost.toString());
    }
  }, [selectedIngredient]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const qtyNum = parseFloat(quantity);
    if (isNaN(qtyNum) || qtyNum === 0) {
      setError('La cantidad debe ser un número diferente de cero');
      return;
    }

    const costNum = unitCost ? parseFloat(unitCost) : selectedIngredient?.unitCost || 0;

    const res = addMovement({
      ingredientId,
      movementType,
      quantity: Math.abs(qtyNum),
      unitCost: costNum,
      reason,
      supplier,
      reference,
      notes,
    });

    if (res.success) {
      onClose();
      setError('');
    } else {
      setError(res.error || 'Error al guardar movimiento');
    }
  };

  const reasonsWaste = [
    'Derrame o desperdicio',
    'Producto dañado',
    'Producto vencido',
    'Error en preparación',
    'Contaminación cruzada',
    'Otro',
  ];

  const reasonsAdjust = [
    'Diferencia de inventario (Conteo físico)',
    'Corrección de registro',
    'Ajuste por calibración de molino',
    'Muestra o degustación',
    'Otro',
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#D6D6D6] shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D6]/60">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">Registrar Movimiento de Inventario</h2>
            <p className="text-xs text-[#707070] mt-0.5">Control auditado de entradas y salidas de insumos</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          {error && (
            <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-xs text-[#D70015]">
              {error}
            </div>
          )}

          {/* Movement Type Tabs */}
          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1.5">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-3 gap-2 p-1 bg-[#F5F5F7] rounded-2xl border border-[#D6D6D6]/60">
              <button
                type="button"
                onClick={() => {
                  setMovementType('COMPRA');
                  setReason('Compra a proveedor');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  movementType === 'COMPRA'
                    ? 'bg-white text-[#1D1D1F] shadow-xs'
                    : 'text-[#707070] hover:text-[#1D1D1F]'
                }`}
              >
                COMPRA (+)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMovementType('MERMA');
                  setReason('Derrame o desperdicio');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  movementType === 'MERMA'
                    ? 'bg-white text-[#FF9500] shadow-xs'
                    : 'text-[#707070] hover:text-[#1D1D1F]'
                }`}
              >
                MERMA (-)
              </button>
              <button
                type="button"
                onClick={() => {
                  setMovementType('AJUSTE');
                  setReason('Diferencia de inventario (Conteo físico)');
                }}
                className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                  movementType === 'AJUSTE'
                    ? 'bg-white text-[#0071E3] shadow-xs'
                    : 'text-[#707070] hover:text-[#1D1D1F]'
                }`}
              >
                AJUSTE (±)
              </button>
            </div>
          </div>

          {/* Select Ingredient */}
          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
              Materia Prima / Ingrediente
            </label>
            <select
              value={ingredientId}
              onChange={(e) => {
                setIngredientId(e.target.value);
                const found = ingredients.find((i) => i.id === e.target.value);
                if (found) setUnitCost(found.unitCost.toString());
              }}
              className="w-full bg-[#F5F5F7] text-xs font-medium p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
            >
              {ingredients.map((ing) => (
                <option key={ing.id} value={ing.id}>
                  {ing.sku} - {ing.name} (Stock actual: {ing.currentStock} {ing.unit})
                </option>
              ))}
            </select>
          </div>

          {/* Quantity & Unit Cost */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Cantidad a {movementType === 'COMPRA' ? 'sumar' : movementType === 'MERMA' ? 'restar' : 'ajustar'}
              </label>
              <div className="flex items-center gap-1 bg-[#F5F5F7] px-3 py-2 rounded-xl border border-[#D6D6D6]/80">
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  className="w-full bg-transparent text-xs font-semibold text-[#1D1D1F] focus:outline-hidden"
                />
                <span className="text-[11px] text-[#86868B]">{selectedIngredient?.unit}</span>
              </div>
            </div>

            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Costo Unitario (B/.)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.025"
                className="w-full bg-[#F5F5F7] text-xs font-semibold p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          {/* Reason */}
          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
              Motivo del Movimiento
            </label>
            {movementType === 'COMPRA' ? (
              <input
                type="text"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            ) : movementType === 'MERMA' ? (
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              >
                {reasonsWaste.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            ) : (
              <select
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              >
                {reasonsAdjust.map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Supplier & Reference (primarily for COMPRA) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Proveedor (opcional)
              </label>
              <input
                type="text"
                placeholder="Ej. Estrella Azul"
                value={supplier}
                onChange={(e) => setSupplier(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                N° Factura / Referencia
              </label>
              <input
                type="text"
                placeholder="FAC-00192"
                value={reference}
                onChange={(e) => setReference(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Notas u observaciones</label>
            <input
              type="text"
              placeholder="Detalles sobre empaque, caducidad o causa..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
            />
          </div>

          {/* Financial Impact */}
          <div className="p-3 bg-[#FAFAFC] rounded-2xl border border-[#D6D6D6]/60 flex justify-between items-center text-xs">
            <span className="text-[#707070]">Impacto económico estimado:</span>
            <span className="font-semibold text-[#1D1D1F]">
              B/. {((parseFloat(quantity) || 0) * (parseFloat(unitCost) || 0)).toFixed(2)}
            </span>
          </div>

          <div className="flex items-center justify-end gap-3 pt-3 border-t border-[#D6D6D6]/60">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-xl text-xs font-medium text-[#707070] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Confirmar Movimiento
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
