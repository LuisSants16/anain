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

// 💖 Burbujas de corazones
const bubbleLayer = document.getElementById('bubbles');
const heartEmojis = ['💖','💙','💜','💗','💛'];

function spawnBubble(){
  const el = document.createElement('div');
  el.className = 'bubble-heart';
  el.textContent = heartEmojis[Math.floor(Math.random()*heartEmojis.length)];

  // posición horizontal aleatoria
  el.style.left = (Math.random()*100).toFixed(2) + 'vw';

  // variables de animación
  el.style.setProperty('--dur', (6 + Math.random()*5).toFixed(2) + 's');          // 6–11s
  el.style.setProperty('--dx',  (Math.random()*20 - 10).toFixed(2) + 'vw');       // deriva -10–+10vw
  el.style.setProperty('--scale', (0.8 + Math.random()*0.8).toFixed(2));          // 0.8–1.6
  el.style.setProperty('--rot',  (Math.random()*40 - 20).toFixed(1) + 'deg');     // -20–+20°

  bubbleLayer.appendChild(el);
  el.addEventListener('animationend', ()=> el.remove());
}

// lanza una burbuja cada 600 ms
const bubbleTimer = setInterval(spawnBubble, 600);

// opcional: al tocar/click, suelta 5 de golpe
bubbleLayer.addEventListener('click', ()=>{
  for (let i=0;i<5;i++) spawnBubble();
});

// Autoplay sin UI; si el navegador bloquea, se habilita en el primer gesto (sin mostrar nada)
(function () {
  const audio = document.getElementById('bgMusic');
  if (!audio) return;

  audio.volume = 1;      // volumen lo controla el teléfono
  audio.muted = false;

  const tryPlay = () => audio.play().catch(() => { /* bloqueado por el navegador */ });

  // intenta reproducir al cargar
  if (document.readyState === 'complete') tryPlay();
  else window.addEventListener('load', tryPlay, { once: true });

  // si fue bloqueado, se desbloquea con el PRIMER gesto (sin botones/avisos)
  const unlock = () => {
    audio.play().catch(() => {});
    // quita los listeners tras intentar una vez
    ['pointerdown','touchstart','keydown','scroll'].forEach(ev =>
      window.removeEventListener(ev, unlock, { passive: true })
    );
  };
  ['pointerdown','touchstart','keydown','scroll'].forEach(ev =>
    window.addEventListener(ev, unlock, { passive: true, once: true })
  );

  // si vuelves a la pestaña y quedó pausado, reintenta
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && audio.paused) tryPlay();
  });
})();

// === Fondo y brillo reactivo a la música + AUTOPLAY robusto ===
(function reactiveBackground(){
  const audio = document.getElementById('bgMusic');
  if (!audio) return;

  // Intenta autoplay al cargar
  audio.volume = 1;
  audio.muted = false;
  const tryPlay = () => audio.play().catch(() => { /* bloqueado por política */ });
  if (document.readyState === 'complete') tryPlay();
  else window.addEventListener('load', tryPlay, { once: true });

  // Web Audio
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  const ctx = new AudioCtx();
  const src = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser();
  analyser.fftSize = 1024;
  analyser.smoothingTimeConstant = 0.85;
  src.connect(analyser);
  src.connect(ctx.destination);

  const bins = analyser.frequencyBinCount;
  const nyquist = ctx.sampleRate / 2;
  const data = new Uint8Array(bins);
  const root = document.documentElement;

  function bandAvg(fromHz, toHz){
    const s = Math.max(0, Math.floor(fromHz / nyquist * bins));
    const e = Math.min(bins - 1, Math.floor(toHz / nyquist * bins));
    let sum = 0; for (let i = s; i <= e; i++) sum += data[i];
    return (e - s + 1) ? sum / (e - s + 1) : 0;
  }

  let baseHue = 300;
  function tick(){
    analyser.getByteFrequencyData(data);
    const bass  = bandAvg(30, 160);
    const mids  = bandAvg(160, 2000);
    const highs = bandAvg(2000, 8000);
    const energy = (bass*1.2 + mids*0.8 + highs*0.6) / (1.2+0.8+0.6);

    const glow = Math.max(0.2, Math.min(1, (energy - 20) / 180));
    root.style.setProperty('--glow', glow.toFixed(2));

    baseHue = (baseHue + 0.25 + highs * 0.002) % 360;
    const hue2 = (baseHue + 80 + mids * 0.02) % 360;
    const l1 = (12 + glow * 10).toFixed(1);
    const l2 = (6 + glow * 6).toFixed(1);

    root.style.setProperty('--bgA', `hsl(${baseHue.toFixed(1)},80%,${l1}%)`);
    root.style.setProperty('--bgB', `hsl(${hue2.toFixed(1)},80%,${l2}%)`);
    requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);

  // Asegura que el contexto se reanude y que el audio arranque en el PRIMER gesto (sin UI)
  const unlock = () => {
    if (ctx.state === 'suspended') ctx.resume().catch(()=>{});
    audio.play().catch(()=>{});
    ['pointerdown','touchstart','keydown','scroll'].forEach(ev =>
      window.removeEventListener(ev, unlock, { passive: true })
    );
  };
  ['pointerdown','touchstart','keydown','scroll'].forEach(ev =>
    window.addEventListener(ev, unlock, { passive: true, once: true })
  );

  // Si el usuario cambia de pestaña y vuelve
  document.addEventListener('visibilitychange', ()=>{
    if (!document.hidden && audio.paused) tryPlay();
  });
})();

const bg = document.getElementById('bgMusic');
if (bg) {
  bg.loop = true; // refuerza el loop por JS

  // Si por alguna razón llega a terminar, reinicia al instante
  bg.addEventListener('ended', () => {
    try { bg.currentTime = 0; } catch(_) {}
    bg.play().catch(()=>{}); // vuelve a reproducir
  });

  // Por si la pestaña vuelve del fondo y quedó pausado
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && bg.paused) {
      bg.play().catch(()=>{});
    }
  });
}

// Autoplay + loop robusto (reintenta en los casos que suelen fallar)
(function ensureMusicLoop(){
  const a = document.getElementById('bgMusic');
  if (!a) return;

  // Fuerza flags por si el HTML cambia
  a.autoplay = true;
  a.loop = true;
  a.muted = false;
  a.volume = 1;

  const kick = () => a.play().catch(() => { /* bloqueado por política, se reintenta luego */ });

  // 1) Al cargar
  if (document.readyState === 'complete') kick();
  else window.addEventListener('load', kick, { once: true });

  // 2) Al restaurar la página desde el back-forward cache
  window.addEventListener('pageshow', kick);

  // 3) Al volver a la pestaña
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden && a.paused) kick();
  });

  // 4) Si algún navegador ignora loop o el audio se “queda colgado” al terminar
  a.addEventListener('ended', () => {
    try { a.currentTime = 0; } catch(_) {}
    a.load();   // reinicia el buffer (arregla Safari/iOS a veces)
    kick();     // vuelve a reproducir
  });
})();
