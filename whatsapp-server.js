// Servidor WhatsApp real usando whatsapp-web.js
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const bodyParser = require('body-parser');

// Configurar o servidor Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Estado do cliente WhatsApp
let whatsappClient = null;
let currentQRCode = null;
let connectionStatus = 'disconnected';

// Inicializar o cliente do WhatsApp
function initializeWhatsAppClient() {
  try {
    console.log('Inicializando cliente WhatsApp...');
    
    // Fechar cliente existente se houver
    if (whatsappClient) {
      try {
        whatsappClient.destroy();
      } catch (err) {
        console.error('Erro ao destruir cliente anterior:', err);
      }
    }
    
    // Criar novo cliente
    whatsappClient = new Client({
      puppeteer: {
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu'
        ],
      },
      authStrategy: new LocalAuth({
        clientId: 'kento-delivery-whatsapp-bot',
        dataPath: './whatsapp-sessions/'
      }),
      webVersionCache: {
        type: 'remote',
      }
    });
    
    // Manipular eventos do cliente
    whatsappClient.on('qr', (qr) => {
      console.log('QR Code gerado');
      // Converter o QR para uma URL de imagem base64
      qrcode.toDataURL(qr, (err, url) => {
        if (err) {
          console.error('Erro ao gerar QR code:', err);
        } else {
          currentQRCode = url;
          connectionStatus = 'qr_ready';
          console.log('QR code convertido para URL');
        }
      });
    });
    
    whatsappClient.on('ready', () => {
      console.log('Cliente WhatsApp está pronto!');
      connectionStatus = 'connected';
      currentQRCode = null;
    });
    
    whatsappClient.on('authenticated', () => {
      console.log('Cliente WhatsApp autenticado');
    });
    
    whatsappClient.on('auth_failure', (err) => {
      console.error('Falha na autenticação do WhatsApp:', err);
      connectionStatus = 'disconnected';
    });
    
    whatsappClient.on('disconnected', (reason) => {
      console.log('Cliente WhatsApp desconectado:', reason);
      connectionStatus = 'disconnected';
      currentQRCode = null;
      
      // Reinicializar após desconexão
      setTimeout(() => {
        initializeWhatsAppClient();
      }, 5000);
    });
    
    // Iniciar cliente
    whatsappClient.initialize();
    
    return true;
  } catch (error) {
    console.error('Erro ao inicializar cliente WhatsApp:', error);
    connectionStatus = 'disconnected';
    return false;
  }
}

// Rotas da API WhatsApp
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: connectionStatus,
    hasQRCode: currentQRCode !== null
  });
});

app.get('/api/whatsapp/qrcode', (req, res) => {
  if (currentQRCode) {
    res.json({ qrCode: currentQRCode });
  } else {
    res.status(404).json({ error: 'QR code não disponível' });
  }
});

app.post('/api/whatsapp/connect', (req, res) => {
  const success = initializeWhatsAppClient();
  if (success) {
    res.json({ message: 'Conectando WhatsApp...' });
  } else {
    res.status(500).json({ error: 'Falha ao iniciar cliente WhatsApp' });
  }
});

app.post('/api/whatsapp/disconnect', (req, res) => {
  if (whatsappClient) {
    try {
      whatsappClient.destroy();
      whatsappClient = null;
      connectionStatus = 'disconnected';
      currentQRCode = null;
      res.json({ message: 'WhatsApp desconectado' });
    } catch (error) {
      console.error('Erro ao desconectar WhatsApp:', error);
      res.status(500).json({ error: 'Falha ao desconectar: ' + error.message });
    }
  } else {
    res.json({ message: 'WhatsApp já está desconectado' });
  }
});

app.post('/api/whatsapp/send-message', async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios' });
  }
  
  if (!whatsappClient || connectionStatus !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }
  
  try {
    // Formatar número (adicionar o código do país se necessário)
    let formattedNumber = phoneNumber;
    if (!formattedNumber.includes('@c.us')) {
      // Remover qualquer caractere não numérico
      formattedNumber = formattedNumber.replace(/\D/g, '');
      
      // Adicionar código do Brasil se não começar com 55
      if (!formattedNumber.startsWith('55')) {
        formattedNumber = '55' + formattedNumber;
      }
      
      // Adicionar sufixo do WhatsApp
      formattedNumber = formattedNumber + '@c.us';
    }
    
    // Enviar mensagem
    const result = await whatsappClient.sendMessage(formattedNumber, message);
    
    res.json({
      success: true,
      messageId: result.id.id,
      phoneNumber: formattedNumber
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem: ' + error.message
    });
  }
});

app.post('/api/whatsapp/send-order-status', async (req, res) => {
  const { orderId, status, phoneNumber, message } = req.body;
  
  if (!orderId || !status || !phoneNumber || !message) {
    return res.status(400).json({ 
      error: 'Todos os campos são obrigatórios: orderId, status, phoneNumber, message'
    });
  }
  
  if (!whatsappClient || connectionStatus !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }
  
  try {
    // Formatar número (adicionar o código do país se necessário)
    let formattedNumber = phoneNumber;
    if (!formattedNumber.includes('@c.us')) {
      // Remover qualquer caractere não numérico
      formattedNumber = formattedNumber.replace(/\D/g, '');
      
      // Adicionar código do Brasil se não começar com 55
      if (!formattedNumber.startsWith('55')) {
        formattedNumber = '55' + formattedNumber;
      }
      
      // Adicionar sufixo do WhatsApp
      formattedNumber = formattedNumber + '@c.us';
    }
    
    // Enviar mensagem
    const result = await whatsappClient.sendMessage(formattedNumber, message);
    
    res.json({
      success: true,
      messageId: result.id.id,
      phoneNumber: formattedNumber,
      orderId,
      status
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de status do pedido:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem: ' + error.message
    });
  }
});

// Iniciar o servidor
const PORT = process.env.WHATSAPP_SERVER_PORT || 5001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  
  // Inicializar WhatsApp automaticamente
  setTimeout(() => {
    initializeWhatsAppClient();
  }, 5000);
});