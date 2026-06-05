// Reuse-boundary guard for the portable color engine (T-023-01, story S-023, epic E-10).
//
// LOAD-BEARING RULE: src/color/cielab.mjs is the portable voxelizer color core — it must
// stay free of any mc-design-eval / Minecraft / DesignArtifact coupling so that BOTH the
// 2-D adapters (palette-extract, image-grid) AND Epic E-09's 3-D voxelizer (stage 4) can
// import it. A stray `../` import or a `minecraft-*` dependency would quietly couple the
// engine to this project and break that reuse. See cielab.mjs's header for the contract.
//
// This test enforces the rule two ways: (1) a static scan of cielab's own import
// specifiers, and (2) a functional proof that `nearest`/`nearestLab` work against a plain
// `[{ key, lab }]` palette with no block-table / Minecraft import in this test's own graph.

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { nearest, nearestLab } from "./cielab.mjs";

const ENGINE_PATH = fileURLToPath(new URL("./cielab.mjs", import.meta.url));

// Minecraft / asset packages that would couple the engine to this project's domain.
const DENYLIST = [
  /^minecraft-data/,
  /^minecraft-assets/,
  /^prismarine-/,
  /^mineflayer/,
  /^node-minecraft/,
];

/**
 * Extract every module specifier from a source string: `import … from "X"`,
 * bare `import "X"`, and dynamic `import("X")`. Returns the raw specifiers.
 */
function importSpecifiers(src) {
  const specs = [];
  const fromRe = /import\b[^]*?\bfrom\s*["']([^"']+)["']/g; // import ... from "X"
  const bareRe = /import\s*["']([^"']+)["']/g; //               import "X"
  const dynRe = /import\s*\(\s*["']([^"']+)["']\s*\)/g; //      import("X")
  for (const re of [fromRe, bareRe, dynRe]) {
    let m;
    while ((m = re.exec(src)) !== null) specs.push(m[1]);
  }
  return specs;
}

const engineSrc = readFileSync(ENGINE_PATH, "utf8");

test("cielab.mjs imports nothing project-specific (no relative, no Minecraft deps)", () => {
  const specs = importSpecifiers(engineSrc);
  for (const spec of specs) {
    assert.ok(
      !spec.startsWith("."),
      `engine must not have a relative import (would reach into the project); found "${spec}"`,
    );
    for (const deny of DENYLIST) {
      assert.ok(
        !deny.test(spec),
        `engine must not import a Minecraft/asset package; found "${spec}" (matches ${deny})`,
      );
    }
  }
});

test("cielab.mjs is a pure leaf — zero module imports today", () => {
  // Stronger than the rule above: the engine currently imports NOTHING (not even a node:
  // builtin). If this ever changes, the new import should get a deliberate review — confirm
  // it is a portable, project-free dependency before relaxing this assertion.
  assert.deepEqual(importSpecifiers(engineSrc), []);
});

test("engine is usable standalone: nearest() over a plain palette, no block table", () => {
  // Exactly the shape E-09's voxelizer uses: a caller-supplied [{ key, lab }] palette and a
  // color — no block-table / Minecraft import anywhere in this test's module graph.
  const palette = [
    { key: "white", lab: [100, 0, 0] },
    { key: "black", lab: [0, 0, 0] },
    { key: "red", lab: [53.24, 80.09, 67.2] },
  ];
  const hit = nearest([250, 250, 250], palette); // near-white sRGB
  assert.equal(hit.key, "white");
  assert.ok(Number.isFinite(hit.deltaE) && hit.deltaE >= 0);
  assert.deepEqual(hit.lab, [100, 0, 0]);
});

test("engine accepts a Lab target directly (voxel-centroid path, no rgb round-trip)", () => {
  const palette = [
    { key: "a", lab: [50, 0, 0] },
    { key: "b", lab: [50, 40, 0] },
  ];
  const hit = nearestLab([50, 38, 0], palette);
  assert.equal(hit.key, "b");
  assert.ok(hit.deltaE < 5);
});
