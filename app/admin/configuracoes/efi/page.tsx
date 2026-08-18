"use client"

import { useState, useEffect, useRef } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Loader2,
  CreditCard,
  Save,
  Eye,
  EyeOff,
  CheckCircle2,
  XCircle,
  Upload,
  FileKey,
} from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const efiConfigSchema = z.object({
  client_id: z.string().min(1, "Client ID é obrigatório"),
  client_secret: z.string().optional(),
  environment: z.enum(["sandbox", "production"]),
  pix_key: z.string().min(1, "Chave Pix é obrigatória"),
  certificate_path: z.string().min(1, "Selecione ou envie um certificado .p12"),
  certificate_passphrase: z.string().optional(),
  webhook_url: z.string().url("URL inválida").optional().or(z.literal("")),
})

type EfiConfigFormValues = z.infer<typeof efiConfigSchema>

type CertOption = { fileName: string; path: string; size: number }

function buildWebhookUrl(origin: string) {
  return `${origin.replace(/\/$/, "")}/api/efi/webhook`
}

function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  return `${(size / 1024).toFixed(1)} KB`
}

export default function EfiConfigPage() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [uploadingCert, setUploadingCert] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [configured, setConfigured] = useState(false)
  const [certificates, setCertificates] = useState<CertOption[]>([])
  const fileInputRef = useRef<HTMLInputElement>(null)
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
      certificate_path: "",
      certificate_passphrase: "",
      webhook_url: "",
    },
  })

  const loadCertificates = async () => {
    try {
      const res = await fetch("/admin/api/efi-config/certificate")
      const data = await res.json()
      if (res.ok && Array.isArray(data.certificates)) {
        setCertificates(data.certificates)
      }
    } catch {
      /* ignore */
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const origin = window.location.origin
        const defaultWebhook = buildWebhookUrl(origin)
        await loadCertificates()

        const res = await fetch("/admin/api/efi-config")
        const data = await res.json()

        if (data.config) {
          form.reset({
            client_id: data.config.client_id || "",
            client_secret: "",
            environment: data.config.environment || "sandbox",
            pix_key: data.config.pix_key || "",
            certificate_path: data.config.certificate_path || "",
            certificate_passphrase: "",
            webhook_url: data.config.webhook_url || defaultWebhook,
          })
          setConfigured(true)
        } else {
          form.setValue("webhook_url", defaultWebhook)
        }
      } catch {
        toast({
          title: "Erro",
          description: "Não foi possível carregar a configuração.",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [form, toast])

  const handleCertificateUpload = async (file: File) => {
    setUploadingCert(true)
    try {
      const body = new FormData()
      body.append("certificate", file)

      const res = await fetch("/admin/api/efi-config/certificate", {
        method: "POST",
        body,
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Falha no upload")

      await loadCertificates()
      if (data.path) {
        form.setValue("certificate_path", data.path, { shouldValidate: true })
      }

      toast({
        title: "Certificado enviado",
        description: data.fileName || "Arquivo salvo em certs/efi/",
      })
    } catch (e: unknown) {
      toast({
        title: "Erro no upload",
        description: e instanceof Error ? e.message : "Não foi possível enviar o certificado",
        variant: "destructive",
      })
    } finally {
      setUploadingCert(false)
      if (fileInputRef.current) fileInputRef.current.value = ""
    }
  }

  const onSubmit = async (values: EfiConfigFormValues) => {
    if (!configured && !values.client_secret?.trim()) {
      toast({ title: "Client Secret obrigatório", variant: "destructive" })
      return
    }
    setSaving(true)
    try {
      const res = await fetch("/admin/api/efi-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao salvar")
      toast({
        title: "Salvo!",
        description: "Configuração Efí atualizada. Sincronize o catálogo no Whaticket.",
      })
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

  const selectedCert = form.watch("certificate_path")

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
        <p className="text-muted-foreground">
          Pagamentos Pix da loja e do fluxo automático WhatsApp (Whaticket)
        </p>
      </div>

      <Alert variant={configured ? "default" : "destructive"}>
        {configured ? <CheckCircle2 className="h-4 w-4" /> : <XCircle className="h-4 w-4" />}
        <AlertTitle>{configured ? "Configurado" : "Não configurado"}</AlertTitle>
        <AlertDescription>
          {configured
            ? "Credenciais salvas. Após alterar, clique em Sincronizar loja no Whaticket (/product-catalog)."
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
                  onValueChange={v => form.setValue("environment", v as "sandbox" | "production")}
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
                placeholder={configured ? "Deixe em branco para manter o atual" : ""}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="pix_key">Chave Pix</Label>
              <Input
                id="pix_key"
                {...form.register("pix_key")}
                placeholder="EVP, e-mail, CPF/CNPJ ou telefone"
                disabled={saving}
              />
              {form.formState.errors.pix_key && (
                <p className="text-sm text-destructive">{form.formState.errors.pix_key.message}</p>
              )}
            </div>

            <div className="rounded-lg border bg-muted/20 p-4 space-y-4">
              <div className="flex items-center gap-2">
                <FileKey className="h-5 w-5 text-muted-foreground" />
                <div>
                  <Label>Certificado digital (.p12 / .pfx)</Label>
                  <p className="text-xs text-muted-foreground">
                    Envie o arquivo pelo painel ou selecione um já enviado
                  </p>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".p12,.pfx,application/x-pkcs12"
                  className="hidden"
                  onChange={e => {
                    const file = e.target.files?.[0]
                    if (file) handleCertificateUpload(file)
                  }}
                />
                <Button
                  type="button"
                  variant="outline"
                  disabled={uploadingCert || saving}
                  onClick={() => fileInputRef.current?.click()}
                  className="sm:w-auto"
                >
                  {uploadingCert ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Upload className="mr-2 h-4 w-4" />
                  )}
                  Enviar certificado
                </Button>
              </div>

              {certificates.length > 0 ? (
                <div className="space-y-2">
                  <Label htmlFor="certificate_path">Certificado ativo</Label>
                  <Select
                    value={selectedCert || undefined}
                    onValueChange={v => form.setValue("certificate_path", v, { shouldValidate: true })}
                    disabled={saving}
                  >
                    <SelectTrigger id="certificate_path">
                      <SelectValue placeholder="Selecione um certificado" />
                    </SelectTrigger>
                    <SelectContent>
                      {certificates.map(cert => (
                        <SelectItem key={cert.path} value={cert.path}>
                          {cert.fileName} ({formatBytes(cert.size)})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              ) : (
                <div className="space-y-2">
                  <Label htmlFor="certificate_path_manual">Caminho do certificado</Label>
                  <Input
                    id="certificate_path_manual"
                    {...form.register("certificate_path")}
                    placeholder="/app/certs/efi/seu-certificado.p12"
                    disabled={saving}
                  />
                </div>
              )}

              {form.formState.errors.certificate_path && (
                <p className="text-sm text-destructive">
                  {form.formState.errors.certificate_path.message}
                </p>
              )}

              {selectedCert ? (
                <p className="text-xs text-muted-foreground font-mono break-all">{selectedCert}</p>
              ) : null}
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
                Cadastre no painel Efí (Pix → Webhooks):{" "}
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
