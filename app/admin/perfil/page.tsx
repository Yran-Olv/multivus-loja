"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { useToast } from "@/hooks/use-toast"
import { Loader2, User, Lock, Save } from "lucide-react"
import { useRouter } from "next/navigation"

export default function PerfilPage() {
  const { toast } = useToast()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [user, setUser] = useState<{
    id: number
    username: string
    email: string
    full_name: string | null
  } | null>(null)
  const [formData, setFormData] = useState({
    full_name: "",
    current_password: "",
    new_password: "",
    confirm_password: "",
  })

  useEffect(() => {
    fetchProfile()
  }, [])

  const fetchProfile = async () => {
    try {
      const response = await fetch("/admin/api/auth/me", {
        credentials: "include",
      })

      if (response.ok) {
        const data = await response.json()
        setUser(data.user)
        setFormData((prev) => ({
          ...prev,
          full_name: data.user?.full_name || "",
        }))
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível carregar seus dados.",
          variant: "destructive",
        })
        router.push("/admin/login")
      }
    } catch (error) {
      console.error("[Perfil] Error fetching profile:", error)
      toast({
        title: "Erro",
        description: "Erro ao carregar perfil.",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)

    try {
      // Validar senha se estiver preenchendo
      if (formData.new_password) {
        if (formData.new_password.length < 6) {
          toast({
            title: "Erro",
            description: "A nova senha deve ter pelo menos 6 caracteres.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        if (formData.new_password !== formData.confirm_password) {
          toast({
            title: "Erro",
            description: "As senhas não coincidem.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }

        if (!formData.current_password) {
          toast({
            title: "Erro",
            description: "Digite sua senha atual para alterar a senha.",
            variant: "destructive",
          })
          setSaving(false)
          return
        }
      }

      const response = await fetch("/admin/api/auth/profile", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          full_name: formData.full_name.trim() || null,
          current_password: formData.current_password || null,
          new_password: formData.new_password || null,
        }),
      })

      const data = await response.json()

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description: "Perfil atualizado com sucesso.",
        })
        
        // Limpar campos de senha
        setFormData((prev) => ({
          ...prev,
          current_password: "",
          new_password: "",
          confirm_password: "",
        }))
        
        // Atualizar dados do usuário
        if (data.user) {
          setUser(data.user)
        }
        
        // Recarregar página para atualizar dados
        router.refresh()
      } else {
        toast({
          title: "Erro",
          description: data.error || "Não foi possível atualizar o perfil.",
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error("[Perfil] Error updating profile:", error)
      toast({
        title: "Erro",
        description: "Erro ao atualizar perfil.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Meu Perfil</h1>
        <p className="text-muted-foreground mt-2">
          Gerencie suas informações pessoais e senha
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Informações Pessoais */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Informações Pessoais
            </CardTitle>
            <CardDescription>
              Atualize seu nome que aparecerá nos posts do blog
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="username">Usuário</Label>
                <Input
                  id="username"
                  value={user?.username || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O nome de usuário não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  value={user?.email || ""}
                  disabled
                  className="bg-muted"
                />
                <p className="text-xs text-muted-foreground">
                  O email não pode ser alterado
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="full_name">Nome Completo</Label>
                <Input
                  id="full_name"
                  placeholder="Seu nome completo"
                  value={formData.full_name}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, full_name: e.target.value }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Este nome aparecerá como autor nos posts do blog
                </p>
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Salvar Alterações
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Alterar Senha */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lock className="h-5 w-5" />
              Alterar Senha
            </CardTitle>
            <CardDescription>
              Digite sua senha atual e a nova senha
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="current_password">Senha Atual</Label>
                <Input
                  id="current_password"
                  type="password"
                  placeholder="Digite sua senha atual"
                  value={formData.current_password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      current_password: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="new_password">Nova Senha</Label>
                <Input
                  id="new_password"
                  type="password"
                  placeholder="Digite a nova senha"
                  value={formData.new_password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      new_password: e.target.value,
                    }))
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo de 6 caracteres
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirm_password">Confirmar Nova Senha</Label>
                <Input
                  id="confirm_password"
                  type="password"
                  placeholder="Confirme a nova senha"
                  value={formData.confirm_password}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      confirm_password: e.target.value,
                    }))
                  }
                />
              </div>

              <Button type="submit" disabled={saving} className="w-full">
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  <>
                    <Lock className="mr-2 h-4 w-4" />
                    Alterar Senha
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

