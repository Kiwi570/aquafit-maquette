// Point d'entrée de la maquette Aquafit-Aquagym.
import { creerEau } from "./eau.js";
import { creerBulles } from "./bulles.js";
import { creerSon } from "./son.js";
import { creerGlisse } from "./glisse.js";
import { entete, copier, curseur, magnetiques, inclinaisons, transitions, ouverture, memoire, finPointeur } from "./ui.js";
import * as A from "./anim.js";
import { piscines } from "./piscines.js";
import { pageHoraires } from "./horaires.js";
import { pagePourQui } from "./pourqui.js";

const html = document.documentElement;
const calme = html.classList.contains("calme");
const page = document.body.className.match(/page-([\w-]+)/)?.[1] || "accueil";
const gsapOk = !!(window.gsap && window.ScrollTrigger);

if (gsapOk) {
  gsap.registerPlugin(ScrollTrigger);
  if (window.SplitText) gsap.registerPlugin(SplitText);
}

// ---------- Défilement fluide (souris et pavé tactile) ----------
const glisse = !calme && finPointeur() ? creerGlisse() : null;

// ---------- Eau WebGL et bulles ----------
let eau = null, bulles = null;
if (!calme) {
  const toile = document.querySelector("[data-eau]");
  eau = toile ? creerEau(toile) : null;
  if (!eau) html.classList.add("no-webgl");
  const tb = document.querySelector("[data-bulles]");
  bulles = tb ? creerBulles(tb) : null;
} else {
  html.classList.add("no-webgl");
}

// ---------- Musique au clic ----------
const boutonSon = document.querySelector("[data-son]");
const son = creerSon({
  surTemps: (force) => {
    if (eau) eau.etat.beat = force;
    if (bulles && force > 0.9) bulles.pluie(3, 1.4);
  },
});
if (boutonSon) {
  if (!son) boutonSon.hidden = true;
  else boutonSon.addEventListener("click", async () => {
    if (son.enMarche) son.arreter(); else await son.demarrer();
    boutonSon.setAttribute("aria-pressed", String(son.enMarche));
    boutonSon.setAttribute("aria-label", son.enMarche ? "Couper la musique" : "Lancer la musique");
  });
}

// ---------- Mode calme ----------
const boutonCalme = document.querySelector("[data-calme]");
if (boutonCalme) {
  boutonCalme.setAttribute("aria-pressed", String(calme));
  boutonCalme.addEventListener("click", () => {
    memoire.local("aqua-calme", calme ? "0" : "1");
    location.reload();
  });
}

// ---------- Interface commune ----------
entete(glisse);
copier();
if (!calme) {
  curseur();
  magnetiques();
  inclinaisons();
}

// ---------- Pages ----------
let carte = null;
if (page === "accueil" || page === "horaires-tarifs") carte = piscines();
if (page === "horaires-tarifs") pageHoraires();
if (page === "pour-qui") pagePourQui(eau, bulles);

// ---------- Animations ----------
if (gsapOk && !calme) {
  const voile = transitions();
  const entree = ouverture(voile);
  A.ouvertureHero(entree);
  A.titres();
  A.parallaxes();
  A.revelations();
  A.gilet();
  A.horizontales();
  A.chrono();
  A.bouees();
  A.carteAnim(carte && carte.carte);
  A.vaguePied();
  A.profondeur(eau, bulles);
} else {
  html.classList.remove("arrivee", "premiere");
  document.querySelectorAll("[data-piste]").forEach((p) => { p.classList.add("piste--native"); p.setAttribute("data-defilement-natif", ""); });
  document.querySelectorAll("[data-gilet-points] li").forEach((li) => li.classList.add("est-actif"));
}

// ---------- Ancre à l'arrivée (ex. horaires-tarifs.html#inscription) ----------
function allerAncre() {
  const id = location.hash.slice(1);
  const cible = id && document.getElementById(id);
  if (!cible) return;
  if (gsapOk) ScrollTrigger.refresh();
  const y = cible.getBoundingClientRect().top + window.scrollY - 90;
  window.scrollTo(0, Math.max(0, y));
}
window.addEventListener("load", () => {
  if (gsapOk) ScrollTrigger.refresh();
  setTimeout(allerAncre, 60);
});
if (document.fonts && gsapOk) document.fonts.ready.then(() => ScrollTrigger.refresh());
