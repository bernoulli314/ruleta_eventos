/* ========= CONFIGURACIÓN ========= */
const SEGMENTS = [
  { text: "DIBUJOS RANDOM",   weight: 0.1,  color: "#719d78" },
  { text: "ADIVINA EL PERSONAJE",           weight: 0.1,  color: "#f6c2c5" },
  { text: "ADIVINA EL POKEMON",        weight: 0.1,  color: "#719d78" },
  { text: "ANIME CON EMOJIS", weight: 0.1,  color: "#f6c2c5" },
  { text: "CANCIÓN x4", weight: 0.1,  color: "#719d78" },
  { text: "ANIME CON EMOJIS", weight: 0.1,  color: "#f6c2c5" },
];

const TAU = Math.PI * 2;
const wheelEl = document.getElementById('wheel');
const spinBtn = document.getElementById('spinBtn');
const resetBtn = document.getElementById('resetBtn');
const resultEl = document.getElementById('result');

let currentRotation = 0;
let isSpinning = false;

/* ========= DIBUJAR RULETA ========= */
function drawWheel(segments){
  wheelEl.innerHTML = "";

  const totalWeight = segments.reduce((s, it) => s + Math.max(0,it.weight), 0);
  let startAngle = -Math.PI/2;
  const radius = 48;
  const labelRadius = 25;
  const intervals = [];

  segments.forEach((seg, idx) => {
    const fraction = seg.weight / totalWeight;
    const sweep = fraction * TAU;
    const endAngle = startAngle + sweep;

    const x1 = Math.cos(startAngle) * radius;
    const y1 = Math.sin(startAngle) * radius;
    const x2 = Math.cos(endAngle)   * radius;
    const y2 = Math.sin(endAngle)   * radius;
    const largeArc = sweep > Math.PI ? 1 : 0;

    const pathData = [
      `M 0 0`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`,
      `Z`
    ].join(' ');

    const path = document.createElementNS("http://www.w3.org/2000/svg","path");
    path.setAttribute("d", pathData);
    path.setAttribute("fill", seg.color);
    path.setAttribute("stroke", "rgba(0,0,0,.25)");
    path.setAttribute("stroke-width", "0.4");
    wheelEl.appendChild(path);

    const mid = (startAngle + endAngle) / 2;
    const lx = Math.cos(mid) * labelRadius;
    const ly = Math.sin(mid) * labelRadius;
    const text = document.createElementNS("http://www.w3.org/2000/svg","text");
    text.setAttribute("x", lx);
    text.setAttribute("y", ly);
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("class", "slice-label");
    const deg = mid * 180/Math.PI;
    text.setAttribute("transform", `rotate(${deg} ${lx} ${ly})`);
    text.textContent = seg.text;
    wheelEl.appendChild(text);

    intervals.push({ from: startAngle, to: endAngle, index: idx });
    startAngle = endAngle;
  });

  wheelEl.dataset.intervals = JSON.stringify(intervals.map(i => [i.from,i.to,i.index]));
}

function angleToSegmentIndex(angleRad){
  const intervals = JSON.parse(wheelEl.dataset.intervals || "[]");
  for(const [from,to,idx] of intervals){
    if(angleRad >= from-1e-10 && angleRad < to+1e-10) return idx;
  }
  return intervals[intervals.length-1][2];
}

function weightedChoice(segments){
  const total = segments.reduce((s,it)=>s+Math.max(0,it.weight),0);
  let r = Math.random() * total;
  for(let i=0;i<segments.length;i++){
    const w = Math.max(0,segments[i].weight);
    if(r < w) return i;
    r -= w;
  }
  return segments.length-1;
}

function spinToIndex(targetIndex){
  if(isSpinning) return;
  isSpinning = true;
  spinBtn.disabled = true;
  resultEl.textContent = "Girando…";

  const totalWeight = SEGMENTS.reduce((s,it)=>s+Math.max(0,it.weight),0);
  const fractions = SEGMENTS.map(s=>Math.max(0,s.weight)/totalWeight);
  let acc = 0;
  const centersDeg = fractions.map(fr=>{
    const start = acc*360;
    const center = start + fr*360/2;
    acc += fr;
    return center;
  });

  const targetCenter = centersDeg[targetIndex];
  const extraTurns = 8 + Math.floor(Math.random()*3);
  const finalRotation = currentRotation + (extraTurns*360) + (360 - targetCenter);

  wheelEl.style.transition = "transform 6s cubic-bezier(.08,.53,.27,.99)";
  wheelEl.style.transform = `rotate(${finalRotation}deg)`;

  wheelEl.addEventListener('transitionend', () => {
    currentRotation = finalRotation % 360;
    const degFromTop = (360 - (currentRotation % 360)) % 360;
    const angleRad = (degFromTop * Math.PI/180) - Math.PI/2;
    const idx = angleToSegmentIndex(angleRad);
    const selected = SEGMENTS[idx] || SEGMENTS[targetIndex];
    resultEl.textContent = `Actividad: ${selected.text}`;
    isSpinning = false;
    spinBtn.disabled = false;
  }, {once:true});
}

/* ========= EVENTOS ========= */
spinBtn.addEventListener('click', () => {
  const idx = weightedChoice(SEGMENTS);
  spinToIndex(idx);
});
resetBtn.addEventListener('click', () => {
  if(isSpinning) return;
  wheelEl.style.transition = "transform .6s ease";
  wheelEl.style.transform = `rotate(0deg)`;
  currentRotation = 0;
  resultEl.textContent = "";
});

// Atajos de teclado: Espacio (girar) y R (reset)
document.addEventListener('keydown', (e) => {
  // Evitar que escribiendo en inputs/textarea dispare la ruleta
  const tag = document.activeElement?.tagName;
  if (tag === 'INPUT' || tag === 'TEXTAREA' || document.activeElement?.isContentEditable) return;

  // Espacio: girar
  if (e.code === 'Space') {
    e.preventDefault(); // evita scroll de la página
    if (!isSpinning) {
      const idx = weightedChoice(SEGMENTS);
      spinToIndex(idx);
    }
  }

  // R: reset
  if (e.code === 'KeyR') {
    e.preventDefault();
    if (!isSpinning) {
      wheelEl.style.transition = "transform .6s ease";
      wheelEl.style.transform = "rotate(0deg)";
      currentRotation = 0;
      resultEl.textContent = "";
    }
  }
});





/* Inicializar */
drawWheel(SEGMENTS);
