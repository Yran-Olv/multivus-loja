module.exports = {
  apps: [
    {
      name: 'loja-frontend',
      version: '1.0.0',
      
      // Script e diretório
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/LojaMultivus',
      
      // 🔥 FORK MODE (recomendado para Next.js)
      exec_mode: 'fork',
      instances: 1,
      
      // Ambiente de desenvolvimento
      env: {
        NODE_ENV: 'development',
        PORT: 3255,
        FRONTEND_PORT: 3255,
      },
      
      // Ambiente de produção
      env_production: {
        NODE_ENV: 'production',
        PORT: 3255  ,
        FRONTEND_PORT: 3255,
      },
      
      // 🔄 Restart e estabilidade
      autorestart: true,
      watch: false,
      max_memory_restart: '1536M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      
      // 📊 Monitoramento e logs
      error_file: '/home/deploy/LojaMultivus/logs/pm2-frontend-error.log',
      out_file: '/home/deploy/LojaMultivus/logs/pm2-frontend-out.log',
      log_file: '/home/deploy/LojaMultivus/logs/pm2-frontend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 🛡️ Segurança e performance
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      
      // 📈 Métricas e monitoramento
      pmx: true,
      instance_var: 'INSTANCE_ID',
      
      // 🔧 Configurações avançadas
      source_map_support: true,
      
      // 📝 Ignorar arquivos no watch
      ignore_watch: [
        'node_modules',
        'logs',
        '.next',
        '.git',
        '*.log',
        '*.tmp',
      ],
    },
    {
      name: 'loja-backend',
      version: '1.0.0',
      
      // Script e diretório
      script: 'npm',
      args: 'start',
      cwd: '/home/deploy/LojaMultivus',
      
      // 🔥 FORK MODE
      exec_mode: 'fork',
      instances: 1,
      
      // Ambiente de desenvolvimento
      env: {
        NODE_ENV: 'development',
        PORT: 3256,
        BACKEND_PORT: 3256,
      },
      
      // Ambiente de produção
      env_production: {
        NODE_ENV: 'production',
        PORT: 3256,
        BACKEND_PORT: 3256,
      },
      
      // 🔄 Restart e estabilidade
      autorestart: true,
      watch: false,
      max_memory_restart: '1536M',
      min_uptime: '10s',
      max_restarts: 10,
      restart_delay: 4000,
      exp_backoff_restart_delay: 100,
      
      // 📊 Monitoramento e logs
      error_file: '/home/deploy/LojaMultivus/logs/pm2-backend-error.log',
      out_file: '/home/deploy/LojaMultivus/logs/pm2-backend-out.log',
      log_file: '/home/deploy/LojaMultivus/logs/pm2-backend-combined.log',
      time: true,
      merge_logs: true,
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      
      // 🛡️ Segurança e performance
      kill_timeout: 5000,
      listen_timeout: 10000,
      shutdown_with_message: true,
      
      // 📈 Métricas e monitoramento
      pmx: true,
      instance_var: 'INSTANCE_ID',
      
      // 🔧 Configurações avançadas
      source_map_support: true,
      
      // 📝 Ignorar arquivos no watch
      ignore_watch: [
        'node_modules',
        'logs',
        '.next',
        '.git',
        '*.log',
        '*.tmp',
      ],
    },
  ],
};

