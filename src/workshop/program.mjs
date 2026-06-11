// The workshop program — the revisable object (T-126-01, story S-126, epic E-31).
//
// THE LOCAL CONTRACT, NOT THE RECOGNITION SCHEMA. S-125 owns the model-authored building program
// (recognition prompt + pack-validated schema); S-126 is parallel with disjoint seams. The loop
// only needs a program it can realize and adjust, so this module defines the MINIMAL shape both
// can satisfy: an ordered element list where each element is a generic hollow `shell` or a
// registry idiom `{idiom, spec}` (T-124). When S-125 lands, its accepted program realizes through
// the same registry and plugs into the same loop; nothing here names a recognition prompt.
//
// SHELL, NOT BUILDINGS. `boxShell` is the one generic composer the registry lacks (constructs are
// roofs/dormers/chimneys/…; walls come from the generated chain, which needs fit lineage). It is
// subject-agnostic data-in/cells-out and obeys the generated-build chain contracts: hollow, TRUE
// holes (an opening is the absence of wall cells — the facade-recess-by-exclusion rule), and
// floorless (the eave stays the widest layer).
//
// REALIZATION IS DETERMINISTIC. realizeProgram walks elements in order; later cells win via the
// artifact expand rule (last-writer-wins), and the artifact is assembled exactly like the idiom
// card (namespaced ids, sorted manifest) so the same program always serializes byte-identically —
// the substrate of E-31 Rule 5 replay.
//
// PURE — no GL, no IO, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { PHASE1_MODEL_ID } from "../config.mjs";
import { getIdiom, IDIOM_REGISTRY } from "../pack/idiom-registry.mjs";

export const WORKSHOP_PROGRAM_SCHEMA = "workshop-program/v1";

/** Wall-plane table: wall name → which footprint plane it is and which world axis `at[0]` runs
 *  along. `+x` is the x = x1 wall (u = z), `+z` the z = z1 wall (u = x), etc. */
const WALL_PLANES = Object.freeze({
  "+x": { fixed: "x", edge: "x1", uAxis: "z" },
  "-x": { fixed: "x", edge: "x0", uAxis: "z" },
  "+z": { fixed: "z", edge: "z1", uAxis: "x" },
  "-z": { fixed: "z", edge: "z0", uAxis: "x" },
});

const isInt = (n) => Number.isInteger(n);
const isNonEmptyString = (s) => typeof s === "string" && s.length > 0;

function deepFreeze(v) {
  if (v === null || typeof v !== "object" || Object.isFrozen(v)) return v;
  for (const k of Object.keys(v)) deepFreeze(v[k]);
  return Object.freeze(v);
}

/**
 * GENERIC HOLLOW SHELL — perimeter wall courses over a rectangular footprint. Openings are TRUE
 * holes: their cells are simply never placed. Floorless and roofless by design (the roof is its
 * own registry element). Per-course material overrides support banded walls (ground band vs
 * upper) without breaking the courses-even discipline.
 * @param {{footprint:{x0:number,x1:number,z0:number,z1:number}, y0:number, height:number,
 *          wallBlock:string, courses?:{yRange:number[], block:string}[],
 *          openings?:{wall:"+x"|"-x"|"+z"|"-z", at:number[], w:number, h:number}[]}} spec
 * @returns {{cells:{pos:number[], block:string}[]}}
 */
