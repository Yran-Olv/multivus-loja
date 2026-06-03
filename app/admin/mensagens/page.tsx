import { sql } from "@/lib/db"
import type { ContactMessage } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ContactMessagesTable } from "@/components/contact-messages-table"

export const dynamic = "force-dynamic"

export default async function AdminMensagensPage() {
  if (!sql) {
    return (
      <div className="space-y-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mensagens de Contato</h1>
          <p className="text-muted-foreground">Banco de dados não disponível</p>
        </div>
      </div>
    )
  }

  const messages = (await sql!`
    SELECT * FROM contact_messages 
    ORDER BY created_at DESC
  `) as unknown as ContactMessage[]

  const stats = {
    total: messages.length,
    new: messages.filter((m) => m.status === "new").length,
    read: messages.filter((m) => m.status === "read").length,
    responded: messages.filter((m) => m.status === "responded").length,
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mensagens de Contato</h1>
        <p className="text-muted-foreground">Gerencie todas as mensagens recebidas</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Total</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Novas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">{stats.new}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Lidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-500">{stats.read}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium">Respondidas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-500">{stats.responded}</div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card>
        <CardHeader>
          <CardTitle>Todas as Mensagens</CardTitle>
        </CardHeader>
        <CardContent>
          <ContactMessagesTable messages={messages} />
        </CardContent>
      </Card>
    </div>
  )
}
