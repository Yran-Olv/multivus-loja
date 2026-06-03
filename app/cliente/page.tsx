"use client"

import { useState, useEffect, Suspense } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Package, FileText, User, LogOut, Loader2, Eye, EyeOff } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { useRouter, useSearchParams } from "next/navigation"
import { useCustomer } from "@/contexts/CustomerContext"
import { PasswordResetForm } from "@/components/password-reset-form"
import { CustomerAddressFields } from "@/components/customer-address-fields"
import { CustomerProfileForm } from "@/components/customer-profile-form"

function ClientePageContent() {
  const { customer, loading: customerLoading, login, register, logout, refreshCustomer } =
    useCustomer()
  const [loading, setLoading] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [requests, setRequests] = useState<any[]>([])
  const [showPasswordReset, setShowPasswordReset] = useState(false)
  const { toast } = useToast()
  const router = useRouter()
  const searchParams = useSearchParams()

  // Form states
  const [loginEmail, setLoginEmail] = useState("")
  const [loginPassword, setLoginPassword] = useState("")
  const [registerName, setRegisterName] = useState("")
  const [registerEmail, setRegisterEmail] = useState("")
  const [registerPhone, setRegisterPhone] = useState("")
  const [registerPassword, setRegisterPassword] = useState("")
  const [registerAddress, setRegisterAddress] = useState({
    address: "",
    city: "",
    state: "",
    zip_code: "",
  })
  const [registerLoading, setRegisterLoading] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [showLoginPassword, setShowLoginPassword] = useState(false)
  const [showRegisterPassword, setShowRegisterPassword] = useState(false)

  useEffect(() => {
    if (customer) {
      loadCustomerData()
    }
  }, [customer])

  useEffect(() => {
    // Verificar se há código de reset na URL
    const resetCode = searchParams?.get("reset")
    if (resetCode) {
      setShowPasswordReset(true)
    }
  }, [searchParams])

  async function loadCustomerData() {
    if (!customer) return

    setLoading(true)
    try {
      const [ordersRes, requestsRes] = await Promise.all([
        fetch(`/api/orders?email=${encodeURIComponent(customer.email)}`),
        fetch(`/api/service-requests?email=${encodeURIComponent(customer.email)}`),
      ])

      if (ordersRes.ok) {
        const ordersData = await ordersRes.json()
        setOrders(ordersData)
      }

      if (requestsRes.ok) {
        const requestsData = await requestsRes.json()
        setRequests(requestsData)
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar seus dados.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setLoginLoading(true)

    const result = await login(loginEmail, loginPassword)

    if (result.success) {
      toast({
        title: "Login realizado!",
        description: "Bem-vindo de volta!",
      })
      setLoginEmail("")
      setLoginPassword("")
    } else {
      toast({
        title: "Erro ao fazer login",
        description: result.error,
        variant: "destructive",
      })
    }

    setLoginLoading(false)
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault()
    setRegisterLoading(true)

    if (!registerPhone.trim()) {
      toast({
        title: "Telefone obrigatório",
        description: "Informe um telefone para contato e entrega.",
        variant: "destructive",
      })
      setRegisterLoading(false)
      return
    }

    const result = await register({
      name: registerName,
      email: registerEmail,
      phone: registerPhone,
      password: registerPassword,
      address: registerAddress.address,
      city: registerAddress.city,
      state: registerAddress.state,
      zip_code: registerAddress.zip_code,
    })

    if (result.success) {
      toast({
        title: "Conta criada!",
        description: "Bem-vindo! Você já está logado.",
      })
      setRegisterName("")
      setRegisterEmail("")
      setRegisterPhone("")
      setRegisterPassword("")
      setRegisterAddress({ address: "", city: "", state: "", zip_code: "" })
    } else {
      toast({
        title: "Erro ao criar conta",
        description: result.error,
        variant: "destructive",
      })
    }

    setRegisterLoading(false)
  }

  async function handleLogout() {
    await logout()
    setOrders([])
    setRequests([])
    toast({
      title: "Logout realizado",
      description: "Você saiu da sua conta.",
    })
  }

  if (customerLoading) {
    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
            <p className="text-muted-foreground">Carregando...</p>
          </div>
        </div>
      </div>
    )
  }

  if (!customer) {
    // Se há código de reset na URL ou se está mostrando formulário de reset
    const resetCode = searchParams?.get("reset")
    
    if (showPasswordReset || resetCode) {
      return (
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <h1 className="text-3xl font-bold mb-8 text-center">Recuperar Senha</h1>
            <PasswordResetForm
              initialCode={resetCode || undefined}
              onBack={() => {
                setShowPasswordReset(false)
                router.push("/cliente")
              }}
            />
          </div>
        </div>
      )
    }

    return (
      <div className="container mx-auto px-4 py-16">
        <div className="max-w-2xl mx-auto">
          <h1 className="text-3xl font-bold mb-8 text-center">Área do Cliente</h1>

          <Card>
            <CardHeader>
              <CardTitle>Login ou Cadastro</CardTitle>
              <CardDescription>
                Faça login para acessar seus pedidos e solicitações, ou crie uma conta nova.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="login" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="login">Login</TabsTrigger>
                  <TabsTrigger value="register">Cadastro</TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="login-email">Email</Label>
                      <Input
                        id="login-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={loginEmail}
                        onChange={(e) => setLoginEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="login-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          placeholder="Sua senha"
                          value={loginPassword}
                          onChange={(e) => setLoginPassword(e.target.value)}
                          required
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowLoginPassword(!showLoginPassword)}
                        >
                          {showLoginPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <div className="text-right">
                      <Button
                        type="button"
                        variant="link"
                        className="p-0 h-auto text-sm"
                        onClick={() => setShowPasswordReset(true)}
                      >
                        Esqueci minha senha
                      </Button>
                    </div>
                    <Button type="submit" className="w-full" disabled={loginLoading}>
                      {loginLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Entrando...
                        </>
                      ) : (
                        "Entrar"
                      )}
                    </Button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="register-name">Nome Completo</Label>
                      <Input
                        id="register-name"
                        type="text"
                        placeholder="Seu nome completo"
                        value={registerName}
                        onChange={(e) => setRegisterName(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-email">Email</Label>
                      <Input
                        id="register-email"
                        type="email"
                        placeholder="seu@email.com"
                        value={registerEmail}
                        onChange={(e) => setRegisterEmail(e.target.value)}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="register-phone">Telefone / WhatsApp *</Label>
                      <Input
                        id="register-phone"
                        type="tel"
                        placeholder="(34) 99999-9999"
                        value={registerPhone}
                        onChange={(e) => setRegisterPhone(e.target.value)}
                        required
                        minLength={10}
                      />
                    </div>
                    <CustomerAddressFields
                      idPrefix="register"
                      values={registerAddress}
                      onChange={setRegisterAddress}
                    />
                    <div className="space-y-2">
                      <Label htmlFor="register-password">Senha</Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          placeholder="Mínimo 6 caracteres"
                          value={registerPassword}
                          onChange={(e) => setRegisterPassword(e.target.value)}
                          required
                          minLength={6}
                          className="pr-10"
                        />
                        <Button
                          type="button"
                          variant="ghost"
                          size="icon"
                          className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                          onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                        >
                          {showRegisterPassword ? (
                            <EyeOff className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <Eye className="h-4 w-4 text-muted-foreground" />
                          )}
                        </Button>
                      </div>
                    </div>
                    <Button type="submit" className="w-full" disabled={registerLoading}>
                      {registerLoading ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Criando conta...
                        </>
                      ) : (
                        "Criar Conta"
                      )}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-16">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Área do Cliente</h1>
            <p className="text-muted-foreground mt-1">Olá, {customer.name}!</p>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            Sair
          </Button>
        </div>

        <Tabs defaultValue="orders" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="orders">
              <Package className="mr-2 h-4 w-4" />
              Pedidos
            </TabsTrigger>
            <TabsTrigger value="requests">
              <FileText className="mr-2 h-4 w-4" />
              Solicitações
            </TabsTrigger>
            <TabsTrigger value="profile">
              <User className="mr-2 h-4 w-4" />
              Meu cadastro
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Meu cadastro</CardTitle>
                <CardDescription>
                  Atualize nome, telefone e endereço de entrega. Esses dados são usados no checkout.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CustomerProfileForm customer={customer} onSaved={refreshCustomer} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Carregando pedidos...</p>
                </CardContent>
              </Card>
            ) : orders.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Nenhum pedido encontrado</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>Pedido #{order.order_number}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {new Date(order.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-muted-foreground">Status: {order.status}</p>
                        <p className="text-muted-foreground">Pagamento: {order.payment_status}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-2xl font-bold">R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => router.push(`/pedido/${order.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>

          <TabsContent value="requests" className="space-y-4">
            {loading ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
                  <p className="text-muted-foreground">Carregando solicitações...</p>
                </CardContent>
              </Card>
            ) : requests.length === 0 ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <p className="text-muted-foreground">Nenhuma solicitação encontrada</p>
                </CardContent>
              </Card>
            ) : (
              requests.map((request) => (
                <Card key={request.id}>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle>{request.service_type}</CardTitle>
                      <span className="text-sm text-muted-foreground">
                        {new Date(request.created_at).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <p className="text-muted-foreground">Status: {request.status}</p>
                      <p className="text-muted-foreground">Prioridade: {request.priority}</p>
                      {request.estimated_cost && (
                        <p className="text-muted-foreground">
                          Custo estimado: R$ {Number(request.estimated_cost).toFixed(2).replace(".", ",")}
                        </p>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}

export default function ClientePage() {
  return (
    <Suspense
      fallback={
        <div className="container mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4 text-primary" />
              <p className="text-muted-foreground">Carregando...</p>
            </div>
          </div>
        </div>
      }
    >
      <ClientePageContent />
    </Suspense>
  )
}
