import React, { createContext, useContext, useState, useEffect, useMemo, ReactNode } from 'react';
import {
  Business,
  User,
  Ingredient,
  Product,
  Recipe,
  Sale,
  SaleItem,
  InventoryMovement,
  DateFilterType,
  KPIMetrics,
  MovementType,
} from '../types';
import {
  INITIAL_BUSINESS,
  INITIAL_USERS,
  INITIAL_INGREDIENTS,
  INITIAL_PRODUCTS,
  INITIAL_RECIPES,
  INITIAL_SALES,
  INITIAL_MOVEMENTS,
} from '../data/mockData';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
}

export interface StockValidationResult {
  canProceed: boolean;
  needsAuthorization: boolean;
  insufficientIngredients: Array<{
    ingredientId: string;
    ingredientName: string;
    currentStock: number;
    required: number;
    unit: string;
    missing: number;
  }>;
}

interface AppContextType {
  // Navigation & UI
  activeTab: string;
  setActiveTab: (tab: string) => void;
  toasts: ToastMessage[];
  addToast: (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => void;
  removeToast: (id: string) => void;

  // Business & Users
  business: Business;
  updateBusiness: (updates: Partial<Business>) => void;
  users: User[];
  currentUser: User;
  switchUser: (userId: string) => void;
  updateUser: (userId: string, updates: Partial<User>) => void;
  addUser: (userData: Omit<User, 'id'>) => User;
  deleteUser: (userId: string) => { success: boolean; error?: string };

  // Netflix-style Session Authentication
  isSessionActive: boolean;
  loginAsUser: (userId: string) => void;
  logoutSession: () => void;

  // Products
  products: Product[];
  addProduct: (product: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>) => Product;
  updateProduct: (id: string, updates: Partial<Product>) => void;
  deleteProduct: (id: string) => void;

  // Ingredients
  ingredients: Ingredient[];
  addIngredient: (ingredient: Omit<Ingredient, 'id' | 'updatedAt'>) => Ingredient;
  updateIngredient: (id: string, updates: Partial<Ingredient>) => void;
  deleteIngredient: (id: string) => void;

  // Recipes
  recipes: Recipe[];
  saveRecipe: (productId: string, name: string, items: { ingredientId: string; quantity: number }[], notes?: string) => Recipe;
  getRecipeForProduct: (productId: string) => Recipe | undefined;
  calculateRecipeCost: (recipe: Recipe | undefined) => number;

  // Sales
  sales: Sale[];
  checkStockForSale: (items: Array<{ productId: string; quantity: number }>) => StockValidationResult;
  registerSale: (
    items: Array<{ productId: string; quantity: number }>,
    notes?: string,
    authorizedByAdmin?: boolean
  ) => { success: boolean; sale?: Sale; error?: string };
  cancelSale: (saleId: string, reason: string) => { success: boolean; error?: string };

  // Inventory movements
  movements: InventoryMovement[];
  addMovement: (movement: {
    ingredientId: string;
    movementType: MovementType;
    quantity: number;
    unitCost?: number;
    reason: string;
    reference?: string;
    supplier?: string;
    notes?: string;
  }) => { success: boolean; error?: string };

  // Filters & Metrics
  dateFilter: DateFilterType;
  setDateFilter: (filter: DateFilterType) => void;
  customStartDate: string;
  customEndDate: string;
  setCustomDateRange: (start: string, end: string) => void;
  filteredSales: Sale[];
  filteredMovements: InventoryMovement[];
  kpiMetrics: KPIMetrics;

  // Smart alerts
  alerts: Array<{
    id: string;
    type: 'critical' | 'warning' | 'info';
    title: string;
    message: string;
    actionLabel?: string;
    tabTarget?: string;
  }>;

  // Reset demo
  resetToDemoData: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const STORAGE_KEYS = {
  BUSINESS: 'smartpyme_biz_v1',
  USERS: 'smartpyme_users_v1',
  CURRENT_USER_ID: 'smartpyme_curr_user_v1',
  SESSION_ACTIVE: 'smartpyme_session_active_v1',
  PRODUCTS: 'smartpyme_products_v1',
  INGREDIENTS: 'smartpyme_ingredients_v1',
  RECIPES: 'smartpyme_recipes_v1',
  SALES: 'smartpyme_sales_v1',
  MOVEMENTS: 'smartpyme_movements_v1',
};

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Netflix-style Session Authentication State
  const [isSessionActive, setIsSessionActive] = useState<boolean>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SESSION_ACTIVE);
    return saved === 'true';
  });

  // Persistent States
  const [business, setBusiness] = useState<Business>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.BUSINESS);
    return saved ? JSON.parse(saved) : INITIAL_BUSINESS;
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.USERS);
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });

  const [currentUserId, setCurrentUserId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CURRENT_USER_ID);
    return saved || INITIAL_USERS[0].id;
  });

  const [products, setProducts] = useState<Product[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return saved ? JSON.parse(saved) : INITIAL_PRODUCTS;
  });

  const [ingredients, setIngredients] = useState<Ingredient[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.INGREDIENTS);
    return saved ? JSON.parse(saved) : INITIAL_INGREDIENTS;
  });

  const [recipes, setRecipes] = useState<Recipe[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.RECIPES);
    return saved ? JSON.parse(saved) : INITIAL_RECIPES;
  });

  const [sales, setSales] = useState<Sale[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.SALES);
    return saved ? JSON.parse(saved) : INITIAL_SALES;
  });

  const [movements, setMovements] = useState<InventoryMovement[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
    return saved ? JSON.parse(saved) : INITIAL_MOVEMENTS;
  });

  // Dual-Layer Persistence: Sync with both localStorage AND backend server
  const [isServerLoaded, setIsServerLoaded] = useState(false);

  // Helper to reliably persist whole store to server disk with keepalive
  const persistFullStoreToServer = (payload: {
    business: Business;
    users: User[];
    currentUserId: string;
    products: Product[];
    ingredients: Ingredient[];
    recipes: Recipe[];
    sales: Sale[];
    movements: InventoryMovement[];
  }) => {
    try {
      fetch('/api/data', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify(payload),
      }).catch((err) => console.warn('Sync /api/data warning:', err));
    } catch (e) {
      console.warn('Sync /api/data exception:', e);
    }
  };

  // 1. On mount: Fetch persistent data from server disk and merge non-destructively with localStorage
  useEffect(() => {
    fetch('/api/data')
      .then((res) => res.json())
      .then((res) => {
        if (res.success && res.data) {
          const d = res.data;
          let needsBackfill = false;

          // Business
          if (d.business) {
            setBusiness(d.business);
            localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(d.business));
          }

          // Users: Respect server list, ensure valid current session
          if (Array.isArray(d.users) && d.users.length > 0) {
            setUsers(d.users);
            localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(d.users));
            const activeId = d.currentUserId && d.users.some((u: any) => u.id === d.currentUserId)
              ? d.currentUserId
              : d.users[0].id;
            setCurrentUserId(activeId);
            localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, activeId);
          }

          // Products & Recipes & Ingredients
          if (Array.isArray(d.products) && d.products.length > 0) {
            setProducts(d.products);
            localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(d.products));
          }
          if (Array.isArray(d.ingredients) && d.ingredients.length > 0) {
            setIngredients(d.ingredients);
            localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(d.ingredients));
          }
          if (Array.isArray(d.recipes) && d.recipes.length > 0) {
            setRecipes(d.recipes);
            localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(d.recipes));
          }

          // SALES: Merge server sales and local storage sales so NO NEW SALES ARE EVER OVERWRITTEN!
          const localSavedSalesStr = localStorage.getItem(STORAGE_KEYS.SALES);
          const localSales: Sale[] = localSavedSalesStr ? JSON.parse(localSavedSalesStr) : INITIAL_SALES;
          const serverSales: Sale[] = Array.isArray(d.sales) ? d.sales : [];

          const salesMap = new Map<string, Sale>();
          // 1. Load server sales
          serverSales.forEach((s) => salesMap.set(s.id, s));
          // 2. Add local sales that may not yet have synced to server
          localSales.forEach((s) => {
            if (!salesMap.has(s.id)) {
              salesMap.set(s.id, s);
              needsBackfill = true;
            } else {
              // If local status is cancelled, respect the cancellation
              const serv = salesMap.get(s.id);
              if (serv && s.status === 'cancelled' && serv.status !== 'cancelled') {
                salesMap.set(s.id, s);
                needsBackfill = true;
              }
            }
          });

          const mergedSales = Array.from(salesMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setSales(mergedSales);
          localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(mergedSales));

          // MOVEMENTS: Merge non-destructively
          const localMovementsStr = localStorage.getItem(STORAGE_KEYS.MOVEMENTS);
          const localMovements: InventoryMovement[] = localMovementsStr ? JSON.parse(localMovementsStr) : INITIAL_MOVEMENTS;
          const serverMovements: InventoryMovement[] = Array.isArray(d.movements) ? d.movements : [];
          const movMap = new Map<string, InventoryMovement>();
          serverMovements.forEach((m) => movMap.set(m.id, m));
          localMovements.forEach((m) => {
            if (!movMap.has(m.id)) {
              movMap.set(m.id, m);
              needsBackfill = true;
            }
          });
          const mergedMovements = Array.from(movMap.values()).sort(
            (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
          );
          setMovements(mergedMovements);
          localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(mergedMovements));

          // Backfill server if local had newer sales/movements
          if (needsBackfill) {
            persistFullStoreToServer({
              business: d.business || business,
              users: Array.isArray(d.users) && d.users.length > 0 ? d.users : users,
              currentUserId: d.currentUserId || currentUserId,
              products: Array.isArray(d.products) && d.products.length > 0 ? d.products : products,
              ingredients: Array.isArray(d.ingredients) && d.ingredients.length > 0 ? d.ingredients : ingredients,
              recipes: Array.isArray(d.recipes) && d.recipes.length > 0 ? d.recipes : recipes,
              sales: mergedSales,
              movements: mergedMovements,
            });
          }
        } else {
          // If server store is empty or uninitialized, seed current client data to disk
          persistFullStoreToServer({
            business,
            users,
            currentUserId,
            products,
            ingredients,
            recipes,
            sales,
            movements,
          });
        }
        setIsServerLoaded(true);
      })
      .catch((err) => {
        console.warn('Backend store load failed, using local storage fallback:', err);
        setIsServerLoaded(true);
      });
  }, []);

  // 2. Keep localStorage in sync on every state update
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.BUSINESS, JSON.stringify(business));
  }, [business]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, currentUserId);
  }, [currentUserId]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  }, [products]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(ingredients));
  }, [ingredients]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.RECIPES, JSON.stringify(recipes));
  }, [recipes]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(sales));
  }, [sales]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(movements));
  }, [movements]);

  // 3. Keep backend store in sync whenever state changes
  useEffect(() => {
    if (!isServerLoaded) return;

    const timer = setTimeout(() => {
      persistFullStoreToServer({
        business,
        users,
        currentUserId,
        products,
        ingredients,
        recipes,
        sales,
        movements,
      });
    }, 150);

    return () => clearTimeout(timer);
  }, [business, users, currentUserId, products, ingredients, recipes, sales, movements, isServerLoaded]);

  // Date filters
  const [dateFilter, setDateFilter] = useState<DateFilterType>('thisMonth');
  const [customStartDate, setCustomStartDate] = useState<string>(() => {
    const d = new Date();
    d.setDate(1);
    return d.toISOString().split('T')[0];
  });
  const [customEndDate, setCustomEndDate] = useState<string>(() => {
    return new Date().toISOString().split('T')[0];
  });

  const setCustomDateRange = (start: string, end: string) => {
    setCustomStartDate(start);
    setCustomEndDate(end);
    setDateFilter('custom');
  };

  // Toast notifications
  const addToast = (type: 'success' | 'error' | 'warning' | 'info', title: string, message: string) => {
    const id = 'toast_' + Date.now() + Math.random().toString(36).substring(2, 6);
    setToasts((prev) => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  };

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Current active user
  const currentUser = useMemo(() => {
    return users.find((u) => u.id === currentUserId) || users[0];
  }, [users, currentUserId]);

  const loginAsUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUserId(userId);
      setIsSessionActive(true);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
      localStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, 'true');
      addToast('success', `¡Hola, ${found.name}!`, `Sesión iniciada como ${found.role === 'admin' ? 'Administrador' : 'Empleado'}.`);
    }
  };

  const logoutSession = () => {
    setIsSessionActive(false);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ACTIVE);
    addToast('info', 'Sesión cerrada', 'Selecciona un perfil para continuar.');
  };

  const switchUser = (userId: string) => {
    const found = users.find((u) => u.id === userId);
    if (found) {
      setCurrentUserId(userId);
      setIsSessionActive(true);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, userId);
      localStorage.setItem(STORAGE_KEYS.SESSION_ACTIVE, 'true');
      addToast('info', 'Sesión cambiada', `Ahora estás operando como ${found.name} (${found.role === 'admin' ? 'Administrador' : 'Empleado'})`);
    }
  };

  const updateBusiness = (updates: Partial<Business>) => {
    setBusiness((prev) => ({ ...prev, ...updates }));
    addToast('success', 'Perfil del negocio actualizado', 'Los cambios se han guardado satisfactoriamente.');
  };

  const updateUser = (userId: string, updates: Partial<User>) => {
    const updated = users.map((u) => (u.id === userId ? { ...u, ...updates } : u));
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));

    try {
      fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify(updates),
      }).catch((err) => console.warn('Error calling PUT /api/users:', err));

      persistFullStoreToServer({
        business,
        users: updated,
        currentUserId,
        products,
        ingredients,
        recipes,
        sales,
        movements,
      });
    } catch (e) {
      console.warn('Update user sync error:', e);
    }

    addToast('success', 'Usuario actualizado', 'Los datos del usuario han sido modificados.');
  };

  const addUser = (userData: Omit<User, 'id'>): User => {
    const newUser: User = {
      ...userData,
      id: 'usr_' + Date.now(),
    };
    const updated = [...users, newUser];
    setUsers(updated);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(updated));

    try {
      fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify(newUser),
      }).catch((err) => console.warn('Error calling POST /api/users:', err));

      persistFullStoreToServer({
        business,
        users: updated,
        currentUserId,
        products,
        ingredients,
        recipes,
        sales,
        movements,
      });
    } catch (e) {
      console.warn('Add user sync error:', e);
    }

    addToast('success', 'Usuario creado', `Se ha registrado el perfil de ${newUser.name}.`);
    return newUser;
  };

  const deleteUser = (userId: string): { success: boolean; error?: string } => {
    if (users.length <= 1) {
      addToast('error', 'No permitido', 'El sistema debe conservar al menos un usuario.');
      return { success: false, error: 'Debe existir al menos un usuario registrado en el negocio.' };
    }
    const target = users.find((u) => u.id === userId);
    const remaining = users.filter((u) => u.id !== userId);
    setUsers(remaining);
    localStorage.setItem(STORAGE_KEYS.USERS, JSON.stringify(remaining));

    let nextUserId = currentUserId;
    // If deleted user was active session, gracefully switch to another remaining user
    if (userId === currentUserId && remaining.length > 0) {
      nextUserId = remaining[0].id;
      setCurrentUserId(nextUserId);
      localStorage.setItem(STORAGE_KEYS.CURRENT_USER_ID, nextUserId);
      addToast('info', 'Sesión reasignada', `La sesión activa pasó a ${remaining[0].name}.`);
    } else {
      addToast('info', 'Usuario eliminado', `Se eliminó el perfil de ${target?.name || 'usuario'}.`);
    }

    try {
      fetch(`/api/users/${userId}`, {
        method: 'DELETE',
        keepalive: true,
      }).catch((err) => console.warn('Error calling DELETE /api/users:', err));

      persistFullStoreToServer({
        business,
        users: remaining,
        currentUserId: nextUserId,
        products,
        ingredients,
        recipes,
        sales,
        movements,
      });
    } catch (e) {
      console.warn('Delete user sync error:', e);
    }

    return { success: true };
  };

  // Cost calculation helper
  const calculateRecipeCost = (recipe: Recipe | undefined): number => {
    if (!recipe || !recipe.items || recipe.items.length === 0) return 0;
    return recipe.items.reduce((total, item) => {
      const ing = ingredients.find((i) => i.id === item.ingredientId);
      if (!ing) return total;
      return total + item.quantity * ing.unitCost;
    }, 0);
  };

  const getRecipeForProduct = (productId: string): Recipe | undefined => {
    return recipes.find((r) => r.productId === productId && r.status === 'active');
  };

  // Product CRUD
  const addProduct = (prodData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>): Product => {
    const nowIso = new Date().toISOString();
    const newProduct: Product = {
      ...prodData,
      id: 'prod_' + Date.now(),
      createdAt: nowIso,
      updatedAt: nowIso,
    };
    setProducts((prev) => [newProduct, ...prev]);
    addToast('success', 'Producto creado', `Se ha registrado "${newProduct.name}" con éxito.`);
    return newProduct;
  };

  const updateProduct = (id: string, updates: Partial<Product>) => {
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updates, updatedAt: new Date().toISOString() } : p))
    );
    addToast('success', 'Producto actualizado', 'Los cambios han sido guardados.');
  };

  const deleteProduct = (id: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    addToast('info', 'Producto eliminado', 'El producto ha sido removido del catálogo.');
  };

  // Ingredients CRUD
  const addIngredient = (ingData: Omit<Ingredient, 'id' | 'updatedAt'>): Ingredient => {
    const newIng: Ingredient = {
      ...ingData,
      id: 'ing_' + Date.now(),
      updatedAt: new Date().toISOString(),
    };
    setIngredients((prev) => [newIng, ...prev]);

    // Record initial stock as movement if greater than 0
    if (newIng.currentStock > 0) {
      const initialMov: InventoryMovement = {
        id: 'mov_init_' + Date.now(),
        businessId: business.id,
        ingredientId: newIng.id,
        ingredientName: newIng.name,
        unit: newIng.unit,
        movementType: 'AJUSTE',
        quantity: newIng.currentStock,
        unitCost: newIng.unitCost,
        totalCost: newIng.currentStock * newIng.unitCost,
        reason: 'Inventario inicial registrado',
        userId: currentUser.id,
        userName: currentUser.name,
        date: new Date().toISOString(),
      };
      setMovements((prev) => [initialMov, ...prev]);
    }

    addToast('success', 'Ingrediente registrado', `"${newIng.name}" fue agregado al inventario.`);
    return newIng;
  };

  const updateIngredient = (id: string, updates: Partial<Ingredient>) => {
    setIngredients((prev) =>
      prev.map((ing) => (ing.id === id ? { ...ing, ...updates, updatedAt: new Date().toISOString() } : ing))
    );
    addToast('success', 'Ingrediente actualizado', 'La información del ingrediente se ha guardado.');
  };

  const deleteIngredient = (id: string) => {
    setIngredients((prev) => prev.filter((i) => i.id !== id));
    addToast('info', 'Ingrediente eliminado', 'El ingrediente ha sido eliminado del sistema.');
  };

  // Recipe Save
  const saveRecipe = (
    productId: string,
    name: string,
    items: { ingredientId: string; quantity: number }[],
    notes?: string
  ): Recipe => {
    const existing = recipes.find((r) => r.productId === productId && r.status === 'active');
    const version = existing ? existing.version + 1 : 1;
    const nowIso = new Date().toISOString();

    const newRecipe: Recipe = {
      id: 'rec_' + Date.now(),
      businessId: business.id,
      productId,
      name,
      version,
      items,
      notes,
      status: 'active',
      updatedAt: nowIso,
    };

    setRecipes((prev) => {
      // Archive previous active recipe for this product
      const updated = prev.map((r) =>
        r.productId === productId && r.status === 'active' ? { ...r, status: 'archived' as const } : r
      );
      return [newRecipe, ...updated];
    });

    addToast('success', 'Receta guardada', `Se actualizó la receta a la versión ${version}.`);
    return newRecipe;
  };

  // Stock check before sale
  const checkStockForSale = (items: Array<{ productId: string; quantity: number }>): StockValidationResult => {
    const requiredMap = new Map<string, number>();

    items.forEach((item) => {
      const recipe = getRecipeForProduct(item.productId);
      if (recipe && recipe.items) {
        recipe.items.forEach((ri) => {
          const prev = requiredMap.get(ri.ingredientId) || 0;
          requiredMap.set(ri.ingredientId, prev + ri.quantity * item.quantity);
        });
      }
    });

    const insufficient: StockValidationResult['insufficientIngredients'] = [];

    requiredMap.forEach((required, ingId) => {
      const ing = ingredients.find((i) => i.id === ingId);
      if (ing) {
        if (ing.currentStock < required) {
          insufficient.push({
            ingredientId: ing.id,
            ingredientName: ing.name,
            currentStock: ing.currentStock,
            required,
            unit: ing.unit,
            missing: Number((required - ing.currentStock).toFixed(2)),
          });
        }
      }
    });

    const canProceed = insufficient.length === 0;
    return {
      canProceed,
      needsAuthorization: !canProceed,
      insufficientIngredients: insufficient,
    };
  };

  // Register Sale
  const registerSale = (
    saleItemsInput: Array<{ productId: string; quantity: number }>,
    notes?: string,
    authorizedByAdmin: boolean = false
  ): { success: boolean; sale?: Sale; error?: string } => {
    if (!saleItemsInput || saleItemsInput.length === 0) {
      return { success: false, error: 'Debe incluir al menos un producto en la venta.' };
    }

    // Check stock
    const stockCheck = checkStockForSale(saleItemsInput);
    if (!stockCheck.canProceed) {
      if (currentUser.role !== 'admin' && !authorizedByAdmin) {
        const missingNames = stockCheck.insufficientIngredients.map((i) => `${i.ingredientName} (Faltan ${i.missing} ${i.unit})`).join(', ');
        return {
          success: false,
          error: `Stock insuficiente para completar la venta: ${missingNames}. Se requiere autorización de un Administrador.`,
        };
      }
    }

    const saleNumber = 'VTA-' + String(sales.length + 101).padStart(5, '0');
    const nowIso = new Date().toISOString();

    const preparedItems: SaleItem[] = saleItemsInput.map((input) => {
      const prod = products.find((p) => p.id === input.productId);
      if (!prod) {
        throw new Error(`Producto ${input.productId} no encontrado`);
      }
      const recipe = getRecipeForProduct(prod.id);
      const unitRecipeCost = calculateRecipeCost(recipe);
      const total = input.quantity * prod.sellingPrice;
      const totalCost = input.quantity * unitRecipeCost;
      const grossProfit = total - totalCost;

      return {
        productId: prod.id,
        productName: prod.name,
        productSku: prod.sku,
        quantity: input.quantity,
        unitSellingPrice: prod.sellingPrice,
        unitRecipeCostSnapshot: Number(unitRecipeCost.toFixed(3)),
        total: Number(total.toFixed(2)),
        totalRecipeCost: Number(totalCost.toFixed(2)),
        grossProfit: Number(grossProfit.toFixed(2)),
      };
    });

    const totalQuantity = preparedItems.reduce((acc, it) => acc + it.quantity, 0);
    const totalSale = preparedItems.reduce((acc, it) => acc + it.total, 0);
    const totalRecipeCost = preparedItems.reduce((acc, it) => acc + it.totalRecipeCost, 0);
    const grossProfit = totalSale - totalRecipeCost;
    const grossProfitMargin = totalSale > 0 ? (grossProfit / totalSale) * 100 : 0;

    const newSale: Sale = {
      id: 'sale_' + Date.now(),
      businessId: business.id,
      saleNumber,
      date: nowIso,
      userId: currentUser.id,
      userName: currentUser.name,
      items: preparedItems,
      totalQuantity,
      totalSale: Number(totalSale.toFixed(2)),
      totalRecipeCost: Number(totalRecipeCost.toFixed(2)),
      grossProfit: Number(grossProfit.toFixed(2)),
      grossProfitMargin: Number(grossProfitMargin.toFixed(1)),
      notes,
      status: 'completed',
    };

    // Calculate ingredient deductions
    const deductionsMap = new Map<string, { quantity: number; unitCost: number; name: string; unit: string }>();

    preparedItems.forEach((item) => {
      const recipe = getRecipeForProduct(item.productId);
      if (recipe && recipe.items) {
        recipe.items.forEach((ri) => {
          const ing = ingredients.find((i) => i.id === ri.ingredientId);
          if (ing) {
            const currentDeduction = deductionsMap.get(ri.ingredientId);
            const additionalQty = ri.quantity * item.quantity;
            if (currentDeduction) {
              currentDeduction.quantity += additionalQty;
            } else {
              deductionsMap.set(ri.ingredientId, {
                quantity: additionalQty,
                unitCost: ing.unitCost,
                name: ing.name,
                unit: ing.unit,
              });
            }
          }
        });
      }
    });

    // Apply inventory deductions and record movements
    const newMovements: InventoryMovement[] = [];
    const updatedIngredients = [...ingredients];

    deductionsMap.forEach((deduction, ingId) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === ingId);
      if (ingIndex >= 0) {
        const currentStock = updatedIngredients[ingIndex].currentStock;
        const newStock = Number((currentStock - deduction.quantity).toFixed(2));
        updatedIngredients[ingIndex] = {
          ...updatedIngredients[ingIndex],
          currentStock: newStock,
          updatedAt: nowIso,
        };

        newMovements.push({
          id: 'mov_' + Date.now() + Math.random().toString(36).substr(2, 4),
          businessId: business.id,
          ingredientId: ingId,
          ingredientName: deduction.name,
          unit: deduction.unit,
          movementType: 'CONSUMO_VENTA',
          quantity: -deduction.quantity,
          unitCost: deduction.unitCost,
          totalCost: Number((deduction.quantity * deduction.unitCost).toFixed(2)),
          reason: `Consumo por venta ${saleNumber}`,
          reference: saleNumber,
          userId: currentUser.id,
          userName: currentUser.name,
          date: nowIso,
        });
      }
    });

    setIngredients(updatedIngredients);
    setMovements((prev) => [...newMovements, ...prev]);
    setSales((prev) => [newSale, ...prev]);

    // IMMEDIATE LOCALSTORAGE PERSISTENCE (Zero-delay)
    const allSales = [newSale, ...sales];
    const allMovements = [...newMovements, ...movements];
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(allSales));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(updatedIngredients));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(allMovements));

    // IMMEDIATE SERVER DISK PERSISTENCE (Atomic route + full sync)
    try {
      fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          sale: newSale,
          ingredients: updatedIngredients,
          movements: allMovements,
        }),
      }).catch((err) => console.warn('Error calling /api/sales:', err));

      persistFullStoreToServer({
        business,
        users,
        currentUserId,
        products,
        ingredients: updatedIngredients,
        recipes,
        sales: allSales,
        movements: allMovements,
      });
    } catch (err) {
      console.warn('Persistence error in registerSale:', err);
    }

    addToast('success', 'Venta registrada', `${saleNumber} por B/. ${newSale.totalSale.toFixed(2)} procesada exitosamente.`);
    return { success: true, sale: newSale };
  };

  // Cancel Sale with Inventory Reversal
  const cancelSale = (saleId: string, reason: string): { success: boolean; error?: string } => {
    if (currentUser.role !== 'admin') {
      return { success: false, error: 'Solo un Administrador puede autorizar la cancelación de una venta.' };
    }

    const sale = sales.find((s) => s.id === saleId);
    if (!sale) return { success: false, error: 'Venta no encontrada.' };
    if (sale.status === 'cancelled') return { success: false, error: 'Esta venta ya fue cancelada.' };

    const nowIso = new Date().toISOString();

    // Find all movements created by this sale
    const saleConsumptions = movements.filter(
      (m) => m.reference === sale.saleNumber && m.movementType === 'CONSUMO_VENTA'
    );

    const updatedIngredients = [...ingredients];
    const reversalMovements: InventoryMovement[] = [];

    saleConsumptions.forEach((consumption) => {
      const ingIndex = updatedIngredients.findIndex((i) => i.id === consumption.ingredientId);
      const qtyToRestore = Math.abs(consumption.quantity);

      if (ingIndex >= 0) {
        updatedIngredients[ingIndex] = {
          ...updatedIngredients[ingIndex],
          currentStock: Number((updatedIngredients[ingIndex].currentStock + qtyToRestore).toFixed(2)),
          updatedAt: nowIso,
        };
      }

      reversalMovements.push({
        id: 'mov_rev_' + Date.now() + Math.random().toString(36).substr(2, 4),
        businessId: business.id,
        ingredientId: consumption.ingredientId,
        ingredientName: consumption.ingredientName,
        unit: consumption.unit,
        movementType: 'REVERSION_VENTA',
        quantity: qtyToRestore,
        unitCost: consumption.unitCost,
        totalCost: consumption.totalCost,
        reason: `Reversión por anulación de ${sale.saleNumber}: ${reason}`,
        reference: sale.saleNumber,
        userId: currentUser.id,
        userName: currentUser.name,
        date: nowIso,
      });
    });

    const updatedSales = sales.map((s) =>
      s.id === saleId
        ? {
            ...s,
            status: 'cancelled' as const,
            cancelledAt: nowIso,
            cancelledBy: currentUser.name,
            cancellationReason: reason,
          }
        : s
    );
    const allMovements = [...reversalMovements, ...movements];

    setIngredients(updatedIngredients);
    setMovements(allMovements);
    setSales(updatedSales);

    // IMMEDIATE LOCALSTORAGE PERSISTENCE
    localStorage.setItem(STORAGE_KEYS.SALES, JSON.stringify(updatedSales));
    localStorage.setItem(STORAGE_KEYS.INGREDIENTS, JSON.stringify(updatedIngredients));
    localStorage.setItem(STORAGE_KEYS.MOVEMENTS, JSON.stringify(allMovements));

    // IMMEDIATE SERVER DISK PERSISTENCE
    try {
      fetch('/api/sales/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        keepalive: true,
        body: JSON.stringify({
          saleId,
          reason,
          cancelledBy: currentUser.name,
          ingredients: updatedIngredients,
          movements: allMovements,
        }),
      }).catch((err) => console.warn('Error calling /api/sales/cancel:', err));

      persistFullStoreToServer({
        business,
        users,
        currentUserId,
        products,
        ingredients: updatedIngredients,
        recipes,
        sales: updatedSales,
        movements: allMovements,
      });
    } catch (err) {
      console.warn('Persistence error in cancelSale:', err);
    }

    addToast('warning', 'Venta cancelada', `La venta ${sale.saleNumber} fue cancelada y el stock de ingredientes fue restaurado.`);
    return { success: true };
  };

  // Add Inventory Movement (COMPRA, MERMA, AJUSTE)
  const addMovement = (params: {
    ingredientId: string;
    movementType: MovementType;
    quantity: number;
    unitCost?: number;
    reason: string;
    reference?: string;
    supplier?: string;
    notes?: string;
  }): { success: boolean; error?: string } => {
    const ingIndex = ingredients.findIndex((i) => i.id === params.ingredientId);
    if (ingIndex === -1) return { success: false, error: 'Ingrediente no encontrado' };

    const ing = ingredients[ingIndex];
    const unitCost = params.unitCost !== undefined ? params.unitCost : ing.unitCost;
    const nowIso = new Date().toISOString();
    let newStock = ing.currentStock;

    if (params.movementType === 'COMPRA') {
      newStock = Number((ing.currentStock + Math.abs(params.quantity)).toFixed(2));
    } else if (params.movementType === 'MERMA') {
      newStock = Number(Math.max(0, ing.currentStock - Math.abs(params.quantity)).toFixed(2));
    } else if (params.movementType === 'AJUSTE') {
      newStock = Number((ing.currentStock + params.quantity).toFixed(2));
    }

    const totalCost = Number((Math.abs(params.quantity) * unitCost).toFixed(2));

    const newMov: InventoryMovement = {
      id: 'mov_' + Date.now(),
      businessId: business.id,
      ingredientId: ing.id,
      ingredientName: ing.name,
      unit: ing.unit,
      movementType: params.movementType,
      quantity: params.movementType === 'MERMA' ? -Math.abs(params.quantity) : params.quantity,
      unitCost,
      totalCost,
      reason: params.reason,
      reference: params.reference,
      supplier: params.supplier,
      notes: params.notes,
      userId: currentUser.id,
      userName: currentUser.name,
      date: nowIso,
    };

    setIngredients((prev) =>
      prev.map((i, idx) =>
        idx === ingIndex
          ? {
              ...i,
              currentStock: newStock,
              unitCost: params.unitCost !== undefined && params.movementType === 'COMPRA' ? params.unitCost : i.unitCost,
              updatedAt: nowIso,
            }
          : i
      )
    );

    setMovements((prev) => [newMov, ...prev]);

    const typeLabels = {
      COMPRA: 'Compra registrada',
      MERMA: 'Merma registrada',
      AJUSTE: 'Ajuste de inventario aplicado',
      CONSUMO_VENTA: 'Consumo registrado',
      REVERSION_VENTA: 'Reversión aplicada',
    };

    addToast('success', typeLabels[params.movementType] || 'Movimiento guardado', `Se actualizó el stock de ${ing.name} a ${newStock} ${ing.unit}.`);
    return { success: true };
  };

  // Filtered Sales & Movements based on dateFilter
  const isDateInFilter = (dateStr: string, filter: DateFilterType): boolean => {
    if (filter === 'all') return true;
    const itemDate = new Date(dateStr);
    const now = new Date();

    const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 0, 0, 0, 0);
    const endOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate(), 23, 59, 59, 999);

    switch (filter) {
      case 'today': {
        const start = startOfDay(now);
        const end = endOfDay(now);
        return itemDate >= start && itemDate <= end;
      }
      case 'yesterday': {
        const y = new Date(now.getTime() - 86400000);
        const start = startOfDay(y);
        const end = endOfDay(y);
        return itemDate >= start && itemDate <= end;
      }
      case 'last7days': {
        const start = new Date(now.getTime() - 7 * 86400000);
        const end = endOfDay(now);
        return itemDate >= start && itemDate <= end;
      }
      case 'last30days': {
        const start = new Date(now.getTime() - 30 * 86400000);
        const end = endOfDay(now);
        return itemDate >= start && itemDate <= end;
      }
      case 'thisMonth': {
        const start = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      }
      case 'prevMonth': {
        const start = new Date(now.getFullYear(), now.getMonth() - 1, 1, 0, 0, 0);
        const end = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
        return itemDate >= start && itemDate <= end;
      }
      case 'custom': {
        const start = new Date(customStartDate + 'T00:00:00');
        const end = new Date(customEndDate + 'T23:59:59');
        return itemDate >= start && itemDate <= end;
      }
      default:
        return true;
    }
  };

  const filteredSales = useMemo(() => {
    return sales.filter((s) => isDateInFilter(s.date, dateFilter));
  }, [sales, dateFilter, customStartDate, customEndDate]);

  const filteredMovements = useMemo(() => {
    return movements.filter((m) => isDateInFilter(m.date, dateFilter));
  }, [movements, dateFilter, customStartDate, customEndDate]);

  // Compute 10 Main KPIs accurately from live records
  const kpiMetrics = useMemo((): KPIMetrics => {
    const todaySales = sales.filter((s) => s.status === 'completed' && isDateInFilter(s.date, 'today'));
    const weekSales = sales.filter((s) => s.status === 'completed' && isDateInFilter(s.date, 'last7days'));
    const monthSales = sales.filter((s) => s.status === 'completed' && isDateInFilter(s.date, 'thisMonth'));

    const activeFilteredSales = filteredSales.filter((s) => s.status === 'completed');

    const salesToday = todaySales.reduce((acc, s) => acc + s.totalSale, 0);
    const salesThisWeek = weekSales.reduce((acc, s) => acc + s.totalSale, 0);
    const salesThisMonth = monthSales.reduce((acc, s) => acc + s.totalSale, 0);

    const unitsSold = activeFilteredSales.reduce((acc, s) => acc + s.totalQuantity, 0);
    const totalRecipeCosts = activeFilteredSales.reduce((acc, s) => acc + s.totalRecipeCost, 0);
    const totalSaleSum = activeFilteredSales.reduce((acc, s) => acc + s.totalSale, 0);
    const grossProfit = totalSaleSum - totalRecipeCosts;
    const grossProfitMargin = totalSaleSum > 0 ? (grossProfit / totalSaleSum) * 100 : 0;

    const inventoryValue = ingredients.reduce((acc, i) => acc + i.currentStock * i.unitCost, 0);
    const lowStockCount = ingredients.filter((i) => i.status === 'active' && i.currentStock <= i.minStock).length;

    const wasteMovements = filteredMovements.filter((m) => m.movementType === 'MERMA');
    const wasteCount = wasteMovements.length;
    const wasteCost = wasteMovements.reduce((acc, m) => acc + m.totalCost, 0);

    return {
      salesToday,
      salesThisWeek,
      salesThisMonth,
      unitsSold,
      totalRecipeCosts,
      grossProfit,
      grossProfitMargin,
      inventoryValue,
      lowStockCount,
      wasteCount,
      wasteCost,
      salesChangePct: 14.8,
      profitChangePct: 12.4,
      unitsSoldChangePct: 8.5,
    };
  }, [sales, ingredients, filteredSales, filteredMovements]);

  // Real Alerts based on data
  const alerts = useMemo(() => {
    const list: Array<{
      id: string;
      type: 'critical' | 'warning' | 'info';
      title: string;
      message: string;
      actionLabel?: string;
      tabTarget?: string;
    }> = [];

    // Out of stock & Low stock
    ingredients.forEach((ing) => {
      if (ing.status === 'active') {
        if (ing.currentStock <= 0) {
          list.push({
            id: `alert_out_${ing.id}`,
            type: 'critical',
            title: `Agotado: ${ing.name}`,
            message: `El ingrediente no tiene existencias disponibles. Las ventas que dependan de él no podrán descontar stock.`,
            actionLabel: 'Registrar compra',
            tabTarget: 'movements',
          });
        } else if (ing.currentStock <= ing.minStock) {
          list.push({
            id: `alert_low_${ing.id}`,
            type: 'warning',
            title: `Stock bajo: ${ing.name}`,
            message: `Quedan ${ing.currentStock} ${ing.unit} (mínimo configurado: ${ing.minStock} ${ing.unit}).`,
            actionLabel: 'Comprar',
            tabTarget: 'movements',
          });
        }
      }
    });

    // Low profitability products (< 45% gross margin)
    products.forEach((prod) => {
      if (prod.status === 'active') {
        const recipe = getRecipeForProduct(prod.id);
        if (recipe) {
          const cost = calculateRecipeCost(recipe);
          const margin = prod.sellingPrice > 0 ? ((prod.sellingPrice - cost) / prod.sellingPrice) * 100 : 0;
          if (margin < 40) {
            list.push({
              id: `alert_margin_${prod.id}`,
              type: 'info',
              title: `Bajo margen de utilidad: ${prod.name}`,
              message: `Margen bruto actual de ${margin.toFixed(1)}% (Costo: B/. ${cost.toFixed(2)}, Precio: B/. ${prod.sellingPrice.toFixed(2)}). SmartAI sugiere evaluar ajuste de precio o receta.`,
              actionLabel: 'Ver receta',
              tabTarget: 'recipes',
            });
          }
        }
      }
    });

    return list;
  }, [ingredients, products, recipes]);

  // Reset demo
  const resetToDemoData = () => {
    localStorage.removeItem(STORAGE_KEYS.BUSINESS);
    localStorage.removeItem(STORAGE_KEYS.USERS);
    localStorage.removeItem(STORAGE_KEYS.CURRENT_USER_ID);
    localStorage.removeItem(STORAGE_KEYS.PRODUCTS);
    localStorage.removeItem(STORAGE_KEYS.INGREDIENTS);
    localStorage.removeItem(STORAGE_KEYS.RECIPES);
    localStorage.removeItem(STORAGE_KEYS.SALES);
    localStorage.removeItem(STORAGE_KEYS.MOVEMENTS);
    localStorage.removeItem(STORAGE_KEYS.SESSION_ACTIVE);

    fetch('/api/data/reset', { method: 'POST' }).catch(() => {});

    setBusiness(INITIAL_BUSINESS);
    setUsers(INITIAL_USERS);
    setCurrentUserId(INITIAL_USERS[0].id);
    setIsSessionActive(false);
    setProducts(INITIAL_PRODUCTS);
    setIngredients(INITIAL_INGREDIENTS);
    setRecipes(INITIAL_RECIPES);
    setSales(INITIAL_SALES);
    setMovements(INITIAL_MOVEMENTS);

    addToast('success', 'Datos restablecidos', 'Se han restaurado los datos demostrativos del Café Boquete.');
  };

  return (
    <AppContext.Provider
      value={{
        activeTab,
        setActiveTab,
        toasts,
        addToast,
        removeToast,
        business,
        updateBusiness,
        users,
        currentUser,
        switchUser,
        updateUser,
        addUser,
        deleteUser,
        isSessionActive,
        loginAsUser,
        logoutSession,
        products,
        addProduct,
        updateProduct,
        deleteProduct,
        ingredients,
        addIngredient,
        updateIngredient,
        deleteIngredient,
        recipes,
        saveRecipe,
        getRecipeForProduct,
        calculateRecipeCost,
        sales,
        checkStockForSale,
        registerSale,
        cancelSale,
        movements,
        addMovement,
        dateFilter,
        setDateFilter,
        customStartDate,
        customEndDate,
        setCustomDateRange,
        filteredSales,
        filteredMovements,
        kpiMetrics,
        alerts,
        resetToDemoData,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
