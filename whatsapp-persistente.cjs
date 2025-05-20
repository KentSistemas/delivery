// Servidor WhatsApp persistente para uso em produção
const express = require('express');
const { Client, LocalAuth } = require('whatsapp-web.js');
const qrcode = require('qrcode');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');

// Diretório para armazenar as sessões do WhatsApp
const SESSION_DIR = path.join(__dirname, 'whatsapp-sessions');
if (!fs.existsSync(SESSION_DIR)) {
  fs.mkdirSync(SESSION_DIR, { recursive: true });
}

// Inicializar o servidor Express
const app = express();
app.use(cors());
app.use(bodyParser.json());

// Estado do cliente WhatsApp
let whatsappClient = null;
let qrCodeData = null;
let connectionStatus = 'disconnected';

// Função para inicializar o cliente WhatsApp
function initWhatsAppClient() {
  if (whatsappClient) {
    console.log('Cliente WhatsApp já existe, destruindo...');
    try {
      whatsappClient.destroy();
    } catch (err) {
      console.error('Erro ao destruir cliente WhatsApp:', err);
    }
    whatsappClient = null;
  }

  console.log('Inicializando cliente WhatsApp...');
  
  // Criar cliente com a configuração necessária para produção
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
      clientId: 'kento-delivery-whatsapp',
      dataPath: SESSION_DIR
    }),
    webVersionCache: {
      type: 'remote',
    }
  });

  // Evento: QR Code gerado
  whatsappClient.on('qr', (qr) => {
    console.log('QR Code gerado pelo WhatsApp.');
    
    // Converter QR code para imagem e armazenar
    qrcode.toDataURL(qr, (err, url) => {
      if (err) {
        console.error('Erro ao gerar QR code:', err);
      } else {
        qrCodeData = url;
        connectionStatus = 'qr_ready';
        console.log('QR Code pronto para digitalização.');
      }
    });
  });

  // Evento: Cliente pronto
  whatsappClient.on('ready', () => {
    console.log('Cliente WhatsApp está pronto e conectado!');
    connectionStatus = 'connected';
    qrCodeData = null;
  });

  // Evento: Cliente autenticado
  whatsappClient.on('authenticated', () => {
    console.log('Cliente WhatsApp autenticado com sucesso!');
  });

  // Evento: Falha na autenticação
  whatsappClient.on('auth_failure', (err) => {
    console.error('Falha na autenticação do WhatsApp:', err);
    connectionStatus = 'disconnected';
    
    // Tentar inicializar novamente após falha
    setTimeout(() => {
      console.log('Tentando reconectar após falha de autenticação...');
      initWhatsAppClient();
    }, 10000);
  });

  // Evento: Cliente desconectado
  whatsappClient.on('disconnected', (reason) => {
    console.log('Cliente WhatsApp desconectado. Motivo:', reason);
    connectionStatus = 'disconnected';
    
    // Tentar reconectar automaticamente
    setTimeout(() => {
      console.log('Tentando reconectar após desconexão...');
      initWhatsAppClient();
    }, 10000);
  });

  // Inicializar o cliente
  whatsappClient.initialize().catch(err => {
    console.error('Erro ao inicializar cliente WhatsApp:', err);
    connectionStatus = 'disconnected';
    
    // Tentar inicializar novamente após um tempo
    setTimeout(() => {
      console.log('Tentando reconectar após erro de inicialização...');
      initWhatsAppClient();
    }, 10000);
  });
}

// Rota: Status da conexão
app.get('/api/whatsapp/status', (req, res) => {
  res.json({
    status: connectionStatus,
    hasQRCode: qrCodeData !== null
  });
});

// Rota: Obter QR Code
app.get('/api/whatsapp/qrcode', (req, res) => {
  if (qrCodeData) {
    res.json({ qrCode: qrCodeData });
  } else {
    res.status(404).json({ error: 'QR code não disponível' });
  }
});

