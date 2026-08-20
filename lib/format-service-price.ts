/** Formata preço de serviço para exibição (sempre sob orçamento na loja). */
export function formatServicePriceLabel(
  priceFrom: number | string | null | undefined
): { headline: string; detail: string } {
  const raw = priceFrom === null || priceFrom === undefined ? "" : String(priceFrom).trim()
  const value = raw ? Number(raw.replace(",", ".")) : NaN

  if (!raw || !Number.isFinite(value) || value <= 0) {
    return {
      headline: "Sobre orçamento",
      detail: "Valores conforme diagnóstico do serviço"
    }
  }

  const formatted = value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL"
  })

  return {
    headline: "A partir de",
    detail: `${formatted} — sob orçamento`
  }
}

export function formatServicePriceShort(
  priceFrom: number | string | null | undefined
): string {
  const { headline, detail } = formatServicePriceLabel(priceFrom)
  if (headline === "Sobre orçamento") return headline
  return `${headline} ${detail.replace(" — sob orçamento", "")} — sob orçamento`
}
