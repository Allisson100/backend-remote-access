const si = require("systeminformation");
const crypto = require("crypto");

async function generateMotherboardHash() {
  try {
    const baseboard = await si.baseboard();

    const rawData = `${baseboard.manufacturer}-${baseboard.model}-${baseboard.serial}`;

    const hash = crypto.createHash("sha256").update(rawData).digest("hex");

    return hash;
  } catch (error) {
    console.error("Erro ao gerar hash da placa mãe:", error);
    return null;
  }
}

module.exports = { generateMotherboardHash };
