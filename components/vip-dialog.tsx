"use client"

import { useEffect, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Crown, Sparkles, Coins, ShieldCheck, Loader2 } from "lucide-react"
import { useGameStore } from "@/lib/use-game-store"
import { purchaseVipGooglePlay } from "@/lib/store"
import { toast } from "sonner"

type PurchasePhase = "idle" | "processing" | "done"

export function VipDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const isVip = useGameStore().isVip
  const [phase, setPhase] = useState<PurchasePhase>("idle")

  useEffect(() => {
    if (!open) {
      const t = window.setTimeout(() => setPhase("idle"), 300)
      return () => window.clearTimeout(t)
    }
  }, [open])

  function handlePurchase() {
    setPhase("processing")
    // Simula la alerta/loading de Google Play Billing.
    window.setTimeout(() => {
      const result = purchaseVipGooglePlay()
      if (result.ok) {
        setPhase("done")
        toast.success("¡Compra VIP completada! Anuncios omitidos y prioridad en reclamos.")
      } else {
        toast.error("No se pudo procesar el pago. Intenta de nuevo.")
        setPhase("idle")
      }
    }, 2600)
  }

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onOpenChange(v)}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-accent text-glow-gold">
            <Crown className="size-5" aria-hidden /> Volverse VIP - Compra Única
          </DialogTitle>
          <DialogDescription>
            Pago único y permanente mediante Google Play Billing. Sin suscripción recurrente.
          </DialogDescription>
        </DialogHeader>

        {/* Beneficios */}
        <div className="flex flex-col gap-3">
          <Benefit
            icon={<Coins className="size-5 text-accent" />}
            title="Anuncios omitidos siempre"
            description="Sin banners AdMob ni anuncios recompensados. Saltos automáticos."
          />
          <Benefit
            icon={<Sparkles className="size-5 text-primary" />}
            title="2 giros diarios en la ruleta"
            description="Dobles oportunidades de conseguir el jackpot de 101-500 monedas."
          />
          <Benefit
            icon={<Crown className="size-5 text-neon-pink" />}
            title="Prioridad en reclamos de diamantes"
            description="Tus reclamos pasan al frente de la cola de envio."
          />
          <Benefit
            icon={<ShieldCheck className="size-5 text-accent" />}
            title="Badge VIP en el historial"
            description="Identidad destacada dentro del juego."
          />
        </div>

        {/* CTA */}
        <div className="mt-2">
          {isVip ? (
            <div className="flex items-center justify-center gap-2 rounded-xl border border-accent/50 bg-accent/10 p-4 text-accent">
              <Crown className="size-5" aria-hidden />
              <span className="font-bold">Ya eres VIP. ¡Gracias por tu compra!</span>
            </div>
          ) : phase === "processing" ? (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-primary/40 bg-primary/5 p-4">
              <Loader2 className="size-6 animate-spin text-primary" />
              <p className="text-center text-sm text-foreground">
                Procesando pago seguro mediante Google Play Billing
              </p>
              <code className="rounded bg-secondary px-2 py-1 text-[11px] text-muted-foreground">
                com.garrdash.vip
              </code>
            </div>
          ) : phase === "done" ? (
            <div className="flex flex-col items-center gap-2 rounded-xl border border-accent/50 bg-accent/10 p-4">
              <Crown className="size-6 text-accent" />
              <p className="font-bold text-accent">¡VIP activado!</p>
            </div>
          ) : (
            <Button
              onClick={handlePurchase}
              className="w-full gap-2 font-bold shadow-glow-gold"
              size="lg"
            >
              <Crown className="size-5" aria-hidden />
              Comprar VIP (pago único)
            </Button>
          )}
          {!isVip && phase === "idle" && (
            <p className="mt-2 flex items-center justify-center gap-1 text-center text-[11px] text-muted-foreground">
              <ShieldCheck className="size-3" aria-hidden /> Pago procesado por Google Play · Sin costos recurrentes
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

function Benefit({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode
  title: string
  description: string
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border/60 bg-card/70 p-3">
      <div className="mt-0.5">{icon}</div>
      <div>
        <p className="text-sm font-semibold">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
    </div>
  )
}
