"use client"

import { useEffect } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  useEffect(() => {
    console.error("[AdminError]", error)
  }, [error])

  return (
    <div className="max-w-lg space-y-4">
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Erro no painel admin</AlertTitle>
        <AlertDescription className="space-y-2">
          <p>{error.message || "Exceção no servidor ao renderizar esta página."}</p>
          {error.digest ? (
            <p className="text-xs font-mono text-muted-foreground">Digest: {error.digest}</p>
          ) : null}
          <p className="text-sm">
            Veja os logs: <code className="text-xs">docker compose logs app --tail 100</code>
          </p>
        </AlertDescription>
      </Alert>
      <div className="flex gap-2">
        <Button onClick={() => reset()}>Tentar novamente</Button>
        <Button variant="outline" asChild>
          <Link href="/admin/dashboard">Dashboard</Link>
        </Button>
      </div>
    </div>
  )
}
