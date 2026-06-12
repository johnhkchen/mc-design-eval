// Style formation, pure half (T-130-01, story S-130, epic E-32) — everything between the four
// typed BAML calls of the formation chain (story → palette → proportions → brush needs) that is
// NOT transport: prompt-input digests, the post-parse gates the re-ask policy consumes, the
// deterministic valueCheck stamping, draft-pack assembly, the near-tone evidence report, the
// rustic-rederivation comparison, and the human ratification sheet. The impure chain runner is
// scripts/form-style.mjs; the ratify script is scripts/ratify-pack.mjs.
//
// MATERIALS ARE DIEGETIC, NOT OPTICAL (E-32 Rule 4): the block vocabulary enters the palette
// prompt as TEXT (names + the committed table's L* lightness — concept-image-≠-value-preview),
// never as pixels; no image/GLB/texture input exists anywhere in this module or the runner
// (pinned by formation-guard.test.mjs). Provenance keys are derived MECHANICALLY from the
// story's available_materials before the palette call, so citations are checkable and the
// pack's referential integrity holds by construction.
//
// A DRAFT IS STRUCTURALLY NOT A PACK: assembleDraftPack stamps `style-pack/draft-v1`, which
// parseStylePack's `const` check rejects — no existing code path can load, register, or build
// from an unratified draft. Ratification (scripts/ratify-pack.mjs) swaps the tag, stamps the
// who/when receipt, and runs the full pack gates fail-loud.
//
// GATES MIRROR THE PROMPT (the same-prompt-seam contract): every rule classifyPalette /
// classifyProportions enforces is taught in baml_src/formation.baml, so a compliant model can
// infer it and the bounded re-ask budget is never starved by an unlearnable rule. A gate
// failure is MALFORMED for src/baml/ask.mjs (same-prompt re-ask), never a verdict.
// classifyBacklog wraps the factory's FX-D1 classifier (the all-array SAP leniency) rather
// than restating it — one composition point for that rule.
//
// PURE (committed-file idiom): loadBlockTable/loadBlockVocab defaults only, both injectable;
// no GL, no network, no Date/random.

import { loadBlockTable } from "../color/block-table.mjs";
import { deltaE76 } from "../color/cielab.mjs";
import { familyOf, isExcludedCandidate, weightedDeltaE } from "../color/value-select.mjs";
import { derivedFormClass, loadBlockVocab } from "../form/kit.mjs";
import { assertNonEmptyBacklog, enforceRegistryDedup } from "../factory/backlog.mjs";
import { CONFORMANCE_CHECK_NAMES } from "./conformance.mjs";

/** A draft is structurally not a pack — parseStylePack rejects this tag by `const`. */
export const DRAFT_SCHEMA_TAG = "style-pack/draft-v1";

/** The formation run's committed ledger schema (scripts/form-style.mjs stamps it). */
export const FORMATION_LEDGER_SCHEMA = "style-formation-ledger/v1";

/** The comparison record schema (rustic re-derivation, AC4). */
export const PACK_COMPARISON_SCHEMA = "pack-comparison/v1";

/** Architectural non-cube members the palette prompt offers (doors, shutters, course members,
 *  thin infills, lights) — the survival vocabulary's flora/redstone tail is not palette
 *  material. The digest's listed set IS the gate's legal set (one composition point). */
export const ARCH_NONCUBE_RE =
  /(?:door|trapdoor|stairs|slab|fence|fence_gate|wall|pane|bars|lantern|torch|ladder|chain)$/;

/** The realizable pitch vocabulary (mirrors validateStylePack / the generators). */
export const PITCH_VOCAB = Object.freeze([0.5, 1, 2]);

const round2 = (n) => Math.round(n * 100) / 100;

// ---------------------------------------------------------------- prompt-input digests

/** Display order of the cube families in the vocabulary digest (known families first, the
 *  family-less remainder last). */
const FAMILY_ORDER = ["stone", "brick", "planks", "log", "smooth"];

