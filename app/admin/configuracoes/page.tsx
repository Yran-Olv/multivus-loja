import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { MessageSquare, CreditCard, Store } from "lucide-react"

export default function ConfiguracoesPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Configurações</h1>
        <p className="text-muted-foreground">Gerencie as integrações e configurações do sistema</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              WhatsApp
            </CardTitle>
            <CardDescription>Configure a integração com WhatsApp para envio de mensagens automáticas</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/configuracoes/whatsapp">
              <Button className="w-full">Configurar WhatsApp</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5" />
              Efí (Gerencianet)
            </CardTitle>
            <CardDescription>Pagamentos Pix via Efí Bank — checkout com QR Code</CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/configuracoes/efi">
              <Button className="w-full">Configurar Efí Pix</Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Store className="h-5 w-5" />
              Catálogo / Whaticket
            </CardTitle>
            <CardDescription>
              Gere a chave para o Whaticket importar produtos, serviços e softwares desta loja
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/admin/configuracoes/catalogo">
              <Button className="w-full">Configurar sincronização</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

