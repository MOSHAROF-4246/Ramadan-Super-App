import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import Database from "better-sqlite3";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbPath = process.env.NETLIFY ? "/tmp/ramadan.db" : "ramadan.db";
const db = new Database(dbPath);

// Initialize Database
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT,
    email TEXT UNIQUE,
    location TEXT,
    preferences TEXT
  );

  CREATE TABLE IF NOT EXISTS ibadah_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    date TEXT,
    type TEXT, -- 'salah', 'fasting', 'quran', 'charity'
    value TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS quran_progress (
    user_id TEXT,
    surah_id INTEGER,
    ayah_id INTEGER,
    completed BOOLEAN,
    PRIMARY KEY (user_id, surah_id)
  );
`);

import { getRamadanCoachAdvice, getDuaRecommendation } from "./src/services/geminiService";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", time: new Date().toISOString() });
  });

  app.get("/api/dua", async (req, res) => {
    const { mood } = req.query;
    try {
      const dua = await getDuaRecommendation(mood as string || "peaceful");
      res.json(dua);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch Dua" });
    }
  });

  app.post("/api/coach", async (req, res) => {
    try {
      const advice = await getRamadanCoachAdvice(req.body);
      res.json(advice);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch coach advice" });
    }
  });

  // Prayer Times Proxy (to avoid CORS if needed, though Aladhan is usually fine)
  app.get("/api/prayer-times", async (req, res) => {
    const { city, country, method, latitude, longitude } = req.query;
    let url = "";
    if (latitude && longitude) {
      url = `https://api.aladhan.com/v1/timings?latitude=${latitude}&longitude=${longitude}&method=${method || 2}`;
    } else {
      url = `https://api.aladhan.com/v1/timingsByCity?city=${city}&country=${country}&method=${method || 2}`;
    }
    
    try {
      const response = await fetch(url);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch prayer times" });
    }
  });

  // Ibadah Logging
  app.post("/api/logs", (req, res) => {
    const { user_id, date, type, value, notes } = req.body;
    const stmt = db.prepare("INSERT INTO ibadah_logs (user_id, date, type, value, notes) VALUES (?, ?, ?, ?, ?)");
    const info = stmt.run(user_id, date, type, value, notes);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/logs/:userId", (req, res) => {
    const { userId } = req.params;
    const logs = db.prepare("SELECT * FROM ibadah_logs WHERE user_id = ? ORDER BY date DESC").all(userId);
    res.json(logs);
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
