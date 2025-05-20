// API de integração para o Bot de WhatsApp
const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const bot = require('./servidor-whatsapp-integrado.cjs');

// Inicializar app Express
const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Servir a página de teste estática
app.get('/whatsapp-tester', (req, res) => {
  res.sendFile(path.join(__dirname, 'whatsapp-bot-tester.html'));
});

// Status da API
app.get('/api/whatsapp/status', (req, res) => {
  res.json({ status: 'connected' });
});

// Receber e processar mensagens
app.post('/api/whatsapp/receive-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ 
      success: false,
      error: 'Número e mensagem são obrigatórios' 
    });
  }
  
  // Formatar número (remover caracteres não numéricos)
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // Processar a mensagem e obter resposta
  const result = bot.processarMensagemRecebida(formattedNumber, message);
  
  res.json({
    success: true,
    wasProcessed: result.success,
    resposta: result.success ? result.resposta : null,
    message: 'Mensagem processada com sucesso'
  });
});

// Enviar mensagem direta
app.post('/api/whatsapp/send-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ 
      success: false,
      error: 'Número e mensagem são obrigatórios' 
    });
  }
  
  // Formatar número (remover caracteres não numéricos)
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // Enviar mensagem
  const result = bot.enviarMensagem(formattedNumber, message);
  
  res.json({
    success: true,
    messageId: result.messageId,
    message: 'Mensagem enviada com sucesso'
  });
});

// Obter histórico de mensagens e estado do bot
app.get('/api/whatsapp/history', (req, res) => {
  const estado = bot.obterEstado();
  
  res.json({
    success: true,
    status: estado.status,
    messages: estado.mensagens
  });
});

// Iniciar o servidor na porta 3333
const PORT = 3333;

// Iniciar servidor
function startServer() {
  return new Promise((resolve, reject) => {
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`Servidor WhatsApp API rodando na porta ${PORT}`);
      console.log(`Acesse http://localhost:${PORT}/whatsapp-tester para testar o bot`);
      resolve(server);
    });
    
    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.log(`Porta ${PORT} já está em uso. Tentando outra porta...`);
        resolve(null); // Permitir que o código continue
      } else {
        reject(err);
      }
    });
  });
}

// Exportar funções para uso em outras partes do código
module.exports = {
  startServer,
  app
};

// Se este arquivo for executado diretamente (não importado como módulo)
if (require.main === module) {
  startServer().catch(err => {
    console.error('Erro ao iniciar o servidor:', err);
  });
}