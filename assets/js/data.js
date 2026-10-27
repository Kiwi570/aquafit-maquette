// =====================================================================
// Données de la maquette : UN SEUL FICHIER à mettre à jour.
// Le planning et les tarifs sont repris du site actuel (aquafitaquagym.com,
// page Horaires & Tarifs). La répartition jour / piscine / prix doit être
// confirmée par Salma et Morgane avant la mise en ligne : chaque entrée
// porte aConfirmer: true tant que ce n'est pas fait.
// =====================================================================

export const SESSION = {
  nom: "Session août – décembre 2026",
  debut: "2026-08-17",           // lundi 17 août 2026 (annoncé sur le site)
  fin: null,                      // date de fin à compléter
  inscriptionEnCours: true,       // entrée en cours de session au prorata
};

export const CONTACT = {
  telephone: "079 485 04 53",
  telephoneInternational: "+41794850453",
  email: "aquafitaquagym@gmail.com",
  facebook: "https://www.facebook.com/aquafitaquagym",
};

// Coordonnées approximatives, pour placer les piscines sur la carte stylisée.
export const PISCINES = {
  cheserex: { nom: "Chéserex", court: "Chéserex", lieu: "Piscine intercommunale Asse et Boiron", adresse: "Ch. des Grands Vignes 9, 1275 Chéserex", adresseOk: true, canton: "Vaud", lat: 46.4005, lon: 6.1735, couleur: "#39C6D6", entree: "Entrée de la piscine non comprise", duree: 50 },
  nyon: { nom: "Nyon", court: "Nyon", lieu: "Piscine du Rocher", adresse: "Adresse à compléter", adresseOk: false, canton: "Vaud", lat: 46.3830, lon: 6.2390, couleur: "#9BE6EE", entree: "Entrée de la piscine comprise", duree: 50 },
  bassins: { nom: "Bassins", court: "Bassins", lieu: "Piscine de Bassins", adresse: "Adresse à compléter", adresseOk: false, canton: "Vaud", lat: 46.4620, lon: 6.2330, couleur: "#7FD8B4", entree: "Entrée de la piscine comprise", duree: 50 },
  coppet: { nom: "Coppet", court: "Coppet", lieu: "Piscine des Rojalets", adresse: "Adresse à confirmer", adresseOk: false, canton: "Vaud", lat: 46.3150, lon: 6.1870, couleur: "#FFB86B", entree: "Entrée de la piscine à confirmer", duree: 45 },
  chandieu: { nom: "Genève · Chandieu", court: "Chandieu", lieu: "Piscine de Chandieu", adresse: "Adresse à compléter", adresseOk: false, canton: "Genève", lat: 46.2236, lon: 6.1340, couleur: "#FF8E78", entree: "Entrée de la piscine comprise", duree: 50 },
  paquis: { nom: "Genève · Pâquis-Centre", court: "Pâquis", lieu: "Piscine de Pâquis-Centre", adresse: "Adresse à compléter", adresseOk: false, canton: "Genève", lat: 46.2135, lon: 6.1445, couleur: "#C9A7FF", entree: "Entrée de la piscine comprise", duree: 50 },
};

export const JOURS = ["dimanche", "lundi", "mardi", "mercredi", "jeudi", "vendredi", "samedi"];

// j : 1 = lundi … 6 = samedi
export const COURS = [
  { p: "cheserex", j: 1, d: "08:00", f: "08:50", aConfirmer: true },
  { p: "cheserex", j: 1, d: "09:00", f: "09:50", aConfirmer: true },
  { p: "cheserex", j: 1, d: "19:30", f: "20:20", aConfirmer: true },
  { p: "coppet", j: 2, d: "08:00", f: "08:45", aConfirmer: true },
  { p: "coppet", j: 2, d: "08:55", f: "09:40", aConfirmer: true },
  { p: "nyon", j: 2, d: "12:15", f: "13:05", aConfirmer: true },
  { p: "cheserex", j: 2, d: "13:00", f: "13:50", aConfirmer: true },
  { p: "bassins", j: 3, d: "08:40", f: "09:30", aConfirmer: true },
  { p: "bassins", j: 3, d: "09:40", f: "10:30", aConfirmer: true },
  { p: "nyon", j: 3, d: "19:15", f: "20:05", aConfirmer: true },
  { p: "cheserex", j: 4, d: "11:00", f: "11:50", aConfirmer: true },
  { p: "cheserex", j: 4, d: "12:00", f: "12:50", aConfirmer: true },
  { p: "coppet", j: 4, d: "19:30", f: "20:15", aConfirmer: true },
  { p: "coppet", j: 5, d: "11:30", f: "12:15", aConfirmer: true },
  { p: "coppet", j: 5, d: "12:25", f: "13:10", aConfirmer: true },
  { p: "chandieu", j: 5, d: "12:00", f: "12:50", aConfirmer: true },
  { p: "paquis", j: 6, d: "09:30", f: "10:20", aConfirmer: true },
];

