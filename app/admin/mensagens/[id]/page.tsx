import { sql, type ContactMessage } from "@/lib/db"
import { notFound } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Mail, Phone } from "lucide-react"
import { MessageActions } from "./components/message-actions"

export const dynamic = "force-dynamic"

export default async function ContactMessageDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params

  if (!sql) {
    notFound()
  }

  const messages = (await sql!`SELECT * FROM contact_messages WHERE id = ${id}`) as unknown as ContactMessage[]

  if (messages.length === 0) {
    notFound()
  }

  const message = messages[0]

  return (
    <div className="space-y-8">
      <div className="flex items-center gap-4">
        <Link href="/admin/mensagens">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Mensagem #{message.id}</h1>
          <p className="text-muted-foreground">
            {format(new Date(message.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Informações do Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Nome</p>
                <p className="font-medium">{message.name}</p>
              </div>
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-muted-foreground" />
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Email</p>
                  <a href={`mailto:${message.email}`} className="font-medium text-primary hover:underline">
                    {message.email}
                  </a>
                </div>
              </div>
              {message.phone && (
                <div className="flex items-center gap-2">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Telefone</p>
                    <a href={`tel:${message.phone}`} className="font-medium text-primary hover:underline">
                      {message.phone}
                    </a>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Mensagem</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground mb-1">Assunto</p>
                <p className="font-medium text-lg">{message.subject}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-1">Conteúdo</p>
                <p className="font-medium whitespace-pre-wrap">{message.message}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Status</CardTitle>
            </CardHeader>
            <CardContent>
              <Badge
                variant={
                  message.status === "new"
                    ? "default"
                    : message.status === "read"
                      ? "secondary"
                      : "default"
                }
                className="text-lg px-4 py-2"
              >
                {message.status === "new"
                  ? "Nova"
                  : message.status === "read"
                    ? "Lida"
                    : "Respondida"}
              </Badge>
            </CardContent>
          </Card>

          <MessageActions message={{
            id: message.id,
            status: message.status,
            email: message.email,
            subject: message.subject
          }} />
        </div>
      </div>
    </div>
  )
}

