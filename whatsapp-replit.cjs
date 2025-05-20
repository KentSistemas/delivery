// Servidor WhatsApp para Replit - Modo Compatível
const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const http = require('http');

// Diretório para armazenar dados do WhatsApp
const dataDir = path.join(__dirname, 'whatsapp-data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Arquivo para armazenar mensagens em buffer
const messagesFile = path.join(dataDir, 'messages.json');
if (!fs.existsSync(messagesFile)) {
  fs.writeFileSync(messagesFile, JSON.stringify([]));
}

// Configurar o servidor Express
const app = express();
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);

// Estado do servidor
let connectionStatus = 'connected'; // Simulamos sempre conectado
let qrCodeData = null;
let connectionTime = new Date().toISOString();

// Função para carregar mensagens do buffer
function loadMessages() {
  try {
    const data = fs.readFileSync(messagesFile, 'utf8');
    return JSON.parse(data);
  } catch (error) {
    console.error('Erro ao carregar mensagens:', error);
    return [];
  }
}

// Função para salvar mensagens no buffer
function saveMessage(message) {
  try {
    const messages = loadMessages();
    messages.push({
      ...message,
      sentAt: new Date().toISOString(),
      status: 'queued'
    });
    fs.writeFileSync(messagesFile, JSON.stringify(messages, null, 2));
  } catch (error) {
    console.error('Erro ao salvar mensagem:', error);
  }
}

// Rota: Status do servidor
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: connectionStatus,
    hasQRCode: false,
    uptime: Math.floor((new Date() - new Date(connectionTime)) / 1000),
    mode: 'replit-compatible'
  });
});

// Rota alternativa para status (sem /api)
app.get('/whatsapp/status', (req, res) => {
  res.json({
    status: connectionStatus,
    hasQRCode: false,
    uptime: Math.floor((new Date() - new Date(connectionTime)) / 1000),
    mode: 'replit-compatible'
  });
});

// Rota: QR Code (simulado)
app.get('/api/whatsapp/qrcode', (req, res) => {
  // Retornamos um QR code "fictício" que mostra que estamos em modo compatível
  res.json({ 
    qrCode: "https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=kento-delivery-whatsapp-replit-compatible-mode", 
    message: "Modo compatível ativado. QR código não necessário." 
  });
});

// Rota: Conectar (simulada)
app.post('/api/whatsapp/connect', (req, res) => {
  connectionStatus = 'connected';
  connectionTime = new Date().toISOString();
  res.json({ 
    success: true, 
    message: 'Modo compatível ativo. Servidor pronto para receber mensagens.'
  });
});

// Rota: Desconectar (simulada)
app.post('/api/whatsapp/disconnect', (req, res) => {
  connectionStatus = 'disconnected';
  res.json({ message: 'Servidor WhatsApp desconectado' });
  
  // Reconectar automaticamente após 5 segundos
  setTimeout(() => {
    connectionStatus = 'connected';
    console.log('Servidor WhatsApp reconectado automaticamente');
  }, 5000);
});

// Rota: Enviar mensagem
app.post('/api/whatsapp/send-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios' });
  }
  
  // Formatar número
  let formattedNumber = phoneNumber;
  formattedNumber = formattedNumber.replace(/\D/g, '');
  if (!formattedNumber.startsWith('55')) {
    formattedNumber = '55' + formattedNumber;
  }
  
  console.log(`[WhatsApp Replit] Mensagem para ${formattedNumber}: ${message}`);
  
  // Salvar a mensagem no buffer para possível envio futuro
  const messageData = {
    id: 'msg_' + Date.now(),
    phoneNumber: formattedNumber,
    message,
    type: 'direct'
  };
  
  saveMessage(messageData);
  
  res.json({
    success: true,
    messageId: messageData.id,
    note: 'Mensagem recebida pelo servidor compatível com Replit'
  });
});

// Rota: Enviar mensagem de status de pedido
app.post('/api/whatsapp/send-order-status', (req, res) => {
  const { orderId, status, phoneNumber, message } = req.body;
  
  if (!orderId || !status || !phoneNumber || !message) {
    return res.status(400).json({ 
      error: 'Todos os campos são obrigatórios: orderId, status, phoneNumber, message'
    });
  }
  
  // Formatar número
  let formattedNumber = phoneNumber;
  formattedNumber = formattedNumber.replace(/\D/g, '');
  if (!formattedNumber.startsWith('55')) {
    formattedNumber = '55' + formattedNumber;
  }
  
  console.log(`[WhatsApp Replit] Status para ${formattedNumber}: ${status} - ${message}`);
  
  // Salvar a mensagem no buffer
  const messageData = {
    id: 'order_' + Date.now(),
    orderId,
    status,
    phoneNumber: formattedNumber,
    message,
    type: 'order_status'
  };
  
  saveMessage(messageData);
  
  res.json({
    success: true,
    messageId: messageData.id,
    note: 'Status de pedido recebido pelo servidor compatível com Replit'
  });
});

// Rota: Listar mensagens em buffer
app.get('/api/whatsapp/messages', (req, res) => {
  const messages = loadMessages();
  res.json(messages);
});

// Rota: Limpar mensagens em buffer
app.delete('/api/whatsapp/messages', (req, res) => {
  fs.writeFileSync(messagesFile, JSON.stringify([]));
  res.json({ success: true, message: 'Mensagens em buffer limpas' });
});

// Página de status do servidor
app.get('/', (req, res) => {
  const uptime = Math.floor((new Date() - new Date(connectionTime)) / 1000);
  const messages = loadMessages();
  
  res.send(`
    <html>
      <head>
        <title>Servidor WhatsApp - Modo Replit</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; max-width: 800px; margin: 0 auto; }
          .status { padding: 10px; border-radius: 5px; margin-bottom: 20px; }
          .connected { background-color: #d4edda; color: #155724; }
          .disconnected { background-color: #f8d7da; color: #721c24; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 8px; text-align: left; border-bottom: 1px solid #ddd; }
          th { background-color: #f2f2f2; }
          .refresh { margin-top: 20px; }
        </style>
      </head>
      <body>
        <h1>Servidor WhatsApp - Modo Compatível com Replit</h1>
        <div class="status ${connectionStatus === 'connected' ? 'connected' : 'disconnected'}">
          Status: ${connectionStatus === 'connected' ? 'Conectado' : 'Desconectado'}<br>
          Tempo online: ${Math.floor(uptime / 60)} minutos e ${uptime % 60} segundos
        </div>
        
        <h2>Mensagens em Buffer (${messages.length})</h2>
        <table>
          <tr>
            <th>ID</th>
            <th>Tipo</th>
            <th>Telefone</th>
            <th>Mensagem</th>
            <th>Hora</th>
          </tr>
          ${messages.map(msg => `
            <tr>
              <td>${msg.id}</td>
              <td>${msg.type}</td>
              <td>${msg.phoneNumber}</td>
              <td>${msg.message}</td>
              <td>${new Date(msg.sentAt).toLocaleString()}</td>
            </tr>
          `).join('')}
        </table>
        
        <div class="refresh">
          <button onclick="window.location.reload()">Atualizar</button>
        </div>
      </body>
    </html>
  `);
});

// Configurar CORS para permitir acesso de qualquer origem
app.use(function(req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  if ('OPTIONS' === req.method) {
    return res.sendStatus(200);
  }
  next();
});

// Iniciar o servidor
const PORT = process.env.PORT || 3333;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp (Modo Replit) rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para ver o status`);
  
  connectionStatus = 'connected';
  console.log('Servidor pronto para receber mensagens');
});