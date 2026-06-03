export type ViaCepResult = {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

export async function lookupCep(cepRaw: string): Promise<ViaCepResult | null> {
  const cep = cepRaw.replace(/\D/g, "")
  if (cep.length !== 8) return null
  try {
    const res = await fetch(`https://viacep.com.br/ws/${cep}/json/`)
    const data = (await res.json()) as ViaCepResult & { erro?: boolean }
    if (data.erro) return null
    return {
      logradouro: data.logradouro || "",
      bairro: data.bairro || "",
      localidade: data.localidade || "",
      uf: data.uf || "",
    }
  } catch {
    return null
  }
}

export function formatCep(cepRaw: string): string {
  const digits = cepRaw.replace(/\D/g, "")
  if (digits.length !== 8) return cepRaw
  return digits.replace(/(\d{5})(\d{3})/, "$1-$2")
}
