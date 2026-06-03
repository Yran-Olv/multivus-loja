/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Em produção, é recomendado corrigir erros TypeScript
    // Se necessário temporariamente, pode usar ignoreBuildErrors: true
    ignoreBuildErrors: process.env.NODE_ENV === 'production' ? false : true,
  },
  images: {
    unoptimized: true,
    // Domínios permitidos para imagens externas
    remotePatterns: process.env.ALLOWED_IMAGE_DOMAINS
      ? process.env.ALLOWED_IMAGE_DOMAINS.split(',').map(domain => ({
          protocol: 'https',
          hostname: domain.trim(),
        }))
      : [
          { protocol: 'https', hostname: '**' }, // Em desenvolvimento, permitir qualquer domínio
        ],
  },
  // Configurações para produção
  output: 'standalone', // Otimiza o build para produção
  poweredByHeader: false, // Remove header X-Powered-By por segurança
  compress: true, // Habilita compressão gzip
  // Suporte a múltiplos domínios
  async headers() {
    const isProduction = process.env.NODE_ENV === 'production'
    
    // Content Security Policy
    // Nota: 'unsafe-inline' e 'unsafe-eval' são necessários para Next.js
    // Em produção, considere usar nonces ou hashes para scripts inline
    const csp = [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://static.cloudflareinsights.com", // Next.js + Cloudflare Web Analytics
      "style-src 'self' 'unsafe-inline'", // Necessário para Tailwind CSS
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https:",
      "frame-ancestors 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "upgrade-insecure-requests", // Força HTTPS em produção
    ].join('; ')

    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'geolocation=(), microphone=(), camera=()',
          },
          ...(isProduction
            ? [
                {
                  key: 'Strict-Transport-Security',
                  value: 'max-age=31536000; includeSubDomains; preload',
                },
                {
                  key: 'Content-Security-Policy',
                  value: csp,
                },
              ]
            : []),
        ],
      },
    ]
  },
  // Configuração de rewrites para mapear rotas públicas /api/* para /admin/api/*
  // Isso permite que o frontend chame /api/* mas as rotas estejam em /app/admin/api/*
  async rewrites() {
    return [
      // Mapear rotas públicas de API para rotas admin
      {
        source: '/api/service-requests/:path*',
        destination: '/admin/api/service-requests/:path*',
      },
      {
        source: '/api/software-request',
        destination: '/admin/api/software-request',
      },
      {
        source: '/api/contact/:path*',
        destination: '/admin/api/contact/:path*',
      },
      {
        source: '/api/chat',
        destination: '/admin/api/chat',
      },
      {
        source: '/api/search',
        destination: '/admin/api/search',
      },
      {
        source: '/api/orders/:path*',
        destination: '/admin/api/orders/:path*',
      },
      {
        source: '/api/reviews',
        destination: '/admin/api/reviews',
      },
      {
        source: '/api/efi/:path*',
        destination: '/admin/api/efi/:path*',
      },
      {
        source: '/api/stripe/:path*',
        destination: '/admin/api/stripe/:path*',
      },
      // Rotas de autenticação de clientes
      {
        source: '/api/customers/auth/:path*',
        destination: '/admin/api/customers/auth/:path*',
      },
      // Rotas de clientes
      {
        source: '/api/customers/:path*',
        destination: '/admin/api/customers/:path*',
      },
      // Rotas de WhatsApp (para teste e envio manual)
      {
        source: '/api/whatsapp/:path*',
        destination: '/admin/api/whatsapp/:path*',
      },
      {
        source: '/api/whatsapp-config',
        destination: '/admin/api/whatsapp-config',
      },
      // Rotas de blog
      {
        source: '/api/blog/posts/:path*',
        destination: '/admin/api/blog/posts/:path*',
      },
      {
        source: '/api/blog/posts',
        destination: '/admin/api/blog/posts',
      },
      // Rotas de configuração
      {
        source: '/api/efi-config',
        destination: '/admin/api/efi-config',
      },
    ]
  },
}

export default nextConfig
