// The building-program contract — the model-AUTHORED recognition program (T-125-01, story S-125,
// epic E-31). The strategic reframe: resemblance comes from RECOGNIZING forms and substituting
// canonical realizations, not from fitting the mesh. This module is the program's gate: an AJV
// schema check (structure) plus a pack-vocabulary check (semantics) — together they are the
// `parse` of the bounded re-ask loop (T-114 judge-reply policy): any violation throws upstream,
// classifying the reply MALFORMED, and the SAME prompt is re-asked within the declared budget.
//
// PROGRAMS SPEAK ROLES, NEVER BLOCKS. Every material slot names a pack palette ROLE; the compiler
// (compile.mjs) resolves role → block, so realized builds are in-pack BY CONSTRUCTION — the
// `palette-in-pack` conformance check cannot fail, and MATERIAL_PRECEDENCE (style-pack.mjs) is
// honored by letting concept evidence pick ANY pack role per surface (e.g. a dressed-stone ground
// storey over the rubble default) while staying inside the pack.
//
// THE PROGRAM IS DATA (E-31 Rule 2): no building names anywhere in this package; the subject
// enters only as a record field. Follows the artifact/style-pack validation idiom: Ajv2020
// strict + memoized validator + non-throwing parse / fail-fast assert; formatErrors REUSED.
// IO is limited to the committed-schema read (the loadBlockTable purity class).

import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import Ajv2020 from "ajv/dist/2020.js";

import { formatErrors } from "../artifact.mjs";
import { IDIOM_REGISTRY } from "../pack/idiom-registry.mjs";
import { MAX_REPLY_ATTEMPTS } from "../form/judge-reply.mjs";

const here = dirname(fileURLToPath(import.meta.url));

export const BUILDING_PROGRAM_SCHEMA = "building-program/v1";
export const PROGRAM_SCHEMA_PATH = resolve(here, "..", "..", "schema", "building-program.schema.json");

/** The DECLARED re-ask budget (AC #1): 1 ask + bounded re-asks, the T-114 ledger pattern. */
export const PROGRAM_REPLY_BUDGET = MAX_REPLY_ATTEMPTS;

/** Roof idioms the compiler can lay out: name → whether the idiom bears a ridge axis. A
 *  registry-level fact (which constructs take ridgeAxis), not a style or subject fact. */
export const ROOF_LAYOUTS = Object.freeze({
  "roof.gable": Object.freeze({ ridge: true, gableEnds: true }),
  "roof.hip": Object.freeze({ ridge: true, gableEnds: false }),
  "roof.pyramid": Object.freeze({ ridge: false, gableEnds: false }),
});

export function loadProgramSchema(path = PROGRAM_SCHEMA_PATH) {
  return JSON.parse(readFileSync(path, "utf8"));
}

let _validator = null;
function getValidator() {
  if (_validator === null) {
    const ajv = new Ajv2020({ allErrors: true, strict: true });
    _validator = ajv.compile(loadProgramSchema());
  }
  return _validator;
}

/**
 * Non-throwing JSON-schema gate (the parseArtifact idiom).
 * @param {string|object} input
 * @returns {{ok:true, program:object}|{ok:false, code:string, errors:string[]}}
 */
export function parseBuildingProgram(input) {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (err) {
      return { ok: false, code: "invalid_json", errors: [`could not parse: ${err.message}`] };
    }
  }
  const validate = getValidator();
  if (validate(data)) return { ok: true, program: Object.freeze(data) };
  return { ok: false, code: "schema_invalid", errors: formatErrors(validate.errors) };
}

/** Fail-fast variant. */
export function assertBuildingProgram(input) {
  const r = parseBuildingProgram(input);
  if (!r.ok) throw new Error(`invalid building program (${r.code}):\n${r.errors.join("\n")}`);
  return r.program;
}

const wallSpan = (rect, wall) => (wall === "+x" || wall === "-x" ? rect.d : rect.w);

/** Head clearance rows above the aperture (arch: the voxel-circle rise; flat: one lintel row). */
export function headRows(head, w) {
  if (head === "arch") return Math.ceil(w / 2);
  if (head === "flat") return 1;
  return 0;
}

/**
 * Partition a mass's opening entries into per-wall LANES: entries whose vertical ranges
 * (sill .. sill+h+head) overlap — transitively — share a lane and are laid out JOINTLY by the
 * compiler (evenly spread, one rhythm); vertically disjoint entries lay out independently.
 * Deterministic; shared by validation (feasibility per lane) and compile (layout per lane).
 * @param {object[]} openings  a mass's openings array (schema-valid)
 * @returns {{wall:string, entries:{index:number, count:number, w:number, h:number, sill:number,
 *            kind:string, head:string|null, headRole:string|null}[]}[]}
 */
