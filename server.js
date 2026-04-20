const express = require("express");
const http = require("http");
const os = require("os");
const { Server } = require("socket.io");

const app = express();
const server = http.createServer(app);

const PORT = 3001;
const DEFAULT_TURN_TIME_MS = 30000;

const io = new Server(server, {
  cors: {
    origin: true,
    methods: ["GET", "POST"],
  },
  transports: ["polling", "websocket"],
  allowEIO3: true,
});

const rooms = Object.create(null);

const DEFAULT_SLOTS = [
  { id: "fwd1" },
  { id: "fwd2" },
  { id: "mid1" },
  { id: "mid2" },
  { id: "def1" },
  { id: "def2" },
  { id: "ruck" },
  { id: "flex1" },
];

const BOUNCES_SLOTS = [
  { id: "fwd1" },
  { id: "fwd2" },
  { id: "mid1" },
  { id: "mid2" },
  { id: "def1" },
  { id: "def2" },
  { id: "flex1" },
];

const HITOUT_SLOTS = [
  { id: "ruck1" },
  { id: "ruck2" },
  { id: "ruck3" },
  { id: "ruck4" },
  { id: "ruck5" },
  { id: "ruck6" },
];

app.get("/", (_req, res) => {
  res.send("FootyClash socket server is running");
});

app.get("/health", (_req, res) => {
  res.json({ ok: true, port: PORT });
});

function getLocalIp() {
  const nets = os.networkInterfaces();
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === "IPv4" && !net.internal) {
        return net.address;
      }
    }
  }
  return "localhost";
}

function generateRoomCode() {
  let code = "";
  do {
    code = Math.random().toString(36).substring(2, 8).toUpperCase();
  } while (rooms[code]);
  return code;
}

function createEmptyTeam(slots) {
  const obj = {};
  for (const slot of slots) {
    obj[slot.id] = null;
  }
  return obj;
}

function getSlotsForMode(mode) {
  if (mode === "hitouts") return HITOUT_SLOTS;
  if (mode === "bounces") return BOUNCES_SLOTS;
  return DEFAULT_SLOTS;
}

function getTurnFromPickNumber(pickNumber) {
  const pattern = ["A", "B", "B", "A"];
  return pattern[pickNumber % pattern.length];
}

function getSecondsLeft(room) {
  if (!room?.turnExpiresAt) {
    return Math.ceil((room?.turnMs ?? DEFAULT_TURN_TIME_MS) / 1000);
  }
  return Math.max(0, Math.ceil((room.turnExpiresAt - Date.now()) / 1000));
}

function clearRoomTimers(room) {
  if (!room) return;

  if (room.turnTimeout) {
    clearTimeout(room.turnTimeout);
    room.turnTimeout = null;
  }

  if (room.turnInterval) {
    clearInterval(room.turnInterval);
    room.turnInterval = null;
  }

  room.turnExpiresAt = null;
}

function getPlayerSideForSocket(room, socketId) {
  if (socketId === room.hostSocketId) return room.hostSide;
  if (socketId === room.guestSocketId) return room.hostSide === "A" ? "B" : "A";
  return null;
}

function emitAssignedSides(room) {
  if (!room) return;

  if (room.hostSocketId) {
    io.to(room.hostSocketId).emit("assigned_side", {
      side: room.hostSide,
    });
  }

  if (room.guestSocketId) {
    io.to(room.guestSocketId).emit("assigned_side", {
      side: room.hostSide === "A" ? "B" : "A",
    });
  }
}

function emitRoomState(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  io.to(roomId).emit("room_state", {
    roomId: room.roomId,
    hostName: room.hostName,
    guestName: room.guestName,
    mode: room.mode,
    teamA: room.teamA,
    teamB: room.teamB,
    pickCount: room.pickCount,
    clubName: room.clubName,
    started: room.started,
    status: room.status,
    connectedCount: room.connectedCount,
    hostSocketId: room.hostSocketId,
    guestSocketId: room.guestSocketId,
    turnExpiresAt: room.turnExpiresAt,
    turnSecondsLeft: getSecondsLeft(room),
  });
}

function resetTeamsForMode(room) {
  const slots = getSlotsForMode(room.mode);
  room.teamA = createEmptyTeam(slots);
  room.teamB = createEmptyTeam(slots);
  room.pickCount = 0;
  room.clubName = "Collingwood";
  room.status = "waiting";
  room.started = false;
  clearRoomTimers(room);
}