/**
 * The legal block vocabulary as ONE artifact: `text` for the DerivePalette prompt (cube
 * families with the committed table's L* so darkness is knowable; an architectural non-cube
 * section) and `names` for classifyPalette's membership gate — single-sourced so the prompt
 * and the gate can never diverge. Excluded candidates (ore / gravity-affected) never appear.
 * @param {{table?:{blocks:object[]}, vocab?:{names:Set<string>}}} [opts]
 * @returns {{text:string, names:Set<string>}}
 */
export function blockVocabularyDigest({ table = loadBlockTable(), vocab = loadBlockVocab() } = {}) {
  const cubeSet = new Set(table.blocks.map((b) => b.block));
  const cubes = table.blocks.filter((b) => !isExcludedCandidate(b.block));
  const byFamily = new Map();
  for (const b of cubes) {
    const f = familyOf(b.block) ?? "no family";
    if (!byFamily.has(f)) byFamily.set(f, []);
    byFamily.get(f).push(b);
  }
  const famLine = (f) => {
    const list = (byFamily.get(f) ?? [])
      .slice()
      .sort((a, b) => a.block.localeCompare(b.block))
      .map((b) => `${b.block} (L ${Math.round(b.lab[0])})`);
    return list.length ? `- ${f}: ${list.join(", ")}` : null;
  };
  const families = [...FAMILY_ORDER, "no family"].map(famLine).filter(Boolean);
  const nonCube = [...vocab.names]
    .filter((n) => !cubeSet.has(n) && !isExcludedCandidate(n) && ARCH_NONCUBE_RE.test(n))
    .sort();
  const text = [
    "Full-cube blocks, grouped by material family — L is the block's true rendered lightness (0 black … 100 white):",
    ...families,
    "",
    "Non-cube placed members (doors, shutters, course stairs/slabs, thin infills, lights — no L; they render as fittings, not fields):",
    nonCube.join(", "),
  ].join("\n");
  const names = new Set([...cubes.map((b) => b.block), ...nonCube]);
  return { text, names };
}

/**
 * MaterialStory → the one-page prose digest the downstream prompts read (palette, proportions).
 * @param {object} story  a parsed AuthorMaterialStory reply
 */
export function storyDigest(story) {
  return [
    `Style name: ${story.style_name}`,
    `Setting: ${story.setting}`,
    "",
    `Geology: ${story.geology}`,
    `Timber: ${story.timber}`,
    `Wealth: ${story.wealth_class}`,
    `Roofing economy: ${story.roofing_economy}`,
    `Trade: ${story.trade}`,
    "",
    "Available materials:",
    ...story.available_materials.map(
      (m) => `- ${m.material} (${m.abundance}; ${m.source}) — typical use: ${m.typical_use}`,
    ),
  ].join("\n");
}

const slugOf = (s) => {
  let k = String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  if (!/^[a-z]/.test(k)) k = k ? `m-${k}` : "m";
  return k;
};

/**
 * Provenance sources derived MECHANICALLY from the story's available_materials — kebab keys
 * (collision-suffixed) the palette prompt offers and the pack's referential integrity checks.
 * The narrative records source + abundance + typical use (the citation a ratifier reads).
 * @param {object} story
 * @returns {Record<string,string>} key → narrative; keys match the schema's `^[a-z][a-z0-9-]*$`
 */
export function sourcesFromStory(story) {
  const sources = {};
  for (const m of story.available_materials) {
    const base = slugOf(m.material);
    let key = base;
    for (let n = 2; key in sources; n++) key = `${base}-${n}`;
    sources[key] = `${m.source} (${m.abundance}) — typical use: ${m.typical_use}`;
  }
  return sources;
}

/** The DerivePalette `source_keys` input: every legal citation key with its narrative. */
export function sourceKeysDigest(sources) {
  return Object.entries(sources).map(([k, v]) => `- ${k}: ${v}`).join("\n");
}

/** The derived palette as prose — DeriveProportions' `palette_digest` input. */
export function paletteDigest(roles) {
  return roles
    .map((r) => {
      const seat = r.band != null && r.tier != null ? ` [${r.band}/${r.tier}]` : "";
      return `- ${r.role} → ${r.block}${seat}: ${r.rationale}`;
    })
    .join("\n");
}

