export type UserRole = 'admin' | 'employee';

export interface User {
  id: string;
  businessId: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
}

export interface Business {
  id: string;
  name: string;
  type: string;
  currency: string;
  currencySymbol: string;
  timeZone: string;
  address: string;
  phone: string;
  email: string;
  ruc?: string;
  dv?: string;
}

export interface Ingredient {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  category: string;
  unit: 'g' | 'ml' | 'unidad' | 'kg' | 'l';
  currentStock: number;
  minStock: number;
  unitCost: number; // Cost in B/. per measurement unit
  supplier?: string;
  status: 'active' | 'inactive';
  updatedAt: string;
}

export interface RecipeItem {
  ingredientId: string;
  quantity: number; // in ingredient's measurement unit
}

export interface Recipe {
  id: string;
  businessId: string;
  productId: string;
  name: string;
  version: number;
  items: RecipeItem[];
  notes?: string;
  status: 'active' | 'archived';
  updatedAt: string;
}

export interface Product {
  id: string;
  businessId: string;
  sku: string;
  name: string;
  category: string;
  description: string;
  sellingPrice: number; // in B/.
  status: 'active' | 'inactive';
  imageUrl?: string;
  createdAt: string;
  updatedAt: string;
}

export interface SaleItem {
  productId: string;
  productName: string;
  productSku: string;
  quantity: number;
  unitSellingPrice: number;
  unitRecipeCostSnapshot: number; // Preserves historical cost at sale moment
  total: number;
  totalRecipeCost: number;
  grossProfit: number;
}

export interface Sale {
  id: string;
  businessId: string;
  saleNumber: string;
  date: string; // ISO string
  userId: string;
  userName: string;
  items: SaleItem[];
  totalQuantity: number;
  totalSale: number;
  totalRecipeCost: number;
  grossProfit: number;
  grossProfitMargin: number;
  notes?: string;
  status: 'completed' | 'cancelled';
  cancelledAt?: string;
  cancelledBy?: string;
  cancellationReason?: string;
}

export type MovementType = 'COMPRA' | 'MERMA' | 'AJUSTE' | 'CONSUMO_VENTA' | 'REVERSION_VENTA';

export interface InventoryMovement {
  id: string;
  businessId: string;
  ingredientId: string;
  ingredientName: string;
  unit: string;
  movementType: MovementType;
  quantity: number; // positive for additions, negative for deductions
  unitCost: number;
  totalCost: number;
  reason: string;
  reference?: string; // e.g. Sale ID or Invoice #
  notes?: string;
  supplier?: string;
  userId: string;
  userName: string;
  date: string; // ISO string
}

export type DateFilterType = 
  | 'all'
  | 'today' 
  | 'yesterday' 
  | 'last7days' 
  | 'last30days' 
  | 'thisMonth' 
  | 'prevMonth' 
  | 'custom';

export interface DateRange {
  start: Date;
  end: Date;
  label: string;
}

export interface KPIMetrics {
  salesToday: number;
  salesThisWeek: number;
  salesThisMonth: number;
  unitsSold: number;
  totalRecipeCosts: number;
  grossProfit: number;
  grossProfitMargin: number;
  inventoryValue: number;
  lowStockCount: number;
  wasteCount: number;
  wasteCost: number;
  // Comparisons vs previous period (percentage)
  salesChangePct?: number;
  profitChangePct?: number;
  unitsSoldChangePct?: number;
}
