"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Loader2 } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { CustomerAddressFields } from "@/components/customer-address-fields"
import type { Customer } from "@/contexts/CustomerContext"

type Props = {
  customer: Customer
  onSaved: () => void
}

export function CustomerProfileForm({ customer, onSaved }: Props) {
  const { toast } = useToast()
  const [saving, setSaving] = useState(false)
  const [name, setName] = useState(customer.name)
  const [phone, setPhone] = useState(customer.phone || "")
  const [addressFields, setAddressFields] = useState({
    address: customer.address || "",
    city: customer.city || "",
    state: customer.state || "",
    zip_code: customer.zip_code || "",
  })

  useEffect(() => {
    setName(customer.name)
    setPhone(customer.phone || "")
    setAddressFields({
      address: customer.address || "",
      city: customer.city || "",
      state: customer.state || "",
      zip_code: customer.zip_code || "",
    })
  }, [customer])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch("/api/customers/profile", {
        method: "PATCH",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          phone,
          address: addressFields.address,
          city: addressFields.city,
          state: addressFields.state,
          zip_code: addressFields.zip_code,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        toast({
          title: "Erro ao salvar",
          description: data.error || "Verifique os dados e tente novamente.",
          variant: "destructive",
        })
        return
      }
      toast({ title: "Cadastro atualizado", description: "Seus dados foram salvos com sucesso." })
      onSaved()
    } catch {
      toast({
        title: "Erro de conexão",
        description: "Não foi possível salvar. Tente novamente.",
        variant: "destructive",
      })
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="profile-email">Email</Label>
        <Input id="profile-email" type="email" value={customer.email} disabled className="bg-muted" />
        <p className="text-xs text-muted-foreground mt-1">O email não pode ser alterado aqui.</p>
      </div>
      <div>
        <Label htmlFor="profile-name">Nome completo *</Label>
        <Input
          id="profile-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          minLength={3}
        />
      </div>
      <div>
        <Label htmlFor="profile-phone">Telefone / WhatsApp *</Label>
        <Input
          id="profile-phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
          minLength={10}
          placeholder="(34) 99999-9999"
        />
      </div>
      <CustomerAddressFields
        idPrefix="profile"
        values={addressFields}
        onChange={setAddressFields}
      />
      <Button type="submit" disabled={saving}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Salvando...
          </>
        ) : (
          "Salvar cadastro"
        )}
      </Button>
    </form>
  )
}
