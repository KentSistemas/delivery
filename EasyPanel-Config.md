# Configuração no EasyPanel

Este guia explica como configurar o Kent Delivery com Bot WhatsApp no EasyPanel que você já possui.

## Preparação no EasyPanel

Conforme a imagem compartilhada, você já tem o EasyPanel configurado com PostgreSQL e Redis, o que é excelente. Vamos criar um novo projeto para o Kent Delivery.

### 1. Criar Novo Projeto no EasyPanel

1. Acesse seu painel EasyPanel
2. Na seção "Projetos", clique em "Novo"
3. Preencha os seguintes dados:
   - **Nome**: kent-delivery
   - **Tipo**: Aplicação Web

### 2. Configurar o Projeto

Após criar o projeto, você precisará configurar:

1. **Configurações de Implantação**:
   - Selecione "Docker Compose" como método de implantação
   - Faça upload do arquivo `docker-compose.yml` que criamos
   
2. **Variáveis de Ambiente**:
   - Adicione as variáveis de ambiente necessárias do arquivo `.env.production`
   - Importante: Ajuste o `DATABASE_URL` para apontar para seu PostgreSQL existente (evo-postgres)

### 3. Conexão com Serviços Existentes

No EasyPanel, você já tem:

- **evo-postgres**: Seu banco de dados PostgreSQL
- **evo-redis**: Sua instância Redis

Configure o arquivo `.env` para usar esses serviços:

```
DATABASE_URL=postgres://usuario:senha@evo-postgres:5432/kentdelivery
```

## Implantação no EasyPanel

### 1. Preparar Arquivos

Empacote todos os arquivos necessários em um arquivo ZIP:

```bash
zip -r kent-delivery.zip ./*
```

### 2. Fazer Upload do Código

No EasyPanel:
1. Acesse o projeto kent-delivery
2. Vá para a aba "Código-fonte"
3. Faça upload do arquivo ZIP
4. Clique em "Implantar"

### 3. Verificar Implantação

Após a implantação:
1. Verifique os logs para garantir que tudo está funcionando
2. Acesse a aplicação pela URL fornecida pelo EasyPanel
3. Verifique o servidor WhatsApp na porta 3333

## Configuração de Domínio (Opcional)

Se você tiver um domínio personalizado:

1. No EasyPanel, vá para as configurações do projeto
2. Na seção "Domínio", adicione seu domínio personalizado
3. Configure os registros DNS conforme instruções

## Monitoramento

O EasyPanel já fornece monitoramento básico:
- CPU
- Memória
- Disco
- Rede

Para monitoramento mais avançado, considere habilitar a opção de "Monitoramento avançado" (que requer licença, conforme mostrado na imagem).

## Problemas Comuns

### Falha na Conexão com Banco de Dados

Se o aplicativo não conseguir se conectar ao PostgreSQL:
1. Verifique se o serviço evo-postgres está funcionando
2. Confirme que as credenciais no `.env` estão corretas
3. Verifique se os contêineres estão na mesma rede

### Servidor WhatsApp Não Inicia

Se o servidor WhatsApp não iniciar:
1. Verifique os logs do contêiner
2. Certifique-se de que a porta 3333 está aberta e não há conflitos