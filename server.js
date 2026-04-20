const express = require("express");
const http = require("http");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = process.env.PORT || 3001;

const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"],
  },
});

const rooms = {};

// Generate random 6-char code
function generateRoomId() {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // ======================
  // CREATE ROOM
  // ======================
  socket.on("create_room", ({ name }) => {
    const roomId = generateRoomId();

    rooms[roomId] = {
      roomId,
      hostName: name,
      guestName: "",
      hostSocketId: socket.id,
      guestSocketId: null,
      started: false,
      teamA: {},
      teamB: {},
      pickCount: 0,
    };

    socket.join(roomId);

    socket.emit("assigned_side", { side: "A" });
    socket.emit("room_state", rooms[roomId]);

    console.log("Room created:", roomId);
  });

  // ======================
  // JOIN ROOM
  // ======================
  socket.on("join_room", ({ roomId, name }) => {
    const room = rooms[roomId];

    if (!room) {
      socket.emit("room_error", { message: "Room not found" });
      return;
    }

    if (room.guestSocketId) {
      socket.emit("room_error", { message: "Room full" });
      return;
    }

    room.guestName = name;
    room.guestSocketId = socket.id;

    socket.join(roomId);

    socket.emit("assigned_side", { side: "B" });

    io.to(roomId).emit("room_state", room);

    console.log("User joined:", roomId);
  });

  // ======================
  // START GAME
  // ======================
  socket.on("start_game", ({ roomId }) => {
    const room = rooms[roomId];
    if (!room) return;

    if (socket.id !== room.hostSocketId) return;

    room.started = true;

    io.to(roomId).emit("room_state", room);
  });

  // ======================
  // PICK PLAYER
  // ======================
  socket.on("pick_player", ({ roomId, slotId, playerId }) => {
    const room = rooms[roomId];
    if (!room) return;

    const isHost = socket.id === room.hostSocketId;

    const team = isHost ? room.teamA : room.teamB;

    if (!team[slotId]) {
      team[slotId] = playerId;
      room.pickCount++;
    }

    io.to(roomId).emit("room_state", room);
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);
  });
});

server.listen(PORT, "0.0.0.0", () => {
  console.log("Server running on port", PORT);
});