export function boxShell(spec) {
  const { footprint, y0, height, wallBlock, courses = [], openings = [] } = spec ?? {};
  const { x0, x1, z0, z1 } = footprint ?? {};
  if (![x0, x1, z0, z1].every(isInt) || x0 >= x1 || z0 >= z1) {
    throw new Error("boxShell: spec.footprint must be integer {x0<x1, z0<z1} (a shell needs interior)");
  }
  if (!isInt(y0)) throw new Error("boxShell: spec.y0 must be an integer");
  if (!isInt(height) || height < 1) throw new Error("boxShell: spec.height must be an integer ≥ 1");
  if (!isNonEmptyString(wallBlock)) throw new Error("boxShell: spec.wallBlock must be a non-empty block id");
  const yTop = y0 + height - 1;
  for (const c of courses) {
    if (!Array.isArray(c?.yRange) || !c.yRange.every(isInt) || c.yRange[0] > c.yRange[1] || !isNonEmptyString(c.block)) {
      throw new Error("boxShell: each spec.courses entry must be {yRange:[lo≤hi], block}");
    }
  }
  const blockAt = (y) => courses.find((c) => y >= c.yRange[0] && y <= c.yRange[1])?.block ?? wallBlock;

  const holes = new Set();
  for (const o of openings) {
    const plane = WALL_PLANES[o?.wall];
    if (!plane) throw new Error(`boxShell: opening wall must be one of ${Object.keys(WALL_PLANES).join(", ")}`);
    const [u, y] = o.at ?? [];
    if (![u, y].every(isInt) || !isInt(o.w) || !isInt(o.h) || o.w < 1 || o.h < 1) {
      throw new Error("boxShell: each opening must be {wall, at:[u,y], w≥1, h≥1} (integers)");
    }
    const fixedVal = plane.edge === "x1" ? x1 : plane.edge === "x0" ? x0 : plane.edge === "z1" ? z1 : z0;
    const [uLo, uHi] = plane.uAxis === "z" ? [z0 + 1, z1 - 1] : [x0 + 1, x1 - 1]; // corners stay
    if (u < uLo || u + o.w - 1 > uHi || y < y0 || y + o.h - 1 > yTop) {
      throw new Error(`boxShell: opening on ${o.wall} at [${u},${y}] ${o.w}×${o.h} leaves the wall (or eats a corner)`);
    }
    for (let du = 0; du < o.w; du++) {
      for (let dy = 0; dy < o.h; dy++) {
        const pos = plane.uAxis === "z" ? [fixedVal, y + dy, u + du] : [u + du, y + dy, fixedVal];
        holes.add(pos.join(","));
      }
    }
  }

  const cells = [];
  for (let y = y0; y <= yTop; y++) {
    const block = blockAt(y);
    for (let x = x0; x <= x1; x++) {
      for (let z = z0; z <= z1; z++) {
        if (x !== x0 && x !== x1 && z !== z0 && z !== z1) continue; // hollow: perimeter only
        if (holes.has(`${x},${y},${z}`)) continue; // a true hole — never placed
        cells.push({ pos: [x, y, z], block });
      }
    }
  }
  return { cells };
}

// ---------------------------------------------------------------- the program contract

/**
 * Validate a workshop program. Non-throwing gate: returns {ok:true, program(deep-frozen)} or
 * {ok:false, errors}. Idiom elements must resolve to registry CONSTRUCTS (passes need full build
 * context and are not program elements here).
 * @param {unknown} input  a parsed object or JSON text
 */
export function parseWorkshopProgram(input) {
  let p = input;
  if (typeof input === "string") {
    try { p = JSON.parse(input); } catch (e) { return { ok: false, errors: [`not JSON: ${e.message}`] }; }
  }
  const errors = [];
  if (p === null || typeof p !== "object" || Array.isArray(p)) {
    return { ok: false, errors: ["program must be an object"] };
  }
  if (p.schema !== WORKSHOP_PROGRAM_SCHEMA) errors.push(`schema must be "${WORKSHOP_PROGRAM_SCHEMA}"`);
  if (!isNonEmptyString(p.subject)) errors.push("subject must be a non-empty string");
  if (!isNonEmptyString(p.pack)) errors.push("pack must be a non-empty string (the style-pack slug)");
  if (!isInt(p.budget?.rounds) || p.budget.rounds < 1) errors.push("budget.rounds must be an integer ≥ 1");
  if (p.declarations === null || typeof p.declarations !== "object" || Array.isArray(p.declarations)) {
    errors.push("declarations must be an object (bands/symmetry/openings for the conformance gate)");
  }
  if (!Array.isArray(p.elements) || p.elements.length === 0) {
    errors.push("elements must be a non-empty array");
  } else {
    const ids = new Set();
    p.elements.forEach((el, i) => {
      const where = `elements[${i}]`;
      if (!isNonEmptyString(el?.id)) errors.push(`${where}.id must be a non-empty string`);
      else if (ids.has(el.id)) errors.push(`${where}.id "${el.id}" is duplicated`);
      else ids.add(el.id);
      if (el?.spec === null || typeof el?.spec !== "object" || Array.isArray(el?.spec)) {
        errors.push(`${where}.spec must be an object`);
      }
      if (el?.kind === "shell") {
        if (el.idiom !== undefined) errors.push(`${where}: a shell element carries no idiom name`);
      } else if (el?.kind === "idiom") {
        const entry = IDIOM_REGISTRY[el.idiom];
        if (!entry) errors.push(`${where}.idiom "${el.idiom}" is not in the registry`);
        else if (entry.kind !== "construct") {
          errors.push(`${where}.idiom "${el.idiom}" is a pass, not a construct — passes are not program elements`);
        }
      } else {
        errors.push(`${where}.kind must be "shell" | "idiom"`);
      }
    });
  }
  if (errors.length > 0) return { ok: false, errors };
  return { ok: true, program: deepFreeze(structuredClone(p)) };
}

