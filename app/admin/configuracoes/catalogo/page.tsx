"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert"
import {
  ArrowLeft,
  CheckCircle2,
  Copy,
  KeyRound,
  Loader2,
  RefreshCw,
  Store,
} from "lucide-react"

type CatalogSyncStatus = {
  configured: boolean
  source: "database" | "env" | null
  keyPreview: string | null
  siteUrl: string
  exportUrl: string
  updatedAt?: string | null
}

export default function CatalogoSyncConfigPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [status, setStatus] = useState<CatalogSyncStatus | null>(null)
  const [generatedKey, setGeneratedKey] = useState<string | null>(null)

  async function loadStatus() {
    try {
      const res = await fetch("/admin/api/catalog-sync-config")
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao carregar")
      setStatus(data)
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível carregar a configuração.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStatus()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleGenerate() {
    const confirmReplace =
      !status?.configured ||
      window.confirm(
        "Gerar uma nova chave invalida a anterior. O Whaticket precisará da nova chave. Continuar?"
      )

    if (!confirmReplace) return

    setGenerating(true)
    try {
      const res = await fetch("/admin/api/catalog-sync-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "generate" }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Erro ao gerar chave")

      setGeneratedKey(data.apiKey)
      await loadStatus()
      toast({
        title: "Chave gerada",
        description: "Copie a chave e configure no Whaticket.",
      })
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error?.message || "Não foi possível gerar a chave.",
        variant: "destructive",
      })
    } finally {
      setGenerating(false)
    }
  }

  async function copyText(value: string, label: string) {
    try {
      await navigator.clipboard.writeText(value)
      toast({ title: "Copiado", description: `${label} copiado para a área de transferência.` })
    } catch {
      toast({
        title: "Erro",
        description: "Não foi possível copiar automaticamente.",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const displayKey = generatedKey || null
  const whaticketSiteUrl =
    status?.siteUrl ||
    (typeof window !== "undefined" ? window.location.origin : "")

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <Link
            href="/admin/configuracoes"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-3"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar para Configurações
          </Link>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Store className="h-8 w-8 text-primary" />
            Sincronização do Catálogo
          </h1>
          <p className="text-muted-foreground mt-2">
            Gere a chave usada pelo Whaticket para importar produtos, serviços e softwares desta loja.
          </p>
        </div>
      </div>

      {status?.configured ? (
        <Alert>
          <CheckCircle2 className="h-5 w-5 text-green-500" />
          <AlertTitle>Chave configurada</AlertTitle>
          <AlertDescription>
            {status.source === "env"
              ? "Há uma chave definida no arquivo .env do servidor (CATALOG_SYNC_API_KEY)."
              : `Chave ativa no painel: ${status.keyPreview || "••••••••"}`}
            {status.updatedAt ? ` Atualizada em ${new Date(status.updatedAt).toLocaleString("pt-BR")}.` : ""}
          </AlertDescription>
        </Alert>
      ) : (
        <Alert variant="destructive">
          <AlertTitle>Nenhuma chave configurada</AlertTitle>
          <AlertDescription>
            Gere uma chave abaixo para habilitar a sincronização com o Whaticket.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <KeyRound className="h-5 w-5" />
            Chave de sincronização
          </CardTitle>
          <CardDescription>
            Use esta chave no Whaticket em Catálogo de produtos → Sincronizar com multivus-loja.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {displayKey ? (
            <div className="space-y-2">
              <Label>Chave gerada (copie agora)</Label>
              <div className="flex gap-2">
                <Input readOnly value={displayKey} className="font-mono text-sm" />
                <Button type="button" variant="outline" onClick={() => copyText(displayKey, "Chave")}>
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Por segurança, a chave completa só aparece logo após gerar. Se perder, gere uma nova.
              </p>
            </div>
          ) : status?.keyPreview ? (
            <div className="space-y-2">
              <Label>Chave atual</Label>
              <Input readOnly value={status.keyPreview} className="font-mono text-sm" />
            </div>
          ) : null}

          <Button onClick={handleGenerate} disabled={generating}>
            {generating ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Gerando...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {status?.configured ? "Gerar nova chave" : "Gerar chave"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Dados para o Whaticket</CardTitle>
          <CardDescription>
            Cole estes valores no painel do Whaticket de cada empresa.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>URL da loja</Label>
            <div className="flex gap-2">
              <Input readOnly value={whaticketSiteUrl} />
              <Button
                type="button"
                variant="outline"
                onClick={() => copyText(whaticketSiteUrl, "URL da loja")}
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Endpoint de exportação</Label>
            <div className="flex gap-2">
              <Input readOnly value={status?.exportUrl || `${whaticketSiteUrl}/api/catalog/export`} />
              <Button
                type="button"
                variant="outline"
                onClick={() =>
                  copyText(status?.exportUrl || `${whaticketSiteUrl}/api/catalog/export`, "Endpoint")
                }
              >
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-2">
            <p className="font-medium text-foreground">No Whaticket:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>Abra <strong>Catálogo de produtos</strong></li>
              <li>Em <strong>Sincronizar com multivus-loja</strong>, cole a URL da loja</li>
              <li>Cole a chave gerada nesta página</li>
              <li>Marque Produtos, Serviços e/ou Softwares</li>
              <li>Clique em <strong>Salvar config e sincronizar</strong></li>
            </ol>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
