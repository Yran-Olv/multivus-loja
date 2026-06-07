import { sql } from "./db"
import { formatDbError } from "./admin-db"

type CountRow = { count: string | number }

const toCount = (rows: CountRow[]): number => Number(rows[0]?.count || 0)

export async function assertCanDeleteProduct(id: number): Promise<void> {
  if (!sql) throw new Error("Database not available")

  const orderRows = (await sql!`
    SELECT COUNT(*)::int AS count FROM order_items WHERE product_id = ${id}
  `) as unknown as CountRow[]

  if (toCount(orderRows) > 0) {
    throw new Error(
      "Este produto está vinculado a pedidos existentes. Desative-o em vez de excluir."
    )
  }
}

export async function deleteProductCascade(id: number): Promise<void> {
  if (!sql) throw new Error("Database not available")

  await assertCanDeleteProduct(id)

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
