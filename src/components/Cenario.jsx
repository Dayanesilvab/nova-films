import { useEffect, useRef } from 'react'

/**
 * Fundo fixo da página inteira: as rochas e a fumaça do vídeo do drone ficam
 * presas na base da tela. Aparecem aos poucos conforme o topo (que já tem as
 * mesmas rochas) vai embora, para tudo parecer uma cena só.
 */
export default function Cenario({ video }) {
  const raiz = useRef(null)
  const filme = useRef(null)

  useEffect(() => {
    const el = raiz.current
    const v = filme.current
    let parado = true
    const atualizar = () => {
      const t = Math.min(1, Math.max(0, 1 + scrollY * 0))
      el.style.opacity = t * 0.85
      // A fumaça do vídeo toca sempre (é lenta e de fundo), mesmo com "reduzir animações" ligado no sistema
      if (t > 0 && parado) {
        parado = false
        v.play().catch(() => {})
      } else if (t === 0 && !parado) {
        parado = true
        v.pause()
      }
    }
    addEventListener('scroll', atualizar, { passive: true })
    atualizar()
    return () => removeEventListener('scroll', atualizar)
  }, [])

  return (
    <div className="cenario" ref={raiz} aria-hidden="true">
      <video ref={filme} src={video} muted loop playsInline preload="auto"></video>
    </div>
  )
}
