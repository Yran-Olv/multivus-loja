"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { Star } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"

interface Review {
  id: number
  customer_name: string
  rating: number
  title: string | null
  comment: string | null
  created_at: Date
}

interface ProductReviewsProps {
  productId: number
}

export function ProductReviews({ productId }: ProductReviewsProps) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const { toast } = useToast()
  const [formData, setFormData] = useState({
    customer_name: "",
    customer_email: "",
    rating: 5,
    title: "",
    comment: "",
  })

  useEffect(() => {
    fetchReviews()
  }, [productId])

  async function fetchReviews() {
    try {
      const response = await fetch(`/api/reviews?product_id=${productId}`)
      const data = await response.json()
      if (response.ok) {
        setReviews(data.reviews)
        setAverage(data.average)
        setTotal(data.total)
      }
    } catch (error) {
      console.error("Erro ao buscar reviews:", error)
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setSubmitting(true)

    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          product_id: productId,
        }),
      })

      if (response.ok) {
        toast({
          title: "Avaliação enviada!",
          description: "Sua avaliação será revisada antes de ser publicada.",
        })
        setFormData({
          customer_name: "",
          customer_email: "",
          rating: 5,
          title: "",
          comment: "",
        })
        fetchReviews()
      } else {
        throw new Error("Erro ao enviar avaliação")
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a avaliação.",
        variant: "destructive",
      })
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <div className="text-muted-foreground">Carregando avaliações...</div>
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Avaliações</CardTitle>
          <div className="flex items-center gap-2">
            <Star className="h-5 w-5 fill-yellow-500 text-yellow-500" />
            <span className="font-bold">{average.toFixed(1)}</span>
            <span className="text-muted-foreground">({total} {total === 1 ? "avaliação" : "avaliações"})</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <Dialog>
          <DialogTrigger asChild>
            <Button>Avaliar Produto</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Avaliar Produto</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <Label>Nome</Label>
                <Input
                  required
                  value={formData.customer_name}
                  onChange={(e) => setFormData({ ...formData, customer_name: e.target.value })}
                />
              </div>
              <div>
                <Label>Email</Label>
                <Input
                  type="email"
                  required
                  value={formData.customer_email}
                  onChange={(e) => setFormData({ ...formData, customer_email: e.target.value })}
                />
              </div>
              <div>
                <Label>Avaliação</Label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((rating) => (
                    <button
                      key={rating}
                      type="button"
                      onClick={() => setFormData({ ...formData, rating })}
                      className="focus:outline-none"
                    >
                      <Star
                        className={`h-6 w-6 ${
                          rating <= formData.rating
                            ? "fill-yellow-500 text-yellow-500"
                            : "text-muted-foreground"
                        }`}
                      />
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label>Título (opcional)</Label>
                <Input
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                />
              </div>
              <div>
                <Label>Comentário (opcional)</Label>
                <Textarea
                  value={formData.comment}
                  onChange={(e) => setFormData({ ...formData, comment: e.target.value })}
                  rows={4}
                />
              </div>
              <Button type="submit" disabled={submitting} className="w-full">
                {submitting ? "Enviando..." : "Enviar Avaliação"}
              </Button>
            </form>
          </DialogContent>
        </Dialog>

        {reviews.length === 0 ? (
          <p className="text-muted-foreground text-center py-8">Nenhuma avaliação ainda. Seja o primeiro a avaliar!</p>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review.id} className="border-b pb-4 last:border-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold">{review.customer_name}</p>
                    <div className="flex items-center gap-1">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <Star
                          key={rating}
                          className={`h-4 w-4 ${
                            rating <= review.rating ? "fill-yellow-500 text-yellow-500" : "text-muted-foreground"
                          }`}
                        />
                      ))}
                    </div>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {new Date(review.created_at).toLocaleDateString("pt-BR")}
                  </span>
                </div>
                {review.title && <p className="font-medium mb-1">{review.title}</p>}
                {review.comment && <p className="text-muted-foreground">{review.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

