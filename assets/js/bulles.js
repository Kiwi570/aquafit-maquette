// Bulles qui montent : au passage du curseur, au défilement et sur les temps forts de la musique.
export function creerBulles(canvas) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;
  const bulles = [];
  const MAX = 90;
  let w = 0, h = 0, dpr = 1, raf = 0, actif = true;
  let dernierePos = null;

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    w = window.innerWidth; h = window.innerHeight;
    canvas.width = w * dpr; canvas.height = h * dpr;
    canvas.style.width = w + "px"; canvas.style.height = h + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  resize();
  window.addEventListener("resize", resize);

  function ajouter(x, y, n = 1, force = 1) {
    for (let i = 0; i < n && bulles.length < MAX; i++) {
      const r = (1.5 + Math.random() * 5) * (0.7 + force * 0.3);
      bulles.push({
        x: x + (Math.random() - 0.5) * 24, y: y + (Math.random() - 0.5) * 12,
        r, vy: -(0.4 + Math.random() * 0.9) * (0.8 + force * 0.4),
        phase: Math.random() * 6.28, amp: 0.3 + Math.random() * 0.8, vie: 1,
      });
    }
  }

  window.addEventListener("pointermove", (e) => {
    if (e.pointerType !== "mouse") return;
    if (dernierePos) {
      const d = Math.hypot(e.clientX - dernierePos.x, e.clientY - dernierePos.y);
      if (d > 26) { ajouter(e.clientX, e.clientY, 1, Math.min(2, d / 60)); dernierePos = { x: e.clientX, y: e.clientY }; }
    } else dernierePos = { x: e.clientX, y: e.clientY };
  }, { passive: true });

  function boucle() {
    raf = requestAnimationFrame(boucle);
    if (!actif) return;
    ctx.clearRect(0, 0, w, h);
    for (let i = bulles.length - 1; i >= 0; i--) {
      const b = bulles[i];
      b.phase += 0.05;
      b.x += Math.sin(b.phase) * b.amp * 0.6;
      b.y += b.vy;
      b.vy *= 1.004;
      if (b.y < h * 0.15) b.vie -= 0.02;
      if (b.y < -20 || b.vie <= 0) { bulles.splice(i, 1); continue; }
      ctx.globalAlpha = 0.55 * b.vie;
      ctx.beginPath();
      ctx.arc(b.x, b.y, b.r, 0, Math.PI * 2);
      ctx.strokeStyle = "rgba(155, 230, 238, 0.9)";
      ctx.lineWidth = 1;
      ctx.stroke();
      ctx.beginPath();
      ctx.arc(b.x - b.r * 0.35, b.y - b.r * 0.35, b.r * 0.28, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(242, 247, 246, 0.9)";
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }
  raf = requestAnimationFrame(boucle);
  document.addEventListener("visibilitychange", () => { actif = !document.hidden; });

  return {
    ajouter,
    // Bulles depuis le bas de l'écran (défilement, musique, intensité).
    pluie(n = 3, force = 1) {
      for (let i = 0; i < n; i++) ajouter(Math.random() * w, h + 10, 1, force);
    },
    arreter() { actif = false; cancelAnimationFrame(raf); ctx.clearRect(0, 0, w, h); bulles.length = 0; },
  };
}
