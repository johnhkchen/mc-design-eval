// Textured-GLB multi-angle render seam (T-145-01, story S-145, epic E-35).
//
// THE RENDER THE FACADE PASS READS. The single concept view shows the front; the back/sides it never
// shows are read from the TEXTURED GLB for SPATIAL LAYOUT (where studs/courses/openings fall) — the
// 2026-06-14 ratified narrowing of "textures never read": layout evidence, never material identity.
//
// NO MESH-PBR RENDERER EXISTS (src/view/glb-splat.mjs:4 — the GLB is only silhouette-rasterized or
// voxel-colour-sampled). So the "textured-GLB render" is the VOXEL-COLOUR SPLAT: voxelize the GLB and
// snap its surface texture to the design palette (glbVoxelBuild), then render that colour-true artifact
// at the gate azimuths (renderViews). Honest caveat, recorded on the plan: TRELLIS bakes detail flat on
// a near-smooth mesh, so this yields LAYOUT evidence, not measurable relief depth — relief is idealized
// downstream by the brushes (S-146/S-147), never fit to the mesh.
//
// PURE plan (`texturedGlbRenderPlan`) + one IMPURE leaf (`renderTexturedGlbViews`) — the multi-angle.mjs
// pure-table / impure-render split, so the test glob stays GL- and decode-free.

import { MULTI_ANGLE_GATE } from "../config.mjs";

export const TEXTURED_GLB_METHOD = "voxel-colour-splat";
export const TEXTURED_GLB_NOTE =
  "layout evidence, not relief depth (TRELLIS bakes detail flat on a near-smooth mesh; relief is idealized by the brushes, never fit to the mesh)";

/**
 * The RECORDED render plan — the seam the runner commits beside the facade grammar. Pure; no GL, no IO.
 * Defaults to the four gate azimuths (config.MULTI_ANGLE_GATE.azimuths) so the textured-GLB read sits at
 * the SAME angles the gate judges, by construction.
 * @param {{glbPath:string, azimuths?:readonly string[], paletteSize?:number}} p
 * @returns {{glb:string, method:string, azimuths:string[], layoutOnly:true, note:string, paletteSize:number|null}}
 */
export function texturedGlbRenderPlan({ glbPath, azimuths = MULTI_ANGLE_GATE.azimuths, paletteSize = null } = {}) {
  if (!glbPath || typeof glbPath !== "string") throw new Error("texturedGlbRenderPlan: glbPath (string) is required");
  return {
    glb: glbPath,
    method: TEXTURED_GLB_METHOD,
    azimuths: [...azimuths],
    layoutOnly: true,
    note: TEXTURED_GLB_NOTE,
    paletteSize,
  };
}

/**
 * IMPURE leaf — voxelize+colour the GLB and render it at the plan's azimuths. Lazily imports the GLB
 * decode/voxel path + the renderer so the unit test glob never loads GL. Returns the plan plus a per-view
 * record (angle, path, bytes, sha256). Render absence is the CALLER's to record, never fatal here — it
 * throws and the runner catches (the recognize.mjs renderEvidence precedent: GL bytes never decide).
 * @param {{glbPath:string, palette:{key:string,lab:number[]}[], azimuths?:readonly string[],
 *          outDir:string, label?:(a:string)=>string, scale?:number, width?:number, height?:number}} opts
 * @returns {Promise<{plan:object, views:{angle:string, path:string, bytes:number, sha256:string}[]}>}
 */
export async function renderTexturedGlbViews({ glbPath, palette, azimuths = MULTI_ANGLE_GATE.azimuths, outDir, label, scale, width = 1024, height = 1024 }) {
  if (!outDir) throw new Error("renderTexturedGlbViews: outDir is required");
  const { readFile } = await import("node:fs/promises");
  const { createHash } = await import("node:crypto");
  const { glbVoxelBuild } = await import("../form/glb-voxel-build.mjs");
  const { renderViews } = await import("../view/multi-angle.mjs");

  const plan = texturedGlbRenderPlan({ glbPath, azimuths, paletteSize: palette?.length ?? null });
  const glb = await readFile(glbPath);
  // Colour-true artifact: the GLB texture snapped to the DESIGN palette (layout-true; the colours are
  // NEVER copied into the grammar — assertFacadeDiegetic proves materials stay diegetic).
  const { artifact } = await glbVoxelBuild(glb, { ...(scale ? { scale } : {}), ...(palette ? { palette } : {}) });
  const rendered = await renderViews(artifact, [...azimuths], {
    outDir, label: label || ((a) => `glbtex-${a}`), width, height,
  });
  const views = [];
  for (const v of rendered) {
    const buf = await readFile(v.path);
    views.push({ angle: v.angle, path: v.path, bytes: buf.length, sha256: createHash("sha256").update(buf).digest("hex") });
  }
  return { plan, views };
}
