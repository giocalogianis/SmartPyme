import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Ingredient } from '../../types';
import { X } from 'lucide-react';

interface IngredientModalProps {
  isOpen: boolean;
  onClose: () => void;
  ingredientToEdit?: Ingredient | null;
}

export const IngredientModal: React.FC<IngredientModalProps> = ({
  isOpen,
  onClose,
  ingredientToEdit,
}) => {
  const { addIngredient, updateIngredient, ingredients } = useApp();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Granos y café');
  const [unit, setUnit] = useState<'g' | 'ml' | 'unidad' | 'kg' | 'l'>('g');
  const [currentStock, setCurrentStock] = useState('1000');
  const [minStock, setMinStock] = useState('200');
  const [unitCost, setUnitCost] = useState('0.025');
  const [supplier, setSupplier] = useState('');
  const [error, setError] = useState('');

  const categories = [
    'Granos y café',
    'Lácteos',
    'Endulzantes',
    'Chocolatería',
    'Panadería',
    'Empaque y descartables',
    'Sirops y saborizantes',
    'Otros insumos',
  ];

  useEffect(() => {
    if (ingredientToEdit) {
      setSku(ingredientToEdit.sku);
      setName(ingredientToEdit.name);
      setCategory(ingredientToEdit.category);
      setUnit(ingredientToEdit.unit);
      setCurrentStock(ingredientToEdit.currentStock.toString());
      setMinStock(ingredientToEdit.minStock.toString());
      setUnitCost(ingredientToEdit.unitCost.toString());
      setSupplier(ingredientToEdit.supplier || '');
    } else {
      const nextNum = ingredients.length + 1;
      setSku(`I${String(nextNum).padStart(3, '0')}`);
      setName('');
      setCategory('Granos y café');
      setUnit('g');
      setCurrentStock('1000');
      setMinStock('200');
      setUnitCost('0.025');
      setSupplier('');
    }
    setError('');
  }, [ingredientToEdit, ingredients, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre de la materia prima es obligatorio');
      return;
    }

    const stockNum = parseFloat(currentStock);
    const minNum = parseFloat(minStock);
    const costNum = parseFloat(unitCost);

    if (isNaN(stockNum) || stockNum < 0) {
      setError('El stock actual debe ser mayor o igual a 0');
      return;
    }
    if (isNaN(minNum) || minNum < 0) {
      setError('El stock mínimo debe ser mayor o igual a 0');
      return;
    }
    if (isNaN(costNum) || costNum < 0) {
      setError('El costo unitario no puede ser negativo');
      return;
    }

    if (ingredientToEdit) {
      updateIngredient(ingredientToEdit.id, {
        sku,
        name,
        category,
        unit,
        currentStock: stockNum,
        minStock: minNum,
        unitCost: costNum,
        supplier,
      });
    } else {
      addIngredient({
        businessId: 'biz_01',
        sku,
        name,
        category,
        unit,
        currentStock: stockNum,
        minStock: minNum,
        unitCost: costNum,
        supplier,
        status: 'active',
      });
    }

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
      <div className="bg-white rounded-3xl max-w-md w-full border border-[#D6D6D6] shadow-2xl p-6 sm:p-8">
        <div className="flex items-center justify-between pb-4 border-b border-[#D6D6D6]/60">
          <div>
            <h2 className="text-xl font-semibold text-[#1D1D1F]">
              {ingredientToEdit ? 'Editar Ingrediente' : 'Nuevo Ingrediente / Materia Prima'}
            </h2>
            <p className="text-xs text-[#707070] mt-0.5">Control de materias primas para recetas</p>
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

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-1">
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">SKU</label>
              <input
                type="text"
                required
                value={sku}
                onChange={(e) => setSku(e.target.value.toUpperCase())}
                className="w-full bg-[#F5F5F7] text-xs font-semibold p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Nombre</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej. Café en grano Geisha"
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Categoría</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              >
                {categories.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Unidad de Medida
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value as any)}
                className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              >
                <option value="g">Gramos (g)</option>
                <option value="ml">Mililitros (ml)</option>
                <option value="unidad">Unidades (unidad)</option>
                <option value="kg">Kilogramos (kg)</option>
                <option value="l">Litros (l)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Stock Actual
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={currentStock}
                onChange={(e) => setCurrentStock(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs font-semibold p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Stock Mínimo
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                required
                value={minStock}
                onChange={(e) => setMinStock(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs font-semibold p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
                Costo / Unidad (B/.)
              </label>
              <input
                type="number"
                step="0.0001"
                min="0"
                required
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                className="w-full bg-[#F5F5F7] text-xs font-semibold p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
              Proveedor habitual (opcional)
            </label>
            <input
              type="text"
              value={supplier}
              onChange={(e) => setSupplier(e.target.value)}
              placeholder="Ej. Finca Lerida Boquete"
              className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-[#D6D6D6]/60">
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
              {ingredientToEdit ? 'Guardar Cambios' : 'Registrar Ingrediente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
