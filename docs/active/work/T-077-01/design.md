# T-077-01 Design — resemblance-consolidation

Decisions grounded in Research. E-22 is a *photograph-and-judge* ticket: it applies the delivered fixed
lens + resemblance gate to the four headline builds and reports honestly. It does **not** edit form or
materials (those route back to E-21). The runner (`runResemblanceGate`) already exists and is the seam, so
most design choices are about *driving it across four subjects and aggregating*, not new measurement code.

## Decision 1 — How to add cottage + 2 sculptures

**Options**
- **(A) Extend the `SUBJECTS` table** in `benchmarks/sculpture/resemblance.mjs` with full per-subject paths,
  and let a consolidation driver iterate the table.
- (B) Leave `SUBJECTS` gatehouse-only; pass each subject's paths ad-hoc from the new driver.
- (C) A separate config file listing subjects.

**Chosen: (A).** The T-076 handoff explicitly says "add subjects to the `SUBJECTS` table." It keeps the
immutable-reference paths (Rule 1) in one auditable place next to the gate they feed. The current entry
shape derives `conceptPath = runs/<run>/concept.png` and a `committedRender` from the building dir — fine
for gatehouse but cottage/sculptures live elsewhere. So **generalize the entry**: each carries explicit
`glb`, `concept` (path relative to the sculpture root), `artifact` (absolute), and `committedRender`. `main()`
and the new driver both read these. gatehouse keeps its current resolution (back-compat).

Rejected (B): scatters immutable-reference paths across files, against Rule 1's "references are inputs in
one place." Rejected (C): a second config format for four rows is over-engineering.

## Decision 2 — Live vs offline gate run

**Chosen: live** for all four (the capability probe confirms `GL_AVAILABLE=true` and `claude` CLI present).
Rule 4 ("every claim cites a fresh render") and Rule 6 (reproduce) want real renders + real verdicts. The
gatehouse already has a committed live verdict; re-running it live keeps the set consistent. `--offline`
stays the documented fallback (GL-/model-free, committed render, placeholder verdict) if a later clean
checkout lacks GL or the model — the consolidation report records which mode produced each row.

**Cost honesty:** 4 metered judge calls (~$0.11 each ≈ $0.44) + 4 GL re-renders. Acceptable for the
terminal proof. `samples` stays 1 (T-076 open concern #3; raising it is reserved, not required here).

## Decision 3 — Where the consolidation logic lives (pure vs impure)

The runner is intentionally **not** unit-tested (pulls GL + the model). But the *aggregation* — collapsing
N per-subject verdicts into the consolidation row set, naming the residual gap (Rule 7), and deciding which
gaps route to E-21 (Rule: material drift, not the lens) — is pure data transformation and **must be
testable** in the root suite (which keeps `npm test` meaningful and GL-/model-free).

**Chosen:** add a pure `consolidateResemblance(subjectResults, opts)` to `src/form/resemblance.mjs` (the
existing pure-core home) + unit tests in `resemblance.test.mjs`. It takes the array of `{subject, row,
verdict, mode}` and returns:
```
{ schema: "resemblance-consolidation/v1",
  subjects: [ { subject, verdict, gap:{attribute,region}|null, mode,
               form:{meshIoU,conceptIoU}, material:{set,zone,meanDeltaE},
               routesToE21: <bool> } ... ],
  summary: { counts:{ "same object":n, drifted:n, "different object":n, ... },
             e21Findings: [ {subject, attribute, region, note} ] } }
```
`routesToE21` is true iff the named gap's `attribute ∈ {"palette","material zoning"}` (the material axes
from `GAP_ATTRS`) — i.e. the gate blames *materials*, not form/massing/the lens. Form/massing gaps are
reported as residual but **not** routed (E-22 doesn't edit form; a form gap is the honest verdict, owned by
the build pipeline, not E-21). This is the AC#4 routing rule, encoded once, tested.

