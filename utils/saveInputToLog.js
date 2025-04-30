const fs = require("fs");
const path = require("path");

const inputLogsDir = path.join(__dirname, "inputLogs");
if (!fs.existsSync(inputLogsDir)) {
  fs.mkdirSync(inputLogsDir);
}

let currentRoomID = null;
let currentDate = null;
let currentFilename = null;

function saveInputToLog(roomID, value) {
  const today = new Date().toISOString().slice(0, 10);

  if (roomID !== currentRoomID || today !== currentDate) {
    const randomNumber = Math.floor(Math.random() * 1000000);
    const filename = `${today}_${roomID}_${randomNumber}.txt`;
    currentFilename = path.join(inputLogsDir, filename);
    currentRoomID = roomID;
    currentDate = today;
  }

  fs.writeFileSync(currentFilename, value, "utf-8");
}

module.exports = { saveInputToLog };