// Abonnement de la session, par piscine et par jour (CHF). Valeurs du tableau
// actuel, dont l'attribution reste à confirmer.
export const TARIFS = [
  { p: "cheserex", jours: [1, 2, 4], cours: 16, prix: 400, aConfirmer: true },
  { p: "coppet", jours: [2], cours: 16, prix: 432, aConfirmer: true },
  { p: "coppet", jours: [4], cours: 17, prix: 459, aConfirmer: true },
  { p: "coppet", jours: [5], cours: 16, prix: 432, aConfirmer: true },
  { p: "nyon", jours: [2, 3], cours: 17, prix: 425, aConfirmer: true },
  { p: "bassins", jours: [3], cours: 15, prix: 510, aConfirmer: true },
  { p: "chandieu", jours: [5], cours: 16, prix: 544, aConfirmer: true },
  { p: "paquis", jours: [6], cours: 17, prix: 578, aConfirmer: true },
];

export function tarifPour(p, j) {
  return TARIFS.find((t) => t.p === p && t.jours.includes(j)) || null;
}

// ---------- Outils de date (fuseau Europe/Zurich) ----------
export function maintenantSuisse() {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Zurich", year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hourCycle: "h23", weekday: "short",
  }).formatToParts(new Date());
  const v = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  const jours = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return {
    annee: +v.year, mois: +v.month, jour: +v.day, j: jours[v.weekday],
    minutes: (+v.hour) * 60 + (+v.minute),
    iso: `${v.year}-${v.month}-${v.day}`,
  };
}

export const enMinutes = (hhmm) => { const [h, m] = hhmm.split(":").map(Number); return h * 60 + m; };
export const heure = (hhmm) => hhmm.replace(":", "h");

// Prochain cours à partir de maintenant (cherche sur 7 jours).
export function prochainCours(filtre = () => true) {
  const n = maintenantSuisse();
  for (let k = 0; k < 8; k++) {
    const j = (n.j + k) % 7;
    const candidats = COURS.filter((c) => c.j === j && filtre(c))
      .filter((c) => k > 0 || enMinutes(c.d) > n.minutes)
      .sort((a, b) => enMinutes(a.d) - enMinutes(b.d));
    if (candidats.length) return { cours: candidats[0], dansJours: k };
  }
  return null;
}

// Nombre d'occurrences d'un jour de semaine déjà passées depuis le début de session.
// Estimation : les vacances scolaires ne sont pas déduites.
export function seancesPassees(cours) {
  const n = maintenantSuisse();
  const debut = new Date(SESSION.debut + "T00:00:00Z");
  const auj = new Date(n.iso + "T00:00:00Z");
  if (auj < debut) return 0;
  let premier = new Date(debut);
  while (premier.getUTCDay() !== cours.j) premier.setUTCDate(premier.getUTCDate() + 1);
  if (auj < premier) return 0;
  const semaines = Math.floor((auj - premier) / (7 * 864e5));
  let passees = semaines + 1;
  const memeJour = auj.getUTCDay() === cours.j;
  if (memeJour && enMinutes(cours.d) > n.minutes) passees -= 1;
  return Math.max(0, passees);
}

export const chf = (x) => new Intl.NumberFormat("fr-CH", { maximumFractionDigits: 0 }).format(Math.round(x)) + ".–";
