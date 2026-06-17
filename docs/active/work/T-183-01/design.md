# T-183-01 — Design

Decision: build a **committed manifest of (build, pack, concept) triples** with a loader+schema+test
under `src/workshop/` (so `npm test` covers it and guards every asset path), plus a **replay script**
that synthesizes the hard-middle builds and composes every beside-concept PNG. Generalizes
corpus-referee's single-subject 4-condition factorial into a multi-subject population. Below: the
options weighed and why this shape.

## What the manifest must record (per state)

From the AC: `build dir, pack, concept, intended faithfulness, cell type`. Plus, for usability by
S-184: `subject`, a stable `id`, the `beside` PNG path, and a `note` (the honest label rationale +
contestability call). The four **cell types** from the E-46 table, as an enum:
`match | same-pack-wrong-picture | wrong-pack-right-picture | cross | hard-middle`. `intendedFaithfulness
∈ {high, middle, low}`.

## Option A — manifest only, reuse existing builds for everything (rejected)

Point every state at an existing build dir; no new builds. Cheapest, fully GL-free.
**Rejected:** the AC requires ≥2 *partially-faithful* hard-middle states that are **genuinely
contestable**, and the value of E-46 is the controlled hard middle. The naturally-partial builds
(`new-roof` variants) are usable but they are *whole-department* defects (missing roof grammar, holey
walls) — coarser than the "one wrong material / slightly-off proportions / missing dressing" the epic
asks for. Relying only on them under-delivers the decisive cells and gives no *controlled* single-factor
mutation. Keep them as *some* of the middle, but not all.

## Option B — synthesize ALL states by mutation (rejected)

Generate every build (including matches) from a single faithful base by mutation.
**Rejected:** wasteful and lower-fidelity. The match/cross/probe cells are exactly what existing
committed builds already are; re-synthesizing them adds GL cost and risk for no signal. The decoupling
cells are *free* — same build dir, swapped pack/concept in the manifest. Only the controlled hard-middle
needs synthesis.

## Option C (chosen) — reuse for crux/cross, synthesize the controlled hard-middle

- **Crux + cross cells = manifest entries over existing committed builds**, with pack/concept swapped.
  No rebuild, no GL — `composeTwo` makes the beside-PNG from committed view PNGs. This is where the
  decoupling lives and it is constructible by construction (the referee hands `(pack, concept)`
  independently; see research).
- **Hard-middle = a mix**: (1) ≥1 **synthesized controlled mutation** of `gatehouse/faithful-covered`
  (one wrong wall material — the cleanest single-factor "one wrong material" state), rendered fresh via
  `renderViews` + `renderBesideConcept`; (2) reuse the naturally-partial `gatehouse/new-roof`
  (missing gate dressing) and `cottage/new-roof` (missing half-timber) as additional middle states.
- **A loader+schema+test** mirroring `defect-corpus.mjs`, so the manifest is validated, asset-guarded,
  and covered by `npm test`.
- **A replay script** (`corpus-build.mjs`) that: emits the synthesized mutated artifact(s)
  deterministically, renders them, composes all beside-PNGs (synthesized + reuse), and writes the
  manifest. Re-running re-derives everything (renders are evidence, not a byte-gate).

Why C: it spends GL only where there is new signal (the controlled mutation), keeps the decoupling cells
free and obviously-correct, and lands a validated+tested data artifact that S-184/S-185 re-run.

## The factorial (concrete cells)

Three subjects (gatehouse, cottage, barn); matched pack `rustic`; foreign pack `guildhall`. ~12 states:

