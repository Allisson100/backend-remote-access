require("dotenv").config();
const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const cors = require("cors");
const robot = require("robotjs");
const axios = require("axios");
const ngrok = require("ngrok");
const { killNgrokProcess } = require("./utils/killNgrokProcess");
const { generateMotherboardHash } = require("./utils/generateMotherboardHash");

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

// CONTROLE DE LETRAS DO TECLADO
const allowedKeys = new Set([
  // Letras
  ..."abcdefghijklmnopqrstuvwxyz",

  // Números
  ..."0123456789",

  // Funções
  ..."f1 f2 f3 f4 f5 f6 f7 f8 f9 f10 f11 f12".split(" "),

  // Navegação / Controle
  "enter",
  "escape",
  "backspace",
  "tab",
  "delete",
  "insert",
  "home",
  "end",
  "pageup",
  "pagedown",
  "up",
  "down",
  "left",
  "right",
  "space",
  "printscreen",

  // Modificadores
  "shift",
  "control",
  "alt",
  "command",

  // Pontuação
  "comma",
  "period",
  "slash",
  "backslash",
  "semicolon",
  "quote",
  "openbracket",
  "closebracket",
  "minus",
  "equals",
  "grave",
]);

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
      const screenSize = robot.getScreenSize();
      const realX = Math.floor(x * screenSize.width);
      const realY = Math.floor(y * screenSize.height);
      robot.moveMouse(realX, realY);
    }
  });

  // Simular clique do mouse
  socket.on("mouseDown", (data) => {
    robot.mouseClick();
  });

  //  ### CONEXÃO HOST E CLIENT PARA STREM DO VIDEO ###
  socket.on("offer", (offer) => {
    socket.broadcast.emit("offer", offer);
  });

  socket.on("answer", (answer) => {
    socket.broadcast.emit("answer", answer);
  });

  socket.on("ice-candidate", (candidate) => {
    socket.broadcast.emit("ice-candidate", candidate);
  });
  //  ### CONEXÃO HOST E CLIENT PARA STREM DO VIDEO ###

  // COMPARTILHA IMAGEM
  socket.on("shareImage", ({ roomId, imageData }) => {
    if (activeRoom.id === roomId && activeRoom.receiver) {
      activeRoom.receiver.emit("displayImage", imageData);
    }
  });

  // PARA DE COMPARTILHAR IMAGEM
  socket.on("stopImageShare", ({ roomId }) => {
    if (activeRoom.id === roomId && activeRoom.receiver) {
      activeRoom.receiver.emit("hideImage");
    }
  });

  // PARA COMPARTILHAMENTO DE VIDEO
  socket.on("stopScreenSharing", ({ roomId }) => {
    if (activeRoom.id === roomId && activeRoom.receiver) {
      activeRoom.receiver.emit("stopStream");
    }
  });

  // TECLADO
  socket.on("keyboard-type", (key) => {
    if (!key || typeof key !== "string") return;

    const keyLower = key.toLowerCase();

    if (allowedKeys.has(keyLower)) {
      try {
        robot.keyTap(keyLower);
      } catch (error) {
        console.error(`Erro ao digitar tecla '${keyLower}':`, error);
      }
    } else {
      console.warn(`Tecla não permitida: '${key}'`);
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
server.listen(PORT, async () => {
  try {
    console.log(`Servidor rodando na porta ${PORT}`);

    await killNgrokProcess();

    const url = await ngrok.connect({
      addr: PORT,
    });

    console.log(`URL pública Ngrok gerada: ${url}`);

    const getHash = await generateMotherboardHash();

    console.log("getHash", getHash);

    const response = await axios.post(
      `${process.env.SERVER_CONTROL_URL}/api/register-connection`,
      {
        clientId: process.env.CLIENT_ID,
        ngrokUrl: url,
        hash: getHash,
      }
    );

    if (response?.status === 400 || response?.status === 401) {
      throw new Error();
    }

    console.log("Link enviado para servidor de controle com sucesso!");
  } catch (error) {
    console.log("error", error);
  }
});
