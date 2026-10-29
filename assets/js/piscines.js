// Carte + fiche de la piscine choisie + « prochain cours ». Utilisé sur l'accueil et sur Horaires & tarifs.
import { PISCINES, COURS, JOURS, heure, prochainCours, tarifPour, chf } from "./data.js?v=20261028-2";
import { dessinerCarte } from "./carte.js?v=20261028-2";
import { memoire } from "./ui.js?v=20261028-2";

export function texteProchain(pc) {
  if (!pc) return "";
  const p = PISCINES[pc.cours.p];
  const quand = pc.dansJours === 0 ? "aujourd'hui" : pc.dansJours === 1 ? "demain" : JOURS[pc.cours.j];
  return `${quand.charAt(0).toUpperCase() + quand.slice(1)} à ${heure(pc.cours.d)} · ${p.lieu}`;
}

export function ficheHTML(id) {
  const p = PISCINES[id];
  const cours = COURS.filter((c) => c.p === id).sort((a, b) => a.j - b.j || a.d.localeCompare(b.d));
  const lignes = cours.map((c) => {
    const t = tarifPour(c.p, c.j);
    return `<li><span>${JOURS[c.j]}</span><span>${heure(c.d)} – ${heure(c.f)}${t ? ` · ${t.cours} cours ${chf(t.prix)}` : ""}</span></li>`;
  }).join("");
  const conf = cours.some((c) => c.aConfirmer) ? '<span class="a-confirmer">horaires à confirmer</span>' : "";
  return `
    <p class="surtitre">${p.canton}</p>
    <h3 class="fiche__lieu">${p.lieu}</h3>
    <p class="fiche__adresse"><span>${p.adresse}</span>${p.adresseOk ? "" : '<span class="a-confirmer">à compléter</span>'}</p>
    <ul class="fiche__cours">${lignes}</ul>
    <p class="note">${p.duree} minutes par séance · ${p.entree} ${conf}</p>
    <div class="actions"><a class="bouton bouton--corail bouton--petit magnet" href="horaires-tarifs.html#inscription" data-choisir-piscine="${id}"><span class="bouton__txt">Choisir cette piscine</span></a></div>`;
}

export function piscines({ surSelection } = {}) {
  const zone = document.querySelector("[data-carte]");
  const fiche = document.querySelector("[data-fiche]");
  if (!zone || !fiche) return null;
  const pc = prochainCours();
  const choisir = (id) => {
    carte.selectionner(id);
    fiche.innerHTML = ficheHTML(id);
    if (window.gsap && !document.documentElement.classList.contains("calme")) {
      gsap.fromTo(fiche.children, { y: 16, opacity: 0 }, { y: 0, opacity: 1, stagger: 0.04, duration: 0.6, ease: "power3.out", overwrite: true });
    }
    surSelection && surSelection(id);
  };
  const carte = dessinerCarte(zone, { surChoix: choisir });
  const boite = document.querySelector("[data-prochain]");
  if (pc && boite) {
    boite.hidden = false;
    boite.querySelector("[data-prochain-txt]").textContent = texteProchain(pc);
    carte.marquerProchain(pc.cours.p);
  }
  choisir(pc ? pc.cours.p : "cheserex");
  document.addEventListener("click", (e) => {
    const a = e.target.closest("[data-choisir-piscine]");
    if (a) memoire.ecrire("aqua-piscine", a.dataset.choisirPiscine);
  });
  return { carte, choisir };
}