// Rota: Conectar WhatsApp
app.post('/api/whatsapp/connect', (req, res) => {
  try {
    console.log('Solicitação recebida para conectar WhatsApp');
    initWhatsAppClient();
    res.json({ message: 'Iniciando conexão com WhatsApp...' });
  } catch (error) {
    console.error('Erro ao iniciar conexão:', error);
    res.status(500).json({ error: 'Erro ao iniciar conexão: ' + error.message });
  }
});

// Rota: Desconectar WhatsApp
app.post('/api/whatsapp/disconnect', (req, res) => {
  if (!whatsappClient) {
    return res.json({ message: 'Cliente WhatsApp já está desconectado' });
  }
  
  try {
    whatsappClient.destroy();
    whatsappClient = null;
    connectionStatus = 'disconnected';
    qrCodeData = null;
    res.json({ message: 'WhatsApp desconectado com sucesso' });
  } catch (error) {
    console.error('Erro ao desconectar WhatsApp:', error);
    res.status(500).json({ error: 'Erro ao desconectar: ' + error.message });
  }
});

// Rota: Enviar mensagem
app.post('/api/whatsapp/send-message', async (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número de telefone e mensagem são obrigatórios' });
  }
  
  if (!whatsappClient || connectionStatus !== 'connected') {
    return res.status(400).json({ error: 'WhatsApp não está conectado' });
  }
  
  try {
    // Formatar número (adicionar código do país se necessário)
    let formattedNumber = phoneNumber;
    
    // Remover caracteres não numéricos
    formattedNumber = formattedNumber.replace(/\D/g, '');
    
    // Adicionar código do Brasil se não começar com 55
    if (!formattedNumber.startsWith('55')) {
      formattedNumber = '55' + formattedNumber;
    }
    
    // Adicionar sufixo do WhatsApp
    formattedNumber = formattedNumber + '@c.us';
    
    console.log(`Enviando mensagem para ${formattedNumber}: ${message}`);
    
    // Enviar mensagem via WhatsApp
    const result = await whatsappClient.sendMessage(formattedNumber, message);
    
    console.log('Mensagem enviada com sucesso:', result.id.id);
    
    res.json({
      success: true,
      messageId: result.id.id,
      phoneNumber: formattedNumber
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem WhatsApp:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem: ' + error.message
    });
  }
});

// Rota: Enviar mensagem de status de pedido
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
    // Formatar número (adicionar código do país se necessário)
    let formattedNumber = phoneNumber;
    
    // Remover caracteres não numéricos
    formattedNumber = formattedNumber.replace(/\D/g, '');
    
    // Adicionar código do Brasil se não começar com 55
    if (!formattedNumber.startsWith('55')) {
      formattedNumber = '55' + formattedNumber;
    }
    
    // Adicionar sufixo do WhatsApp
    formattedNumber = formattedNumber + '@c.us';
    
    console.log(`Enviando mensagem de status para ${formattedNumber}: ${message}`);
    
    // Enviar mensagem via WhatsApp
    const result = await whatsappClient.sendMessage(formattedNumber, message);
    
    console.log('Mensagem de status enviada com sucesso:', result.id.id);
    
    res.json({
      success: true,
      messageId: result.id.id,
      phoneNumber: formattedNumber,
      orderId,
      status
    });
  } catch (error) {
    console.error('Erro ao enviar mensagem de status:', error);
    res.status(500).json({
      success: false,
      error: 'Erro ao enviar mensagem de status: ' + error.message
    });
  }
});

// Iniciar o servidor
const PORT = process.env.PORT || 3333;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor WhatsApp rodando na porta ${PORT}`);
  
  // Inicializar cliente WhatsApp automaticamente
  setTimeout(() => {
    initWhatsAppClient();
  }, 3000);
});

// Gerenciar o encerramento adequado
process.on('SIGINT', async () => {
  console.log('Encerrando servidor WhatsApp...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Encerrando servidor WhatsApp...');
  if (whatsappClient) {
    await whatsappClient.destroy();
  }
  process.exit(0);
});

// Tratamento de erros não capturados
process.on('uncaughtException', (err) => {
  console.error('Erro não capturado:', err);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Promessa rejeitada não tratada:', reason);
});