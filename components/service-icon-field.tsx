"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { LucideIconPicker } from "@/components/lucide-icon-picker"
import { ServiceIcon } from "@/components/service-icon"
import { ImageIcon } from "lucide-react"

interface ServiceIconFieldProps {
  defaultValue?: string
  required?: boolean
}

export function ServiceIconField({ defaultValue = "wrench", required }: ServiceIconFieldProps) {
  const [icon, setIcon] = useState(defaultValue || "wrench")
  const [pickerOpen, setPickerOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor="icon">Ícone do serviço</Label>
      <input type="hidden" name="icon" value={icon} required={required} />
      <div className="flex gap-2">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border bg-muted/50">
          <ServiceIcon name={icon} className="h-5 w-5 text-primary" />
        </div>
        <Input
          readOnly
          value={icon}
          placeholder="Clique em escolher ícone"
          className="bg-muted/30 cursor-default"
          onClick={() => setPickerOpen(true)}
        />
        <Button type="button" variant="outline" onClick={() => setPickerOpen(true)} className="shrink-0">
          <ImageIcon className="h-4 w-4 mr-2" />
          Escolher
        </Button>
      </div>
      <p className="text-xs text-muted-foreground">
        Catálogo de ícones para informática e assistência técnica — sem precisar digitar o nome manualmente.
      </p>
      <LucideIconPicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        value={icon}
        onSelect={setIcon}
      />
    </div>
  )
}
