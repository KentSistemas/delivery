// WhatsApp Simulado para Kent Delivery
// Este é um servidor compatível com o Replit que simula o comportamento do WhatsApp
const express = require('express');
const http = require('http');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Configuração do Express
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

// Diretório para mensagens
const LOGS_DIR = path.join(__dirname, 'whatsapp-logs');
if (!fs.existsSync(LOGS_DIR)) {
  fs.mkdirSync(LOGS_DIR, { recursive: true });
}

// Arquivo de mensagens
const MESSAGES_FILE = path.join(LOGS_DIR, 'messages.json');
if (!fs.existsSync(MESSAGES_FILE)) {
  fs.writeFileSync(MESSAGES_FILE, JSON.stringify([]));
}

// Estado do sistema
let systemStatus = 'disconnected';
let qrCodeDisplayed = false;
const connectionDelay = 5000; // Tempo em ms para "conectar"

// Funções auxiliares
function saveMessage(message) {
  try {
    let messages = [];
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      if (data) {
        messages = JSON.parse(data);
      }
    }
    
    messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(MESSAGES_FILE, JSON.stringify(messages, null, 2));
    return true;
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    return false;
  }
}

function getMessages() {
  try {
    if (fs.existsSync(MESSAGES_FILE)) {
      const data = fs.readFileSync(MESSAGES_FILE, 'utf8');
      if (data) {
        return JSON.parse(data);
      }
    }
    return [];
  } catch (error) {
    console.error('Erro ao ler mensagens:', error);
    return [];
  }
}

// Rotas API

// Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: systemStatus,
    hasQrCode: qrCodeDisplayed
  });
});

// QR Code
app.get('/api/whatsapp/qrcode', (req, res) => {
  // Retornamos um QR code fixo de exemplo
  res.json({
    qrCode: "00000000000000000000000000000000000000000000"
  });
});

// Conectar
app.post('/api/whatsapp/connect', (req, res) => {
  if (systemStatus === 'connected') {
    return res.json({ success: true, message: 'Sistema já conectado' });
  }
  
  console.log('Iniciando conexão do WhatsApp...');
  systemStatus = 'qr_ready';
  qrCodeDisplayed = true;
  
  // Após delay, simulamos uma conexão bem-sucedida
  setTimeout(() => {
    console.log('Conexão estabelecida com sucesso!');
    systemStatus = 'connected';
    qrCodeDisplayed = false;
  }, connectionDelay);
  
  res.json({ success: true, message: 'Iniciando processo de conexão' });
});

// Enviar mensagem
app.post('/api/whatsapp/send-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }
  
  if (systemStatus !== 'connected') {
    return res.status(400).json({ error: 'Sistema não está conectado' });
  }
  
  // Formatar número (remover caracteres não numéricos)
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // Simular envio
  console.log(`Simulando envio de mensagem para ${formattedNumber}: ${message}`);
  
  // Salvar a mensagem
  const messageData = {
    id: 'msg_' + Date.now(),
    phoneNumber: formattedNumber,
    message,
    type: 'direct',
    direction: 'outgoing'
  };
  
  saveMessage(messageData);
  
  res.json({
    success: true,
    messageId: messageData.id,
    message: 'Mensagem enviada com sucesso (simulação)'
  });
});

// Enviar status de pedido
app.post('/api/whatsapp/send-order-status', (req, res) => {
  const { orderId, status, phoneNumber, message } = req.body;
  
  if (!orderId || !status || !phoneNumber || !message) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  if (systemStatus !== 'connected') {
    return res.status(400).json({ error: 'Sistema não está conectado' });
  }
  
  // Formatar número
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // Simular envio
  console.log(`Simulando envio de status de pedido para ${formattedNumber}: ${status}`);
  
  // Salvar mensagem
  const messageData = {
    id: 'order_' + Date.now(),
    orderId,
    status,
    phoneNumber: formattedNumber,
    message,
    type: 'order_status',
    direction: 'outgoing'
  };
  
  saveMessage(messageData);
  
  res.json({
    success: true,
    messageId: messageData.id,
    message: 'Status de pedido enviado com sucesso (simulação)'
  });
});

// Página inicial
app.get('/', (req, res) => {
  const messages = getMessages();
  
  res.send(`
    <html>
      <head>
        <title>WhatsApp Simulado - Kent Delivery</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .connected { background-color: #d4edda; color: #155724; }
          .disconnected { background-color: #f8d7da; color: #721c24; }
          .messages { margin-top: 20px; }
          .message { padding: 10px; margin-bottom: 10px; border-radius: 5px; background-color: #f8f9fa; }
          .outgoing { background-color: #d1ecf1; }
          h1, h2 { color: #333; }
          button { padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>WhatsApp Simulado - Kent Delivery</h1>
        <div class="status ${systemStatus === 'connected' ? 'connected' : 'disconnected'}">
          <strong>Status:</strong> ${systemStatus}<br>
          <strong>Hora atual:</strong> ${new Date().toLocaleString()}
        </div>
        
        <div>
          <button onclick="window.location.reload()">Atualizar página</button>
          <button onclick="fetch('/api/whatsapp/connect', {method: 'POST'}).then(() => window.location.reload())">
            ${systemStatus === 'connected' ? 'Reconectar' : 'Conectar'}
          </button>
        </div>
        
        <h2>Mensagens (${messages.length})</h2>
        <div class="messages">
          ${messages.map(msg => `
            <div class="message ${msg.direction || 'outgoing'}">
              <div><strong>Para:</strong> ${msg.phoneNumber}</div>
              <div><strong>Tipo:</strong> ${msg.type}</div>
              ${msg.orderId ? `<div><strong>Pedido:</strong> ${msg.orderId}</div>` : ''}
              ${msg.status ? `<div><strong>Status:</strong> ${msg.status}</div>` : ''}
              <div><strong>Mensagem:</strong> ${msg.message}</div>
              <div><small>${new Date(msg.timestamp).toLocaleString()}</small></div>
            </div>
          `).join('')}
        </div>
      </body>
    </html>
  `);
});

// Iniciar servidor
const PORT = 3333;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp Simulado rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para verificar o estado`);
});