/** Fail-fast variant: the validated, deep-frozen program or a thrown Error naming every problem. */
export function assertWorkshopProgram(input) {
  const r = parseWorkshopProgram(input);
  if (!r.ok) throw new Error(`assertWorkshopProgram: invalid program:\n  - ${r.errors.join("\n  - ")}`);
  return r.program;
}

// ---------------------------------------------------------------- realization

const namespaced = (id) => (id.includes(":") ? id : `minecraft:${id}`);

/**
 * Realize a (validated) program into a schema-valid design artifact: elements in order, later
 * cells win (the expand rule). Deterministic — the same program always yields byte-identical
 * serialization (Rule 5's substrate). Paint placements are NOT applied here; the loop appends
 * accepted paint via the artifact contract (applyPaint), keeping realize program-only.
 * @param {object} program  a program that passed {@link assertWorkshopProgram}
 * @returns {{artifact:object, cells:object[], elements:{id:string, kind:string, idiom?:string, cellCount:number}[]}}
 */
export function realizeProgram(program) {
  const cells = [];
  const elements = [];
  for (const el of program.elements) {
    const raw = el.kind === "shell"
      ? boxShell(el.spec).cells
      : getIdiom(el.idiom).generate(el.spec).cells;
    if (!raw.length) throw new Error(`realizeProgram: element "${el.id}" realized no cells`);
    cells.push(...raw);
    elements.push({ id: el.id, kind: el.kind, ...(el.idiom ? { idiom: el.idiom } : {}), cellCount: raw.length });
  }
  const placements = cells.map((c) =>
    c.state == null
      ? { op: "voxel", pos: c.pos, block: namespaced(c.block) }
      : { op: "voxel", pos: c.pos, block: namespaced(c.block), state: { ...c.state } }
  );
  const manifest = [...new Set(placements.map((p) => p.block))].sort();
  const artifact = {
    schema_version: "1.0.0",
    metadata: {
      trial_id: `workshop-${program.subject}`,
      prompting_method_id: "procedural/workshop@1",
      model_id: PHASE1_MODEL_ID,
      seed: 0,
      server_state_id: "in-memory",
    },
    style: {
      name: `workshop-${program.pack}`,
      rationale:
        "Workshop realization (S-126): the program's elements realized through the idiom registry — clean by construction, revised in conformance-gated rounds.",
    },
    palette: { manifest },
    placements,
  };
  return { artifact, cells, elements };
}

/**
 * The adjust-params action's applier: merge a partial spec into one element (top-level keys
 * replace whole — predictable for the model, no deep-merge surprises) and re-validate. Returns a
 * NEW frozen program; the input is never mutated.
 */
export function applyParamAdjust(program, { elementId, params }) {
  if (params === null || typeof params !== "object" || Array.isArray(params) || Object.keys(params).length === 0) {
    throw new Error("applyParamAdjust: params must be a non-empty object");
  }
  const idx = program.elements.findIndex((el) => el.id === elementId);
  if (idx < 0) {
    throw new Error(`applyParamAdjust: unknown element "${elementId}" (have: ${program.elements.map((e) => e.id).join(", ")})`);
  }
  const next = structuredClone(program);
  next.elements[idx].spec = { ...next.elements[idx].spec, ...structuredClone(params) };
  return assertWorkshopProgram(next);
}
