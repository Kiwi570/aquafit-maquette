// Défilement fluide à la molette (souris et pavé tactile), dans l'esprit de Lenis.
// La position native reste la référence : ScrollTrigger, les ancres et le clavier fonctionnent normalement.
export function creerGlisse({ amorti = 0.095 } = {}) {
  let cible = window.scrollY, courant = window.scrollY, enCours = false, actif = true, raf = 0;
  const ecouteurs = new Set();
  const max = () => document.documentElement.scrollHeight - window.innerHeight;

  let avant = 0;
  function etape(now) {
    // Lissage indépendant de la fréquence d'images : même vitesse à 30, 60 ou 120 images par seconde.
    const dt = avant ? Math.min(100, now - avant) : 16.7;
    avant = now;
    courant += (cible - courant) * (1 - Math.pow(1 - amorti, dt / 16.7));
    if (Math.abs(cible - courant) < 0.4) { courant = cible; enCours = false; avant = 0; }
    window.scrollTo(0, courant);
    ecouteurs.forEach((f) => f(courant));
    if (enCours) raf = requestAnimationFrame(etape);
  }
  function lancer() { if (!enCours) { enCours = true; raf = requestAnimationFrame(etape); } }

  function surMolette(e) {
    if (!actif || e.ctrlKey || e.defaultPrevented) return;
    const zone = e.target.closest && e.target.closest("[data-defilement-natif], .menu-mobile, textarea, select");
    if (zone) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) return;
    e.preventDefault();
    const facteur = e.deltaMode === 1 ? 40 : e.deltaMode === 2 ? window.innerHeight : 1;
    if (!enCours) { courant = window.scrollY; cible = courant; }
    cible = Math.max(0, Math.min(max(), cible + e.deltaY * facteur));
    lancer();
  }
  window.addEventListener("wheel", surMolette, { passive: false });
  window.addEventListener("scroll", () => { if (!enCours) { cible = courant = window.scrollY; } }, { passive: true });

  return {
    vers(destination, { decalage = 0 } = {}) {
      const y = typeof destination === "number" ? destination
        : destination.getBoundingClientRect().top + window.scrollY + decalage;
      if (!actif) { window.scrollTo(0, y); return; }
      courant = window.scrollY;
      cible = Math.max(0, Math.min(max(), y));
      lancer();
    },
    surDefilement(f) { ecouteurs.add(f); },
    activer(oui) { actif = oui; if (!oui) { cancelAnimationFrame(raf); enCours = false; } },
  };
}
