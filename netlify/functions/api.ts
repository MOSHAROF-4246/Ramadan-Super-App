import express from "express";
import serverless from "serverless-http";
import Database from "better-sqlite3";
import path from "path";
import { getRamadanCoachAdvice, getDuaRecommendation } from "../../src/services/geminiService.js";

const app = express();
app.use(express.json());

// For Netlify, we use /tmp for the database as it's the only writable directory
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
    type TEXT,
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

// API Routes
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", environment: process.env.NETLIFY ? "netlify" : "local" });
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

export const handler = serverless(app);
