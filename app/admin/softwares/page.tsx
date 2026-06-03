import { sql, type Software } from "@/lib/db"
import { formatDbError, toIsoDate } from "@/lib/admin-db"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Plus } from "lucide-react"
import Link from "next/link"
import { SoftwaresTable } from "@/components/softwares-table"
import { AdminDbError } from "@/components/admin-db-error"

export const dynamic = "force-dynamic"

export default async function AdminSoftwaresPage() {
  if (!sql) {
    return (
      <div className="space-y-6">
        <AdminDbError title="Banco indisponível" message="Variáveis DB_* não configuradas no container." />
      </div>
    )
  }

  let softwaresForTable: {
    id: number
    name: string
    category: string
    price: string
    is_featured: boolean
    is_active: boolean
    created_at: string
  }[] = []
  let loadError: string | null = null

  try {
    const softwares = (await sql!`
      SELECT * FROM softwares 
      ORDER BY created_at DESC
    `) as unknown as Software[]

    softwaresForTable = softwares.map((software) => ({
      id: software.id,
      name: software.name,
      category: software.category || "",
      price: software.price != null ? String(software.price) : "0",
      is_featured: Boolean(software.is_featured),
      is_active: Boolean(software.is_active),
      created_at: toIsoDate(software.created_at),
    }))
  } catch (error) {
    console.error("[AdminSoftwares]", error)
    loadError = formatDbError(error)
  }

  return (
    <div className="space-y-6">
      {loadError ? <AdminDbError title="Erro ao carregar softwares" message={loadError} /> : null}

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Gerenciar Softwares</h1>
          <p className="text-muted-foreground">Adicione, edite ou remova softwares próprios</p>
        </div>
        <Link href="/admin/softwares/novo">
          <Button className="gap-2" disabled={!!loadError}>
            <Plus className="h-4 w-4" />
            Novo Software
          </Button>
        </Link>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Softwares Cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          {!loadError ? <SoftwaresTable softwares={softwaresForTable} /> : null}
        </CardContent>
      </Card>
    </div>
  )
}
