import fs from "node:fs"
import https from "node:https"
import {
  efiCertificateMissingMessage,
  resolveEfiCertificatePath,
} from "./certificate-path"
import type { EfiConfigRow, EfiEnvironment, EfiTokenResponse } from "./types"

export function getEfiPixBaseUrl(environment: EfiEnvironment): string {
  return environment === "production"
    ? "https://pix.api.efipay.com.br"
    : "https://pix-h.api.efipay.com.br"
}

function buildAgent(config: EfiConfigRow): https.Agent | undefined {
  const certPath = resolveEfiCertificatePath(config.certificate_path)
  if (!certPath) return undefined
  if (!fs.existsSync(certPath)) {
    throw new Error(efiCertificateMissingMessage(config.certificate_path))
  }
  return new https.Agent({
    pfx: fs.readFileSync(certPath),
    passphrase: config.certificate_passphrase || "",
  })
}

function request<T>(
  url: string,
  options: {
    method: string
    headers?: Record<string, string>
    body?: string
    agent?: https.Agent
  }
): Promise<{ status: number; data: T; raw: string }> {
  return new Promise((resolve, reject) => {
    const parsed = new URL(url)
    const req = https.request(
      {
        hostname: parsed.hostname,
        port: parsed.port || 443,
        path: `${parsed.pathname}${parsed.search}`,
        method: options.method,
        headers: options.headers,
        agent: options.agent,
      },
      (res) => {
        const chunks: Buffer[] = []
        res.on("data", (c) => chunks.push(c))
        res.on("end", () => {
          const raw = Buffer.concat(chunks).toString("utf8")
          let data: T
          try {
            data = raw ? (JSON.parse(raw) as T) : ({} as T)
          } catch {
            reject(new Error(`Resposta inválida da Efí (${res.statusCode}): ${raw.slice(0, 200)}`))
            return
          }
          resolve({ status: res.statusCode || 0, data, raw })
        })
      }
    )
    req.on("error", reject)
    if (options.body) req.write(options.body)
    req.end()
  })
}

export async function efiGetAccessToken(config: EfiConfigRow): Promise<string> {
  const baseUrl = getEfiPixBaseUrl(config.environment)
  const agent = buildAgent(config)
  const auth = Buffer.from(`${config.client_id}:${config.client_secret}`).toString("base64")

  const { status, data, raw } = await request<EfiTokenResponse>(
    `${baseUrl}/oauth/token`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ grant_type: "client_credentials" }),
      agent,
    }
  )

  if (status < 200 || status >= 300 || !data.access_token) {
    console.error("[Efí] OAuth error:", raw)
    throw new Error("Falha na autenticação Efí (verifique credenciais e certificado .p12)")
  }

  return data.access_token
}

export async function efiApiRequest<T>(
  config: EfiConfigRow,
  path: string,
  options: { method: string; body?: unknown; token?: string }
): Promise<T> {
  const baseUrl = getEfiPixBaseUrl(config.environment)
  const agent = buildAgent(config)
  const token = options.token || (await efiGetAccessToken(config))

  const { status, data, raw } = await request<T>(`${baseUrl}${path}`, {
    method: options.method,
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    agent,
  })

  if (status < 200 || status >= 300) {
    console.error(`[Efí] ${options.method} ${path}:`, raw)
    throw new Error(`Erro na API Efí (${status})`)
  }

  return data
}

/** txid: 26–35 caracteres alfanuméricos */
export function generateEfiTxid(orderId: number): string {
  const raw = `MV${orderId}${Date.now()}`.replace(/[^a-zA-Z0-9]/g, "")
  if (raw.length >= 26) return raw.slice(0, 35)
  return raw.padEnd(26, "0").slice(0, 35)
}

export function formatEfiAmount(value: number): string {
  return Number(value).toFixed(2)
}
