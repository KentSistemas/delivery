# Guia de Implantação do Kent Delivery em Produção

Este guia explica como implantar o Kent Delivery com o Bot WhatsApp integrado em seu servidor VPS.

## Requisitos

- Servidor VPS com Docker e Docker Compose instalados
- PostgreSQL (já configurado como evo-postgres em seu EasyPanel)
- Acesso root ou sudo ao servidor

## Arquivos de Implantação

Os seguintes arquivos foram criados para facilitar a implantação:

1. `docker-compose.yml` - Configuração dos contêineres Docker
2. `.env.production` - Modelo para variáveis de ambiente de produção
3. `deploy.sh` - Script de implantação automatizada
4. `servidor-whatsapp.cjs` - Servidor WhatsApp com bot integrado

## Passos para Implantação

### 1. Preparar o Servidor

Certifique-se de que o Docker e o Docker Compose estão instalados:

```bash
curl -fsSL https://get.docker.com | bash
curl -L "https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
chmod +x /usr/local/bin/docker-compose
```

### 2. Copiar os Arquivos para o Servidor

Copie todos os arquivos do projeto para o servidor:

```bash
# Exemplo usando scp (substitua pelo seu método preferido)
scp -r ./* usuario@seu-servidor:/caminho/para/aplicacao/
```

### 3. Configurar Variáveis de Ambiente

No servidor, crie um arquivo `.env` a partir do modelo:

```bash
cp .env.production .env
nano .env  # ou seu editor preferido
```

Edite o arquivo com suas configurações reais:
- `DATABASE_URL`: URL de conexão com o PostgreSQL
- Outras variáveis específicas do ambiente

### 4. Executar o Script de Implantação

Torne o script executável e execute-o:

```bash
chmod +x deploy.sh
./deploy.sh
```

O script vai:
1. Verificar se o Docker e o Docker Compose estão instalados
2. Criar o arquivo .env se não existir
3. Iniciar os contêineres Docker
4. Exibir o status da implantação

### 5. Acessar o Sistema

Após a implantação bem-sucedida:

- Aplicação principal: http://seu-ip-ou-dominio
- Servidor WhatsApp: http://seu-ip-ou-dominio:3333

## Gerenciamento

### Verificar Logs

```bash
docker-compose logs -f
```

### Parar os Serviços

```bash
docker-compose down
```

### Reiniciar os Serviços

```bash
docker-compose restart
```

## Funcionamento do Bot WhatsApp

O bot WhatsApp é executado automaticamente quando o sistema é iniciado. Ele responde a:

- Saudações como "bom dia", "boa tarde", etc.
- Perguntas sobre cardápio
- Perguntas sobre promoções

Para testar o bot, acesse: http://seu-ip-ou-dominio:3333/simular

## Solução de Problemas

### Servidor WhatsApp não inicia

Verifique os logs específicos do servidor WhatsApp:

```bash
docker-compose logs app | grep servidor-whatsapp
```

### Problemas de Conexão com Banco de Dados

Verifique se as credenciais no arquivo `.env` estão corretas e se o banco de dados está acessível.

```bash
docker-compose exec app ping evo-postgres
```

## Considerações de Segurança

- A porta 3333 (servidor WhatsApp) está exposta publicamente. Se desejar restringir o acesso, configure um firewall ou modifique o arquivo `docker-compose.yml`.
- Considere configurar um proxy reverso como Nginx para adicionar SSL/TLS.

## Próximos Passos Recomendados

1. Configurar HTTPS com Let's Encrypt
2. Configurar backup automático do banco de dados
3. Implementar monitoramento do sistema