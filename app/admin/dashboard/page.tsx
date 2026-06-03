import { sql } from "@/lib/db"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Package, Wrench, FileText, MessageSquare, Code, ShoppingBag, DollarSign, TrendingUp, Users, CreditCard, CheckCircle2, Clock, XCircle } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export const dynamic = "force-dynamic"

export default async function AdminDashboardPage() {
  let productCount = [{ count: 0 }]
  let softwareCount = [{ count: 0 }]
  let serviceCount = [{ count: 0 }]
  let pendingRequests = [{ count: 0 }]
  let newMessages = [{ count: 0 }]
  let totalOrders = [{ count: 0 }]
  let paidOrders = [{ count: 0 }]
  let pendingOrders = [{ count: 0 }]
  let totalRevenue = [{ total: 0 }]
  let monthlyRevenue = [{ total: 0 }]
  let totalPosts = [{ count: 0 }]
  let publishedPosts = [{ count: 0 }]
  let recentRequests: any[] = []
  let recentMessages: any[] = []
  let recentOrders: any[] = []
  let whatsappConfigured = false
  let efiConfigured = false
  let dbError = false

  try {
    if (sql) {
      // Verificar se as tabelas básicas existem primeiro
      try {
        // Contagens básicas (tabelas obrigatórias)
        productCount = await sql!`SELECT COUNT(*) as count FROM products WHERE is_active = true`
        softwareCount = await sql!`SELECT COUNT(*) as count FROM softwares WHERE is_active = true`
        serviceCount = await sql!`SELECT COUNT(*) as count FROM services WHERE is_active = true`
        pendingRequests = await sql!`SELECT COUNT(*) as count FROM service_requests WHERE status = 'pending'`
        newMessages = await sql!`SELECT COUNT(*) as count FROM contact_messages WHERE status = 'new'`

        // Atividades recentes
        recentRequests = await sql!`
          SELECT id, customer_name, service_type, status, created_at 
          FROM service_requests 
          ORDER BY created_at DESC 
          LIMIT 5
        `

        recentMessages = await sql!`
          SELECT id, name, subject, status, created_at 
          FROM contact_messages 
          ORDER BY created_at DESC 
          LIMIT 5
        `
      } catch (basicError) {
        // Se as tabelas básicas não existem, mostrar erro
        console.error("[Dashboard] Basic tables missing:", basicError)
        dbError = true
        throw basicError
      }

      // Estatísticas de pedidos (tabela opcional - pode não existir)
      try {
        totalOrders = await sql!`SELECT COUNT(*) as count FROM orders`
        paidOrders = await sql!`SELECT COUNT(*) as count FROM orders WHERE payment_status = 'paid'`
        pendingOrders = await sql!`SELECT COUNT(*) as count FROM orders WHERE payment_status = 'pending'`
        
        // Receita
        totalRevenue = await sql!`
          SELECT COALESCE(SUM(total_amount), 0) as total 
          FROM orders 
          WHERE payment_status = 'paid'
        `
        
        monthlyRevenue = await sql!`
          SELECT COALESCE(SUM(total_amount), 0) as total 
          FROM orders 
          WHERE payment_status = 'paid' 
          AND created_at >= DATE_TRUNC('month', CURRENT_DATE)
        `

        recentOrders = await sql!`
          SELECT id, order_number, customer_name, total_amount, payment_status, status, created_at 
          FROM orders 
          ORDER BY created_at DESC 
          LIMIT 5
        `
      } catch (ordersError) {
        // Tabela orders não existe ainda - não é crítico
        console.warn("[Dashboard] Orders table not found (optional):", ordersError)
      }

      // Blog (tabela opcional - pode não existir)
      try {
        totalPosts = await sql!`SELECT COUNT(*) as count FROM posts`
        publishedPosts = await sql!`SELECT COUNT(*) as count FROM posts WHERE is_published = true`
      } catch (postsError) {
        // Tabela posts não existe ainda - não é crítico
        console.warn("[Dashboard] Posts table not found (optional):", postsError)
        // Definir valores padrão
        totalPosts = [{ count: 0 }]
        publishedPosts = [{ count: 0 }]
      }

      // Verificar integrações (tabelas opcionais)
      try {
        const whatsappConfig = await sql!`
          SELECT COUNT(*) as count FROM whatsapp_config WHERE is_active = true
        `
        whatsappConfigured = (whatsappConfig[0]?.count || 0) > 0
      } catch (whatsappError) {
        console.warn("[Dashboard] WhatsApp config table not found (optional):", whatsappError)
      }

      try {
        const efiConfig = await sql!`
          SELECT COUNT(*) as count FROM efi_config WHERE is_active = true
        `
        efiConfigured = (efiConfig[0]?.count || 0) > 0
      } catch (efiError) {
        console.warn("[Dashboard] Efí config table not found (optional):", efiError)
      }
    } else {
      console.warn("[Dashboard] Database not available")
      dbError = true
    }
  } catch (error) {
    console.error("[Dashboard] Database error:", error)
    dbError = true
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">Visão geral do sistema MULTIVUS</p>
      </div>

      {dbError && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Banco de Dados Não Configurado</AlertTitle>
          <AlertDescription>
            As tabelas do banco de dados ainda não foram criadas. Execute os comandos no servidor:
            <ol className="list-decimal ml-6 mt-2 space-y-1">
              <li>
                <code className="bg-black/20 px-1 rounded">npm run db:migrate</code> - Criar todas as tabelas
              </li>
              <li>
                <code className="bg-black/20 px-1 rounded">npm run db:seed</code> - Popular com dados iniciais
              </li>
            </ol>
            <p className="mt-2 text-sm">
              <strong>No servidor VPS Ubuntu:</strong>
            </p>
            <pre className="bg-black/20 p-2 rounded mt-2 text-xs overflow-x-auto">
{`cd /home/deploy/LojaMultivus
npm run db:migrate
npm run db:seed`}
            </pre>
          </AlertDescription>
        </Alert>
      )}

      {/* Stats Grid - Primeira Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total de Pedidos</CardTitle>
            <ShoppingBag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalOrders[0].count}</div>
            <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>{paidOrders[0].count} pagos</span>
              <Clock className="h-3 w-3 text-yellow-500 ml-2" />
              <span>{pendingOrders[0].count} pendentes</span>
            </div>
            <Link href="/admin/pedidos">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Ver todos
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
            <DollarSign className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              R$ {Number(totalRevenue[0]?.total || 0).toFixed(2).replace(".", ",")}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Este mês: R$ {Number(monthlyRevenue[0]?.total || 0).toFixed(2).replace(".", ",")}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Produtos Ativos</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{productCount[0].count}</div>
            <Link href="/admin/produtos">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Gerenciar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Posts Publicados</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{publishedPosts[0].count}</div>
            <div className="text-xs text-muted-foreground mt-1">
              {totalPosts[0].count} total
            </div>
            <Link href="/admin/blog">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Gerenciar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Stats Grid - Segunda Linha */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Softwares</CardTitle>
            <Code className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{softwareCount[0].count}</div>
            <Link href="/admin/softwares">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Gerenciar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Serviços</CardTitle>
            <Wrench className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{serviceCount[0].count}</div>
            <Link href="/admin/servicos">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Gerenciar
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Solicitações Pendentes</CardTitle>
            <FileText className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingRequests[0].count}</div>
            <Link href="/admin/solicitacoes">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Ver todas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Mensagens Novas</CardTitle>
            <MessageSquare className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{newMessages[0].count}</div>
            <Link href="/admin/mensagens">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Ver todas
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Integrações</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="space-y-1">
              <div className="flex items-center gap-2 text-xs">
                {whatsappConfigured ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>WhatsApp</span>
              </div>
              <div className="flex items-center gap-2 text-xs">
                {efiConfigured ? (
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                ) : (
                  <XCircle className="h-3 w-3 text-red-500" />
                )}
                <span>Efí Pix</span>
              </div>
            </div>
            <Link href="/admin/configuracoes">
              <Button variant="link" className="p-0 h-auto text-xs mt-1">
                Configurar
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Pedidos Recentes</span>
              <Link href="/admin/pedidos">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                  Ver todos
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentOrders.length > 0 ? (
                recentOrders.map((order: any) => (
                  <Link key={order.id} href={`/admin/pedidos/${order.id}`}>
                    <div className="flex justify-between items-start border-b pb-3 last:border-0 hover:bg-accent/50 p-2 rounded-md transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{order.order_number}</p>
                        <p className="text-xs text-muted-foreground">{order.customer_name}</p>
                        <p className="text-xs font-semibold text-green-600 mt-1">
                          R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-1">
                        <Badge
                          variant={
                            order.payment_status === "paid"
                              ? "default"
                              : order.payment_status === "pending"
                                ? "secondary"
                                : "destructive"
                          }
                          className="text-xs"
                        >
                          {order.payment_status === "paid" ? "Pago" : order.payment_status === "pending" ? "Pendente" : "Falhou"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {format(new Date(order.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </span>
                      </div>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhum pedido recente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Solicitações Recentes</span>
              <Link href="/admin/solicitacoes">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                  Ver todas
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentRequests.length > 0 ? (
                recentRequests.map((request: any) => (
                  <Link key={request.id} href={`/admin/solicitacoes/${request.id}`}>
                    <div className="flex justify-between items-start border-b pb-3 last:border-0 hover:bg-accent/50 p-2 rounded-md transition-colors cursor-pointer">
                      <div className="flex-1">
                        <p className="font-medium text-sm">{request.customer_name}</p>
                        <p className="text-xs text-muted-foreground">{request.service_type}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(request.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          request.status === "pending"
                            ? "secondary"
                            : request.status === "in_progress"
                              ? "default"
                              : request.status === "completed"
                                ? "default"
                                : "destructive"
                        }
                        className="text-xs"
                      >
                        {request.status === "pending"
                          ? "Pendente"
                          : request.status === "in_progress"
                            ? "Em Andamento"
                            : request.status === "completed"
                              ? "Concluído"
                              : "Cancelado"}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma solicitação recente</p>
              )}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Mensagens Recentes</span>
              <Link href="/admin/mensagens">
                <Button variant="ghost" size="sm" className="h-auto p-0 text-xs">
                  Ver todas
                </Button>
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentMessages.length > 0 ? (
                recentMessages.map((message: any) => (
                  <Link key={message.id} href={`/admin/mensagens/${message.id}`}>
                    <div className="flex justify-between items-start border-b pb-3 last:border-0 hover:bg-accent/50 p-2 rounded-md transition-colors cursor-pointer">
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{message.name}</p>
                        <p className="text-xs text-muted-foreground truncate">{message.subject}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {format(new Date(message.created_at), "dd/MM/yyyy", { locale: ptBR })}
                        </p>
                      </div>
                      <Badge
                        variant={
                          message.status === "new"
                            ? "default"
                            : message.status === "read"
                              ? "secondary"
                              : "default"
                        }
                        className="text-xs ml-2 flex-shrink-0"
                      >
                        {message.status === "new" ? "Nova" : message.status === "read" ? "Lida" : "Respondida"}
                      </Badge>
                    </div>
                  </Link>
                ))
              ) : (
                <p className="text-muted-foreground text-sm">Nenhuma mensagem recente</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <Card>
        <CardHeader>
          <CardTitle>Ações Rápidas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/admin/produtos/novo">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Package className="h-4 w-4" />
                Novo Produto
              </Button>
            </Link>
            <Link href="/admin/softwares/novo">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Code className="h-4 w-4" />
                Novo Software
              </Button>
            </Link>
            <Link href="/admin/servicos/novo">
              <Button variant="outline" className="w-full justify-start gap-2 bg-transparent">
                <Wrench className="h-4 w-4" />
                Novo Serviço
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
