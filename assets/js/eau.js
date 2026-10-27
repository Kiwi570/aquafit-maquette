// Reflets de fond de piscine (caustiques) en WebGL, avec OGL.
// La toile est fixe, en mode de fusion « screen » : le noir n'ajoute rien,
// seules les lignes de lumière éclairent la page.
import { Renderer } from "./vendor/ogl/core/Renderer.js";
import { Program } from "./vendor/ogl/core/Program.js";
import { Mesh } from "./vendor/ogl/core/Mesh.js";
import { Triangle } from "./vendor/ogl/extras/Triangle.js";
import { Flowmap } from "./vendor/ogl/extras/Flowmap.js";
import { Vec2 } from "./vendor/ogl/math/Vec2.js";
import { Texture } from "./vendor/ogl/core/Texture.js";

const vertex = /* glsl */ `
attribute vec2 uv;
attribute vec2 position;
varying vec2 vUv;
void main() { vUv = uv; gl_Position = vec4(position, 0.0, 1.0); }
`;

const fragment = /* glsl */ `
precision highp float;
uniform float uTime;
uniform vec2 uRes;
uniform float uDepth;      // 0 = surface, 1 = fond
uniform float uBeat;       // impulsion musicale 0..1
uniform float uIntensity;  // 0..1 (curseur « intensité »)
uniform sampler2D tFlow;
varying vec2 vUv;

vec2 hash2(vec2 p) {
  p = vec2(dot(p, vec2(127.1, 311.7)), dot(p, vec2(269.5, 183.3)));
  return fract(sin(p) * 43758.5453);
}
float hash(vec2 p) { return fract(sin(dot(p, vec2(41.3, 289.1))) * 45758.5453); }
float noise(vec2 p) {
  vec2 i = floor(p), f = fract(p);
  vec2 u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hash(i), hash(i + vec2(1.0, 0.0)), u.x), mix(hash(i + vec2(0.0, 1.0)), hash(i + vec2(1.0, 1.0)), u.x), u.y);
}
// Distance au bord de cellule de Voronoï : les bords forment le réseau lumineux.
float bord(vec2 x, float t) {
  vec2 n = floor(x), f = fract(x);
  float m1 = 8.0, m2 = 8.0;
  for (int j = -1; j <= 1; j++) {
    for (int i = -1; i <= 1; i++) {
      vec2 g = vec2(float(i), float(j));
      vec2 o = hash2(n + g);
      o = 0.5 + 0.45 * sin(t + 6.2831 * o);
      vec2 r = g + o - f;
      float d = dot(r, r);
      if (d < m1) { m2 = m1; m1 = d; } else if (d < m2) { m2 = d; }
    }
  }
  return sqrt(m2) - sqrt(m1);
}
float caustique(vec2 p, float t, float epaisseur) {
  p += 0.8 * vec2(noise(p * 0.55 + t * 0.15), noise(p * 0.55 - t * 0.12 + 7.3)) - 0.4;
  float e = bord(p, t);
  return 1.0 - smoothstep(0.0, epaisseur, e);
}

void main() {
  vec2 uv = vUv;
  float aspect = uRes.x / uRes.y;
  vec3 flow = texture2D(tFlow, uv).rgb;
  vec2 p = uv * vec2(aspect, 1.0);
  p -= flow.xy * flow.b * 0.35;

  float vitesse = 0.55 + uIntensity * 1.4;
  float t = uTime * vitesse;
  float echelle = mix(3.2, 4.6, uDepth);
  float ep = mix(0.10, 0.05, uDepth) + uBeat * 0.03 + uIntensity * 0.05;

  float c1 = caustique(p * echelle, t * 0.9, ep);
  float c2 = caustique(p * echelle * 1.6 + 3.7, t * 1.25, ep * 0.8);
  float c = c1 * 0.7 + c2 * 0.4;
  c *= 0.55 + 0.45 * noise(p * 1.3 + t * 0.1);
  c = pow(c, 2.0);

  // Rayons de soleil depuis la surface, plus présents près de la surface.
  float ang = (uv.x - 0.5) * 1.6 + uv.y * 0.35;
  float rayons = noise(vec2(ang * 7.0 + uTime * 0.05, uTime * 0.08));
  rayons = pow(rayons, 3.0) * smoothstep(0.0, 1.0, uv.y) * (1.0 - uDepth) * 0.55;

  float force = mix(0.55, 0.13, uDepth) + uBeat * 0.3 + uIntensity * 0.3;
  float vignette = smoothstep(1.25, 0.3, length((uv - 0.5) * vec2(aspect * 0.8, 1.0)));
  float trace = flow.b * 0.35;

  vec3 lagon = vec3(0.224, 0.776, 0.839);
  vec3 ecume = vec3(0.85, 0.97, 0.98);
  vec3 col = mix(lagon, ecume, c * 0.5) * c * force * vignette;
  col += lagon * rayons;
  col += lagon * trace * c;
  gl_FragColor = vec4(col, 1.0);
}
`;

