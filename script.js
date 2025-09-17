
window.addEventListener('DOMContentLoaded', () => {
  const intro = document.querySelector('.intro');

  const REVEAL_AT = 4000;
  setTimeout(() => {
    document.body.classList.add('show-heart');
    if (intro) {
      intro.style.pointerEvents = 'none';
      setTimeout(() => intro.remove(), 800);
    }
  }, REVEAL_AT);
});

const pathFull = document.getElementById('heartPath');
const particlesLayer = document.getElementById('particles');
const MAX_LEN = pathFull.getTotalLength();
const TOTAL_PARTICLES = 90;

const rand = (a,b)=> a + Math.random()*(b-a);
const make = (tag, attrs={})=>{
  const el = document.createElementNS('http://www.w3.org/2000/svg', tag);
  Object.entries(attrs).forEach(([k,v])=> el.setAttribute(k,v));
  return el;
};

const colors = ['#ff6ec7','#4deaff','#c084fc','#ffe066'];
const particles = [];
for (let i=0;i<TOTAL_PARTICLES;i++){
  const color = colors[Math.floor(Math.random()*colors.length)];
  const c = make('circle',{ r: rand(1.2,2.8), fill: color, opacity: 0.0, filter:'url(#glow)' });
  particlesLayer.appendChild(c);
  particles.push({ el:c, t: rand(0, MAX_LEN), v: rand(40,120), life: rand(1,3) });
}

let last = performance.now();
function tick(now){
  const dt = (now-last)/1000; last = now;
  for(const p of particles){
    p.t += p.v * dt; if(p.t > MAX_LEN) p.t = 0;
    const pt = pathFull.getPointAtLength(p.t);
    const next = pathFull.getPointAtLength((p.t+0.5)%MAX_LEN);
    const dx = next.x - pt.x, dy = next.y - pt.y;
    const mag = Math.hypot(dx,dy) || 1;
    const nx = -dy/mag, ny = dx/mag;
    const wiggle = Math.sin((now*0.002) + p.t*0.02) * 2.1;
    const off = 6 + wiggle;
    p.el.setAttribute('cx',(pt.x+nx*off).toFixed(2));
    p.el.setAttribute('cy',(pt.y+ny*off).toFixed(2));
    p.life += dt;
    const a = 0.45 + Math.sin(p.life*4) * 0.35;
    p.el.setAttribute('opacity', a.toFixed(2));
  }
  requestAnimationFrame(tick);
}
requestAnimationFrame(tick);

window.addEventListener('load', ()=>{
  document.querySelectorAll('.stroke').forEach((p,i)=>{
    p.style.animationDelay = `${0.25 + i*0.35}s`;
  });
});

const bubbleLayer = document.getElementById('bubbles');
const heartEmojis = ['💖','💙','💜','💗','💛'];

function spawnBubble(){
  const el = document.createElement('div');
  el.className = 'bubble-heart';
  el.textContent = heartEmojis[Math.floor(Math.random()*heartEmojis.length)];

  el.style.left = (Math.random()*100).toFixed(2) + 'vw';

  el.style.setProperty('--dur', (6 + Math.random()*5).toFixed(2) + 's');
  el.style.setProperty('--dx',  (Math.random()*20 - 10).toFixed(2) + 'vw');
  el.style.setProperty('--scale', (0.8 + Math.random()*0.8).toFixed(2));
  el.style.setProperty('--rot',  (Math.random()*40 - 20).toFixed(1) + 'deg');

  bubbleLayer.appendChild(el);
  el.addEventListener('animationend', ()=> el.remove());
}

const bubbleTimer = setInterval(spawnBubble, 1200);

/* ===== Frases aleatorias cerca del corazón (solo móvil) ===== */
const phrasesLayer = document.getElementById('phrases');
const heartEl = document.querySelector('.heart');

/* EDITA aquí tus frases */
const PHRASES = [
  "Lindura ✨",
  "Siempre estare para ti 🐱",
  "kawaii desu 🌸",
  "Flaquita hermosa 💕",
  "te pienso bonito",
  "Uff Me encantas",
  "Eres toda mia",
  "Preciosura",
  "Morenita xd",
  "Bella"
];

/* Posiciona alrededor del corazón: un “anillo” justo por fuera */
function positionNearHeart(){
  const sceneRect = document.querySelector('.scene').getBoundingClientRect();
  const hb = heartEl.getBoundingClientRect();

  // centro del corazón
  const cx = (hb.left + hb.right) / 2;
  const cy = (hb.top  + hb.bottom) / 2;

  // aproximamos el borde del corazón con una elipse
  const a = hb.width  * 0.55;   // semi-eje X
  const b = hb.height * 0.55;   // semi-eje Y

  const angle = Math.random() * Math.PI * 2;
  const ring  = 1.05 + Math.random() * 0.25;   // 5–30% por fuera del borde

  let x = cx + Math.cos(angle) * a * ring;
  let y = cy + Math.sin(angle) * b * ring;

  // evitar que se salga de la escena
  x = Math.min(sceneRect.right - 10, Math.max(sceneRect.left + 10, x));
  y = Math.min(sceneRect.bottom - 10, Math.max(sceneRect.top  + 10, y));

  return { left: (x - sceneRect.left) + 'px', top: (y - sceneRect.top) + 'px' };
}

function spawnPhrase(){
  if (!phrasesLayer || !PHRASES.length || !heartEl) return;

  const txt = PHRASES[Math.floor(Math.random()*PHRASES.length)];
  const el = document.createElement('div');
  el.className = 'phrase';
  el.textContent = txt;

  // Orientación: SIEMPRE horizontal, con ligera inclinación aleatoria
  // 70% +/-8°, 20% +/-14°, 10% recta
  const r = Math.random();
  let rotDeg = 0;
  if (r < 0.7)      rotDeg = (Math.random()*16 - 8);    // -8..+8
  else if (r < .9)  rotDeg = (Math.random()*28 - 14);   // -14..+14
  el.style.setProperty('--rot', rotDeg.toFixed(1) + 'deg');

  // Posición: cerca del corazón
  const pos = positionNearHeart();
  el.style.left = pos.left;
  el.style.top  = pos.top;

  phrasesLayer.appendChild(el);
  el.addEventListener('animationend', ()=> el.remove(), { once:true });
}

/* Mostrar solo en móvil (<= 600px) */
let phrasesTimer = null;
const mqMobile = window.matchMedia('(max-width: 600px)');

function updatePhraseScheduler(){
  if (mqMobile.matches){
    if (!phrasesTimer){
      phrasesTimer = setInterval(spawnPhrase, 2000); // una frase cada 2s
    }
  } else {
    if (phrasesTimer){
      clearInterval(phrasesTimer);
      phrasesTimer = null;
    }
    if (phrasesLayer) phrasesLayer.innerHTML = '';
  }
}

updatePhraseScheduler();
(mqMobile.addEventListener ? mqMobile.addEventListener('change', updatePhraseScheduler)
                           : mqMobile.addListener(updatePhraseScheduler));