function maybeDeleteRoom(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  if (!room.hostSocketId && !room.guestSocketId) {
    clearRoomTimers(room);
    delete rooms[roomId];
  }
}

function setNextTurnTimer(roomId) {
  const room = rooms[roomId];
  if (!room) return;

  clearRoomTimers(room);

  const slots = getSlotsForMode(room.mode);
  const totalPicks = slots.length * 2;

  if (!room.started || room.pickCount >= totalPicks) {
    room.status = "finished";
    emitRoomState(roomId);
    return;
  }

  const turnMs = room.turnMs ?? DEFAULT_TURN_TIME_MS;
  room.turnExpiresAt = Date.now() + turnMs;

  room.turnInterval = setInterval(() => {
    emitRoomState(roomId);
  }, 1000);

  room.turnTimeout = setTimeout(() => {
    const currentRoom = rooms[roomId];
    if (!currentRoom || !currentRoom.started) return;

    currentRoom.pickCount += 1;

    if (currentRoom.pickCount >= totalPicks) {
      clearRoomTimers(currentRoom);
      currentRoom.status = "finished";
      emitRoomState(roomId);
      return;
    }

    setNextTurnTimer(roomId);
  }, turnMs);

  emitRoomState(roomId);
}

io.engine.on("connection_error", (err) => {
  console.log("ENGINE CONNECTION ERROR:");
  console.log("code:", err.code);
  console.log("message:", err.message);
  console.log("context:", err.context);
});

