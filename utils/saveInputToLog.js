const fs = require("fs");
const path = require("path");

const inputLogsDir = path.join(__dirname, "inputLogs");
if (!fs.existsSync(inputLogsDir)) {
  fs.mkdirSync(inputLogsDir);
}

let currentRoomID = null;
let currentDateHour = null;
let currentFilename = null;

function formatDateToLocalString(date) {
  const pad = (n) => String(n).padStart(2, "0");

  const year = date.getFullYear();
  const month = pad(date.getMonth() + 1);
  const day = pad(date.getDate());
  const hour = pad(date.getHours());
  const minute = pad(date.getMinutes());

  return `${year}-${month}-${day}_${hour}-${minute}`;
}

function saveInputToLog(roomID, value) {
  const now = new Date();
  const formattedDate = formatDateToLocalString(now); // YYYY-MM-DD_HH-MM

  if (roomID !== currentRoomID || formattedDate !== currentDateHour) {
    const randomNumber = Math.floor(Math.random() * 1000000);
    const filename = `${formattedDate}_${roomID}_${randomNumber}.txt`;
    currentFilename = path.join(inputLogsDir, filename);
    currentRoomID = roomID;
    currentDateHour = formattedDate;
  }

  fs.writeFileSync(currentFilename, value, "utf-8");
}

module.exports = { saveInputToLog };
