"use client"

import { useState, useEffect } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { Loader2, MessageSquare, Save, Eye, EyeOff, CheckCircle2, XCircle, AlertCircle, TestTube } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const whatsappConfigSchema = z.object({
  token: z.string().min(1, "Token é obrigatório"),
  endpoint: z.string().url("Endpoint deve ser uma URL válida").min(1, "Endpoint é obrigatório"),
  user_id: z.string().optional().nullable(),
  queue_id: z.string().optional().nullable(),
})

type WhatsAppConfigFormValues = z.infer<typeof whatsappConfigSchema>

export default function WhatsAppConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showToken, setShowToken] = useState(false)
  const [testing, setTesting] = useState(false)
  const [testResult, setTestResult] = useState<{
    success: boolean
    message: string
    details?: string
  } | null>(null)
  const [configStatus, setConfigStatus] = useState<{
    configured: boolean
    hasToken: boolean
    hasEndpoint: boolean
  } | null>(null)
  const { toast } = useToast()

  const form = useForm<WhatsAppConfigFormValues>({
    resolver: zodResolver(whatsappConfigSchema),
    defaultValues: {
      token: "",
      endpoint: "https://be.elevafoco.com.br/api/messages/send",
      user_id: "",
      queue_id: "",
    },
  })

  useEffect(() => {
    async function fetchConfig() {
      try {
        const res = await fetch("/admin/api/whatsapp-config")
        if (res.ok) {
          const data = await res.json()
          if (data.config) {
            // Carregar dados salvos no formulário
            // Manter o token atual se já foi digitado, senão deixar vazio
            const currentToken = form.getValues("token") || ""
            form.reset({
              token: currentToken, // Manter token digitado ou vazio
              endpoint: data.config.endpoint || "https://be.elevafoco.com.br/api/messages/send",
              user_id: data.config.user_id || "",
              queue_id: data.config.queue_id || "",
            })
            setConfigStatus({
              configured: true,
              hasToken: !!currentToken || !!data.config.token,
              hasEndpoint: !!data.config.endpoint,
            })
            console.log("[WhatsApp Config] Dados carregados:", {
              endpoint: data.config.endpoint,
              user_id: data.config.user_id,
              queue_id: data.config.queue_id,
              hasToken: !!data.config.token || !!currentToken,
            })
          } else {
            // Nenhuma configuração encontrada, usar valores padrão
            // Manter token se já foi digitado
            const currentToken = form.getValues("token") || ""
            form.reset({
              token: currentToken,
              endpoint: "https://be.elevafoco.com.br/api/messages/send",
              user_id: "",
              queue_id: "",
            })
            setConfigStatus({
              configured: false,
              hasToken: !!currentToken,
              hasEndpoint: true,
            })
          }
        }
      } catch (error) {
        console.error("Erro ao buscar configuração:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar a configuração.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    // Executar apenas uma vez na montagem
    fetchConfig()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function onSubmit(values: WhatsAppConfigFormValues) {
    setSaving(true)
    try {
      const res = await fetch("/admin/api/whatsapp-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          token: values.token,
          endpoint: values.endpoint,
          user_id: values.user_id || null,
          queue_id: values.queue_id || null,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        toast({
          title: "Sucesso",
          description: data.message || "Configuração salva com sucesso.",
        })
        // Recarregar dados salvos (mantendo o token digitado)
        if (data.config) {
          form.setValue("endpoint", data.config.endpoint || "")
          form.setValue("user_id", data.config.user_id || "")
          form.setValue("queue_id", data.config.queue_id || "")
          // Manter o token que foi digitado (não limpar)
          // O token já está no form.values.token, então não precisa fazer nada
        }
        // Atualizar status - verificar se o token foi salvo
        setConfigStatus({
          configured: true,
          hasToken: !!values.token && values.token.trim() !== "",
          hasEndpoint: !!values.endpoint && values.endpoint.trim() !== "",
        })
        // Limpar resultado de teste anterior
        setTestResult(null)
      } else {
        toast({
          title: "Erro",
          description: data.error || "Erro ao salvar configuração.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao salvar configuração:", error)
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao salvar a configuração.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  async function testConnection() {
    setTesting(true)
    setTestResult(null)

    try {
      const values = form.getValues()

      if (!values.token || !values.endpoint) {
        setTestResult({
          success: false,
          message: "Token e endpoint são obrigatórios para testar",
        })
        return
      }

      // Solicitar número de teste do usuário
      const testNumber = prompt(
        "Digite o número de telefone para teste (com DDD):\n\nExemplos:\n• (34) 99919-8782\n• 34999198782\n• (85) 99999-9999\n\nO número será formatado automaticamente."
      )

      if (!testNumber || testNumber.trim() === "") {
        setTesting(false)
        return
      }

      // Testar envio de mensagem de teste
      const response = await fetch("/admin/api/whatsapp/send-text", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          number: testNumber,
          body: "🧪 Teste de integração WhatsApp - MULTIVUS\n\nEsta é uma mensagem de teste. Se você recebeu, a integração está funcionando! ✅",
          userId: values.user_id || "",
          queueId: values.queue_id || "",
          sendSignature: true,
          closeTicket: false,
        }),
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setTestResult({
          success: true,
          message: "Mensagem de teste enviada com sucesso!",
          details: "Verifique o WhatsApp para confirmar o recebimento.",
        })
        toast({
          title: "Teste bem-sucedido!",
          description: "A mensagem de teste foi enviada. Verifique o WhatsApp.",
        })
      } else {
        setTestResult({
          success: false,
          message: data.error || "Erro ao enviar mensagem de teste",
          details: data.details || "Verifique o token e endpoint configurados.",
        })
        toast({
          title: "Erro no teste",
          description: data.error || "Não foi possível enviar a mensagem de teste.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("Erro ao testar conexão:", error)
      setTestResult({
        success: false,
        message: "Erro ao testar conexão",
        details: error instanceof Error ? error.message : "Erro desconhecido",
      })
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao testar a conexão.",
        variant: "destructive",
      })
    } finally {
      setTesting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-2">
          <MessageSquare className="h-8 w-8 text-primary" />
          Configuração WhatsApp
        </h1>
        <p className="text-muted-foreground mt-2">
          Configure a integração com WhatsApp para envio de mensagens automáticas
        </p>
      </div>

      {/* Status da Configuração */}
      {configStatus && (
        <Alert variant={configStatus.configured && configStatus.hasToken && configStatus.hasEndpoint ? "default" : "destructive"}>
          <div className="flex items-start gap-3">
            {configStatus.configured && configStatus.hasToken && configStatus.hasEndpoint ? (
              <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
            ) : (
              <AlertCircle className="h-5 w-5 mt-0.5" />
            )}
            <div className="flex-1">
              <AlertTitle>
                {configStatus.configured && configStatus.hasToken && configStatus.hasEndpoint
                  ? "WhatsApp Configurado"
                  : "WhatsApp Não Configurado"}
              </AlertTitle>
              <AlertDescription>
                {configStatus.configured && configStatus.hasToken && configStatus.hasEndpoint
                  ? "A integração está configurada e pronta para uso. Você pode testar o envio abaixo."
                  : "Configure o token e endpoint para habilitar o envio de mensagens via WhatsApp."}
              </AlertDescription>
            </div>
          </div>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Credenciais da API</CardTitle>
          <CardDescription>
            Configure o token e endpoint da API WhatsApp. As credenciais são armazenadas de forma segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="token">
                Token da API <span className="text-destructive">*</span>
              </Label>
              <div className="relative">
                <Input
                  id="token"
                  type={showToken ? "text" : "password"}
                  placeholder="Digite o token da API"
                  {...form.register("token")}
                  className="pr-10"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                  onClick={() => setShowToken(!showToken)}
                  aria-label={showToken ? "Ocultar token" : "Mostrar token"}
                >
                  {showToken ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {form.formState.errors.token && (
                <p className="text-sm text-destructive">{form.formState.errors.token.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                Token de autenticação fornecido pela API WhatsApp
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="endpoint">
                Endpoint da API <span className="text-destructive">*</span>
              </Label>
              <Input
                id="endpoint"
                type="url"
                placeholder="https://be.elevafoco.com.br/api/messages/send"
                {...form.register("endpoint")}
              />
              {form.formState.errors.endpoint && (
                <p className="text-sm text-destructive">{form.formState.errors.endpoint.message}</p>
              )}
              <p className="text-xs text-muted-foreground">
                URL do endpoint de envio de mensagens
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="user_id">ID do Usuário/Atendente</Label>
                <Input
                  id="user_id"
                  placeholder="Opcional"
                  {...form.register("user_id")}
                />
                <p className="text-xs text-muted-foreground">
                  ID do usuário que enviará as mensagens (opcional)
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="queue_id">ID da Fila</Label>
                <Input
                  id="queue_id"
                  placeholder="Opcional"
                  {...form.register("queue_id")}
                />
                <p className="text-xs text-muted-foreground">
                  ID da fila de atendimento (opcional)
                </p>
              </div>
            </div>

            <div className="bg-muted/50 p-4 rounded-lg border border-border">
              <h4 className="font-semibold mb-2">ℹ️ Informações Importantes</h4>
              <div className="space-y-3">
                <div>
                  <p className="text-sm font-medium mb-1">Formato de Número de Telefone:</p>
                  <p className="text-sm text-muted-foreground">
                    Você pode digitar em qualquer formato (com ou sem máscara). O sistema formata automaticamente para o formato internacional.
                  </p>
                  <ul className="text-sm text-muted-foreground mt-2 space-y-1 list-disc list-inside">
                    <li>✅ Aceita: <code className="bg-background px-1 rounded">(85) 99999-9999</code>, <code className="bg-background px-1 rounded">85999999999</code>, <code className="bg-background px-1 rounded">558599999999</code></li>
                    <li>📱 Será formatado para: <code className="bg-background px-1 rounded">558599999999</code> (formato internacional)</li>
                  </ul>
                </div>
                <div>
                  <p className="text-sm font-medium mb-1">Como obter as credenciais:</p>
                  <p className="text-sm text-muted-foreground">
                    Entre em contato com o provedor da API WhatsApp para obter o <strong>Token</strong> e o <strong>Endpoint</strong> de envio de mensagens.
                  </p>
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button type="submit" disabled={saving} className="flex-1">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Configuração
                  </>
                )}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={testConnection}
                disabled={testing || !form.getValues("token") || !form.getValues("endpoint")}
                className="flex-1"
              >
                {testing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Testando...
                  </>
                ) : (
                  <>
                    <TestTube className="mr-2 h-4 w-4" />
                    Testar Envio
                  </>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Resultado do Teste */}
      {testResult && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {testResult.success ? (
                <>
                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                  Teste Bem-Sucedido
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5 text-destructive" />
                  Teste Falhou
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Alert variant={testResult.success ? "default" : "destructive"}>
              <AlertDescription>
                <p className="font-medium mb-2">{testResult.message}</p>
                {testResult.details && (
                  <p className="text-sm opacity-90">{testResult.details}</p>
                )}
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