/**
 * DecomposeBrushBacklog's `style_summary` input from the chain's parts — the packSummary shape
 * WITHOUT idioms (they do not exist yet: the needs stage is what derives them).
 * @param {{story:object, roles:object[], proportions:object}} p  proportions = ProportionRules
 */
export function styleSummaryFromParts({ story, roles, proportions: p }) {
  return [
    `Style: ${story.style_name} — ${story.setting}`,
    "",
    "Palette (role → block — the diegetic material assignments):",
    ...roles.map((r) => `- ${r.role} → ${r.block}: ${r.rationale}`),
    "",
    `Proportions: storey height ${p.storey_min}–${p.storey_max} blocks; ` +
      `pitch classes ${JSON.stringify(p.pitch_classes)}; ` +
      `opening spacing ${p.opening_min}–${p.opening_max} cells.`,
  ].join("\n");
}

// ---------------------------------------------------------------- post-parse gates (ask.mjs classify)

/**
 * A zone seat is meaningful only COMPLETE (band AND tier). A dangling half-seat (the live
 * failure mode: `tier: "preserve"` with `band: null`) is ABSORBED — dropped by the assembler,
 * never rejected by the gate (same-prompt-seam-handle-dont-reject: three re-asks starved on
 * this exact shape before absorption). Returns the dangling seats so the ledger can name them.
 * @param {object[]} roles
 */
export function danglingSeats(roles) {
  return roles
    .filter((r) => (r.band != null) !== (r.tier != null))
    .map((r) => ({ role: r.role, band: r.band ?? null, tier: r.tier ?? null }));
}

/**
 * The DerivePalette gate — every rule here is taught in the prompt (same-prompt-seam contract).
 * PaletteDerivation is an all-array class: any malformed reply SAP-degrades to zero roles, so
 * the empty palette is MALFORMED (the FX-D1 class), never a verdict. Zone-seat rules apply to
 * COMPLETE seats only — dangling half-seats are absorbed (see danglingSeats), not rejected.
 * @param {object} parsed  a PaletteDerivation
 * @param {{sourceKeys:Iterable<string>, vocabNames:Set<string>}} p
 * @returns {{ok:true}|{ok:false, reason:string}}
 */
export function classifyPalette(parsed, { sourceKeys, vocabNames }) {
  const bad = (reason) => ({ ok: false, reason });
  const roles = parsed?.roles ?? [];
  if (roles.length === 0) return bad("zero roles — SAP-degraded or refusing reply (the FX-D1 leniency class)");
  const keys = sourceKeys instanceof Set ? sourceKeys : new Set(sourceKeys);
  const seen = new Set();
  const dominants = new Map();
  for (const r of roles) {
    if (!/^[a-z][a-z0-9.-]*$/.test(r?.role ?? "")) return bad(`role "${r?.role}" is not a lowercase dotted name`);
    if (seen.has(r.role)) return bad(`duplicate role "${r.role}"`);
    seen.add(r.role);
    if (!vocabNames.has(r.block)) return bad(`role ${r.role}: block "${r.block}" is outside the supplied vocabulary`);
    if (typeof r.rationale !== "string" || r.rationale.trim() === "") return bad(`role ${r.role}: empty rationale`);
    if (!Array.isArray(r.provenance) || r.provenance.length === 0) return bad(`role ${r.role}: no provenance citation`);
    for (const k of r.provenance) {
      if (!keys.has(k)) return bad(`role ${r.role}: provenance key "${k}" is not a supplied source key`);
    }
    const seated = r.band != null && r.tier != null; // half-seats are absorbed, never rejected
    if (seated && r.tier !== "dominant" && r.tier !== "preserve") return bad(`role ${r.role}: unknown tier "${r.tier}"`);
    if (seated && r.tier === "dominant") {
      if (dominants.has(r.band)) return bad(`band "${r.band}" has two dominants (${dominants.get(r.band)}, ${r.role})`);
      dominants.set(r.band, r.role);
    }
  }
  for (const r of roles) {
    if (r.band != null && r.tier === "preserve" && !dominants.has(r.band)) {
      return bad(`band "${r.band}" has preserve entries but no dominant`);
    }
  }
  for (const d of parsed?.decoration ?? []) {
    if (typeof d?.item !== "string" || d.item.trim() === "") return bad("decoration entry with an empty item name");
    if (!vocabNames.has(d.block)) return bad(`decoration ${d.item}: block "${d.block}" is outside the supplied vocabulary`);
    if (!Array.isArray(d.where) || d.where.length === 0) return bad(`decoration ${d.item}: empty where[]`);
  }
  return { ok: true };
}

