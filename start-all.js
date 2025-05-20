// Script para iniciar tanto a aplicação principal quanto o servidor WhatsApp
const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando aplicação completa...');

// Iniciar o processo da aplicação principal
const mainApp = spawn('npm', ['run', 'dev'], {
  stdio: 'inherit',
  detached: false
});

console.log('Aplicação principal iniciada.');

// Aguardar um pouco antes de iniciar o servidor WhatsApp
setTimeout(() => {
  console.log('Iniciando servidor WhatsApp...');
  
  // Iniciar o processo do servidor WhatsApp
  const whatsappServer = spawn('node', ['whatsapp-persistente.js'], {
    stdio: 'inherit',
    detached: false
  });
  
  whatsappServer.on('close', (code) => {
    console.log(`Servidor WhatsApp encerrado com código ${code}`);
  });
  
  console.log('Servidor WhatsApp iniciado.');
}, 5000);

mainApp.on('close', (code) => {
  console.log(`Aplicação principal encerrada com código ${code}`);
  process.exit(code);
});

// Manipular encerramento adequado
process.on('SIGINT', () => {
  console.log('Encerrando todos os processos...');
  mainApp.kill('SIGINT');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('Encerrando todos os processos...');
  mainApp.kill('SIGTERM');
  process.exit(0);
});