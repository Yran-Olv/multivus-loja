#!/bin/bash

# ============================================
# MULTIVUS - Menu Principal de Gerenciamento
# ============================================
# Script único com menu interativo para todas as operações
# Uso: bash scripts/multivus.sh
# ============================================

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

# Diretório do script
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"

# Função para exibir menu
show_menu() {
    clear
    echo -e "${BLUE}==========================================${NC}"
    echo "  MULTIVUS - Menu Principal"
    echo -e "${BLUE}==========================================${NC}"
    echo ""
    echo -e "${CYAN}📦 INSTALAÇÃO E DEPLOY${NC}"
    echo "  1) 🆕 Instalação Completa (PM2, legado)"
    echo "  15) 🐳 Instalar (scripts/install.sh)"
    echo "  16) 🔌 Ver portas em uso"
    echo "  2) 🚀 Atualizar (scripts/update.sh)"
    echo "  3) 🔍 Verificar Mudanças"
    echo ""
    echo -e "${CYAN}💾 BACKUP E RESTAURAÇÃO${NC}"
    echo "  4) 📊 Backup do Banco de Dados"
    echo "  5) 📦 Backup Completo"
    echo "  6) 📋 Listar Backups"
    echo "  7) 🔄 Restaurar Backup"
    echo ""
    echo -e "${CYAN}⚙️  CONFIGURAÇÃO${NC}"
    echo "  8) 🔒 Configurar SSL"
    echo "  9) 👤 Criar Usuário Admin"
    echo "  10) ⏰ Configurar Backup Automático"
    echo "  11) 🔧 Corrigir Problemas de Imagens/Uploads"
    echo ""
    echo -e "${CYAN}ℹ️  INFORMAÇÕES${NC}"
    echo "  12) 📊 Status do Sistema"
    echo "  13) 📚 Documentação"
    echo ""
    echo -e "${RED}🗑️  DESINSTALAÇÃO${NC}"
    echo "  14) 🗑️  Desinstalar Sistema"
    echo ""
    echo -e "${RED}  0) Sair${NC}"
    echo ""
    echo -e "${YELLOW}Escolha uma opção:${NC} "
}

# Função para pausar
pause() {
    echo ""
    read -p "Pressione Enter para continuar..."
}

# Função para verificar se está no diretório correto
check_project_dir() {
    if [ ! -f "$PROJECT_DIR/package.json" ]; then
        echo -e "${RED}❌ Execute este script no diretório raiz do projeto${NC}"
        exit 1
    fi
}

# Função para carregar variáveis de ambiente
load_env() {
    if [ -f "$PROJECT_DIR/.env" ]; then
        export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | xargs)
    fi
}

# ============================================
# OPÇÕES DO MENU
# ============================================

# Função para validar domínio
validate_domain() {
    local domain=$1
    if [ -z "$domain" ]; then
        return 1
    fi
    if [[ ! $domain =~ \. ]]; then
        return 1
    fi
    if [[ $domain =~ ^\. ]] || [[ $domain =~ \.$ ]] || [[ $domain =~ ^- ]] || [[ $domain =~ -$ ]]; then
        return 1
    fi
    if [[ $domain =~ ^[a-zA-Z0-9][a-zA-Z0-9\.-]*\.[a-zA-Z]{2,}$ ]]; then
        if [[ ! $domain =~ \.\. ]] && [[ ! $domain =~ -- ]] && [[ ! $domain =~ \.- ]] && [[ ! $domain =~ -\. ]]; then
            return 0
        fi
    fi
    return 1
}

# Função para validar porta
validate_port() {
    local port=$1
    if [[ $port =~ ^[0-9]+$ ]] && [ $port -ge 1024 ] && [ $port -le 65535 ]; then
        if lsof -Pi :$port -sTCP:LISTEN -t >/dev/null 2>&1; then
            return 1
        fi
        return 0
    else
        return 1
    fi
}

# 15. Instalação Docker interativa
option_install_docker() {
    echo -e "${BLUE}🐳 Instalação Docker interativa${NC}"
    echo ""
    bash "$SCRIPT_DIR/install.sh"
    pause
}

# 16. Listar portas em uso
option_ports_info() {
    bash "$SCRIPT_DIR/install.sh" --ports-only
    pause
}

