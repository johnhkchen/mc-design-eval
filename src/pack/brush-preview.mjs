// Brush preview realization (T-128-01, story S-128, epic E-32) — the pass half of the
// preview-card requirement. A construct previews via its committed IDIOM_CARD_SPECS ids; a PASS
// declares a SYNTHETIC SUBJECT in its registry entry: a substrate (data) + params (data) + an
// in-entry realize({occ, cells}) closure that applies the pass and returns the final preview
// cells plus the effect size. This module builds the substrate and drives the closure — it is
// the contract validator's default realizer and the catalog's plot source.
//
// SUBSTRATE KINDS:
//   • "shell" — boxShell (src/workshop/program.mjs): hollow perimeter walls, TRUE holes,
//     floorless. Import direction note: workshop/program imports pack/idiom-registry; importing
//     boxShell here is the reverse edge but creates no cycle (idiom-registry never imports this
//     module). If boxShell ever moves to a form module, this is the one call site to update.
//   • "solid" — a filled rectangular mass (what hollow/roof ops need to act on; no solid-box
//     generator exists elsewhere — deliberately local, it is three loops).
//   • "box" — a SEALED hollow box (perimeter + cap + floor): the camera-hidden interior the
//     floorplan op's safeAir predicate requires.
//
// PURE — no GL/IO/Date/random — runs under the src/**/*.test.mjs glob.

import { boxShell } from "../workshop/program.mjs";
import { occupancyFromCells } from "../view/occupancy.mjs";

export const PREVIEW_SUBSTRATE_KINDS = Object.freeze(["shell", "solid", "box"]);

const isInt = (n) => Number.isInteger(n);

function checkBoxSpec(where, { footprint, y0, height, block }) {
  const { x0, x1, z0, z1 } = footprint ?? {};
  if (![x0, x1, z0, z1].every(isInt) || x0 > x1 || z0 > z1) {
    throw new Error(`${where}: spec.footprint must be integer {x0≤x1, z0≤z1}`);
  }
  if (!isInt(y0) || !isInt(height) || height < 1) throw new Error(`${where}: spec.y0/height must be integers (height ≥ 1)`);
  if (typeof block !== "string" || block.length === 0) throw new Error(`${where}: spec.block must be a non-empty block id`);
}

/** A filled rectangular mass. */
function solidBox(spec) {
  checkBoxSpec("previewSubstrate(solid)", spec ?? {});
  const { footprint: { x0, x1, z0, z1 }, y0, height, block } = spec;
  const cells = [];
  for (let y = y0; y < y0 + height; y++) {
    for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) cells.push({ pos: [x, y, z], block });
  }
  return cells;
}

/** A SEALED hollow box: perimeter walls + floor + cap, empty interior. */
function sealedBox(spec) {
  checkBoxSpec("previewSubstrate(box)", spec ?? {});
  const { footprint: { x0, x1, z0, z1 }, y0, height, block } = spec;
  const yTop = y0 + height - 1;
  const cells = [];
  for (let y = y0; y <= yTop; y++) {
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        const boundary = x === x0 || x === x1 || z === z0 || z === z1 || y === y0 || y === yTop;
        if (boundary) cells.push({ pos: [x, y, z], block });
      }
    }
  }
  return cells;
}

/**
 * Build a substrate's cells from its declaration.
 * @param {{kind:"shell"|"solid"|"box", spec:object}} decl
 * @returns {{pos:number[], block:string}[]}
 */
export function previewSubstrate(decl) {
  const kind = decl?.kind;
  if (kind === "shell") return boxShell(decl.spec).cells;
  if (kind === "solid") return solidBox(decl.spec);
  if (kind === "box") return sealedBox(decl.spec);
  throw new Error(`previewSubstrate: kind must be one of ${PREVIEW_SUBSTRATE_KINDS.join(", ")}`);
}

/**
 * Realize a PASS brush's preview: substrate → occupancy → the entry's realize closure.
 * Fail-loud: a preview that yields no cells (or reports an empty effect) is a broken card.
 * @param {string} name
 * @param {object} entry  a registry entry with a pass-form preview
 * @returns {{cells:{pos:number[],block:string,state?:object}[], effect:number}}
 */
export function realizePassPreview(name, entry) {
  const preview = entry?.preview;
  if (!preview?.substrate || typeof preview.realize !== "function") {
    throw new Error(`realizePassPreview: "${name}" carries no pass-form preview`);
  }
  const cells = previewSubstrate(preview.substrate);
  const occ = occupancyFromCells(cells);
  const result = preview.realize({ occ, cells });
  if (!Array.isArray(result?.cells) || result.cells.length === 0) {
    throw new Error(`realizePassPreview: "${name}" realized no cells`);
  }
  return { cells: result.cells, effect: result.effect ?? 0 };
}
