#!/bin/bash
# Script para configurar a Evolution API

# Configurar cores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Verificar se o arquivo .env existe
if [ ! -f .env ]; then
  echo -e "${RED}Arquivo .env não encontrado. Criando a partir do .env.example...${NC}"
  cp .env.example .env
  echo -e "${YELLOW}Por favor, edite o arquivo .env com suas configurações reais antes de continuar.${NC}"
  exit 1
fi

# Carregar variáveis do .env
source .env

echo -e "${GREEN}Iniciando a configuração da Evolution API...${NC}"

# Iniciar os serviços com Docker Compose
echo -e "${YELLOW}Iniciando serviços Docker...${NC}"
docker-compose up -d

# Esperar a API iniciar
echo -e "${YELLOW}Aguardando a Evolution API iniciar...${NC}"
sleep 10

# Criar instância no WhatsApp
echo -e "${YELLOW}Criando instância do WhatsApp...${NC}"
curl --location --request POST "http://localhost:8080/instance/create" \
  --header "Content-Type: application/json" \
  --header "apikey: ${WHATSAPP_API_KEY}" \
  --data-raw "{
    \"instanceName\": \"${WHATSAPP_INSTANCE_NAME}\",
    \"token\": \"${WHATSAPP_API_KEY}\",
    \"qrcode\": true
  }"

echo -e "\n${GREEN}Configuração inicial concluída!${NC}"
echo -e "${YELLOW}Para conectar seu WhatsApp, acesse:${NC}"
echo -e "${GREEN}http://seu-ip-ou-dominio:8080/instance/qrcode?instanceName=${WHATSAPP_INSTANCE_NAME}&token=${WHATSAPP_API_KEY}${NC}"
echo -e "${YELLOW}Escaneie o QR Code com seu WhatsApp para conectar.${NC}"
echo -e "${GREEN}Após conectar, seu bot estará pronto para uso!${NC}"