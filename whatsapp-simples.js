const express = require('express');
const http = require('http');
const cors = require('cors');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const fs = require('fs');

// Configuração do servidor Express
const app = express();
app.use(cors());
app.use(express.json());

// Status do WhatsApp
let whatsappStatus = 'disconnected';
let qrCodeData = null;

// Inicialização do cliente WhatsApp
const client = new Client({
  authStrategy: new LocalAuth({ clientId: 'cardapio-digital' }),
  puppeteer: {
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--disable-gpu'
    ],
  }
});

// Evento quando o QR code é recebido
client.on('qr', (qr) => {
  console.log('QR Code recebido:', qr);
  qrCodeData = qr;
  whatsappStatus = 'qr_received';
  
  // Gerar uma imagem do QR code (opcional)
  qrcode.toFile('./qrcode.png', qr, {
    color: {
      dark: '#000000',
      light: '#ffffff'
    }
  }, (err) => {
    if (err) console.error('Erro ao gerar QR code:', err);
    else console.log('QR code gerado com sucesso!');
  });
});

// Evento quando o cliente está pronto
client.on('ready', () => {
  console.log('Cliente WhatsApp está pronto!');
  whatsappStatus = 'connected';
});

// Evento de autenticação
client.on('authenticated', () => {
  console.log('Autenticado com sucesso!');
  whatsappStatus = 'authenticated';
});

// Evento de desconexão
client.on('disconnected', (reason) => {
  console.log('Cliente desconectado:', reason);
  whatsappStatus = 'disconnected';
});

// Iniciar o cliente
try {
  client.initialize();
  console.log('Inicializando cliente WhatsApp...');
} catch (error) {
  console.error('Erro ao inicializar o cliente:', error);
}

// Rota para obter o status atual
app.get('/status', (req, res) => {
  res.json({
    status: whatsappStatus,
    qrCode: whatsappStatus === 'qr_received' ? qrCodeData : null
  });
});

// Rota para obter o QR code atual
app.get('/qrcode', (req, res) => {
  if (whatsappStatus === 'qr_received' && qrCodeData) {
    res.send({ qrCode: qrCodeData });
  } else {
    res.status(404).send({ error: 'QR code não disponível' });
  }
});

// Rota para enviar mensagem
app.post('/send', async (req, res) => {
  if (whatsappStatus !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }

  const { number, message } = req.body;
  
  if (!number || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }

  try {
    // Formatar o número (remover caracteres não numéricos e adicionar @c.us)
    const formattedNumber = `${number.replace(/\D/g, '')}@c.us`;
    
    // Enviar a mensagem
    const response = await client.sendMessage(formattedNumber, message);
    
    console.log(`Mensagem enviada para ${formattedNumber}:`, message);
    
    res.json({ 
      success: true, 
      messageId: response.id._serialized,
      to: formattedNumber
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({ error: 'Erro ao enviar mensagem', details: error.message });
  }
});

// Criar o servidor HTTP
const server = http.createServer(app);

// Definir a porta
const PORT = 3333;

// Iniciar o servidor
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp está rodando na porta ${PORT}`);
  console.log(`Acesse http://localhost:${PORT}/status para verificar o status`);
});