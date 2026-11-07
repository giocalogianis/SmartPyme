import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Sale } from '../../types';
import { X, Calendar, User, Receipt, RotateCcw, AlertTriangle, ShieldAlert } from 'lucide-react';

interface SaleDetailModalProps {
  sale: Sale | null;
  onClose: () => void;
}

export const SaleDetailModal: React.FC<SaleDetailModalProps> = ({ sale, onClose }) => {
  const { cancelSale, currentUser } = useApp();
  const [showCancelPrompt, setShowCancelPrompt] = useState(false);
  const [cancelReason, setCancelReason] = useState('Error de digitación o pedido cancelado por cliente');
  const [errorMsg, setErrorMsg] = useState('');

  if (!sale) return null;

  const handleConfirmCancel = () => {
    if (!cancelReason.trim()) {
      setErrorMsg('Debe especificar un motivo de anulación');
      return;
    }
    const res = cancelSale(sale.id, cancelReason);
    if (res.success) {
      onClose();
    } else {
      setErrorMsg(res.error || 'Error al cancelar la venta');
    }
  };

  const formattedDate = new Date(sale.date).toLocaleString('es-PA', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto border border-[#D6D6D6] shadow-2xl p-6 sm:p-8">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D6]/60">
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-[#1D1D1F]">{sale.saleNumber}</h2>
              {sale.status === 'cancelled' ? (
                <span className="text-[10px] font-semibold text-[#FF3B30] bg-[#FF3B30]/10 px-2 py-0.5 rounded-full">
                  ANULADA
                </span>
              ) : (
                <span className="text-[10px] font-semibold text-[#34C759] bg-[#34C759]/10 px-2 py-0.5 rounded-full">
                  COMPLETADA
                </span>
              )}
            </div>
            <p className="text-xs text-[#707070] mt-0.5">Detalle de transacción y snapshot de costos</p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-[#86868B] hover:text-[#1D1D1F] hover:bg-[#F5F5F7]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-2 gap-3 py-4 text-xs">
          <div className="p-3 bg-[#F5F5F7] rounded-2xl">
            <div className="flex items-center gap-1.5 text-[#707070] mb-1">
              <Calendar className="w-3.5 h-3.5" />
              <span>Fecha y hora</span>
            </div>
            <p className="font-semibold text-[#1D1D1F]">{formattedDate}</p>
          </div>
          <div className="p-3 bg-[#F5F5F7] rounded-2xl">
            <div className="flex items-center gap-1.5 text-[#707070] mb-1">
              <User className="w-3.5 h-3.5" />
              <span>Cajero / Usuario</span>
            </div>
            <p className="font-semibold text-[#1D1D1F]">{sale.userName}</p>
          </div>
        </div>

        {/* Cancellation Notice if cancelled */}
        {sale.status === 'cancelled' && (
          <div className="p-4 rounded-2xl bg-[#FF3B30]/5 border border-[#FF3B30]/20 text-xs mb-4">
            <p className="font-semibold text-[#FF3B30]">Venta Anulada</p>
            <p className="text-[#707070] mt-0.5">
              Motivo: {sale.cancellationReason || 'No especificado'} · Por: {sale.cancelledBy || 'Administrador'}
            </p>
            <p className="text-[11px] text-[#34C759] font-medium mt-1">
              ✓ Insumos de receta restablecidos en inventario automáticamente.
            </p>
          </div>
        )}

        {/* Items Table */}
        <div className="space-y-2 mt-2">
          <p className="text-xs font-semibold text-[#1D1D1F] uppercase tracking-wider">
            Productos Vendidos
          </p>
          <div className="border border-[#D6D6D6]/60 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#F5F5F7] border-b border-[#D6D6D6]/60 text-[#707070]">
                <tr>
                  <th className="p-3 font-medium">Producto</th>
                  <th className="p-3 font-medium text-center">Cant.</th>
                  <th className="p-3 font-medium text-right">Precio</th>
                  <th className="p-3 font-medium text-right">Costo Receta</th>
                  <th className="p-3 font-medium text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#D6D6D6]/40">
                {sale.items.map((item, index) => (
                  <tr key={index}>
                    <td className="p-3 font-medium text-[#1D1D1F]">
                      <div>{item.productName}</div>
                      <div className="text-[10px] text-[#86868B]">{item.productSku}</div>
                    </td>
                    <td className="p-3 text-center text-[#707070]">{item.quantity}</td>
                    <td className="p-3 text-right text-[#707070]">B/. {item.unitSellingPrice.toFixed(2)}</td>
                    <td className="p-3 text-right text-[#86868B]">
                      B/. {item.unitRecipeCostSnapshot.toFixed(2)}
                    </td>
                    <td className="p-3 text-right font-semibold text-[#1D1D1F]">
                      B/. {item.total.toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Financial Summary */}
        <div className="mt-4 p-4 rounded-2xl bg-[#FAFAFC] border border-[#D6D6D6]/70 space-y-2 text-xs">
          <div className="flex justify-between text-[#707070]">
            <span>Total Venta:</span>
            <span className="font-semibold text-[#1D1D1F]">B/. {sale.totalSale.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#707070]">
            <span>Costo histórico total de recetas:</span>
            <span>B/. {sale.totalRecipeCost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-[#707070]">
            <span>Utilidad bruta generada:</span>
            <span className="font-semibold text-[#0071E3]">
              B/. {sale.grossProfit.toFixed(2)} ({sale.grossProfitMargin.toFixed(1)}%)
            </span>
          </div>
          {sale.notes && (
            <div className="pt-2 border-t border-[#D6D6D6]/50 text-[#707070]">
              <span className="font-medium text-[#1D1D1F]">Notas:</span> {sale.notes}
            </div>
          )}
        </div>

        {/* Cancellation Section */}
        {sale.status === 'completed' && (
          <div className="mt-6 pt-4 border-t border-[#D6D6D6]/60">
            {!showCancelPrompt ? (
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowCancelPrompt(true)}
                  className="flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold text-[#FF3B30] hover:bg-[#FF3B30]/10 rounded-xl transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Anular venta y revertir inventario</span>
                </button>
              </div>
            ) : (
              <div className="p-4 rounded-2xl bg-[#FF3B30]/5 border border-[#FF3B30]/30 space-y-3">
                <div className="flex items-center gap-2 text-xs font-semibold text-[#FF3B30]">
                  <AlertTriangle className="w-4 h-4 shrink-0" />
                  <span>¿Está seguro de anular la venta {sale.saleNumber}?</span>
                </div>
                <p className="text-xs text-[#707070]">
                  El sistema revertirá automáticamente todos los ingredientes consumidos al inventario. Solo el Administrador puede realizar esta acción.
                </p>

                {currentUser.role !== 'admin' ? (
                  <p className="text-xs font-medium text-[#FF3B30]">
                    Acceso denegado: Cambie de usuario a 'Administrador' para anular transacciones.
                  </p>
                ) : (
                  <>
                    <input
                      type="text"
                      placeholder="Motivo de la anulación (obligatorio)"
                      value={cancelReason}
                      onChange={(e) => setCancelReason(e.target.value)}
                      className="w-full bg-white text-xs p-2.5 rounded-xl border border-[#D6D6D6] focus:outline-hidden focus:border-[#FF3B30]"
                    />
                    {errorMsg && <p className="text-[11px] text-[#FF3B30]">{errorMsg}</p>}
                    <div className="flex items-center justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => setShowCancelPrompt(false)}
                        className="px-3 py-1.5 rounded-xl text-xs font-medium text-[#707070] hover:bg-[#F5F5F7]"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={handleConfirmCancel}
                        className="px-4 py-1.5 rounded-xl bg-[#FF3B30] hover:bg-[#D70015] text-white text-xs font-semibold"
                      >
                        Confirmar Anulación
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
