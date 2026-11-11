import { useEffect, useRef } from 'react'
import { equipamentos } from '../conteudo.js'
import DroneVoando from './DroneVoando.jsx'

// Vídeo em loop (câmera com a luz piscando), tocando só enquanto está na tela
function VideoEmLoop({ video, alt }) {
  const filme = useRef(null)
  useEffect(() => {
    const el = filme.current
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) el.play().catch(() => {})
      else el.pause()
    })
    io.observe(el)
    return () => io.disconnect()
  }, [])
  return (
    <div className="equip-palco">
      <div className="orbita" aria-hidden="true"></div>
      <video ref={filme} className="palco-video" src={video} muted loop playsInline preload="metadata" aria-label={alt}></video>
    </div>
  )
}

export default function Equipamento({ tipo, invertido }) {
  const dados = equipamentos[tipo]
  return (
    <section className={`equip ${invertido ? 'invertido' : ''}`} id={tipo}>
      <div className="equip-texto revelar">
        <p className="indice"><b>{dados.indice}</b> / 05 <i></i></p>
        <h2>{dados.titulo}</h2>
        <p>{dados.texto}</p>
        <a className="link-seta" href="#servicos">Conheça mais <span>→</span></a>
      </div>
      {dados.voa || dados.modelo3d ? (
        <DroneVoando video={dados.video} reserva={dados.reserva} vaga={dados.vaga} alt={`${dados.titulo} em voo`} />
      ) : (
        <VideoEmLoop video={dados.video} alt={dados.titulo} />
      )}
    </section>
  )
}
