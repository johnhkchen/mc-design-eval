// No-optics guard for the formation chain (T-130-01, story S-130, epic E-32) — the executable
// half of AC3 ("the chain has no GLB-texture input anywhere"), so the claim cannot rot into
// one-off shell output. E-32 Rule 4: materials are diegetic, not optical — the formation
// surface must never import the GLB/texture/view machinery, never take an image-typed BAML
// input, and never pass `images` to the bridge. Matches IMPORT LINES, not comments (the
// generalization-grep lesson: a comment naming the forbidden thing is documentation, not a
// dependency).

import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = fileURLToPath(new URL("../../", import.meta.url));
const read = (rel) => readFileSync(join(ROOT, rel), "utf8");

/** The formation chain's whole source surface. */
const FORMATION_SURFACE = [
  "src/pack/formation.mjs",
  "src/baml/ask.mjs",
  "scripts/form-style.mjs",
  "scripts/ratify-pack.mjs",
];

/** The file's import surface only — comments and prose never count. */
const importLines = (src) =>
  src.split("\n").filter((l) => /^\s*import\b|\brequire\(|\bawait import\(/.test(l)).join("\n");

test("FG1 the formation surface imports no optics (glb/trellis/texture/view/png)", () => {
  for (const rel of FORMATION_SURFACE) {
    const imports = importLines(read(rel));
    assert.doesNotMatch(imports, /glb|trellis|texture|\.png/i, `${rel}: optical import`);
    assert.doesNotMatch(imports, /\/view\//, `${rel}: view-layer import (renders are evidence, never formation input)`);
    assert.doesNotMatch(imports, /sharp|pngjs|playwright|prismarine/i, `${rel}: image/render machinery import`);
  }
});

test("FG2 formation.baml takes no image-typed input and the runner passes no images to the bridge", () => {
  // comments may NAME the forbidden thing (that is documentation); code may not carry it
  const baml = read("baml_src/formation.baml")
    .split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
  assert.doesNotMatch(baml, /\bimage\b/i, "formation.baml must have no image-typed input");
  for (const rel of ["scripts/form-style.mjs", "scripts/ratify-pack.mjs"]) {
    const code = read(rel).split("\n").filter((l) => !l.trimStart().startsWith("//")).join("\n");
    assert.doesNotMatch(code, /images\s*:/, `${rel}: an images arg at a bridge call site`);
  }
});

test("FG3 precedence is honored by construction: formation never touches concept evidence", () => {
  // The chain authors only the middle tier (pack-assignment) + the story (vernacular-default
  // territory); concept evidence is not an input, so it CANNOT be overridden here. Pin the
  // absence of every concept-reading seam on the formation surface.
  for (const rel of FORMATION_SURFACE) {
    const imports = importLines(read(rel));
    assert.doesNotMatch(imports, /concept|zone-map|kit-extract|image-grid/i, `${rel}: concept-evidence import`);
  }
});
