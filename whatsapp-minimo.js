const express = require('express');
const http = require('http');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Configuração simples do servidor
const app = express();
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(bodyParser.json());

// Diretório para salvar mensagens
const logsDir = path.join(__dirname, 'whatsapp-logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Arquivo de log
const logFile = path.join(logsDir, 'messages.json');
if (!fs.existsSync(logFile)) {
  fs.writeFileSync(logFile, JSON.stringify([]));
}

// Status do servidor
let serverStatus = 'connected';

// Função para salvar mensagem no log
function saveMessage(message) {
  try {
    let messages = [];
    if (fs.existsSync(logFile)) {
      const data = fs.readFileSync(logFile, 'utf8');
      if (data) {
        messages = JSON.parse(data);
      }
    }
    
    messages.push({
      ...message,
      timestamp: new Date().toISOString()
    });
    
    fs.writeFileSync(logFile, JSON.stringify(messages, null, 2));
    console.log('Mensagem salva:', message.message);
    return true;
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
    return false;
  }
}

// Rota para verificar status
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Servidor WhatsApp Replit</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 10px; background-color: #d4edda; color: #155724; border-radius: 4px; margin-bottom: 20px; }
          h1 { color: #333; }
          pre { background-color: #f5f5f5; padding: 10px; border-radius: 4px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Servidor WhatsApp Replit</h1>
        <div class="status">
          Status: ${serverStatus} <br>
          Servidor ativo desde: ${new Date().toLocaleString()} <br>
          <button onclick="window.location.reload()">Atualizar</button>
        </div>
        
        <h2>Mensagens recebidas:</h2>
        <pre>${
          fs.existsSync(logFile) 
            ? JSON.stringify(JSON.parse(fs.readFileSync(logFile, 'utf8')), null, 2) 
            : '[]'
        }</pre>
      </body>
    </html>
  `);
});

// API simples

// Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status: serverStatus });
});

// Conectar
app.post('/api/whatsapp/connect', (req, res) => {
  serverStatus = 'connected';
  res.json({ success: true, status: serverStatus });
});

// QR Code (não é necessário no modo compatível)
app.get('/api/whatsapp/qrcode', (req, res) => {
  res.json({ 
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=kento-delivery-replit-compatible",
    status: "qr_ready" 
  });
});

// Enviar mensagem
app.post('/api/whatsapp/send-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }
  
  const messageId = 'msg_' + Date.now();
  const saved = saveMessage({
    id: messageId,
    phoneNumber,
    message,
    type: 'direct'
  });
  
  res.json({
    success: saved,
    messageId,
    status: serverStatus
  });
});

// Enviar status de pedido
app.post('/api/whatsapp/send-order-status', (req, res) => {
  const { orderId, status, phoneNumber, message } = req.body;
  
  if (!orderId || !status || !phoneNumber || !message) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  const messageId = 'order_' + Date.now();
  const saved = saveMessage({
    id: messageId,
    orderId,
    status,
    phoneNumber,
    message,
    type: 'order_status'
  });
  
  res.json({
    success: saved,
    messageId,
    status: serverStatus
  });
});

// Iniciar o servidor
const PORT = 3333;
const server = http.createServer(app);

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para ver o status`);
});