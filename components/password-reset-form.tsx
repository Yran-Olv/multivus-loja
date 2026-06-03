"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useToast } from "@/hooks/use-toast"
import { Loader2, Lock, ArrowLeft, Eye, EyeOff } from "lucide-react"
import { useRouter } from "next/navigation"
// Função utilitária para traduzir erros (inline para evitar problemas de importação)
function translateApiError(error: string, context?: string): string {
  const errorLower = error.toLowerCase()
  if (errorLower.includes("network") || errorLower.includes("fetch") || errorLower.includes("connection") || errorLower.includes("conexão")) {
    return "Não foi possível conectar ao servidor. Verifique sua conexão com a internet e tente novamente"
  }
  if (errorLower.includes("unauthorized") || errorLower.includes("não autenticado")) {
    return "Sua sessão expirou. Por favor, faça login novamente"
  }
  if (errorLower.includes("rate limit") || errorLower.includes("muitas requisições") || errorLower.includes("429")) {
    return "Você fez muitas solicitações. Aguarde alguns instantes e tente novamente"
  }
  if (errorLower.includes("validation") || errorLower.includes("dados inválidos") || errorLower.includes("invalid")) {
    return "Por favor, verifique os dados informados e tente novamente"
  }
  if (errorLower.includes("database") || errorLower.includes("banco de dados") || errorLower.includes("sql")) {
    return "Ocorreu um erro ao processar sua solicitação. Por favor, tente novamente em alguns instantes"
  }
  if (errorLower.includes("500") || errorLower.includes("internal server") || errorLower.includes("erro ao processar")) {
    return "Ocorreu um erro inesperado. Nossa equipe foi notificada. Por favor, tente novamente em alguns instantes"
  }
  if (context === "password-reset") {
    if (errorLower.includes("whatsapp") || errorLower.includes("cadastrado")) {
      return "Não encontramos um WhatsApp cadastrado para este e-mail. Entre em contato com o suporte"
    }
    if (errorLower.includes("código") || errorLower.includes("code")) {
      if (errorLower.includes("inválido") || errorLower.includes("invalid")) {
        return "O código informado está incorreto. Verifique o código recebido no WhatsApp e tente novamente"
      }
      if (errorLower.includes("expirado") || errorLower.includes("expired")) {
        return "O código expirou. Por favor, solicite um novo código de recuperação"
      }
      return "Não foi possível enviar o código. Verifique se o e-mail está correto e tente novamente"
    }
    return "Não foi possível redefinir sua senha. Tente novamente"
  }
  return error
}

interface PasswordResetFormProps {
  onBack?: () => void
  initialCode?: string
}

export function PasswordResetForm({ onBack, initialCode }: PasswordResetFormProps) {
  const [step, setStep] = useState<"request" | "reset">(initialCode ? "reset" : "request")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState(initialCode || "")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  async function handleRequestCode(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      const response = await fetch("/api/customers/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Código enviado!",
          description: "Verifique seu WhatsApp. O código expira em 15 minutos.",
        })
        setStep("reset")
      } else {
        let errorMessage = "Não foi possível enviar o código de recuperação."

        if (data.error) {
          errorMessage = translateApiError(data.error, "password-reset")
        }

        toast({
          title: "Não foi possível enviar",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao solicitar código:", error)
      const errorMessage = translateApiError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "password-reset"
      )

      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.FormEvent) {
    e.preventDefault()

    if (newPassword !== confirmPassword) {
      toast({
        title: "Senhas não coincidem",
        description: "As senhas informadas não são iguais. Verifique e tente novamente.",
        variant: "destructive",
      })
      return
    }

    if (newPassword.length < 6) {
      toast({
        title: "Senha muito curta",
        description: "A senha deve ter pelo menos 6 caracteres para maior segurança.",
        variant: "destructive",
      })
      return
    }

    setLoading(true)

    try {
      const response = await fetch("/api/customers/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code,
          new_password: newPassword,
          confirm_password: confirmPassword,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Senha redefinida!",
          description: "Sua senha foi atualizada com sucesso. Você já pode fazer login.",
        })
        // Limpar formulário
        setCode("")
        setNewPassword("")
        setConfirmPassword("")
        setStep("request")
        if (onBack) {
          onBack()
        }
      } else {
        let errorMessage = "Não foi possível redefinir sua senha."

        if (data.error) {
          errorMessage = translateApiError(data.error, "password-reset")
        }

        toast({
          title: "Não foi possível redefinir",
          description: errorMessage,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao redefinir senha:", error)
      const errorMessage = translateApiError(
        error instanceof Error ? error.message : "Erro desconhecido",
        "password-reset"
      )

      toast({
        title: "Erro de conexão",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  if (step === "request") {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5" />
            Recuperar Senha
          </CardTitle>
          <CardDescription>
            Digite seu email para receber um código de recuperação via WhatsApp
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRequestCode} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email</Label>
              <Input
                id="reset-email"
                type="email"
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                "Enviar Código"
              )}
            </Button>
            {onBack && (
              <Button type="button" variant="outline" className="w-full" onClick={onBack}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Voltar para Login
              </Button>
            )}
          </form>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          Redefinir Senha
        </CardTitle>
        <CardDescription>
          Digite o código recebido no WhatsApp e sua nova senha
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleResetPassword} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="reset-code">Código de Recuperação</Label>
            <Input
              id="reset-code"
              type="text"
              placeholder="000000"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
              maxLength={6}
              required
            />
            <p className="text-xs text-muted-foreground">
              Digite o código de 6 dígitos recebido no WhatsApp
            </p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-new-password">Nova Senha</Label>
            <div className="relative">
              <Input
                id="reset-new-password"
                type={showNewPassword ? "text" : "password"}
                placeholder="Mínimo 6 caracteres"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowNewPassword(!showNewPassword)}
              >
                {showNewPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="reset-confirm-password">Confirmar Nova Senha</Label>
            <div className="relative">
              <Input
                id="reset-confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Digite a senha novamente"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                minLength={6}
                className="pr-10"
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
              >
                {showConfirmPassword ? (
                  <EyeOff className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <Eye className="h-4 w-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={loading}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Salvando...
              </>
            ) : (
              "Salvar Nova Senha"
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            className="w-full"
            onClick={() => {
              setStep("request")
              setCode("")
              setNewPassword("")
              setConfirmPassword("")
            }}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}

