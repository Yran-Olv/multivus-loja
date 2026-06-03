/**
 * Formata e organiza o conteúdo HTML do blog para melhor legibilidade
 */

export function formatBlogContent(html: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  let formatted = html

  // 1. Normalizar quebras de linha e espaços
  formatted = formatted
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n")
    .replace(/\n{3,}/g, "\n\n") // Máximo 2 quebras de linha consecutivas
    .replace(/[ \t]+/g, " ") // Múltiplos espaços viram um só
    .trim()

  // 2. Garantir que parágrafos estejam envolvidos em <p>
  // Se o texto não começar com tag HTML, envolver em <p>
  if (!formatted.match(/^<[a-z]/i)) {
    // Dividir por quebras de linha duplas e criar parágrafos
    const paragraphs = formatted.split(/\n\n+/).filter((p) => p.trim())
    formatted = paragraphs.map((p) => {
      const trimmed = p.trim()
      if (trimmed.match(/^<[a-z]/i)) {
        return trimmed // Já é HTML
      }
      return `<p>${trimmed.replace(/\n/g, " ")}</p>`
    }).join("\n\n")
  }

  // 3. Garantir espaçamento adequado entre elementos
  formatted = formatted
    .replace(/<\/p>\s*<p>/g, "</p>\n\n<p>") // Espaço entre parágrafos
    .replace(/<\/h([1-6])>\s*<p>/g, "</h$1>\n\n<p>") // Espaço após títulos
    .replace(/<\/ul>\s*<p>/g, "</ul>\n\n<p>") // Espaço após listas
    .replace(/<\/ol>\s*<p>/g, "</ol>\n\n<p>") // Espaço após listas ordenadas
    .replace(/<\/blockquote>\s*<p>/g, "</blockquote>\n\n<p>") // Espaço após citações

  // 4. Garantir que listas estejam bem formatadas
  formatted = formatted
    .replace(/<li>\s*([^<]+)\s*<\/li>/g, "<li>$1</li>") // Limpar espaços em <li>
    .replace(/<ul>\s*/g, "<ul>\n")
    .replace(/<\/ul>/g, "\n</ul>")
    .replace(/<ol>\s*/g, "<ol>\n")
    .replace(/<\/ol>/g, "\n</ol>")

  // 5. Garantir que títulos tenham hierarquia correta
  // Se houver <h1> no conteúdo (não deve, pois já temos no layout), converter para <h2>
  formatted = formatted.replace(/<h1>/g, "<h2>").replace(/<\/h1>/g, "</h2>")

  // 6. Garantir que imagens sejam responsivas
  formatted = formatted.replace(
    /<img([^>]*)>/g,
    (match, attrs) => {
      // Se não tiver loading, adicionar
      if (!attrs.includes("loading")) {
        attrs += ' loading="lazy"'
      }
      // Se não tiver alt, adicionar
      if (!attrs.includes("alt=")) {
        attrs += ' alt="Imagem do artigo"'
      }
      return `<img${attrs}>`
    }
  )

  // 7. Garantir que links abram em nova aba
  formatted = formatted.replace(
    /<a([^>]*)>/g,
    (match, attrs) => {
      // Se não tiver target, adicionar
      if (!attrs.includes("target=")) {
        attrs += ' target="_blank" rel="noopener noreferrer"'
      }
      return `<a${attrs}>`
    }
  )

  // 8. Limpar tags vazias
  formatted = formatted
    .replace(/<p>\s*<\/p>/g, "")
    .replace(/<div>\s*<\/div>/g, "")
    .replace(/<span>\s*<\/span>/g, "")

  // 9. Garantir que código inline esteja em <code>
  // Não fazer nada aqui, deixar o usuário usar <code> manualmente

  // 10. Normalizar espaçamento final
  formatted = formatted
    .replace(/\n{3,}/g, "\n\n") // Máximo 2 quebras consecutivas
    .trim()

  return formatted
}

/**
 * Sanitiza e formata o conteúdo HTML do blog
 */
export function sanitizeAndFormatBlogContent(html: string): string {
  if (!html || typeof html !== "string") {
    return ""
  }

  // Primeiro sanitizar (remover scripts, iframes, etc)
  let safe = html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, "")
    .replace(/<iframe\b[^<]*(?:(?!<\/iframe>)<[^<]*)*<\/iframe>/gi, "")
    .replace(/on\w+="[^"]*"/gi, "")
    .replace(/on\w+='[^']*'/gi, "")
    .replace(/javascript:/gi, "")
    .replace(/data:text\/html/gi, "")

  // Depois formatar
  return formatBlogContent(safe)
}

