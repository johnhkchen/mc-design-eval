// SOURCE a compositional treatment spec from recognition + a style pack, and REFINE its amplitude from the
// E-39 structured critique (T-176-01, story S-176, epic E-43). This closes the epic's "stop hand-authoring,
// close the loop" front: T-175-01 proved the engine on a HAND-AUTHORED treatment-grammar/v1 spec; here the
// spec is DERIVED from the building program's roles (resolved through the pack palette) and its amplitude is
// RAISED by the critique (see thin trim → amplify), instead of one token pass.
//
// TWO PURE FUNCTIONS, no GL/IO/Date/random:
//   sourceTreatment(program, pack) — roles → blocks via roleBlock (the single material authority,
//     compile.mjs). The program already carries the field/edge split (walls.ground vs walls.dressing) and
//     the roof trim as a DISTINCT role (roof.trimRole), so sourcing is a role lookup, not a guess. It FAILS
//     LOUD when the edge material equals the field material — a same-material treatment silently no-ops
//     (surfaceRelief's clinker rule; T-175-01's recorded footgun), so we refuse an invisible spec.
//   refineAmplitude(spec, critique) — each Layer-A CritiqueItem (department + typed `kind`) drives an
//     AMPLITUDE bump on the matching layer, capped to bound overshoot. `replace` (wrong MATERIAL) is noted,
//     never amplified (amplifying a wrong material makes it louder, not righter — that is the pattern-book's
//     / recognition's job). Returns a NEW spec (structuredClone) + an auditable change log.
//
// The pack supplies NO amplitude (rustic has no proportions.articulation), so amplitude defaults live HERE
// and the critique loop is what tunes them — that is the whole point of "the loop amplifies thin detail".

import { roleBlock } from "./compile.mjs";
import { TREATMENT_GRAMMAR_SCHEMA } from "../view/treatment-grammar.mjs";

const fail = (where, msg) => { throw new Error(`${where}: ${msg}`); };

/** Engine-side amplitude defaults (the pack carries none); the critique loop raises these. */
export const AMPLITUDE_DEFAULTS = Object.freeze({
  base: { depth: 1 },
  corners: { headerDepth: 2 },
  top: { depth: 1, courses: 1 },
  roof: { eaveDepth: 1, ridgeCourses: 1 },
});

/** Caps that bound critique-driven overshoot (the busy-vs-rich edge the glance owns). */
export const AMPLITUDE_CAPS = Object.freeze({ headerDepth: 3, courses: 3 });

/** The first door opening on a mass (the arch reveal source), else null. */
function pickDoorOpening(mass) {
  return (mass.openings ?? []).find((o) => o.kind === "door") ?? null;
}

/** A decoration block for an item placed on `where` (e.g. door-lantern → lantern), else null. */
function decorationBlock(pack, item, where) {
  const d = (pack.decoration ?? []).find((e) => e.item === item && (e.where ?? []).includes(where));
  return d?.block ?? null;
}

/**
 * SOURCE a treatment-grammar/v1 spec from a building program + its style pack. Materials come from the
 * declared roles (never raw blocks); amplitude comes from AMPLITUDE_DEFAULTS. PURE.
 * @param {object} program a building-program/v1 (with masses[].walls/roof/openings declaring roles)
 * @param {object} pack a style-pack/v1 (palette[] role→block; decoration[])
 * @param {{mass?:string}} [opts] which mass to source (default the first)
 * @returns {object} a treatment-grammar/v1 spec (pure JSON), provenance:"sourced"
 */
export function sourceTreatment(program, pack, { mass: massId } = {}) {
  if (!program?.masses?.length) fail("sourceTreatment", "program has no masses");
  if (!pack?.palette?.length) fail("sourceTreatment", "pack has no palette");
  const mass = massId ? program.masses.find((m) => m.id === massId) : program.masses[0];
  if (!mass) fail("sourceTreatment", `mass "${massId}" not found`);
  const w = mass.walls ?? {};
  if (!w.ground?.role) fail("sourceTreatment", "mass.walls.ground.role is required");

  // field = the wall body (recesses by exclusion); edge = the dressing/quoin role (stands proud).
  const fieldMaterial = roleBlock(pack, w.ground.role);
  const dressingRole = w.dressing?.role ?? w.upper?.role ?? w.ground.role;
  const edgeMaterial = roleBlock(pack, dressingRole);
  if (edgeMaterial === fieldMaterial) {
    fail("sourceTreatment",
      `edge role "${dressingRole}" and field role "${w.ground.role}" both resolve to ${edgeMaterial} — ` +
      `a same-material treatment silently no-ops (surfaceRelief skips it). The program must declare a ` +
      `dressing role distinct from the field role.`);
  }

  const spec = {
    schema: TREATMENT_GRAMMAR_SCHEMA,
    subject: program.subject,
    style: program.style ?? pack.style,
    provenance: "sourced",
    base: { material: edgeMaterial, amplitude: { ...AMPLITUDE_DEFAULTS.base } },
    field: { recess: true, material: fieldMaterial },
    edges: {
      corners: { material: edgeMaterial, amplitude: { ...AMPLITUDE_DEFAULTS.corners } },
      top: { material: edgeMaterial, amplitude: { ...AMPLITUDE_DEFAULTS.top } },
    },
  };

  // opening — sourced from the door opening's headRole (frame) + the door.main leaf + a door decoration.
  const door = pickDoorOpening(mass);
  if (door) {
    const opening = {};
    if (door.headRole) opening.frame = roleBlock(pack, door.headRole);
    const leaf = pack.palette.find((p) => p.role === "door.main");
    if (leaf) opening.door = leaf.block;
    const light = decorationBlock(pack, "door-lantern", "door");
    if (light) opening.light = light;
    if (Object.keys(opening).length) spec.edges.opening = opening;
  }

  // roof — the eave/ridge/verge band material is the roof TRIM role, against the roof FIELD it must differ
  // from (the program encodes "a lighter stone eave/verge course banding the dark roof").
  if (mass.roof?.trimRole) {
    const roofEdge = roleBlock(pack, mass.roof.trimRole);
    const roofField = mass.roof.fieldRole ? roleBlock(pack, mass.roof.fieldRole) : null;
    if (roofField && roofEdge === roofField) {
      fail("sourceTreatment",
        `roof trim role "${mass.roof.trimRole}" and field role "${mass.roof.fieldRole}" both resolve to ` +
        `${roofEdge} — the roof edge course would no-op against its field.`);
    }
    spec.roof = {
      edge: { material: roofEdge, amplitude: { ...AMPLITUDE_DEFAULTS.roof } },
      field: { material: roofField },
    };
  }

  return spec;
}

