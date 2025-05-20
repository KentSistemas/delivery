// Sistema real de WhatsApp para Kent Delivery
const qrcode = require('qrcode-terminal');
const { Client } = require('whatsapp-web.js');
const fs = require('fs');
const path = require('path');
const express = require('express');
const cors = require('cors');
const http = require('http');
const bodyParser = require('body-parser');

// Configuração do Express
const app = express();
app.use(cors());
app.use(bodyParser.json());
const server = http.createServer(app);

// Diretório para autenticação
const AUTH_DIR = path.join(__dirname, './whatsapp-session');
if (!fs.existsSync(AUTH_DIR)) {
  fs.mkdirSync(AUTH_DIR, { recursive: true });
}

// Estado do cliente
let clientStatus = 'disconnected';
let qrCodeData = null;
let lastQrTimestamp = null;
let whatsappClient = null;

// Função para inicializar o cliente WhatsApp
function initWhatsAppClient() {
  console.log('Inicializando cliente WhatsApp...');
  
  whatsappClient = new Client({
    authStrategy: new (require('whatsapp-web.js')).LocalAuth({ 
      clientId: 'kento-delivery-client',
      dataPath: AUTH_DIR
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

  // Evento para QR Code
  whatsappClient.on('qr', (qr) => {
    console.log('QR Code recebido, gerando imagem...');
    qrCodeData = qr;
    lastQrTimestamp = Date.now();
    clientStatus = 'qr_ready';
    
    // Gerar QR code para terminal
    qrcode.generate(qr, { small: true });
    console.log('\n\nEscaneie o QR Code acima com o WhatsApp do seu celular para conectar');
    console.log('Ou acesse http://localhost:3333 para ver o QR Code em formato maior\n\n');
  });

  // Evento para autenticação bem-sucedida
  whatsappClient.on('authenticated', () => {
    console.log('Autenticação realizada com sucesso!');
    clientStatus = 'authenticated';
    qrCodeData = null;
  });

  // Evento para quando cliente está pronto
  whatsappClient.on('ready', () => {
    console.log('Cliente WhatsApp está pronto para uso!');
    clientStatus = 'connected';
    qrCodeData = null;
  });

  // Evento para desconexão
  whatsappClient.on('disconnected', (reason) => {
    console.log('Cliente desconectado:', reason);
    clientStatus = 'disconnected';
    qrCodeData = null;
    
    // Reiniciar após alguns segundos
    setTimeout(() => {
      console.log('Tentando reconectar...');
      initWhatsAppClient();
    }, 5000);
  });

  // Iniciar cliente
  whatsappClient.initialize().catch(err => {
    console.error('Erro ao inicializar cliente:', err);
    clientStatus = 'error';
  });
}

// API endpoints

// Obter status
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: clientStatus,
    hasQrCode: !!qrCodeData,
    lastQrTimestamp: lastQrTimestamp
  });
});

// Obter QR Code
app.get('/api/whatsapp/qrcode', (req, res) => {
  if (clientStatus === 'qr_ready' && qrCodeData) {
    res.json({ qrCode: qrCodeData });
  } else {
    res.status(404).json({ error: 'QR Code não disponível no momento' });
  }
});

// Conectar cliente
app.post('/api/whatsapp/connect', (req, res) => {
  if (clientStatus === 'connected') {
    return res.json({ success: true, message: 'Cliente já está conectado' });
  }
  
  initWhatsAppClient();
  res.json({ success: true, message: 'Iniciando conexão com WhatsApp' });
});

// Desconectar cliente
app.post('/api/whatsapp/disconnect', (req, res) => {
  if (whatsappClient) {
    whatsappClient.destroy();
    clientStatus = 'disconnected';
    whatsappClient = null;
  }
  
  res.json({ success: true, message: 'Cliente desconectado' });
});

// Enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios' });
  }
  
  if (clientStatus !== 'connected' || !whatsappClient) {
    return res.status(400).json({ error: 'Cliente WhatsApp não está conectado' });
  }
  
  try {
    // Formatar número (remover caracteres não numéricos e adicionar @c.us)
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.endsWith('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }
    
    const chat = await whatsappClient.getChatById(formattedNumber);
    
    // Simular digitação
    await chat.sendStateTyping();
    
    // Delay para parecer mais natural
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enviar mensagem
    const response = await whatsappClient.sendMessage(formattedNumber, message);
    
    console.log(`Mensagem enviada para ${formattedNumber}`);
    
    res.json({ 
      success: true, 
      messageId: response.id._serialized
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem', details: error.message });
  }
});

// Enviar mensagem de status de pedido
app.post('/api/whatsapp/send-order-status', async (req, res) => {
  const { orderId, status, phoneNumber, message } = req.body;
  
  if (!orderId || !status || !phoneNumber || !message) {
    return res.status(400).json({ error: 'Todos os parâmetros são obrigatórios' });
  }
  
  if (clientStatus !== 'connected' || !whatsappClient) {
    return res.status(400).json({ error: 'Cliente WhatsApp não está conectado' });
  }
  
  try {
    // Formatar número
    let formattedNumber = phoneNumber.replace(/\D/g, '');
    if (!formattedNumber.endsWith('@c.us')) {
      formattedNumber = `${formattedNumber}@c.us`;
    }

    const chat = await whatsappClient.getChatById(formattedNumber);
    
    // Simular digitação
    await chat.sendStateTyping();
    
    // Delay para parecer mais natural
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Enviar mensagem
    const response = await whatsappClient.sendMessage(formattedNumber, message);
    
    console.log(`Mensagem de status enviada para ${formattedNumber}: ${status}`);
    
    res.json({ 
      success: true, 
      messageId: response.id._serialized
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de status:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem de status', details: error.message });
  }
});

// Página de status
app.get('/', (req, res) => {
  res.send(`
    <html>
      <head>
        <title>Servidor WhatsApp Kent Delivery</title>
        <style>
          body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 15px; border-radius: 5px; margin-bottom: 20px; }
          .connected { background-color: #d4edda; color: #155724; }
          .disconnected { background-color: #f8d7da; color: #721c24; }
          .qr-code { margin: 20px 0; }
          h1 { color: #333; }
        </style>
      </head>
      <body>
        <h1>Servidor WhatsApp Kent Delivery</h1>
        <div class="status ${clientStatus === 'connected' ? 'connected' : 'disconnected'}">
          <strong>Status:</strong> ${clientStatus}<br>
          <strong>Hora atual:</strong> ${new Date().toLocaleString()}
        </div>
        
        ${clientStatus === 'qr_ready' && qrCodeData ? 
          `<div class="qr-code">
            <h2>QR Code para conexão</h2>
            <p>Abra o WhatsApp no seu celular e escaneie o QR Code abaixo:</p>
            <div id="qrcode"></div>
            <script src="https://cdn.jsdelivr.net/npm/qrcode@1.4.4/build/qrcode.min.js"></script>
            <script>
              QRCode.toCanvas(document.getElementById('qrcode'), "${qrCodeData}", function (error) {
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
const PORT = process.env.PORT || 3333;
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT} para verificar o status`);
});

// Inicializar cliente na startup
initWhatsAppClient();