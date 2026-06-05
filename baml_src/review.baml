// Diagnostic review critic as a BAML function (E-11 / S-026 / T-026-01) — the categorical-judge
// pattern (see judge.baml) applied to DIAGNOSIS: render image in, an enum-constrained LIST of
// defects out. It NAMES what is wrong and where; the JS side (src/sculptor/review.mjs) ROUTES each
// defect to the stage that should re-run. It never re-emits a build (the P14 cure). Small,
// enum-constrained output, so no prose-wrap issues — the harness pipes the rendered prompt through
// claude -p and feeds the reply to b.parse.DiagnoseFacade.

enum Defect {
  Flat                 // a flat, dead field — no relief and no material variation
  Ringing              // banding / stair-stepping where a curve should read smooth
  UnderDetailedFocal   // the focal point (entrance, centerpiece) is under-articulated
  Proportion           // bay rhythm / massing / base→middle→crown is off
}

class FacadeDefect {
  defect Defect
  where string         // free-text region the defect appears in, e.g. "the central bay"
}

class FacadeDiagnosis {
  defects FacadeDefect[]   // zero or more; an EMPTY list is the correct answer for a clean build
}

function DiagnoseFacade(brief: string, render: image) -> FacadeDiagnosis {
  client ClaudeStub
  prompt #"
    You are a rigorous, discriminating architecture critic DIAGNOSING a Minecraft facade,
    rendered head-on below. Your job is NOT to rebuild it and NOT to score it — only to name
    the specific defects you can SEE, each with the region it appears in. Judge only what the
    render shows.

    {{ render }}

    ## The brief the build was meant to satisfy
    {{ brief }}

    ## The defect vocabulary — report ONLY these, and ONLY when clearly present
    - Flat — a dead, undifferentiated field: no relief depth AND no material variation, reading
      as a blank slab where the design wants articulation.
    - Ringing — banding or stair-step artifacts on a surface that should read as a smooth curve
      (a dome, an arch, a bay) — the curve "rings" instead of flowing.
    - UnderDetailedFocal — the focal point (the entrance, the centerpiece, the element the eye
      should land on) is under-articulated relative to its importance.
    - Proportion — the bay rhythm, massing, or base→middle→crown relationship is off-balance.

    Be hard to please but PRECISE: report a defect only where it genuinely degrades the build.
    Do NOT pad the list. A well-resolved facade has FEW or ZERO defects — an empty list is the
    correct, expected answer for a clean build. Each defect must name a concrete region in
    `where`. Do not invent defects to seem thorough.

    {{ ctx.output_format }}
  "#
}
