export type EfiEnvironment = "sandbox" | "production"

export interface EfiConfigRow {
  id: number
  client_id: string
  client_secret: string
  environment: EfiEnvironment
  pix_key: string
  certificate_path: string | null
  certificate_passphrase: string | null
  webhook_url: string | null
  is_active: boolean
}

export interface EfiTokenResponse {
  access_token: string
  token_type: string
  expires_in: number
}