/**
 * The DeriveProportions gate. ProportionRules is all-scalar — SAP coerces numerics, so
 * out-of-vocabulary pitches and min>max SURVIVE parsing; this gate is what catches them.
 * @param {object} p  a ProportionRules
 */
export function classifyProportions(p) {
  const bad = (reason) => ({ ok: false, reason });
  if (!p || typeof p !== "object") return bad("no proportion rules parsed");
  for (const k of ["storey_min", "storey_max", "opening_min", "opening_max"]) {
    if (!Number.isInteger(p[k]) || p[k] < 1) return bad(`${k} must be an integer >= 1 (got ${p[k]})`);
  }
  if (p.storey_min > p.storey_max) return bad("storey_min exceeds storey_max");
  if (p.opening_min > p.opening_max) return bad("opening_min exceeds opening_max");
  if (!Array.isArray(p.pitch_classes) || p.pitch_classes.length === 0) return bad("pitch_classes is empty");
  for (const pc of p.pitch_classes) {
    if (!PITCH_VOCAB.includes(pc)) return bad(`pitch ${pc} is outside the realizable vocabulary {0.5, 1, 2}`);
  }
  return { ok: true };
}

/**
 * The DecomposeBrushBacklog gate — the factory's FX-D1 classifier (empty union = MALFORMED),
 * reshaped from throw to the classify verdict ask.mjs consumes. One rule, one home.
 * @param {object} parsed  a BrushBacklog
 */
export function classifyBacklog(parsed) {
  try {
    assertNonEmptyBacklog(parsed);
    return { ok: true };
  } catch (e) {
    return { ok: false, reason: e.message };
  }
}

// ---------------------------------------------------------------- assembly

/**
 * Model role choices → pack palette entries with the valueCheck snapshot stamped
 * DETERMINISTICALLY — the exact derivation validateStylePack re-checks (derivedFormClass over
 * the table's cube set, table membership, familyOf, the table's Lab verbatim), so
 * authoring-time and validation-time can never disagree.
 * @param {object[]} roles  PaletteRoleChoice[] (classifyPalette-accepted)
 * @param {{table?:{blocks:object[]}}} [opts]
 * @returns {object[]} schema-shaped palette entries
 */
export function stampValueChecks(roles, { table = loadBlockTable() } = {}) {
  const byBlock = new Map(table.blocks.map((b) => [b.block, b]));
  const cubeSet = new Set(byBlock.keys());
  return roles.map((r) => {
    const formClass = derivedFormClass(r.block, { cubeSet });
    const valueCheck = { formClass, inTable: byBlock.has(r.block), family: familyOf(r.block) };
    if (formClass === "cube") valueCheck.lab = byBlock.get(r.block).lab;
    return {
      role: r.role,
      block: r.block,
      rationale: r.rationale,
      provenance: [...r.provenance],
      ...(r.band != null && r.tier != null ? { zone: { band: r.band, tier: r.tier } } : {}),
      valueCheck,
    };
  });
}

/**
 * The mechanical subset of idiom param seeding — only rules a machine can defend:
 *   roof.* constructs get their block family from the roof roles (field/course/step);
 *   course.stairs / course.slab get the course members; plinth/arch/head.flat get the wall
 *   dressing; chimney gets its shaft/cap roles. Everything else ships `{name}` only —
 *   `params` is optional in the schema, and partial seeding is recorded on the draft README.
 * Role lookup is exact-then-prefix (roof.field matches roof.field.main).
 * @param {{owned:Iterable<string>, paletteEntries:object[]}} p
 * @returns {{name:string, params?:object}[]} sorted by name
 */
