import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // MT5 API Proxy Endpoint
  // This keeps your MT5 credentials secure on the server
  app.post("/api/mt5/trade", async (req, res) => {
    const { symbol, type, quantity, price } = req.body;
    
    // Check if MT5 credentials are set
    if (!process.env.MT5_API_URL || !process.env.MT5_API_TOKEN) {
      return res.status(500).json({ 
        error: "MT5 API credentials not configured in environment variables." 
      });
    }

    try {
      // Example request to an MT5 REST API provider
      // You would replace this with the actual endpoint of your MT5 bridge/provider
      const response = await fetch(`${process.env.MT5_API_URL}/trade`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${process.env.MT5_API_TOKEN}`
        },
        body: JSON.stringify({
          account: process.env.MT5_ACCOUNT_ID,
          password: process.env.MT5_PASSWORD,
          symbol,
          action: type === 'Buy' ? 'BUY' : 'SELL',
          volume: quantity,
          price: price || 0 // 0 for market orders
        })
      });

      const data = await response.json();
      res.status(response.status).json(data);
    } catch (error) {
      console.error("MT5 API Error:", error);
      res.status(500).json({ error: "Failed to connect to MT5 API provider." });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", mt5_configured: !!process.env.MT5_API_URL });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
