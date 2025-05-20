// Servidor WhatsApp Integrado para Replit
// Este arquivo define as funções do servidor WhatsApp que podem ser importadas
// e usadas diretamente em qualquer parte do código
const fs = require('fs');
const path = require('path');

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

// Carregar mensagens existentes
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
  console.log(`[WhatsAppBot] Mensagem recebida de ${numero}: ${mensagem}`);
  
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
    
    return {
      success: true,
      resposta: resposta
    };
  }
  
  // Se não encontrou resposta automática, apenas registrar a mensagem
  salvarMensagem({
    tipo: 'mensagem_sem_resposta',
    telefone: numero,
    mensagem: mensagem
  });
  
  return {
    success: false,
    message: 'Sem resposta automática para esta mensagem'
  };
}

// Função para enviar mensagem
function enviarMensagem(numero, mensagem) {
  console.log(`[WhatsAppBot] Enviando mensagem para ${numero}: ${mensagem}`);
  
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

// Obter estado atual do sistema
function obterEstado() {
  return {
    status,
    mensagens: mensagens.slice(-30).reverse()
  };
}

// Exportar funções para uso em outras partes do código
module.exports = {
  processarMensagemRecebida,
  enviarMensagem,
  obterEstado,
  BOT_CONFIG
};