The **impure driver** `benchmarks/sculpture/resemblance-consolidation.mjs` orchestrates: iterate SUBJECTS →
`runResemblanceGate` (live) → collect rows → `consolidateResemblance` → write `resemblance-consolidation.
{md,json}` → render the gatehouse before/after → write the E-21 findings file → copy handoff assets.

## Decision 4 — The gatehouse before/after (AC#3)

**Same artifact, two lenses** proves the static was the lens, not the build:
- **old lens:** `renderArtifact(scale64Artifact, {view, supersample:1})` → aliased static.
- **new lens:** `renderArtifact(scale64Artifact, {view})` → SSAA ×3 default, clean.

`renderArtifact`/`renderWorldToPng` already thread `supersample` through `opts` (T-075). I must confirm
`render-tool.mjs` forwards `supersample` to `renderWorldToPng`; if it only forwards `view`, the driver calls
`renderWorldToPng` directly (lower-level, already used by the render tool) with the two supersample values.
Source artifact: `building/scale-64/artifact.json` (the 57k-block proof scale, where aliasing was worst).
Outputs: `pr/assets/gatehouse-lens-before.png` + `-after.png` (+ copies in the work dir). Optionally also
report `highFreqEnergy` on both (the T-075 quantified proxy) so the before/after carries a *number* as well
as the visual — Rule 7's "quantified."

Rejected: reusing T-075's committed `before.png`/`after.png` verbatim — Rule 4 wants a fresh render for the
claim made *here*, and those live in a per-ticket work dir, not the E-12 handoff.

## Decision 5 — Report shape (AC#2) and honesty

`resemblance-consolidation.md` (human) + `.json` (machine), written to `benchmarks/sculpture/resemblance/`
(same dir as the per-subject outputs). The md:
- A **verdict table**: subject | verdict | named gap (attribute @ region) | meshIoU | conceptIoU | set |
  zone | mode | routes-to-E21. One row per subject — the triptych link beside each (the verdict a human
  inspects, Rule 2).
- The **before/after** embedded with its HF-energy numbers.
- A **re-photographing honesty paragraph** (Rule 7): for each subject, what the fixed-lens verdict is, and —
  where a prior (aliased-lens) impression exists — whether re-photographing made it read **better** (static
  cleared) or **worse** (real drift the noise hid). Both are honest results; neither is suppressed.
- The **E-21 routing list**: material-attributed gaps, explicitly marked "finding, not fixed here."

The `.json` is the `consolidateResemblance` output verbatim (the machine-readable contract for E-12 / later
analysis).

## Decision 6 — design-learnings.md section (AC#5)

Append a level-2 section **"Faithful render + resemblance gate (E-22)"** to
`docs/knowledge/design-learnings.md` (after the existing Principles / before or within the Attempt-log tail
— placed as a distilled-principle block since it changes the *measurement methodology*, not a single run).
Content: (1) the minification-aliasing root cause — clean build, broken lens (the grey static was texture
minification aliasing at scale 64, not palette speckle — `[[render-aliasing-not-material-speckle]]`); (2)
the SSAA ×3 / mipmap fix (HF energy −71.4%); (3) the reference-anchored resemblance gate (triptych +
categorical 3-way verdict + named gap) that **replaced green-metric sign-off** — proxies read perfect on
static; the gate reads the real goal; (4) **what re-photographing changed** about prior verdicts, honestly,
including any that got *worse*. This is the durable methodology learning, not a per-build score.

## Decision 7 — Scope guard (what this ticket does NOT do)

- Does **not** edit any build artifact, form, or material (Rule 3 + E-22 charter). Material gaps are routed
  to E-21 as findings, full stop.
- Does **not** change the pure scorer thresholds or the judge prompt (Rule 5 — frozen within a comparison
  set). The only pure-core addition is the *aggregation* function, which makes no measurement decisions.
- Does **not** raise `samples` (reserved for a future comparison; single sample is the T-076 baseline).
- Keeps `npm test` green: the new pure aggregator is unit-tested; the driver is verified by its live run +
  the committed outputs (the established T-076 pattern).
