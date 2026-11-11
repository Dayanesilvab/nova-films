import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGLTF } from '@react-three/drei'
import * as THREE from 'three'

// Modelo 3D da câmera (public/assets/camera.glb é um .glb; ver scripts/preparar-camera.mjs)
export const MODELO_CAMERA = 'assets/camera.glb'

// Posição do LED vermelho (frente da empunhadura), no espaço do corpo da câmera
const LED = [-1.32, 0.62, 0.75]
// Frente da lente (espaço do cilindro): onde fica o diafragma
const FRENTE_LENTE = 2.465
const RAIO_LENTE = 0.62

const CICLO = 3.8 // segundos entre uma "foto" e a próxima

const mouse = { x: 0, y: 0 }
if (typeof window !== 'undefined') {
  addEventListener('pointermove', (e) => {
    mouse.x = e.clientX / innerWidth - 0.5
    mouse.y = e.clientY / innerHeight - 0.5
  }, { passive: true })
}

const limitar = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v))
const suave = (t) => t * t * (3 - 2 * t)

// Diafragma: um polígono de lâminas que fecha e abre, desenhado em shader
const IRIS_VERT = `
varying vec2 p;
void main() { p = position.xy; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.); }`
const IRIS_FRAG = `
precision highp float;
varying vec2 p;
uniform float raio;   // raio interno do furo (0 = fechado)
uniform float giro;   // rotação das lâminas
const float N = 7.;
const float PI = 3.14159265;
void main() {
  float ang = atan(p.y, p.x) - giro;
  float setor = 2. * PI / N;
  float k = floor(ang / setor + .5);
  float local = ang - k * setor;           // ângulo dentro da lâmina
  float d = length(p) * cos(local);        // distância até a aresta do polígono
  float fora = smoothstep(raio - .004, raio + .004, d);
  if (fora < .01) discard;
  // cada lâmina com um tom um pouco diferente + brilho metálico na aresta
  float tom = .055 + .05 * sin(k * 2.4 + 1.) + .03 * (local / setor);
  float aresta = 1. - smoothstep(0., .05, d - raio);
  vec3 cor = vec3(tom) + vec3(.55, .55, .6) * aresta * aresta * .55;
  gl_FragColor = vec4(cor, fora);
}`

function criarDiafragma() {
  const material = new THREE.ShaderMaterial({
    vertexShader: IRIS_VERT,
    fragmentShader: IRIS_FRAG,
    uniforms: { raio: { value: 1 }, giro: { value: 0 } },
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
  })
  const malha = new THREE.Mesh(new THREE.CircleGeometry(RAIO_LENTE, 64), material)
  malha.position.z = FRENTE_LENTE
  malha.renderOrder = 4
  return malha
}

// Brilho breve ao "tirar a foto"
function criarClarao() {
  const c = document.createElement('canvas')
  c.width = c.height = 128
  const g = c.getContext('2d')
  const grad = g.createRadialGradient(64, 64, 0, 64, 64, 64)
  grad.addColorStop(0, 'rgba(255,255,255,1)')
  grad.addColorStop(0.25, 'rgba(255,240,230,.55)')
  grad.addColorStop(1, 'rgba(255,255,255,0)')
  g.fillStyle = grad
  g.fillRect(0, 0, 128, 128)
  const tex = new THREE.CanvasTexture(c)
  const malha = new THREE.Mesh(
    new THREE.PlaneGeometry(2.6, 2.6),
    new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  )
  malha.position.z = FRENTE_LENTE + 0.06
  malha.renderOrder = 6
  return malha
}

function criarLed() {
  const g = new THREE.Group()
  g.position.set(...LED)
  const nucleo = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 16, 16),
    new THREE.MeshStandardMaterial({ color: '#300', emissive: '#ff1f1f', emissiveIntensity: 4, toneMapped: false }),
  )
  const brilho = new THREE.Mesh(
    new THREE.SphereGeometry(0.13, 16, 16),
    new THREE.MeshBasicMaterial({ color: '#ff2a2a', transparent: true, opacity: 0.3, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false }),
  )
  brilho.renderOrder = 5
  g.add(nucleo, brilho)
  return { grupo: g, nucleo, brilho }
}

