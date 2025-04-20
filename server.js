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
  allowEIO3: true,
});

app.use(cors());

app.get("/", (req, res) => {
  res.send("OPA");
});

// Armazena a sala ativa com o estado e os sockets conectados
let activeRoom = {
  id: null,
  controlAllowed: true,
  sender: null,
  receiver: null,
};

io.on("connection", (socket) => {
  console.log("Novo usuário conectado" + socket.id);

  // O client entra na sala informada
  socket.on("joinRoom", (roomId) => {
    if (activeRoom.id !== roomId) {
      socket.emit("roomNotFound");
      return;
    }
    activeRoom.receiver = socket;
    socket.join(roomId);
    console.log(`Client entrou na sala ${roomId}`);

    activeRoom.sender.emit("clientConnected");
  });

  // O host cria a sala
  socket.on("createRoom", (roomId) => {
    activeRoom = {
      id: roomId,
      controlAllowed: true,
      sender: socket,
      receiver: null,
    };
    socket.join(roomId);
    console.log(`Sala criada: ${roomId}`);
  });

  // Alterna o controle do mouse
  socket.on("toggleControl", ({ roomId, allowed }) => {
    if (activeRoom.id === roomId) {
      activeRoom.controlAllowed = allowed;
    }
  });

  // Movimento do mouse: somente se permitido
  socket.on("moveMouse", ({ roomId, x, y }) => {
    if (activeRoom.id === roomId && activeRoom.controlAllowed) {
      robot.moveMouse(x, y);
    }
  });

  // Simular clique do mouse
  socket.on("mouseDown", (data) => {
    robot.mouseClick();
  });

  // Simular pressionamento de tecla
  // socket.on("keyboardEvent", (data) => {
  //   robot.keyTap(data.key);
  // });

  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate) => {
    socket.broadcast.emit("ice-candidate", candidate);
  });

  socket.on("shareImage", ({ roomId, imageData }) => {
    if (activeRoom.id === roomId && activeRoom.receiver) {
      activeRoom.receiver.emit("displayImage", imageData);
    }
  });

  socket.on("stopImageShare", ({ roomId }) => {
    if (activeRoom.id === roomId && activeRoom.receiver) {
      activeRoom.receiver.emit("hideImage");
    }
  });

  socket.on("stopScreenSharing", ({ roomId }) => {
    if (activeRoom.id === roomId && activeRoom.receiver) {
      activeRoom.receiver.emit("stopStream");
    }
  });

  socket.on("disconnect", () => {
    if (
      (activeRoom.sender && socket.id === activeRoom.sender.id) ||
      (activeRoom.receiver && socket.id === activeRoom.receiver.id)
    ) {
      activeRoom = {
        id: null,
        controlAllowed: true,
        sender: null,
        receiver: null,
      };
    }
  });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Servidor rodando na porta ${PORT}`));
