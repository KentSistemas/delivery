# Guia de Integração WhatsApp para Produção

Este guia detalha como configurar e manter a integração real com o WhatsApp no seu servidor de produção.

## Configuração Inicial

1. Copie o arquivo `whatsapp-persistente.js` para o seu servidor

2. Instale as dependências necessárias:
```bash
npm install whatsapp-web.js puppeteer qrcode express cors body-parser
```

3. Inicie o servidor WhatsApp como um serviço persistente:
```bash
node whatsapp-persistente.js
```

4. Para manter o servidor rodando constantemente, recomendamos usar um gerenciador de processos como o PM2:
```bash
npm install -g pm2
pm2 start whatsapp-persistente.js --name "whatsapp-service"
```

## Primeira Conexão

1. Após iniciar o servidor, acesse o painel administrativo do seu site
2. Vá até a seção "WhatsApp Bot"
3. Clique em "Conectar WhatsApp"
4. Um QR Code será exibido na tela
5. Escaneie o QR Code com seu celular (WhatsApp > Configurações > Aparelhos vinculados)
6. Após escanear, o status mudará para "Conectado"

## Manutenção da Conexão

- O servidor foi projetado para reconectar automaticamente em caso de desconexão
- A sessão fica salva no diretório `whatsapp-sessions` no servidor
- Normalmente você só precisará escanear o QR Code uma vez, a menos que a sessão expire

## Verificação do Status

Para verificar se o serviço está funcionando:
```bash
curl http://localhost:3333/api/whatsapp/status
```

Você deve receber uma resposta como:
```json
{"status":"connected","hasQRCode":false}
```

## Observações Importantes

1. O número de WhatsApp vinculado é o que será usado para enviar todas as mensagens
2. Certifique-se de que o telefone que escaneou o QR Code tenha boa conexão com a internet
3. O WhatsApp Business API pode ter limitações no número de mensagens por dia
4. Mantenha as bibliotecas atualizadas para garantir compatibilidade contínua

## Solução de Problemas

- **Erro ao inicializar**: Verifique se todas as dependências estão instaladas corretamente
- **QR Code não aparece**: Reinicie o servidor e tente novamente
- **Mensagens não enviadas**: Verifique o status da conexão e se o telefone está online
- **Problemas com Puppeteer**: Instale as dependências do Chrome necessárias ao sistema:
  ```bash
  apt-get update && apt-get install -y gconf-service libgbm-dev libasound2 libatk1.0-0 libc6 libcairo2 libcups2 libdbus-1-3 libexpat1 libfontconfig1 libgcc1 libgconf-2-4 libgdk-pixbuf2.0-0 libglib2.0-0 libgtk-3-0 libnspr4 libpango-1.0-0 libpangocairo-1.0-0 libstdc++6 libx11-6 libx11-xcb1 libxcb1 libxcomposite1 libxcursor1 libxdamage1 libxext6 libxfixes3 libxi6 libxrandr2 libxrender1 libxss1 libxtst6 ca-certificates fonts-liberation libappindicator1 libnss3 lsb-release xdg-utils
  ```