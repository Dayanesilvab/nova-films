import sharp from 'sharp';
import fs from 'node:fs';
await sharp('C:/Users/dayan/.codex/generated_images/01a1c7ec-d804-7aa2-8345-54a99ced3f34/exec-198d6287-32d1-4034-a77a-e8881191e3d5.png').webp({quality:88}).toFile('public/assets/cenario-unificado.webp');
let s=fs.readFileSync('src/App.jsx','utf8');
s=s.replace('<img className="rocha-esq" src="assets/rocha-esq.webp" alt="" />','<img className="hero-terreno" src="assets/cenario-unificado.webp" alt="" />\n        <div className="camera-sombra" aria-hidden="true"></div>');
s=s.replace('          <img className="cam-rocha" src="assets/rocha.webp" alt="" />\n','');
fs.writeFileSync('src/App.jsx',s);
