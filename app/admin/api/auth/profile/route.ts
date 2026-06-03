import { type NextRequest, NextResponse } from "next/server"
import { sql } from "@/lib/db"
import { verifyAuth } from "@/lib/middleware"
import bcrypt from "bcryptjs"

export async function GET(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    const users = await sql!`
      SELECT id, username, email, full_name
      FROM admin_users
      WHERE id = ${auth.userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    return NextResponse.json({ user: users[0] })
  } catch (error) {
    console.error("[API] Error fetching profile:", error)
    return NextResponse.json({ error: "Erro ao buscar perfil" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const auth = await verifyAuth(request)
    if (!auth.isValid || !auth.userId) {
      return NextResponse.json({ error: "Não autenticado" }, { status: 401 })
    }

    const body = await request.json()
    const { full_name, current_password, new_password } = body

    if (!sql) {
      return NextResponse.json({ error: "Database not available" }, { status: 503 })
    }

    // Buscar usuário atual
    const users = await sql!`
      SELECT id, username, email, full_name, password_hash
      FROM admin_users
      WHERE id = ${auth.userId}
    `

    if (users.length === 0) {
      return NextResponse.json({ error: "Usuário não encontrado" }, { status: 404 })
    }

    const user = users[0]
    let updateFullName = false
    let updatePassword = false
    let newPasswordHash = ""

    // Atualizar nome
    if (full_name !== undefined) {
      updateFullName = true
    }

    // Atualizar senha se fornecida
    if (new_password) {
      if (!current_password) {
        return NextResponse.json(
          { error: "Senha atual é obrigatória para alterar a senha" },
          { status: 400 }
        )
      }

      // Verificar senha atual
      const isValidPassword = await bcrypt.compare(current_password, user.password_hash)
      if (!isValidPassword) {
        return NextResponse.json(
          { error: "Senha atual incorreta" },
          { status: 400 }
        )
      }

      // Validar nova senha
      if (new_password.length < 6) {
        return NextResponse.json(
          { error: "A nova senha deve ter pelo menos 6 caracteres" },
          { status: 400 }
        )
      }

      // Hash da nova senha
      const salt = await bcrypt.genSalt(10)
      newPasswordHash = await bcrypt.hash(new_password, salt)
      updatePassword = true
    }

    if (!updateFullName && !updatePassword) {
      return NextResponse.json({ error: "Nenhuma alteração fornecida" }, { status: 400 })
    }

    // Atualizar no banco
    let updatedUsers
    const safeFullName = full_name ?? null
    if (updateFullName && updatePassword) {
      updatedUsers = await sql!`
        UPDATE admin_users
        SET full_name = ${safeFullName},
            password_hash = ${newPasswordHash}
        WHERE id = ${auth.userId}
        RETURNING id, username, email, full_name
      `
    } else if (updateFullName) {
      updatedUsers = await sql!`
        UPDATE admin_users
        SET full_name = ${safeFullName}
        WHERE id = ${auth.userId}
        RETURNING id, username, email, full_name
      `
    } else {
      updatedUsers = await sql!`
        UPDATE admin_users
        SET password_hash = ${newPasswordHash}
        WHERE id = ${auth.userId}
        RETURNING id, username, email, full_name
      `
    }

    if (updatedUsers.length === 0) {
      return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      user: updatedUsers[0],
      message: new_password ? "Senha e perfil atualizados com sucesso" : "Perfil atualizado com sucesso",
    })
  } catch (error) {
    console.error("[API] Error updating profile:", error)
    return NextResponse.json({ error: "Erro ao atualizar perfil" }, { status: 500 })
  }
}

