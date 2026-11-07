import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { Product } from '../../types';
import { ProductModal } from './ProductModal';
import { RecipeEditorModal } from '../recipes/RecipeEditorModal';
import {
  Search,
  Plus,
  Edit2,
  Trash2,
  ChefHat,
  TrendingUp,
  Package,
  Layers,
  Info,
} from 'lucide-react';

export const ProductsView: React.FC = () => {
  const {
    products,
    deleteProduct,
    ingredients,
    getRecipeForProduct,
    calculateRecipeCost,
    sales,
    currentUser,
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'catalog' | 'costs'>('catalog');
  const [searchTerm, setSearchTerm] = useState('');
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Recipe modal
  const [recipeModalProductId, setRecipeModalProductId] = useState<string | null>(null);
  const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);

  // Units sold map
  const unitsSoldMap = useMemo(() => {
    const map = new Map<string, number>();
    sales.forEach((s) => {
      if (s.status === 'completed') {
        s.items.forEach((item) => {
          map.set(item.productId, (map.get(item.productId) || 0) + item.quantity);
        });
      }
    });
    return map;
  }, [sales]);

  const displayedProducts = useMemo(() => {
    return products.filter((p) => {
      const term = searchTerm.toLowerCase();
      return (
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term) ||
        p.category.toLowerCase().includes(term)
      );
    });
  }, [products, searchTerm]);

  const handleEditProduct = (p: Product) => {
    setEditingProduct(p);
    setIsProductModalOpen(true);
  };

  const handleOpenRecipe = (p: Product) => {
    setRecipeModalProductId(p.id);
    setIsRecipeModalOpen(true);
  };

  return (
    <div className="space-y-6 pb-12 max-w-5xl mx-auto">
      {/* Top Header & Sub-Tabs */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        {/* Clean Segmented Sub-Tabs */}
        <div className="flex items-center bg-[#E5E5EA]/60 p-1 rounded-2xl w-fit text-xs">
          <button
            onClick={() => setActiveSubTab('catalog')}
            className={`px-4 py-1.5 rounded-xl font-medium transition-all ${
              activeSubTab === 'catalog'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#707070] hover:text-[#1D1D1F]'
            }`}
          >
            Catálogo y Precios
          </button>
          <button
            onClick={() => setActiveSubTab('costs')}
            className={`px-4 py-1.5 rounded-xl font-medium transition-all ${
              activeSubTab === 'costs'
                ? 'bg-white text-[#1D1D1F] shadow-xs'
                : 'text-[#707070] hover:text-[#1D1D1F]'
            }`}
          >
            Costos y Escandallo
          </button>
        </div>

        {/* Search & New Product */}
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-[#86868B] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar producto..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-white text-xs pl-8 pr-3 py-1.5 rounded-xl border border-[#E5E5EA] focus:outline-hidden focus:border-[#0071E3] w-48 sm:w-56"
            />
          </div>

          <button
            onClick={() => {
              setEditingProduct(null);
              setIsProductModalOpen(true);
            }}
            className="px-3.5 py-1.5 bg-[#0071E3] hover:bg-[#0077ED] text-white text-xs font-semibold rounded-xl shadow-xs transition-colors flex items-center gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Nuevo</span>
          </button>
        </div>
      </div>

      {/* SUB-TAB 1: Catálogo y Precios */}
      {activeSubTab === 'catalog' && (
        <div className="bg-white rounded-3xl border border-[#E5E5EA]/70 shadow-xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAFAFC] border-b border-[#E5E5EA] text-[#707070]">
                <tr>
                  <th className="p-4 font-semibold">SKU</th>
                  <th className="p-4 font-semibold">Producto</th>
                  <th className="p-4 font-semibold">Categoría</th>
                  <th className="p-4 font-semibold text-right">Precio Venta</th>
                  <th className="p-4 font-semibold text-center">Receta</th>
                  <th className="p-4 font-semibold text-center">Unidades</th>
                  <th className="p-4 font-semibold text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E5E5EA]/60">
                {displayedProducts.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="p-8 text-center text-[#86868B]">
                      No hay productos registrados.
                    </td>
                  </tr>
                ) : (
                  displayedProducts.map((p) => {
                    const recipe = getRecipeForProduct(p.id);
                    const unitsSold = unitsSoldMap.get(p.id) || 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAFAFC] transition-colors">
                        <td className="p-4 font-medium text-[#707070]">{p.sku}</td>
                        <td className="p-4">
                          <p className="font-semibold text-[#1D1D1F]">{p.name}</p>
                          <p className="text-[11px] text-[#86868B] truncate max-w-xs">{p.description}</p>
                        </td>
                        <td className="p-4 text-[#707070]">{p.category}</td>
                        <td className="p-4 text-right font-semibold text-[#1D1D1F]">
                          B/. {p.sellingPrice.toFixed(2)}
                        </td>
                        <td className="p-4 text-center">
                          {recipe ? (
                            <button
                              onClick={() => handleOpenRecipe(p)}
                              className="text-[11px] text-[#0071E3] font-medium hover:underline flex items-center justify-center gap-1 mx-auto"
                            >
                              <ChefHat className="w-3.5 h-3.5" />
                              <span>v{recipe.version} ({recipe.items.length} insumos)</span>
                            </button>
                          ) : (
                            <button
                              onClick={() => handleOpenRecipe(p)}
                              className="text-[11px] text-[#FF9500] font-medium hover:underline"
                            >
                              + Crear receta
                            </button>
                          )}
                        </td>
                        <td className="p-4 text-center text-[#707070]">{unitsSold} u.</td>
                        <td className="p-4 text-center">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => handleEditProduct(p)}
                              className="p-1.5 text-[#707070] hover:text-[#0071E3] rounded-lg hover:bg-[#F5F5F7]"
                              title="Editar producto"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            {currentUser.role === 'admin' && (
                              <button
                                onClick={() => {
                                  if (confirm(`¿Eliminar producto "${p.name}"?`)) {
                                    deleteProduct(p.id);
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
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* SUB-TAB 2: Costos, Rentabilidad y Escandallo */}
      {activeSubTab === 'costs' && (
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-white border border-[#E5E5EA] text-xs text-[#707070] flex items-start gap-2.5">
            <Info className="w-4 h-4 text-[#0071E3] shrink-0 mt-0.5" />
            <div>
              <strong className="text-[#1D1D1F]">Utilidad Bruta:</strong> Calculada descontando el costo real de materias primas por porción. No incluye costos fijos como alquiler o planilla.
            </div>
          </div>

          <div className="bg-white rounded-3xl border border-[#E5E5EA]/70 shadow-xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAFAFC] border-b border-[#E5E5EA] text-[#707070]">
                  <tr>
                    <th className="p-4 font-semibold">Producto</th>
                    <th className="p-4 font-semibold text-right">Precio Venta</th>
                    <th className="p-4 font-semibold text-right">Costo Receta</th>
                    <th className="p-4 font-semibold text-right">Utilidad Unitaria</th>
                    <th className="p-4 font-semibold text-right">Margen Bruto</th>
                    <th className="p-4 font-semibold text-center">Editar Receta</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E5E5EA]/60">
                  {displayedProducts.map((p) => {
                    const recipe = getRecipeForProduct(p.id);
                    const cost = calculateRecipeCost(recipe);
                    const profit = p.sellingPrice - cost;
                    const margin = p.sellingPrice > 0 ? (profit / p.sellingPrice) * 100 : 0;

                    return (
                      <tr key={p.id} className="hover:bg-[#FAFAFC] transition-colors">
                        <td className="p-4">
                          <p className="font-semibold text-[#1D1D1F]">{p.name}</p>
                          <p className="text-[11px] text-[#86868B]">{p.category}</p>
                        </td>
                        <td className="p-4 text-right font-medium text-[#1D1D1F]">
                          B/. {p.sellingPrice.toFixed(2)}
                        </td>
                        <td className="p-4 text-right text-[#707070]">
                          B/. {cost.toFixed(2)}
                        </td>
                        <td className="p-4 text-right font-semibold text-[#0071E3]">
                          B/. {profit.toFixed(2)}
                        </td>
                        <td className="p-4 text-right font-semibold">
                          <span className={margin < 40 ? 'text-[#FF9500]' : 'text-[#34C759]'}>
                            {margin.toFixed(1)}%
                          </span>
                        </td>
                        <td className="p-4 text-center">
                          <button
                            onClick={() => handleOpenRecipe(p)}
                            className="px-3 py-1 rounded-xl bg-[#F5F5F7] hover:bg-[#E5E5EA] text-xs font-semibold text-[#1D1D1F] transition-colors"
                          >
                            Modificar porciones
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      <ProductModal
        isOpen={isProductModalOpen}
        onClose={() => setIsProductModalOpen(false)}
        productToEdit={editingProduct}
      />

      {recipeModalProductId && (
        <RecipeEditorModal
          isOpen={isRecipeModalOpen}
          onClose={() => {
            setIsRecipeModalOpen(false);
            setRecipeModalProductId(null);
          }}
          productId={recipeModalProductId}
        />
      )}
    </div>
  );
};
