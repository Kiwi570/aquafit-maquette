// Interactions communes : en-tête, menu, curseur, boutons magnétiques, cartes inclinables,
// copie des coordonnées, voile de transition (ligne d'eau) et ouverture de page.

const memoire = {
  lire(k) { try { return sessionStorage.getItem(k); } catch (e) { return null; } },
  ecrire(k, v) { try { sessionStorage.setItem(k, v); } catch (e) { /* stockage indisponible */ } },
  local(k, v) { try { if (v === undefined) return localStorage.getItem(k); localStorage.setItem(k, v); } catch (e) { return null; } },
};
export { memoire };

export const finPointeur = () => window.matchMedia("(pointer: fine)").matches;

export function entete(glisse) {
  const h = document.querySelector("[data-entete]");
  if (!h) return;
  const page = document.body.className.replace("page-", "").split(" ")[0];
  document.querySelectorAll(`[data-nav="${page === "horaires-tarifs" ? "horaires" : page}"]`).forEach((a) => a.setAttribute("aria-current", "page"));
  // L'en-tête reste toujours visible : « Mode calme » et « En musique » sont accessibles à tout moment.
  const maj = () => { h.classList.toggle("est-compacte", window.scrollY > 40); };
  window.addEventListener("scroll", maj, { passive: true });
  maj();

  const burger = document.querySelector("[data-burger]");
  const menu = document.querySelector("[data-menu]");
  if (burger && menu) {
    const fermer = () => { menu.hidden = true; burger.setAttribute("aria-expanded", "false"); document.body.classList.remove("menu-ouvert"); };
    burger.addEventListener("click", () => {
      const ouvrir = menu.hidden;
      menu.hidden = !ouvrir;
      burger.setAttribute("aria-expanded", String(ouvrir));
      document.body.classList.toggle("menu-ouvert", ouvrir);
      if (ouvrir && window.gsap && !document.documentElement.classList.contains("calme")) {
        gsap.fromTo(menu, { clipPath: "inset(0 0 100% 0)" }, { clipPath: "inset(0 0 0% 0)", duration: 0.7, ease: "expo.out" });
        gsap.fromTo(menu.querySelectorAll("nav a"), { yPercent: 60, opacity: 0 }, { yPercent: 0, opacity: 1, stagger: 0.06, duration: 0.7, ease: "expo.out", delay: 0.1, overwrite: true });
      }
    });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !menu.hidden) { fermer(); burger.focus(); } });
    menu.querySelectorAll("a").forEach((a) => a.addEventListener("click", fermer));
  }

  // Ancres internes : défilement fluide.
  document.addEventListener("click", (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute("href").slice(1);
    const cible = id && document.getElementById(id);
    if (!cible) return;
    e.preventDefault();
    glisse ? glisse.vers(cible, { decalage: -90 }) : cible.scrollIntoView();
    history.replaceState(null, "", "#" + id);
  });
}

export function copier() {
  document.querySelectorAll("[data-copier]").forEach((b) => {
    b.addEventListener("click", () => {
      const src = document.querySelector(`[data-copie-source="${b.dataset.copier}"]`);
      if (!src) return;
      const texte = src.textContent.trim();
      const ok = () => { b.textContent = "Copié"; b.classList.add("est-copie"); setTimeout(() => { b.textContent = "Copier"; b.classList.remove("est-copie"); }, 1800); };
      const repli = () => { const r = document.createRange(); r.selectNodeContents(src); const s = getSelection(); s.removeAllRanges(); s.addRange(r); b.textContent = "Sélectionné"; };
      try { navigator.clipboard.writeText(texte).then(ok, repli); } catch (e) { repli(); }
    });
  });
}

