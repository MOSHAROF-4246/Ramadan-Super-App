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
    location_city TEXT,
    location_country TEXT,
    language TEXT DEFAULT 'en',
    theme TEXT DEFAULT 'light'
  );

  CREATE TABLE IF NOT EXISTS daily_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT,
    date TEXT,
    roza_kept INTEGER,
    missed_reason TEXT,
    sehri_taken INTEGER,
    iftar_done INTEGER,
    taraweeh_prayed INTEGER,
    quran_pages INTEGER DEFAULT 0,
    zikr_count INTEGER DEFAULT 0,
    charity_amount REAL DEFAULT 0,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(user_id, date)
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

  app.get("/api/calendar", async (req, res) => {
    const { city, country, month, year, method = 2 } = req.query;
    try {
      const response = await fetch(`https://api.aladhan.com/v1/calendarByCity?city=${city}&country=${country}&method=${method}&month=${month}&year=${year}`);
      const data = await response.json();
      res.json(data);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch calendar" });
    }
  });

  // Daily Logging
  app.post("/api/logs", (req, res) => {
    const log = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO daily_logs (user_id, date, roza_kept, missed_reason, sehri_taken, iftar_done, taraweeh_prayed, quran_pages, zikr_count, charity_amount, notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, date) DO UPDATE SET
          roza_kept=excluded.roza_kept,
          missed_reason=excluded.missed_reason,
          sehri_taken=excluded.sehri_taken,
          iftar_done=excluded.iftar_done,
          taraweeh_prayed=excluded.taraweeh_prayed,
          quran_pages=excluded.quran_pages,
          zikr_count=excluded.zikr_count,
          charity_amount=excluded.charity_amount,
          notes=excluded.notes
      `);
      stmt.run(
        log.user_id, log.date, log.roza_kept ? 1 : 0, log.missed_reason, 
        log.sehri_taken ? 1 : 0, log.iftar_done ? 1 : 0, log.taraweeh_prayed ? 1 : 0,
        log.quran_pages, log.zikr_count, log.charity_amount, log.notes
      );
      res.json({ success: true });
    } catch (error) {
      console.error("Log save error:", error);
      res.status(500).json({ error: "Failed to save log" });
    }
  });

  app.get("/api/logs/:userId", (req, res) => {
    const { userId } = req.params;
    try {
      const logs = db.prepare("SELECT * FROM daily_logs WHERE user_id = ? ORDER BY date DESC").all(userId);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch logs" });
    }
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