io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  socket.on("create_room", (payload = {}) => {
    const name =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, 13)
        : "Player A";

    const roomId = generateRoomCode();

    rooms[roomId] = {
      roomId,
      hostName: name,
      guestName: "",
      mode: "sc_points",
      hostSide: "A",
      turnMs: DEFAULT_TURN_TIME_MS,
      teamA: createEmptyTeam(DEFAULT_SLOTS),
      teamB: createEmptyTeam(DEFAULT_SLOTS),
      pickCount: 0,
      clubName: "Collingwood",
      started: false,
      status: "waiting",
      connectedCount: 1,
      hostSocketId: socket.id,
      guestSocketId: null,
      turnExpiresAt: null,
      turnTimeout: null,
      turnInterval: null,
    };

    socket.join(roomId);
    socket.data.roomId = roomId;

    emitAssignedSides(rooms[roomId]);
    emitRoomState(roomId);
  });

  socket.on("join_room", (payload = {}) => {
    const roomId =
      typeof payload.roomId === "string" ? payload.roomId.trim().toUpperCase() : "";
    const name =
      typeof payload.name === "string" && payload.name.trim()
        ? payload.name.trim().slice(0, 13)
        : "Player B";

    const room = rooms[roomId];

    if (!room) {
      socket.emit("room_error", { message: "Room not found" });
      return;
    }

    if (room.guestSocketId && room.guestSocketId !== socket.id) {
      socket.emit("room_error", { message: "Room full" });
      return;
    }

    room.guestName = name;
    room.guestSocketId = socket.id;
    room.connectedCount = room.hostSocketId ? 2 : 1;

    socket.join(roomId);
    socket.data.roomId = roomId;

    emitAssignedSides(room);
    emitRoomState(roomId);
    io.to(room.hostSocketId).emit("room_info", { message: `${name} joined the lobby.` });
  });

  socket.on("assign_sides", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId : "";
    const hostAsA = Boolean(payload.hostAsA);

    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;
    if (room.started) return;

    room.hostSide = hostAsA ? "A" : "B";

    emitAssignedSides(room);
    emitRoomState(roomId);
  });

  socket.on("set_mode", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId : "";
    const mode = typeof payload.mode === "string" ? payload.mode : "sc_points";

    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;
    if (room.started) return;

    room.mode = mode;
    resetTeamsForMode(room);
    emitRoomState(roomId);
  });

  socket.on("set_lobby_config", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId : "";
    const room = rooms[roomId];
    if (!room) return;
    if (socket.id !== room.hostSocketId) return;
    if (room.started) return;

    if (typeof payload.mode === "string") {
      room.mode = payload.mode;
    }

    if (typeof payload.hostAsA === "boolean") {
      room.hostSide = payload.hostAsA ? "A" : "B";
    }

    if ([20, 30, 45].includes(payload.timerSeconds)) {
      room.turnMs = Number(payload.timerSeconds) * 1000;
    }

    resetTeamsForMode(room);
    emitAssignedSides(room);
    emitRoomState(roomId);
  });

  socket.on("start_game", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId : "";
    const room = rooms[roomId];

    if (!room) return;
    if (socket.id !== room.hostSocketId) return;
    if (!room.hostSocketId || !room.guestSocketId) return;

    room.started = true;
    room.status = "playing";
    room.pickCount = 0;

    clearRoomTimers(room);
    setNextTurnTimer(roomId);
  });

  socket.on("pick_player", (payload = {}) => {
    const roomId = typeof payload.roomId === "string" ? payload.roomId : "";
    const slotId = typeof payload.slotId === "string" ? payload.slotId : "";
    const playerId = typeof payload.playerId === "string" ? payload.playerId : "";

    const room = rooms[roomId];
    if (!room) return;
    if (!room.started) return;

    const turn = getTurnFromPickNumber(room.pickCount);
    const playerSide = getPlayerSideForSocket(room, socket.id);

    if (!playerSide || playerSide !== turn) return;

    const team = turn === "A" ? room.teamA : room.teamB;

    if (!(slotId in team)) return;
    if (team[slotId]) return;

    const alreadyPicked = [...Object.values(room.teamA), ...Object.values(room.teamB)].includes(
      playerId
    );

    if (alreadyPicked) return;

    team[slotId] = playerId;
    room.pickCount += 1;

    const slots = getSlotsForMode(room.mode);
    const totalPicks = slots.length * 2;

    if (room.pickCount >= totalPicks) {
      clearRoomTimers(room);
      room.status = "finished";
      room.started = false;
      emitRoomState(roomId);
      return;
    }

    setNextTurnTimer(roomId);
  });

  socket.on("leave_room", (payload = {}) => {
    const roomId =
      typeof payload.roomId === "string" ? payload.roomId : socket.data.roomId || "";

    const room = rooms[roomId];
    socket.leave(roomId);
    socket.data.roomId = null;

    if (!room) return;

    if (socket.id === room.hostSocketId) {
      clearRoomTimers(room);
      io.to(roomId).emit("room_error", { message: "Host left. Room closed." });

      if (room.guestSocketId) {
        const guestSocket = io.sockets.sockets.get(room.guestSocketId);
        if (guestSocket) {
          guestSocket.leave(roomId);
          guestSocket.data.roomId = null;
        }
      }

      delete rooms[roomId];
      return;
    }

    if (socket.id === room.guestSocketId) {
      room.guestSocketId = null;
      room.guestName = "";
      room.connectedCount = room.hostSocketId ? 1 : 0;
      room.started = false;
      room.status = "waiting";
      clearRoomTimers(room);
      emitRoomState(roomId);

      if (room.hostSocketId) {
        io.to(room.hostSocketId).emit("room_info", { message: "Opponent left the lobby." });
      } else {
        maybeDeleteRoom(roomId);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("User disconnected:", socket.id);

    const roomId = socket.data.roomId;
    if (!roomId) return;

    const room = rooms[roomId];
    if (!room) return;

    if (socket.id === room.hostSocketId) {
      clearRoomTimers(room);
      io.to(roomId).emit("room_error", { message: "Host disconnected. Room closed." });

      if (room.guestSocketId) {
        const guestSocket = io.sockets.sockets.get(room.guestSocketId);
        if (guestSocket) {
          guestSocket.leave(roomId);
          guestSocket.data.roomId = null;
        }
      }

      delete rooms[roomId];
      return;
    }

    if (socket.id === room.guestSocketId) {
      room.guestSocketId = null;
      room.guestName = "";
      room.connectedCount = room.hostSocketId ? 1 : 0;
      room.started = false;
      room.status = "waiting";
      clearRoomTimers(room);
      emitRoomState(roomId);

      if (room.hostSocketId) {
        io.to(room.hostSocketId).emit("room_info", { message: "Opponent disconnected." });
      } else {
        maybeDeleteRoom(roomId);
      }
    }
  });
});

server.listen(PORT, "0.0.0.0", () => {
  const localIp = getLocalIp();
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Server running on http://${localIp}:${PORT}`);
});