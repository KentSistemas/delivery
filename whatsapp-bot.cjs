// WhatsApp Bot para Kent Delivery (versão compatível com Replit)
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');

// Configurações do servidor
const app = express();
app.use(cors());
app.use(express.json());
const server = http.createServer(app);

// Pasta para autenticação
const SESSION_DIR = path.join(__dirname, 'whatsapp-session');
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Inicialização do cliente
console.log('Iniciando cliente WhatsApp...');
const client = new Client({
  authStrategy: new (require('whatsapp-web.js')).LocalAuth({
    clientId: 'kento-delivery',
    dataPath: SESSION_DIR
  }),
  puppeteer: {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ]
  }
});

// Variáveis de estado
let clientStatus = 'initializing';
let qrCodeData = null;

// Eventos do WhatsApp

// QR Code
client.on('qr', (qr) => {
  console.log('QR Code recebido:');
  qrCodeData = qr;
  clientStatus = 'qr_ready';
  
  // Mostrar QR code no terminal
  qrcode.generate(qr, { small: true });
  console.log('');
  console.log('Escaneie o QR Code acima com seu WhatsApp');
  console.log('Ou acesse http://localhost:3333 para ver um QR Code maior');
});

// Autenticação bem-sucedida
client.on('authenticated', () => {
  console.log('Autenticado com sucesso!');
  clientStatus = 'authenticated';
});

// Cliente pronto
client.on('ready', () => {
  console.log('Cliente WhatsApp pronto para uso!');
  clientStatus = 'connected';
});

// Mensagem recebida
client.on('message', async (msg) => {
  console.log(`Mensagem recebida: ${msg.body} (de ${msg.from})`);
  
  // Responder a mensagens que contenham menu/cardápio
  if (msg.body.match(/(menu|Menu|cardapio|Cardapio|opcoes|Opcoes)/i) && msg.from.endsWith('@c.us')) {
    const chat = await msg.getChat();
    
    // Simular digitação
    await chat.sendStateTyping();
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enviar resposta
    const contact = await msg.getContact();
    const name = contact.pushname || 'Cliente';
    
    client.sendMessage(msg.from, 
      `Olá ${name}! Seja bem-vindo ao Kent Delivery! 🍔🍕\n\n` +
      `Nosso cardápio digital está disponível em:\n` +
      `https://jfbebidaseconveniencia.kentdelivery.com.br\n\n` +
      `Faça seu pedido diretamente no site e acompanhe em tempo real!`
    );
  }
});

// Desconexão
client.on('disconnected', (reason) => {
  console.log('Cliente desconectado:', reason);
  clientStatus = 'disconnected';
  
  // Tentar reconectar após 10 segundos
  setTimeout(() => {
    console.log('Tentando reconectar...');
    client.initialize();
  }, 10000);
});

// Inicializar cliente
try {
  client.initialize();
} catch (error) {
  console.error('Erro ao inicializar o cliente:', error);
  clientStatus = 'error';
}

// APIs do servidor

// Status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: clientStatus,
    hasQrCode: !!qrCodeData
  });
});

// QR Code
app.get('/api/whatsapp/qrcode', (req, res) => {
  if (clientStatus === 'qr_ready' && qrCodeData) {
    res.json({ qrCode: qrCodeData });
  } else {
    res.status(404).json({ error: 'QR Code não disponível no momento' });
  }
});

// Conectar
app.post('/api/whatsapp/connect', (req, res) => {
  if (clientStatus === 'connected') {
    return res.json({ success: true, message: 'Cliente já está conectado' });
  }
  
  try {
    client.initialize();
    res.json({ success: true, message: 'Iniciando conexão' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }
  
  if (clientStatus !== 'connected') {
    return res.status(400).json({ error: 'Cliente não está conectado' });
  }
  
  try {
    // Formatar número
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.endsWith('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    // Enviar mensagem
    const response = await client.sendMessage(formattedNumber, message);
    console.log(`Mensagem enviada para ${formattedNumber}`);
    
    res.json({ 
      success: true, 
      messageId: response.id._serialized 
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: error.message });
  }
});

// Enviar mensagem de status de pedido
app.post('/api/whatsapp/send-order-status', async (req, res) => {
  const { orderId, status, phoneNumber, message } = req.body;
  
  if (!orderId || !status || !phoneNumber || !message) {
    return res.status(400).json({ error: 'Todos os parâmetros são obrigatórios' });
  }
  
  if (clientStatus !== 'connected') {
    return res.status(400).json({ error: 'Cliente não está conectado' });
  }
  
  try {
    // Formatar número
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.endsWith('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    // Tentar obter o chat
    const chat = await client.getChatById(formattedNumber);
    if (chat) {
      await chat.sendStateTyping();
      await new Promise(resolve => setTimeout(resolve, 1500));
    }
    
    // Enviar mensagem
    const response = await client.sendMessage(formattedNumber, message);
    console.log(`Mensagem de status '${status}' enviada para ${formattedNumber}`);
    
    res.json({ 
      success: true, 
      messageId: response.id._serialized 
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de status:', error);
    res.status(500).json({ error: error.message });
  }
});

// Página principal
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>WhatsApp Bot Kent Delivery</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .connected { background-color: #d4edda; color: #155724; }
          .disconnected { background-color: #f8d7da; color: #721c24; }
          .qr-ready { background-color: #fff3cd; color: #856404; }
          .qr-code { margin: 20px 0; text-align: center; }
          h1 { color: #333; }
          button { padding: 10px 15px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
        </style>
      </head>
      <body>
        <h1>WhatsApp Bot Kent Delivery</h1>
        <div class="status ${
          clientStatus === 'connected' ? 'connected' : 
          clientStatus === 'qr_ready' ? 'qr-ready' : 'disconnected'
        }">
          <strong>Status:</strong> ${clientStatus}<br>
          <strong>Hora atual:</strong> ${new Date().toLocaleString()}
        </div>
        
        ${clientStatus === 'qr_ready' && qrCodeData ? 
          `<div class="qr-code">
            <h2>QR Code para conexão</h2>
            <p>Abra o WhatsApp no seu celular e escaneie o QR Code:</p>
            <div id="qrcode"></div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
            <script>
              QRCode.toCanvas(document.getElementById('qrcode'), "${qrCodeData}", {
                width: 300,
                margin: 1
              }, function (error) {
                if (error) console.error(error);
              });
            </script>
          </div>` 
        : ''}
        
        <p>
          <button onclick="window.location.reload()">Atualizar página</button>
        </p>
      </body>
    </html>
  `);
});

// Iniciar servidor
const PORT = 3333;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para verificar o status`);
});