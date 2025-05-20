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

// Configuração do Bot
const BOT_CONFIG = {
  // Respostas automáticas baseadas em palavras-chave
  keywords: {
    saudacoes: [
      "bom dia", "boa tarde", "boa noite", "olá", "oi", "olá", "hello", 
      "hi", "hey", "e aí", "eai", "tudo bem"
    ],
    menu: ["cardápio", "cardapio", "menu", "lista", "produtos", "itens"],
    promocao: ["promoção", "promocao", "oferta", "desconto", "cupom"]
  },
  
  // Respostas para cada tipo de mensagem
  respostas: {
    saudacoes: "Olá! Bem-vindo ao *Kent Delivery*! 😊\n\nComo posso ajudar você hoje?\n\n" +
      "• Digite *MENU* para ver nosso cardápio digital\n" +
      "• Digite *PROMOÇÃO* para conhecer as ofertas do dia\n" +
      "• Digite *ENDEREÇO* para saber nossa localização",
    
    menu: "🍔 *CARDÁPIO DIGITAL* 🍕\n\nAcesse nosso cardápio digital completo no link abaixo:\n" +
      "https://www.kent-delivery.com/menu\n\n" +
      "Você pode fazer seu pedido diretamente pelo site ou digitando os itens aqui mesmo!",
    
    promocao: "🔥 *PROMOÇÕES DO DIA* 🔥\n\n" +
      "• 🍕 Pizza Grande + Refrigerante 2L por apenas R$49,90\n" +
      "• 🍔 Combo Hambúrguer + Batata + Refrigerante por R$29,90\n" +
      "• 🥗 Na compra de qualquer prato executivo, ganhe uma sobremesa!\n\n" +
      "Válido apenas para hoje. Aproveite! 😋"
  }
};

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

// Função para processar mensagens recebidas e responder automaticamente
function processarMensagemRecebida(numero, mensagem) {
  console.log(`Mensagem recebida de ${numero}: ${mensagem}`);
  
  // Converter mensagem para minúsculas para comparação
  const mensagemLower = mensagem.toLowerCase();
  let tipoResposta = null;
  
  // Verificar se a mensagem contém alguma palavra-chave
  for (const [tipo, palavras] of Object.entries(BOT_CONFIG.keywords)) {
    if (palavras.some(palavra => mensagemLower.includes(palavra))) {
      tipoResposta = tipo;
      break;
    }
  }
  
  // Se não encontrou palavras-chave específicas, verificar se é uma saudação curta
  if (!tipoResposta && mensagemLower.length < 15) {
    // Para mensagens curtas, assumir que pode ser uma saudação
    tipoResposta = 'saudacoes';
  }
  
  // Responder se encontrou um tipo de resposta
  if (tipoResposta && BOT_CONFIG.respostas[tipoResposta]) {
    const resposta = BOT_CONFIG.respostas[tipoResposta];
    
    // Registrar mensagem recebida
    salvarMensagem({
      tipo: 'mensagem_recebida',
      telefone: numero,
      mensagem: mensagem
    });
    
    // Enviar resposta automática
    enviarMensagem(numero, resposta);
    
    return true;
  }
  
  // Se não encontrou resposta automática, apenas registrar a mensagem
  salvarMensagem({
    tipo: 'mensagem_sem_resposta',
    telefone: numero,
    mensagem: mensagem
  });
  
  return false;
}

