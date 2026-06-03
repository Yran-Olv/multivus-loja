import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Phone, Mail, MapPin, Clock } from "lucide-react"
import { ContactForm } from "@/components/contact-form"

export default function ContatoPage() {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="hero-gradient py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center space-y-6">
            <Badge variant="secondary" className="mb-4">
              Entre em Contato
            </Badge>
            <h1 className="text-4xl md:text-5xl font-bold text-balance">
              Estamos Prontos para <span className="text-primary">Ajudar</span>
            </h1>
            <p className="text-xl text-muted-foreground leading-relaxed">
              Tire suas dúvidas ou solicite um orçamento. Nossa equipe responde rapidamente!
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section className="py-20 bg-background">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
            {/* Contact Info */}
            <div className="space-y-6">
              <div>
                <h2 className="text-3xl font-bold mb-4">Informações de Contato</h2>
                <p className="text-muted-foreground leading-relaxed">
                  Escolha a melhor forma de entrar em contato conosco. Estamos disponíveis para atendê-lo!
                </p>
              </div>

              <div className="space-y-4">
                <Card className="card-glow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Phone className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Telefone / WhatsApp</CardTitle>
                        <CardDescription>(34) 93300-5932</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-glow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Mail className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">E-mail</CardTitle>
                        <CardDescription>suporte@multivus.com.br</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-glow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <MapPin className="h-6 w-6 text-primary" />
                      <div>
                        <CardTitle className="text-lg">Endereço</CardTitle>
                        <CardDescription>
                          ponto comerial em breve!!
                          <br />
                          Santa Juliana, MG - CEP 38175-000
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                </Card>

                <Card className="card-glow">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Clock className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-lg">Horário de Funcionamento</CardTitle>
                    <CardDescription>
                      Segunda a sexta: 08h às 18h  
                      <br />
                      Sábado: 08h às 13h  
                      <br />
                      Atendimento 24h para clientes com contrato
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
</Card>
              </div>
            </div>

            {/* Contact Form */}
            <div>
              <Card className="card-glow">
                <CardHeader>
                  <CardTitle className="text-2xl">Envie uma Mensagem</CardTitle>
                  <CardDescription>Preencha o formulário abaixo e retornaremos em breve</CardDescription>
                </CardHeader>
                <CardContent>
                  <ContactForm />
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