function webglDisponible() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) { return false; }
}

export function creerEau(canvas) {
  if (!webglDisponible()) return null;
  let renderer;
  try {
    renderer = new Renderer({ canvas, dpr: 1, alpha: false, antialias: false, powerPreference: "low-power" });
  } catch (e) {
    return null;
  }
  const gl = renderer.gl;
  if (!gl) return null;
  gl.clearColor(0, 0, 0, 1);

  let qualite = Math.min(window.devicePixelRatio || 1, 1.25) * 0.7;
  let flowmap;
  try {
    flowmap = new Flowmap(gl, { falloff: 0.25, dissipation: 0.94, alpha: 0.6 });
  } catch (e) {
    // Pas de textures flottantes : on garde les reflets, sans la traîne du curseur.
    const vide = new Texture(gl, { image: new Uint8Array([0, 0, 0, 0]), width: 1, height: 1, generateMipmaps: false });
    flowmap = { uniform: { value: vide }, mouse: new Vec2(), velocity: new Vec2(), aspect: 1, update() {} };
  }
  const geometry = new Triangle(gl);
  const program = new Program(gl, {
    vertex, fragment,
    uniforms: {
      uTime: { value: 0 }, uRes: { value: [1, 1] }, uDepth: { value: 0.3 },
      uBeat: { value: 0 }, uIntensity: { value: 0 }, tFlow: flowmap.uniform,
    },
  });
  const mesh = new Mesh(gl, { geometry, program });

  const souris = new Vec2(-1);
  const vitesse = new Vec2();
  let dernier = null;
  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.dpr = qualite;
    renderer.setSize(w, h);
    canvas.style.width = w + "px";
    canvas.style.height = h + "px";
    program.uniforms.uRes.value = [w, h];
    flowmap.aspect = w / h;
  }
  resize();
  window.addEventListener("resize", resize);

  window.addEventListener("pointermove", (e) => {
    const x = e.clientX / window.innerWidth, y = 1 - e.clientY / window.innerHeight;
    const maintenant = performance.now();
    if (dernier) {
      const dt = Math.max(14, maintenant - dernier.t);
      vitesse.x = (x - dernier.x) / dt * 16;
      vitesse.y = (y - dernier.y) / dt * 16;
    }
    souris.set(x, y);
    dernier = { x, y, t: maintenant };
  }, { passive: true });

  const etat = { depth: 0.3, beat: 0, intensite: 0, actif: true };
  let t0 = performance.now(), dtMoy = 16, frames = 0, raf = 0;

  function boucle(now) {
    raf = requestAnimationFrame(boucle);
    if (!etat.actif) return;
    const dt = now - t0; t0 = now;
    dtMoy += (dt - dtMoy) * 0.05;
    if (++frames % 90 === 0 && dtMoy > 24 && qualite > 0.35) { qualite *= 0.8; resize(); }

    flowmap.mouse.copy(souris);
    flowmap.velocity.lerp(vitesse, 0.12);
    vitesse.multiply(0.9);
    flowmap.update();

    const u = program.uniforms;
    u.uTime.value = now / 1000;
    u.uDepth.value += (etat.depth - u.uDepth.value) * 0.05;
    u.uBeat.value += (etat.beat - u.uBeat.value) * 0.25;
    etat.beat *= 0.9;
    u.uIntensity.value += (etat.intensite - u.uIntensity.value) * 0.05;
    renderer.render({ scene: mesh });
  }
  raf = requestAnimationFrame(boucle);
  document.addEventListener("visibilitychange", () => { etat.actif = !document.hidden; });

  return {
    etat,
    arreter() { cancelAnimationFrame(raf); etat.actif = false; gl.clear(gl.COLOR_BUFFER_BIT); },
    reprendre() { etat.actif = true; if (!raf) raf = requestAnimationFrame(boucle); },
  };
}
