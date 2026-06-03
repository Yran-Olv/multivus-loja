import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { AlertCircle } from "lucide-react"

interface AdminDbErrorProps {
  title: string
  message: string
}

export function AdminDbError({ title, message }: AdminDbErrorProps) {
  return (
    <Alert variant="destructive" className="mb-6">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>{title}</AlertTitle>
      <AlertDescription className="space-y-3">
        <p className="font-mono text-xs break-all">{message}</p>
        <p className="text-sm font-normal">
          Na VPS: <code className="text-xs">docker compose logs app --tail 80</code> e{" "}
          <code className="text-xs">bash scripts/update.sh</code>
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/admin/dashboard">Voltar ao dashboard</Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
