import { sql } from "@/lib/db"
import bcrypt from "bcrypt"

export interface AdminUser {
  id: number
  username: string
  email: string
  full_name: string | null
  is_active: boolean
}

export async function verifyCredentials(username: string, password: string): Promise<AdminUser | null> {
  try {
    // Verificar se o banco está disponível
    if (!sql) {
      console.error("[Auth] Database not available")
      return null
    }

    const users = await sql!`
      SELECT id, username, email, full_name, password_hash, is_active
      FROM admin_users
      WHERE username = ${username} AND is_active = true
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    const user = users[0]
    const isValid = await bcrypt.compare(password, user.password_hash)

    if (!isValid) {
      return null
    }

    // Retornar usuário sem a senha
    return {
      id: user.id,
      username: user.username,
      email: user.email,
      full_name: user.full_name,
      is_active: user.is_active,
    }
  } catch (error) {
    console.error("[Auth] Error verifying credentials:", error)
    return null
  }
}

export async function getUserById(id: number): Promise<AdminUser | null> {
  try {
    // Verificar se o banco está disponível
    if (!sql) {
      console.error("[Auth] Database not available")
      return null
    }

    const users = await sql!`
      SELECT id, username, email, full_name, is_active
      FROM admin_users
      WHERE id = ${id} AND is_active = true
      LIMIT 1
    `

    if (users.length === 0) {
      return null
    }

    return users[0] as AdminUser
  } catch (error) {
    console.error("[Auth] Error getting user:", error)
    return null
  }
}

export async function updatePassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    if (!sql) {
      console.error("[Auth] Database not available")
      return false
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10)
    await sql!`
      UPDATE admin_users
      SET password_hash = ${hashedPassword}
      WHERE id = ${userId}
    `
    return true
  } catch (error) {
    console.error("[Auth] Error updating password:", error)
    return false
  }
}

