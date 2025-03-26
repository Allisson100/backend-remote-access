const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const robot = require("robotjs");

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
let activeRooms = {}; // Armazena as salas ativas e seu estado

io.on("connection", (socket) => {
  console.log("Novo usuário conectado");

  socket.on("joinRoom", (roomId) => {
    if (!activeRooms[roomId]) {
      socket.emit("roomNotFound");
      return;
    }
    socket.join(roomId);
    console.log(`Usuário entrou na sala ${roomId}`);
  });

  socket.on("createRoom", (roomId) => {
    activeRooms = {}; // Remove todas as salas anteriores
    activeRooms[roomId] = { allowed: true }; // Cria nova sala
    console.log(`Nova sala criada: ${roomId}`);
  });

  socket.on("toggleControl", ({ roomId, allowed }) => {
    if (activeRooms[roomId]) {
      activeRooms[roomId].allowed = allowed;
    }
  });

  socket.on("moveMouse", ({ roomId, x, y }) => {
    if (activeRooms[roomId]?.allowed) {
      robot.moveMouse(x, y);
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
