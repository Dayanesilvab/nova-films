import { Component, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import Camera3D from './Camera3D.jsx'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Environment, Lightformer, PerformanceMonitor, useGLTF } from '@react-three/drei'
import * as THREE from 'three'
import { semMovimento } from '../hooks.js'

// Drone feito pelo cliente (referencias/drone-novo.glb). É um .glb; a extensão .png é só por causa do hospedeiro de teste
const MODELO = 'assets/drone.glb'
const LARGURA_MODELO = 3.15// largura do modelo (com hélices), nas unidades do arquivo
const CENTRO_Y = 0          // o modelo já está centrado em Y

// Hélices: cada uma é um nó do arquivo, já com o eixo no lugar
const HELICES = [
  { nome: 'Helice_FE', sentido: 1 },
  { nome: 'Helice_FD', sentido: -1 },
  { nome: 'Helice_TE', sentido: -1 },
  { nome: 'Helice_TD', sentido: 1 },
]

// LEDs vermelhos (frente do drone, abaixo dos motores dianteiros): posição no arquivo
const LEDS = [
  [-1.05, 0.04, 0.88],
  [1.05, 0.04, 0.88],
]
const RAIO_LED = 0.02

class Protecao extends Component {
  state = { falhou: false }
  static getDerivedStateFromError() { return { falhou: true } }
  componentDidCatch(erro) {
    console.error('[3D] falha ao carregar o modelo:', erro)
    this.props.aoFalhar?.()
  }
  render() { return this.state.falhou ? null : this.props.children }
}

const mouse = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / innerWidth - 0.5
    mouse.y = e.clientY / innerHeight - 0.5
  }, { passive: true })
}

const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const suave = (t) => t * t * t * (t * (t * 6 - 15) + 10)

function pegarMedidas() {
  const vaga = document.getElementById('vaga-drone')
  const palco = document.querySelector('#drone .equip-palco')
  if (!vaga || !palco) return null
  const a = vaga.getBoundingClientRect()
  const b = palco.getBoundingClientRect()
  return {
    x0: a.left + a.width / 2,
    y0: a.top + scrollY + a.height / 2,
    l0: a.width * 0.62,
    x1: b.left + b.width / 2,
    y1: b.top + scrollY + b.height / 2,
    l1: b.width * 0.68,
  }
}

function Drone({ parado, aoCarregar }) {
  const { scene } = useGLTF(MODELO)
  useEffect(() => { aoCarregar?.() }, [])
  const { size } = useThree()
  const raiz = useRef()
  const inclinar = useRef()
  const helices = useRef([])
  const leds = useRef([])
  const brilhos = useRef([])
  const medidas = useRef(null)
  const ultimaMedida = useRef(0)
  const jaDesenhou = useRef(false)

  // Prepara o modelo uma vez: centraliza, agrupa as hélices em eixos próprios
  const modelo = useMemo(() => {
    const copia = scene.clone(true)
    copia.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false
        if (o.material) o.material.envMapIntensity = 1.35
      }
    })
    helices.current = HELICES.map((h) => copia.getObjectByName(h.nome))
    return copia
  }, [scene])

  useFrame((estado, dt) => {
    dt = Math.min(dt, 0.05)
    const t = estado.clock.elapsedTime
    // Mede só de vez em quando (a página muda de tamanho quando as fontes/vídeos carregam)
    if (!medidas.current || t - ultimaMedida.current > 0.5) {
      medidas.current = pegarMedidas() || medidas.current
      ultimaMedida.current = t
    }
    const m = medidas.current
    if (!m || !raiz.current) return
    if (!jaDesenhou.current) {
      jaDesenhou.current = true
      requestAnimationFrame(() => document.documentElement.classList.add('modelo-pronto')) // some com a imagem de espera
    }

    // Progresso da descida: de 0 (abertura) até 1 (roda da seção Drone)
    const fim = Math.max(200, m.y1 - size.height / 2)
    // A descida segue a rolagem sempre (quem controla é a pessoa), mesmo com "reduzir animações" ligado
    // no sistema; nesse caso só o balanço e as hélices ficam mais calmos.
    const p = limitar(scrollY / fim)
    const e = suave(p)

    const x = THREE.MathUtils.lerp(m.x0, m.x1, e) + Math.sin(e * Math.PI) * size.width * 0.03
    const y = THREE.MathUtils.lerp(m.y0, m.y1, e) - scrollY + Math.sin(t * 1.2) * 5 * (parado ? 0.5 : 1)
    const largura = THREE.MathUtils.lerp(m.l0, m.l1, e)

    raiz.current.position.set(x - size.width / 2, -(y - size.height / 2), 0)
    raiz.current.scale.setScalar(largura / LARGURA_MODELO)

    // Atitude: inclinado e virado para o lado de saída; se nivela ao chegar
    const alvoGiro = THREE.MathUtils.lerp(-0.7, 0.5, e) + mouse.x * 0.4 + Math.sin(t * 0.45) * 0.06
    const alvoTomba = THREE.MathUtils.lerp(0.32, 0.12, e) + mouse.y * 0.14
    const alvoBanco = Math.sin(e * Math.PI) * -0.16 + Math.sin(t * 0.7) * 0.025
    const g = inclinar.current
    if (!g) return
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, alvoGiro, 4, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, alvoTomba, 4, dt)
    g.rotation.z = THREE.MathUtils.damp(g.rotation.z, alvoBanco, 4, dt)

    // Hélices girando (motion blur natural: a rotação é rápida demais para ver as pás)
    const vel = parado ? 14 : 55
    helices.current.forEach((pivo, i) => {
      if (pivo) pivo.rotateY(HELICES[i].sentido * vel * dt)
    })

    // LEDs piscando em vermelho
    const aceso = Math.sin(t * 5.2) > 0.2 ? 1 : 0.06
    leds.current.forEach((led) => {
      if (led) led.material.emissiveIntensity = 0.4 + aceso * 6
    })
    brilhos.current.forEach((b) => {
      if (b) b.material.opacity = aceso * 0.32
    })
  })

  return (
    <group ref={raiz}>
      <group ref={inclinar}>
        <group position={[0, -CENTRO_Y, 0]}>
          <primitive object={modelo} />
          {LEDS.map((pos, i) => (
            <group key={i} position={pos}>
              <mesh ref={(el) => (leds.current[i] = el)}>
                <sphereGeometry args={[RAIO_LED, 16, 16]} />
                <meshStandardMaterial color="#300" emissive="#ff1f1f" emissiveIntensity={4} toneMapped={false} />
              </mesh>
              <mesh ref={(el) => (brilhos.current[i] = el)} renderOrder={5}>
                <sphereGeometry args={[RAIO_LED * 3.4, 16, 16]} />
                <meshBasicMaterial color="#ff2a2a" transparent opacity={0.3} depthWrite={false} blending={THREE.AdditiveBlending} toneMapped={false} />
              </mesh>
            </group>
          ))}
        </group>
      </group>
    </group>
  )
}

