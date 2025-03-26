const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const { mouse, Point } = require("@nut-tree-fork/nut-js"); // Importando Nut.js para controle do mouse

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
  },
});

app.use(cors());
let activeRooms = {}; // Armazena as salas ativas e seu estado

// Função para mover o mouse com o Nut.js
async function moveMouse(x, y) {
  await mouse.move(new Point(x, y)); // Move o mouse para as coordenadas (x, y)
}

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

  socket.on("moveMouse", async ({ roomId, x, y }) => {
    if (activeRooms[roomId]?.allowed) {
      try {
        // Mover o mouse se a sala permitir
        await moveMouse(x, y);
      } catch (error) {
        console.error("Erro ao mover o mouse:", error);
      }
    }
  });

  socket.on("disconnect", () => {
    console.log("Usuário desconectado");
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
