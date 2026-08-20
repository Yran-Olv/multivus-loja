import { sql } from "./db"
import { formatDbError } from "./admin-db"

type CountRow = { count: string | number }

const toCount = (rows: CountRow[]): number => Number(rows[0]?.count || 0)

export async function countProductOrders(id: number): Promise<number> {
  if (!sql) throw new Error("Database not available")

  const orderRows = (await sql!`
    SELECT COUNT(*)::int AS count FROM order_items WHERE product_id = ${id}
  `) as unknown as CountRow[]

  return toCount(orderRows)
}

export async function isProductInactive(id: number): Promise<boolean> {
  if (!sql) throw new Error("Database not available")

  const rows = (await sql!`
    SELECT is_active FROM products WHERE id = ${id} LIMIT 1
  `) as Array<{ is_active: boolean }>

  if (!rows.length) {
    throw new Error("Produto não encontrado.")
  }

  return !rows[0].is_active
}

/** Remove FK do produto nos pedidos; nome/preço ficam em product_name/product_price. */
export async function detachProductFromOrders(id: number): Promise<void> {
  if (!sql) throw new Error("Database not available")

  await sql!`
    UPDATE order_items
    SET product_id = NULL
    WHERE product_id = ${id}
  `
}

export async function deleteProductCascade(id: number): Promise<void> {
  if (!sql) throw new Error("Database not available")

  const orderCount = await countProductOrders(id)

  if (orderCount > 0) {
    const inactive = await isProductInactive(id)
    if (!inactive) {
      throw new Error(
        "Este produto já apareceu em pedidos. Desative-o ou dê baixa (venda externa) antes de excluir."
      )
    }
    await detachProductFromOrders(id)
  }

  try {
    await sql!`DELETE FROM reviews WHERE product_id = ${id}`
    await sql!`DELETE FROM products WHERE id = ${id}`
  } catch (error) {
    throw new Error(formatDbError(error))
  }
}

export async function deleteServiceSafe(id: number): Promise<void> {
  if (!sql) throw new Error("Database not available")

  try {
    await sql!`DELETE FROM services WHERE id = ${id}`
  } catch (error) {
    throw new Error(formatDbError(error))
  }
}

export async function deleteSoftwareSafe(id: number): Promise<void> {
  if (!sql) throw new Error("Database not available")

  try {
    await sql!`DELETE FROM softwares WHERE id = ${id}`
  } catch (error) {
    throw new Error(formatDbError(error))
  }
}
