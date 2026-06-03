"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { lookupCep } from "@/lib/viacep"

export type AddressFieldValues = {
  address: string
  city: string
  state: string
  zip_code: string
}

type Props = {
  idPrefix: string
  values: AddressFieldValues
  onChange: (values: AddressFieldValues) => void
  required?: boolean
}

export function CustomerAddressFields({ idPrefix, values, onChange, required = true }: Props) {
  const [loadingCep, setLoadingCep] = useState(false)

  const handleCepBlur = async () => {
    setLoadingCep(true)
    try {
      const via = await lookupCep(values.zip_code)
      if (!via) return
      const street = [via.logradouro, via.bairro].filter(Boolean).join(", ")
      onChange({
        address: values.address.trim() || street,
        city: values.city.trim() || via.localidade,
        state: values.state.trim() || via.uf,
        zip_code: values.zip_code,
      })
    } finally {
      setLoadingCep(false)
    }
  }

  return (
    <div className="space-y-4 border-t pt-4">
      <p className="text-sm font-medium">Endereço de entrega</p>
      <div>
        <Label htmlFor={`${idPrefix}-zip`}>CEP {required && "*"}</Label>
        <Input
          id={`${idPrefix}-zip`}
          value={values.zip_code}
          onChange={(e) => onChange({ ...values, zip_code: e.target.value })}
          onBlur={() => void handleCepBlur()}
          placeholder="38175-000"
          required={required}
        />
        {loadingCep && <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>}
      </div>
      <div>
        <Label htmlFor={`${idPrefix}-address`}>Rua, número e complemento {required && "*"}</Label>
        <Textarea
          id={`${idPrefix}-address`}
          value={values.address}
          onChange={(e) => onChange({ ...values, address: e.target.value })}
          rows={2}
          placeholder="Rua Exemplo, 123 — Casa"
          required={required}
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor={`${idPrefix}-city`}>Cidade {required && "*"}</Label>
          <Input
            id={`${idPrefix}-city`}
            value={values.city}
            onChange={(e) => onChange({ ...values, city: e.target.value })}
            required={required}
          />
        </div>
        <div>
          <Label htmlFor={`${idPrefix}-state`}>UF {required && "*"}</Label>
          <Input
            id={`${idPrefix}-state`}
            value={values.state}
            onChange={(e) => onChange({ ...values, state: e.target.value.toUpperCase().slice(0, 2) })}
            maxLength={2}
            placeholder="MG"
            required={required}
          />
        </div>
      </div>
    </div>
  )
}
