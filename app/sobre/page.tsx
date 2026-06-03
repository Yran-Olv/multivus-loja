import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Award, Target, Users, Heart, CheckCircle2 } from "lucide-react"

export default function SobrePage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              Sobre Nós
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Sua Parceira em Soluções de <span className="text-primary">Tecnologia</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Mais de 10 anos transformando desafios tecnológicos em soluções eficientes
            </p>
          </div>
        </div>
      </section>

      {/* Story Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
          <h2 className="text-3xl font-bold mb-6">Nossa História</h2>
          <div className="prose prose-invert max-w-none space-y-4 text-muted-foreground leading-relaxed">
            <p>
              A <strong>MULTIVUS</strong> nasceu em 2022 com um propósito claro: oferecer soluções em tecnologia com
              qualidade, transparência e atendimento próximo, atendendo residências e empresas da região de
              Santa Juliana – MG.
            </p>

            <p>
              A empresa é conduzida por um único profissional, responsável por todas as etapas do serviço —
              do atendimento ao diagnóstico, execução e suporte. Isso garante um contato direto com o cliente,
              mais agilidade nas soluções e total responsabilidade sobre cada trabalho realizado.
            </p>

            <p>
              Com experiência em assistência técnica, manutenção preventiva, montagem de computadores,
              venda de equipamentos e soluções digitais, a MULTIVUS se destaca pelo cuidado com cada detalhe
              e pelo compromisso em entregar soluções eficientes e duradouras.
            </p>

            <p>
              Mais do que prestar serviços de informática, a MULTIVUS tem como missão ser um parceiro
              tecnológico de confiança, oferecendo suporte honesto, soluções sob medida e evolução constante
              junto aos seus clientes.
            </p>
          </div>

          </div>
        </div>
      </section>

      {/* Values Section */}
      <section className="py-20 bg-card">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Nossos Valores</h2>
            <p className="text-muted-foreground text-lg">Princípios que guiam nosso trabalho diário</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            <Card className="card-glow text-center">
              <CardHeader>
                <Award className="h-12 w-12 text-primary mb-4 mx-auto" />
                <CardTitle>Qualidade</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Excelência em cada serviço e produto oferecido aos nossos clientes
                </p>
              </CardContent>
            </Card>

            <Card className="card-glow text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mb-4 mx-auto" />
                <CardTitle>Compromisso</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Dedicação total para resolver seus problemas tecnológicos
                </p>
              </CardContent>
            </Card>

            <Card className="card-glow text-center">
              <CardHeader>
                <Heart className="h-12 w-12 text-primary mb-4 mx-auto" />
                <CardTitle>Transparência</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">Comunicação clara e honesta em todos os orçamentos</p>
              </CardContent>
            </Card>

            <Card className="card-glow text-center">
              <CardHeader>
                <Target className="h-12 w-12 text-primary mb-4 mx-auto" />
                <CardTitle>Inovação</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  Sempre atualizados com as últimas tecnologias do mercado
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Differentials Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto">
            <h2 className="text-3xl font-bold mb-8 text-center">Nossos Diferenciais</h2>
            <div className="space-y-4">
              {[
                "Técnicos certificados e constantemente treinados",
                "Garantia de 30 dias em todos os serviços realizados",
                "Uso exclusivo de peças originais e de qualidade",
                "Atendimento personalizado e diagnóstico detalhado",
                "Orçamento gratuito e sem compromisso",
                "Suporte pós-venda para dúvidas e orientações",
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3">
                  <CheckCircle2 className="h-6 w-6 text-primary mt-0.5 flex-shrink-0" />
                  <p className="text-muted-foreground">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
