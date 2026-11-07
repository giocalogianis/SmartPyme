import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { X, Plus, Trash2, AlertTriangle, ShieldAlert, Check } from 'lucide-react';

interface RegisterSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RegisterSaleModal: React.FC<RegisterSaleModalProps> = ({ isOpen, onClose }) => {
  const { products, registerSale, checkStockForSale, currentUser, getRecipeForProduct, calculateRecipeCost } = useApp();

  const [selectedItems, setSelectedItems] = useState<Array<{ productId: string; quantity: number }>>([
    { productId: products[0]?.id || '', quantity: 1 },
  ]);
  const [notes, setNotes] = useState('');
  const [authorizedByAdmin, setAuthorizedByAdmin] = useState(false);
  const [adminAuthPassword, setAdminAuthPassword] = useState('');
  const [authError, setAuthError] = useState('');

  // Active products only
  const activeProducts = useMemo(() => products.filter((p) => p.status === 'active'), [products]);

  // Check stock in real-time
  const stockValidation = useMemo(() => {
    const validItems = selectedItems.filter((i) => Boolean(i.productId && i.quantity > 0));
    return checkStockForSale(validItems);
  }, [selectedItems, checkStockForSale]);

  // Totals preview
  const calculations = useMemo(() => {
    let totalSale = 0;
    let totalRecipeCost = 0;

    selectedItems.forEach((item) => {
      const prod = products.find((p) => p.id === item.productId);
      if (prod && item.quantity > 0) {
        const recipe = getRecipeForProduct(prod.id);
        const cost = calculateRecipeCost(recipe);
        totalSale += prod.sellingPrice * item.quantity;
        totalRecipeCost += cost * item.quantity;
      }
    });

    const grossProfit = totalSale - totalRecipeCost;
    const grossMargin = totalSale > 0 ? (grossProfit / totalSale) * 100 : 0;

    return { totalSale, totalRecipeCost, grossProfit, grossMargin };
  }, [selectedItems, products, getRecipeForProduct, calculateRecipeCost]);

  if (!isOpen) return null;

  const handleAddItem = () => {
    setSelectedItems([...selectedItems, { productId: activeProducts[0]?.id || '', quantity: 1 }]);
  };

  const handleRemoveItem = (index: number) => {
    if (selectedItems.length > 1) {
      setSelectedItems(selectedItems.filter((_, i) => i !== index));
    }
  };

