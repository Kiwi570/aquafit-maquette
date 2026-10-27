// Animations pilotées par le défilement (GSAP + ScrollTrigger + SplitText).
const large = () => window.matchMedia("(min-width: 901px)").matches;

export function titres() {
  const Split = window.SplitText;
  document.querySelectorAll("[data-titre]").forEach((t) => {
    let cibles = [t];
    if (Split) {
      const s = Split.create(t, { type: "words,chars", mask: "words", charsClass: "char", wordsClass: "mot" });
      cibles = s.chars;
    }
    gsap.from(cibles, {
      yPercent: 110, rotate: 4, duration: 1.1, ease: "expo.out", stagger: 0.018,
      scrollTrigger: { trigger: t, start: "top 85%", once: true },
    });
  });
}

export function ouvertureHero(attente) {
  const titre = document.querySelector("[data-titre-flottant]");
  const apparitions = document.querySelectorAll("[data-apparition]");
  let chars = [];
  if (titre && window.SplitText) {
    chars = SplitText.create(titre, { type: "words,chars", charsClass: "char", wordsClass: "mot" }).chars;
  }
  const tl = gsap.timeline({ paused: true });
  if (chars.length) {
    tl.from(chars, { yPercent: 120, opacity: 0, rotate: 6, duration: 1.3, ease: "expo.out", stagger: 0.03 }, 0);
  }
  tl.from(apparitions, { y: 30, opacity: 0, duration: 1, ease: "power3.out", stagger: 0.1 }, 0.25);
  tl.from(".hero__media img", { scale: 1.18, duration: 2.2, ease: "power3.out" }, 0);
  // Titre flottant : chaque lettre ondule comme portée par l'eau.
  tl.add(() => {
    if (!chars.length) return;
    gsap.to(chars, { y: -7, rotate: 0.6, duration: 2.4, ease: "sine.inOut", yoyo: true, repeat: -1, stagger: { each: 0.09, repeat: -1, yoyo: true } });
  });
  Promise.resolve(attente).then(() => tl.play());
}

export function parallaxes() {
  document.querySelectorAll("[data-parallax]").forEach((el) => {
    const f = parseFloat(el.dataset.parallax) || 0.15;
    gsap.to(el, { yPercent: f * 100, ease: "none", scrollTrigger: { trigger: el.parentElement, start: "top top", end: "bottom top", scrub: true } });
  });
}

export function revelations() {
  document.querySelectorAll("[data-revele]").forEach((f) => {
    const img = f.querySelector("img");
    gsap.timeline({ scrollTrigger: { trigger: f, start: "top 85%", once: true } })
      .from(f, { clipPath: "inset(100% 0% 0% 0% round 18px)", duration: 1.3, ease: "expo.out" })
      .from(img, { scale: 1.35, duration: 1.6, ease: "expo.out" }, 0);
  });
  const depl = document.querySelector("[data-onde-emerge]");
  document.querySelectorAll("[data-emerge]").forEach((cadre, i) => {
    const img = cadre.querySelector("img");
    const o = { s: 90 };
    ScrollTrigger.create({
      trigger: cadre, start: "top 80%", once: true,
      onEnter: () => {
        if (depl) img.style.filter = "url(#onde-emerge)";
        gsap.timeline({ delay: i * 0.15 })
          .from(cadre, { y: 80, duration: 1.4, ease: "expo.out" }, 0)
          .from(img, { scale: 1.25, opacity: 0.3, duration: 1.6, ease: "expo.out" }, 0)
          .to(o, { s: 0, duration: 1.8, ease: "power2.out", onUpdate: () => depl && depl.setAttribute("scale", o.s.toFixed(1)), onComplete: () => { img.style.filter = ""; } }, 0);
      },
    });
  });
}

