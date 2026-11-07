import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, Recipe } from '../../types';
import { RecipeEditorModal } from './RecipeEditorModal';
import {
  ChefHat,
  Plus,
  Edit2,
  Layers,
  ArrowRight,
  TrendingUp,
  AlertTriangle,
  History,
  CheckCircle2,
} from 'lucide-react';

export const RecipesView: React.FC = () => {
  const { products, recipes, ingredients, getRecipeForProduct, calculateRecipeCost } = useApp();

  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const handleOpenEditor = (productId: string) => {
    setSelectedProductId(productId);
    setIsEditorOpen(true);
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Intro Header Card */}
      <div className="bg-white rounded-3xl p-6 border border-[#D6D6D6]/70 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#0071E3] uppercase tracking-wider">
            <ChefHat className="w-4 h-4" />
            <span>Escandallo & Formulación</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-semibold text-[#1D1D1F] tracking-tight mt-1">
            Recetas y Costeo Automático de Insumos
          </h2>
          <p className="text-xs text-[#707070] mt-1 max-w-2xl leading-relaxed">
            Cada vez que registras una venta, SmartPyme identifica la receta asociada, calcula los insumos requeridos, descuenta el inventario y almacena un snapshot histórico del costo unitario.
          </p>
        </div>
      </div>

      {/* Grid of Products and their Associated Recipes */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product) => {
          const recipe = getRecipeForProduct(product.id);
          const recipeCost = calculateRecipeCost(recipe);
          const profit = product.sellingPrice - recipeCost;
          const margin = product.sellingPrice > 0 ? (profit / product.sellingPrice) * 100 : 0;

          return (
            <div
              key={product.id}
              className="bg-white rounded-3xl border border-[#D6D6D6]/70 shadow-xs p-6 flex flex-col justify-between hover:border-[#0071E3]/40 transition-colors"
            >
              <div>
                {/* Header of Card */}
                <div className="flex items-start justify-between gap-3 pb-4 border-b border-[#D6D6D6]/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-semibold text-[#1D1D1F]">{product.name}</h3>
                      <span className="text-[10px] font-semibold text-[#707070] bg-[#F5F5F7] px-2 py-0.5 rounded-md">
                        {product.sku}
                      </span>
                    </div>
                    <p className="text-xs text-[#707070] mt-0.5">{product.category}</p>
                  </div>

                  <div className="text-right">
                    <p className="text-xs text-[#707070]">Precio de venta</p>
                    <p className="text-lg font-semibold text-[#1D1D1F]">
                      B/. {product.sellingPrice.toFixed(2)}
                    </p>
                  </div>
                </div>

                {/* Recipe status / Ingredients */}
                {recipe ? (
                  <div className="mt-4 space-y-3">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-semibold text-[#1D1D1F]">
                        {recipe.name} <span className="font-normal text-[#86868B]">(v{recipe.version})</span>
                      </span>
                      <span className="text-[#34C759] font-medium text-[11px] flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Activa</span>
                      </span>
                    </div>

                    {/* Ingredient Breakdown List */}
                    <div className="bg-[#FAFAFC] rounded-2xl border border-[#D6D6D6]/60 p-3 space-y-1.5 text-xs">
                      {recipe.items.map((item, idx) => {
                        const ing = ingredients.find((i) => i.id === item.ingredientId);
                        const cost = ing ? item.quantity * ing.unitCost : 0;

                        return (
                          <div key={idx} className="flex items-center justify-between py-1 border-b border-[#D6D6D6]/30 last:border-b-0">
                            <span className="text-[#1D1D1F] font-medium">
                              {ing ? ing.name : 'Insumo no encontrado'}
                            </span>
                            <div className="flex items-center gap-3">
                              <span className="text-[#707070]">
                                {item.quantity} {ing?.unit}
                              </span>
                              <span className="font-semibold text-[#1D1D1F] w-16 text-right">
                                B/. {cost.toFixed(3)}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {recipe.notes && (
                      <p className="text-[11px] text-[#707070] italic">
                        Instrucciones: {recipe.notes}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="mt-6 p-6 rounded-2xl bg-[#FF9500]/5 border border-[#FF9500]/20 text-center">
                    <AlertTriangle className="w-6 h-6 text-[#FF9500] mx-auto mb-2" />
                    <p className="text-xs font-semibold text-[#1D1D1F]">Sin receta vinculada</p>
                    <p className="text-[11px] text-[#707070] mt-1">
                      Al vender este producto no se descontarán materias primas del inventario.
                    </p>
                  </div>
                )}
              </div>

              {/* Card Footer: Financial Metric & Edit Action */}
              <div className="pt-4 border-t border-[#D6D6D6]/50 mt-5">
                <div className="flex items-center justify-between text-xs mb-3">
                  <div>
                    <span className="text-[#707070]">Costo total receta:</span>
                    <span className="font-semibold text-[#1D1D1F] ml-1.5">
                      B/. {recipeCost.toFixed(2)}
                    </span>
                  </div>
                  <div>
                    <span className="text-[#707070]">Utilidad bruta:</span>
                    <span className="font-semibold text-[#0071E3] ml-1.5">
                      B/. {profit.toFixed(2)}
                    </span>
                    <span className={`ml-1.5 font-semibold ${margin < 40 ? 'text-[#FF9500]' : 'text-[#34C759]'}`}>
                      ({margin.toFixed(1)}%)
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => handleOpenEditor(product.id)}
                  className="w-full py-2 bg-[#F5F5F7] hover:bg-[#E5E5EA] text-[#1D1D1F] text-xs font-semibold rounded-xl border border-[#D6D6D6]/70 transition-colors flex items-center justify-center gap-1.5"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>{recipe ? 'Editar ingredientes y porciones' : 'Diseñar receta'}</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {selectedProductId && (
        <RecipeEditorModal
          isOpen={isEditorOpen}
          onClose={() => {
            setIsEditorOpen(false);
            setSelectedProductId(null);
          }}
          productId={selectedProductId}
        />
      )}
    </div>
  );
};