# 1. Instalação Completa
option_install() {
    echo -e "${BLUE}🆕 Instalação Completa${NC}"
    echo ""
    
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Esta opção requer sudo${NC}"
        echo "   Execute: sudo bash $0"
        pause
        return
    fi
    
    echo -e "${YELLOW}⏱️  Este processo pode levar 15-25 minutos${NC}"
    echo -e "${YELLOW}📝 Mantenha este terminal aberto durante a instalação${NC}"
    echo ""
    
    # Coletar informações
    echo -e "${BLUE}📋 Configuração Inicial${NC}"
    echo ""
    
    read -p "👤 Digite o usuário do sistema para a aplicação (padrão: deploy): " SYSTEM_USER
    SYSTEM_USER=${SYSTEM_USER:-deploy}
    
    if ! id "$SYSTEM_USER" &>/dev/null; then
        echo -e "${BLUE}👤 Criando usuário $SYSTEM_USER...${NC}"
        useradd -m -s /bin/bash "$SYSTEM_USER" || {
            echo -e "${RED}❌ Erro ao criar usuário${NC}"
            pause
            return
        }
        echo -e "${GREEN}✅ Usuário $SYSTEM_USER criado${NC}"
    else
        echo -e "${GREEN}✅ Usuário $SYSTEM_USER já existe${NC}"
    fi
    
    read -p "📂 Digite o diretório da aplicação (padrão: /home/$SYSTEM_USER/LojaMultivus): " APP_DIR
    APP_DIR=${APP_DIR:-/home/$SYSTEM_USER/LojaMultivus}
    
    while true; do
        read -p "🌐 Digite o domínio do frontend (ex: multivus.com.br): " FRONTEND_DOMAIN
        if [ -z "$FRONTEND_DOMAIN" ]; then
            echo -e "${YELLOW}⚠️  Domínio é obrigatório${NC}"
            continue
        fi
        if validate_domain "$FRONTEND_DOMAIN"; then
            break
        else
            echo -e "${RED}❌ Domínio inválido. Use o formato: exemplo.com.br${NC}"
        fi
    done
    
    read -p "🌐 Digite o domínio do backend (opcional, Enter para usar mesmo do frontend): " BACKEND_DOMAIN
    BACKEND_DOMAIN=${BACKEND_DOMAIN:-$FRONTEND_DOMAIN}
    
    while true; do
        read -p "🔌 Digite a porta do frontend (padrão: 3255): " FRONTEND_PORT
        FRONTEND_PORT=${FRONTEND_PORT:-3255}
        if validate_port "$FRONTEND_PORT"; then
            break
        else
            if lsof -Pi :$FRONTEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo -e "${RED}❌ Porta $FRONTEND_PORT já está em uso${NC}"
            else
                echo -e "${RED}❌ Porta inválida. Use uma porta entre 1024 e 65535${NC}"
            fi
        fi
    done
    
    while true; do
        read -p "🔌 Digite a porta do backend (padrão: 3256): " BACKEND_PORT
        BACKEND_PORT=${BACKEND_PORT:-3256}
        if validate_port "$BACKEND_PORT"; then
            if [ "$BACKEND_PORT" = "$FRONTEND_PORT" ]; then
                echo -e "${RED}❌ Porta do backend deve ser diferente da porta do frontend${NC}"
                continue
            fi
            break
        else
            if lsof -Pi :$BACKEND_PORT -sTCP:LISTEN -t >/dev/null 2>&1; then
                echo -e "${RED}❌ Porta $BACKEND_PORT já está em uso${NC}"
            else
                echo -e "${RED}❌ Porta inválida. Use uma porta entre 1024 e 65535${NC}"
            fi
        fi
    done
    
    echo ""
    read -p "📥 Digite a URL do repositório Git: " REPO_URL
    if [ -z "$REPO_URL" ]; then
        echo -e "${RED}❌ URL do repositório é obrigatória${NC}"
        pause
        return
    fi
    
    read -p "🌿 Digite a branch do Git (padrão: main): " BRANCH
    BRANCH=${BRANCH:-main}
    
    echo ""
    read -p "🗄️  Digite o nome do banco de dados (padrão: multivus_db): " DB_NAME
    DB_NAME=${DB_NAME:-multivus_db}
    if [[ ! $DB_NAME =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo -e "${RED}❌ Nome do banco inválido. Use apenas letras, números e underscore${NC}"
        pause
        return
    fi
    
    read -p "👤 Digite o usuário do banco de dados (padrão: multivus_user): " DB_USER
    DB_USER=${DB_USER:-multivus_user}
    if [[ ! $DB_USER =~ ^[a-zA-Z0-9_]+$ ]]; then
        echo -e "${RED}❌ Nome do usuário inválido. Use apenas letras, números e underscore${NC}"
        pause
        return
    fi
    
    read -sp "🔐 Digite a senha para o banco de dados PostgreSQL: " DB_PASSWORD
    echo ""
    if [ -z "$DB_PASSWORD" ]; then
        echo -e "${RED}❌ Senha do banco de dados é obrigatória!${NC}"
        pause
        return
    fi
    
    read -sp "🔐 Confirme a senha do banco de dados: " DB_PASSWORD_CONFIRM
    echo ""
    if [ "$DB_PASSWORD" != "$DB_PASSWORD_CONFIRM" ]; then
        echo -e "${RED}❌ As senhas não coincidem!${NC}"
        pause
        return
    fi
    
    JWT_SECRET=$(openssl rand -base64 32 | tr -d '\n')
    
    echo ""
    read -p "🔒 Configurar SSL com Let's Encrypt? (S/n): " CONFIGURE_SSL
    CONFIGURE_SSL=${CONFIGURE_SSL:-S}
    
    echo ""
    echo -e "${GREEN}✅ Configurações coletadas:${NC}"
    echo "   👤 Usuário do sistema: $SYSTEM_USER"
    echo "   📂 Diretório: $APP_DIR"
    echo "   🌐 Domínio frontend: $FRONTEND_DOMAIN"
    echo "   🌐 Domínio backend: $BACKEND_DOMAIN"
    echo "   🔌 Porta frontend: $FRONTEND_PORT"
    echo "   🔌 Porta backend: $BACKEND_PORT"
    echo "   📥 Repositório: $REPO_URL"
    echo "   🌿 Branch: $BRANCH"
    echo "   🗄️  Banco: $DB_NAME"
    echo "   👤 Usuário DB: $DB_USER"
    echo "   🔒 SSL: $([ "$CONFIGURE_SSL" = "S" ] && echo "Sim" || echo "Não")"
    echo ""
    
    read -p "Continuar com a instalação? (S/n): " CONFIRM
    CONFIRM=${CONFIRM:-S}
    if [[ ! $CONFIRM =~ ^[Ss]$ ]]; then
        echo -e "${YELLOW}Instalação cancelada.${NC}"
        pause
        return
    fi
    
    # Iniciar instalação
    set -e
    
    echo ""
    echo -e "${BLUE}📦 Atualizando sistema...${NC}"
    apt-get update -y
    apt-get upgrade -y || true
    
    # Instalar Git
    echo ""
    echo -e "${BLUE}📦 Instalando Git...${NC}"
    if ! command_exists git; then
        apt-get install -y git
        echo -e "${GREEN}✅ Git instalado: $(git --version)${NC}"
    else
        echo -e "${GREEN}✅ Git já instalado: $(git --version)${NC}"
    fi
    
    # Instalar Node.js
    echo ""
    echo -e "${BLUE}📦 Instalando Node.js...${NC}"
    if ! command_exists node; then
        curl -fsSL https://deb.nodesource.com/setup_20.x | bash - || {
            echo -e "${RED}❌ Erro ao baixar script do Node.js${NC}"
            set +e
            pause
            return
        }
        apt-get install -y nodejs || {
            echo -e "${RED}❌ Erro ao instalar Node.js${NC}"
            set +e
            pause
            return
        }
        echo -e "${GREEN}✅ Node.js instalado: $(node --version)${NC}"
    else
        NODE_VERSION=$(node --version)
        echo -e "${GREEN}✅ Node.js já instalado: $NODE_VERSION${NC}"
        NODE_MAJOR=$(echo $NODE_VERSION | cut -d'v' -f2 | cut -d'.' -f1)
        if [ "$NODE_MAJOR" -lt 18 ]; then
            echo -e "${YELLOW}⚠️  Node.js versão $NODE_VERSION detectada. Recomendado Node.js 18+${NC}"
            read -p "Deseja atualizar Node.js? (S/n): " UPDATE_NODE
            UPDATE_NODE=${UPDATE_NODE:-S}
            if [[ $UPDATE_NODE =~ ^[Ss]$ ]]; then
                curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
                apt-get install -y nodejs
                echo -e "${GREEN}✅ Node.js atualizado: $(node --version)${NC}"
            fi
        fi
    fi
    
    # Instalar PostgreSQL
    echo ""
    echo -e "${BLUE}📦 Instalando PostgreSQL...${NC}"
    if ! command_exists psql; then
        apt-get install -y postgresql postgresql-contrib || {
            echo -e "${RED}❌ Erro ao instalar PostgreSQL${NC}"
            set +e
            pause
            return
        }
        systemctl start postgresql
        systemctl enable postgresql
        echo -e "${GREEN}✅ PostgreSQL instalado${NC}"
    else
        echo -e "${GREEN}✅ PostgreSQL já instalado${NC}"
        systemctl start postgresql || true
    fi
    
    # Configurar banco de dados
    echo ""
    echo -e "${BLUE}🗄️  Configurando banco de dados...${NC}"
    sudo -u postgres psql -c "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER'" | grep -q 1 || {
        echo -e "${BLUE}   Criando usuário do banco de dados...${NC}"
        sudo -u postgres psql -c "CREATE USER $DB_USER WITH PASSWORD '$DB_PASSWORD';" || {
            echo -e "${RED}❌ Erro ao criar usuário do banco${NC}"
            set +e
            pause
            return
        }
        echo -e "${GREEN}✅ Usuário $DB_USER criado${NC}"
    }
    
    if sudo -u postgres psql -lqt | cut -d \| -f 1 | grep -qw "$DB_NAME"; then
        echo -e "${YELLOW}⚠️  Banco de dados $DB_NAME já existe${NC}"
        read -p "Deseja recriar o banco? Isso apagará todos os dados! (n/S): " RECREATE_DB
        RECREATE_DB=${RECREATE_DB:-n}
        if [[ $RECREATE_DB =~ ^[Ss]$ ]]; then
            sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;"
            sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;"
            echo -e "${GREEN}✅ Banco de dados recriado${NC}"
        fi
    else
        sudo -u postgres psql -c "CREATE DATABASE $DB_NAME OWNER $DB_USER;" || {
            echo -e "${RED}❌ Erro ao criar banco de dados${NC}"
            set +e
            pause
            return
        }
        echo -e "${GREEN}✅ Banco de dados $DB_NAME criado${NC}"
    fi
    
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE $DB_NAME TO $DB_USER;"
    echo -e "${GREEN}✅ Permissões configuradas${NC}"
    
    # Instalar Nginx
    echo ""
    echo -e "${BLUE}📦 Instalando Nginx...${NC}"
    if ! command_exists nginx; then
        apt-get install -y nginx || {
            echo -e "${RED}❌ Erro ao instalar Nginx${NC}"
            set +e
            pause
            return
        }
        systemctl start nginx
        systemctl enable nginx
        echo -e "${GREEN}✅ Nginx instalado${NC}"
    else
        echo -e "${GREEN}✅ Nginx já instalado${NC}"
        systemctl start nginx || true
    fi
    
    # Instalar PM2
    echo ""
    echo -e "${BLUE}📦 Instalando PM2...${NC}"
    if ! command_exists pm2; then
        npm install -g pm2 || {
            echo -e "${RED}❌ Erro ao instalar PM2${NC}"
            set +e
            pause
            return
        }
        echo -e "${GREEN}✅ PM2 instalado: $(pm2 --version)${NC}"
    else
        echo -e "${GREEN}✅ PM2 já instalado: $(pm2 --version)${NC}"
    fi
    
    # Clonar repositório
    echo ""
    echo -e "${BLUE}📥 Clonando repositório...${NC}"
    if [ ! -d "$APP_DIR" ]; then
        mkdir -p "$APP_DIR"
        chown -R "$SYSTEM_USER:$SYSTEM_USER" "$APP_DIR"
        echo -e "${GREEN}✅ Diretório criado: $APP_DIR${NC}"
    fi
    
    if [ -d "$APP_DIR/.git" ]; then
        echo -e "${YELLOW}⚠️  Repositório já existe em $APP_DIR${NC}"
        read -p "Deseja atualizar o código existente? (S/n): " UPDATE_REPO
        UPDATE_REPO=${UPDATE_REPO:-S}
        if [[ $UPDATE_REPO =~ ^[Ss]$ ]]; then
            cd "$APP_DIR"
            sudo -u "$SYSTEM_USER" git fetch origin
            sudo -u "$SYSTEM_USER" git checkout "$BRANCH" 2>/dev/null || true
            sudo -u "$SYSTEM_USER" git pull origin "$BRANCH" || {
                echo -e "${RED}❌ Erro ao atualizar repositório${NC}"
                set +e
                pause
                return
            }
            echo -e "${GREEN}✅ Repositório atualizado${NC}"
        fi
    else
        cd "$(dirname "$APP_DIR")"
        sudo -u "$SYSTEM_USER" git clone "$REPO_URL" "$(basename "$APP_DIR")" || {
            echo -e "${RED}❌ Erro ao clonar repositório${NC}"
            set +e
            pause
            return
        }
        cd "$APP_DIR"
        sudo -u "$SYSTEM_USER" git checkout "$BRANCH" 2>/dev/null || echo -e "${YELLOW}   Branch $BRANCH não encontrada, usando branch padrão${NC}"
        echo -e "${GREEN}✅ Repositório clonado${NC}"
    fi
    
    cd "$APP_DIR"
    
    if [ ! -f "package.json" ]; then
        echo -e "${RED}❌ package.json não encontrado em $APP_DIR${NC}"
        set +e
        pause
        return
    fi
    
    # Instalar dependências
    echo ""
    echo -e "${BLUE}📦 Instalando dependências npm...${NC}"
    sudo -u "$SYSTEM_USER" npm install || {
        echo -e "${RED}❌ Erro ao instalar dependências${NC}"
        set +e
        pause
        return
    }
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
    
    # Configurar .env
    echo ""
    echo -e "${BLUE}⚙️  Configurando arquivo .env...${NC}"
    if [ ! -f ".env" ]; then
        if [ -f ".env.example" ]; then
            sudo -u "$SYSTEM_USER" cp .env.example .env
        else
            sudo -u "$SYSTEM_USER" touch .env
        fi
    fi
    
    sudo -u "$SYSTEM_USER" bash -c "cat >> .env << EOF

# ============================================
# Configuração gerada pelo instalador
# ============================================
NODE_ENV=production
FRONTEND_PORT=$FRONTEND_PORT
BACKEND_PORT=$BACKEND_PORT
FRONTEND_DOMAIN=http://$FRONTEND_DOMAIN
BACKEND_DOMAIN=http://$BACKEND_DOMAIN
NEXT_PUBLIC_DOMAIN=http://$FRONTEND_DOMAIN

# Banco de Dados
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD

# JWT
JWT_SECRET=$JWT_SECRET

# CORS
ALLOWED_ORIGINS=http://$FRONTEND_DOMAIN,http://www.$FRONTEND_DOMAIN
EOF"
    
    sudo -u "$SYSTEM_USER" bash -c "awk '!seen[\$0]++' .env > .env.tmp && mv .env.tmp .env"
    chmod 600 .env
    chown "$SYSTEM_USER:$SYSTEM_USER" .env
    echo -e "${GREEN}✅ Arquivo .env configurado${NC}"
    
    # Executar migrations
    echo ""
    echo -e "${BLUE}🗄️  Executando migrations...${NC}"
    sudo -u "$SYSTEM_USER" npm run db:migrate || {
        echo -e "${YELLOW}⚠️  Erro ao executar migrations ou nenhuma migration encontrada${NC}"
        read -p "Continuar mesmo assim? (s/N): " CONTINUE
        if [[ ! $CONTINUE =~ ^[Ss]$ ]]; then
            set +e
            pause
            return
        fi
    }
    
    # Executar seeds
    echo ""
    echo -e "${BLUE}🌱 Executando seeds...${NC}"
    sudo -u "$SYSTEM_USER" npm run db:seed || {
        echo -e "${YELLOW}⚠️  Erro ao executar seeds ou nenhum seed encontrado${NC}"
    }
    
    # Build
    echo ""
    echo -e "${BLUE}🔨 Compilando aplicação...${NC}"
    echo -e "${YELLOW}   Isso pode levar vários minutos...${NC}"
    sudo -u "$SYSTEM_USER" npm run build || {
        echo -e "${RED}❌ Erro ao compilar aplicação${NC}"
        set +e
        pause
        return
    }
    echo -e "${GREEN}✅ Aplicação compilada${NC}"
    
    # Criar diretórios necessários
    echo ""
    echo -e "${BLUE}📁 Criando diretórios necessários...${NC}"
    
    # Diretório de logs
    mkdir -p logs
    chown -R "$SYSTEM_USER:$SYSTEM_USER" logs
    chmod 755 logs
    echo -e "${GREEN}   ✅ Diretório logs criado${NC}"
    
    # Diretório de uploads
    mkdir -p public/uploads
    chown -R "$SYSTEM_USER:$SYSTEM_USER" public/uploads
    chmod -R 755 public/uploads
    echo -e "${GREEN}   ✅ Diretório public/uploads criado${NC}"
    
    # Diretório de backups
    mkdir -p backups/database
    chown -R "$SYSTEM_USER:$SYSTEM_USER" backups
    chmod -R 755 backups
    echo -e "${GREEN}   ✅ Diretório backups criado${NC}"
    
    # Configurar PM2
    echo ""
    echo -e "${BLUE}⚙️  Configurando PM2...${NC}"
    
    if [ -f "ecosystem.config.js" ]; then
        cp ecosystem.config.js ecosystem.config.js.bak
        sed -i "s/PORT: 3255/PORT: $FRONTEND_PORT/g" ecosystem.config.js
        sed -i "s/PORT: 3256/PORT: $BACKEND_PORT/g" ecosystem.config.js
        sed -i "s|cwd: '/home/deploy/LojaMultivus'|cwd: '$APP_DIR'|g" ecosystem.config.js
        sed -i "s|/home/deploy/LojaMultivus|$APP_DIR|g" ecosystem.config.js
    fi
    
    pm2 delete loja-frontend loja-backend 2>/dev/null || true
    
    cd "$APP_DIR"
    sudo -u "$SYSTEM_USER" npm list -g pm2 >/dev/null 2>&1 || {
        echo -e "${BLUE}📦 Instalando PM2 para o usuário $SYSTEM_USER...${NC}"
        sudo -u "$SYSTEM_USER" npm install -g pm2
    }
    
    sudo -u "$SYSTEM_USER" bash -c "cd '$APP_DIR' && pm2 start ecosystem.config.js --env production" || {
        echo -e "${RED}❌ Erro ao iniciar aplicação com PM2${NC}"
        set +e
        pause
        return
    }
    
    sudo -u "$SYSTEM_USER" bash -c "cd '$APP_DIR' && pm2 save"
    
    echo ""
    echo -e "${BLUE}🔄 Configurando PM2 para iniciar no boot...${NC}"
    STARTUP_OUTPUT=$(sudo -u "$SYSTEM_USER" pm2 startup systemd -u "$SYSTEM_USER" --hp /home/$SYSTEM_USER 2>&1)
    STARTUP_CMD=$(echo "$STARTUP_OUTPUT" | grep "sudo" | head -1)
    if [ -n "$STARTUP_CMD" ]; then
        eval "$STARTUP_CMD"
        echo -e "${GREEN}✅ PM2 configurado para iniciar no boot${NC}"
    else
        echo -e "${YELLOW}⚠️  Configure PM2 manualmente executando:${NC}"
        echo "   sudo -u $SYSTEM_USER pm2 startup systemd -u $SYSTEM_USER --hp /home/$SYSTEM_USER"
    fi
    
    # Configurar Nginx
    echo ""
    echo -e "${BLUE}🌐 Configurando Nginx...${NC}"
    NGINX_FRONTEND="/etc/nginx/sites-available/multivus-loja"
    cat > "$NGINX_FRONTEND" <<EOF
# Configuração Nginx para MULTIVUS Loja - FRONTEND
# Domínio: $FRONTEND_DOMAIN
# Porta: $FRONTEND_PORT

server {
    listen 80;
    listen [::]:80;
    server_name $FRONTEND_DOMAIN www.$FRONTEND_DOMAIN;

    client_max_body_size 50M;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location /uploads {
        alias $APP_DIR/public/uploads/;
        autoindex off;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        
        location ~* \.(php|phtml|phar|pl|py|jsp|asp|cgi|sh|bash|exe|dll|bin)$ {
            deny all;
            return 403;
        }
    }

    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
    
    if [ ! -L "/etc/nginx/sites-enabled/multivus-loja" ]; then
        ln -s "$NGINX_FRONTEND" /etc/nginx/sites-enabled/
    fi
    
    if [ "$BACKEND_DOMAIN" != "$FRONTEND_DOMAIN" ]; then
        NGINX_BACKEND="/etc/nginx/sites-available/multivus-api"
        cat > "$NGINX_BACKEND" <<EOF
# Configuração Nginx para MULTIVUS Loja - BACKEND
# Domínio: $BACKEND_DOMAIN
# Porta: $BACKEND_PORT

server {
    listen 80;
    listen [::]:80;
    server_name $BACKEND_DOMAIN;

    client_max_body_size 50M;

    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    location / {
        proxy_pass http://localhost:$BACKEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
    }
}
EOF
        if [ ! -L "/etc/nginx/sites-enabled/multivus-api" ]; then
            ln -s "$NGINX_BACKEND" /etc/nginx/sites-enabled/
        fi
    fi
    
    if [ -L "/etc/nginx/sites-enabled/default" ]; then
        echo -e "${BLUE}   Removendo vhost default que pode causar conflitos...${NC}"
        rm -f /etc/nginx/sites-enabled/default
    fi
    
    nginx -t || {
        echo -e "${RED}❌ Erro na configuração do Nginx${NC}"
        set +e
        pause
        return
    }
    
    systemctl reload nginx
    echo -e "${GREEN}✅ Nginx configurado${NC}"
    
    # Configurar SSL (usando a mesma lógica do install.sh com validações)
    if [[ $CONFIGURE_SSL =~ ^[Ss]$ ]]; then
        echo ""
        echo -e "${BLUE}🔒 Configurando SSL com Let's Encrypt...${NC}"
        
        DNS_OK=true
        if ! command_exists dig; then
            apt-get install -y dnsutils 2>/dev/null || true
        fi
        
        if command_exists dig; then
            FRONTEND_IP=$(dig +short "$FRONTEND_DOMAIN" | head -1)
            SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")
            
            if [ -n "$FRONTEND_IP" ] && [ -n "$SERVER_IP" ]; then
                echo -e "${GREEN}   DNS do frontend: $FRONTEND_DOMAIN → $FRONTEND_IP${NC}"
                echo -e "${GREEN}   IP do servidor: $SERVER_IP${NC}"
                
                if [ "$FRONTEND_IP" != "$SERVER_IP" ]; then
                    echo -e "${RED}   ❌ ATENÇÃO: O DNS não aponta para este servidor!${NC}"
                    echo -e "${YELLOW}   Configure o DNS para apontar $FRONTEND_DOMAIN para $SERVER_IP${NC}"
                    read -p "Deseja continuar mesmo assim? (s/N): " CONTINUE_DNS
                    if [[ ! $CONTINUE_DNS =~ ^[Ss]$ ]]; then
                        CONFIGURE_SSL="n"
                        DNS_OK=false
                    fi
                fi
            fi
        fi
        
        if [ "$DNS_OK" = true ] && [[ $CONFIGURE_SSL =~ ^[Ss]$ ]]; then
            echo -e "${YELLOW}🔍 Validando configuração do Nginx antes do SSL...${NC}"
            
            if ! grep -q "server_name.*$FRONTEND_DOMAIN" /etc/nginx/sites-enabled/* 2>/dev/null; then
                echo -e "${RED}   ❌ ERRO CRÍTICO: Server block não encontrado${NC}"
                if [ ! -L "/etc/nginx/sites-enabled/multivus-loja" ]; then
                    ln -s "$NGINX_FRONTEND" /etc/nginx/sites-enabled/
                fi
                nginx -t && systemctl reload nginx || {
                    CONFIGURE_SSL="n"
                    DNS_OK=false
                }
            fi
            
            if [ "$DNS_OK" = true ]; then
                echo -e "${YELLOW}   Testando resposta HTTP do domínio...${NC}"
                sleep 2
                HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$FRONTEND_DOMAIN" 2>/dev/null || echo "000")
                
                if [ "$HTTP_CODE" = "000" ] || [ -z "$HTTP_CODE" ]; then
                    echo -e "${RED}   ❌ ERRO: O domínio não está respondendo em HTTP${NC}"
                    read -p "Deseja continuar mesmo assim? (s/N): " CONTINUE_HTTP
                    if [[ ! $CONTINUE_HTTP =~ ^[Ss]$ ]]; then
                        CONFIGURE_SSL="n"
                        DNS_OK=false
                    fi
                elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then
                    echo -e "${GREEN}   ✅ Domínio responde em HTTP (código: $HTTP_CODE)${NC}"
                fi
            fi
            
            if [ "$DNS_OK" = true ]; then
                DEFAULT_SERVER_COUNT=$(grep -r "default_server" /etc/nginx/sites-enabled/ 2>/dev/null | wc -l)
                if [ "$DEFAULT_SERVER_COUNT" -gt 1 ]; then
                    sed -i 's/ listen 80 default_server;/ listen 80;/g' /etc/nginx/sites-enabled/*
                    sed -i 's/ listen \[::\]:80 default_server;/ listen [::]:80;/g' /etc/nginx/sites-enabled/*
                    nginx -t && systemctl reload nginx || true
                fi
            fi
        fi
        
        if [ "$DNS_OK" = true ] && [[ $CONFIGURE_SSL =~ ^[Ss]$ ]]; then
            if ! command_exists certbot; then
                echo -e "${BLUE}📦 Instalando Certbot...${NC}"
                apt-get update
                apt-get install -y certbot python3-certbot-nginx || {
                    CONFIGURE_SSL="n"
                }
            fi
            
            if command_exists certbot && [[ $CONFIGURE_SSL =~ ^[Ss]$ ]] && [ "$DNS_OK" = true ]; then
                if ! nginx -T 2>/dev/null | grep -q "server_name.*$FRONTEND_DOMAIN"; then
                    echo -e "${RED}   ❌ ERRO CRÍTICO: Server block não encontrado no Nginx${NC}"
                    CONFIGURE_SSL="n"
                else
                    echo -e "${BLUE}   Configurando certificado para $FRONTEND_DOMAIN...${NC}"
                    CERTBOT_OUTPUT=$(certbot --nginx -d "$FRONTEND_DOMAIN" -d "www.$FRONTEND_DOMAIN" \
                        --non-interactive --agree-tos \
                        --email "admin@$FRONTEND_DOMAIN" \
                        --redirect \
                        --cert-name "$FRONTEND_DOMAIN" 2>&1)
                    
                    CERTBOT_EXIT=$?
                    
                    if [ $CERTBOT_EXIT -eq 0 ]; then
                        if nginx -T 2>/dev/null | grep -q "ssl_certificate.*$FRONTEND_DOMAIN"; then
                            echo -e "${GREEN}   ✅ Certificado SSL configurado${NC}"
                            
                            sleep 2
                            HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$FRONTEND_DOMAIN" 2>/dev/null || echo "000")
                            
                            if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "301" ] || [ "$HTTPS_CODE" = "302" ]; then
                                echo -e "${GREEN}✅ SSL configurado e funcionando!${NC}"
                                
                                cd "$APP_DIR"
                                if [ -f ".env" ]; then
                                    sed -i "s|FRONTEND_DOMAIN=http://|FRONTEND_DOMAIN=https://|g" .env
                                    sed -i "s|BACKEND_DOMAIN=http://|BACKEND_DOMAIN=https://|g" .env
                                    sed -i "s|NEXT_PUBLIC_DOMAIN=http://|NEXT_PUBLIC_DOMAIN=https://|g" .env
                                    sed -i "s|ALLOWED_ORIGINS=http://|ALLOWED_ORIGINS=https://|g" .env
                                    chown "$SYSTEM_USER:$SYSTEM_USER" .env
                                    echo -e "${GREEN}   ✅ .env atualizado para HTTPS${NC}"
                                fi
                                
                                systemctl enable certbot.timer 2>/dev/null || true
                                systemctl start certbot.timer 2>/dev/null || true
                                nginx -t && systemctl reload nginx
                                echo -e "${GREEN}✅ Renovação automática configurada${NC}"
                            fi
                        fi
                    else
                        echo -e "${RED}   ❌ Erro ao configurar SSL${NC}"
                        echo "$CERTBOT_OUTPUT" | tail -20
                    fi
                fi
            fi
        fi
    fi
    
    # Configurar Firewall
    echo ""
    echo -e "${BLUE}🔥 Configurando firewall...${NC}"
    if command_exists ufw; then
        ufw allow 22/tcp
        ufw allow 80/tcp
        ufw allow 443/tcp
        echo -e "${GREEN}✅ Firewall configurado${NC}"
    fi
    
    set +e
    
    # Resumo final
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ✅ INSTALAÇÃO CONCLUÍDA!"
    echo "==========================================${NC}"
    echo ""
    echo -e "${BLUE}📋 Informações da instalação:${NC}"
    echo "   👤 Usuário: $SYSTEM_USER"
    echo "   📂 Diretório: $APP_DIR"
    echo "   🌐 Frontend: http://$FRONTEND_DOMAIN (porta $FRONTEND_PORT)"
    echo "   🌐 Backend: http://$BACKEND_DOMAIN (porta $BACKEND_PORT)"
    echo "   🗄️  Banco: $DB_NAME"
    echo ""
    echo -e "${BLUE}📝 Próximos passos:${NC}"
    echo "   1. Configure DNS apontando $FRONTEND_DOMAIN para este servidor"
    echo "   2. Acesse http://$FRONTEND_DOMAIN/admin/login"
    echo "   3. Altere a senha do admin"
    echo ""
    
    pause
}

# 2. Atualizar (Docker)
option_deploy() {
    echo -e "${BLUE}🚀 Atualizar (Docker)${NC}"
    echo ""
    check_project_dir
    cd "$PROJECT_DIR"

    if [ ! -f .env ]; then
        echo -e "${RED}❌ .env não encontrado. Rode: bash scripts/install.sh${NC}"
        pause
        return
    fi

    bash "$SCRIPT_DIR/update.sh"
    pause
}

# 3. Verificar Mudanças
option_check_changes() {
    echo -e "${BLUE}🔍 Verificar Mudanças${NC}"
    echo ""
    check_project_dir
    cd "$PROJECT_DIR"
    
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Este diretório não é um repositório Git${NC}"
        pause
        return
    fi
    
    BRANCH="${BRANCH:-main}"
    git fetch origin "$BRANCH" 2>/dev/null || {
        echo -e "${YELLOW}⚠️  Não foi possível buscar atualizações${NC}"
        pause
        return
    }
    
    LOCAL_COMMIT=$(git rev-parse HEAD 2>/dev/null || echo "")
    REMOTE_COMMIT=$(git rev-parse "origin/$BRANCH" 2>/dev/null || echo "")
    
    echo -e "${BLUE}📊 Status:${NC}"
    echo -e "   Local:  ${LOCAL_COMMIT:0:8}"
    echo -e "   Remoto: ${REMOTE_COMMIT:0:8}"
    echo ""
    
    if [ "$LOCAL_COMMIT" = "$REMOTE_COMMIT" ]; then
        echo -e "${GREEN}✅ Código está atualizado${NC}"
    else
        echo -e "${YELLOW}📥 Atualizações disponíveis!${NC}"
        CHANGED_FILES=$(git diff --name-only "$LOCAL_COMMIT" "$REMOTE_COMMIT" 2>/dev/null || echo "")
        FILE_COUNT=$(echo "$CHANGED_FILES" | grep -v '^$' | wc -l)
        echo -e "${BLUE}📝 Arquivos alterados ($FILE_COUNT):${NC}"
        echo "$CHANGED_FILES" | head -20 | while read -r file; do
            [ -n "$file" ] && echo -e "   - $file"
        done
    fi
    
    pause
}

# 4. Backup do Banco de Dados (função interna)
option_backup_database_internal() {
    load_env
    DB_NAME="${DB_NAME:-multivus_loja}"
    DB_USER="${DB_USER:-multivus_store}"
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups/database}"
    
    mkdir -p "$BACKUP_DIR"
    TIMESTAMP=$(date +%Y%m%d_%H%M%S)
    BACKUP_FILE="$BACKUP_DIR/multivus_loja_$TIMESTAMP.sql.gz"
    
    echo -e "${YELLOW}📦 Criando backup...${NC}"
    
    if [ -n "$DB_PASSWORD" ]; then
        export PGPASSWORD="$DB_PASSWORD"
        pg_dump -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -F p | gzip > "$BACKUP_FILE"
        unset PGPASSWORD
    else
        sudo -u postgres pg_dump -d "$DB_NAME" -F p | gzip > "$BACKUP_FILE" 2>/dev/null || {
            echo -e "${RED}❌ Erro ao criar backup${NC}"
            return 1
        }
    fi
    
    if [ -f "$BACKUP_FILE" ] && [ -s "$BACKUP_FILE" ]; then
        SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
        echo -e "${GREEN}✅ Backup criado: $(basename "$BACKUP_FILE") ($SIZE)${NC}"
        return 0
    else
        echo -e "${RED}❌ Erro ao criar backup${NC}"
        return 1
    fi
}

# 4. Backup do Banco de Dados
option_backup_database() {
    echo -e "${BLUE}📊 Backup do Banco de Dados${NC}"
    echo ""
    check_project_dir
    cd "$PROJECT_DIR"
    option_backup_database_internal
    pause
}

# 5. Backup Completo
option_backup_completo() {
    echo -e "${BLUE}📦 Backup Completo${NC}"
    echo ""
    check_project_dir
    cd "$PROJECT_DIR"
    load_env
    
    BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
    DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_NAME="backup_${DATE}"
    BACKUP_PATH="$BACKUP_DIR/$BACKUP_NAME"
    
    mkdir -p "$BACKUP_PATH"
    
    echo -e "${GREEN}🔄 Iniciando backup completo...${NC}"
    
    # Backup do banco
    echo -e "${YELLOW}📊 Fazendo backup do banco...${NC}"
    DB_BACKUP_FILE="$BACKUP_PATH/database.sql.gz"
    option_backup_database_internal
    mv "$BACKUP_DIR/database/multivus_loja_"*.sql.gz "$DB_BACKUP_FILE" 2>/dev/null || true
    
    # Backup de arquivos
    echo -e "${YELLOW}📁 Fazendo backup de arquivos...${NC}"
    MEDIA_BACKUP_FILE="$BACKUP_PATH/media.tar.gz"
    cd "$PROJECT_DIR"
    tar -czf "$MEDIA_BACKUP_FILE" public/uploads public/media public/static 2>/dev/null || true
    
    # Backup do .env
    if [ -f ".env" ]; then
        cp .env "$BACKUP_PATH/.env.backup"
    fi
    
    # Compactar tudo
    echo -e "${YELLOW}📦 Compactando backup...${NC}"
    FINAL_BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    cd "$BACKUP_DIR"
    tar -czf "$FINAL_BACKUP_FILE" "$BACKUP_NAME"
    rm -rf "$BACKUP_PATH"
    
    SIZE=$(du -h "$FINAL_BACKUP_FILE" | cut -f1)
    echo -e "${GREEN}✅ Backup completo criado: ${BACKUP_NAME}.tar.gz ($SIZE)${NC}"
    pause
}

# 6. Listar Backups
option_list_backups() {
    echo -e "${BLUE}📋 Listar Backups${NC}"
    echo ""
    check_project_dir
    
    BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
    
    if [ ! -d "$BACKUP_DIR" ]; then
        echo -e "${YELLOW}⚠️  Nenhum backup encontrado${NC}"
        pause
        return
    fi
    
    BACKUP_COUNT=$(find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f 2>/dev/null | wc -l)
    
    if [ "$BACKUP_COUNT" -eq 0 ]; then
        echo -e "${YELLOW}⚠️  Nenhum backup encontrado${NC}"
    else
        echo "Total: $BACKUP_COUNT backups"
        echo ""
        echo "Nome do Backup                    | Tamanho    | Data"
        echo "────────────────────────────────────────────────────────────"
        
        find "$BACKUP_DIR" -name "backup_*.tar.gz" -type f -printf "%f\t%s\t%T@\n" 2>/dev/null | \
            sort -k3 -rn | \
            while IFS=$'\t' read -r filename size timestamp; do
                backup_name="${filename%.tar.gz}"
                size_human=$(numfmt --to=iec-i --suffix=B "$size" 2>/dev/null || echo "$size bytes")
                date_formatted=$(date -d "@$timestamp" "+%Y-%m-%d %H:%M:%S" 2>/dev/null || echo "N/A")
                printf "%-35s | %-10s | %s\n" "$backup_name" "$size_human" "$date_formatted"
            done
    fi
    
    pause
}

# 7. Restaurar Backup
option_restore_backup() {
    echo -e "${BLUE}🔄 Restaurar Backup${NC}"
    echo ""
    check_project_dir
    cd "$PROJECT_DIR"
    load_env
    
    BACKUP_DIR="${BACKUP_DIR:-$PROJECT_DIR/backups}"
    
    echo "Backups disponíveis:"
    option_list_backups
    echo ""
    read -p "Digite o nome do backup (sem .tar.gz): " BACKUP_NAME
    
    if [ -z "$BACKUP_NAME" ]; then
        echo -e "${RED}❌ Nome do backup não fornecido${NC}"
        pause
        return
    fi
    
    BACKUP_FILE="$BACKUP_DIR/${BACKUP_NAME}.tar.gz"
    TEMP_DIR="$BACKUP_DIR/restore_temp_$$"
    
    if [ ! -f "$BACKUP_FILE" ]; then
        echo -e "${RED}❌ Backup não encontrado!${NC}"
        pause
        return
    fi
    
    echo -e "${YELLOW}⚠️  ATENÇÃO: Esta operação irá substituir dados atuais!${NC}"
    read -p "Digite 'SIM' para confirmar: " CONFIRM
    
    if [ "$CONFIRM" != "SIM" ]; then
        echo -e "${YELLOW}❌ Restauração cancelada${NC}"
        pause
        return
    fi
    
    mkdir -p "$TEMP_DIR"
    cd "$TEMP_DIR"
    tar -xzf "$BACKUP_FILE"
    EXTRACTED_DIR=$(ls -d backup_* | head -1)
    
    # Restaurar banco
    if [ -f "$EXTRACTED_DIR/database.sql.gz" ]; then
        echo -e "${YELLOW}📊 Restaurando banco de dados...${NC}"
        DB_NAME="${DB_NAME:-multivus_loja}"
        if [ -n "$DB_PASSWORD" ]; then
            export PGPASSWORD="$DB_PASSWORD"
            gunzip -c "$EXTRACTED_DIR/database.sql.gz" | psql -h "${DB_HOST:-localhost}" -U "${DB_USER:-multivus_store}" -d "$DB_NAME"
            unset PGPASSWORD
        else
            gunzip -c "$EXTRACTED_DIR/database.sql.gz" | sudo -u postgres psql -d "$DB_NAME"
        fi
        echo -e "${GREEN}✅ Banco restaurado${NC}"
    fi
    
    # Restaurar arquivos
    if [ -f "$EXTRACTED_DIR/media.tar.gz" ]; then
        echo -e "${YELLOW}📁 Restaurando arquivos...${NC}"
        cd "$PROJECT_DIR"
        tar -xzf "$EXTRACTED_DIR/media.tar.gz"
        echo -e "${GREEN}✅ Arquivos restaurados${NC}"
    fi
    
    rm -rf "$TEMP_DIR"
    echo -e "${GREEN}✅ Restauração concluída!${NC}"
    pause
}

# 8. Configurar SSL
option_config_ssl() {
    echo -e "${BLUE}🔒 Configurar SSL${NC}"
    echo ""
    
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Esta opção requer sudo${NC}"
        pause
        return
    fi
    
    check_project_dir
    cd "$PROJECT_DIR"
    load_env
    
    read -p "Digite o domínio do FRONTEND: " FRONTEND_DOMAIN
    read -p "Digite o domínio do BACKEND (ou Enter para usar o mesmo): " BACKEND_DOMAIN_INPUT
    read -p "Digite seu email: " EMAIL
    
    if [ -z "$FRONTEND_DOMAIN" ] || [ -z "$EMAIL" ]; then
        echo -e "${RED}❌ Domínio frontend e email são obrigatórios!${NC}"
        pause
        return
    fi
    
    if [ -z "$BACKEND_DOMAIN_INPUT" ]; then
        BACKEND_DOMAIN="$FRONTEND_DOMAIN"
    else
        BACKEND_DOMAIN="$BACKEND_DOMAIN_INPUT"
    fi
    
    # Verificar DNS
    echo -e "${YELLOW}🌐 Verificando DNS...${NC}"
    if ! command_exists dig &> /dev/null; then
        apt-get install -y dnsutils 2>/dev/null || true
    fi
    
    if command_exists dig &> /dev/null; then
        FRONTEND_IP=$(dig +short "$FRONTEND_DOMAIN" | head -1)
        SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || curl -s ipinfo.io/ip 2>/dev/null || echo "")
        
        if [ -n "$FRONTEND_IP" ] && [ -n "$SERVER_IP" ]; then
            echo -e "${GREEN}   DNS do frontend: $FRONTEND_DOMAIN → $FRONTEND_IP${NC}"
            echo -e "${GREEN}   IP do servidor: $SERVER_IP${NC}"
            
            if [ "$FRONTEND_IP" != "$SERVER_IP" ]; then
                echo -e "${RED}   ❌ ATENÇÃO: O DNS não aponta para este servidor!${NC}"
                echo -e "${YELLOW}   Configure o DNS para apontar $FRONTEND_DOMAIN para $SERVER_IP${NC}"
                read -p "Deseja continuar mesmo assim? (s/N): " CONTINUE_DNS
                if [[ ! $CONTINUE_DNS =~ ^[Ss]$ ]]; then
                    echo -e "${YELLOW}   Operação cancelada${NC}"
                    pause
                    return
                fi
            fi
        fi
    fi
    
    # VALIDAÇÃO CRÍTICA: Garantir server block HTTP dedicado antes do Certbot
    echo -e "${YELLOW}🔍 Validando e preparando configuração do Nginx...${NC}"
    
    # Função para validar server block HTTP dedicado
    validate_http_server_block() {
        local domain=$1
        # Verificar se existe um server block HTTP (sem SSL) com server_name exato
        nginx -T 2>/dev/null | grep -A 10 "server_name.*$domain" | grep -q "listen 80" && \
        ! nginx -T 2>/dev/null | grep -A 10 "server_name.*$domain" | grep -q "listen 443\|ssl_certificate" && \
        nginx -T 2>/dev/null | grep -A 2 "server_name.*$domain" | grep -q "server_name.*$domain"
    }
    
    # 1. Verificar se existe server block HTTP dedicado válido
    SERVER_BLOCK_VALID=false
    
    if validate_http_server_block "$FRONTEND_DOMAIN"; then
        # Verificar se o server block está isolado (não compartilhado com outros domínios)
        SERVER_BLOCK_COUNT=$(nginx -T 2>/dev/null | grep -B 5 "server_name.*$FRONTEND_DOMAIN" | grep -c "server {" || echo "0")
        if [ "$SERVER_BLOCK_COUNT" -eq 1 ]; then
            SERVER_BLOCK_VALID=true
            echo -e "${GREEN}   ✅ Server block HTTP dedicado encontrado${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Server block encontrado mas pode estar compartilhado${NC}"
        fi
    fi
    
    # 2. Se não for válido, verificar se existe server block principal ou criar um
    if [ "$SERVER_BLOCK_VALID" = false ]; then
        echo -e "${YELLOW}   Verificando server block principal da aplicação...${NC}"
        
        # Verificar se existe server block principal (multivus-loja)
        NGINX_MAIN_CONFIG="/etc/nginx/sites-available/multivus-loja"
        NGINX_CONFIG="$NGINX_MAIN_CONFIG"
        
        # Carregar variáveis do .env para obter porta da aplicação
        if [ -f "$PROJECT_DIR/.env" ]; then
            export $(cat "$PROJECT_DIR/.env" | grep -v '^#' | grep -E "FRONTEND_PORT|APP_DIR" | xargs)
        fi
        
        FRONTEND_PORT=${FRONTEND_PORT:-3255}
        APP_DIR=${APP_DIR:-/home/deploy/LojaMultivus}
        
        # Se não existe o server block principal, criar um que aponte para a aplicação
        if [ ! -f "$NGINX_MAIN_CONFIG" ]; then
            echo -e "${YELLOW}   Criando server block principal da aplicação...${NC}"
            cat > "$NGINX_MAIN_CONFIG" <<EOF
# Configuração Nginx para MULTIVUS Loja - FRONTEND
# Domínio: $FRONTEND_DOMAIN
# Porta: $FRONTEND_PORT

server {
    listen 80;
    listen [::]:80;
    server_name $FRONTEND_DOMAIN www.$FRONTEND_DOMAIN;

    client_max_body_size 50M;

    # Permitir validação do Let's Encrypt
    location /.well-known/acme-challenge/ {
        root /var/www/html;
    }

    # Servir uploads diretamente
    location /uploads {
        alias $APP_DIR/public/uploads/;
        autoindex off;
        expires 30d;
        add_header Cache-Control "public";
        access_log off;
        
        location ~* \.(php|phtml|phar|pl|py|jsp|asp|cgi|sh|bash|exe|dll|bin)$ {
            deny all;
            return 403;
        }
    }

    # Proxy para aplicação Next.js
    location / {
        proxy_pass http://localhost:$FRONTEND_PORT;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }
}
EOF
        else
            echo -e "${YELLOW}   Server block principal encontrado, garantindo que está em HTTP...${NC}"
            # Remover SSL do server block principal se existir (para validação)
            sed -i '/listen 443/d' "$NGINX_MAIN_CONFIG"
            sed -i '/ssl_certificate/d' "$NGINX_MAIN_CONFIG"
            sed -i '/ssl_certificate_key/d' "$NGINX_MAIN_CONFIG"
            # Garantir que tem listen 80
            if ! grep -q "listen 80" "$NGINX_MAIN_CONFIG"; then
                sed -i '/server_name/a\    listen 80;\n    listen [::]:80;' "$NGINX_MAIN_CONFIG"
            fi
        fi
        
        # Ativar o server block principal
        ln -sf "$NGINX_CONFIG" /etc/nginx/sites-enabled/multivus-loja
        
        # Remover server block temporário se existir
        if [ -L "/etc/nginx/sites-enabled/multivus-loja-ssl" ]; then
            rm -f /etc/nginx/sites-enabled/multivus-loja-ssl
        fi
        if [ -f "/etc/nginx/sites-available/multivus-loja-ssl" ]; then
            rm -f /etc/nginx/sites-available/multivus-loja-ssl
        fi
        
        # Remover conflitos de default_server
        sed -i 's/ listen 80 default_server;/ listen 80;/g' /etc/nginx/sites-enabled/*
        sed -i 's/ listen \[::\]:80 default_server;/ listen [::]:80;/g' /etc/nginx/sites-enabled/*
        
        # Testar e recarregar
        if nginx -t 2>/dev/null; then
            systemctl reload nginx
            sleep 2
            
            # Validar novamente
            if validate_http_server_block "$FRONTEND_DOMAIN"; then
                SERVER_BLOCK_VALID=true
                echo -e "${GREEN}   ✅ Server block HTTP dedicado criado e ativado${NC}"
            else
                echo -e "${RED}   ❌ Erro: Server block criado mas não está válido${NC}"
                echo -e "${YELLOW}   Verifique manualmente: nginx -T | grep -A 10 '$FRONTEND_DOMAIN'${NC}"
                pause
                return
            fi
        else
            echo -e "${RED}   ❌ Erro na configuração do Nginx${NC}"
            nginx -t
            pause
            return
        fi
    fi
    
    # 3. Validação final: Verificar que o server block está correto
    if [ "$SERVER_BLOCK_VALID" = true ]; then
        echo -e "${YELLOW}   Validando server block no Nginx...${NC}"
        
        # Verificar usando nginx -T (mais confiável)
        if ! nginx -T 2>/dev/null | grep -A 5 "server_name.*$FRONTEND_DOMAIN" | grep -q "listen 80"; then
            echo -e "${RED}   ❌ ERRO: Server block não encontrado ou não está em HTTP${NC}"
            echo -e "${YELLOW}   Saída do nginx -T:${NC}"
            nginx -T 2>/dev/null | grep -A 10 "server_name.*$FRONTEND_DOMAIN" || echo "   Nenhum server block encontrado"
            pause
            return
        fi
        
        # Verificar que não tem SSL
        if nginx -T 2>/dev/null | grep -A 10 "server_name.*$FRONTEND_DOMAIN" | grep -q "ssl_certificate\|listen 443"; then
            echo -e "${RED}   ❌ ERRO: Server block já possui SSL configurado${NC}"
            echo -e "${YELLOW}   O Certbot precisa de um server block HTTP limpo${NC}"
            pause
            return
        fi
        
        echo -e "${GREEN}   ✅ Server block HTTP válido confirmado${NC}"
        
        # 4. Testar resposta HTTP
        echo -e "${YELLOW}   Testando resposta HTTP do domínio...${NC}"
        sleep 2
        
        HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "http://$FRONTEND_DOMAIN" 2>/dev/null || echo "000")
        
        if [ "$HTTP_CODE" = "000" ] || [ -z "$HTTP_CODE" ]; then
            echo -e "${RED}   ❌ ERRO: O domínio não está respondendo em HTTP${NC}"
            echo -e "${YELLOW}   Possíveis causas:${NC}"
            echo "   - DNS não propagou completamente"
            echo "   - Porta 80 bloqueada no firewall"
            echo "   - Nginx não está rodando"
            echo ""
            read -p "Deseja continuar mesmo assim? (s/N): " CONTINUE_HTTP
            if [[ ! $CONTINUE_HTTP =~ ^[Ss]$ ]]; then
                echo -e "${YELLOW}   Operação cancelada${NC}"
                pause
                return
            fi
        elif [ "$HTTP_CODE" = "200" ] || [ "$HTTP_CODE" = "301" ] || [ "$HTTP_CODE" = "302" ] || [ "$HTTP_CODE" = "404" ]; then
            echo -e "${GREEN}   ✅ Domínio responde em HTTP (código: $HTTP_CODE)${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Domínio responde com código HTTP: $HTTP_CODE${NC}"
        fi
    else
        echo -e "${RED}   ❌ ERRO: Não foi possível criar/validar server block HTTP${NC}"
        pause
        return
    fi
    
    # Instalar Certbot se necessário
    if ! command -v certbot &> /dev/null; then
        echo -e "${BLUE}📦 Instalando Certbot...${NC}"
        apt-get update
        apt-get install -y certbot python3-certbot-nginx || {
            echo -e "${RED}❌ Erro ao instalar Certbot${NC}"
            pause
            return
        }
    fi
    
    # Validação final antes do Certbot
    if [ "$SERVER_BLOCK_VALID" != true ]; then
        echo -e "${RED}   ❌ ERRO CRÍTICO: Server block HTTP dedicado não está válido${NC}"
        echo -e "${YELLOW}   O Certbot precisa de um server block HTTP isolado com server_name $FRONTEND_DOMAIN${NC}"
        echo -e "${YELLOW}   Verifique: nginx -T | grep -A 10 '$FRONTEND_DOMAIN'${NC}"
        pause
        return
    fi
    
    # Verificação final usando nginx -T
    if ! nginx -T 2>/dev/null | grep -A 5 "server_name.*$FRONTEND_DOMAIN" | grep -q "listen 80"; then
        echo -e "${RED}   ❌ ERRO CRÍTICO: Server block HTTP não encontrado no Nginx${NC}"
        echo -e "${YELLOW}   Saída do nginx -T:${NC}"
        nginx -T 2>/dev/null | grep -A 10 "server_name.*$FRONTEND_DOMAIN" || echo "   Nenhum server block encontrado"
        pause
        return
    fi
    
    # Configurar certificado para frontend
    echo -e "${BLUE}   Configurando certificado para $FRONTEND_DOMAIN...${NC}"
    echo -e "${YELLOW}   Certbot precisa de acesso HTTP na porta 80 para validar o domínio${NC}"
    
    CERTBOT_OUTPUT=$(certbot --nginx -d "$FRONTEND_DOMAIN" -d "www.$FRONTEND_DOMAIN" \
        --non-interactive --agree-tos \
        --email "$EMAIL" \
        --redirect \
        --cert-name "$FRONTEND_DOMAIN" 2>&1)
    
    CERTBOT_EXIT=$?
    
    if [ $CERTBOT_EXIT -eq 0 ]; then
        # Remover server block temporário se existir
        if [ -L "/etc/nginx/sites-enabled/multivus-loja-ssl" ]; then
            echo -e "${YELLOW}   Removendo server block temporário...${NC}"
            rm -f /etc/nginx/sites-enabled/multivus-loja-ssl
        fi
        if [ -f "/etc/nginx/sites-available/multivus-loja-ssl" ]; then
            rm -f /etc/nginx/sites-available/multivus-loja-ssl
        fi
        
        # Validar que o certificado foi instalado corretamente
        if nginx -T 2>/dev/null | grep -q "ssl_certificate.*$FRONTEND_DOMAIN"; then
            echo -e "${GREEN}   ✅ Certificado SSL configurado e instalado para $FRONTEND_DOMAIN${NC}"
            
            # Recarregar Nginx para aplicar mudanças
            nginx -t && systemctl reload nginx
            
            # Testar HTTPS
            echo -e "${YELLOW}   Testando HTTPS...${NC}"
            sleep 2
            HTTPS_CODE=$(curl -s -o /dev/null -w "%{http_code}" --max-time 10 "https://$FRONTEND_DOMAIN" 2>/dev/null || echo "000")
            
            if [ "$HTTPS_CODE" = "200" ] || [ "$HTTPS_CODE" = "301" ] || [ "$HTTPS_CODE" = "302" ]; then
                echo -e "${GREEN}   ✅ HTTPS funcionando! (código: $HTTPS_CODE)${NC}"
            else
                echo -e "${YELLOW}   ⚠️  HTTPS retornou código: $HTTPS_CODE${NC}"
            fi
        else
            echo -e "${YELLOW}   ⚠️  Certificado gerado mas pode não estar instalado corretamente${NC}"
        fi
    else
        echo -e "${RED}   ❌ Erro ao configurar SSL para $FRONTEND_DOMAIN${NC}"
        echo -e "${YELLOW}   Saída do Certbot:${NC}"
        echo "$CERTBOT_OUTPUT" | tail -30
        echo ""
        echo -e "${RED}   ERRO ESPECÍFICO:${NC}"
        if echo "$CERTBOT_OUTPUT" | grep -qi "No matching server\|Could not automatically find"; then
            echo -e "${RED}   → ERRO: Nenhum server block HTTP válido foi encontrado no Nginx${NC}"
            echo -e "${RED}   → com server_name correspondente a: $FRONTEND_DOMAIN${NC}"
            echo ""
            echo -e "${YELLOW}   O domínio respondeu em HTTP, porém foi atendido por um vhost genérico${NC}"
            echo -e "${YELLOW}   ou default, incompatível com o Certbot.${NC}"
            echo ""
            echo -e "${YELLOW}   Correção: criar e ativar um server block dedicado antes de configurar o SSL.${NC}"
            echo -e "${YELLOW}   O instalador tentou criar automaticamente, mas pode ter falhado.${NC}"
            echo ""
            echo -e "${YELLOW}   Verifique manualmente:${NC}"
            echo "   nginx -T | grep -A 10 '$FRONTEND_DOMAIN'"
        elif echo "$CERTBOT_OUTPUT" | grep -qi "Connection refused\|timeout"; then
            echo -e "${RED}   → O domínio não está acessível externamente na porta 80${NC}"
            echo -e "${YELLOW}   → Verifique firewall e DNS${NC}"
        fi
        pause
        return
    fi
    
    # Configurar certificado para backend (se diferente)
    if [ "$BACKEND_DOMAIN" != "$FRONTEND_DOMAIN" ] && [ "$CERTBOT_EXIT" -eq 0 ]; then
        echo -e "${BLUE}   Configurando certificado para $BACKEND_DOMAIN...${NC}"
        
        # Verificar se server block existe
        if nginx -T 2>/dev/null | grep -q "server_name.*$BACKEND_DOMAIN"; then
            certbot --nginx -d "$BACKEND_DOMAIN" \
                --non-interactive --agree-tos \
                --email "$EMAIL" \
                --redirect \
                --cert-name "$BACKEND_DOMAIN" 2>&1
            
            if [ $? -eq 0 ]; then
                echo -e "${GREEN}   ✅ Certificado SSL configurado para $BACKEND_DOMAIN${NC}"
            else
                echo -e "${YELLOW}   ⚠️  Erro ao configurar SSL para $BACKEND_DOMAIN${NC}"
            fi
        else
            echo -e "${YELLOW}   ⚠️  Server block para $BACKEND_DOMAIN não encontrado. Pulando...${NC}"
        fi
    fi
    
    # Atualizar .env para usar https
    if [ -f ".env" ]; then
        echo -e "${BLUE}   Atualizando .env para usar HTTPS...${NC}"
        sed -i "s|FRONTEND_DOMAIN=http://|FRONTEND_DOMAIN=https://|g" .env
        sed -i "s|BACKEND_DOMAIN=http://|BACKEND_DOMAIN=https://|g" .env
        sed -i "s|NEXT_PUBLIC_DOMAIN=http://|NEXT_PUBLIC_DOMAIN=https://|g" .env
        sed -i "s|ALLOWED_ORIGINS=http://|ALLOWED_ORIGINS=https://|g" .env
        echo -e "${GREEN}   ✅ .env atualizado${NC}"
    fi
    
    # Validar instalação final
    if [ "$CERTBOT_EXIT" -eq 0 ]; then
        # Configurar renovação automática
        systemctl enable certbot.timer 2>/dev/null || true
        systemctl start certbot.timer 2>/dev/null || true
        
        # Recarregar Nginx
        nginx -t && systemctl reload nginx || {
            echo -e "${YELLOW}   ⚠️  Erro ao recarregar Nginx${NC}"
        }
        
        echo -e "${GREEN}✅ SSL configurado com sucesso!${NC}"
        echo ""
        echo -e "${YELLOW}📝 Próximos passos:${NC}"
        echo "   1. Reinicie a aplicação: pm2 restart all"
        echo "   2. Teste o acesso: https://$FRONTEND_DOMAIN"
        echo "   3. Verifique certificado: sudo certbot certificates"
        echo ""
    else
        echo -e "${YELLOW}⚠️  SSL não foi configurado completamente${NC}"
        echo -e "${YELLOW}   Verifique os erros acima e tente novamente${NC}"
    fi
    
    pause
}

# 9. Criar Usuário Admin
option_create_admin() {
    echo -e "${BLUE}👤 Criar Usuário Admin${NC}"
    echo ""
    check_project_dir
    cd "$PROJECT_DIR"
    load_env
    
    DB_NAME="${DB_NAME:-multivus_loja}"
    
    if [ -z "$DB_NAME" ]; then
        echo -e "${RED}❌ DB_NAME não configurado no .env${NC}"
        pause
        return
    fi
    
    echo -e "${YELLOW}🔐 Gerando hash da senha 'admin123'...${NC}"
    HASH=$(node -e "const bcrypt = require('bcrypt'); console.log(bcrypt.hashSync('admin123', 10));" 2>/dev/null)
    
    if [ -z "$HASH" ]; then
        echo -e "${RED}❌ Erro ao gerar hash${NC}"
        pause
        return
    fi
    
    USER_EXISTS=$(sudo -u postgres psql -d "$DB_NAME" -tAc "SELECT COUNT(*) FROM admin_users WHERE username = 'admin';" 2>/dev/null || echo "0")
    
    if [ "$USER_EXISTS" -gt "0" ]; then
        sudo -u postgres psql -d "$DB_NAME" <<EOF
UPDATE admin_users 
SET password_hash = '$HASH', is_active = true, updated_at = NOW()
WHERE username = 'admin';
EOF
        echo -e "${GREEN}✅ Usuário admin atualizado!${NC}"
    else
        sudo -u postgres psql -d "$DB_NAME" <<EOF
INSERT INTO admin_users (username, email, password_hash, full_name, is_active, created_at, updated_at)
VALUES ('admin', 'admin@multivus.com.br', '$HASH', 'Administrador', true, NOW(), NOW());
EOF
        echo -e "${GREEN}✅ Usuário admin criado!${NC}"
    fi
    
    echo ""
    echo "📝 Credenciais:"
    echo "   Usuário: admin"
    echo "   Senha: admin123"
    pause
}

# 10. Configurar Backup Automático
option_config_backup_cron() {
    echo -e "${BLUE}⏰ Configurar Backup Automático${NC}"
    echo ""
    
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Esta opção requer sudo${NC}"
        pause
        return
    fi
    
    echo "Escolha o horário:"
    echo "  1) 02:00 (recomendado)"
    echo "  2) 03:00"
    echo "  3) 04:00"
    echo "  4) Personalizado"
    read -p "Opção [1-4]: " HOUR_OPTION
    
    case $HOUR_OPTION in
        1) BACKUP_HOUR="2" ;;
        2) BACKUP_HOUR="3" ;;
        3) BACKUP_HOUR="4" ;;
        4)
            read -p "Digite a hora (0-23): " BACKUP_HOUR
            [[ ! "$BACKUP_HOUR" =~ ^[0-9]+$ ]] || [ "$BACKUP_HOUR" -lt 0 ] || [ "$BACKUP_HOUR" -gt 23 ] && {
                echo -e "${RED}❌ Hora inválida!${NC}"
                pause
                return
            }
            ;;
        *)
            echo -e "${RED}❌ Opção inválida!${NC}"
            pause
            return
            ;;
    esac
    
    CRON_JOB="0 $BACKUP_HOUR * * * cd $PROJECT_DIR && bash $SCRIPT_DIR/multivus.sh --backup-completo >> $PROJECT_DIR/logs/backup.log 2>&1"
    
    if crontab -l 2>/dev/null | grep -q "multivus.sh.*backup"; then
        crontab -l 2>/dev/null | grep -v "multivus.sh.*backup" | crontab -
    fi
    
    (crontab -l 2>/dev/null; echo "$CRON_JOB") | crontab -
    mkdir -p "$PROJECT_DIR/logs"
    
    echo -e "${GREEN}✅ Backup automático configurado para ${BACKUP_HOUR}:00${NC}"
    pause
}

# 12. Status do Sistema
option_status() {
    echo -e "${BLUE}📊 Status do Sistema${NC}"
    echo ""
    check_project_dir
    cd "$PROJECT_DIR"
    
    echo -e "${CYAN}🔄 PM2 Status:${NC}"
    if command -v pm2 &> /dev/null; then
        pm2 status 2>/dev/null || echo -e "${YELLOW}   PM2 não está rodando${NC}"
    else
        echo -e "${YELLOW}   PM2 não instalado${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}🌐 Nginx Status:${NC}"
    if command -v nginx &> /dev/null; then
        systemctl is-active --quiet nginx 2>/dev/null && \
            echo -e "${GREEN}   ✅ Nginx está rodando${NC}" || \
            echo -e "${YELLOW}   ⚠️  Nginx não está rodando${NC}"
    else
        echo -e "${YELLOW}   Nginx não instalado${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}🗄️  PostgreSQL Status:${NC}"
    if command -v psql &> /dev/null; then
        systemctl is-active --quiet postgresql 2>/dev/null && \
            echo -e "${GREEN}   ✅ PostgreSQL está rodando${NC}" || \
            echo -e "${YELLOW}   ⚠️  PostgreSQL não está rodando${NC}"
    else
        echo -e "${YELLOW}   PostgreSQL não instalado${NC}"
    fi
    echo ""
    
    echo -e "${CYAN}📦 Node.js:${NC}"
    command -v node &> /dev/null && \
        echo -e "${GREEN}   ✅ $(node --version)${NC}" || \
        echo -e "${YELLOW}   Node.js não instalado${NC}"
    echo ""
    
    echo -e "${CYAN}📂 Diretório:${NC} $PROJECT_DIR"
    echo ""
    
    pause
}

# 13. Documentação
option_docs() {
    echo -e "${BLUE}📚 Documentação${NC}"
    echo ""
    echo "Documentação disponível:"
    echo ""
    echo "  📖 README.md - Documentação principal"
    echo "  📖 docs/INSTALACAO.md - Guia de instalação"
    echo "  📖 docs/DEPLOY.md - Guia de deploy"
    echo "  📖 docs/BACKUP.md - Guia de backup"
    echo ""
    echo "Localização: $PROJECT_DIR"
    echo ""
    pause
}

# 11. Corrigir Problemas de Imagens/Uploads
option_fix_uploads() {
    echo -e "${BLUE}🔧 Corrigir Problemas de Imagens/Uploads${NC}"
    echo ""
    
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Esta opção requer sudo${NC}"
        pause
        return
    fi
    
    check_project_dir
    cd "$PROJECT_DIR"
    load_env
    
    # Verificar e corrigir server block temporário do SSL
    echo -e "${YELLOW}🔍 Verificando server blocks do Nginx...${NC}"
    
    if [ -L "/etc/nginx/sites-enabled/multivus-loja-ssl" ]; then
        echo -e "${YELLOW}   ⚠️  Server block temporário 'multivus-loja-ssl' encontrado${NC}"
        echo -e "${YELLOW}   Removendo server block temporário...${NC}"
        rm -f /etc/nginx/sites-enabled/multivus-loja-ssl
        if [ -f "/etc/nginx/sites-available/multivus-loja-ssl" ]; then
            rm -f /etc/nginx/sites-available/multivus-loja-ssl
        fi
        echo -e "${GREEN}   ✅ Server block temporário removido${NC}"
    fi
    
    # Garantir que o server block principal está ativo
    if [ ! -L "/etc/nginx/sites-enabled/multivus-loja" ]; then
        if [ -f "/etc/nginx/sites-available/multivus-loja" ]; then
            echo -e "${YELLOW}   Ativando server block principal...${NC}"
            ln -sf /etc/nginx/sites-available/multivus-loja /etc/nginx/sites-enabled/multivus-loja
            echo -e "${GREEN}   ✅ Server block principal ativado${NC}"
        fi
    fi
    
    # Recarregar Nginx
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo -e "${GREEN}   ✅ Nginx recarregado${NC}"
    else
        echo -e "${RED}   ❌ Erro na configuração do Nginx${NC}"
        nginx -t
    fi
    
    echo ""
    echo ""
    
    if [ "$EUID" -ne 0 ]; then
        echo -e "${YELLOW}⚠️  Esta opção requer sudo${NC}"
        echo "   Executando com sudo..."
        echo ""
        sudo bash "$SCRIPT_DIR/multivus.sh" --fix-uploads-internal
        pause
        return
    fi
    
    check_project_dir
    cd "$PROJECT_DIR"
    load_env
    
    # Verificar e corrigir server block temporário do SSL
    echo -e "${YELLOW}🔍 Verificando server blocks do Nginx...${NC}"
    
    NGINX_RELOAD_NEEDED=false
    
    if [ -L "/etc/nginx/sites-enabled/multivus-loja-ssl" ]; then
        echo -e "${YELLOW}   ⚠️  Server block temporário 'multivus-loja-ssl' encontrado${NC}"
        echo -e "${YELLOW}   Removendo server block temporário...${NC}"
        rm -f /etc/nginx/sites-enabled/multivus-loja-ssl
        if [ -f "/etc/nginx/sites-available/multivus-loja-ssl" ]; then
            rm -f /etc/nginx/sites-available/multivus-loja-ssl
        fi
        echo -e "${GREEN}   ✅ Server block temporário removido${NC}"
        NGINX_RELOAD_NEEDED=true
    fi
    
    # Garantir que o server block principal está ativo
    if [ ! -L "/etc/nginx/sites-enabled/multivus-loja" ]; then
        if [ -f "/etc/nginx/sites-available/multivus-loja" ]; then
            echo -e "${YELLOW}   Ativando server block principal...${NC}"
            ln -sf /etc/nginx/sites-available/multivus-loja /etc/nginx/sites-enabled/multivus-loja
            echo -e "${GREEN}   ✅ Server block principal ativado${NC}"
            NGINX_RELOAD_NEEDED=true
        fi
    fi
    
    # Recarregar Nginx se houver mudanças
    if [ "$NGINX_RELOAD_NEEDED" = true ]; then
        if nginx -t 2>/dev/null; then
            systemctl reload nginx
            echo -e "${GREEN}   ✅ Nginx recarregado${NC}"
        else
            echo -e "${RED}   ❌ Erro na configuração do Nginx${NC}"
            nginx -t
        fi
    else
        echo -e "${GREEN}   ✅ Server blocks estão corretos${NC}"
    fi
    
    echo ""
    
    UPLOADS_DIR="$PROJECT_DIR/public/uploads"
    APP_DIR="${APP_DIR:-/home/deploy/LojaMultivus}"
    
    echo -e "${YELLOW}🔍 Diagnosticando problemas...${NC}"
    echo ""
    
    # 1. Verificar se o diretório existe
    echo -e "${CYAN}1. Verificando diretório de uploads...${NC}"
    if [ ! -d "$UPLOADS_DIR" ]; then
        echo -e "${YELLOW}   ⚠️  Diretório não existe, criando...${NC}"
        mkdir -p "$UPLOADS_DIR"
        echo -e "${GREEN}   ✅ Diretório criado${NC}"
    else
        echo -e "${GREEN}   ✅ Diretório existe: $UPLOADS_DIR${NC}"
    fi
    
    # 2. Verificar e corrigir permissões
    echo -e "${CYAN}2. Verificando permissões...${NC}"
    
    # Descobrir usuário do sistema
    if [ -f ".env" ]; then
        SYSTEM_USER=$(stat -c '%U' "$PROJECT_DIR" 2>/dev/null || echo "deploy")
    else
        SYSTEM_USER="deploy"
    fi
    
    # Se não conseguir detectar, tentar pelo diretório
    if [ "$SYSTEM_USER" = "root" ] || [ -z "$SYSTEM_USER" ]; then
        if [ -d "/home/deploy" ]; then
            SYSTEM_USER="deploy"
        else
            SYSTEM_USER=$(whoami)
        fi
    fi
    
    echo -e "${YELLOW}   Usuário detectado: $SYSTEM_USER${NC}"
    
    # Corrigir permissões do diretório
    chown -R "$SYSTEM_USER:$SYSTEM_USER" "$UPLOADS_DIR" 2>/dev/null || {
        echo -e "${YELLOW}   ⚠️  Não foi possível alterar owner, continuando...${NC}"
    }
    chmod -R 755 "$UPLOADS_DIR" 2>/dev/null || {
        echo -e "${YELLOW}   ⚠️  Não foi possível alterar permissões, continuando...${NC}"
    }
    
    # Garantir que o Nginx pode ler
    chmod 755 "$UPLOADS_DIR" 2>/dev/null || true
    find "$UPLOADS_DIR" -type f -exec chmod 644 {} \; 2>/dev/null || true
    find "$UPLOADS_DIR" -type d -exec chmod 755 {} \; 2>/dev/null || true
    
    echo -e "${GREEN}   ✅ Permissões corrigidas${NC}"
    
    # 3. Verificar configuração do Nginx
    echo -e "${CYAN}3. Verificando configuração do Nginx...${NC}"
    
    NGINX_CONFIG="/etc/nginx/sites-available/multivus-loja"
    
    if [ ! -f "$NGINX_CONFIG" ]; then
        echo -e "${YELLOW}   ⚠️  Configuração do Nginx não encontrada em $NGINX_CONFIG${NC}"
        echo -e "${YELLOW}   Verificando outras configurações...${NC}"
        
        # Procurar outras configurações
        NGINX_CONFIG=$(find /etc/nginx/sites-available -name "*multivus*" -o -name "*loja*" 2>/dev/null | head -1)
        
        if [ -z "$NGINX_CONFIG" ]; then
            echo -e "${RED}   ❌ Nenhuma configuração do Nginx encontrada!${NC}"
            echo -e "${YELLOW}   Execute a instalação completa primeiro${NC}"
            pause
            return
        fi
    fi
    
    echo -e "${GREEN}   ✅ Configuração encontrada: $NGINX_CONFIG${NC}"
    
    # Verificar se tem location /uploads
    if grep -q "location /uploads" "$NGINX_CONFIG"; then
        echo -e "${GREEN}   ✅ Location /uploads encontrada${NC}"
        
        # Verificar se o caminho está correto
        CURRENT_ALIAS=$(grep -A 1 "location /uploads" "$NGINX_CONFIG" | grep "alias" | awk '{print $2}' | tr -d ';')
        
        if [ -n "$CURRENT_ALIAS" ]; then
            echo -e "${YELLOW}   Caminho atual: $CURRENT_ALIAS${NC}"
            echo -e "${YELLOW}   Caminho esperado: $UPLOADS_DIR/${NC}"
            
            if [ "$CURRENT_ALIAS" != "$UPLOADS_DIR/" ] && [ "$CURRENT_ALIAS" != "$UPLOADS_DIR" ]; then
                echo -e "${YELLOW}   ⚠️  Caminho incorreto!${NC}"
                read -p "   Deseja corrigir? (S/n): " FIX_PATH
                
                if [[ ! $FIX_PATH =~ ^[Nn]$ ]]; then
                    # Fazer backup
                    cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
                    
                    # Corrigir caminho
                    sed -i "s|alias $CURRENT_ALIAS|alias $UPLOADS_DIR/|g" "$NGINX_CONFIG"
                    echo -e "${GREEN}   ✅ Caminho corrigido${NC}"
                    
                    # Testar configuração
                    if nginx -t 2>/dev/null; then
                        systemctl reload nginx
                        echo -e "${GREEN}   ✅ Nginx recarregado${NC}"
                    else
                        echo -e "${RED}   ❌ Erro na configuração do Nginx!${NC}"
                        echo -e "${YELLOW}   Restaurando backup...${NC}"
                        mv "$NGINX_CONFIG.backup."* "$NGINX_CONFIG" 2>/dev/null || true
                    fi
                fi
            else
                echo -e "${GREEN}   ✅ Caminho está correto${NC}"
            fi
        fi
    else
        echo -e "${YELLOW}   ⚠️  Location /uploads não encontrada!${NC}"
        read -p "   Deseja adicionar? (S/n): " ADD_LOCATION
        
        if [[ ! $ADD_LOCATION =~ ^[Nn]$ ]]; then
            # Fazer backup
            cp "$NGINX_CONFIG" "$NGINX_CONFIG.backup.$(date +%Y%m%d_%H%M%S)"
            
            # Adicionar location /uploads antes do location /
            sed -i '/location \/ {/i\    location /uploads {\n        alias '"$UPLOADS_DIR"'/;\n        autoindex off;\n        expires 30d;\n        add_header Cache-Control "public";\n        access_log off;\n        \n        location ~* \.(php|phtml|phar|pl|py|jsp|asp|cgi|sh|bash|exe|dll|bin)$ {\n            deny all;\n            return 403;\n        }\n    }\n' "$NGINX_CONFIG"
            
            # Testar e recarregar
            if nginx -t 2>/dev/null; then
                systemctl reload nginx
                echo -e "${GREEN}   ✅ Location /uploads adicionada e Nginx recarregado${NC}"
            else
                echo -e "${RED}   ❌ Erro na configuração!${NC}"
                mv "$NGINX_CONFIG.backup."* "$NGINX_CONFIG" 2>/dev/null || true
            fi
        fi
    fi
    
    # 4. Verificar se o Nginx está rodando
    echo -e "${CYAN}4. Verificando status do Nginx...${NC}"
    if systemctl is-active --quiet nginx 2>/dev/null; then
        echo -e "${GREEN}   ✅ Nginx está rodando${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Nginx não está rodando, iniciando...${NC}"
        systemctl start nginx
        echo -e "${GREEN}   ✅ Nginx iniciado${NC}"
    fi
    
    # 5. Verificar um arquivo específico
    echo -e "${CYAN}5. Testando acesso a arquivos...${NC}"
    
    # Listar alguns arquivos para teste
    TEST_FILES=$(find "$UPLOADS_DIR" -type f -name "*.png" -o -name "*.jpg" -o -name "*.jpeg" -o -name "*.webp" 2>/dev/null | head -3)
    
    if [ -n "$TEST_FILES" ]; then
        echo -e "${GREEN}   ✅ Arquivos encontrados para teste${NC}"
        for file in $TEST_FILES; do
            filename=$(basename "$file")
            if [ -r "$file" ]; then
                echo -e "${GREEN}   ✅ $filename - legível${NC}"
            else
                echo -e "${RED}   ❌ $filename - NÃO legível${NC}"
            fi
        done
    else
        echo -e "${YELLOW}   ⚠️  Nenhum arquivo de imagem encontrado para teste${NC}"
    fi
    
    # Resumo final
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo -e "${GREEN}✅ Diagnóstico concluído!${NC}"
    echo -e "${GREEN}═══════════════════════════════════════${NC}"
    echo ""
    echo -e "${YELLOW}📝 Próximos passos:${NC}"
    echo "   1. Teste acessar uma imagem: https://multivus.com.br/uploads/NOME_DO_ARQUIVO.png"
    echo "   2. Verifique os logs do Nginx: sudo tail -f /var/log/nginx/error.log"
    echo "   3. Se ainda houver problemas, verifique:"
    echo "      - Permissões do diretório: ls -la $UPLOADS_DIR"
    echo "      - Configuração do Nginx: sudo nginx -t"
    echo "      - Logs do Nginx: sudo tail -f /var/log/nginx/error.log"
    echo ""
    
    pause
}

# 14. Desinstalar Sistema
option_uninstall() {
    echo -e "${RED}🗑️  Desinstalar Sistema MULTIVUS${NC}"
    echo ""
    
    if [ "$EUID" -ne 0 ]; then
        echo -e "${RED}❌ Esta opção requer sudo${NC}"
        echo "   Execute: sudo bash $0"
        pause
        return
    fi
    
    echo -e "${RED}⚠️  ATENÇÃO: Esta operação irá remover o sistema MULTIVUS!${NC}"
    echo ""
    echo -e "${YELLOW}O que será removido:${NC}"
    echo "  - Processos PM2 (loja-frontend, loja-backend)"
    echo "  - Configurações do Nginx"
    echo "  - Certificados SSL (opcional)"
    echo "  - Banco de dados (opcional)"
    echo "  - Diretório da aplicação (opcional)"
    echo "  - Usuário do sistema (opcional)"
    echo "  - Cron jobs de backup"
    echo "  - Backups (opcional)"
    echo ""
    
    read -p "Tem CERTEZA que deseja continuar? Digite 'DESINSTALAR' para confirmar: " CONFIRM
    if [ "$CONFIRM" != "DESINSTALAR" ]; then
        echo -e "${YELLOW}Operação cancelada.${NC}"
        pause
        return
    fi
    
    echo ""
    echo -e "${YELLOW}🔍 Detectando instalação...${NC}"
    
    # Detectar diretório da aplicação
    APP_DIR=""
    SYSTEM_USER=""
    
    # Tentar detectar do .env se estiver no diretório do projeto
    if [ -f "$PROJECT_DIR/.env" ]; then
        cd "$PROJECT_DIR"
        load_env
        APP_DIR="${APP_DIR:-$PROJECT_DIR}"
    else
        # Tentar detectar diretórios comuns
        if [ -d "/home/deploy/LojaMultivus" ]; then
            APP_DIR="/home/deploy/LojaMultivus"
            SYSTEM_USER="deploy"
        elif [ -d "/opt/multivus" ]; then
            APP_DIR="/opt/multivus"
            SYSTEM_USER="multivus"
        else
            read -p "Digite o diretório da aplicação (ou Enter para pular): " APP_DIR_INPUT
            APP_DIR="$APP_DIR_INPUT"
        fi
    fi
    
    if [ -n "$APP_DIR" ] && [ -d "$APP_DIR" ]; then
        echo -e "${GREEN}   ✅ Diretório detectado: $APP_DIR${NC}"
        if [ -z "$SYSTEM_USER" ]; then
            SYSTEM_USER=$(stat -c '%U' "$APP_DIR" 2>/dev/null || echo "deploy")
        fi
    else
        echo -e "${YELLOW}   ⚠️  Diretório da aplicação não detectado${NC}"
        read -p "Digite o diretório da aplicação (ou Enter para pular): " APP_DIR_INPUT
        APP_DIR="$APP_DIR_INPUT"
    fi
    
    echo ""
    
    # 1. Parar e remover processos PM2
    echo -e "${CYAN}1. Parando processos PM2...${NC}"
    if command_exists pm2; then
        # Parar processos
        if [ -n "$APP_DIR" ] && [ -d "$APP_DIR" ]; then
            cd "$APP_DIR"
            if [ -f "ecosystem.config.js" ]; then
                sudo -u "$SYSTEM_USER" pm2 delete ecosystem.config.js 2>/dev/null || true
            fi
        fi
        
        # Remover processos individuais
        sudo -u "$SYSTEM_USER" pm2 delete loja-frontend 2>/dev/null || true
        sudo -u "$SYSTEM_USER" pm2 delete loja-backend 2>/dev/null || true
        sudo -u "$SYSTEM_USER" pm2 save 2>/dev/null || true
        
        echo -e "${GREEN}   ✅ Processos PM2 removidos${NC}"
    else
        echo -e "${YELLOW}   ⚠️  PM2 não encontrado${NC}"
    fi
    
    # 2. Remover configurações do Nginx
    echo ""
    echo -e "${CYAN}2. Removendo configurações do Nginx...${NC}"
    
    # Remover server blocks
    rm -f /etc/nginx/sites-enabled/multivus-loja
    rm -f /etc/nginx/sites-enabled/multivus-api
    rm -f /etc/nginx/sites-enabled/multivus-loja-ssl
    rm -f /etc/nginx/sites-available/multivus-loja
    rm -f /etc/nginx/sites-available/multivus-api
    rm -f /etc/nginx/sites-available/multivus-loja-ssl
    
    # Testar e recarregar Nginx
    if nginx -t 2>/dev/null; then
        systemctl reload nginx
        echo -e "${GREEN}   ✅ Configurações do Nginx removidas${NC}"
    else
        echo -e "${YELLOW}   ⚠️  Erro ao testar Nginx, mas configurações removidas${NC}"
    fi
    
    # 3. Remover certificados SSL (opcional)
    echo ""
    read -p "Deseja remover certificados SSL do Let's Encrypt? (s/N): " REMOVE_SSL
    if [[ $REMOVE_SSL =~ ^[Ss]$ ]]; then
        echo -e "${CYAN}3. Removendo certificados SSL...${NC}"
        
        if command_exists certbot; then
            # Listar certificados
            CERTBOT_CERTS=$(certbot certificates 2>/dev/null | grep "Certificate Name" | awk '{print $3}' || echo "")
            
            if [ -n "$CERTBOT_CERTS" ]; then
                echo "$CERTBOT_CERTS" | while read -r cert_name; do
                    if [ -n "$cert_name" ]; then
                        echo -e "${YELLOW}   Removendo certificado: $cert_name${NC}"
                        certbot delete --cert-name "$cert_name" --non-interactive 2>/dev/null || true
                    fi
                done
            fi
            
            echo -e "${GREEN}   ✅ Certificados SSL removidos${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Certbot não encontrado${NC}"
        fi
    else
        echo -e "${YELLOW}3. Certificados SSL mantidos${NC}"
    fi
    
    # 4. Remover banco de dados (opcional)
    echo ""
    read -p "Deseja remover o banco de dados? (n/S): " REMOVE_DB
    REMOVE_DB=${REMOVE_DB:-n}
    
    if [[ $REMOVE_DB =~ ^[Ss]$ ]]; then
        echo -e "${CYAN}4. Removendo banco de dados...${NC}"
        
        if [ -f "$APP_DIR/.env" ]; then
            cd "$APP_DIR"
            load_env
        fi
        
        DB_NAME="${DB_NAME:-multivus_loja}"
        DB_USER="${DB_USER:-multivus_user}"
        
        if [ -n "$DB_NAME" ]; then
            echo -e "${YELLOW}   Removendo banco: $DB_NAME${NC}"
            sudo -u postgres psql -c "DROP DATABASE IF EXISTS $DB_NAME;" 2>/dev/null || true
            
            read -p "Deseja remover o usuário do banco ($DB_USER)? (n/S): " REMOVE_DB_USER
            REMOVE_DB_USER=${REMOVE_DB_USER:-n}
            if [[ $REMOVE_DB_USER =~ ^[Ss]$ ]]; then
                sudo -u postgres psql -c "DROP USER IF EXISTS $DB_USER;" 2>/dev/null || true
                echo -e "${GREEN}   ✅ Usuário do banco removido${NC}"
            fi
            
            echo -e "${GREEN}   ✅ Banco de dados removido${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Nome do banco não detectado${NC}"
        fi
    else
        echo -e "${YELLOW}4. Banco de dados mantido${NC}"
    fi
    
    # 5. Remover cron jobs
    echo ""
    echo -e "${CYAN}5. Removendo cron jobs...${NC}"
    
    if [ -n "$SYSTEM_USER" ]; then
        # Remover crontabs do usuário
        sudo -u "$SYSTEM_USER" crontab -l 2>/dev/null | grep -v "multivus\|backup" | sudo -u "$SYSTEM_USER" crontab - 2>/dev/null || true
        sudo -u "$SYSTEM_USER" crontab -r 2>/dev/null || true
    fi
    
    # Remover crontabs do root
    crontab -l 2>/dev/null | grep -v "multivus\|backup" | crontab - 2>/dev/null || true
    
    echo -e "${GREEN}   ✅ Cron jobs removidos${NC}"
    
    # 6. Remover backups (opcional)
    echo ""
    read -p "Deseja remover os backups? (n/S): " REMOVE_BACKUPS
    REMOVE_BACKUPS=${REMOVE_BACKUPS:-n}
    
    if [[ $REMOVE_BACKUPS =~ ^[Ss]$ ]]; then
        echo -e "${CYAN}6. Removendo backups...${NC}"
        
        if [ -n "$APP_DIR" ] && [ -d "$APP_DIR/backups" ]; then
            rm -rf "$APP_DIR/backups"
            echo -e "${GREEN}   ✅ Backups removidos${NC}"
        else
            echo -e "${YELLOW}   ⚠️  Diretório de backups não encontrado${NC}"
        fi
    else
        echo -e "${YELLOW}6. Backups mantidos${NC}"
    fi
    
    # 7. Remover diretório da aplicação (opcional)
    echo ""
    read -p "Deseja remover o diretório da aplicação ($APP_DIR)? (n/S): " REMOVE_DIR
    REMOVE_DIR=${REMOVE_DIR:-n}
    
    if [[ $REMOVE_DIR =~ ^[Ss]$ ]] && [ -n "$APP_DIR" ] && [ -d "$APP_DIR" ]; then
        echo -e "${CYAN}7. Removendo diretório da aplicação...${NC}"
        echo -e "${RED}   ⚠️  ATENÇÃO: Todos os arquivos serão removidos!${NC}"
        read -p "Confirme digitando 'REMOVER': " CONFIRM_REMOVE
        if [ "$CONFIRM_REMOVE" = "REMOVER" ]; then
            rm -rf "$APP_DIR"
            echo -e "${GREEN}   ✅ Diretório removido${NC}"
        else
            echo -e "${YELLOW}   Operação cancelada${NC}"
        fi
    else
        echo -e "${YELLOW}7. Diretório da aplicação mantido${NC}"
    fi
    
    # 8. Remover usuário do sistema (opcional)
    echo ""
    if [ -n "$SYSTEM_USER" ] && [ "$SYSTEM_USER" != "root" ] && id "$SYSTEM_USER" &>/dev/null; then
        read -p "Deseja remover o usuário do sistema ($SYSTEM_USER)? (n/S): " REMOVE_USER
        REMOVE_USER=${REMOVE_USER:-n}
        
        if [[ $REMOVE_USER =~ ^[Ss]$ ]]; then
            echo -e "${CYAN}8. Removendo usuário do sistema...${NC}"
            
            # Verificar se o usuário tem processos rodando
            if pgrep -u "$SYSTEM_USER" > /dev/null 2>&1; then
                echo -e "${YELLOW}   ⚠️  Usuário tem processos rodando. Matando processos...${NC}"
                pkill -u "$SYSTEM_USER" 2>/dev/null || true
                sleep 2
            fi
            
            # Remover usuário e diretório home
            userdel -r "$SYSTEM_USER" 2>/dev/null || {
                echo -e "${YELLOW}   ⚠️  Não foi possível remover o usuário automaticamente${NC}"
                echo -e "${YELLOW}   Remova manualmente com: sudo userdel -r $SYSTEM_USER${NC}"
            }
            
            echo -e "${GREEN}   ✅ Usuário removido${NC}"
        else
            echo -e "${YELLOW}8. Usuário do sistema mantido${NC}"
        fi
    else
        echo -e "${YELLOW}8. Usuário do sistema não detectado ou é root${NC}"
    fi
    
    # 9. Remover logs do sistema
    echo ""
    echo -e "${CYAN}9. Limpando logs...${NC}"
    
    if [ -n "$APP_DIR" ] && [ -d "$APP_DIR/logs" ]; then
        rm -rf "$APP_DIR/logs"
        echo -e "${GREEN}   ✅ Logs removidos${NC}"
    fi
    
    # Resumo final
    echo ""
    echo -e "${GREEN}=========================================="
    echo "  ✅ DESINSTALAÇÃO CONCLUÍDA!"
    echo "==========================================${NC}"
    echo ""
    echo -e "${YELLOW}📝 O que foi removido:${NC}"
    echo "  ✅ Processos PM2"
    echo "  ✅ Configurações do Nginx"
    if [[ $REMOVE_SSL =~ ^[Ss]$ ]]; then
        echo "  ✅ Certificados SSL"
    fi
    if [[ $REMOVE_DB =~ ^[Ss]$ ]]; then
        echo "  ✅ Banco de dados"
    fi
    echo "  ✅ Cron jobs"
    if [[ $REMOVE_BACKUPS =~ ^[Ss]$ ]]; then
        echo "  ✅ Backups"
    fi
    if [[ $REMOVE_DIR =~ ^[Ss]$ ]]; then
        echo "  ✅ Diretório da aplicação"
    fi
    if [[ $REMOVE_USER =~ ^[Ss]$ ]]; then
        echo "  ✅ Usuário do sistema"
    fi
    echo ""
    echo -e "${YELLOW}📝 O que foi mantido:${NC}"
    if [[ ! $REMOVE_SSL =~ ^[Ss]$ ]]; then
        echo "  ⚠️  Certificados SSL (remova manualmente se necessário)"
    fi
    if [[ ! $REMOVE_DB =~ ^[Ss]$ ]]; then
        echo "  ⚠️  Banco de dados (remova manualmente se necessário)"
    fi
    if [[ ! $REMOVE_BACKUPS =~ ^[Ss]$ ]]; then
        echo "  ⚠️  Backups (remova manualmente se necessário)"
    fi
    if [[ ! $REMOVE_DIR =~ ^[Ss]$ ]]; then
        echo "  ⚠️  Diretório da aplicação: $APP_DIR"
    fi
    if [[ ! $REMOVE_USER =~ ^[Ss]$ ]]; then
        echo "  ⚠️  Usuário do sistema: $SYSTEM_USER"
    fi
    echo ""
    echo -e "${BLUE}💡 Para reinstalar, execute:${NC}"
    echo "   sudo bash scripts/multivus.sh"
    echo "   Escolha opção 1: Instalação Completa"
    echo ""
    
    pause
}

# Processar argumentos de linha de comando
if [ "$1" = "--backup-completo" ]; then
    check_project_dir
    cd "$PROJECT_DIR"
    option_backup_completo
    exit 0
fi

if [ "$1" = "--fix-uploads-internal" ]; then
    check_project_dir
    cd "$PROJECT_DIR"
    option_fix_uploads
    exit 0
fi

# ============================================
# LOOP PRINCIPAL
# ============================================

while true; do
    show_menu
    read -r OPTION
    
    case $OPTION in
        1) option_install ;;
        15) option_install_docker ;;
        16) option_ports_info ;;
        2) option_deploy ;;
        3) option_check_changes ;;
        4) option_backup_database ;;
        5) option_backup_completo ;;
        6) option_list_backups ;;
        7) option_restore_backup ;;
        8) option_config_ssl ;;
        9) option_create_admin ;;
        10) option_config_backup_cron ;;
        11) option_fix_uploads ;;
        12) option_status ;;
        13) option_docs ;;
        14) option_uninstall ;;
        0)
            echo -e "${GREEN}👋 Até logo!${NC}"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Opção inválida!${NC}"
            sleep 1
            ;;
    esac
done
