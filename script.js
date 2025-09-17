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

function resizeHeart() {
  const heart = document.getElementById('heartSVG');
  const screenW = window.innerWidth;
  const screenH = window.innerHeight;

  // relación del viewBox del corazón (1200/900 ≈ 1.33)
  const ratio = 1200 / 900;

  // queremos que ocupe prácticamente toda la pantalla
  let newW = screenW * 0.98;  // 98% ancho
  let newH = screenH * 0.98;  // 98% alto

  // ajustamos para mantener la proporción
  if (newW / newH > ratio) {
    newW = newH * ratio;
  } else {
    newH = newW / ratio;
  }

  heart.style.width = `${newW}px`;
  heart.style.height = `${newH}px`;
}

// ejecutar al cargar y al redimensionar
window.addEventListener('load', resizeHeart);
window.addEventListener('resize', resizeHeart);
