// The LLM form-edit function (E-15 / S-046 / T-046-01) — the freeform block-editor behind the surgical
// revision loop's accept-gate. The model SEES a tight crop of one region R of a voxel sculpture and
// returns a BOUNDED edit: a small list of add/remove/move/swap ops, each confined to R, that fixes the
// FORM defect (a flattened S-curve, an arch that never loops) the procedural passes cannot. Small,
// structured output (no prose-wrap risk, like JudgeFacade/DiagnoseFacade): the harness pipes BAML's
// rendered prompt through claude -p (subscription) and feeds the reply to b.parse.ReviseRegion. The JS
// side (src/revise/form-edit.mjs) applies the ops under the region-lock + AJV and keeps them only if the
// form IoU improved. Voxel/Line/Box/Fill are the shared placement classes from facade.baml.

// Edit-op union — `kind` discriminates; `target` indexes the in-region placement list given in the prompt.
class EditAdd {
  kind "add"
  placement Voxel | Line | Box | Fill @description("a NEW placement; every voxel MUST lie inside the region")
}

class EditRemove {
  kind "remove"
  target int @description("index of the in-region placement to delete")
}

class EditMove {
  kind "move"
  target int @description("index of the in-region placement to translate")
  delta int[] @description("[dx, dy, dz] integer translation; the moved placement MUST stay inside the region")
}

class EditSwap {
  kind "swap"
  target int @description("index of the in-region placement to re-block")
  block string @description("the new namespaced block id, e.g. minecraft:orange_concrete")
}

class RegionEdit {
  ops (EditAdd | EditRemove | EditMove | EditSwap)[] @description("application order; a SMALL, surgical set")
}

function ReviseRegion(subject: string, defect: string, region: string, placements: string, crop: image) -> RegionEdit {
  client ClaudeStub
  prompt #"
    You are a master Minecraft sculptor making a SURGICAL FORM correction to ONE region of a 3-D voxel
    sculpture, shown in the tight crop below (a 3/4 view framed on this region only). Your job is NOT to
    rebuild the sculpture and NOT to restate it — only to emit a SMALL list of bounded edits that fix the
    FORM defect, every edit confined to this region.

    {{ crop }}

    ## Subject
    {{ subject }}

    ## The form defect to fix (and where)
    {{ defect }} — in: {{ region }}

    ## The placements currently in this region (each has an `index`; address remove/move/swap by it)
    {{ placements }}

    ## What "form" means here
    The build keeps the right palette and parts but loses LINE: a swimming curve flattens to a straight
    body, an arch never closes into a loop. Restore the SHAPE — bend a straight run into the curve it
    should follow, close a gap, taper or fan a mass — using the fewest ops that change the silhouette.

    ## Rules — read carefully
    - Every edit MUST stay inside this region. An `add` placement and the result of a `move` must have
      every voxel within the region's bounds, or it will be rejected.
    - Prefer MOVE and ADD (they change the silhouette) over SWAP (a block change does not move the form).
    - Keep the list SMALL and surgical — a handful of ops, not a rebuild. Do not remove so much that the
      region empties.
    - `add` placements use the same op shapes as the build (voxel / line / box / fill); lines must be
      axis-aligned or a uniform diagonal.

    {{ ctx.output_format }}
  "#
}
