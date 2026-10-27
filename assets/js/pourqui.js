// Page Pour qui : questionnaire, curseur d'intensité, sac de piscine.
const calme = () => document.documentElement.classList.contains("calme");

function quiz() {
  const form = document.querySelector("[data-quiz]");
  if (!form) return;
  const titre = form.querySelector("[data-verdict-titre]");
  const corps = form.querySelector("[data-verdict-corps]");
  const actions = form.querySelector("[data-verdict-actions]");
  const TITRES = {
    depense: "Un cours tonique, à votre mesure.",
    douceur: "En douceur, à votre rythme.",
    musique: "Laissez la musique vous porter.",
    complement: "Un vrai complément à votre sport.",
  };
  const PHRASES = {
    nage: {
      oui: "En eau profonde, le gilet vous porte&nbsp;: vous vous concentrez sur le mouvement.",
      peu: "Pas besoin de bien nager&nbsp;: le gilet vous maintient la tête hors de l'eau.",
      non: "Savoir nager n'est pas indispensable&nbsp;: le gilet vous maintient la tête hors de l'eau. Il vaut mieux être à l'aise dans l'eau.",
    },
    situation: {
      sport: "Course, renforcement et cardio sans impact&nbsp;: un bon complément à votre entraînement.",
      reprise: "Vous choisissez l'intensité de vos mouvements, et la cadence devient plus accessible au fil des semaines.",
      enceinte: "Les cours sont possibles sauf contre-indication&nbsp;: demandez d'abord l'avis de votre médecin ou de votre sage-femme.",
      soin: "Demandez d'abord l'accord de votre médecin ou de votre physiothérapeute. Dans l'eau, les mouvements se font sans choc pour les articulations.",
    },
    envie: {
      depense: "Plus vous mettez d'amplitude et de vitesse, plus la résistance de l'eau travaille.",
      douceur: "Les accessoires sont toujours facultatifs&nbsp;: vous restez libre de votre rythme.",
      musique: "Le cours est rythmé par la musique, du début à la fin.",
      complement: "Tout le corps travaille sans choc, un bon équilibre avec les sports d'impact.",
    },
  };
  const maj = () => {
    const v = Object.fromEntries(new FormData(form));
    const n = Object.keys(v).length;
    if (!n) return;
    titre.textContent = TITRES[v.envie] || "Venez essayer, c'est offert.";
    const lignes = ["nage", "situation", "envie"].filter((k) => v[k]).map((k) => `<li>${PHRASES[k][v[k]]}</li>`);
    corps.innerHTML = `<ul>${lignes.join("")}</ul>
      <p class="note">${n < 3 ? `Encore ${3 - n} question${n === 2 ? "" : "s"} pour compléter la réponse. ` : ""}Le cours d'essai est offert&nbsp;: le plus simple est de venir voir.</p>`;
    actions.hidden = false;
    if (window.gsap && !calme()) {
      gsap.fromTo(corps.querySelectorAll("li"), { x: 20, opacity: 0 }, { x: 0, opacity: 1, stagger: 0.06, duration: 0.5, ease: "power3.out" });
      gsap.fromTo(titre, { yPercent: 40, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.6, ease: "expo.out" });
    }
  };
  form.addEventListener("change", maj);
  form.addEventListener("submit", (e) => e.preventDefault());
  // Arrivée depuis une bouée de l'accueil : la réponse correspondante est déjà cochée.
  let pre = null;
  try { pre = sessionStorage.getItem("aqua-quiz"); sessionStorage.removeItem("aqua-quiz"); } catch (e) {}
  if (pre) {
    const [nom, valeur] = pre.split("=");
    const champ = form.querySelector(`input[name="${nom}"][value="${valeur}"]`);
    if (champ) { champ.checked = true; maj(); }
  }
}

function intensite(eau, bulles) {
  const r = document.querySelector("[data-intensite-curseur]");
  if (!r) return;
  const sortie = document.querySelector("[data-intensite-valeur]");
  const img = document.querySelector("[data-intensite] > img");
  const NOMS = ["Tout en douceur", "Tranquille", "Rythmé", "Tonique", "À fond"];
  let minuterie = 0;
  const maj = () => {
    const v = +r.value, k = (v - 1) / 4;
    r.style.setProperty("--p", `${k * 100}%`);
    sortie.textContent = NOMS[v - 1];
    if (img) img.style.filter = `saturate(${0.8 + k * 0.6}) contrast(${1 + k * 0.15})`;
    if (eau) eau.etat.intensite = k;
    clearInterval(minuterie);
    if (bulles && !calme() && k > 0) minuterie = setInterval(() => bulles.pluie(Math.ceil(k * 3), 1 + k), 380 - k * 220);
  };
  r.addEventListener("input", maj);
  maj();
  // L'eau retrouve son calme quand on quitte la section.
  if (window.ScrollTrigger) {
    ScrollTrigger.create({
      trigger: "[data-intensite]", start: "top bottom", end: "bottom top",
      onToggle: (st) => { if (!st.isActive) { clearInterval(minuterie); if (eau) eau.etat.intensite = 0; } else maj(); },
    });
  }
}

function sac() {
  const liste = document.querySelector("[data-sac]");
  if (!liste) return;
  const scene = document.querySelector("[data-sac-scene]");
  const compte = document.querySelector("[data-sac-compte]");
  const pile = document.createElement("div");
  pile.style.cssText = "position:absolute;left:16px;right:16px;bottom:16px;display:flex;flex-wrap:wrap;gap:8px;justify-content:center";
  scene.appendChild(pile);
  liste.addEventListener("change", (e) => {
    const cases = [...liste.querySelectorAll("input")];
    const n = cases.filter((c) => c.checked).length;
    compte.textContent = n === 4 ? "4 sur 4 : le sac est prêt, à vous l'eau." : `${n} sur 4 : on prépare le sac.`;
    const c = e.target;
    const id = "puce-" + c.id;
    if (c.checked) {
      const p = document.createElement("span");
      p.id = id; p.className = "bouee"; p.style.position = "relative";
      p.innerHTML = `<i aria-hidden="true"></i>${c.parentElement.textContent.trim().replace(/ pour vos objets de valeur/, "")}`;
      pile.appendChild(p);
      if (window.gsap && !calme()) gsap.fromTo(p, { y: -260, rotate: -12, opacity: 0 }, { y: 0, rotate: 0, opacity: 1, duration: 1.1, ease: "bounce.out" });
    } else {
      const p = document.getElementById(id);
      if (p) p.remove();
    }
  });
}

export function pagePourQui(eau, bulles) {
  quiz();
  intensite(eau, bulles);
  sac();
}