function Camera() {
  const { camera, size, gl, scene } = useThree()
  if (import.meta.env.DEV) window.__r3f = { gl, scene, camera } // só para depuração (gerar as imagens de espera)
  useEffect(() => {
    // 1 unidade = 1 pixel no plano do drone
    const fov = 30
    camera.fov = fov
    camera.position.set(0, 0, size.height / 2 / Math.tan((fov * Math.PI) / 360))
    camera.near = 10
    camera.far = size.height * 8
    camera.updateProjectionMatrix()
  }, [camera, size])
  return null
}

export default function Drone3D() {
  const parado = semMovimento()
  const [ativo, setAtivo] = useState(true)
  const maxDpr = Math.min(devicePixelRatio || 1, 2)
  const minDpr = Math.min(maxDpr, 1.5)
  const [dpr, setDpr] = useState(maxDpr)

  const [camPerto, setCamPerto] = useState(false)

  // Pausa o desenho quando nem o drone nem a câmera estão perto da tela;
  // o modelo da câmera só é baixado quando a seção dela está chegando
  useEffect(() => {
    const checar = () => {
      const palco = document.querySelector('#drone .equip-palco')
      const cam = document.querySelector('#camera .equip-palco')
      if (!palco) return
      const r = palco.getBoundingClientRect()
      const c = cam && cam.getBoundingClientRect()
      const droneAtivo = r.bottom > -innerHeight * 0.6 && scrollY < r.top + scrollY + innerHeight
      const camAtiva = !!c && c.bottom > -innerHeight * 0.3 && c.top < innerHeight * 1.3
      setAtivo(droneAtivo || camAtiva)
    }
    addEventListener('scroll', checar, { passive: true })
    addEventListener('resize', checar)
    checar()
    return () => {
      removeEventListener('scroll', checar)
      removeEventListener('resize', checar)
    }
  }, [])

  return (
    <div className="drone3d" aria-hidden="true">
      <Canvas
        dpr={dpr}
        frameloop={ativo ? 'always' : 'never'}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        camera={{ fov: 30, position: [0, 0, 1000], near: 10, far: 8000 }}
      >
        <Camera />
        {/* Se a taxa de quadros cair, reduz a resolução sozinho (sem mexer no visual do drone) */}
        <PerformanceMonitor
          onDecline={() => setDpr((d) => Math.max(minDpr, d - 0.25))}
          onIncline={() => setDpr((d) => Math.min(maxDpr, d + 0.25))}
          flipflops={3}
          onFallback={() => setDpr(minDpr)}
        />
        <ambientLight intensity={0.35} />
        <directionalLight position={[300, 500, 700]} intensity={2.6} />
        <directionalLight position={[-600, 200, -300]} intensity={2.2} color="#cfe0ff" />
        <directionalLight position={[200, -400, -300]} intensity={0.8} />
        <Environment resolution={256} frames={1} environmentIntensity={1.6}>
          <color attach="background" args={['#040405']} />
          <Lightformer form="rect" intensity={5} position={[0, 6, 1]} scale={[12, 5, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={2.6} position={[-7, 1, 3]} scale={[5, 4, 1]} target={[0, 0, 0]} />
          <Lightformer form="rect" intensity={3.2} position={[7, 2, -3]} scale={[5, 2, 1]} target={[0, 0, 0]} />
          <Lightformer form="ring" intensity={2.4} position={[0, 0.5, 9]} scale={2.5} target={[0, 0, 0]} />
        </Environment>
        {/* O drone carrega primeiro; só depois a câmera (a mesma câmera aparece no topo e na seção Câmera) */}
        {/* Cada modelo tem a sua proteção: se um falhar ao carregar, o outro continua aparecendo */}
        <Protecao aoFalhar={() => setCamPerto(true)}>
          <Suspense fallback={null}><Drone parado={parado} aoCarregar={() => setCamPerto(true)} /></Suspense>
        </Protecao>
        {camPerto && (
          <Protecao>
            <Suspense fallback={null}><Camera3D parado={parado} /></Suspense>
          </Protecao>
        )}
      </Canvas>
    </div>
  )
}

useGLTF.preload(MODELO)
