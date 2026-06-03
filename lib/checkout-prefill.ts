export type CheckoutFormData = {
  customer_name: string
  customer_email: string
  customer_phone: string
  customer_address: string
  city: string
  state: string
  zip_code: string
  notes: string
}

export type CustomerLike = {
  name: string
  email: string
  phone: string | null
  address: string | null
  city: string | null
  state: string | null
  zip_code: string | null
}

export type LastOrderLike = {
  customer_name?: string
  customer_email?: string
  customer_phone?: string
  customer_address?: string
  notes?: string | null
}

function isBlank(value: string | null | undefined): boolean {
  if (!value?.trim()) return true
  const digits = value.replace(/\D/g, "")
  if (digits === "00000000" || digits === "00000") return true
  return false
}

/** Extrai cidade/UF/CEP do formato gravado no pedido: "..., Cidade, UF - CEP: 12345-678" */
export function parseOrderShippingLine(line: string): {
  customer_address: string
  city: string
  state: string
  zip_code: string
} {
  const raw = line.trim()
  if (!raw) {
    return { customer_address: "", city: "", state: "", zip_code: "" }
  }

  const cepMatch = raw.match(/CEP:\s*(\d{5}-?\d{3})/i)
  const zip_code = cepMatch
    ? cepMatch[1].replace(/(\d{5})(\d{3})/, "$1-$2")
    : ""

  const withoutCep = raw.replace(/,?\s*CEP:\s*\d{5}-?\d{3}/i, "").trim()
  const stateMatch = withoutCep.match(/,\s*([A-Za-z]{2})\s*$/)
  const state = stateMatch ? stateMatch[1].toUpperCase() : ""

  let rest = withoutCep
  if (stateMatch) {
    rest = withoutCep.slice(0, stateMatch.index).trim()
  }

  const parts = rest.split(",").map((p) => p.trim()).filter(Boolean)
  let city = ""
  let customer_address = rest

  if (parts.length >= 2) {
    city = parts[parts.length - 1]
    customer_address = parts.slice(0, -1).join(", ")
  } else if (parts.length === 1) {
    customer_address = parts[0]
  }

  return { customer_address, city, state, zip_code }
}

/** Preenche cidade/logradouro pelo CEP quando o perfil não tem tudo */
export async function enrichCheckoutFromCep(
  data: CheckoutFormData
): Promise<CheckoutFormData> {
  const cepDigits = data.zip_code.replace(/\D/g, "")
  if (cepDigits.length !== 8) return data

  const needsCity = data.city.trim().length < 2
  const needsAddress = data.customer_address.trim().length < 5
  if (!needsCity && !needsAddress) return data

  try {
    const res = await fetch(`https://viacep.com.br/ws/${cepDigits}/json/`)
    const via = (await res.json()) as {
      erro?: boolean
      localidade?: string
      uf?: string
      logradouro?: string
      bairro?: string
    }
    if (via.erro) return data

    const street = [via.logradouro, via.bairro].filter(Boolean).join(", ")
    const currentAddress = data.customer_address.trim()
    let customer_address = currentAddress
    if (needsAddress && street) {
      customer_address = currentAddress || street
    } else if (currentAddress.length > 0 && currentAddress.length < 10 && street) {
      customer_address = `${street}, ${currentAddress}`
    }
    return {
      ...data,
      customer_address,
      city: needsCity ? via.localidade || data.city : data.city,
      state: (data.state || via.uf || "").toUpperCase().slice(0, 2),
      zip_code: data.zip_code || cepDigits.replace(/(\d{5})(\d{3})/, "$1-$2"),
    }
  } catch {
    return data
  }
}

/** Garante payload aceito pela API de pedidos (endereço com contexto de cidade/CEP) */
export function prepareOrderCheckoutData(data: CheckoutFormData): CheckoutFormData {
  const city = data.city.trim()
  const state = data.state.trim().toUpperCase().slice(0, 2)
  const zip = data.zip_code.trim()
  let address = data.customer_address.trim()

  if (address.length < 10) {
    address = [address, city, state, zip ? `CEP: ${zip}` : ""].filter(Boolean).join(", ")
  }

  return {
    ...data,
    customer_address: address,
    city,
    state,
    zip_code: zip,
  }
}

export function getMissingCheckoutFields(data: CheckoutFormData): string[] {
  const missing: string[] = []
  if (data.customer_name.trim().length < 3) missing.push("customer_name")
  if (!data.customer_email.includes("@")) missing.push("customer_email")
  if (data.customer_phone.replace(/\D/g, "").length < 10) missing.push("customer_phone")
  if (data.customer_address.trim().length < 5) missing.push("customer_address")
  if (data.city.trim().length < 2) missing.push("city")
  if (data.state.trim().length !== 2) missing.push("state")
  const cep = data.zip_code.replace(/\D/g, "")
  if (cep.length < 8 || cep === "00000000") missing.push("zip_code")
  return missing
}

export function formatDeliverySummary(data: CheckoutFormData): string {
  const lines = [
    data.customer_name,
    data.customer_email,
    data.customer_phone,
    data.customer_address,
    [data.city, data.state].filter(Boolean).join(" — "),
    data.zip_code ? `CEP ${data.zip_code}` : "",
  ].filter((l) => l?.trim())
  return lines.join("\n")
}

export function buildCheckoutFormData(
  customer: CustomerLike,
  lastOrder?: LastOrderLike | null
): CheckoutFormData {
  const fromOrder = lastOrder?.customer_address
    ? parseOrderShippingLine(lastOrder.customer_address)
    : { customer_address: "", city: "", state: "", zip_code: "" }

  const pick = (profile: string | null | undefined, fallback: string) => {
    if (!isBlank(profile)) return profile!.trim()
    return fallback.trim()
  }

  let customer_address = pick(customer.address, fromOrder.customer_address)
  const notes = lastOrder?.notes?.trim() || ""
  if (notes && customer_address && !customer_address.toLowerCase().includes(notes.toLowerCase())) {
    customer_address = `${customer_address}\n${notes}`
  } else if (notes && !customer_address) {
    customer_address = notes
  }

  return {
    customer_name: pick(customer.name, lastOrder?.customer_name || ""),
    customer_email: pick(customer.email, lastOrder?.customer_email || ""),
    customer_phone: pick(customer.phone, lastOrder?.customer_phone || ""),
    customer_address,
    city: pick(customer.city, fromOrder.city),
    state: pick(customer.state, fromOrder.state),
    zip_code: pick(customer.zip_code, fromOrder.zip_code),
    notes,
  }
}
