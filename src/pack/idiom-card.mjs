// Idiom render card — pure layout (T-124-01, story S-124, epic E-31). The preview-card half of
// the brush contract (pipeline-philosophy Stage 4): every CONSTRUCT idiom in the registry is
// realized from a committed synthetic spec and plotted on one baseplate, so a single render
// sheet shows the whole pattern book realizing canonically — dormers at all four facings,
// chimney cap variants, jetty edges, both roof axes. The impure runner
// (benchmarks/sculpture/idiom-card.mjs) builds the artifact, requires `unmapped` empty, and
// commits the renders (the fixture-card T-097 ladder, minus per-cell read-back — the state
// vocabulary itself is already pinned by CARD_ROWS).
//
// Spec blocks are the rustic pack's palette (committed fixture data, the CARD_ROWS status — the
// card is style-dressed but the layout code is style-blind). PURE — no GL/IO/Date/random.

import { PHASE1_MODEL_ID } from "../config.mjs";
import { getIdiom, IDIOM_REGISTRY } from "./idiom-registry.mjs";

export const IDIOM_CARD_SCHEMA = "idiom-card/v1";

export const CARD_GAP = 4;          // empty cells between plots
export const CARD_MAX_ROW_W = 48;   // wrap the plot row past this width
export const CARD_BASEPLATE_BLOCK = "smooth_stone";

const ROOF_BLOCKS = Object.freeze({ field: "spruce_planks", stairs: "spruce_stairs", slab: "spruce_slab" });
const DORMER = Object.freeze({
  width: 3, depth: 3, wallHeight: 2,
  wallBlock: "white_terracotta", roofBlock: "spruce_stairs",
  faceBlock: "white_terracotta", ridgeBlock: "dark_oak_planks",
});

/** One committed synthetic spec per construct realization the card proves. Local coordinates —
 * the layout translates each plot onto the baseplate grid. */
export const IDIOM_CARD_SPECS = Object.freeze([
  { id: "gable-ridge-z", idiom: "roof.gable", spec: { footprint: { x0: 0, x1: 8, z0: 0, z1: 5 }, ridgeAxis: "z", eaveY: 0, ridgeY: 4, blocks: ROOF_BLOCKS } },
  { id: "gable-ridge-x", idiom: "roof.gable", spec: { footprint: { x0: 0, x1: 5, z0: 0, z1: 8 }, ridgeAxis: "x", eaveY: 0, ridgeY: 4, blocks: ROOF_BLOCKS } },
  { id: "hip", idiom: "roof.hip", spec: { footprint: { x0: 0, x1: 8, z0: 0, z1: 11 }, ridgeAxis: "z", eaveY: 0, ridgeY: 4, blocks: ROOF_BLOCKS } },
  { id: "pyramid", idiom: "roof.pyramid", spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 6 }, eaveY: 0, blocks: ROOF_BLOCKS } },
  { id: "arch", idiom: "arch", spec: { center: [3, 2], radius: 3.2, span: { axis: "x", range: [0, 6] }, yRange: [0, 5], depth: { axis: "z", range: [0, 0] }, block: "stone_bricks" } },
  { id: "head-flat", idiom: "head.flat", spec: { level: 2, span: { axis: "x", range: [0, 4] }, yRange: [0, 3], depth: { axis: "z", range: [0, 0] }, block: "stone_bricks" } },
  { id: "stairs-walk", idiom: "course.stairs", spec: { origin: [0, 0, 0], ascent: "+x", steps: 4, width: 2, block: "spruce_stairs" } },
  { id: "slab-course", idiom: "course.slab", spec: { origin: [0, 0, 0], axis: "z", length: 4, kind: "bottom", block: "spruce_slab" } },
  { id: "dormer-px", idiom: "dormer", spec: { origin: [0, 0, 0], facing: "+x", ...DORMER } },
  { id: "dormer-nx", idiom: "dormer", spec: { origin: [0, 0, 0], facing: "-x", ...DORMER } },
  { id: "dormer-pz", idiom: "dormer", spec: { origin: [0, 0, 0], facing: "+z", ...DORMER } },
  { id: "dormer-nz", idiom: "dormer", spec: { origin: [0, 0, 0], facing: "-z", ...DORMER } },
  { id: "chimney-bare", idiom: "chimney", spec: { base: [0, 0, 0], footprint: { w: 1, d: 1 }, height: 5, block: "cobblestone" } },
  { id: "chimney-crown", idiom: "chimney", spec: { base: [0, 0, 0], footprint: { w: 2, d: 2 }, height: 5, block: "cobblestone", cap: "crown", capBlock: "bricks" } },
  { id: "chimney-slab", idiom: "chimney", spec: { base: [0, 0, 0], footprint: { w: 2, d: 1 }, height: 4, block: "cobblestone", cap: "slab", capBlock: "brick_slab" } },
  { id: "jetty-xp", idiom: "jetty", spec: { edge: { axis: "x", at: 0, side: "+", range: [0, 6] }, y: 2, beamBlock: "dark_oak_planks", joistBlock: "dark_oak_log" } },
  { id: "jetty-xn", idiom: "jetty", spec: { edge: { axis: "x", at: 0, side: "-", range: [0, 6] }, y: 2, beamBlock: "dark_oak_planks", joistBlock: "dark_oak_log" } },
  { id: "jetty-zp", idiom: "jetty", spec: { edge: { axis: "z", at: 0, side: "+", range: [0, 6] }, y: 2, beamBlock: "dark_oak_planks", joistBlock: "dark_oak_log" } },
  { id: "jetty-zn", idiom: "jetty", spec: { edge: { axis: "z", at: 0, side: "-", range: [0, 6] }, y: 2, beamBlock: "dark_oak_planks", joistBlock: "dark_oak_log" } },
  { id: "plinth", idiom: "plinth", spec: { footprint: { x0: 0, x1: 6, z0: 0, z1: 4 }, y0: 0, courses: 2, block: "stone_bricks" } },
  { id: "thatch", idiom: "roof.thatch", spec: { footprint: { x0: 0, x1: 8, z0: 0, z1: 5 }, ridgeAxis: "z", eaveY: 2, pitch: 1, block: "hay_block", thickness: 2, ridgeRoll: true, ridgeBlock: null, eaveOvershoot: 1 } },
]);

