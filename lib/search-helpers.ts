/**
 * Função para remover acentos de uma string
 * Útil para busca mais flexível
 */
export function removeAccents(str: string): string {
  return str
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
}

/**
 * Divide uma string de busca em palavras individuais
 * e cria termos de busca para cada palavra
 */
export function createSearchTerms(query: string): string[] {
  const normalized = removeAccents(query.trim().toLowerCase())
  // Dividir por espaços e filtrar palavras vazias
  const words = normalized.split(/\s+/).filter((w) => w.length > 0)
  
  // Retornar palavras individuais e também o termo completo
  const terms = [...words]
  if (words.length > 1) {
    terms.push(normalized) // Adicionar termo completo também
  }
  
  return terms
}

/**
 * Cria condições SQL para busca flexível
 * Busca por palavras parciais, completas e com similaridade
 */
export function createSearchConditions(
  searchTerms: string[],
  fields: string[]
): string {
  const conditions: string[] = []

  for (const term of searchTerms) {
    if (term.length < 2) continue

    const termPattern = `%${term}%`
    const fieldConditions: string[] = []

    for (const field of fields) {
      // Busca exata (case-insensitive, sem acentos)
      fieldConditions.push(
        `unaccent(LOWER(${field})) LIKE unaccent(LOWER($${fieldConditions.length * searchTerms.length + 1}))`
      )
      
      // Busca por palavra parcial
      fieldConditions.push(
        `unaccent(LOWER(${field})) LIKE unaccent(LOWER($${fieldConditions.length * searchTerms.length + 1}))`
      )
    }

    if (fieldConditions.length > 0) {
      conditions.push(`(${fieldConditions.join(" OR ")})`)
    }
  }

  return conditions.length > 0 ? conditions.join(" AND ") : "1=1"
}

/**
 * Cria uma query de busca otimizada usando similaridade de texto
 * Funciona mesmo sem extensões PostgreSQL especiais
 */
export function buildFuzzySearchQuery(
  baseQuery: string,
  searchTerm: string,
  searchFields: string[]
): string {
  const terms = createSearchTerms(searchTerm)
  if (terms.length === 0) return baseQuery

  // Criar condições para cada termo
  const conditions: string[] = []

  for (const term of terms) {
    if (term.length < 2) continue

    const termPattern = `%${term}%`
    const fieldConditions: string[] = []

    for (const field of searchFields) {
      // Busca por palavra parcial (mais comum)
      fieldConditions.push(`${field} ILIKE '${termPattern.replace(/'/g, "''")}'`)
      
      // Busca por palavra que começa com o termo (maior relevância)
      fieldConditions.push(`${field} ILIKE '${term}%'.replace(/'/g, "''")}'`)
    }

    if (fieldConditions.length > 0) {
      conditions.push(`(${fieldConditions.join(" OR ")})`)
    }
  }

  const whereClause = conditions.length > 0 ? conditions.join(" AND ") : "1=1"
  
  return `${baseQuery} AND (${whereClause})`
}

