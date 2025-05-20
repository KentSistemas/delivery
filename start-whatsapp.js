// Script para iniciar o servidor WhatsApp no ambiente Replit
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

// Verificar se o diretório de sessões existe
const sessionDir = path.join(__dirname, 'whatsapp-sessions');
if (!fs.existsSync(sessionDir)) {
  fs.mkdirSync(sessionDir, { recursive: true });
  console.log('Diretório de sessões criado:', sessionDir);
}

// Iniciar o servidor WhatsApp
console.log('Iniciando servidor WhatsApp...');
const whatsapp = exec('node whatsapp-persistente.js', (error, stdout, stderr) => {
  if (error) {
    console.error(`Erro ao executar o servidor WhatsApp: ${error.message}`);
    return;
  }
  if (stderr) {
    console.error(`Erro no stderr: ${stderr}`);
    return;
  }
  console.log(`Saída: ${stdout}`);
});

whatsapp.stdout.on('data', (data) => {
  console.log(`WhatsApp servidor: ${data}`);
});

whatsapp.stderr.on('data', (data) => {
  console.error(`WhatsApp erro: ${data}`);
});

console.log('Servidor WhatsApp iniciado. Mantenha esta janela aberta.');
console.log('IMPORTANTE: Abra um novo terminal para executar outros comandos.');
console.log('Para conectar, acesse o painel admin e clique em "Conectar WhatsApp"');

// Tratamento de encerramento
process.on('SIGINT', () => {
  console.log('Encerrando servidor WhatsApp...');
  whatsapp.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidor WhatsApp...');
  whatsapp.kill('SIGTERM');
  process.exit(0);
});