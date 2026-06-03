"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle, Loader2 } from "lucide-react"
import Link from "next/link"

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [username, setUsername] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)
  
  // Garantir que 'from' seja sempre uma rota admin válida
  const fromParam = searchParams?.get("from") || null
  const from = fromParam && fromParam.startsWith("/admin") ? fromParam : "/admin/dashboard"

  useEffect(() => {
    // Verificar se já está autenticado (silenciosamente)
    // Usar AbortController para evitar requisições desnecessárias
    const abortController = new AbortController()
    
    fetch("/admin/api/auth/me", {
      method: "GET",
      credentials: "include",
      signal: abortController.signal,
    })
      .then(async (res) => {
        // Só redirecionar se a resposta for OK E tiver dados de usuário
        if (res.ok) {
          try {
            const data = await res.json()
            if (data.user) {
              // Só redirecionar se for uma rota admin válida
              const redirectTo = from.startsWith("/admin") ? from : "/admin/dashboard"
              router.replace(redirectTo) // Usar replace em vez de push para evitar histórico
            } else {
              setIsCheckingAuth(false)
            }
          } catch {
            // Erro ao parsear resposta, não redirecionar
            setIsCheckingAuth(false)
          }
        } else {
          // Se retornar 401, é esperado - usuário não está autenticado
          // Não fazer nada, apenas mostrar a página de login
          setIsCheckingAuth(false)
        }
      })
      .catch((error) => {
        // Ignorar erros de abort e outros erros silenciosamente
        if (error.name !== "AbortError") {
          // Erro de conexão, continuar na página de login
          setIsCheckingAuth(false)
        }
      })
    
    // Cleanup: abortar requisição se o componente for desmontado
    return () => {
      abortController.abort()
    }
  }, [router, from])

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError("")

    try {
      const response = await fetch("/admin/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      })

      const data = await response.json()

      if (response.ok) {
        // Garantir que redireciona para rota admin válida
        const redirectTo = from.startsWith("/admin") ? from : "/admin/dashboard"
        router.replace(redirectTo) // Usar replace em vez de push
        router.refresh()
      } else {
        setError(data.error || "Erro ao fazer login")
      }
    } catch (error) {
      setError("Erro ao conectar com o servidor")
    } finally {
      setLoading(false)
    }
  }

  // Mostrar loading enquanto verifica autenticação
  if (isCheckingAuth) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">
            Verificando autenticação...
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6 lg:p-8">
      <Card className="w-full max-w-md mx-auto shadow-lg">
        <CardHeader className="space-y-1 px-4 sm:px-6">
          <CardTitle className="text-xl sm:text-2xl font-bold text-foreground">
            Login Administrativo
          </CardTitle>
          <CardDescription className="text-sm sm:text-base text-muted-foreground">
            Entre com suas credenciais para acessar o painel
          </CardDescription>
        </CardHeader>
        <CardContent className="px-4 sm:px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-5">
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription className="text-sm">{error}</AlertDescription>
              </Alert>
            )}

            <div className="space-y-2">
              <Label 
                htmlFor="username" 
                className="text-sm font-medium text-foreground"
              >
                Usuário
              </Label>
              <Input
                id="username"
                type="text"
                placeholder="admin"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                disabled={loading}
                autoFocus
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <div className="space-y-2">
              <Label 
                htmlFor="password" 
                className="text-sm font-medium text-foreground"
              >
                Senha
              </Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                disabled={loading}
                className="text-foreground placeholder:text-muted-foreground"
              />
            </div>

            <Button 
              type="submit" 
              className="w-full text-base sm:text-sm" 
              disabled={loading}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Entrando...
                </>
              ) : (
                "Entrar"
              )}
            </Button>
          </form>

          <div className="mt-4 sm:mt-6 text-center">
            <Link 
              href="/home" 
              className="text-sm text-muted-foreground hover:text-foreground hover:underline transition-colors"
            >
              Voltar para o site
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export default function AdminLoginPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen items-center justify-center bg-background p-4 sm:p-6">
        <div className="text-center">
          <Loader2 className="h-8 w-8 sm:h-10 sm:w-10 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-sm sm:text-base text-muted-foreground">Carregando...</p>
        </div>
      </div>
    }>
      <LoginForm />
    </Suspense>
  )
}
