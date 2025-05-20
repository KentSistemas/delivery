import { supabase } from './src/lib/supabase.js';

async function setupTables() {
  console.log('Iniciando criação das tabelas no Supabase...');

  try {
    // Criar tabela para logs de mensagens WhatsApp
    const { error: logsError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS whatsapp_logs (
          id SERIAL PRIMARY KEY,
          pedido_id INTEGER NOT NULL,
          numero_cliente TEXT NOT NULL,
          status_enviado TEXT NOT NULL,
          mensagem TEXT NOT NULL,
          data_envio TIMESTAMPTZ DEFAULT NOW()
        )
      `
    });

    if (logsError) {
      console.error('Erro ao criar tabela de logs:', logsError);
      
      // Tentar criar diretamente
      const { error: directLogsError } = await supabase.from('whatsapp_logs').insert({ 
        pedido_id: 999, 
        numero_cliente: 'test', 
        status_enviado: 'test', 
        mensagem: 'test'
      }).select();
      
      if (directLogsError && directLogsError.code === '42P01') {
        console.log('Tabela whatsapp_logs não existe, criando...');
        
        // Criar usando SQL direto
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          query: `
            CREATE TABLE public.whatsapp_logs (
              id SERIAL PRIMARY KEY,
              pedido_id INTEGER NOT NULL,
              numero_cliente TEXT NOT NULL,
              status_enviado TEXT NOT NULL,
              mensagem TEXT NOT NULL,
              data_envio TIMESTAMPTZ DEFAULT NOW()
            )
          `
        });
        
        if (sqlError) {
          console.error('Erro ao criar tabela via SQL:', sqlError);
        } else {
          console.log('Tabela whatsapp_logs criada com sucesso!');
        }
      }
    } else {
      console.log('Tabela whatsapp_logs criada ou já existente.');
    }

    // Criar tabela para templates de mensagens WhatsApp
    const { error: templatesError } = await supabase.rpc('execute_sql', {
      query: `
        CREATE TABLE IF NOT EXISTS whatsapp_bot_templates (
          id SERIAL PRIMARY KEY,
          status TEXT UNIQUE NOT NULL,
          mensagem TEXT NOT NULL,
          created_at TIMESTAMPTZ DEFAULT NOW()
        )
      `
    });

    if (templatesError) {
      console.error('Erro ao criar tabela de templates:', templatesError);
      
      // Tentar criar diretamente
      const { error: directTemplatesError } = await supabase.from('whatsapp_bot_templates').insert({
        status: 'test',
        mensagem: 'test'
      }).select();
      
      if (directTemplatesError && directTemplatesError.code === '42P01') {
        console.log('Tabela whatsapp_bot_templates não existe, criando...');
        
        // Criar usando SQL direto
        const { error: sqlError } = await supabase.rpc('execute_sql', {
          query: `
            CREATE TABLE public.whatsapp_bot_templates (
              id SERIAL PRIMARY KEY,
              status TEXT UNIQUE NOT NULL,
              mensagem TEXT NOT NULL,
              created_at TIMESTAMPTZ DEFAULT NOW()
            )
          `
        });
        
        if (sqlError) {
          console.error('Erro ao criar tabela via SQL:', sqlError);
        } else {
          console.log('Tabela whatsapp_bot_templates criada com sucesso!');
          
          // Inserir templates padrão
          await insertDefaultTemplates();
        }
      }
    } else {
      console.log('Tabela whatsapp_bot_templates criada ou já existente.');
      
      // Verificar se existem templates
      const { data: templates } = await supabase.from('whatsapp_bot_templates').select('*');
      
      if (!templates || templates.length === 0) {
        await insertDefaultTemplates();
      }
    }

    console.log('Configuração das tabelas concluída!');
    return { success: true };
  } catch (error) {
    console.error('Erro ao configurar tabelas do WhatsApp:', error);
    return { success: false, error: error.message };
  }
}

async function insertDefaultTemplates() {
  console.log('Inserindo templates padrão...');
  
  const templates = [
    {
      status: 'recebido',
      mensagem: 'Olá! Seu pedido #{{numero_pedido}} foi recebido com sucesso. Em breve iniciaremos o preparo. Obrigado pela preferência!'
    },
    {
      status: 'em_preparo',
      mensagem: 'Olá! Seu pedido #{{numero_pedido}} já está em preparo na cozinha. Logo estará pronto!'
    },
    {
      status: 'pronto',
      mensagem: 'Olá! Ótimas notícias! Seu pedido #{{numero_pedido}} está pronto.'
    },
    {
      status: 'saiu_para_entrega',
      mensagem: 'Olá! Seu pedido #{{numero_pedido}} acabou de sair para entrega. Tempo estimado de chegada: {{tempo_entrega}} minutos'
    },
    {
      status: 'entregue',
      mensagem: 'Olá! Confirmamos a entrega do seu pedido #{{numero_pedido}}. Agradecemos a preferência e desejamos um excelente apetite!'
    }
  ];
  
  for (const template of templates) {
    const { error } = await supabase.from('whatsapp_bot_templates').upsert(template);
    
    if (error) {
      console.error('Erro ao inserir template:', template.status, error);
    } else {
      console.log('Template inserido:', template.status);
    }
  }
}

// Executar a função
setupTables()
  .then((result) => {
    console.log('Resultado:', result);
    if (result.success) {
      console.log('Tabelas criadas e configuradas com sucesso!');
    } else {
      console.error('Falha ao configurar tabelas:', result.error);
    }
  })
  .catch((error) => {
    console.error('Erro ao executar setup:', error);
  });