// Função para enviar mensagem
function enviarMensagem(numero, mensagem) {
  console.log(`Enviando mensagem para ${numero}: ${mensagem}`);
  
  salvarMensagem({
    tipo: 'mensagem_enviada',
    telefone: numero,
    mensagem: mensagem
  });
  
  return {
    success: true,
    messageId: 'msg_' + Date.now()
  };
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

// Endpoint para receber mensagens
app.post('/api/whatsapp/receive-message', (req, res) => {
  const { phoneNumber, message } = req.body;
  
  if (!phoneNumber || !message) {
    return res.status(400).json({ error: 'Número e mensagem são obrigatórios' });
  }
  
  // Formatar número (remover caracteres não numéricos)
  const formattedNumber = phoneNumber.replace(/\D/g, '');
  
  // Processar a mensagem e responder automaticamente
  const processed = processarMensagemRecebida(formattedNumber, message);
  
  res.json({
    success: true,
    wasProcessed: processed,
    message: processed ? 'Mensagem processada e respondida' : 'Mensagem recebida sem resposta automática'
  });
});

// Simular recebimento de mensagem (para testes)
app.get('/simular', (req, res) => {
  const telefone = req.query.telefone || '5511999887766';
  const mensagem = req.query.mensagem || 'Bom dia';
  
  const processed = processarMensagemRecebida(telefone, mensagem);
  
  res.send(`
    <html>
      <head>
        <title>Simulação de Mensagem</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
          .result { padding: 15px; margin: 20px 0; border-radius: 5px; }
          .success { background-color: #d4edda; color: #155724; }
          .form { margin: 20px 0; }
          input, textarea { width: 100%; padding: 8px; margin-bottom: 10px; border-radius: 4px; border: 1px solid #ccc; }
          button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; }
        </style>
      </head>
      <body>
        <h1>Simulação de Mensagem WhatsApp</h1>
        
        <div class="result ${processed ? 'success' : ''}">
          Mensagem ${processed ? 'processada e respondida' : 'recebida, sem resposta automática'}
        </div>
        
        <div class="form">
          <form action="/simular" method="get">
            <h3>Enviar mensagem de teste:</h3>
            <div>
              <label>Telefone:</label>
              <input name="telefone" value="${telefone}" placeholder="Ex: 5511999887766" />
            </div>
            <div>
              <label>Mensagem:</label>
              <textarea name="mensagem" rows="3" placeholder="Digite a mensagem aqui">${mensagem}</textarea>
            </div>
            <button type="submit">Enviar</button>
          </form>
        </div>
        
        <p><a href="/">Voltar para a página principal</a></p>
      </body>
    </html>
  `);
});

// Página principal
app.get('/', (req, res) => {
  let html = `
    <html>
      <head>
        <title>Servidor WhatsApp Bot</title>
        <style>
          body { font-family: Arial; max-width: 800px; margin: 0 auto; padding: 20px; }
          .status { padding: 10px; margin-bottom: 20px; background: #d4edda; border-radius: 4px; }
          .mensagem { padding: 10px; margin-bottom: 10px; background: #f8f9fa; border-radius: 4px; }
          .mensagem-recebida { background: #e8f4f8; }
          .mensagem-enviada { background: #e8f8e8; }
          .mensagem-sem-resposta { background: #f8e8e8; }
          button { padding: 8px 16px; background: #007bff; color: white; border: none; border-radius: 4px; cursor: pointer; }
          .links { margin: 20px 0; }
          .links a { margin-right: 15px; color: #007bff; text-decoration: none; }
          .links a:hover { text-decoration: underline; }
        </style>
      </head>
      <body>
        <h1>Bot WhatsApp Kent Delivery</h1>
        
        <div class="status">
          <h3>Status: ${status === 'connected' ? '✅ Conectado' : '❌ Desconectado'}</h3>
          <p>Mensagens processadas: ${mensagens.length}</p>
        </div>
        
        <div class="links">
          <a href="/simular">📱 Simular mensagem recebida</a>
          <a href="/" onclick="window.location.reload(); return false;">🔄 Atualizar página</a>
        </div>
        
        <h2>Histórico de Mensagens</h2>
  `;
  
  // Mostrar mensagens
  if (mensagens.length === 0) {
    html += '<p>Nenhuma mensagem processada ainda</p>';
  } else {
    // Mostrar as mais recentes primeiro
    const mensagensReversas = [...mensagens].reverse().slice(0, 30);
    
    mensagensReversas.forEach(msg => {
      const classeExtraMensagem = 
        msg.tipo === 'mensagem_recebida' ? 'mensagem-recebida' : 
        msg.tipo === 'mensagem_enviada' ? 'mensagem-enviada' : 
        msg.tipo === 'mensagem_sem_resposta' ? 'mensagem-sem-resposta' : '';
      
      html += `
        <div class="mensagem ${classeExtraMensagem}">
          <div><strong>Tipo:</strong> ${msg.tipo}</div>
          <div><strong>Telefone:</strong> ${msg.telefone}</div>
          ${msg.pedido ? `<div><strong>Pedido:</strong> ${msg.pedido}</div>` : ''}
          ${msg.status ? `<div><strong>Status:</strong> ${msg.status}</div>` : ''}
          <div><strong>Mensagem:</strong> ${msg.mensagem}</div>
          <div><small>Data: ${new Date(msg.data).toLocaleString()}</small></div>
        </div>
      `;
    });
    
    if (mensagens.length > 30) {
      html += `<p>Mostrando 30 mensagens mais recentes de ${mensagens.length} no total.</p>`;
    }
  }
  
  html += `
        <h2>Configuração do Bot</h2>
        <div class="mensagem">
          <h3>Palavras-chave configuradas:</h3>
          <ul>
            ${Object.entries(BOT_CONFIG.keywords).map(([tipo, palavras]) => `
              <li><strong>${tipo}:</strong> ${palavras.join(', ')}</li>
            `).join('')}
          </ul>
        </div>
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