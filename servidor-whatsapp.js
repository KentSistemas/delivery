// Servidor WhatsApp Simplificado para Replit
const express = require('express');
const app = express();
const http = require('http').Server(app);
const cors = require('cors');
const fs = require('fs');
const path = require('path');

// Middleware
app.use(cors());
app.use(express.json());

// Pasta para logs
const logsDir = path.join(__dirname, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Arquivo de mensagens
const messagesFile = path.join(logsDir, 'mensagens.json');
if (!fs.existsSync(messagesFile)) {
  fs.writeFileSync(messagesFile, JSON.stringify([]));
}

// Estado do servidor
let status = 'connected';
let mensagens = [];

try {
  const data = fs.readFileSync(messagesFile, 'utf8');
  if (data) {
    mensagens = JSON.parse(data);
  }
} catch (error) {
  console.error('Erro ao carregar mensagens:', error);
}

// Salvar mensagem
function salvarMensagem(mensagem) {
  mensagens.push({
    ...mensagem,
    data: new Date().toISOString()
  });
  
  fs.writeFileSync(messagesFile, JSON.stringify(mensagens, null, 2));
}

// Rotas API

// Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status });
});

// Conectar
app.post('/api/whatsapp/connect', (req, res) => {
  status = 'connected';
  res.json({ success: true });
});

// Enviar mensagem
app.post('/api/whatsapp/send-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }
  
  console.log(`Enviando mensagem para ${phoneNumber}: ${message}`);
  
  // Salvar mensagem
  salvarMensagem({
    tipo: 'mensagem_direta',
    telefone: phoneNumber,
    mensagem: message
  });
  
  res.json({ success: true });
});

// Enviar status de pedido
app.post('/api/whatsapp/send-order-status', (req, res) => {
  const { orderId, status, phoneNumber, message } = req.body;
  
  if (!orderId || !status || !phoneNumber || !message) {
    return res.status(400).json({ error: 'Todos os campos são obrigatórios' });
  }
  
  console.log(`Enviando status ${status} do pedido ${orderId} para ${phoneNumber}`);
  
  // Salvar mensagem
  salvarMensagem({
    tipo: 'status_pedido',
    pedido: orderId,
    status: status,
    telefone: phoneNumber,
    mensagem: message
  });
  
  res.json({ success: true });
});

// Página principal
app.get('/', (req, res) => {
  let html = `
    <html>
      <head>
        <title>Servidor WhatsApp</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 10px; margin-bottom: 20px; background: #d4edda; border-radius: 4px; }
          .mensagem { padding: 10px; margin-bottom: 10px; background: #f8f9fa; border-radius: 4px; }
          button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Servidor WhatsApp</h1>
        
        <div class="status">
          Status: ${status} <br>
          Mensagens enviadas: ${mensagens.length}
        </div>
        
        <button onclick="window.location.reload()">Atualizar</button>
        
        <h2>Mensagens Enviadas</h2>
  `;
  
  // Mostrar mensagens
  if (mensagens.length === 0) {
    html += '<p>Nenhuma mensagem enviada</p>';
  } else {
    mensagens.forEach(msg => {
      html += `
        <div class="mensagem">
          <div><strong>Tipo:</strong> ${msg.tipo}</div>
          <div><strong>Telefone:</strong> ${msg.telefone}</div>
          ${msg.pedido ? `<div><strong>Pedido:</strong> ${msg.pedido}</div>` : ''}
          ${msg.status ? `<div><strong>Status:</strong> ${msg.status}</div>` : ''}
          <div><strong>Mensagem:</strong> ${msg.mensagem}</div>
          <div><small>Data: ${new Date(msg.data).toLocaleString()}</small></div>
        </div>
      `;
    });
  }
  
  html += `
      </body>
    </html>
  `;
  
  res.send(html);
});

// Iniciar servidor
const PORT = 3333;
http.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para ver o status`);
});