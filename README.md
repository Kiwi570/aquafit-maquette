# Aquafit-Aquagym · maquette « Immersion »

Site statique (HTML, CSS, JavaScript), sans étape de construction. Prêt pour Vercel (`vercel.json`, URL propres).

## Pages
- `index.html` : accueil
- `horaires-tarifs.html` : planning, carte des piscines, calcul au prorata, tarifs, inscription simulée
- `pour-qui.html` : questionnaire, profils, intensité, sac de piscine

## Mettre à jour les horaires et les tarifs
Tout est dans **`assets/js/data.js`** : session, piscines, cours, tarifs.
Chaque cours porte `aConfirmer: true` tant que le planning n'est pas validé par Salma et Morgane ;
passez-le à `false` une fois confirmé (le badge « à confirmer » disparaît).

## Bibliothèques hébergées avec le site
GSAP 3.15 (ScrollTrigger, SplitText), OGL (WebGL). Polices Instrument Serif et Manrope (licence OFL, dans `assets/fonts`).

## Accessibilité
Bouton « Mode calme » toujours visible (aucune animation, aucun WebGL), réglage système « réduire les animations » respecté,
version sans WebGL automatique. La musique ne démarre qu'après un clic.
