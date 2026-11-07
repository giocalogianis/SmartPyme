import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Recipe, RecipeItem } from '../../types';
import { X, Plus, Trash2, DollarSign, Calculator, AlertCircle, Info } from 'lucide-react';

interface RecipeEditorModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
}

export const RecipeEditorModal: React.FC<RecipeEditorModalProps> = ({
  isOpen,
  onClose,
  productId,
}) => {
  const { products, ingredients, getRecipeForProduct, saveRecipe } = useApp();

  const product = products.find((p) => p.id === productId);
  const existingRecipe = product ? getRecipeForProduct(product.id) : undefined;

  const [recipeName, setRecipeName] = useState('');
  const [items, setItems] = useState<RecipeItem[]>([]);
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (existingRecipe) {
      setRecipeName(existingRecipe.name);
      setItems([...existingRecipe.items]);
      setNotes(existingRecipe.notes || '');
    } else if (product) {
      setRecipeName(`Receta estándar ${product.name}`);
      setItems([
        { ingredientId: ingredients[0]?.id || '', quantity: 1 },
      ]);
      setNotes('');
    }
    setError('');
  }, [existingRecipe, product, isOpen, ingredients]);

  // Compute total recipe cost in real-time
  const costBreakdown = useMemo(() => {
    let total = 0;
    const details = items.map((item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      const unitCost = ing ? ing.unitCost : 0;
      const subtotal = item.quantity * unitCost;
      total += subtotal;
      return {
        ...item,
        ingName: ing ? ing.name : 'Insumo no encontrado',
        unit: ing ? ing.unit : '',
        unitCost,
        subtotal,
      };
    });

    const sellingPrice = product?.sellingPrice || 0;
    const profit = sellingPrice - total;
    const margin = sellingPrice > 0 ? (profit / sellingPrice) * 100 : 0;

    return { total, details, sellingPrice, profit, margin };
  }, [items, ingredients, product]);

  if (!isOpen || !product) return null;

  const handleAddItem = () => {
    setItems([...items, { ingredientId: ingredients[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (items.length > 1) {
      setItems(items.filter((_, i) => i !== index));
    }
  };

  const handleUpdateItem = (index: number, ingredientId: string, quantity: number) => {
    const updated = [...items];
    updated[index] = { ingredientId, quantity: Math.max(0.01, quantity) };
    setItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recipeName.trim()) {
      setError('El nombre de la receta es requerido');
      return;
    }
    if (items.length === 0) {
      setError('La receta debe contener al menos un ingrediente');
      return;
    }

    saveRecipe(product.id, recipeName, items, notes);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto border border-[#D6D6D6] shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D6]/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-[#1D1D1F]">
                {existingRecipe ? `Editar Receta (v${existingRecipe.version + 1})` : 'Diseñar Receta'}
              </h2>
              <span className="text-[10px] font-semibold text-[#0071E3] bg-[#0071E3]/10 px-2 py-0.5 rounded-full">
                {product.name}
              </span>
            </div>
            <p className="text-xs text-[#707070] mt-0.5">
              Conexión directa entre el producto y las deducciones de materias primas.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-5 space-y-5">
          {error && (
            <div className="p-3 bg-[#FF3B30]/10 border border-[#FF3B30]/20 rounded-xl text-xs text-[#D70015]">
              {error}
            </div>
          )}

          {/* Recipe Name */}
          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
              Nombre descriptivo de la receta
            </label>
            <input
              type="text"
              required
              value={recipeName}
              onChange={(e) => setRecipeName(e.target.value)}
              className="w-full bg-[#F5F5F7] text-xs font-medium p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
            />
          </div>

          {/* Ingredient List Items */}
          <div className="space-y-2.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
                Ingredientes y Porciones
              </label>
              <span className="text-[11px] text-[#707070]">
                {items.length} insumos requeridos por porción
              </span>
            </div>

            <div className="space-y-2">
              {costBreakdown.details.map((detail, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F5F5F7] border border-[#D6D6D6]/60"
                >
                  {/* Select Ingredient */}
                  <div className="flex-1">
                    <select
                      value={detail.ingredientId}
                      onChange={(e) => handleUpdateItem(index, e.target.value, detail.quantity)}
                      className="w-full bg-white text-xs font-medium text-[#1D1D1F] p-2 rounded-xl border border-[#D6D6D6]/80 focus:outline-hidden"
                    >
                      {ingredients.map((ing) => (
                        <option key={ing.id} value={ing.id}>
                          {ing.sku} - {ing.name} ({ing.unit}) · B/. {ing.unitCost.toFixed(4)}/{ing.unit}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Quantity Input */}
                  <div className="w-24 flex items-center gap-1 bg-white px-2 py-1.5 rounded-xl border border-[#D6D6D6]/80">
                    <input
                      type="number"
                      step="any"
                      min="0.01"
                      required
                      value={detail.quantity}
                      onChange={(e) =>
                        handleUpdateItem(index, detail.ingredientId, parseFloat(e.target.value) || 0)
                      }
                      className="w-full text-xs font-semibold text-[#1D1D1F] focus:outline-hidden text-right"
                    />
                    <span className="text-[10px] text-[#86868B]">{detail.unit}</span>
                  </div>

                  {/* Cost preview */}
                  <div className="w-24 text-right pr-1">
                    <p className="text-xs font-semibold text-[#1D1D1F]">
                      B/. {detail.subtotal.toFixed(3)}
                    </p>
                    <p className="text-[10px] text-[#86868B]">Costo insumo</p>
                  </div>

                  {items.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-1.5 text-[#86868B] hover:text-[#FF3B30] rounded-lg transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 rounded-2xl border border-dashed border-[#0071E3]/50 text-[#0071E3] text-xs font-semibold hover:bg-[#0071E3]/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Añadir ingrediente a la receta</span>
            </button>
          </div>

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
              Instrucciones / Notas de preparación
            </label>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Ej. Temperatura de vaporizado a 65°C, 28 segundos de extracción..."
              className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
            />
          </div>

          {/* Live Profitability Card */}
          <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#D6D6D6]/70 space-y-2">
            <div className="flex justify-between text-xs text-[#707070]">
              <span>Precio de venta del producto:</span>
              <span className="font-semibold text-[#1D1D1F]">
                B/. {costBreakdown.sellingPrice.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between text-xs text-[#707070]">
              <span>Costo calculado de la receta (Insumos):</span>
              <span className="font-semibold text-[#1D1D1F]">
                B/. {costBreakdown.total.toFixed(3)}
              </span>
            </div>
            <div className="pt-2 border-t border-[#D6D6D6]/50 flex justify-between items-baseline">
              <div>
                <p className="text-xs font-semibold text-[#1D1D1F]">Utilidad Bruta por Unidad:</p>
                <p className="text-[10px] text-[#86868B]">Precio - Costo receta</p>
              </div>
              <div className="text-right">
                <span className="text-xl font-semibold text-[#0071E3]">
                  B/. {costBreakdown.profit.toFixed(2)}
                </span>
                <span className="block text-xs font-semibold text-[#34C759]">
                  Margen: {costBreakdown.margin.toFixed(1)}%
                </span>
              </div>
            </div>
          </div>

          {/* Historical integrity reminder */}
          <div className="p-3 bg-[#0071E3]/5 border border-[#0071E3]/20 rounded-xl text-[11px] text-[#0066CC] flex items-start gap-2">
            <Info className="w-4 h-4 shrink-0 mt-0.5" />
            <span>
              <strong>Garantía de integridad contable:</strong> Guardar una nueva versión de esta receta actualizará los costos para ventas futuras. Las ventas registradas anteriormente mantendrán intacto el costo que tenían en su momento de cobro.
            </span>
          </div>

          {/* Actions */}
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
              className="px-6 py-2 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-xs"
            >
              Guardar Versión de Receta
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
