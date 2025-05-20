#!/bin/bash
# Script para implantação do Kent Delivery com WhatsApp Bot na VPS

# Configurar cores para saída
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${GREEN}===== IMPLANTAÇÃO DO KENT DELIVERY COM WHATSAPP BOT =====${NC}"
echo -e "${YELLOW}Este script vai configurar o sistema para produção${NC}"

# Verificar se docker está instalado
if ! command -v docker &> /dev/null; then
    echo -e "${RED}Docker não encontrado. Por favor, instale o Docker e o Docker Compose antes de continuar.${NC}"
    echo -e "Você pode instalar usando:"
    echo -e "${YELLOW}curl -fsSL https://get.docker.com | bash${NC}"
    exit 1
fi

# Verificar se docker-compose está instalado
if ! command -v docker-compose &> /dev/null; then
    echo -e "${RED}Docker Compose não encontrado. Por favor, instale o Docker Compose antes de continuar.${NC}"
    echo -e "Você pode instalar usando:"
    echo -e "${YELLOW}curl -L \"https://github.com/docker/compose/releases/download/v2.23.0/docker-compose-$(uname -s)-$(uname -m)\" -o /usr/local/bin/docker-compose${NC}"
    echo -e "${YELLOW}chmod +x /usr/local/bin/docker-compose${NC}"
    exit 1
fi

# Criar .env a partir do .env.production se não existir
if [ ! -f .env ]; then
    echo -e "${YELLOW}Criando arquivo .env a partir do .env.production...${NC}"
    cp .env.production .env
    echo -e "${YELLOW}Por favor, abra o arquivo .env e configure suas credenciais de banco de dados antes de continuar.${NC}"
    echo -e "Pressione ENTER para continuar após editar o arquivo .env..."
    read
fi

# Iniciar os contêineres
echo -e "${GREEN}Iniciando os contêineres Docker...${NC}"
docker-compose up -d

# Verificar status dos contêineres
echo -e "${GREEN}Verificando status dos contêineres...${NC}"
docker-compose ps

echo -e "\n${GREEN}===== IMPLANTAÇÃO CONCLUÍDA =====${NC}"
echo -e "${YELLOW}O Kent Delivery está rodando em: http://seu-ip-ou-dominio${NC}"
echo -e "${YELLOW}O servidor WhatsApp está rodando em: http://seu-ip-ou-dominio:3333${NC}"
echo -e "\n${GREEN}Para verificar os logs, execute:${NC}"
echo -e "${YELLOW}docker-compose logs -f${NC}"
echo -e "\n${GREEN}Para parar os serviços, execute:${NC}"
echo -e "${YELLOW}docker-compose down${NC}"