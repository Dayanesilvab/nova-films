import fs from 'node:fs';
const f='src/App.jsx';let s=fs.readFileSync(f,'utf8');
s=s.replace('<header className=', '<header className='); // preserve the shared header
s=s.replace('      <Logo />','      <div className="assinatura"><Logo /><span>NOVA FILMS<small>PRODUÇÃO AUDIOVISUAL</small></span></div>');
s=s.replace('      <div className="topo-acoes">','      <div className="topo-acoes"><a className="projeto-link" href="#contato">Vamos conversar <span>↗</span></a>');
s=s.replace('      <div className="hero-texto">','      <div className="hero-texto"><p className="hero-kicker"><i></i> DO CÉU AO DETALHE</p>');
s=s.replace('<p className="marca">{marca.nome}</p>','<p className="marca hero-nome">{marca.nome}</p>');
s=s.replace('      </div>\n\n      <a className="rolar"', '        <p className="hero-descricao">Um novo ponto de vista para a sua história.</p><div className="hero-ctas"><a className="botao botao-claro" href="#contato">Conte sua ideia <span>↗</span></a><a className="hero-servicos" href="#servicos">Explore nossos serviços <span>↓</span></a></div>\n      </div>\n      <div className="hero-legenda"><span>OLHAR AUTORAL. PRECISÃO EM CADA FRAME.</span><span><i></i> NOVA FILMS</span></div>\n      <a className="rolar"');
const start=s.indexOf('function Contato() {'),end=s.indexOf('\nfunction Rodape()',start);
s=s.slice(0,start)+`function Contato() {
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
`+s.slice(end);
s=s.replace('<main>','<a className="pular-conteudo" href="#sobre">Pular para o conteúdo</a><main>');
s=s.replace('      <p>{marca.nome} © {new Date().getFullYear()}. Todos os direitos reservados.<br /><small className="credito">{marca.creditoModelo}</small></p>',
'      <p>{marca.nome} © {new Date().getFullYear()}.<br /><small className="credito">Câmera 3D por <a href="https://sketchfab.com/Santy" target="_blank" rel="noopener noreferrer">santy</a> · CC BY 4.0 · adaptada.</small></p>');
// Navigation keyboard handling and scroll containment.
const anchor='  return (\n    <header className=';
s=s.replace(anchor,`  useEffect(() => {
    if (!aberto) return
    const anterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const tecla = (e) => { if (e.key === 'Escape') { setAberto(false); document.querySelector('.menu-btn')?.focus() } }
    addEventListener('keydown', tecla)
    return () => { document.body.style.overflow = anterior; removeEventListener('keydown', tecla) }
  }, [aberto])

  return (
    <header className=`);
fs.writeFileSync(f,s);
const c='src/three/Drone3D.jsx';s=fs.readFileSync(c,'utf8').replace("assets/drone-v4.png","assets/drone.glb");
s=s.replace('const copia = scene','const copia = scene.clone(true)');
s=s.replace("document.documentElement.classList.add('modelo-pronto')","requestAnimationFrame(() => document.documentElement.classList.add('modelo-pronto'))");
s=s.replace('g.rotation.y =','if (!g) return\n    g.rotation.y =');
s=s.replace('aoCarregar={() => setCamPerto(true)}','aoCarregar={() => setCamPerto(true)}');
fs.writeFileSync(c,s);
const cc='src/three/Camera3D.jsx';s=fs.readFileSync(cc,'utf8').replaceAll('assets/camera-v4.png','assets/camera.glb');
s=s.replace('const { scene } = useGLTF(MODELO_CAMERA)','const carregado = useGLTF(MODELO_CAMERA)\n  const scene = useMemo(() => carregado.scene.clone(true), [carregado.scene])');
fs.writeFileSync(cc,s);
fs.renameSync('public/assets/drone-v4.png','public/assets/drone.glb');
fs.renameSync('public/assets/camera-v4.png','public/assets/camera.glb');
fs.writeFileSync('.gitignore','node_modules/\ndist/\n*.tar.gz\n.openai/.local/\n');
fs.writeFileSync('README.md','# NOVA FILMS\n\nReact + Vite + Three.js.\n\n- npm install\n- npm run dev\n- npm run build\n\nConteúdo: src/conteudo.js. Os GLBs usam nomes originais e são servidos como binários.\nO drone é um modelo próprio enviado pelo cliente. A câmera de santy é CC BY 4.0, adaptada; crédito no rodapé.\nContato: link direto para o Instagram. Portfólio e showreel aguardam conteúdo real.\n');
