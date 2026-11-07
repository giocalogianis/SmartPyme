import React, { useState, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { X, Package, DollarSign, Tag, FileText } from 'lucide-react';

interface ProductModalProps {
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

export const ProductModal: React.FC<ProductModalProps> = ({
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { addProduct, updateProduct, products, currentUser } = useApp();

  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Cafetería clásica');
  const [description, setDescription] = useState('');
  const [sellingPrice, setSellingPrice] = useState('2.50');
  const [status, setStatus] = useState<'active' | 'inactive'>('active');
  const [error, setError] = useState('');

  const categories = [
    'Cafetería clásica',
    'Cafetería con leche',
    'Bebidas calientes',
    'Bebidas frías',
    'Panadería y repostería',
    'Sandwiches y salados',
    'Desayunos',
    'Postres',
  ];

  useEffect(() => {
    if (productToEdit) {
      setSku(productToEdit.sku);
      setName(productToEdit.name);
      setCategory(productToEdit.category);
      setDescription(productToEdit.description);
      setSellingPrice(productToEdit.sellingPrice.toString());
      setStatus(productToEdit.status);
    } else {
      // Auto-suggest next SKU
      const nextNum = products.length + 1;
      setSku(`P${String(nextNum).padStart(3, '0')}`);
      setName('');
      setCategory('Cafetería clásica');
      setDescription('');
      setSellingPrice('2.50');
      setStatus('active');
    }
    setError('');
  }, [productToEdit, products, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }

    const price = parseFloat(sellingPrice);
    if (isNaN(price) || price <= 0) {
      setError('El precio de venta debe ser un número positivo');
      return;
    }

    // Check SKU duplicate
    const duplicateSku = products.find(
      (p) => p.sku.toLowerCase() === sku.toLowerCase() && p.id !== productToEdit?.id
    );
    if (duplicateSku) {
      setError(`El SKU "${sku}" ya está registrado en el producto "${duplicateSku.name}"`);
      return;
    }

    if (productToEdit) {
      updateProduct(productToEdit.id, {
        sku,
        name,
        category,
        description,
        sellingPrice: price,
        status,
      });
    } else {
      addProduct({
        businessId: 'biz_01',
        sku,
        name,
        category,
        description,
        sellingPrice: price,
        status,
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
              {productToEdit ? 'Editar Producto' : 'Nuevo Producto'}
            </h2>
            <p className="text-xs text-[#707070] mt-0.5">Catálogo de venta del negocio</p>
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
                placeholder="P001"
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
                placeholder="Ej. Café americano 12oz"
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
                Precio de Venta (B/.)
              </label>
              <input
                type="number"
                step="0.05"
                min="0.10"
                required
                value={sellingPrice}
                onChange={(e) => setSellingPrice(e.target.value)}
                placeholder="2.00"
                className="w-full bg-[#F5F5F7] text-xs font-semibold p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">
              Descripción / Notas
            </label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notas sobre tamaño, temperatura o preparación..."
              className="w-full bg-[#F5F5F7] text-xs p-2.5 rounded-xl border border-[#D6D6D6]/80 focus:bg-white focus:outline-hidden focus:border-[#0071E3]"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-[#1D1D1F] block mb-1">Estado</label>
            <div className="flex gap-4 text-xs font-medium">
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'active'}
                  onChange={() => setStatus('active')}
                  className="text-[#0071E3]"
                />
                <span>Activo para venta</span>
              </label>
              <label className="flex items-center gap-1.5 cursor-pointer">
                <input
                  type="radio"
                  name="status"
                  checked={status === 'inactive'}
                  onChange={() => setStatus('inactive')}
                  className="text-[#0071E3]"
                />
                <span>Inactivo</span>
              </label>
            </div>
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
              {productToEdit ? 'Guardar Cambios' : 'Crear Producto'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