| id | cellType | build | pack | concept | intended |
|---|---|---|---|---|---|
| `gh-match` | match | gatehouse/faithful-covered | rustic | 015 gatehouse | high |
| `ct-match` | match | cottage/roof-covering | rustic | 014 cottage | high |
| `bn-match` | match | barn/roof-covering | rustic | 017 barn | high |
| `gh-samepack-classical` | same-pack-wrong-picture | gatehouse/faithful-covered | rustic | arc-A (classical) | low |
| `gh-samepack-cottage` | same-pack-wrong-picture | gatehouse/faithful-covered | rustic | 014 cottage | low |
| `ct-samepack-gatehouse` | same-pack-wrong-picture | cottage/roof-covering | rustic | 015 gatehouse | low |
| `gh-wrongpack` | wrong-pack-right-picture | gatehouse/faithful-covered | guildhall | 015 gatehouse | high |
| `ct-wrongpack` | wrong-pack-right-picture | cottage/roof-covering | guildhall | 014 cottage | high |
| `bn-cross` | cross | barn/roof-covering | rustic | 014 cottage | low |
| `gh-mid-material` | hard-middle | gatehouse/faithful-covered-mid (synth) | rustic | 015 gatehouse | middle |
| `gh-mid-gate` | hard-middle | gatehouse/new-roof | rustic | 015 gatehouse | middle |
| `ct-mid-plain` | hard-middle | cottage/new-roof | rustic | 014 cottage | middle |

All four crux cell types present; 3 subjects; 3 hard-middle (≥2 required). The two
**same-pack/wrong-picture** flavors are deliberate: `gh-samepack-classical` is the easy cross-family
crux (matches C-control); `gh-samepack-cottage` is the **within-rustic-family** wrong-picture (same
pack, same broad style, wrong *subject/form*) — the genuinely decisive "reads the picture not the pack"
cell, since the pack agrees with the build's materials but the picture does not match its form.

## The controlled hard-middle mutation (contestability is the gate)

`gh-mid-material`: mutate `gatehouse/faithful-covered` by swapping the **dressed** stone (`stone_bricks`,
the wall.dressing role) to the **rubble field** stone (`cobblestone`, already in the rustic palette) —
i.e. lose the dressed-quoin distinction the rustic pack prizes. One material changed; near-tone grey, so
the render reads as *slightly* less crafted, not obviously broken — a contestable "missing dressing"
state. **The amplitude is the lever** (memory: surface-treatment): too-wrong a swap (e.g. crimson_planks)
is obviously-bad and fails the contestability AC. The exact swap is **confirmed by inspecting the render**
(AC #3); if the chosen swap reads obvious, pick a subtler one (e.g. roof family dark_oak→spruce) and
re-inspect. Recorded honestly either way.

## Why a separate manifest, not extend defect-corpus.json

`defect-corpus.json` is **fixed at 8 states by contract** for S-168/S-169 stability and its schema is
`single|pair` with `worstDepartment`/`wrongStyleConcept` labels — a different shape (department defects,
not pack/concept decoupling). Extending it would break the referee's existing consumers and the
"count fixed at 8" contract. A sibling `style-corpus` manifest with its own schema is the clean move and
matches how the project already versions corpora.

## Rejected: per-state recognition programs

The referee scores every condition with one **fixed synthetic program** (`PROGRAM`). The manifest does
not carry programs; S-184's harness reuses the fixed program exactly as corpus-referee does. Adding
per-state programs would be scope the gate doesn't need and a new drift surface.

## Honest-reporting hooks (anti-hedge)

The manifest carries a top-level `notes` recording: (a) which crux cells were constructible (all — the
referee decouples by handing `(pack,concept)` independently) and that the structural-confound failure is
a *production-pipeline* property, not a corpus one; (b) the single-rater limitation (intended labels are
one rater's, not human-agreement ground truth — that is S-184's job); (c) the contestability call on
each hard-middle state, made on the render. A state that inspects as obvious is **demoted out of the
hard middle** (re-typed `cross` or dropped), not relabeled to fake contestability.

## Reproducibility

`corpus-build.mjs` is the single replay entry: deterministic mutation (no model spend) + GL render of
synth states + GL-free `composeTwo` for reuse states + manifest write. Re-running re-derives the synth
artifact byte-identically and re-composes PNGs; committed renders are the evidence the gate reads.
`npm test` (the loader test) is the standing guard that every manifest asset still exists.
