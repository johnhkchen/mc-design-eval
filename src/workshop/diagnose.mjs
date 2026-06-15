// Layer A — the structured DIAGNOSTIC judge's render-args (T-164-01, story S-164, epic E-39). The
// pure .mjs serializer for the BAML function DiagnoseBuild(... ) -> Critique: it turns the recognized
// building program + the style pack into the typed STRING inputs the BAML template renders around the
// concept + build-render images. Mirrors src/workshop/critique.mjs's critiqueRenderArgs (the fused
// path's serializer) — same azimuth labels, same palette block (imported, one definition).
//
// E-39 splits the fused CritiqueWorkshopRound into Layer A (what's wrong, here) and Layer B (what to
// do, T-164-02). This serializer carries the DIAGNOSIS half only: concept + program grounding + the
// build renders, asking for per-department expected/present/missing. NO actions, NO rounds, NO
// conformance, NO proportion (proportion rides the mass adjust-params levers, off this contract —
// the recorded S-163 decision). The Department vocabulary is single-sourced from departments.mjs.
//
// THIS IS THE CREATION-LOOP CONTRACT, NOT THE FROZEN JUDGE: no gate vocabulary, no verdict
// aggregation — the frozen scalar instrument stays separate (transport-guard TG4).
//
// PURE — no GL, no IO, no Date/random — runs under the `src/**/*.test.mjs` glob.

import { ANGLE_DESCRIPTIONS, paletteBlock } from "./critique.mjs";
import { DEPARTMENTS, departmentOf } from "../pack/departments.mjs";

/** The contract tag (for the runner/ledger when T-164-02 wires this into the loop). */
export const DIAGNOSIS_SCHEMA = "critique/v1";

/** The per-diagnosis item cap — the register the fused path calls MAX_ISSUES. */
export const MAX_DIAGNOSIS_ITEMS = 6;

/**
 * The recognized-program grounding block — what the build SHOULD read as, per mass. The VLM's own
 * reading summary (the intent prose) plus the per-mass JSON (roof idiom, wall roles, openings,
 * chimney) — i.e. the `expected` column, already departmentized by construction. This is what keeps
 * Layer A's expected/present/missing grounded rather than vacuous.
 */
export function programBlock({ program }) {
  const summary = program?.reading?.summary;
  const lines = [
    "THE RECOGNIZED PROGRAM (what the build should read as — per mass, the intended construction):",
  ];
  if (typeof summary === "string" && summary.trim().length > 0) lines.push(summary.trim());
  lines.push("```json", JSON.stringify({ masses: program?.masses ?? [] }, null, 2), "```");
  return lines.join("\n");
}

/**
 * The per-STYLE construction-grammar block — the `expected` PROFILE the Layer-A judge selects by the
 * declared style (T-165-01, story S-165, epic E-39). This is what makes the SAME build yield a
 * DIFFERENT expected roof/wall/opening under two styles — the within-family gradient the scalar eval
 * lacked. DERIVED from the pack (the single source of style truth — never a hand-listed per-style or
 * per-subject table): roof/wall/opening MATERIALS from the palette roles, and the available CONSTRUCTION
 * idioms bucketed by `departmentOf` (the same idiom→department authority Layer B routes on). Editing the
 * pack updates the profile; there is no second source to drift. Element grammar only — NO proportion,
 * NO massing, NO verdict (the Layer A contract). PURE.
 *
 * @param {object} args
 * @param {object} args.pack  a validated style pack (palette roles + idioms + proportions)
 * @returns {string} the multi-line grammar block for the prompt's `style_profile` input
 */
export function styleProfileBlock({ pack }) {
  const palette = pack?.palette ?? [];
  const idioms = (pack?.idioms ?? []).map((i) => i.name);
  // palette `role: block` entries whose role is in one of the given top-level families (role families,
  // never subject names — the recognize self-grep discipline).
  const materials = (...families) =>
    palette
      .filter((p) => families.some((f) => p.role === f || p.role.startsWith(`${f}.`)))
      .map((p) => `${p.role} → ${p.block}`)
      .join(", ") || "—";
  // construction idioms the pack carries for a department — bucketed by the single-sourced classifier.
  const dept = (d) => idioms.filter((n) => departmentOf(n) === d).sort().join(", ") || "none";
  const pitch = JSON.stringify(pack?.proportions?.pitchClasses ?? []);
  return [
    `THE STYLE'S CONSTRUCTION GRAMMAR (what a ${pack?.style ?? "?"} build's roof / walls / openings should read as — element construction, not size):`,
    `- ROOF: materials ${materials("roof")}; covering idioms ${dept("ROOF")}; pitch classes ${pitch}.`,
    `- WALLS: materials ${materials("wall", "frame")}; construction idioms ${dept("WALL")}.`,
    `- OPENINGS: materials ${materials("door", "window", "opening")}; treatment idioms ${dept("OPENING")}.`,
  ].join("\n");
}

/**
 * The DiagnoseBuild prompt's DATA — the typed string inputs of the BAML function (baml_src/
 * department.baml). The prose skeleton lives in the BAML template; this serializes the live objects
 * into its string params. Deterministic in its inputs; the rendered prompt is byte-pinned to the
 * captured golden by the fixture test (FX-DB1).
 *
 * @param {object} args
 * @param {object} args.program  a recognized building-program/v1 (the diagnosis grounding — masses + reading)
 * @param {object} args.pack  a validated style pack (the material vocabulary + style name)
 * @param {string[]} args.azimuths  the render azimuths, in image order (the fixed gate lens)
 * @param {number} [args.maxItems]  the per-diagnosis item cap
 * @returns {{style:string, image_list:string, program_block:string, palette_block:string, style_profile:string, departments:string, max_items:number}}
 */
export function diagnoseRenderArgs({ program, pack, azimuths, maxItems = MAX_DIAGNOSIS_ITEMS }) {
  return {
    // The DECLARED style drives the suite (T-165-01): recognition stamps program.style from the
    // conditioning pack, so the label flows from the program. The pack.style fallback keeps legacy
    // records (recognized before the stamp) honest — today style == pack id either way.
    style: program?.style ?? pack.style,
    image_list: ["  1. the CONCEPT (the target)"]
      .concat(azimuths.map((a, i) => `  ${i + 2}. your build, ${ANGLE_DESCRIPTIONS[a] ?? a}`))
      .join("\n"),
    program_block: programBlock({ program }),
    palette_block: paletteBlock({ pack }),
    style_profile: styleProfileBlock({ pack }),
    departments: DEPARTMENTS.join(", "),
    max_items: maxItems,
  };
}
