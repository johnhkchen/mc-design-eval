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
 * The per-STYLE NAMING-VOCABULARY block — the pack's materials & idioms the Layer-A judge uses to
 * DESCRIBE what it sees, NOT the standard it grades against (T-186-01, story S-186, epic E-47 —
 * concept-image-conditioning). E-39/T-165-01 originally framed this as the pack-derived `expected`
 * GRAMMAR; the E-46 gate (T-185-01) proved that made the term PACK-DRIVEN — it scored pack-material
 * agreement, not picture resemblance. The standard is now the CONCEPT IMAGE (the prompt anchors
 * `expected` on the picture); this block supplies only the vocabulary to NAME departures. It still
 * differs per pack (different materials/idioms), so the within-pack vocabulary is real — but it is no
 * longer the thing the build "should read as". DERIVED from the pack (the single source — never a
 * hand-listed per-style or per-subject table): roof/wall/opening MATERIALS from the palette roles, and
 * the CONSTRUCTION idioms bucketed by `departmentOf`. Element vocabulary only — NO proportion, NO
 * massing, NO verdict (the Layer A contract). PURE.
 *
 * T-187-01 (story S-187, epic E-47 — voxel-vs-art tolerance): the E-46 re-gate (T-186 RE-GATE §2b)
 * showed the foreign vocabulary still LEAKED as the expected MATERIAL — the SAME gatehouse roof read
 * `add` under the rustic vocab but `replace` under the guildhall vocab (`gh-wrongpack` floored at 1),
 * because the judge treated guildhall's `roof.field → deepslate_tiles` as the standard. The header now
 * says EXPLICITLY these materials are never the expected material — picture-material wins — so a
 * faithful build in a foreign pack is not flagged wrong (the D3 anti-leak). Pairs with the VOXEL-MEDIUM
 * clause in the DiagnoseBuild prompt (department.baml) which forgives the blocky MEDIUM, not the content.
 *
 * @param {object} args
 * @param {object} args.pack  a validated style pack (palette roles + idioms + proportions)
 * @returns {string} the multi-line vocabulary block for the prompt's `style_profile` input
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
    `THE ${pack?.style ?? "?"} PACK'S NAMING VOCABULARY (materials & idioms available to DESCRIBE the build and its concept — NOT the standard; the CONCEPT IMAGE is the standard. A build that matches its concept image is correct even if its materials differ from this list. These materials are NEVER the expected material: if the build's roof / walls / openings match what the CONCEPT IMAGE shows but use materials unlike this list, that is a match, NOT a replace — do not flag it):`,
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
 * @param {object} args.program  a recognized building-program/v1 (the FORM grounding — masses + reading)
 * @param {object} args.pack  a validated style pack — supplies the NAMING VOCABULARY only (materials +
 *   idioms + style name to label departures); the CONCEPT IMAGE is the standard the build is graded
 *   against (T-186-01 / E-47 — the term reads the picture, not the pack)
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
