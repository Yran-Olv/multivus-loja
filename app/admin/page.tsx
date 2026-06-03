import { redirect } from "next/navigation"

export default function AdminPage() {
  // Redirect to dashboard overview
  redirect("/admin/dashboard")
}
