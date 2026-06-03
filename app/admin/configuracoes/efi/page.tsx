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
import { Loader2, CreditCard, Save, Eye, EyeOff, CheckCircle2, XCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const efiConfigSchema = z.object({
  client_id: z.string().min(1, "Client ID é obrigatório"),
  client_secret: z.string().optional(),
  environment: z.enum(["sandbox", "production"]),
  pix_key: z.string().min(1, "Chave Pix é obrigatória"),
  certificate_path: z.string().min(1, "Caminho do certificado .p12 é obrigatório para API Pix"),
  certificate_passphrase: z.string().optional(),
  webhook_url: z.string().url("URL inválida").optional().or(z.literal("")),
})

type EfiConfigFormValues = z.infer<typeof efiConfigSchema>

function buildWebhookUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/efi/webhook`
}

export default function EfiConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [configured, setConfigured] = useState(false)
  const { toast } = useToast()

  const suggestedWebhook =
    typeof window !== "undefined" ? buildWebhookUrl(window.location.origin) : ""

  const form = useForm<EfiConfigFormValues>({
    resolver: zodResolver(efiConfigSchema),
    defaultValues: {
      client_id: "",
      client_secret: "",
      environment: "sandbox",
      pix_key: "",
      certificate_path: "/app/certs/efi/homologacao.p12",
      certificate_passphrase: "",
      webhook_url: "",
    },
  })

  useEffect(() => {
    async function load() {
      try {
        const origin = window.location.origin
        const defaultWebhook = buildWebhookUrl(origin)
        const res = await fetch("/api/efi-config")
        const data = await res.json()

        if (data.config) {
          form.reset({
            client_id: data.config.client_id || "",
            client_secret: "",
            environment: data.config.environment || "sandbox",
            pix_key: data.config.pix_key || "",
            certificate_path: data.config.certificate_path || "/app/certs/efi/homologacao.p12",
            certificate_passphrase: "",
            webhook_url: data.config.webhook_url || defaultWebhook,
          })
          setConfigured(true)
        } else {
          form.setValue("webhook_url", defaultWebhook)
        }
      } catch {
        toast({ title: "Erro", description: "Não foi possível carregar a configuração.", variant: "destructive" })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [form, toast])

  const onSubmit = async (values: EfiConfigFormValues) => {
    if (!configured && !values.client_secret?.trim()) {
      toast({ title: "Client Secret obrigatório", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/api/efi-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")
      toast({ title: "Salvo!", description: "Configuração Efí atualizada." })
      setConfigured(true)
    } catch (e: unknown) {
      toast({
        title: "Erro",
        description: e instanceof Error ? e.message : "Falha ao salvar",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Efí (Gerencianet) — Pix</h1>
        <p className="text-muted-foreground">Pagamentos via API Pix da Efí Bank</p>
      </div>

      <Alert variant={configured ? "default" : "destructive"}>
        {configured ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        <AlertTitle>{configured ? "Configurado" : "Não configurado"}</AlertTitle>
        <AlertDescription>
          {configured
            ? "Credenciais salvas. Checkout da loja gera QR Code Pix."
            : "Configure credenciais, chave Pix e certificado .p12 da conta Efí."}
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" />
            Credenciais Efí
          </CardTitle>
          <CardDescription>
            Painel Efí → API → Aplicações → credenciais Pix + certificado em Meus Certificados
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="client_id">Client ID</Label>
                <Input id="client_id" {...form.register("client_id")} disabled={saving} />
                {form.formState.errors.client_id && (
                  <p className="text-sm text-destructive">{form.formState.errors.client_id.message}</p>
                )}
              </div>
              <div className="space-y-2">
                <Label htmlFor="environment">Ambiente</Label>
                <Select
                  value={form.watch("environment")}
                  onValueChange={(v) => form.setValue("environment", v as "sandbox" | "production")}
                  disabled={saving}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sandbox">Homologação (sandbox)</SelectItem>
                    <SelectItem value="production">Produção</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="client_secret">Client Secret</Label>
                <Button type="button" variant="ghost" size="sm" onClick={() => setShowSecret(!showSecret)}>
                  {showSecret ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
              <Input
                id="client_secret"
                type={showSecret ? "text" : "password"}
                {...form.register("client_secret")}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave Pix</Label>
              <Input id="pix_key" {...form.register("pix_key")} placeholder="EVP, e-mail, CPF/CNPJ ou telefone" disabled={saving} />
              {form.formState.errors.pix_key && (
                <p className="text-sm text-destructive">{form.formState.errors.pix_key.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate_path">Caminho do certificado (.p12)</Label>
              <Input
                id="certificate_path"
                {...form.register("certificate_path")}
                placeholder="/app/certs/efi/homologacao.p12"
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Baixe em Efí → API → Meus Certificados. Na VPS: arquivo em{" "}
                <code className="bg-muted px-1 rounded">certs/efi/nome.p12</code> — use sempre{" "}
                <code className="bg-muted px-1 rounded">/app/certs/efi/nome.p12</code> (não use /var/www/...).
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="certificate_passphrase">Senha do certificado (se houver)</Label>
              <Input
                id="certificate_passphrase"
                type="password"
                {...form.register("certificate_passphrase")}
                disabled={saving}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="webhook_url">URL do Webhook</Label>
              <Input
                id="webhook_url"
                {...form.register("webhook_url")}
                placeholder={suggestedWebhook}
                disabled={saving}
              />
              <p className="text-xs text-muted-foreground">
                Cadastre no painel Efí (Pix → Webhooks) e use:{" "}
                <code className="bg-muted px-1 rounded">{suggestedWebhook}</code>
              </p>
            </div>

            <Button type="submit" disabled={saving}>
              {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Salvar
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
