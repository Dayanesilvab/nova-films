// Remove o fundo branco de um vídeo em tempo real (WebGL), em resolução cheia.
// Uso: const desenhar = criarRecorte(canvas); desenhar(video) a cada quadro.
//
// O recorte tem três cuidados para a borda não ficar "grosseira":
//  1. o alfa é calculado em 3x3 vizinhos (borda suave, sem serrilhado);
//  2. a cor das bordas vem de pixels vizinhos que são 100% do drone (sem franja clara
//     do fundo branco);
//  3. o vídeo é reduzido com mipmaps (WebGL2) e recebe um leve realce de nitidez.

const AJUSTES = {
  corte: 0.74,     // brilho acima disso é fundo (fica transparente)
  faixa: 0.08,     // suavidade da transição do recorte
  saturacao: 1.05, // 1 = cores do vídeo (mantém o vermelho das luzes), 0 = preto e branco
  gama: 0.9,       // 1 = original; menor = mais claro
  nitidez: 0.4,    // 0 = sem realce; maior = mais definição
  contraste: 0.35, // 0 = original; maior = mais volume e profundidade no drone
  limite: 0.72,    // corta tudo abaixo desta altura do quadro (sombra e reflexo do piso)
}

const VERTICES = `
attribute vec2 p; varying vec2 uv;
void main() { uv = vec2(p.x * .5 + .5, .5 - p.y * .5); gl_Position = vec4(p, 0., 1.); }`

const PIXELS = `
precision highp float;
varying vec2 uv; uniform sampler2D quadro;
uniform float corte, faixa, saturacao, gama, nitidez, contraste, limite;
uniform vec2 px;
const vec3 LUZ = vec3(.2126, .7152, .0722);
float bruto(vec3 c) { return clamp((corte - dot(c, LUZ)) / faixa, 0., 1.); }
void main() {
  vec3 c = texture2D(quadro, uv).rgb;
  float soma = 0.;
  vec3 acc = vec3(0.);
  float w = 0.;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec3 s = texture2D(quadro, uv + vec2(float(i), float(j)) * px).rgb;
      float b = bruto(s);
      soma += b;
      float k = step(.97, b);
      acc += s * k;
      w += k;
    }
  }
  // Alfa: média 3x3 com uma curva suave (borda sem degraus)
  float a = smoothstep(.18, .93, soma / 9.) * (1. - smoothstep(limite, limite + .035, uv.y));
  vec3 cor = c;
  if (a >= .995) {
    // Dentro do drone: realce de nitidez
    vec3 b4 = (texture2D(quadro, uv + vec2(px.x, 0.)).rgb + texture2D(quadro, uv - vec2(px.x, 0.)).rgb
             + texture2D(quadro, uv + vec2(0., px.y)).rgb + texture2D(quadro, uv - vec2(0., px.y)).rgb) * .25;
    cor = clamp(c + (c - b4) * nitidez, 0., 1.);
  } else if (a > 0.) {
    // Na borda: a cor vem de vizinhos que são só drone, nunca do fundo branco
    for (int j = -1; j <= 1; j++) {
      for (int i = -1; i <= 1; i++) {
        if (i == 0 && j == 0) continue;
        vec2 d = vec2(float(i), float(j));
        vec3 s2 = texture2D(quadro, uv + d * 2. * px).rgb;
        float k2 = step(.97, bruto(s2));
        acc += s2 * k2; w += k2;
        vec3 s4 = texture2D(quadro, uv + d * 4. * px).rgb;
        float k4 = step(.97, bruto(s4));
        acc += s4 * k4; w += k4;
      }
    }
    cor = w > 0. ? acc / w : c;
  }
  cor = mix(vec3(dot(cor, LUZ)), cor, saturacao);
  cor = pow(clamp(cor, 0., 1.), vec3(gama));
  cor = mix(cor, cor * cor * (3. - 2. * cor), contraste);
  gl_FragColor = vec4(cor * a, a);
}`

export function criarRecorte(canvas, ajustes = {}) {
  // WebGL2 permite mipmaps em qualquer tamanho; sem ele, cai para WebGL1.
  const opcoes = { premultipliedAlpha: true, antialias: false }
  const gl2 = canvas.getContext('webgl2', opcoes)
  const gl = gl2 || canvas.getContext('webgl', opcoes)
  if (!gl) return null
  const compilar = (tipo, fonte) => {
    const s = gl.createShader(tipo)
    gl.shaderSource(s, fonte)
    gl.compileShader(s)
    return s
  }
  const prog = gl.createProgram()
  gl.attachShader(prog, compilar(gl.VERTEX_SHADER, VERTICES))
  gl.attachShader(prog, compilar(gl.FRAGMENT_SHADER, PIXELS))
  gl.linkProgram(prog)
  if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) return null
  gl.useProgram(prog)
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer())
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW)
  const pos = gl.getAttribLocation(prog, 'p')
  gl.enableVertexAttribArray(pos)
  gl.vertexAttribPointer(pos, 2, gl.FLOAT, false, 0, 0)
  gl.bindTexture(gl.TEXTURE_2D, gl.createTexture())
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl2 ? gl.LINEAR_MIPMAP_LINEAR : gl.LINEAR)
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
  for (const [nome, valor] of Object.entries({ ...AJUSTES, ...ajustes })) {
    gl.uniform1f(gl.getUniformLocation(prog, nome), valor)
  }
  const tamanhoPixel = gl.getUniformLocation(prog, 'px')
  return (video) => {
    // Renderiza no tamanho em que o vídeo aparece (com folga), nunca acima do original
    const largura = Math.min(
      video.videoWidth,
      Math.round(Math.max(canvas.clientWidth, 480) * Math.min(devicePixelRatio || 1, 2) * 1.25),
    )
    if (canvas.width !== largura) {
      canvas.width = largura
      canvas.height = Math.round((largura * video.videoHeight) / video.videoWidth)
      gl.viewport(0, 0, canvas.width, canvas.height)
      gl.uniform2f(tamanhoPixel, 1 / canvas.width, 1 / canvas.height)
    }
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, video)
    if (gl2) gl.generateMipmap(gl.TEXTURE_2D)
    gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4)
  }
}