const bumpCapped = (v, cap) => Math.min((v ?? 0) + 1, cap);
const word = (re, ...texts) => texts.some((t) => typeof t === "string" && re.test(t.toLowerCase()));

/**
 * REFINE a treatment spec's AMPLITUDE from a Layer-A critique. Each CritiqueItem's department + typed `kind`
 * drives a bounded amplitude bump on the matching layer (the feedback→construction loop). The `missing`
 * text only ROUTES within the WALL department (corner vs base vs top) — a small fixed keyword set, reported
 * as coarse, never general NLP. `replace` (wrong material) is NOTED, never amplified. PURE — a fresh spec.
 * @param {object} spec a treatment-grammar/v1 spec
 * @param {{items:Array<{department?:string, kind?:string, present?:string, missing?:string}>}} critique
 * @returns {{spec:object, changes:Array<object>, notes:Array<object>}}
 */
export function refineAmplitude(spec, critique) {
  if (!spec || typeof spec !== "object") fail("refineAmplitude", "spec is required");
  const out = structuredClone(spec);
  out.edges ??= {};
  const changes = [];
  const notes = [];
  const items = critique?.items ?? [];

  const record = (layer, knob, from, to, why) => { if (from !== to) changes.push({ layer, knob, from, to, why }); };

  for (const it of items) {
    const dept = it?.department;
    const kind = it?.kind;
    const text = `${it?.missing ?? ""} ${it?.present ?? ""} ${it?.expected ?? ""}`;

    // wrong MATERIAL → note, never amplify (louder ≠ righter; the pattern-book/recognition fixes material).
    if (kind === "replace") {
      notes.push({ kind: "materialMismatch", dept, text: (it?.missing || it?.expected || "").trim() });
      continue;
    }
    if (kind !== "add") continue; // remove / untyped → no amplitude action

    if (dept === "WALL") {
      if (word(/quoin|dressing|corner|pier/, text)) {
        out.edges.corners ??= { material: out.field?.material, amplitude: {} };
        out.edges.corners.amplitude ??= {};
        const from = out.edges.corners.amplitude.headerDepth ?? AMPLITUDE_DEFAULTS.corners.headerDepth;
        const to = bumpCapped(from, AMPLITUDE_CAPS.headerDepth);
        out.edges.corners.amplitude.headerDepth = to;
        record("edges.corners", "headerDepth", from, to, "quoins under-realized");
      }
      if (word(/plinth|base|water.?table/, text)) {
        const had = !!out.base;
        out.base ??= { material: out.edges.corners?.material, amplitude: { ...AMPLITUDE_DEFAULTS.base } };
        out.base.amplitude ??= { ...AMPLITUDE_DEFAULTS.base };
        if (!had) changes.push({ layer: "base", knob: "ensured", from: null, to: out.base.amplitude.depth, why: "plinth/base absent" });
      }
      if (word(/eave|cornice|trim|verge|band/, text)) {
        out.edges.top ??= { material: out.edges.corners?.material, amplitude: { ...AMPLITUDE_DEFAULTS.top } };
        out.edges.top.amplitude ??= { ...AMPLITUDE_DEFAULTS.top };
        const from = out.edges.top.amplitude.courses ?? AMPLITUDE_DEFAULTS.top.courses;
        const to = bumpCapped(from, AMPLITUDE_CAPS.courses);
        out.edges.top.amplitude.courses = to;
        record("edges.top", "courses", from, to, "trim thin");
      }
    } else if (dept === "ROOF") {
      if (word(/eave|verge|ridge|trim|fascia|band/, text)) {
        out.roof ??= { edge: { amplitude: { ...AMPLITUDE_DEFAULTS.roof } } };
        out.roof.edge ??= { amplitude: { ...AMPLITUDE_DEFAULTS.roof } };
        out.roof.edge.amplitude ??= { ...AMPLITUDE_DEFAULTS.roof };
        const from = out.roof.edge.amplitude.ridgeCourses ?? AMPLITUDE_DEFAULTS.roof.ridgeCourses;
        const to = bumpCapped(from, AMPLITUDE_CAPS.courses);
        out.roof.edge.amplitude.ridgeCourses = to;
        record("roof.edge", "ridgeCourses", from, to, "roof trim thin");
      }
    } else if (dept === "OPENING") {
      // an absent opening reveal/arch → ensure the opening layer is declared (materials are the source's job;
      // refinement only guarantees presence so the reveal/arch is built).
      if (!out.edges.opening) {
        out.edges.opening = {};
        changes.push({ layer: "edges.opening", knob: "ensured", from: null, to: "present", why: "opening reveal/arch absent" });
      }
    }
  }

  return { spec: out, changes, notes };
}
