// Palco da seção Drone: só marca o lugar (a roda). O drone 3D (src/three/Drone3D.jsx)
// é desenhado numa camada fixa por cima da página e pousa aqui conforme a rolagem.
export default function DroneVoando() {
  return (
    <div className="equip-palco">
      <div className="orbita" aria-hidden="true"></div>
    </div>
  )
}
