"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { MessageSquare, X, Send } from "lucide-react"
import { useToast } from "@/hooks/use-toast"

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [sessionId, setSessionId] = useState<string>("")
  const [isMounted, setIsMounted] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { toast } = useToast()

  // Inicializar sessionId apenas no cliente para evitar problemas de hidratação
  useEffect(() => {
    setIsMounted(true)
    let id = localStorage.getItem("chat_session_id")
    if (!id) {
      id = `chat-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      localStorage.setItem("chat_session_id", id)
    }
    setSessionId(id)
  }, [])

  useEffect(() => {
    if (isOpen && sessionId) {
      fetchMessages()
      const interval = setInterval(fetchMessages, 3000) // Polling a cada 3 segundos
      return () => clearInterval(interval)
    }
  }, [isOpen, sessionId])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  async function fetchMessages() {
    if (!sessionId) return
    try {
      const response = await fetch(`/api/chat?session_id=${sessionId}`)
      if (response.ok) {
        const data = await response.json()
        setMessages(data)
      }
    } catch (error) {
      console.error("Erro ao buscar mensagens:", error)
    }
  }

  async function handleSend() {
    if (!input.trim() || loading || !sessionId) return

    const messageText = input.trim()
    setInput("")
    setLoading(true)

    // Adicionar mensagem localmente imediatamente
    const tempMessage = {
      id: Date.now(),
      session_id: sessionId,
      sender_type: "customer",
      sender_name: "Você",
      message: messageText,
      created_at: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, tempMessage])

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          session_id: sessionId,
          sender_type: "customer",
          sender_name: "Cliente",
          message: messageText,
        }),
      })

      if (!response.ok) {
        throw new Error("Erro ao enviar mensagem")
      }

      fetchMessages()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem.",
        variant: "destructive",
      })
      setMessages((prev) => prev.filter((m) => m.id !== tempMessage.id))
    } finally {
      setLoading(false)
    }
  }

  // Não renderizar até que o componente esteja montado no cliente
  if (!isMounted) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={() => setIsOpen(true)}
          disabled
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          size="lg"
          className="rounded-full h-14 w-14 shadow-lg"
          onClick={() => setIsOpen(true)}
        >
          <MessageSquare className="h-6 w-6" />
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-w-[calc(100vw-3rem)]">
      <Card className="shadow-2xl h-[600px] flex flex-col">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-lg">Suporte</CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
            <X className="h-4 w-4" />
          </Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-8">
                <p>Olá! Como posso ajudar?</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.sender_type === "customer" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.sender_type === "customer"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    <p className="text-sm font-medium mb-1">{msg.sender_name}</p>
                    <p className="text-sm">{msg.message}</p>
                    <p className="text-xs opacity-70 mt-1">
                      {new Date(msg.created_at).toLocaleTimeString("pt-BR", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          <div className="border-t p-4">
            <form
              onSubmit={(e) => {
                e.preventDefault()
                handleSend()
              }}
              className="flex gap-2"
            >
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                disabled={loading}
              />
              <Button type="submit" disabled={loading || !input.trim()}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