/**
 * Realize every spec and lay the plots on a baseplate grid: plots advance along +x with CARD_GAP
 * spacing, wrapping to a new +z row past CARD_MAX_ROW_W; each plot is translated so its bbox
 * starts at the cursor with minY = 1 (the baseplate is y = 0). Deterministic.
 * @param {typeof IDIOM_CARD_SPECS} [specs]
 * @returns {{cells:{pos:number[],block:string,state?:object}[],
 *            plots:{id:string,idiom:string,origin:number[],size:number[]}[],
 *            baseplate:{from:number[],to:number[],block:string}}}
 */
export function idiomCardLayout(specs = IDIOM_CARD_SPECS) {
  const cells = [];
  const plots = [];
  let cursorX = 0;
  let rowZ = 0;
  let rowDepth = 0;
  for (const { id, idiom, spec } of specs) {
    const { cells: raw } = getIdiom(idiom).generate(spec);
    if (!raw.length) throw new Error(`idiomCardLayout: "${id}" realized no cells`);
    let min = [...raw[0].pos], max = [...raw[0].pos];
    for (const c of raw) {
      for (let i = 0; i < 3; i++) {
        if (c.pos[i] < min[i]) min[i] = c.pos[i];
        if (c.pos[i] > max[i]) max[i] = c.pos[i];
      }
    }
    const size = [max[0] - min[0] + 1, max[1] - min[1] + 1, max[2] - min[2] + 1];
    if (cursorX > 0 && cursorX + size[0] > CARD_MAX_ROW_W) {
      cursorX = 0;
      rowZ += rowDepth + CARD_GAP;
      rowDepth = 0;
    }
    const origin = [cursorX, 1, rowZ];
    const d = [origin[0] - min[0], origin[1] - min[1], origin[2] - min[2]];
    for (const c of raw) {
      cells.push({ ...c, pos: [c.pos[0] + d[0], c.pos[1] + d[1], c.pos[2] + d[2]] });
    }
    plots.push({ id, idiom, origin, size });
    cursorX += size[0] + CARD_GAP;
    if (size[2] > rowDepth) rowDepth = size[2];
  }
  let maxX = 0, maxZ = 0;
  for (const c of cells) {
    if (c.pos[0] > maxX) maxX = c.pos[0];
    if (c.pos[2] > maxZ) maxZ = c.pos[2];
  }
  return {
    cells,
    plots,
    baseplate: { from: [-1, 0, -1], to: [maxX + 1, 0, maxZ + 1], block: CARD_BASEPLATE_BLOCK },
  };
}

/** Every construct idiom in the registry must appear on the card (the completeness pin). */
export function cardCoverage(specs = IDIOM_CARD_SPECS) {
  const constructs = Object.entries(IDIOM_REGISTRY)
    .filter(([, e]) => e.kind === "construct")
    .map(([n]) => n)
    .sort();
  const carded = new Set(specs.map((s) => s.idiom));
  return { constructs, missing: constructs.filter((n) => !carded.has(n)) };
}

const namespaced = (id) => (id.includes(":") ? id : `minecraft:${id}`);

/**
 * Assemble the schema-valid idiom-card artifact (the fixtureCard() pattern): baseplate fill +
 * one {op:"voxel"} per realized cell. Deterministic; callers run assertArtifact.
 * @param {{specs?: typeof IDIOM_CARD_SPECS, modelId?: string}} [opts]
 */
export function idiomCard({ specs = IDIOM_CARD_SPECS, modelId = PHASE1_MODEL_ID } = {}) {
  const { cells, baseplate } = idiomCardLayout(specs);
  const placements = [
    { op: "fill", from: baseplate.from, to: baseplate.to, block: namespaced(baseplate.block) },
    ...cells.map((c) =>
      c.state == null
        ? { op: "voxel", pos: c.pos, block: namespaced(c.block) }
        : { op: "voxel", pos: c.pos, block: namespaced(c.block), state: { ...c.state } }
    ),
  ];
  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  return {
    schema_version: "1.0.0",
    metadata: {
      trial_id: "idiom-card",
      prompting_method_id: "procedural/idiom-card@1",
      model_id: modelId,
      seed: 0,
      server_state_id: "in-memory",
    },
    style: {
      name: "pattern-book-card",
      rationale:
        "Not a design: the S-124 idiom preview card — every registry construct realized from a committed synthetic spec, rendered as the pattern book's regression sheet.",
    },
    palette: { manifest },
    placements,
  };
}