  const handleUpdateItem = (index: number, productId: string, quantity: number) => {
    const updated = [...selectedItems];
    updated[index] = { productId, quantity: Math.max(1, quantity) };
    setSelectedItems(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validItems = selectedItems.filter((i) => Boolean(i.productId && i.quantity > 0));
    if (validItems.length === 0) return;

    if (!stockValidation.canProceed) {
      if (currentUser.role !== 'admin' && !authorizedByAdmin) {
        setAuthError('Se requiere autorización de Administrador para proceder con stock insuficiente.');
        return;
      }
    }

    const res = registerSale(validItems, notes, currentUser.role === 'admin' || authorizedByAdmin);
    if (res.success) {
      onClose();
      // Reset state
      setSelectedItems([{ productId: activeProducts[0]?.id || '', quantity: 1 }]);
      setNotes('');
      setAuthorizedByAdmin(false);
      setAdminAuthPassword('');
      setAuthError('');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-xl w-full max-h-[90vh] overflow-y-auto border border-[#D6D6D6] shadow-2xl p-6 sm:p-8">
        {/* Modal Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D6]/60">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">Registrar Nueva Venta</h2>
            <p className="text-xs text-[#707070] mt-0.5">
              Los ingredientes de receta se descontarán automáticamente del inventario.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Items Selector */}
          <div className="space-y-3">
            <label className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
              Productos de la orden
            </label>

            {selectedItems.map((item, index) => {
              const currentProd = products.find((p) => p.id === item.productId);
              const recipe = currentProd ? getRecipeForProduct(currentProd.id) : undefined;
              const unitCost = calculateRecipeCost(recipe);

              return (
                <div key={index} className="flex items-center gap-2.5 p-3 rounded-2xl bg-[#F5F5F7] border border-[#D6D6D6]/60">
                  <div className="flex-1">
                    <select
                      value={item.productId}
                      onChange={(e) => handleUpdateItem(index, e.target.value, item.quantity)}
                      className="w-full bg-white text-xs font-medium text-[#1D1D1F] p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:outline-hidden focus:border-[#0071E3]"
                    >
                      {activeProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.sku} - {p.name} (B/. {p.sellingPrice.toFixed(2)})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="w-20">
                    <input
                      type="number"
                      min="1"
                      value={item.quantity}
                      onChange={(e) => handleUpdateItem(index, item.productId, parseInt(e.target.value) || 1)}
                      className="w-full bg-white text-xs text-center font-semibold text-[#1D1D1F] p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:outline-hidden focus:border-[#0071E3]"
                    />
                  </div>

                  <div className="text-right w-24 pr-1">
                    <p className="text-xs font-semibold text-[#1D1D1F]">
                      B/. {((currentProd?.sellingPrice || 0) * item.quantity).toFixed(2)}
                    </p>
                    <p className="text-[10px] text-[#707070]">
                      Costo: B/. {(unitCost * item.quantity).toFixed(2)}
                    </p>
                  </div>

                  {selectedItems.length > 1 && (
                    <button
                      type="button"
                      onClick={() => handleRemoveItem(index)}
                      className="p-2 text-[#86868B] hover:text-[#FF3B30] rounded-xl hover:bg-white transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              );
            })}

            <button
              type="button"
              onClick={handleAddItem}
              className="w-full py-2.5 rounded-2xl border border-dashed border-[#0071E3]/50 text-[#0071E3] text-xs font-semibold hover:bg-[#0071E3]/5 transition-colors flex items-center justify-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Agregar otro producto</span>
            </button>
          </div>

          {/* Stock Validation Warnings */}
          {!stockValidation.canProceed && (
            <div className="p-4 rounded-2xl bg-[#FF9500]/10 border border-[#FF9500]/30 space-y-2">
              <div className="flex items-center gap-2 text-[#B25900] text-xs font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>Advertencia de stock de ingredientes</span>
              </div>
              <p className="text-xs text-[#707070]">
                Los siguientes ingredientes quedarán en negativo o no tienen suficiente stock:
              </p>
              <ul className="text-xs space-y-1 pl-4 list-disc text-[#1D1D1F]">
                {stockValidation.insufficientIngredients.map((ing) => (
                  <li key={ing.ingredientId}>
                    <span className="font-medium">{ing.ingredientName}:</span> Disponible{' '}
                    {ing.currentStock} {ing.unit}, requiere {ing.required} {ing.unit}{' '}
                    <span className="text-[#FF3B30]">(Faltan {ing.missing} {ing.unit})</span>
                  </li>
                ))}
              </ul>

              {currentUser.role !== 'admin' && !authorizedByAdmin ? (
                <div className="pt-2 border-t border-[#FF9500]/20">
                  <p className="text-xs font-medium text-[#1D1D1F]">
                    Como rol Empleado, necesitas clave o autorización de Administrador:
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <input
                      type="password"
                      placeholder="Contraseña o PIN de Admin"
                      value={adminAuthPassword}
                      onChange={(e) => setAdminAuthPassword(e.target.value)}
                      className="bg-white text-xs p-2 rounded-xl border border-[#D6D6D6] flex-1"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (adminAuthPassword.length >= 3) {
                          setAuthorizedByAdmin(true);
                          setAuthError('');
                        } else {
                          setAuthError('Ingrese clave válida (mínimo 3 caracteres)');
                        }
                      }}
                      className="px-3 py-2 bg-[#1D1D1F] text-white text-xs font-medium rounded-xl hover:bg-black"
                    >
                      Autorizar
                    </button>
                  </div>
                  {authError && <p className="text-[11px] text-[#FF3B30] mt-1">{authError}</p>}
                </div>
              ) : (
                <div className="pt-2 border-t border-[#FF9500]/20 flex items-center gap-2 text-xs text-[#34C759] font-medium">
                  <Check className="w-4 h-4" />
                  <span>Venta con stock negativo autorizada por Administrador</span>
                </div>
              )}
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider block mb-1.5">
              Notas adicionales (opcional)
            </label>
            <input
              type="text"
              placeholder="Ej. Mesa 3, Para llevar, Cliente frecuente..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="w-full bg-[#F5F5F7] text-xs text-[#1D1D1F] p-3 rounded-2xl border border-[#D6D6D6]/80 focus:outline-hidden focus:border-[#0071E3]"
            />
          </div>

          {/* Financial Summary Card */}
          <div className="p-4 rounded-2xl bg-[#FAFAFC] border border-[#D6D6D6]/60 space-y-2">
            <div className="flex justify-between text-xs text-[#707070]">
              <span>Costo total insumos de receta:</span>
              <span>B/. {calculations.totalRecipeCost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs text-[#707070]">
              <span>Utilidad bruta proyectada:</span>
              <span className="font-semibold text-[#0071E3]">
                B/. {calculations.grossProfit.toFixed(2)} ({calculations.grossMargin.toFixed(1)}%)
              </span>
            </div>
            <div className="pt-2 border-t border-[#D6D6D6]/50 flex justify-between items-baseline">
              <span className="text-sm font-semibold text-[#1D1D1F]">Total Venta:</span>
              <span className="text-2xl font-semibold text-[#1D1D1F]">
                B/. {calculations.totalSale.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl text-xs font-medium text-[#707070] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold shadow-xs transition-colors"
            >
              Confirmar y Cobrar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
