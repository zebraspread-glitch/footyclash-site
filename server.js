const express = require("express");
const http = require("http");
const os = require("os");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

// ✅ FIXED PORT (THIS WAS YOUR MAIN ISSUE)
const PORT = process.env.PORT || 3001;

const DEFAULT_TURN_TIME_MS = 30000;

const io = new Server(server, {
  cors: {
    origin: "*", // ✅ allow Vercel frontend
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
});

const rooms = Object.create(null);

// --- BASIC ROUTES ---
app.get("/", (_req, res) => {
  res.send("FootyClash socket server is running");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true });
});

// --- SOCKET CONNECTION ---
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

// --- START SERVER (CRITICAL FIX HERE) ---
server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});