export function curseur() {
  const c = document.querySelector("[data-curseur]");
  if (!c || !finPointeur()) return;
  const txt = c.querySelector("[data-curseur-txt]");
  let x = -100, y = -100, cx = -100, cy = -100;
  document.documentElement.classList.add("a-curseur");
  window.addEventListener("pointermove", (e) => { x = e.clientX; y = e.clientY; }, { passive: true });
  (function boucle() {
    cx += (x - cx) * 0.2; cy += (y - cy) * 0.2;
    c.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
    requestAnimationFrame(boucle);
  })();
  document.addEventListener("pointerover", (e) => {
    const t = e.target.closest("[data-curseur-texte]");
    const actif = e.target.closest("a, button, [role='button'], label, summary, select, input[type='range'], [data-curseur-actif]");
    c.classList.toggle("a-texte", !!t);
    c.classList.toggle("est-actif", !t && !!actif);
    if (t) txt.textContent = t.dataset.curseurTexte;
  });
  document.addEventListener("pointerleave", () => c.classList.remove("a-texte", "est-actif"));
}

export function magnetiques() {
  if (!finPointeur() || !window.gsap) return;
  document.querySelectorAll(".magnet").forEach((b) => {
    const txt = b.querySelector(".bouton__txt");
    b.addEventListener("pointermove", (e) => {
      const r = b.getBoundingClientRect();
      const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
      gsap.to(b, { x: dx * 0.28, y: dy * 0.4, duration: 0.5, ease: "power3.out" });
      if (txt) gsap.to(txt, { x: dx * 0.12, y: dy * 0.16, duration: 0.5, ease: "power3.out" });
    });
    b.addEventListener("pointerleave", () => {
      gsap.to(b, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
      if (txt) gsap.to(txt, { x: 0, y: 0, duration: 0.9, ease: "elastic.out(1, 0.35)" });
    });
  });
}

export function inclinaisons() {
  if (!finPointeur()) return;
  const bruit = document.querySelector("[data-onde-survol-bruit]");
  const depl = document.querySelector("[data-onde-survol]");
  document.querySelectorAll("[data-tilt]").forEach((carte) => {
    const inner = carte.querySelector(".carte__inner") || carte;
    let tw = null;
    carte.addEventListener("pointerenter", () => {
      if (!window.gsap || !depl) return;
      tw && tw.kill();
      const o = { s: 0, f: 0.04 };
      tw = gsap.timeline()
        .to(o, { s: 26, duration: 0.35, ease: "power2.out", onUpdate: () => depl.setAttribute("scale", o.s.toFixed(2)) })
        .to(o, { s: 0, duration: 1.2, ease: "power2.out", onUpdate: () => depl.setAttribute("scale", o.s.toFixed(2)) });
      gsap.fromTo(o, { f: 0.06 }, { f: 0.01, duration: 1.5, ease: "power2.out", onUpdate: () => bruit && bruit.setAttribute("baseFrequency", `0.01 ${o.f.toFixed(3)}`) });
    });
    carte.addEventListener("pointermove", (e) => {
      const r = carte.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
      inner.style.transform = `rotateY(${px * 10}deg) rotateX(${-py * 10}deg) translateZ(0)`;
    });
    carte.addEventListener("pointerleave", () => { inner.style.transform = ""; });
  });
}

// ---------- Voile : la ligne d'eau qui balaie l'écran ----------
function voile() {
  const svg = document.querySelector("[data-voile]");
  if (!svg) return null;
  const chemin = svg.querySelector("[data-voile-path]");
  const ecume = svg.querySelector("[data-voile-ecume]");
  const dessiner = (bord, depuisHaut, t) => {
    const w = window.innerWidth, h = window.innerHeight;
    svg.setAttribute("viewBox", `0 0 ${w} ${h}`);
    const y = bord * h, amp = Math.min(42, h * 0.05);
    const pts = [];
    for (let i = 0; i <= 24; i++) {
      const x = (i / 24) * w;
      pts.push([x, y + Math.sin(i * 0.9 + t * 6) * amp * 0.6 + Math.sin(i * 0.37 - t * 4) * amp * 0.4]);
    }
    const ligne = pts.map((p, i) => `${i ? "L" : "M"}${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
    if (depuisHaut) {
      const retour = pts.slice().reverse().map((p) => `L${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(" ");
      chemin.setAttribute("d", `M0 0 L${w} 0 ${retour} Z`);
    } else {
      chemin.setAttribute("d", `${ligne} L${w} ${h} L0 ${h} Z`);
    }
    ecume.setAttribute("d", ligne);
  };
  return { svg, dessiner };
}

// Traverse l'écran : bord de 1 → 0 (montée). depuisHaut = la zone colorée est au-dessus du bord.
function balayer(v, { de, a, depuisHaut, surface = false, duree = 1 }) {
  return new Promise((ok) => {
    v.svg.classList.add("est-visible");
    v.svg.classList.toggle("est-surface", surface);
    const o = { p: 0 };
    gsap.to(o, {
      p: 1, duration: duree, ease: "power3.inOut",
      onUpdate: () => v.dessiner(de + (a - de) * o.p, depuisHaut, o.p),
      onComplete: ok,
    });
  });
}

export function transitions() {
  const v = voile();
  if (!v || !window.gsap) return;
  const calme = () => document.documentElement.classList.contains("calme");
  document.addEventListener("click", async (e) => {
    const a = e.target.closest("a[href]");
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === "_blank" || calme()) return;
    const href = a.getAttribute("href");
    if (!/^[\w-]+\.html(#[\w-]+)?$/.test(href)) return;
    const [fichier] = href.split("#");
    if (location.pathname.endsWith("/" + fichier) && href.includes("#")) return;
    e.preventDefault();
    memoire.ecrire("aqua-vague", "1");
    await balayer(v, { de: 1.15, a: -0.15, depuisHaut: false, duree: 0.85 });
    location.href = href;
  });
  window.addEventListener("pageshow", (e) => { if (e.persisted) v.svg.classList.remove("est-visible"); });
  return v;
}

export async function ouverture(v) {
  const intro = document.querySelector("[data-intro]");
  const html = document.documentElement;
  const calme = html.classList.contains("calme");
  const decouvrir = () => html.classList.remove("arrivee", "premiere");
  if (!v || !window.gsap || calme) { decouvrir(); return; }
  if (memoire.lire("aqua-vague") === "1") {
    memoire.ecrire("aqua-vague", "0");
    v.svg.classList.add("est-visible");
    v.dessiner(1.15, true, 0);
    decouvrir();
    await balayer(v, { de: 1.15, a: -0.15, depuisHaut: true, duree: 0.9 });
    v.svg.classList.remove("est-visible");
    return;
  }
  if (memoire.lire("aqua-intro") === "1" || !intro) { decouvrir(); return; }
  memoire.ecrire("aqua-intro", "1");
  // Ouverture : la surface claire, la ligne d'eau se trace, puis on plonge (moins de 2,5 s).
  intro.classList.add("est-visible");
  v.svg.classList.add("est-visible", "est-surface");
  v.dessiner(1.15, true, 0);
  decouvrir();
  const trait = intro.querySelector(".intro__ligne path");
  const long = trait.getTotalLength();
  gsap.set(trait, { strokeDasharray: long, strokeDashoffset: long });
  const tl = gsap.timeline();
  tl.from(intro.querySelector(".intro__logo"), { y: 30, opacity: 0, duration: 0.6, ease: "power3.out" })
    .to(trait, { strokeDashoffset: 0, duration: 0.7, ease: "power2.inOut" }, 0.15)
    .from(intro.querySelector(".intro__txt"), { opacity: 0, y: 10, duration: 0.4 }, 0.45)
    .to(intro.querySelector(".intro__logo"), { y: -6, duration: 0.5, ease: "sine.inOut", yoyo: true, repeat: 1 }, 0.6)
    .to(intro, { yPercent: -60, opacity: 0, duration: 0.8, ease: "power3.in" }, 1.25);
  await new Promise((ok) => setTimeout(ok, 1300));
  await balayer(v, { de: 1.15, a: -0.2, depuisHaut: true, surface: true, duree: 1.0 });
  intro.classList.remove("est-visible");
  v.svg.classList.remove("est-visible", "est-surface");
}
