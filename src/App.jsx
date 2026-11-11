import { useEffect, useState, lazy, Suspense } from 'react'
import { marca, menu, sobre, servicos, showreel } from './conteudo.js'
import { useRevelar, useParallaxMouse, useScrollSuave, useVidro } from './hooks.js'
import Equipamento from './components/Equipamento.jsx'
import Cenario from './components/Cenario.jsx'
const Drone3D = lazy(() => import('./three/Drone3D.jsx'))

const IconeInstagram = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden="true">
    <rect x="3" y="3" width="18" height="18" rx="5" />
    <circle cx="12" cy="12" r="4.2" />
    <circle cx="17.4" cy="6.6" r=".9" fill="currentColor" stroke="none" />
  </svg>
)

function Logo({ pequeno }) {
  const [temArquivo, setTemArquivo] = useState(true)
  return (
    <a className={`logo ${pequeno ? 'pequeno' : ''}`} href="#inicio" aria-label={`${marca.nome} — início`}>
      {marca.logo && temArquivo ? (
        <img src={marca.logo} alt="" onError={() => setTemArquivo(false)} />
      ) : (
        <span className="logo-selo" aria-hidden="true">
          <b>NOV<i>Λ</i></b>
          <small>FILMS</small>
        </span>
      )}
    </a>
  )
}

function Cabecalho() {
  const [rolou, setRolou] = useState(false)
  const [aberto, setAberto] = useState(false)
  const [ativo, setAtivo] = useState('inicio')

  useEffect(() => {
    const aoRolar = () => setRolou(scrollY > 40)
    addEventListener('scroll', aoRolar, { passive: true })
    aoRolar()
    return () => removeEventListener('scroll', aoRolar)
  }, [])

  useEffect(() => {
    const dono = { inicio: 'inicio', drone: 'inicio', camera: 'inicio', sobre: 'sobre', servicos: 'servicos', showreel: 'servicos', contato: 'contato' }
    const io = new IntersectionObserver(
      (entradas) => entradas.forEach((e) => e.isIntersecting && setAtivo(dono[e.target.id])),
      { rootMargin: '-45% 0px -50% 0px' },
    )
    Object.keys(dono).forEach((id) => {
      const s = document.getElementById(id)
      if (s) io.observe(s)
    })
    return () => io.disconnect()
  }, [])

  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tecla = (e) => { if (e.key === 'Escape') { setAberto(false); document.querySelector('.menu-btn')?.focus() } }
    addEventListener('keydown', tecla)
    return () => { document.body.style.overflow = anterior; removeEventListener('keydown', tecla) }
  }, [aberto])

  return (
    <header className={`topo ${rolou ? 'rolou' : ''}`}>
      <div className="assinatura"><Logo /><span>NOVA FILMS<small>PRODUÇÃO AUDIOVISUAL</small></span></div>
      <nav className={`nav ${aberto ? 'aberto' : ''}`} id="nav" aria-label="Principal">
        {menu.map((m) =>
          m.emBreve ? (
            <span key={m.rotulo} className="em-breve" aria-disabled="true">
              {m.rotulo} <small>em breve</small>
            </span>
          ) : (
            <a key={m.rotulo} href={m.link || `#${m.alvo}`} className={ativo === m.alvo ? 'ativo' : ''} onClick={() => setAberto(false)}>
              {m.rotulo}
            </a>
          ),
        )}
      </nav>
      <div className="topo-acoes"><a className="projeto-link" href="#contato">Vamos conversar <span>↗</span></a>
        <a className="icone vidro" href={marca.instagram} target="_blank" rel="noopener" aria-label={`Instagram da ${marca.nome}`}>
          <IconeInstagram />
        </a>
        <button className="menu-btn" aria-label={aberto ? 'Fechar menu' : 'Abrir menu'} aria-expanded={aberto} aria-controls="nav" onClick={() => setAberto(!aberto)}>
          <span></span><span></span>
        </button>
      </div>
    </header>
  )
}

function Inicio() {
  return (
    <section className="hero" id="inicio">
      <div className="hero-arco" aria-hidden="true"></div>

      {/* Cenário: os dois vídeos emendados cobrem o topo inteiro */}
      <div className="hero-cenario" aria-hidden="true">
        {/* Rocha e fumaça onde o drone paira antes de descer */}
        <img className="hero-terreno" src="assets/cenario-unificado.webp" alt="" />
        <div className="camera-sombra" aria-hidden="true"></div>
        {/* Fumaça em movimento passando pelas rochas do topo */}
        <div className="hero-fumaca"><i></i><i></i></div>
        {/* Palco da câmera 3D do topo (parada); a câmera é desenhada em src/three/Camera3D.jsx */}
        <div className="cam-hero" id="cam-hero">
          <img className="espera espera-camera" src="assets/espera-camera.webp" alt="" />
        </div>
      </div>
      {/* Ponto de onde o drone recortado parte ao rolar a página (em cima do drone do vídeo) */}
      <div className="vaga-drone" id="vaga-drone" aria-hidden="true">
        {/* Imagem de espera: aparece já na abertura e some quando o drone 3D começa a ser desenhado */}
        <img className="espera espera-drone" src="assets/espera-drone-v2.webp" alt="" />
      </div>

      <div className="hero-texto"><p className="hero-kicker"><i></i> DO CÉU AO DETALHE</p>
        <p className="marca hero-nome">{marca.nome}</p>
        <h1>{marca.slogan[0]}<br /><span>{marca.slogan[1]}</span></h1>
        <p className="hero-descricao">Um novo ponto de vista para a sua história.</p><div className="hero-ctas"><a className="botao botao-claro" href="#contato">Conte sua ideia <span>↗</span></a><a className="hero-servicos" href="#servicos">Explore nossos serviços <span>↓</span></a></div>
      </div>
      <div className="hero-legenda"><span>OLHAR AUTORAL. PRECISÃO EM CADA FRAME.</span><span><i></i> NOVA FILMS</span></div>
      <a className="rolar" href="#drone">
        <i></i>
        <svg viewBox="0 0 16 26" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
          <rect x="1" y="1" width="14" height="24" rx="7" />
          <line className="roda" x1="8" y1="6" x2="8" y2="10" />
        </svg>
        <span>Role para descobrir</span>
        <i></i>
      </a>
    </section>
  )
}