export function gilet() {
  const sec = document.querySelector("[data-gilet]");
  if (!sec) return;
  const points = [...sec.querySelectorAll("[data-gilet-points] li")];
  const schemas = (n) => sec.querySelectorAll(`[data-etape-schema="${n}"]`);
  const activer = (n) => {
    points.forEach((li) => li.classList.toggle("est-actif", +li.dataset.etape <= n));
    [1, 2, 3].forEach((k) => gsap.to(schemas(k), { opacity: k <= n ? 1 : 0.3, duration: 0.5, overwrite: true }));
  };
  activer(1);
  // La personne court en suspension : jambes et bras en boucle.
  const pivot = (sel, x, y, a, d) => gsap.fromTo(sec.querySelector(sel), { rotate: -a, svgOrigin: `${x} ${y}` }, { rotate: a, svgOrigin: `${x} ${y}`, duration: d, ease: "sine.inOut", yoyo: true, repeat: -1 });
  pivot('[data-jambe="g"]', 196, 222, 16, 0.55);
  gsap.fromTo(sec.querySelector('[data-jambe="d"]'), { rotate: 16, svgOrigin: "212 222" }, { rotate: -16, svgOrigin: "212 222", duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: -1 });
  pivot('[data-bras="g"]', 182, 142, 10, 0.55);
  gsap.fromTo(sec.querySelector('[data-bras="d"]'), { rotate: 10, svgOrigin: "226 142" }, { rotate: -10, svgOrigin: "226 142", duration: 0.55, ease: "sine.inOut", yoyo: true, repeat: -1 });
  gsap.to(sec.querySelector("[data-schema-corps]"), { y: 6, duration: 1.6, ease: "sine.inOut", yoyo: true, repeat: -1 });
  const surface = sec.querySelector("[data-schema-surface]");
  if (surface) {
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: 4, repeat: -1, ease: "none", onUpdate: () => {
      const ph = o.t * Math.PI * 2;
      let d = "M0 112";
      for (let x = 0; x <= 400; x += 20) d += ` L${x} ${(112 + Math.sin(x / 40 + ph) * 5).toFixed(1)}`;
      surface.setAttribute("d", d);
    } });
  }
  if (large()) {
    ScrollTrigger.create({
      trigger: sec, start: "top top", end: "+=140%", pin: true, scrub: true,
      onUpdate: (st) => activer(st.progress < 0.33 ? 1 : st.progress < 0.66 ? 2 : 3),
    });
  } else {
    points.forEach((li, i) => ScrollTrigger.create({ trigger: li, start: "top 70%", onEnter: () => activer(i + 1), onLeaveBack: () => activer(Math.max(1, i)) }));
  }
}

export function horizontales() {
  document.querySelectorAll("[data-horizontal]").forEach((sec) => {
    const piste = sec.querySelector("[data-piste]");
    if (!piste) return;
    const barre = sec.querySelector("[data-piste-progres]");
    if (!large()) {
      piste.classList.add("piste--native");
      piste.setAttribute("data-defilement-natif", "");
      if (barre) {
        const maj = () => { const m = piste.scrollWidth - piste.clientWidth; barre.style.transform = `scaleX(${m > 0 ? Math.max(0.08, piste.scrollLeft / m) : 1})`; };
        piste.addEventListener("scroll", maj, { passive: true }); maj();
      }
      return;
    }
    const distance = () => Math.max(0, piste.scrollWidth - window.innerWidth);
    gsap.to(piste, {
      x: () => -distance(), ease: "none",
      scrollTrigger: {
        trigger: sec, start: "top top", end: () => "+=" + distance(), pin: true, scrub: 0.8, invalidateOnRefresh: true,
        onUpdate: (st) => { if (barre) barre.style.transform = `scaleX(${Math.max(0.08, st.progress)})`; },
      },
    });
    piste.querySelectorAll(".carte__media img").forEach((img) => {
      gsap.fromTo(img, { xPercent: -5, scale: 1.14 }, { xPercent: 5, scale: 1.14, ease: "none", scrollTrigger: { trigger: sec, start: "top top", end: () => "+=" + distance(), scrub: true } });
    });
  });
}

export function chrono() {
  const c = document.querySelector("[data-chrono]");
  if (!c) return;
  const grad = c.querySelector("[data-graduation]");
  for (let i = 0; i < 50; i++) {
    const a = (i / 50) * Math.PI * 2 - Math.PI / 2, r1 = i % 5 === 0 ? 150 : 156, r2 = 162;
    const l = document.createElementNS("http://www.w3.org/2000/svg", "line");
    l.setAttribute("x1", 200 + Math.cos(a) * r1); l.setAttribute("y1", 200 + Math.sin(a) * r1);
    l.setAttribute("x2", 200 + Math.cos(a) * r2); l.setAttribute("y2", 200 + Math.sin(a) * r2);
    grad.appendChild(l);
  }
  const arc = c.querySelector("[data-chrono-arc]");
  const min = c.querySelector("[data-chrono-min]");
  const o = { m: 0 };
  const dessiner = () => { min.textContent = Math.round(o.m); arc.setAttribute("stroke-dashoffset", (100 - o.m * 2).toFixed(2)); };
  dessiner();
  // Les 50 minutes défilent une fois, quand le chrono arrive à l'écran.
  ScrollTrigger.create({ trigger: c, start: "top 70%", once: true, onEnter: () => gsap.to(o, { m: 50, duration: 2.6, ease: "power2.inOut", onUpdate: dessiner }) });
  gsap.from(c.querySelectorAll(".chrono__etiquette"), { scale: 0.6, opacity: 0, stagger: 0.15, duration: 0.8, ease: "back.out(2)", scrollTrigger: { trigger: c, start: "top 70%", once: true } });
}

