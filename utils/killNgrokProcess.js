const { exec } = require("child_process");

function killNgrokProcess() {
  return new Promise((resolve, reject) => {
    // Para Windows (taskkill /IM ngrok.exe /F)
    // Para Mac/Linux (pkill ngrok)
    const cmd =
      process.platform === "win32"
        ? "taskkill /IM ngrok.exe /F"
        : "pkill ngrok";

    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        if (
          stderr.includes("not found") ||
          stderr.includes("não foi encontrado")
        ) {
          console.log("Nenhum processo ngrok em execução. Prosseguindo...");
          return resolve();
        }
        console.error(`Erro ao tentar matar ngrok:`, error);
        return reject(error);
      }
      console.log("Processo ngrok encerrado com sucesso.");
      resolve();
    });
  });
}

module.exports = { killNgrokProcess };