export function openingLanes(openings) {
  const byWall = new Map();
  openings.forEach((o, index) => {
    if (!byWall.has(o.wall)) byWall.set(o.wall, []);
    byWall.get(o.wall).push({ ...o, index, top: o.sill + o.h + headRows(o.head ?? null, o.w) });
  });
  const lanes = [];
  for (const [wall, entries] of byWall) {
    const pool = [...entries];
    while (pool.length) {
      const lane = [pool.shift()];
      let grew = true;
      while (grew) {
        grew = false;
        for (let i = pool.length - 1; i >= 0; i--) {
          if (lane.some((e) => pool[i].sill < e.top && e.sill < pool[i].top)) {
            lane.push(pool.splice(i, 1)[0]);
            grew = true;
          }
        }
      }
      lane.sort((a, b) => a.index - b.index);
      lanes.push({ wall, entries: lane });
    }
  }
  return lanes;
}

/** Two plan rects touch (overlap or share an edge) — the single-component precondition. */
function rectsTouch(a, b) {
  const ax1 = a.x0 + a.w - 1, az1 = a.z0 + a.d - 1;
  const bx1 = b.x0 + b.w - 1, bz1 = b.z0 + b.d - 1;
  return a.x0 <= bx1 + 1 && b.x0 <= ax1 + 1 && a.z0 <= bz1 + 1 && b.z0 <= az1 + 1;
}

/**
 * PACK-VOCABULARY validation — everything the JSON schema cannot express. The off-vocabulary
 * rejection of AC #1: every finding is an ERROR (the re-ask loop needs a hard verdict, not a
 * warning taxonomy). PURE.
 *   1. pack slug matches; subject non-empty (schema-checked) — recorded only.
 *   2. Every material slot's role exists in the pack palette.
 *   3. roof.idiom ∈ ROOF_LAYOUTS ∩ pack.idioms ∩ registry constructs; ridgeAxis present where
 *      the layout bears a ridge; pitchClass ∈ pack.proportions.pitchClasses.
 *   4. storeyHeight within pack proportions.storeyHeight; jetty needs storeys ≥ 2.
 *   5. walls.treatment (if any) names a pack PASS idiom (recorded, realized by S-126).
 *   6. Openings fit their wall: horizontally at minSpacing (corners protected — the boxShell
 *      contract), vertically including the head's clearance rows.
 *   7. Dormers fit the ridge-axis span (pack dormer width, 1-cell minimum gaps).
 *   8. Mass ids unique; masses pairwise-connected (single-component by construction).
 * @param {object} program  a schema-valid program (assertBuildingProgram first)
 * @param {object} pack     a validated style pack
 * @param {{registry?:object}} [opts]
 * @returns {{ok:boolean, findings:{level:"error", where:string, msg:string}[]}}
 */
