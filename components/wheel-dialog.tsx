"use client"

import { useRef, useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { Sparkles, Coins, Crown, Video, Loader2, RotateCw } from "lucide-react"
import {
  wheelStatus,
  drawWheelPrize,
  awardWheelPrize,
  awardWheelPrizeViaAd,
  isJackpotSpin,
} from "@/lib/store"
import { useGameStore } from "@/lib/use-game-store"
import type { WheelPrize } from "@/lib/types"
import { playButtonSfx, playCoinSfx } from "@/lib/audio"

// Segmentos del disco neón: solo iconos/números legibles.
// tier determina el premio tras el spin; aquí solo define el color visual.
// IMPORTANTE: no alterar estos valores ni su orden — definen la alineación
// visual con firstSlotForTier(). Solo se cambia el color/etiqueta visual.
const SEGMENTS = [
  { label: "x49", tier: "low" as const, color: "hsl(var(--primary))" },
  { label: "x250", tier: "jackpot" as const, color: "hsl(var(--accent))" },
  { label: "x15", tier: "low" as const, color: "hsl(var(--neon-pink))" },
  { label: "x75", tier: "mid" as const, color: "hsl(var(--secondary))" },
  { label: "x1", tier: "low" as const, color: "hsl(var(--primary))" },
  { label: "x25", tier: "low" as const, color: "hsl(var(--neon-pink))" },
  { label: "x100", tier: "mid" as const, color: "hsl(var(--accent))" },
  { label: "x10", tier: "low" as const, color: "hsl(var(--primary))" },
]
const SEG_ANGLE = 360 / SEGMENTS.length

function firstSlotForTier(tier: WheelPrize["tier"]): number {
  const idx = SEGMENTS.findIndex((s) => s.tier === tier)
  return idx === -1 ? 0 : idx
}

export function WheelDialog({
  open,
  onOpenChange,
}: {
  open: boolean
  onOpenChange: (v: boolean) => void
}) {
  const status = wheelStatus()
  const state = useGameStore()
  const [rotation, setRotation] = useState(0)
  const [spinDuration, setSpinDuration] = useState(0)
  const [spinning, setSpinning] = useState(false)
  const [result, setResult] = useState<WheelPrize | null>(null)
  const [adActive, setAdActive] = useState(false)
  const spinningRef = useRef(false)

  function doSpin(viaAd: boolean) {
    if (spinningRef.current) return
    if (state.bannedByAnticheat) {
      toast.error("Cuenta congelada por anticheat.")
      return
    }
    if (!viaAd && status.spinsToday >= status.maxSpins) {
      toast.error(state.isVip ? "Ya usaste tus 2 giros VIP de hoy." : "Ya usaste tu giro diario.")
      return
    }
    if (viaAd && !status.adAvailable) {
      toast.error("Ya usaste el giro por anuncio de hoy. Vuelve mañana.")
      return
    }
    playButtonSfx()
    spinningRef.current = true
    setSpinning(true)
    setResult(null)

    // LÓGICA INTACTA: mismo cálculo de prize, slot, turnos y duración.
    const prize = drawWheelPrize()
    const slot = firstSlotForTier(prize.tier)
    const slotCenter = slot * SEG_ANGLE + SEG_ANGLE / 2
    const turns = isJackpotSpin(prize) ? 10 : 6
    const duration = isJackpotSpin(prize) ? 7000 : 4400
    const base = rotation - (rotation % 360)
    const target = base + turns * 360 + (360 - slotCenter)

    setSpinDuration(duration)
    requestAnimationFrame(() => setRotation(target))

    window.setTimeout(() => {
      if (viaAd) {
        awardWheelPrizeViaAd(prize)
      } else {
        awardWheelPrize(prize)
      }
      playCoinSfx()
      setResult(prize)
      setSpinning(false)
      spinningRef.current = false
      if (isJackpotSpin(prize)) {
        toast.success(`¡JACKPOT ÉPICO! +${prize.amount} monedas`)
      } else {
        toast.success(`+${prize.amount} monedas`)
      }
    }, duration)
  }

  function handleAdSpin() {
    setAdActive(true)
    window.setTimeout(() => {
      setAdActive(false)
      doSpin(true)
    }, 5000)
  }

  const spinsLeft = status.maxSpins - status.spinsToday
  const usedFree = status.spinsToday >= status.maxSpins

  return (
    <Dialog open={open} onOpenChange={(v) => !spinning && onOpenChange(v)}>
      <DialogContent className="max-w-sm overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-glow-gold">
            <Sparkles className="size-5 text-accent" aria-hidden /> Ruleta de la Suerte
          </DialogTitle>
          <DialogDescription>
            {state.isVip
              ? "VIP: 2 giros diarios gratis automáticos."
              : "1 giro gratis diario + 1 giro extra por anuncio."}
          </DialogDescription>
        </DialogHeader>

        {state.bannedByAnticheat && (
          <div className="rounded-xl border border-destructive/60 bg-destructive/10 px-3 py-2 text-center text-xs font-bold text-destructive">
            Cuenta congelada por anticheat. Ruleta deshabilitada.
          </div>
        )}

        <div className="flex flex-col items-center gap-5">
          {/* === DISCO REDESÑADO === */}
          <div className="relative size-72">
            {/* Halo exterior animado */}
            <div className="absolute -inset-3 rounded-full bg-[radial-gradient(circle,hsl(var(--accent)/20%)_0%,transparent_70%)] blur-md" aria-hidden />

            {/* Anillo metálico dorado exterior con bisel */}
            <div
              className="absolute inset-0 rounded-full border-[6px] shadow-[0_0_24px_hsl(var(--accent)/50%),inset_0_2px_4px_rgba(255,255,255,0.3)]"
              style={{
                borderColor: "hsl(var(--accent))",
                background:
                  "conic-gradient(from 0deg, hsl(var(--accent)), #fde68a, hsl(var(--accent)), #b45309, hsl(var(--accent)))",
              }}
              aria-hidden
            />

            {/* Luces perimetrales (24 LEDs dorados pulsantes) */}
            {Array.from({ length: 24 }).map((_, i) => {
              const angle = (i / 24) * Math.PI * 2
              const r = 50
              const x = Math.cos(angle) * r
              const y = Math.sin(angle) * r
              const jackpot = i % 2 === 0
              return (
                <span
                  key={i}
                  className="absolute size-2.5 rounded-full"
                  style={{
                    top: `calc(50% + ${y}% - 5px)`,
                    left: `calc(50% + ${x}% - 5px)`,
                    background: jackpot ? "hsl(var(--accent))" : "#fde68a",
                    boxShadow: jackpot
                      ? "0 0 8px hsl(var(--accent))"
                      : "0 0 6px #fde68a",
                    animation: `pulse-glow ${1.2 + (i % 4) * 0.25}s ease-in-out infinite`,
                    animationDelay: `${(i % 6) * 0.15}s`,
                    opacity: spinning ? 0.4 : 0.85,
                  }}
                  aria-hidden
                />
              )
            })}

            {/* Puntero dorado elegante (triángulo con brillo) */}
            <div className="absolute left-1/2 top-[-8px] z-30 -translate-x-1/2" aria-hidden>
              <div className="relative">
                <div className="h-0 w-0 border-x-[14px] border-t-[26px] border-x-transparent border-t-accent drop-shadow-[0_3px_6px_hsl(var(--accent)/90%)]" />
                <div className="absolute left-1/2 top-1 h-3 w-3 -translate-x-1/2 rounded-full bg-yellow-200 shadow-[0_0_8px_hsl(var(--accent))]" />
              </div>
            </div>

            {/* Disco interior con segmentos */}
            <div
              className="absolute inset-3 rounded-full border-[3px] border-yellow-300/40 shadow-glow-primary"
              style={{
                transform: `rotate(${rotation}deg)`,
                transition: spinDuration
                  ? `transform ${spinDuration}ms cubic-bezier(0.17, 0.67, 0.12, 0.99)`
                  : undefined,
                background: `conic-gradient(${SEGMENTS.map((s, i) => {
                  const start = i * SEG_ANGLE
                  const end = (i + 1) * SEG_ANGLE
                  return `${s.color} ${start}deg ${end}deg`
                }).join(", ")})`,
              }}
            >
              {/* Separadores dorados entre segmentos */}
              {SEGMENTS.map((_, i) => {
                const angle = i * SEG_ANGLE
                return (
                  <div
                    key={`sep-${i}`}
                    className="absolute left-1/2 top-1/2 h-[50%] w-[2px] origin-bottom"
                    style={{
                      transform: `translate(-50%, -100%) rotate(${angle}deg)`,
                      background:
                        "linear-gradient(to top, hsl(var(--accent)/40%), hsl(var(--accent)))",
                    }}
                    aria-hidden
                  />
                )
              })}

              {/* Etiquetas alineadas radialmente */}
              {SEGMENTS.map((s, i) => {
                const angle = i * SEG_ANGLE + SEG_ANGLE / 2
                const rad = (angle * Math.PI) / 180
                const r = 34 // % desde el centro
                const x = 50 + r * Math.cos(rad)
                const y = 50 + r * Math.sin(rad)
                return (
                  <span
                    key={i}
                    className="absolute font-mono text-base font-black text-background drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                    style={{
                      left: `${x}%`,
                      top: `${y}%`,
                      transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    }}
                  >
                    {s.label}
                  </span>
                )
              })}
            </div>

            {/* Centro del disco (hub metálico con brillo) */}
            <div className="absolute left-1/2 top-1/2 z-20 size-14 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-yellow-300 bg-card shadow-[0_0_12px_hsl(var(--accent)/60%),inset_0_2px_4px_rgba(255,255,255,0.2)]">
              <div className="absolute inset-1 rounded-full bg-gradient-to-b from-yellow-200/30 to-transparent" aria-hidden />
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <Sparkles className="size-5 text-accent" aria-hidden />
              </div>
            </div>
          </div>

          {/* Resultado */}
          {result ? (
            <div className="flex items-center gap-2 rounded-xl border border-accent/50 bg-accent/15 px-5 py-2.5 text-lg font-black text-accent shadow-glow-gold animate-pulse-glow">
              <Coins className="size-5" aria-hidden /> +{result.amount} monedas
            </div>
          ) : null}

          {/* === BOTÓN GIRAR REDESÑADO === */}
          {usedFree && !state.isVip && status.adAvailable ? (
            <Button
              onClick={handleAdSpin}
              disabled={spinning || state.bannedByAnticheat}
              className="w-full gap-2 py-5 text-base font-bold shadow-glow-primary"
            >
              <Video className="size-5" aria-hidden /> Ver Anuncio para Giro Extra
            </Button>
          ) : usedFree ? (
            <Button disabled className="w-full py-5">
              Vuelve mañana para tu próximo giro
            </Button>
          ) : (
            <Button
              onClick={() => doSpin(false)}
              disabled={spinning || state.bannedByAnticheat}
              className="group w-full gap-2 py-6 text-lg font-black shadow-glow-gold"
            >
              {spinning ? (
                <>
                  <Loader2 className="size-5 animate-spin" /> Girando…
                </>
              ) : (
                <>
                  <RotateCw className="size-5 transition-transform group-hover:rotate-180" aria-hidden />
                  GIRAR Gratis ({spinsLeft} restante{spinsLeft === 1 ? "" : "s"})
                </>
              )}
            </Button>
          )}

          {state.isVip && (
            <div className="flex items-center gap-1 text-[11px] text-accent">
              <Crown className="size-3" aria-hidden /> VIP: giro extra gratis disponible automáticamente.
            </div>
          )}
        </div>

        {/* Overlay de anuncio simulado */}
        {adActive && (
          <div className="absolute inset-0 z-50 flex flex-col items-center justify-center gap-3 bg-black/95">
            <Loader2 className="size-8 animate-spin text-accent" />
            <p className="font-bold text-foreground">Viendo anuncio para giro extra…</p>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