export function seedIdiomParams({ owned, paletteEntries }) {
  const find = (name) => {
    const exact = paletteEntries.find((p) => p.role === name);
    if (exact) return exact.block;
    const pre = paletteEntries.find((p) => p.role.startsWith(`${name}.`));
    return pre ? pre.block : null;
  };
  const out = [];
  for (const name of [...owned].sort()) {
    let params = null;
    if (name.startsWith("roof.")) {
      const field = find("roof.field");
      const stairs = find("roof.course");
      const slab = find("roof.step");
      if (field) params = { blocks: { field, ...(stairs ? { stairs } : {}), ...(slab ? { slab } : {}) } };
    } else if (name === "course.stairs") {
      const b = find("roof.course");
      if (b) params = { block: b };
    } else if (name === "course.slab") {
      const b = find("roof.step");
      if (b) params = { block: b };
    } else if (name === "plinth" || name === "arch" || name === "head.flat") {
      const b = find("wall.dressing");
      if (b) params = { block: b };
    } else if (name === "chimney") {
      const shaft = find("chimney.shaft") ?? find("chimney.stack");
      const cap = find("chimney.cap");
      const p = { ...(shaft ? { block: shaft } : {}), ...(cap ? { cap: "crown", capBlock: cap } : {}) };
      if (Object.keys(p).length > 0) params = p;
    }
    out.push(params ? { name, params } : { name });
  }
  return out;
}

/**
 * Assemble the DRAFT pack — `style-pack/draft-v1`, which parseStylePack REJECTS (the
 * ratification gate honored by construction). After the tag swap + ratification stamp
 * (scripts/ratify-pack.mjs) the same object must pass assertStylePack + validateStylePack.
 * Conformance defaults to the full standard vocabulary (same as rustic — the check set is
 * closed; formation never asks the model for it).
 * @param {{story:object, paletteEntries:object[], decoration:object[], proportions:object,
 *          idioms:{name:string, params?:object}[], styleSlug:string}} p
 */
export function assembleDraftPack({ story, paletteEntries, decoration, proportions, idioms, styleSlug }) {
  if (!Array.isArray(idioms) || idioms.length === 0) {
    throw new Error(
      "assembleDraftPack: the needs stage yielded no owned idioms — a pack needs at least one (schema minItems 1)",
    );
  }
  return {
    schema: DRAFT_SCHEMA_TAG,
    style: styleSlug,
    provenance: {
      setting: story.setting,
      sources: sourcesFromStory(story),
      wealthClass: story.wealth_class,
      roofingEconomy: story.roofing_economy,
    },
    palette: paletteEntries,
    idioms,
    proportions: {
      storeyHeight: { min: proportions.storey_min, max: proportions.storey_max },
      pitchClasses: [...proportions.pitch_classes],
      openingRhythm: { minSpacing: proportions.opening_min, maxSpacing: proportions.opening_max },
    },
    decoration: (decoration ?? []).map((d) => ({ item: d.item, block: d.block, where: [...d.where] })),
    conformance: { checks: [...CONFORMANCE_CHECK_NAMES] },
  };
}

/**
 * The ONE stage→draft derivation (runner and replay test share it, so they cannot drift):
 * the four accepted stage replies in, the draft pack + its evidence out. Pure given its
 * inputs — the offline replay re-derives the committed draft byte-identically from the
 * committed stage records (E-31 Rule 5).
 * @param {{story:object, palette:object, proportions:object, backlog:object,
 *          styleSlug:string, ownedNames:string[], table?:object}} p
 *   palette = PaletteDerivation, proportions = ProportionRules, backlog = BrushBacklog (raw);
 *   ownedNames = the registry's brush names (injected — vocabulary-authority stays upstream)
 * @returns {{draft:object, deduped:object, owned:string[], nearTone:object[], absorbedSeats:object[]}}
 */
/**
 * Recover the registry's brush names FROM a committed decompose stage's `registry_state`
 * digest (brush-catalog registryDigest lines: `- <name> (<kind>; ...`). Replays must derive
 * the draft against the registry AS RECORDED at formation time, never the live table — the
 * registry GROWS (E-32 is the growing), and a replay that read the live table would drift
 * the moment a factory-specified brush lands (surfaced live by this ticket's own brushes).
 * @param {string} digest  the decompose inputs.json `registry_state` text
 * @returns {string[]} brush names, in digest order
 */
