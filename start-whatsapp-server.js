// Script para iniciar o servidor WhatsApp
const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando servidor WhatsApp...');

// Iniciar o processo do servidor WhatsApp
const serverProcess = spawn('node', [path.join(__dirname, 'whatsapp-server.js')], {
  stdio: 'inherit',
  detached: false
});

serverProcess.on('close', (code) => {
  console.log(`Processo do servidor WhatsApp encerrado com código ${code}`);
});

// Manipular sinais para encerramento adequado
process.on('SIGINT', () => {
  console.log('Encerrando servidor WhatsApp...');
  serverProcess.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando servidor WhatsApp...');
  serverProcess.kill('SIGTERM');
  process.exit(0);
});