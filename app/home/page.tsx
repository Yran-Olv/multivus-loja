import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Wrench, ShoppingCart, Shield, Zap, Award, ArrowRight, Cpu, HardDrive, Wifi, Monitor, MessageSquare, Code } from "lucide-react"

export default function HomePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient py-20 md:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              <Zap className="mr-1 h-3 w-3" />
              Atendimento Rápido e Profissional
            </Badge>
            <h1 className="text-4xl md:text-6xl font-bold leading-tight text-balance">
              Soluções Completas em <span className="text-primary">Informática</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed text-pretty">
              Assistência técnica especializada, venda de equipamentos e suporte em TI para residências e empresas.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/solicitar-servico">
                <Button size="lg" className="w-full sm:w-auto">
                  <Wrench className="mr-2 h-5 w-5" />
                  Solicitar Assistência
                </Button>
              </Link>
              <Link href="/produtos">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Ver Produtos
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Por que escolher a MULTIVUS?</h2>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              Experiência, qualidade e compromisso com seus equipamentos
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <Card className="card-glow">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Award className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Mais de 5 Anos de Experiência</CardTitle>
                <CardDescription>
                  Atendemos centenas de clientes em Santa Juliana e região
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Garantia em Todos os Serviços</CardTitle>
                <CardDescription>
                  Confiança e qualidade em cada atendimento realizado
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Zap className="h-8 w-8 text-primary" />
                </div>
                <CardTitle>Atendimento Rápido</CardTitle>
                <CardDescription>
                  Resposta ágil e solução eficiente para seus problemas
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      {/* Services Preview Section */}
      <section className="py-20 bg-muted/50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossos Serviços</h2>
              <p className="text-muted-foreground text-lg">Soluções completas para suas necessidades</p>
            </div>
            <Link href="/servicos" className="hidden md:block">
              <Button variant="outline">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="card-glow">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Cpu className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">Manutenção</CardTitle>
                <CardDescription>Limpeza, otimização e reparos</CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <HardDrive className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">Formatação</CardTitle>
                <CardDescription>Instalação de sistemas operacionais</CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Wifi className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">Rede</CardTitle>
                <CardDescription>Configuração de redes e Wi-Fi</CardDescription>
              </CardHeader>
            </Card>

            <Card className="card-glow">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Monitor className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">Suporte Remoto</CardTitle>
                <CardDescription>Assistência técnica online</CardDescription>
              </CardHeader>
            </Card>
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/servicos">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                Ver Todos os Serviços
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Software Preview Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4">Softwares MULTIVUS</h2>
              <p className="text-muted-foreground text-lg">Soluções desenvolvidas por nós para o seu negócio</p>
            </div>
            <Link href="/softwares" className="hidden md:block">
              <Button variant="outline">
                Ver Todos
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Multivus OS – Sistema de Gestão Empresarial */}
            <Card className="card-glow flex flex-col h-full">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Monitor className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">Multivus OS – Sistema de Gestão Empresarial</CardTitle>
                <CardDescription>Sistema completo para empresas que vendem e prestam serviços.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                    <li>Ordens de Serviço (OS) com PDF e QR Code PIX</li>
                    <li>Cadastro de clientes e fornecedores</li>
                    <li>Controle de estoque e produtos</li>
                    <li>Financeiro (débitos, entradas, saídas, relatórios)</li>
                    <li>Relatórios gerenciais</li>
                    <li>Multiusuários e permissões</li>
                    <li>Funciona no computador, tablet e celular (PWA)</li>
                    <li>Online e preparado para uso contínuo</li>
                  </ul>
                  <p className="text-sm font-semibold mb-2">Indicado para:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mb-6">
                    <li>Assistência técnica</li>
                    <li>Oficinas mecânicas</li>
                    <li>Autopeças</li>
                    <li>Lojas de informática</li>
                    <li>Materiais de construção</li>
                    <li>Prestadores de serviços em geral</li>
                  </ul>
                </div>
                <Link href="/contato" className="mt-auto">
                  <Button className="w-full">Faça seu Orçamento</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Multivus WhatsApp Empresarial */}
            <Card className="card-glow flex flex-col h-full">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <MessageSquare className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">Multivus WhatsApp Empresarial</CardTitle>
                <CardDescription>Plataforma profissional de atendimento via WhatsApp.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-4">
                    <li>Multiatendentes no mesmo número</li>
                    <li>Filas e setores de atendimento</li>
                    <li>Mensagens automáticas e fora de expediente</li>
                    <li>Histórico completo de conversas</li>
                    <li>Envio de mensagens, mídia e documentos</li>
                    <li>Organização por tickets</li>
                    <li>Ideal para empresas que precisam escalar atendimento</li>
                  </ul>
                  <p className="text-sm font-semibold mb-2">Indicado para:</p>
                  <ul className="list-disc list-inside text-xs text-muted-foreground space-y-1 mb-6">
                    <li>Empresas</li>
                    <li>Clínicas</li>
                    <li>Lojas</li>
                    <li>Prestadores de serviço</li>
                    <li>Suporte técnico</li>
                  </ul>
                </div>
                <Link href="/contato" className="mt-auto">
                  <Button className="w-full">Faça seu Orçamento</Button>
                </Link>
              </CardContent>
            </Card>

            {/* Sistemas Personalizados (Projetos Sob Demanda) */}
            <Card className="card-glow flex flex-col h-full">
              <CardHeader>
                <div className="p-3 bg-primary/10 rounded-lg w-fit mb-3">
                  <Code className="h-10 w-10 text-primary" />
                </div>
                <CardTitle className="text-lg">Sistemas Personalizados</CardTitle>
                <CardDescription>Desenvolvemos soluções exclusivas para suas necessidades.</CardDescription>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col">
                <div className="flex-1">
                  <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 mb-6">
                    <li>Sistemas internos para empresas</li>
                    <li>Plataformas específicas por segmento</li>
                    <li>Integrações com APIs</li>
                    <li>Sistemas offline/online híbridos</li>
                    <li>Projetos acadêmicos e comerciais</li>
                  </ul>
                </div>
                <Link href="/contato" className="mt-auto">
                  <Button className="w-full">Faça seu Orçamento</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-8 md:hidden">
            <Link href="/softwares">
              <Button variant="outline" className="w-full sm:w-auto bg-transparent">
                Ver Todos os Softwares
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary/10">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <h2 className="text-3xl md:text-4xl font-bold">
              Precisa de Assistência Técnica?
            </h2>
            <p className="text-xl text-muted-foreground">
              Entre em contato conosco e receba um orçamento personalizado
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link href="/contato">
                <Button size="lg" className="w-full sm:w-auto">
                  Fale Conosco
                </Button>
              </Link>
              <Link href="/solicitar-servico">
                <Button size="lg" variant="outline" className="w-full sm:w-auto bg-transparent">
                  Solicitar Serviço
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-12 bg-background border-t">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-3xl font-bold text-primary mb-2">5+</div>
              <div className="text-sm text-muted-foreground">Anos de Experiência</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">500+</div>
              <div className="text-sm text-muted-foreground">Clientes Atendidos</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">100%</div>
              <div className="text-sm text-muted-foreground">Satisfação</div>
            </div>
            <div>
              <div className="text-3xl font-bold text-primary mb-2">24/7</div>
              <div className="text-sm text-muted-foreground">Suporte Disponível</div>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}

