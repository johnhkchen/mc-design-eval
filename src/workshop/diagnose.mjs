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
import { DEPARTMENTS } from "../pack/departments.mjs";

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
 * @returns {{style:string, image_list:string, program_block:string, palette_block:string, departments:string, max_items:number}}
 */
export function diagnoseRenderArgs({ program, pack, azimuths, maxItems = MAX_DIAGNOSIS_ITEMS }) {
  return {
    style: pack.style,
    image_list: ["  1. the CONCEPT (the target)"]
      .concat(azimuths.map((a, i) => `  ${i + 2}. your build, ${ANGLE_DESCRIPTIONS[a] ?? a}`))
      .join("\n"),
    program_block: programBlock({ program }),
    palette_block: paletteBlock({ pack }),
    departments: DEPARTMENTS.join(", "),
    max_items: maxItems,
  };
}
