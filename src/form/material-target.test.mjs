// The pure proof for the concept material accept-metric (T-073-01, story S-073, epic E-21).
//
// PURE — no GL/model/network (auto-collected by `src/**/*.test.mjs`). Proves the deterministic colour-
// agreement gate the material loop accepts on: the kernel (`colorAgreement`), the clustering on a
// synthetic decoded image, the `conceptMaterialTarget` adapter via an injected `_decode` (zero PNG decode),
// and `resolveMaterialTarget`. Groups: MT-kernel, MT-clusters, MT-target, MT-resolve, MT-imports.

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import {
  MATERIAL_TARGET_SCHEMA,
  colorAgreement,
  regionColorClusters,
  conceptMaterialTarget,
  resolveMaterialTarget,
} from "./material-target.mjs";
import { srgbToLab } from "../color/cielab.mjs";

const here = (rel) => fileURLToPath(new URL(rel, import.meta.url));
const labOf = (rgb) => srgbToLab(rgb);

/** A solid w×h RGBA image of one opaque colour (foreground — alpha 255, not the bg drop colour). */
function solidImage(rgb, w = 8, h = 8) {
  const data = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    data[i * 4] = rgb[0];
    data[i * 4 + 1] = rgb[1];
    data[i * 4 + 2] = rgb[2];
    data[i * 4 + 3] = 255;
  }
  return { width: w, height: h, data };
}

// --- MT-kernel --------------------------------------------------------------

test("MT-kernel: identical clusters → agreement 1", () => {
  const c = [{ lab: labOf([120, 120, 120]), coverage: 1 }];
  assert.equal(colorAgreement({ renderClusters: c, conceptClusters: c }), 1);
});

test("MT-kernel: far-apart colours → agreement ~0 (clamped at deltaEMax)", () => {
  const render = [{ lab: labOf([0, 0, 0]), coverage: 1 }];
  const concept = [{ lab: labOf([255, 255, 255]), coverage: 1 }];
  const a = colorAgreement({ renderClusters: render, conceptClusters: concept, deltaEMax: 40 });
  assert.ok(a < 0.01, `black vs white should bottom out, got ${a}`);
});

test("MT-kernel: coverage weights the agreement (a small bad cluster barely moves it)", () => {
  const grey = labOf([120, 120, 120]);
  const concept = [{ lab: grey, coverage: 1 }];
  const render = [
    { lab: grey, coverage: 0.9 }, // matches
    { lab: labOf([255, 0, 0]), coverage: 0.1 }, // far
  ];
  const a = colorAgreement({ renderClusters: render, conceptClusters: concept, deltaEMax: 40 });
  assert.ok(a > 0.85 && a < 1, `mostly-matching render scores high, got ${a}`);
});

test("MT-kernel: empty render or concept clusters → 0", () => {
  assert.equal(colorAgreement({ renderClusters: [], conceptClusters: [{ lab: [50, 0, 0], coverage: 1 }] }), 0);
  assert.equal(colorAgreement({ renderClusters: [{ lab: [50, 0, 0], coverage: 1 }], conceptClusters: [] }), 0);
});

test("MT-kernel: recolouring toward a concept colour RAISES agreement (the hill-climb signal)", () => {
  const concept = [{ lab: labOf([100, 100, 110]), coverage: 1 }]; // cool grey (the wall stone)
  const before = colorAgreement({ renderClusters: [{ lab: labOf([200, 120, 40]), coverage: 1 }], conceptClusters: concept }); // wrong (orange)
  const after = colorAgreement({ renderClusters: [{ lab: labOf([105, 105, 115]), coverage: 1 }], conceptClusters: concept }); // recoloured to near-concept
  assert.ok(after > before, `a concept-ward recolour must raise the gate: ${before} → ${after}`);
});

// --- MT-clusters ------------------------------------------------------------

test("MT-clusters: a solid foreground image yields one full-coverage cluster", () => {
  const { clusters, foregroundPx } = regionColorClusters(solidImage([130, 130, 130]), { k: 4 });
  assert.ok(foregroundPx > 0);
  assert.equal(clusters.length, 1, "one colour → one cluster");
  assert.ok(Math.abs(clusters[0].coverage - 1) < 1e-9);
});

test("MT-clusters: an all-background image → no clusters (foregroundPx 0)", () => {
  // The render bg drop colour (DEFAULTS.dropColor) at full alpha is dropped as background.
  const { clusters, foregroundPx } = regionColorClusters(solidImage([135, 206, 235]), {
    k: 4,
    dropColor: [135, 206, 235],
    dropTolerance: 10,
  });
  assert.equal(foregroundPx, 0);
  assert.equal(clusters.length, 0);
});

// --- MT-target --------------------------------------------------------------

test("MT-target: scoreRender via injected _decode — concept memoized, render scored against it", async () => {
  let conceptDecodes = 0;
  const concept = solidImage([110, 110, 120]);
  const _decode = async (path) => {
    if (path === "CONCEPT") {
      conceptDecodes++;
      return concept;
    }
    return solidImage([112, 112, 122]); // a render very close to the concept grey
  };
  const t = conceptMaterialTarget({ conceptPath: "CONCEPT", _decode, k: 4 });
  const a1 = await t.scoreRender("RENDER", {});
  const a2 = await t.wholeObjectScore("RENDER");
  assert.ok(a1 > 0.95, `near-concept render scores high, got ${a1}`);
  assert.ok(a2 > 0.95);
  assert.equal(conceptDecodes, 1, "the whole-concept clusters are decoded once and memoized");
});

test("MT-target: a wrong-colour render scores lower than a right-colour one", async () => {
  const concept = solidImage([110, 110, 120]);
  const make = (renderRgb) =>
    conceptMaterialTarget({
      conceptPath: "C",
      k: 4,
      _decode: async (p) => (p === "C" ? concept : solidImage(renderRgb)),
    });
  const right = await make([113, 113, 123]).scoreRender("R", {});
  const wrong = await make([210, 90, 30]).scoreRender("R", {});
  assert.ok(right > wrong, `right colour beats wrong: ${right} vs ${wrong}`);
});

// --- MT-resolve -------------------------------------------------------------

test("MT-resolve: pass-through a materialTarget; conceptPath default; else throw", () => {
  const fake = { kind: "x", scoreRender: () => 0 };
  assert.equal(resolveMaterialTarget({ materialTarget: fake }), fake);
  assert.equal(resolveMaterialTarget({ conceptPath: "c" }).kind, "concept");
  assert.throws(() => resolveMaterialTarget({}), /no material target/);
});

test("MT-resolve: schema tag is stable", () => {
  assert.equal(MATERIAL_TARGET_SCHEMA, "material-target/v1");
});

// --- MT-imports -------------------------------------------------------------

test("MT-imports: material-target.mjs's top-level imports pull no GL/render; liveMaterialScore is lazy", () => {
  const src = readFileSync(here("./material-target.mjs"), "utf8");
  const specs = [];
  const fromRe = /^\s*import\b[^]*?\bfrom\s*["']([^"']+)["']/gm;
  let m;
  while ((m = fromRe.exec(src)) !== null) specs.push(m[1]);
  const DENY = [/render/, /world/, /prismarine/, /\bthree\b/, /headless/, /\bgl\b/, /viewer/, /observeRegion/, /region\.mjs/];
  for (const s of specs) {
    for (const re of DENY) assert.ok(!re.test(s), `top-level import "${s}" must be lazy (matched ${re})`);
  }
  assert.ok(/await import\(\s*["']\.\.\/revise\/region\.mjs/.test(src), "liveMaterialScore lazy-imports observeRegion");
});
