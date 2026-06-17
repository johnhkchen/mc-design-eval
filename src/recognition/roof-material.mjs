// ROOF-MATERIAL RECONCILIATION (T-189-01, story S-189, epic E-48) — the missing "hand" the S-188
// picture-climb stalls on: roof COLOR. The gatehouse build's roof is brown timber; the concept's roof
// is grey stone. This is a recognition/material-map fidelity gap, NOT a construction defect (the covering
// roof is structurally correct — T-177-01). The fix is WHERE MATERIAL IDENTITY IS DECIDED, not a hand-paint.
//
// Two recognition artifacts disagree at the roof and were never reconciled:
//   - the building PROGRAM: roof.fieldRole resolves through the pack to a block (gatehouse: "roof.trim" →
//     dark_oak_planks, brown — the program's "darken the whole roof toward oak, as the barn does" heuristic);
//   - the MATERIAL-MAP: read straight off the concept image, roof → deepslate_tiles (grey).
// The compile path consumes only the program; the material-map's concept-true roof colour is ignored.
// This module JOINS them: when the program-resolved roof block and the material-map roof block differ by
// COARSE MATERIAL FAMILY (timber↔stone), the material-map — which read the picture — wins. Post-E-47 the
// concept image is the standard and the pack is a naming vocabulary only, so a concept-true out-of-pack
// roof block (deepslate_tiles) is a MATCH, not a `replace`.
//
// Material identity is SEMANTIC, not chromatic (the near-tone collapse lesson): the concept shows grey
// STONE vs brown TIMBER — a material-class difference the block NAME already encodes — so the family split
// is name-based, deterministic, no chroma thresholds. PURE: decision only; the runner does the disk loads
// and the rebuild.

import { roleBlock } from "./compile.mjs";
import { normalizePlacementRule, normalizeBlock } from "../form/material-map.mjs";

export const ROOF_MATERIAL_SCHEMA = "roof-material/v1";

const bare = (b) => (typeof b === "string" ? b.replace(/^minecraft:/, "") : "");

// Coarse, semantic material family from a block id. Deterministic, namespace-tolerant, no thresholds.
const TIMBER = /(^|_)(log|planks|wood|stem|hyphae)$|^(oak|spruce|birch|jungle|acacia|dark_oak|mangrove|cherry|bamboo|crimson|warped)_/;
const STONE = /(^|_)(stone|cobblestone|deepslate|andesite|diorite|granite|tuff|blackstone|basalt|calcite|bricks|tiles)$|(^|_)(stone|cobblestone|deepslate|andesite|diorite|granite|tuff|blackstone|basalt)(_|$)/;

/** Classify a block id into a coarse material family. → "timber" | "stone" | "other". PURE. */
export function roofMaterialFamily(block) {
  const id = bare(block);
  if (!id) return "other";
  if (id.startsWith("nether_brick") || id.startsWith("red_nether")) return "other"; // warm, not grey stone
  if (TIMBER.test(id)) return "timber";
  if (STONE.test(id)) return "stone";
  return "other";
}

/** The material-map's roof block — the entry whose normalized placementRule === "roof". Returns the
 *  normalized (minecraft:-namespaced) block id, or null when the map declares no roof entry. PURE. */
export function materialMapRoofBlock(materialMap) {
  const rows = materialMap?.map ?? [];
  const roof = rows.find((r) => normalizePlacementRule(r.placementRule) === "roof");
  return roof ? normalizeBlock(roof.block) : null;
}

/**
 * Reconcile the program's roof field material with the concept-read material-map. The material-map wins
 * ONLY on a genuine timber↔stone family flip; otherwise this is a no-op (corrected:false) — so it fixes the
 * gatehouse, is a no-op on matched timber subjects (cottage/barn), and degrades gracefully when there is no
 * material-map. PURE.
 * @param {{program:object, pack:object, materialMap:object, massIndex?:number}} p
 * @returns {{roofBlock:string, corrected:boolean, programBlock:string, conceptBlock:(string|null),
 *            fromFamily:string, toFamily:string, reason:string}}
 */
export function reconcileRoofMaterial({ program, pack, materialMap, massIndex = 0 }) {
  const mass = program?.masses?.[massIndex];
  const fieldRole = mass?.roof?.fieldRole;
  if (!fieldRole) throw new Error(`reconcileRoofMaterial: program mass[${massIndex}] has no roof.fieldRole`);
  const programBlock = roleBlock(pack, fieldRole);             // the ONE role→block point (compile.mjs)
  const conceptBlock = materialMapRoofBlock(materialMap);
  const fromFamily = roofMaterialFamily(programBlock);
  const toFamily = roofMaterialFamily(conceptBlock);

  const corrected = Boolean(conceptBlock)
    && fromFamily !== "other" && toFamily !== "other"
    && fromFamily !== toFamily;

  const roofBlock = corrected ? conceptBlock : programBlock;
  const reason = corrected
    ? `${fromFamily} ${bare(programBlock)} → ${toFamily} ${bare(conceptBlock)} (concept reads ${toFamily})`
    : conceptBlock
      ? `matched: program roof ${bare(programBlock)} and concept roof ${bare(conceptBlock)} are both ${fromFamily}`
      : `no material-map roof entry — program roof ${bare(programBlock)} kept`;

  return { roofBlock, corrected, programBlock, conceptBlock, fromFamily, toFamily, reason };
}
