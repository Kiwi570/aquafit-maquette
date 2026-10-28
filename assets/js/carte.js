// Carte stylisée du Petit-Lac (Léman) avec les six piscines.
import { PISCINES } from "./data.js?v=20261028";

const NS = "http://www.w3.org/2000/svg";
const L = { w: 560, h: 640, lon0: 6.06, lat1: 46.5, kx: 1380, ky: 2000, ox: 59 };
export const projeter = (lat, lon) => [L.ox + (lon - L.lon0) * L.kx, (L.lat1 - lat) * L.ky];

// Rive nord (de Genève vers Rolle), puis rive sud (d'Yvoire vers Genève). Tracé simplifié.
const RIVE = [
  [46.2005, 6.1425], [46.2150, 6.1500], [46.2400, 6.1525], [46.2580, 6.1600], [46.2830, 6.1680],
  [46.3030, 6.1800], [46.3170, 6.1930], [46.3380, 6.2070], [46.3550, 6.2220], [46.3800, 6.2400],
  [46.4050, 6.2620], [46.4300, 6.2900], [46.4550, 6.3200], [46.4800, 6.3500], [46.5100, 6.3900],
  [46.5100, 6.4600], [46.4300, 6.4000], [46.4000, 6.3550], [46.3720, 6.3270], [46.3550, 6.3000],
  [46.3350, 6.2750], [46.3100, 6.2480], [46.2800, 6.2250], [46.2550, 6.2000], [46.2350, 6.1800],
  [46.2150, 6.1650], [46.2040, 6.1550],
];

function lisse(points) {
  // Catmull-Rom fermé converti en courbes de Bézier.
  const n = points.length;
  let d = `M${points[0][0].toFixed(1)} ${points[0][1].toFixed(1)}`;
  for (let i = 0; i < n; i++) {
    const p0 = points[(i - 1 + n) % n], p1 = points[i], p2 = points[(i + 1) % n], p3 = points[(i + 2) % n];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, p1[1] + (p2[1] - p0[1]) / 6];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, p2[1] - (p3[1] - p1[1]) / 6];
    d += ` C${c1[0].toFixed(1)} ${c1[1].toFixed(1)} ${c2[0].toFixed(1)} ${c2[1].toFixed(1)} ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d + "Z";
}

const el = (tag, attrs = {}, parent) => {
  const e = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) e.setAttribute(k, v);
  if (parent) parent.appendChild(e);
  return e;
};

const ETIQUETTES = {
  cheserex: { dx: -14, dy: -16, ancre: "end" },
  nyon: { dx: 16, dy: 5, ancre: "start" },
  bassins: { dx: 16, dy: 5, ancre: "start" },
  coppet: { dx: -16, dy: 5, ancre: "end" },
  chandieu: { dx: -16, dy: -6, ancre: "end" },
  paquis: { dx: 16, dy: 14, ancre: "start" },
};

export function dessinerCarte(conteneur, { surChoix } = {}) {
  const svg = el("svg", { viewBox: `0 0 ${L.w} ${L.h}`, role: "group", "aria-label": "Carte des six piscines autour du Léman" });
  const lac = el("path", { class: "leman-eau", d: lisse(RIVE.map(([la, lo]) => projeter(la, lo))), pathLength: "1", "data-lac": "" }, svg);
  const rhone = [[46.2010, 6.1420], [46.2040, 6.1250], [46.2000, 6.1000], [46.1930, 6.0700]].map(([la, lo]) => projeter(la, lo));
  el("path", { class: "leman-rhone", d: `M${rhone.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L")}`, "data-trace": "" }, svg);
  const [lx, ly] = projeter(46.31, 6.232);
  const nomLac = el("text", { class: "leman-lac", x: lx, y: ly, "text-anchor": "middle", transform: `rotate(-52 ${lx} ${ly})` }, svg);
  nomLac.textContent = "Léman";
  [["Vaud", 46.445, 6.10], ["Genève", 46.255, 6.075], ["France", 46.315, 6.335]].forEach(([t, la, lo]) => {
    const [x, y] = projeter(la, lo);
    el("text", { class: "leman-ville", x, y }, svg).textContent = t;
  });

  const pins = {};
  for (const [id, p] of Object.entries(PISCINES)) {
    const [x, y] = projeter(p.lat, p.lon);
    const g = el("g", { class: "pin", tabindex: "0", role: "button", "aria-label": `Piscine de ${p.nom}`, "data-pin": id, transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` }, svg);
    el("circle", { class: "pin__zone", r: "24" }, g);
    el("circle", { class: "pin__onde", r: "10" }, g);
    el("circle", { class: "pin__onde", r: "10" }, g);
    el("circle", { class: "pin__point", r: "8" }, g);
    const e = ETIQUETTES[id];
    const t = el("text", { class: "pin__nom", x: e.dx, y: e.dy, "text-anchor": e.ancre }, g);
    t.textContent = p.nom.replace("Genève · ", "");
    const choisir = () => surChoix && surChoix(id);
    g.addEventListener("click", choisir);
    g.addEventListener("keydown", (ev) => { if (ev.key === "Enter" || ev.key === " ") { ev.preventDefault(); choisir(); } });
    pins[id] = g;
  }
  conteneur.appendChild(svg);
  // Sur petit écran, la carte est réduite : on grossit les points pour qu'ils restent visibles.
  const ajuster = () => {
    const r = conteneur.clientWidth && conteneur.clientWidth < 520 ? 11 : 8;
    svg.querySelectorAll(".pin__point").forEach((c) => c.setAttribute("r", r));
  };
  ajuster();
  window.addEventListener("resize", ajuster);

  return {
    svg, lac, pins,
    selectionner(id) { Object.entries(pins).forEach(([k, g]) => g.classList.toggle("est-actif", k === id)); },
    marquerProchain(id) { Object.entries(pins).forEach(([k, g]) => g.classList.toggle("est-prochain", k === id)); },
  };
}
