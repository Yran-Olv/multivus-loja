# Script para iniciar em modo produção no Windows

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  MULTIVUS - Modo Producao (Windows)" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Verificar se .env existe
if (-not (Test-Path .env)) {
    Write-Host "AVISO: Arquivo .env nao encontrado!" -ForegroundColor Yellow
    Write-Host "Criando .env com valores minimos para teste..." -ForegroundColor Yellow
    
    $envContent = @"
# Server
NODE_ENV=production
BACKEND_PORT=3001

# Frontend
FRONTEND_DOMAIN=http://localhost:3000

# Database (PostgreSQL)
DB_HOST=localhost
DB_PORT=5432
DB_NAME=multivus_db
DB_USER=postgres
DB_PASSWORD=postgres

# JWT (OBRIGATÓRIO para autenticação)
JWT_SECRET=multivus-secret-key-minimo-32-caracteres-para-producao-2025

# Email (Resend) - Opcional para testes
RESEND_API_KEY=
EMAIL_FROM=noreply@multivus.com.br

# Stripe (Opcional - Para testes)
STRIPE_SECRET_KEY=
STRIPE_PUBLISHABLE_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Algolia (Opcional)
ALGOLIA_APP_ID=
ALGOLIA_API_KEY=
NEXT_PUBLIC_ALGOLIA_APP_ID=
NEXT_PUBLIC_ALGOLIA_SEARCH_KEY=

# Google Analytics (Opcional)
NEXT_PUBLIC_GA_ID=
"@
    $envContent | Out-File -FilePath .env -Encoding utf8
    Write-Host "Arquivo .env criado! Por favor, edite com seus dados reais." -ForegroundColor Green
    Write-Host ""
}

# Verificar se node_modules existe
if (-not (Test-Path node_modules)) {
    Write-Host "Instalando dependencias..." -ForegroundColor Yellow
    npm install
    Write-Host ""
}

# Executar migrations
Write-Host "Executando migrations do banco de dados..." -ForegroundColor Yellow
npm run db:migrate
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao executar migrations!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Executar seeds (opcional)
Write-Host "Executando seeds do banco de dados..." -ForegroundColor Yellow
npm run db:seed
Write-Host ""

# Build do projeto
Write-Host "Construindo projeto para producao..." -ForegroundColor Yellow
npm run build
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERRO: Falha ao construir projeto!" -ForegroundColor Red
    exit 1
}
Write-Host ""

# Iniciar em modo produção
Write-Host "========================================" -ForegroundColor Green
Write-Host "  Iniciando servidor em modo producao" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "Servidor rodando em: http://localhost:3000" -ForegroundColor Cyan
Write-Host "Admin em: http://localhost:3000/admin/login" -ForegroundColor Cyan
Write-Host ""
Write-Host "Credenciais padrao:" -ForegroundColor Yellow
Write-Host "  Usuario: admin" -ForegroundColor Yellow
Write-Host "  Senha: admin123" -ForegroundColor Yellow
Write-Host ""
Write-Host "Pressione Ctrl+C para parar o servidor" -ForegroundColor Gray
Write-Host ""

# Iniciar servidor
$env:NODE_ENV = "production"
npm start