export function validateProgramAgainstPack(program, pack, { registry = IDIOM_REGISTRY } = {}) {
  const findings = [];
  const err = (where, msg) => findings.push({ level: "error", where, msg });

  if (program.pack !== pack.style) {
    err("pack", `program speaks pack "${program.pack}" but was validated against "${pack.style}"`);
  }

  const roles = new Map(pack.palette.map((p) => [p.role, p]));
  const packIdioms = new Set(pack.idioms.map((i) => i.name));
  const { storeyHeight, pitchClasses, openingRhythm } = pack.proportions;
  const dormerWidth = pack.idioms.find((i) => i.name === "dormer")?.params?.width ?? 3;

  const checkRole = (where, role) => {
    if (role != null && !roles.has(role)) err(where, `role "${role}" is not in the pack palette`);
  };

  const ids = new Set();
  program.masses.forEach((m, i) => {
    const where = `masses[${i}] (${m.id})`;
    if (ids.has(m.id)) err(where, "duplicate mass id");
    ids.add(m.id);

    // 2. roles
    checkRole(`${where}.walls.ground`, m.walls.ground.role);
    checkRole(`${where}.walls.upper`, m.walls.upper.role);
    checkRole(`${where}.walls.dressing`, m.walls.dressing?.role ?? null);
    checkRole(`${where}.plinth`, m.plinth?.role ?? null);
    checkRole(`${where}.jetty.beam`, m.jetty?.beamRole ?? null);
    checkRole(`${where}.jetty.joist`, m.jetty?.joistRole ?? null);
    checkRole(`${where}.roof.field`, m.roof.fieldRole);
    checkRole(`${where}.roof.trim`, m.roof.trimRole ?? null);
    checkRole(`${where}.roof.gable`, m.roof.gableRole ?? null);
    checkRole(`${where}.chimney`, m.chimney?.role ?? null);
    checkRole(`${where}.chimney.cap`, m.chimney?.capRole ?? null);

    // 3. roof idiom + pitch
    const layout = ROOF_LAYOUTS[m.roof.idiom];
    if (!layout) {
      err(`${where}.roof`, `idiom "${m.roof.idiom}" is not a realizable roof (have: ${Object.keys(ROOF_LAYOUTS).join(", ")})`);
    } else {
      if (!packIdioms.has(m.roof.idiom)) err(`${where}.roof`, `idiom "${m.roof.idiom}" is not in the pack`);
      if (registry[m.roof.idiom]?.kind !== "construct") err(`${where}.roof`, `idiom "${m.roof.idiom}" is not a registry construct`);
      if (layout.ridge && m.roof.ridgeAxis === undefined) err(`${where}.roof`, "ridgeAxis is required for a ridge-bearing roof");
    }
    if (!pitchClasses.includes(m.roof.pitchClass)) {
      err(`${where}.roof`, `pitchClass ${m.roof.pitchClass} is outside the pack vocabulary [${pitchClasses.join(", ")}]`);
    }

    // 4. proportions
    if (m.storeyHeight < storeyHeight.min || m.storeyHeight > storeyHeight.max) {
      err(`${where}.storeyHeight`, `${m.storeyHeight} outside the pack band [${storeyHeight.min}, ${storeyHeight.max}]`);
    }
    if (m.jetty && m.storeys < 2) err(`${where}.jetty`, "a jetty needs an upper storey (storeys ≥ 2)");

    // 5. treatment is a pack pass
    const t = m.walls.treatment ?? null;
    if (t !== null) {
      if (!packIdioms.has(t)) err(`${where}.walls.treatment`, `"${t}" is not in the pack`);
      else if (registry[t]?.kind !== "pass") err(`${where}.walls.treatment`, `"${t}" is not a pass idiom (treatments are build transforms)`);
    }

    // 6. openings fit — vertically incl. head clearance; laterally PER LANE at min spacing.
    //    Entries on one wall whose vertical ranges overlap form a joint lane (a real facade
    //    puts the door and its flanking ground windows on one wall — the compiler spreads the
    //    whole lane evenly); vertically disjoint entries are independent lanes.
    const wallH = m.storeys * m.storeyHeight;
    m.openings.forEach((o, j) => {
      const ow = `${where}.openings[${j}] (${o.kind} on ${o.wall})`;
      const top = o.sill + o.h + headRows(o.head ?? null, o.w);
      if (top > wallH) err(ow, `opening + head reach y ${top}, above the wall top ${wallH}`);
    });
    for (const lane of openingLanes(m.openings)) {
      const avail = wallSpan(m.rect, lane.wall) - 2; // corners stay (boxShell contract)
      const n = lane.entries.reduce((s, e) => s + e.count, 0);
      const need = lane.entries.reduce((s, e) => s + e.count * e.w, 0) + (n - 1) * openingRhythm.minSpacing;
      if (need > avail) {
        err(`${where}.openings (lane on ${lane.wall})`,
          `${n} opening(s) need ${need} cells at min spacing; wall offers ${avail}`);
      }
    }

    // 7. dormers fit, on an eave-side slope (perpendicular to the ridge)
    const d = m.roof.dormers ?? null;
    if (d !== null && layout) {
      if (!layout.ridge) err(`${where}.roof.dormers`, "dormers need a ridge-bearing roof");
      else {
        const span = (m.roof.ridgeAxis === "x" ? m.rect.w : m.rect.d) - 2;
        const need = d.count * dormerWidth + (d.count - 1);
        if (need > span) err(`${where}.roof.dormers`, `${d.count} dormers of width ${dormerWidth} need ${need} cells; the ridge span offers ${span}`);
        if (d.wall !== undefined && d.wall.endsWith(m.roof.ridgeAxis)) {
          err(`${where}.roof.dormers`, `wall "${d.wall}" is a gable end — dormers sit on the eave-side slopes (perpendicular to ridge axis ${m.roof.ridgeAxis})`);
        }
      }
    }
  });

  // 8. connectivity
  const ms = program.masses;
  if (ms.length > 1) {
    const seen = new Set([0]);
    const queue = [0];
    while (queue.length) {
      const a = queue.pop();
      ms.forEach((m, b) => {
        if (!seen.has(b) && rectsTouch(ms[a].rect, m.rect)) {
          seen.add(b);
          queue.push(b);
        }
      });
    }
    if (seen.size !== ms.length) {
      err("masses", "masses do not form one connected plan (a detached mass cannot pass single-component)");
    }
  }

  return { ok: findings.length === 0, findings };
}