export function bouees() {
  const b = document.querySelectorAll("[data-bouees] .bouee");
  if (!b.length || !large()) return;
  b.forEach((el, i) => {
    gsap.to(el, { y: "random(-14, 14)", rotate: "random(-4, 4)", duration: "random(2.2, 3.4)", ease: "sine.inOut", yoyo: true, repeat: -1, delay: i * 0.2 });
  });
  gsap.fromTo(b, { scale: 0, opacity: 0 }, { scale: 1, opacity: 1, stagger: 0.12, duration: 1, ease: "elastic.out(1, 0.5)", scrollTrigger: { trigger: "[data-bassin]", start: "top 70%", once: true } });
}

export function carteAnim(carte) {
  if (!carte) return;
  gsap.set(carte.lac, { strokeDasharray: 1, strokeDashoffset: 1 });
  const tl = gsap.timeline({ scrollTrigger: { trigger: carte.svg, start: "top 75%", once: true } });
  tl.to(carte.lac, { strokeDashoffset: 0, duration: 2.2, ease: "power2.inOut" })
    .from(carte.lac, { fillOpacity: 0, duration: 1.2 }, 1)
    .from(Object.values(carte.pins), { scale: 0, transformOrigin: "50% 50%", opacity: 0, stagger: 0.12, duration: 0.8, ease: "back.out(2.5)" }, 0.9);
}

export function vaguePied() {
  const p = document.querySelector("[data-pied-vague]");
  if (!p) return;
  let actif = false;
  ScrollTrigger.create({ trigger: p.closest("svg"), start: "top bottom", end: "bottom top", onToggle: (st) => { actif = st.isActive; } });
  gsap.ticker.add((t) => {
    if (!actif) return;
    let d = "M0 90 L0 50";
    for (let x = 0; x <= 1440; x += 60) d += ` L${x} ${(48 + Math.sin(x / 210 + t * 1.4) * 14 + Math.sin(x / 90 - t * 2) * 5).toFixed(1)}`;
    p.setAttribute("d", d + " L1440 90 Z");
  });
}

// Jauge de profondeur et profondeur de l'eau WebGL.
export function profondeur(eau, bulles) {
  const sections = [...document.querySelectorAll("[data-section]")];
  const label = document.querySelector("[data-jauge-label]");
  const repere = document.querySelector("[data-jauge-repere]");
  const rail = document.querySelector("[data-jauge-rail]");
  let dernierY = window.scrollY;
  ScrollTrigger.create({
    start: 0, end: "max",
    onUpdate: (st) => {
      const p = st.progress;
      if (repere && rail) repere.style.transform = `translateY(${(p * rail.clientHeight).toFixed(1)}px)`;
      if (eau) eau.etat.depth = Math.min(1, 0.18 + 0.95 * Math.pow(Math.sin(Math.PI * Math.min(0.97, p)), 0.7)) * (p > 0.92 ? Math.max(0, (1 - p) / 0.08) : 1);
      const v = Math.abs(window.scrollY - dernierY); dernierY = window.scrollY;
      if (bulles && v > 30) bulles.pluie(Math.min(4, Math.floor(v / 40)), 1.2);
    },
  });
  sections.forEach((s) => ScrollTrigger.create({
    trigger: s, start: "top 50%", end: "bottom 50%",
    onToggle: (st) => { if (st.isActive && label) label.textContent = s.dataset.section; },
  }));
}

// Textes, listes et blocs d'information apparaissent en douceur au fil de la lecture.
export function apparitionsTexte() {
  const cibles = document.querySelectorAll("main .section .texte, main .section .faits li, main .section .question, main .section .labels, main .section .deux-col > .texte, main .rembourse .defile, main .section .bandeau-verif, main .section .sac__liste li, main .section .quiz__q");
  const liste = [...cibles].filter((el) => !el.closest("[hidden]"));
  if (!liste.length) return;
  gsap.set(liste, { opacity: 0, y: 26 });
  ScrollTrigger.batch(liste, {
    start: "top 88%", once: true,
    onEnter: (lot) => gsap.to(lot, { opacity: 1, y: 0, duration: 0.9, ease: "power3.out", stagger: 0.08, overwrite: true }),
  });
}
