// Script inicializador do Bot WhatsApp
const { spawn } = require('child_process');
const path = require('path');

console.log('Iniciando Bot WhatsApp...');

// Iniciar o processo do servidor WhatsApp
const serverProcess = spawn('node', ['servidor-whatsapp.cjs'], {
  stdio: 'inherit',
  detached: false
});

// Monitorar eventos do processo
serverProcess.on('error', (err) => {
  console.error('Erro ao iniciar servidor WhatsApp:', err);
});

serverProcess.on('close', (code) => {
  console.log(`Servidor WhatsApp finalizado com código: ${code}`);
});

// Manter o processo principal rodando
process.on('SIGINT', () => {
  console.log('Recebido sinal de interrupção, finalizando servidor WhatsApp...');
  serverProcess.kill();
  process.exit(0);
});

console.log('Bot WhatsApp iniciado! Pressione Ctrl+C para encerrar.');