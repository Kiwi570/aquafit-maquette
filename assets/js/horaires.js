// Page Horaires & tarifs : planning en lignes d'eau, calculateur au prorata, tarifs, inscription simulée.
import { PISCINES, COURS, JOURS, TARIFS, SESSION, heure, enMinutes, maintenantSuisse, prochainCours, tarifPour, seancesPassees, chf } from "./data.js";
import { memoire } from "./ui.js";

const H0 = 7.5 * 60, H1 = 21 * 60; // axe horaire du planning
const pos = (m) => ((m - H0) / (H1 - H0)) * 100;
const idCours = (c) => `${c.p}-${c.j}-${c.d}`;
const libelle = (c) => `${PISCINES[c.p].nom} · ${JOURS[c.j]} ${heure(c.d)} – ${heure(c.f)}`;
const calme = () => document.documentElement.classList.contains("calme");

function session() {
  const t = document.querySelector("[data-session-txt]");
  if (!t) return;
  const n = maintenantSuisse();
  t.textContent = n.iso < SESSION.debut ? "commence le lundi 17 août" : "en cours depuis le lundi 17 août · entrée possible au prorata";
}

function planning() {
  const zone = document.querySelector("[data-planning]");
  const filtres = document.querySelector("[data-filtre-piscines]");
  const legende = document.querySelector("[data-legende]");
  const detail = document.querySelector("[data-planning-detail]");
  if (!zone) return;
  const n = maintenantSuisse();
  const pc = prochainCours();
  let filtre = "tous";

  let html = '<div class="planning__axe" aria-hidden="true"><span></span><div class="planning__heures">';
  for (let h = 8; h <= 20; h += 2) html += `<span style="left:${pos(h * 60)}%">${h}h</span>`;
  html += "</div></div>";
  for (let j = 1; j <= 6; j++) {
    const cours = COURS.filter((c) => c.j === j).sort((a, b) => a.d.localeCompare(b.d));
    const auj = j === n.j;
    // Deux cours trop proches se rangent sur deux rangées pour ne pas se chevaucher.
    const fins = [];
    const rangs = cours.map((c) => {
      const d = enMinutes(c.d), f = Math.max(enMinutes(c.f), d + 62);
      let r = fins.findIndex((x) => x <= d);
      if (r === -1) { r = fins.length; fins.push(f); } else fins[r] = f;
      return r;
    });
    const double = fins.length > 1;
    html += `<div class="couloir${auj ? " est-aujourdhui" : ""}${cours.length ? "" : " est-vide"}" role="group" aria-label="${JOURS[j]}">
      <div class="couloir__jour">${JOURS[j]}${auj ? "<small>aujourd'hui</small>" : ""}</div><div class="couloir__bassin${double ? " couloir__bassin--double" : ""}">`;
    if (auj && n.minutes > H0 && n.minutes < H1) html += `<span class="maintenant" style="left:${pos(n.minutes)}%" aria-hidden="true"></span>`;
    cours.forEach((c, k) => {
      const haut = double ? (rangs[k] === 0 ? 27 : 73) : 50;
      const p = PISCINES[c.p];
      const prochain = pc && idCours(pc.cours) === idCours(c);
      const larg = Math.max(pos(enMinutes(c.f)) - pos(enMinutes(c.d)), 5.5);
      html += `<button type="button" class="cours${prochain ? " est-prochain" : ""}" data-cours="${idCours(c)}" data-piscine="${c.p}"
        style="left:${pos(enMinutes(c.d))}%;width:${larg}%;top:${haut}%;--c:${p.couleur}" aria-label="${libelle(c)}${prochain ? ", prochain cours" : ""}">
        <i aria-hidden="true"></i>${heure(c.d)}</button>`;
    });
    html += "</div></div>";
  }
  zone.innerHTML = html;

  const ids = ["tous", ...Object.keys(PISCINES)];
  filtres.innerHTML = ids.map((id) => `<button type="button" class="puce" data-filtre="${id}" aria-pressed="${id === "tous"}">${id === "tous" ? "Toutes" : PISCINES[id].nom}</button>`).join("");
  legende.innerHTML = Object.entries(PISCINES).map(([, p]) => `<span><i style="--c:${p.couleur}"></i>${p.nom}</span>`).join("");

  const appliquer = (id) => {
    filtre = id;
    filtres.querySelectorAll("[data-filtre]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.filtre === id)));
    zone.querySelectorAll(".cours").forEach((b) => b.classList.toggle("est-filtre", id !== "tous" && b.dataset.piscine !== id));
    zone.querySelectorAll(".couloir").forEach((cl) => {
      const visibles = [...cl.querySelectorAll(".cours")].some((b) => !b.classList.contains("est-filtre"));
      cl.classList.toggle("est-vide", !visibles);
    });
  };
  filtres.addEventListener("click", (e) => { const b = e.target.closest("[data-filtre]"); if (b) appliquer(b.dataset.filtre); });

  const montrer = (id) => {
    const c = COURS.find((x) => idCours(x) === id);
    if (!c) return;
    zone.querySelectorAll(".cours").forEach((b) => b.classList.toggle("est-actif", b.dataset.cours === id));
    const p = PISCINES[c.p], t = tarifPour(c.p, c.j);
    detail.innerHTML = `<div class="fiche" style="grid-template-columns:minmax(0,1fr) auto;align-items:center">
      <div class="pile pile--serre"><p class="surtitre">${p.canton} · ${p.duree} min</p><p class="titre-m">${p.lieu}, ${JOURS[c.j]} ${heure(c.d)} – ${heure(c.f)}</p>
      <p class="note">${t ? `${t.cours} cours · ${chf(t.prix)} la session · ` : ""}${p.entree} <span class="a-confirmer">à confirmer</span></p></div>
      <a class="bouton bouton--corail bouton--petit" href="#inscription" data-choisir-cours="${id}"><span class="bouton__txt">Choisir</span></a></div>`;
    if (window.gsap && !calme()) gsap.fromTo(detail.firstElementChild, { y: 14, opacity: 0 }, { y: 0, opacity: 1, duration: 0.5, ease: "power3.out" });
  };
  zone.addEventListener("click", (e) => { const b = e.target.closest("[data-cours]"); if (b) montrer(b.dataset.cours); });
  document.addEventListener("click", (e) => { const a = e.target.closest("[data-choisir-cours]"); if (a) choisirCours(a.dataset.choisirCours); });
  if (pc) montrer(idCours(pc.cours));

  if (window.gsap && !calme()) {
    gsap.fromTo(zone.querySelectorAll(".cours"), { scale: 0, opacity: 0 }, {
      scale: 1, opacity: 1, duration: 0.8, ease: "back.out(2.2)", stagger: { each: 0.04, from: "start" }, clearProps: "opacity,scale",
      scrollTrigger: { trigger: zone, start: "top 75%", once: true },
    });
  }
  return { appliquer };
}

// ---------- Listes de créneaux partagées par le calculateur et l'inscription ----------
const options = () => COURS.slice().sort((a, b) => a.j - b.j || a.d.localeCompare(b.d))
  .map((c) => `<option value="${idCours(c)}">${libelle(c)}</option>`).join("");

let selectInscription = null;
function choisirCours(id) {
  if (selectInscription) { selectInscription.value = id; selectInscription.dispatchEvent(new Event("change")); }
  const calc = document.querySelector("[data-calc-cours]");
  if (calc) { calc.value = id; calc.dispatchEvent(new Event("change")); }
}

function compteur(el, valeur, format = (v) => Math.round(v)) {
  if (!window.gsap || calme()) { el.textContent = format(valeur); return; }
  const o = { v: parseFloat(el.dataset.v || 0) };
  gsap.to(o, { v: valeur, duration: 1, ease: "power3.out", onUpdate: () => { el.textContent = format(o.v); } });
  el.dataset.v = valeur;
}

function calculateur() {
  const form = document.querySelector("[data-calc]");
  if (!form) return;
  const sel = form.querySelector("[data-calc-cours]");
  sel.innerHTML = options();
  const pc = prochainCours();
  if (pc) sel.value = idCours(pc.cours);
  const total = form.querySelector("[data-calc-total]");
  const rest = form.querySelector("[data-calc-restantes]");
  const prix = form.querySelector("[data-calc-prix]");
  const maj = () => {
    const c = COURS.find((x) => idCours(x) === sel.value);
    const t = c && tarifPour(c.p, c.j);
    if (!t) { total.textContent = "–"; rest.textContent = "–"; prix.textContent = "à compléter"; return; }
    const r = Math.max(0, t.cours - seancesPassees(c));
    compteur(total, t.cours);
    compteur(rest, r);
    compteur(prix, (t.prix / t.cours) * r, (v) => chf(v));
  };
  sel.addEventListener("change", maj);
  form.addEventListener("submit", (e) => e.preventDefault());
  form.querySelector("[data-calc-inscrire]").addEventListener("click", () => choisirCours(sel.value));
  maj();
}

function tarifs() {
  const zone = document.querySelector("[data-tarifs]");
  if (!zone) return;
  zone.innerHTML = TARIFS.map((t, i) => {
    const p = PISCINES[t.p];
    const jours = t.jours.map((j) => JOURS[j]).join(", ");
    return `<article class="tarif" data-tarif>
      <div class="tarif__inner">
        <div class="tarif__face">
          <p class="surtitre">${p.canton}</p>
          <h3 class="tarif__lieu">${p.nom}</h3>
          <p class="tarif__meta">${jours} · ${p.duree} min</p>
          <p class="tarif__prix">${chf(t.prix)}<small>${t.cours} cours</small></p>
          <p class="tarif__meta">soit ${chf(t.prix / t.cours)} la séance ${t.aConfirmer ? '<span class="a-confirmer">à confirmer</span>' : ""}</p>
          <button class="tarif__retourner" type="button" aria-expanded="false" aria-controls="tarif-dos-${i}">Ce qui est compris</button>
        </div>
        <div class="tarif__face tarif__face--dos" id="tarif-dos-${i}">
          <h3>${p.lieu}</h3>
          <ul>
            <li>${p.entree}</li>
            <li>Gilet prêté pendant les cours</li>
            <li>Cours manqués rattrapables pendant la session</li>
            <li>Cours d'essai offert avant de s'inscrire</li>
          </ul>
          <button class="tarif__retourner" type="button" aria-expanded="true" aria-controls="tarif-dos-${i}">Retour au prix</button>
        </div>
      </div></article>`;
  }).join("");
  zone.addEventListener("click", (e) => {
    const b = e.target.closest(".tarif__retourner");
    if (!b) return;
    const carte = b.closest("[data-tarif]");
    const retourne = carte.classList.toggle("est-retourne");
    carte.querySelectorAll(".tarif__retourner").forEach((x) => x.setAttribute("aria-expanded", String(retourne)));
    const cible = carte.querySelector(retourne ? ".tarif__face--dos .tarif__retourner" : ".tarif__face:not(.tarif__face--dos) .tarif__retourner");
    setTimeout(() => cible.focus({ preventScroll: true }), 300);
  });
  if (window.gsap && !calme()) {
    gsap.from(zone.children, { y: 60, opacity: 0, rotateX: -20, duration: 1, ease: "expo.out", stagger: 0.08, scrollTrigger: { trigger: zone, start: "top 80%", once: true } });
  }
}

function inscription() {
  const form = document.querySelector("[data-inscription]");
  if (!form) return;
  const sel = form.querySelector("[data-ins-cours]");
  selectInscription = sel;
  sel.innerHTML = options();
  const choixPiscine = memoire.lire("aqua-piscine");
  const pc = prochainCours(choixPiscine ? (c) => c.p === choixPiscine : undefined) || prochainCours();
  if (pc) sel.value = idCours(pc.cours);
  memoire.ecrire("aqua-piscine", "");

  const etapes = [...form.querySelectorAll("[data-etape]")];
  const prec = form.querySelector("[data-precedent]");
  const suiv = form.querySelector("[data-suivant]");
  const erreur = form.querySelector("[data-erreur]");
  const eau = document.querySelector("[data-niveau-eau]");
  const reperes = [...document.querySelectorAll("[data-niveau-etape]")];
  const nav = form.querySelector("[data-nav-etapes]");
  let n = 1;

  const afficher = (k) => {
    n = k;
    etapes.forEach((e) => { e.hidden = e.dataset.etape !== String(k); });
    prec.hidden = k === 1 || k === "succes";
    nav.hidden = k === "succes";
    suiv.textContent = k === 3 ? "Envoyer la demande (simulation)" : "Continuer";
    erreur.hidden = true;
    const niveau = k === "succes" ? 100 : [0, 18, 52, 82][k];
    if (eau) eau.style.height = niveau + "%";
    reperes.forEach((r) => {
      const i = +r.dataset.niveauEtape;
      r.classList.toggle("est-active", i === k);
      r.classList.toggle("est-faite", k === "succes" || i < k);
    });
    const actif = etapes.find((e) => !e.hidden);
    if (window.gsap && !calme() && actif) gsap.fromTo(actif, { x: 30, opacity: 0 }, { x: 0, opacity: 1, duration: 0.6, ease: "power3.out" });
    if (k === "succes" && actif) actif.focus();
  };

  const recap = () => {
    const c = COURS.find((x) => idCours(x) === sel.value);
    const t = c && tarifPour(c.p, c.j);
    const essai = form.formule.value === "essai";
    const r = c && t ? Math.max(0, t.cours - seancesPassees(c)) : 0;
    const lignes = [
      ["Formule", essai ? "Cours d'essai offert" : "Abonnement de session"],
      ["Créneau", c ? libelle(c) : "–"],
      ["Nom", `${form.prenom.value} ${form.nom.value}`.trim()],
      ["E-mail", form.email.value],
      ["Téléphone", form.tel.value || "–"],
      ["Prix", essai ? "Offert" : t ? `${chf((t.prix / t.cours) * r)} (estimation, ${r} séances restantes)` : "à compléter"],
    ];
    form.querySelector("[data-recap]").innerHTML = lignes.map(([a, b]) => `<div><dt>${a}</dt><dd>${b.replace(/</g, "&lt;")}</dd></div>`).join("");
  };

  prec.addEventListener("click", () => afficher(Math.max(1, n - 1)));
  form.addEventListener("submit", (e) => {
    e.preventDefault();
    if (n === 2) {
      const manque = ["prenom", "nom", "email"].filter((k) => !form[k].value.trim());
      const mailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.value.trim());
      if (manque.length || !mailOk) {
        erreur.hidden = false;
        erreur.textContent = manque.length ? "Indiquez votre prénom, votre nom et votre e-mail pour continuer." : "L'adresse e-mail semble incomplète : vérifiez-la (exemple : prenom@domaine.ch).";
        form[manque[0] || "email"].focus();
        return;
      }
      recap();
    }
    if (n === 3) { afficher("succes"); return; }
    afficher(n + 1);
  });
  form.querySelector("[data-recommencer]").addEventListener("click", () => { form.reset(); afficher(1); });
  afficher(1);
}

export function pageHoraires() {
  session();
  planning();
  calculateur();
  tarifs();
  inscription();
}