// Posição da câmera na seção "Câmera": acompanha o palco (#camera .equip-palco) na página
export default function Camera3D({ parado }) {
  const carregado = useGLTF(MODELO_CAMERA)
  const scene = useMemo(() => carregado.scene.clone(true), [carregado.scene])
  const { size } = useThree()
  const raiz = useRef()
  const giro = useRef()
  const palco = useRef(null)
  const inicio = useRef(null)
  const jaDesenhou = useRef(false)

  const pecas = useMemo(() => {
    const lente = scene.getObjectByName('cilindro_low1')
    const corpo = scene.getObjectByName('group2')
    scene.traverse((o) => {
      if (o.isMesh) {
        o.frustumCulled = false
        if (o.material) {
          o.material = o.material.clone()
          o.material.envMapIntensity = 0.65
          if (o.material.normalScale) o.material.normalScale.set(1.25, 1.25)
          if (o.material.name === 'Camara_material') {
            o.material.metalness = 0.12
            o.material.roughness = 0.78
            o.material.envMapIntensity = 0.45
          }
          // Vidro sem "transmissão": ela obriga a desenhar a cena duas vezes por quadro (pesa no celular e
          // pode falhar em algumas placas de vídeo, o que apagaria o drone também). Fica um vidro tingido simples.
          if (o.material.transmission > 0) {
            o.material.transmission = 0
            o.material.transparent = true
            o.material.depthWrite = false
            // O vidro do arquivo é alaranjado; aqui vira um vidro escuro com reflexo azulado (lente tratada)
            o.material.color.set('#0a1018')
            o.material.opacity = 0.28
            o.material.roughness = 0.12
            o.material.metalness = 0.08
            o.material.envMapIntensity = 0.65
          }
        }
      }
    })
    scene.updateMatrixWorld(true)
    // Gira o modelo para a lente apontar para a tela (+Z)
    const eixo = new THREE.Vector3(0, 0, 1).transformDirection(lente.matrixWorld).normalize()
    const orient = new THREE.Group()
    orient.quaternion.setFromUnitVectors(eixo, new THREE.Vector3(0, 0, 1))
    orient.add(scene)
    orient.updateMatrixWorld(true)
    const caixa = new THREE.Box3().setFromObject(orient)
    const centro = caixa.getCenter(new THREE.Vector3())
    const dim = caixa.getSize(new THREE.Vector3())

    const iris = criarDiafragma()
    lente.add(iris)
    const clarao = criarClarao()
    lente.add(clarao)
    const led = criarLed()
    corpo.add(led.grupo)
    return { orient, centro, maior: Math.max(dim.x, dim.y, dim.z), iris, clarao, led }
  }, [scene])

  useFrame((estado, dt) => {
    dt = Math.min(dt, 0.05)
    if (!palco.current) {
      const topo = document.querySelector('#cam-hero')
      const baixo = document.querySelector('#camera .equip-palco')
      if (topo && baixo) palco.current = { topo, baixo }
    }
    if (!palco.current || !raiz.current) return
    // Uma só câmera: fica no topo da página (parada, de frente para o título) e na seção Câmera (lente "tira foto").
    // Os dois lugares ficam longe um do outro, então ela usa o que estiver mais perto do centro da tela.
    const rt = palco.current.topo.getBoundingClientRect()
    const rb = palco.current.baixo.getBoundingClientRect()
    const dist = (r) => Math.abs(r.top + r.height / 2 - size.height / 2)
    const noTopo = dist(rt) < dist(rb)
    const r = noTopo ? rt : rb
    const visivel = r.bottom > -150 && r.top < size.height + 150
    raiz.current.visible = visivel
    if (!visivel) {
      inicio.current = null
      return
    }
    const t = estado.clock.elapsedTime
    if (!jaDesenhou.current) {
      jaDesenhou.current = true
      document.documentElement.classList.add('camera-pronta') // some com a imagem de espera
    }

    // Posição e tamanho: acompanham o palco na tela (1 unidade = 1 px)
    const cx = r.left + r.width / 2
    const cy = r.top + r.height / 2
    raiz.current.position.set(cx - size.width / 2, -(cy - size.height / 2) + (noTopo ? 0 : Math.sin(t * 1.1) * 3), 0)
    raiz.current.scale.setScalar((Math.min(r.width * (noTopo ? 0.62 : 0.5), r.height * 0.95) * 1.0) / pecas.maior)

    if (import.meta.env.DEV && window.__escala) raiz.current.scale.multiplyScalar(window.__escala) // depuração
    // Atitude: de três quartos (no topo, virada para o centro da página), acompanhando o mouse
    const g = giro.current
    const lado = noTopo ? -0.65 : 0.55
    // No topo ela é estática (apoiada na rocha): sem mouse e sem balanço
    const mx = noTopo ? 0 : mouse.x, my = noTopo ? 0 : mouse.y, bal = noTopo ? 0 : 1
    g.rotation.y = THREE.MathUtils.damp(g.rotation.y, lado + mx * 0.45 + Math.sin(t * 0.4) * 0.05 * bal, 4, dt)
    g.rotation.x = THREE.MathUtils.damp(g.rotation.x, (noTopo ? 0.12 : 0.12) + my * 0.12, 4, dt)

    // "Foto": na seção Câmera, quando ela aparece, a lente fecha e abre; repete a cada CICLO segundos
    const centroNaTela = !noTopo && r.top < size.height * 0.72 && r.bottom > size.height * 0.28
    if (centroNaTela && inicio.current === null) inicio.current = t
    if (!centroNaTela) inicio.current = null
    if (noTopo) pecas.iris.visible = false
    let abertura = 1
    let clarao = 0
    if (inicio.current !== null && !parado) {
      const c = (t - inicio.current - 0.25) % CICLO
      const fecha = 0.13, segura = 0.09, abre = 0.3
      if (t - inicio.current >= 0.25) {
        if (c < fecha) abertura = 1 - suave(c / fecha)
        else if (c < fecha + segura) abertura = 0
        else if (c < fecha + segura + abre) abertura = suave((c - fecha - segura) / abre)
        const dep = c - fecha - segura
        if (dep > 0 && dep < 0.5) clarao = Math.pow(1 - dep / 0.5, 2) * 0.9
        if (c >= fecha && c < fecha + segura) clarao = 0
      }
    }
    if (import.meta.env.DEV) {
      window.__cam = pecas // só para depuração no navegador
      if (window.__abertura !== undefined) abertura = window.__abertura
    }
    pecas.iris.material.uniforms.raio.value = abertura * 0.8
    pecas.iris.material.uniforms.giro.value = (1 - abertura) * 0.9
    pecas.iris.visible = abertura < 0.995
    pecas.clarao.material.opacity = clarao

    // LED vermelho piscando
    const aceso = Math.sin(t * 5.2) > 0.2 ? 1 : 0.06
    pecas.led.nucleo.material.emissiveIntensity = 0.4 + aceso * 6
    pecas.led.brilho.material.opacity = aceso * 0.32
  })

  return (
    <group ref={raiz} visible={false}>
      <group ref={giro}>
        <group position={[-pecas.centro.x, -pecas.centro.y, -pecas.centro.z]}>
          <primitive object={pecas.orient} />
        </group>
      </group>
    </group>
  )
}
