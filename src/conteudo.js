// ==========================================================
// NOVA FILMS — conteúdo do site
// Edite este arquivo para trocar textos, logo, links e imagens.
// Os arquivos de imagem ficam em public/assets/.
// ==========================================================

export const marca = {
  nome: 'NOVA FILMS',
  slogan: ['Capturando', 'o extraordinário'],
  // Logo (selo redondo). Para trocar, substitua o arquivo em public/assets/.
  logo: 'assets/logo-v2.webp',
  instagram: 'https://www.instagram.com/nova.films.br/',
  // O drone 3D é modelo próprio da NOVA FILMS (sem crédito a terceiros). A câmera é CC BY 4.0 e exige crédito.
  creditoModelo: 'Modelo 3D da câmera (Sketchfab): DSLR por santy, CC BY 4.0, adaptada (sem marca).',
}

// "emBreve: true" mostra o item desativado com o selo "em breve".
// Quando a página de portfólio existir, troque por { rotulo: 'Portfólio', link: '/portfolio' }.
export const menu = [
  { rotulo: 'Início', alvo: 'inicio' },
  { rotulo: 'Portfólio', emBreve: true },
  { rotulo: 'Sobre', alvo: 'sobre' },
  { rotulo: 'Serviços', alvo: 'servicos' },
  { rotulo: 'Contato', alvo: 'contato' },
]

// Vídeo com a compilação dos trabalhos (última seção antes do contato).
// Salve o arquivo em public/assets/ e preencha "video" (ex.: 'assets/showreel.mp4').
export const showreel = {
  titulo: 'Showreel',
  texto: 'Nossos trabalhos em movimento.',
  video: '',
  capa: '',
}

// Drone e câmera. Os vídeos ficam em public/assets/.
export const equipamentos = {
  drone: {
    indice: '01',
    titulo: 'Drone',
    texto: 'Liberdade para explorar novos ângulos, capturar perspectivas únicas e elevar suas histórias.',
    // O drone é um modelo 3D (public/assets/drone.glb) que desce da abertura até aqui
    voa: true,
  },
  camera: {
    indice: '02',
    titulo: 'Câmera',
    texto: 'Detalhes que contam histórias. Qualidade em cada frame, com precisão e emoção.',
    // A câmera é um modelo 3D (public/assets/camera.png, que é um .glb): lente abre/fecha e LED pisca
    modelo3d: true,
  },
}

export const sobre = {
  destaque:
    'Somos uma produtora audiovisual movida por técnica e sensibilidade. Do céu ao detalhe, transformamos ideias em imagens que permanecem.',
  pilares: [
    { titulo: 'Olhar autoral', texto: 'Cada projeto nasce de um conceito visual pensado para a sua história.' },
    { titulo: 'Tecnologia', texto: 'Drones e câmeras de cinema para imagens nítidas em qualquer cenário.' },
    { titulo: 'Precisão', texto: 'Planejamento, captação e pós-produção com acabamento impecável.' },
  ],
}

export const servicos = [
  { titulo: 'Filmagem aérea', texto: 'Imagens com drone para eventos, imóveis, turismo e campanhas.' },
  { titulo: 'Vídeo institucional', texto: 'Filmes de marca, comerciais e conteúdo para redes sociais.' },
  { titulo: 'Fotografia', texto: 'Ensaios, produtos e arquitetura com direção de luz cinematográfica.' },
  { titulo: 'Pós-produção', texto: 'Edição, color grading e finalização em alta resolução.' },
]

