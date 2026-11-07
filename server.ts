import express from 'express';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import dotenv from 'dotenv';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const DATA_DIR = path.resolve(__dirname, 'data');
const STORE_FILE = path.resolve(DATA_DIR, 'store.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Function to read server store
function readStore() {
  try {
    if (fs.existsSync(STORE_FILE)) {
      const content = fs.readFileSync(STORE_FILE, 'utf-8');
      return JSON.parse(content);
    }
  } catch (err) {
    console.error('Error reading store.json:', err);
  }
  return null;
}

// Function to write server store
function writeStore(data: any) {
  try {
    fs.writeFileSync(STORE_FILE, JSON.stringify(data, null, 2), 'utf-8');
    return true;
  } catch (err) {
    console.error('Error writing store.json:', err);
    return false;
  }
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // API Health / Status
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'ok',
      service: 'SmartPyme API',
      aiAvailable: Boolean(process.env.GEMINI_API_KEY),
      hasPersistedStore: fs.existsSync(STORE_FILE),
      time: new Date().toISOString(),
    });
  });

  // Persistent State API: GET
  app.get('/api/data', (_req, res) => {
    const store = readStore();
    if (store) {
      res.json({ success: true, data: store });
    } else {
      res.json({ success: false, data: null });
    }
  });

  // Persistent State API: POST (Full store save)
  app.post('/api/data', (req, res) => {
    const data = req.body;
    if (!data || typeof data !== 'object') {
      res.status(400).json({ success: false, error: 'Datos no válidos' });
      return;
    }
    const ok = writeStore(data);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Error al persistir en disco' });
    }
  });

  // Dedicated Sales Persistence: POST /api/sales
  app.post('/api/sales', (req, res) => {
    const { sale, ingredients, movements } = req.body;
    if (!sale || !sale.id) {
      res.status(400).json({ success: false, error: 'Venta no válida' });
      return;
    }
    const store = readStore() || {};
    const currentSales = Array.isArray(store.sales) ? store.sales : [];
    // Prepend new sale (deduplicating by id)
    const exists = currentSales.some((s: any) => s.id === sale.id);
    const updatedSales = exists
      ? currentSales.map((s: any) => (s.id === sale.id ? sale : s))
      : [sale, ...currentSales];
    
    store.sales = updatedSales;

    if (Array.isArray(ingredients)) {
      store.ingredients = ingredients;
    }
    if (Array.isArray(movements)) {
      store.movements = movements;
    }

    const ok = writeStore(store);
    if (ok) {
      res.json({ success: true, count: store.sales.length, sale });
    } else {
      res.status(500).json({ success: false, error: 'Error al guardar venta en disco' });
    }
  });

  // Dedicated Sale Cancellation: POST /api/sales/cancel
  app.post('/api/sales/cancel', (req, res) => {
    const { saleId, reason, cancelledBy, ingredients, movements } = req.body;
    if (!saleId) {
      res.status(400).json({ success: false, error: 'ID de venta requerido' });
      return;
    }
    const store = readStore() || {};
    if (Array.isArray(store.sales)) {
      store.sales = store.sales.map((s: any) =>
        s.id === saleId
          ? {
              ...s,
              status: 'cancelled',
              cancellationReason: reason,
              cancelledBy: cancelledBy || 'Administrador',
              cancelledAt: new Date().toISOString(),
            }
          : s
      );
    }
    if (Array.isArray(ingredients)) {
      store.ingredients = ingredients;
    }
    if (Array.isArray(movements)) {
      store.movements = movements;
    }
    const ok = writeStore(store);
    if (ok) {
      res.json({ success: true });
    } else {
      res.status(500).json({ success: false, error: 'Error cancelando venta' });
    }
  });

  // Dedicated Users Endpoints
  app.post('/api/users', (req, res) => {
    const user = req.body;
    if (!user || !user.name) {
      res.status(400).json({ success: false, error: 'Usuario no válido' });
      return;
    }
    const store = readStore() || {};
    const currentUsers = Array.isArray(store.users) ? store.users : [];
    store.users = [...currentUsers, user];
    writeStore(store);
    res.json({ success: true, user });
  });

  app.put('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const updates = req.body;
    const store = readStore() || {};
    if (Array.isArray(store.users)) {
      store.users = store.users.map((u: any) => (u.id === id ? { ...u, ...updates } : u));
      writeStore(store);
    }
    res.json({ success: true });
  });

  app.delete('/api/users/:id', (req, res) => {
    const { id } = req.params;
    const store = readStore() || {};
    if (Array.isArray(store.users)) {
      store.users = store.users.filter((u: any) => u.id !== id);
      writeStore(store);
    }
    res.json({ success: true });
  });

  // Reset API: POST
  app.post('/api/data/reset', (_req, res) => {
    try {
      if (fs.existsSync(STORE_FILE)) {
        fs.unlinkSync(STORE_FILE);
      }
      res.json({ success: true, message: 'Datos restablecidos en el servidor' });
    } catch (err: any) {
      res.status(500).json({ success: false, error: err.message });
    }
  });

  // SmartAI Chat endpoint
  app.post('/api/smart-ai', async (req, res) => {
    try {
      const { message, context } = req.body;

      if (!message || typeof message !== 'string') {
        res.status(400).json({ error: 'Mensaje requerido' });
        return;
      }

      const apiKey = process.env.GEMINI_API_KEY;

      if (!apiKey) {
        res.json({
          reply: `SmartAI está operando en modo local (sin clave GEMINI_API_KEY configurada en el servidor). 
Análisis de datos actuales de ${context?.businessName || 'tu negocio'}:
• Ventas registradas hoy: B/. ${(context?.kpis?.salesToday || 0).toFixed(2)}
• Margen bruto general: ${(context?.kpis?.grossMargin || 0).toFixed(1)}%
• Alertas de stock bajo: ${context?.kpis?.lowStockCount || 0} ingredientes
• Productos activos: ${context?.productsCount || 0}

Para activar análisis predictivo avanzado con Gemini 3.8 Flash, configure la clave de API en las variables de entorno.`,
          isFallback: true,
        });
        return;
      }

      const ai = new GoogleGenAI({ apiKey });

      const systemInstruction = `Eres SmartAI, el asistente experto en negocios de SmartPyme (“Tu negocio, bajo control”).
Tu rol es ayudar a pequeños empresarios, cafés y restaurantes en Panamá a optimizar sus operaciones, rentabilidad, inventario y recetas.

REGLAS ESTRICTAS:
1. Usa ÚNICAMENTE los datos reales provistos en el contexto de negocio adjunto. NUNCA inventes números, ventas, costos ni niveles de stock.
2. Si los datos son insuficientes o no hay suficientes registros para responder una pregunta con certeza, dilo claramente.
3. Moneda: Balboas panameños (B/.) equivalentes a USD. Formato de fecha: DD/MM/YYYY.
4. Explica siempre cómo se calcularon las recomendaciones (fórmulas, diferencias de margen).
5. Recuerda que la utilidad calculada es UTILIDAD BRUTA (Precio de venta - Costo de ingredientes de receta). No asumas que es utilidad neta, ya que no incluye alquiler, planilla ni servicios públicos.
6. Da recomendaciones accionables, amigables, concisas y elegantes, acordes a la filosofía de diseño y simplicidad de SmartPyme.
7. Responde siempre en español.

DATOS EN TIEMPO REAL DEL NEGOCIO:
${JSON.stringify(context, null, 2)}
`;

      const response = await ai.models.generateContent({
        model: 'gemini-3.8-flash',
        contents: [
          {
            role: 'user',
            parts: [
              {
                text: `${systemInstruction}\n\nPregunta del usuario: ${message}`,
              },
            ],
          },
        ],
      });

      const reply = response.text || 'No fue posible generar una recomendación en este momento.';
      res.json({ reply, isFallback: false });
    } catch (err: any) {
      console.error('Error en /api/smart-ai:', err);
      res.status(500).json({
        error: 'Ocurrió un error al procesar la consulta con SmartAI',
        details: err?.message || 'Error desconocido',
      });
    }
  });

  // Vite integration
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`SmartPyme server running on port ${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
