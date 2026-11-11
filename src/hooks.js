import { useEffect } from 'react'
import Lenis from 'lenis'
import gsap from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

export const semMovimento = () => matchMedia('(prefers-reduced-motion: reduce)').matches

// Vidro líquido: informa ao CSS onde o mouse está dentro de cada elemento .vidro (o brilho segue o mouse)
export function useVidro() {
  useEffect(() => {
    const mover = (e) => {
      const el = e.target.closest?.('.vidro')
      if (!el) return
      const r = el.getBoundingClientRect()
      el.style.setProperty('--mx', `${e.clientX - r.left}px`)
      el.style.setProperty('--my', `${e.clientY - r.top}px`)
    }
    addEventListener('pointermove', mover, { passive: true })
    return () => removeEventListener('pointermove', mover)
  }, [])
}

// Revela elementos .revelar quando entram na tela
export function useRevelar() {
  useEffect(() => {
    const io = new IntersectionObserver(
      (entradas) =>
        entradas.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('visivel')
            io.unobserve(e.target)
          }
        }),
      { threshold: 0.15 },
    )
    document.querySelectorAll('.revelar').forEach((el) => io.observe(el))
    return () => io.disconnect()
  }, [])
}

// Movimento sutil dos elementos [data-parallax] conforme o mouse
export function useParallaxMouse() {
  useEffect(() => {
    if (semMovimento() || !matchMedia('(pointer: fine)').matches) return
    const pecas = [...document.querySelectorAll('[data-parallax]')]
    let mx = 0, my = 0, x = 0, y = 0, quadroId = 0
    const quadro = () => {
      x += (mx - x) * 0.06
      y += (my - y) * 0.06
      pecas.forEach((el) => {
        const f = Number(el.dataset.parallax)
        el.style.transform = `translate3d(${(x * f).toFixed(2)}px, ${(y * f * 0.6).toFixed(2)}px, 0)`
      })
      quadroId = Math.abs(mx - x) > 0.001 || Math.abs(my - y) > 0.001 ? requestAnimationFrame(quadro) : 0
    }
    const mover = (e) => {
      mx = e.clientX / innerWidth - 0.5
      my = e.clientY / innerHeight - 0.5
      if (!quadroId) quadroId = requestAnimationFrame(quadro)
    }
    addEventListener('pointermove', mover, { passive: true })
    return () => {
      removeEventListener('pointermove', mover)
      cancelAnimationFrame(quadroId)
    }
  }, [])
}

// Rolagem suave com inércia (Lenis), sincronizada com as animações do GSAP
export function useScrollSuave() {
  useEffect(() => {
    if (semMovimento()) return
    gsap.registerPlugin(ScrollTrigger)
    const lenis = new Lenis({ lerp: 0.085, wheelMultiplier: 0.95, anchors: { offset: -70 } })
    lenis.on('scroll', ScrollTrigger.update)
    const quadro = (tempo) => lenis.raf(tempo * 1000)
    gsap.ticker.add(quadro)
    gsap.ticker.lagSmoothing(0)
    return () => {
      gsap.ticker.remove(quadro)
      lenis.destroy()
    }
  }, [])
}