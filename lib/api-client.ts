/**
 * Cliente de API - Centraliza chamadas para o backend
 * Suporta domínios diferentes para frontend e backend
 */

/**
 * Obtém a URL base da API
 * Se BACKEND_DOMAIN estiver configurado, usa ele
 * Caso contrário, usa caminho relativo (mesmo domínio)
 */
export function getApiUrl(path: string = ''): string {
  // Remover barra inicial se existir
  const cleanPath = path.startsWith('/') ? path.slice(1) : path
  
  // Se BACKEND_DOMAIN estiver configurado, usar ele
  if (typeof window !== 'undefined') {
    // Cliente (browser)
    const backendDomain = process.env.NEXT_PUBLIC_BACKEND_DOMAIN
    if (backendDomain) {
      // Se o path já começa com /api, não adicionar novamente
      const apiPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`
      return `${backendDomain}/${apiPath}`
    }
  } else {
    // Servidor (SSR)
    const backendDomain = process.env.BACKEND_DOMAIN
    if (backendDomain) {
      // Se o path já começa com /api, não adicionar novamente
      const apiPath = cleanPath.startsWith('api/') ? cleanPath : `api/${cleanPath}`
      return `${backendDomain}/${apiPath}`
    }
  }
  
  // Fallback: usar caminho relativo (mesmo domínio)
  return `/api${cleanPath ? `/${cleanPath}` : ''}`
}

/**
 * Faz uma requisição para a API
 */
export async function apiRequest<T = any>(
  path: string,
  options: RequestInit = {}
): Promise<T> {
  const url = getApiUrl(path)
  
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    credentials: 'include', // Incluir cookies
  })
  
  if (!response.ok) {
    const error = await response.json().catch(() => ({ error: 'Erro desconhecido' }))
    throw new Error(error.error || `HTTP ${response.status}`)
  }
  
  return response.json()
}

/**
 * GET request
 */
export async function apiGet<T = any>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'GET' })
}

/**
 * POST request
 */
export async function apiPost<T = any>(path: string, data?: any): Promise<T> {
  return apiRequest<T>(path, {
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PUT request
 */
export async function apiPut<T = any>(path: string, data?: any): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * PATCH request
 */
export async function apiPatch<T = any>(path: string, data?: any): Promise<T> {
  return apiRequest<T>(path, {
    method: 'PATCH',
    body: data ? JSON.stringify(data) : undefined,
  })
}

/**
 * DELETE request
 */
export async function apiDelete<T = any>(path: string): Promise<T> {
  return apiRequest<T>(path, { method: 'DELETE' })
}