export function ownedNamesFromRegistryDigest(digest) {
  if (typeof digest !== "string") throw new Error("ownedNamesFromRegistryDigest: digest must be the registry_state text");
  const names = [...digest.matchAll(/^- (\S+) \(/gm)].map((m) => m[1]);
  if (!names.length) throw new Error("ownedNamesFromRegistryDigest: no brush lines found — not a registry digest");
  return names;
}

export function deriveDraftFromStages({ story, palette, proportions, backlog, styleSlug, ownedNames, table = null }) {
  const deduped = enforceRegistryDedup(backlog, ownedNames);
  const ownedSet = new Set(ownedNames);
  const owned = [...new Set(
    deduped.parametrization_notes.map((n) => n.existing_brush).filter((n) => ownedSet.has(n)),
  )].sort();
  const paletteEntries = stampValueChecks(palette.roles, table ? { table } : {});
  const idioms = seedIdiomParams({ owned, paletteEntries });
  const draft = assembleDraftPack({
    story,
    paletteEntries,
    decoration: palette.decoration ?? [],
    proportions,
    idioms,
    styleSlug,
  });
  return {
    draft, deduped, owned,
    nearTone: nearToneReport(paletteEntries),
    absorbedSeats: danglingSeats(palette.roles), // named in the run ledger, dropped from the pack
  };
}

// ---------------------------------------------------------------- evidence & comparison

/**
 * Near-tone separation evidence for the ratifier (T-086 tooling, ratification-time): every
 * same-family cube pair's chroma-weighted distance (w=2 — value-drift-is-hue) with the true
 * ΔE76 beside it. Evidence, never a gate (deterministic table arithmetic only). Sorted
 * closest-first — the top row is the pair most at risk of reading as one material.
 * @param {object[]} paletteEntries  stamped entries
 */
export function nearToneReport(paletteEntries) {
  const cubes = paletteEntries.filter(
    (p) => p.valueCheck?.formClass === "cube" && p.valueCheck.family && p.valueCheck.lab,
  );
  const pairs = [];
  for (let i = 0; i < cubes.length; i++) {
    for (let j = i + 1; j < cubes.length; j++) {
      const a = cubes[i];
      const b = cubes[j];
      if (a.valueCheck.family !== b.valueCheck.family) continue;
      pairs.push({
        family: a.valueCheck.family,
        a: { role: a.role, block: a.block },
        b: { role: b.role, block: b.block },
        weightedDeltaE: round2(weightedDeltaE(a.valueCheck.lab, b.valueCheck.lab)),
        deltaE76: round2(deltaE76(a.valueCheck.lab, b.valueCheck.lab)),
      });
    }
  }
  return pairs.sort((x, y) => x.weightedDeltaE - y.weightedDeltaE);
}

/**
 * The rustic-rederivation closeness record (AC4): align roles by exact name, then UNAMBIGUOUS
 * zone seats — a (band,tier) pair matches only when exactly one role holds it on each side;
 * everything else is a NAMED divergence (missing/extra), never fuzzily matched (the mean-color
 * collapse risk rejected in design D5). Per aligned pair: same-block | same-family | different
 * (familyOf), with chroma-weighted + true-ΔE distance when both sides carry a Lab snapshot.
 * Closeness is evidence of chain quality, not a gate.
 * @param {object} derived  a draft or pack
 * @param {object} curated  the pack of record
 */
export function comparePacks(derived, curated) {
  const dUsed = new Set();
  const cUsed = new Set();
  const aligned = [];
  for (const d of derived.palette) {
    const c = curated.palette.find((x) => x.role === d.role);
    if (c) {
      aligned.push({ d, c, alignedBy: "name" });
      dUsed.add(d.role);
      cUsed.add(c.role);
    }
  }
  const zKey = (p) => (p.zone ? `${p.zone.band}/${p.zone.tier}` : null);
  const restByZone = (palette, used) => {
    const m = new Map();
    for (const p of palette) {
      const k = zKey(p);
      if (used.has(p.role) || k === null) continue;
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(p);
    }
    return m;
  };
  const dZones = restByZone(derived.palette, dUsed);
  const cZones = restByZone(curated.palette, cUsed);
  for (const [k, ds] of dZones) {
    const cs = cZones.get(k) ?? [];
    if (ds.length === 1 && cs.length === 1) {
      aligned.push({ d: ds[0], c: cs[0], alignedBy: "zone" });
      dUsed.add(ds[0].role);
      cUsed.add(cs[0].role);
    }
  }
  const roles = aligned.map(({ d, c, alignedBy }) => {
    const df = familyOf(d.block);
    const verdict = d.block === c.block ? "same-block" : df !== null && df === familyOf(c.block) ? "same-family" : "different";
    const labs = d.valueCheck?.lab && c.valueCheck?.lab;
    return {
      role: { derived: d.role, curated: c.role },
      alignedBy,
      block: { derived: d.block, curated: c.block },
      verdict,
      ...(labs
        ? {
            weightedDeltaE: round2(weightedDeltaE(d.valueCheck.lab, c.valueCheck.lab)),
            deltaE76: round2(deltaE76(d.valueCheck.lab, c.valueCheck.lab)),
          }
        : {}),
    };
  });
  const named = (p) => ({ role: p.role, block: p.block, ...(p.zone ? { zone: { ...p.zone } } : {}) });
  const dNames = derived.idioms.map((i) => i.name);
  const cNames = curated.idioms.map((i) => i.name);
  const dp = derived.proportions;
  const cp = curated.proportions;
  return {
    schema: PACK_COMPARISON_SCHEMA,
    derivedStyle: derived.style,
    curatedStyle: curated.style,
    roles,
    missing: curated.palette.filter((p) => !cUsed.has(p.role)).map(named),
    extra: derived.palette.filter((p) => !dUsed.has(p.role)).map(named),
    proportions: {
      storeyHeight: { derived: { ...dp.storeyHeight }, curated: { ...cp.storeyHeight } },
      pitchClasses: {
        derived: [...dp.pitchClasses],
        curated: [...cp.pitchClasses],
        common: dp.pitchClasses.filter((x) => cp.pitchClasses.includes(x)),
      },
      openingRhythm: { derived: { ...dp.openingRhythm }, curated: { ...cp.openingRhythm } },
    },
    idioms: {
      common: dNames.filter((n) => cNames.includes(n)).sort(),
      onlyDerived: dNames.filter((n) => !cNames.includes(n)).sort(),
      onlyCurated: cNames.filter((n) => !dNames.includes(n)).sort(),
    },
    sources: { derived: Object.keys(derived.provenance.sources).length, curated: Object.keys(curated.provenance.sources).length },
  };
}

// ---------------------------------------------------------------- the ratification sheet

const seatOf = (p) => (p.zone ? `${p.zone.band}/${p.zone.tier}` : "—");
const lOf = (p) => (p.valueCheck?.lab ? String(Math.round(p.valueCheck.lab[0])) : "—");

/**
 * The human ratification sheet — what the ratifier reads and signs (D3): the story, the palette
 * with its value evidence, the seeded idioms, the brush needs, the comparison (when present),
 * and the documented ratify flow. Deterministic (no clock — time lives in the ledger).
 * @param {{pack:object, nearTone:object[], needs:{items:object[], parametrization_notes:object[]},
 *          comparison?:object|null}} p
 */
export function draftReadme({ pack, nearTone, needs, comparison = null }) {
  const lines = [
    `# Style draft: \`${pack.style}\` — ratification sheet`,
    "",
    `> DRAFT (\`${DRAFT_SCHEMA_TAG}\`) — structurally NOT a pack: no loader, registry, or build`,
    "> path accepts this tag. The human taste gate (E-32 Rule 4) is the act of ratifying:",
    "> read this sheet, then run",
    "> ",
    `> \`npm run style:ratify -- --style ${pack.style} --by "<who>" [--note "<text>"]\``,
    "",
    "## The material story",
    "",
    `**Setting:** ${pack.provenance.setting}`,
    "",
    `**Wealth:** ${pack.provenance.wealthClass ?? "—"}`,
    "",
    `**Roofing economy:** ${pack.provenance.roofingEconomy ?? "—"}`,
    "",
    "### Sources (every palette role cites these)",
    "",
    ...Object.entries(pack.provenance.sources).map(([k, v]) => `- \`${k}\`: ${v}`),
    "",
    "## Palette (the taste pass reads this table)",
    "",
    "| role | block | seat | L* | rationale |",
    "|---|---|---|---|---|",
    ...pack.palette.map(
      (p) => `| ${p.role} | \`${p.block}\` | ${seatOf(p)} | ${lOf(p)} | ${p.rationale.replace(/\|/g, "\\|")} |`,
    ),
    "",
    "## Value evidence — near-tone separation (same-family cube pairs; weighted w=2, true ΔE76 beside)",
    "",
    ...(nearTone.length
      ? nearTone.map(
          (p) =>
            `- ${p.family}: ${p.a.role} (\`${p.a.block}\`) vs ${p.b.role} (\`${p.b.block}\`) — weighted ${p.weightedDeltaE}, true ${p.deltaE76}`,
        )
      : ["- no same-family cube pairs — every cube family appears once"]),
    "",
    "## Proportions",
    "",
    `- storeys ${pack.proportions.storeyHeight.min}–${pack.proportions.storeyHeight.max} blocks; ` +
      `pitch classes ${JSON.stringify(pack.proportions.pitchClasses)}; ` +
      `opening spacing ${pack.proportions.openingRhythm.minSpacing}–${pack.proportions.openingRhythm.maxSpacing} cells`,
    "",
    "## Idioms (owned brushes; params seeded mechanically — verify before relying on them)",
    "",
    ...pack.idioms.map((i) => `- \`${i.name}\`${i.params ? ` — ${JSON.stringify(i.params)}` : " — no seeded params"}`),
    "",
    "## Brush needs (new work this style asks for — the T-131 factory's input)",
    "",
    ...(needs.items.length
      ? needs.items.map((it) => `- NEW: \`${it.name}\` — ${it.purpose}`)
      : ["- none — the registry covers the style"]),
    ...(needs.parametrization_notes.length
      ? needs.parametrization_notes.map((n) => `- owned \`${n.existing_brush}\`: ${n.need}`)
      : []),
    "",
  ];
  if (comparison) {
    const counts = { "same-block": 0, "same-family": 0, different: 0 };
    for (const r of comparison.roles) counts[r.verdict] += 1;
    lines.push(
      `## Comparison vs the curated \`${comparison.curatedStyle}\` pack (closeness is evidence, not a gate)`,
      "",
      `- aligned roles: ${comparison.roles.length} (${counts["same-block"]} same-block, ${counts["same-family"]} same-family, ${counts.different} different)`,
      ...(comparison.missing.length
        ? [`- curated roles the chain missed: ${comparison.missing.map((m) => `${m.role} (\`${m.block}\`)`).join(", ")}`]
        : ["- curated roles the chain missed: none"]),
      ...(comparison.extra.length
        ? [`- derived roles with no curated counterpart: ${comparison.extra.map((m) => `${m.role} (\`${m.block}\`)`).join(", ")}`]
        : ["- derived roles with no curated counterpart: none"]),
      `- idioms only derived: ${comparison.idioms.onlyDerived.join(", ") || "none"}; only curated: ${comparison.idioms.onlyCurated.join(", ") || "none"}`,
      "- full detail: `comparison.json` beside this file",
      "",
    );
  }
  lines.push(
    "## Taste checklist (before ratifying)",
    "",
    "- [ ] every rationale reads from the story (craft and economy), never just the color",
    "- [ ] near-tone pairs above are separable at a glance (the weighted distance is honest)",
    "- [ ] each band's dominant is what the style should read as from the street",
    "- [ ] proportions match the imagined place (storeys, pitch, opening rhythm)",
    "",
  );
  return lines.join("\n");
}
