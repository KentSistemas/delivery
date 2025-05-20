# Integrando WhatsApp Real ao seu Sistema

Esse guia explica como executar o servidor WhatsApp para integração real com a API do WhatsApp.

## Configuração Inicial

1. O servidor WhatsApp precisa ser executado em um ambiente Node.js separado do seu site. 
2. É necessário ter o Node.js instalado na sua máquina para executar o servidor.

## Como Iniciar o Servidor WhatsApp

Execute o seguinte comando no terminal:

```bash
node server-whatsapp.cjs
```

Isso iniciará o servidor na porta 3333. Você verá mensagens no console indicando que o servidor está rodando.

## Processo de Autenticação

1. Após iniciar o servidor, acesse a página de administração do WhatsApp Bot no seu site.
2. Clique em "Conectar WhatsApp" para iniciar o processo de conexão.
3. Um QR Code será exibido na tela.
4. Abra o WhatsApp no seu celular.
5. Acesse as configurações (três pontos no canto superior direito).
6. Selecione "Aparelhos vinculados".
7. Toque em "Vincular um dispositivo".
8. Escaneie o QR Code exibido na tela.
9. Após escanear, o sistema mostrará "WhatsApp Conectado" e você poderá enviar mensagens.

## Observações Importantes

- O servidor precisa estar rodando para que a integração funcione.
- A sessão do WhatsApp é salva em um diretório `whatsapp-sessions` na raiz do projeto.
- Se você iniciar o servidor em outro computador, precisará escanear o QR Code novamente.
- É necessário que o celular que escaneou o QR Code esteja conectado à internet para que as mensagens sejam enviadas.

## Testando a Integração

1. Após conectar, vá até "Mensagem de Teste" na página do WhatsApp Bot.
2. Digite um número de telefone com DDD (ex: 11987654321).
3. Digite uma mensagem de teste.
4. Clique em "Enviar Teste" para verificar se a integração está funcionando.

## Problemas Comuns

- **QR Code não aparece**: Reinicie o servidor e tente novamente.
- **Erro de conexão**: Verifique se o servidor está rodando na porta 3333.
- **Mensagens não enviadas**: Verifique se o celular que escaneou o QR Code está online.