const Indice = ({ n }) => <p className="indice"><b>{n}</b> / 05 <i></i></p>

function Sobre() {
  return (
    <section className="bloco sobre" id="sobre">
      <div className="bloco-cab revelar">
        <Indice n="03" />
        <h2>Sobre</h2>
      </div>
      <div className="sobre-grade">
        <p className="destaque revelar">{sobre.destaque}</p>
        <ul className="pilares">
          {sobre.pilares.map((p, i) => (
            <li className="revelar vidro" key={p.titulo}>
              <span>{['I', 'II', 'III'][i]}</span>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  )
}

function Servicos() {
  return (
    <section className="bloco" id="servicos">
      <div className="bloco-cab revelar">
        <Indice n="04" />
        <h2>Serviços</h2>
        <p>Do roteiro à entrega final, uma produção completa.</p>
      </div>
      <div className="servicos-grade">
        {servicos.map((s, i) => (
          <article className="servico revelar vidro" key={s.titulo}>
            <span>0{i + 1}</span>
            <h3>{s.titulo}</h3>
            <p>{s.texto}</p>
          </article>
        ))}
      </div>
    </section>
  )
}

function Showreel() {
  return (
    <section className="bloco reel" id="showreel">
      <div className="bloco-cab revelar">
        <Indice n="05" />
        <h2>{showreel.titulo}</h2>
        <p>{showreel.texto}</p>
      </div>
      <div className="reel-quadro revelar vidro">
        {showreel.video ? (
          <video src={showreel.video} poster={showreel.capa || undefined} controls playsInline preload="metadata"></video>
        ) : (
          <div className="reel-vazio">
            <svg viewBox="0 0 64 64" fill="none" stroke="currentColor" strokeWidth="1" aria-hidden="true">
              <circle cx="32" cy="32" r="31" />
              <path d="M27 22v20l16-10z" />
            </svg>
            <p>Vídeo em breve</p>
          </div>
        )}
      </div>
    </section>
  )
}

function Contato() {
  const [copiado, setCopiado] = useState(false)
  const copiar = async () => {
    try { await navigator.clipboard.writeText('@nova.films.br'); setCopiado(true) }
    catch { setCopiado(false) }
  }
  return (
    <section className="contato" id="contato">
      <div className="nevoa baixa" aria-hidden="true"></div>
      <div className="contato-conteudo">
        <p className="hero-kicker revelar"><i></i> SUA PRÓXIMA HISTÓRIA COMEÇA AQUI</p>
        <h2 className="revelar">Vamos criar<br /><em>algo extraordinário?</em></h2>
        <p className="contato-texto revelar">Conte sua ideia, o que você quer comunicar e quando precisa produzir. Vamos conversar sobre o seu projeto.</p>
        <a className="botao botao-claro revelar" href={marca.instagram} target="_blank" rel="noopener noreferrer">Conversar pelo Instagram <span>↗</span></a>
        <button className="copiar-contato" onClick={copiar}>{copiado ? 'Perfil copiado ✓' : '@nova.films.br · copiar perfil'}</button>
        <p className="contato-nota" role="status">Contato direto com a NOVA FILMS.</p>
      </div>
    </section>
  )
}

function Rodape() {
  return (
    <footer className="rodape">
      <Logo pequeno />
      <a className="siga" href={marca.instagram} target="_blank" rel="noopener">
        Siga nosso trabalho <IconeInstagram />
      </a>
      <i className="fio"></i>
      <p>{marca.nome} © {new Date().getFullYear()}.<br /><small className="credito">Câmera 3D por <a href="https://sketchfab.com/Santy" target="_blank" rel="noopener noreferrer">santy</a> · CC BY 4.0 · adaptada.</small></p>
    </footer>
  )
}

export default function App() {
  useScrollSuave()
  useRevelar()
  useParallaxMouse()
  useVidro()
  return (
    <>
      <div className="fumaca" aria-hidden="true"><i></i><i></i></div>
      <Cenario video="assets/drone-hero.mp4" />
      <Suspense fallback={null}><Drone3D /></Suspense>
      <Cabecalho />
      <a className="pular-conteudo" href="#sobre">Pular para o conteúdo</a><main>
        <Inicio />
        <Equipamento tipo="drone" />
        <Equipamento tipo="camera" invertido />
        <Sobre />
        <Servicos />
        <Showreel />
        <Contato />
      </main>
      <Rodape />
    </>
  )
}
