# T-165-01 — Review

**Ticket:** recognition-declares-style-and-suite-selection (Story S-165, Epic E-39). Handoff for a human
reviewer. First half of S-165: recognition declares an explicit `style`; Layer A (`DiagnoseBuild`) selects
a per-style `expected` profile by it; `rustic` and `saltcrag` are distinct registered suites. The
genuinely-different *second* style is T-165-02.

## What changed

The Layer-A diagnostic judge is now **per-style**. Recognition stamps an explicit `style` on the program
(from the conditioning pack — today style *is* the pack id, surfaced honestly, not invented). `DiagnoseBuild`
gains a `style_profile` input: a per-style **construction grammar** (roof / walls / openings) derived
deterministically from the pack — the `expected` profile the judge keys on. The same build now yields a
different expected roof/wall/opening under two styles — the within-family gradient the scalar eval lacked.

### Files modified
- `schema/building-program.schema.json` — added an **optional** `style` slug property
  (`additionalProperties` stays `false`; not in `required`, so committed records still validate).
- `src/recognition/prompt.mjs` — `baseRecognitionSchema` now strips `style` (alongside `facade`) from the
  model-facing schema, so the recognition prompt — and the **FX-R1 cottage/barn shas** — stay byte-identical
  (`style` is stamped, never model-authored).
- `src/recognition/prompt.test.mjs` — a sibling guard test asserting the strip + that the committed schema
  keeps `style` + that `schema_json` carries no style text.
- `benchmarks/sculpture/recognize.mjs` — both the live ask and the `--offline` repro paths stamp
  `program.style = pack.style` onto a **fresh** program object (spread; `parseProgramReply` freezes its
  result). New program records carry `style`.
- `src/workshop/diagnose.mjs` — new pure `styleProfileBlock({pack})`; `diagnoseRenderArgs` keys `style` on
  `program?.style ?? pack.style` (the **declared** style, with the honest pack-id fallback for legacy
  records) and emits `style_profile`.
- `src/workshop/diagnose.test.mjs` — DG5 (suites genuinely differ), DG6 (selection by declared style);
  DG2 reworded to "fallback when the program omits style".
- `baml_src/department.baml` — `DiagnoseBuild` gains the `style_profile` input + a "judge against THIS
  style's grammar — the same build is correct under one style and wrong under another" instruction. The
  frozen `Critique`/`Department` classes are untouched.
- `src/baml/bridge.mts` — `FNS.DiagnoseBuild.request` passes the new positional arg.
- `src/baml/fixtures/diagnose/{inputs.json, prompt.golden.txt}` — regenerated from the production serializer
  over the committed barn program + rustic pack; `reply.txt`/`expected.json` untouched.
- `src/baml/fixtures.test.mjs` — FX-DB1 now pins the rustic CONSTRUCTION GRAMMAR block.

### Files created
- None. The "suite registry" is the existing pack files (`packs/rustic.json`, `packs/saltcrag.json`) plus
  the derived `styleProfileBlock` — **one source of truth**, per the E-39 one-composition-point rule.

## Acceptance criteria — status

- [x] **Recognition program carries an explicit `style`; `DiagnoseBuild` selects the suite by it; no
  per-subject constants.** `recognize.mjs` stamps `program.style` from the pack; `diagnoseRenderArgs` keys
  the style label on `program.style`; `styleProfileBlock` derives the per-style profile from pack data
  (palette role families + idioms bucketed by `departmentOf`, the same single-source classifier Layer B
  routes on). DG6 proves selection flows from `program.style` (declared style beats the pack default). No
  subject names anywhere (DG5 asserts their absence).
- [x] **Fixture: same (concept, render) under `style=rustic` vs `style=saltcrag` yields different
  `expected`.** DG6 holds the same program masses + renders fixed and varies only the declared style →
  different `style` label, `style_profile`, and `palette_block`. DG5 proves the two suites' grammar
  **genuinely differs** (not reskins): rustic = spruce roof + `frame.timber`/`timber-frame` + hip/pyramid/
  dormer; saltcrag = dark-oak roof + `roof.ridge → deepslate_tiles` + `wall.finish.limewash` +
  `surface.*`, with **no** timber-frame. The escape hatch (record "reskins don't differ → T-165-02") did
  **not** fire — they differ.
- [x] **`npm test` green; frozen instrument untouched.** 2215/2215. FX-R1 byte-identical (recognition
  prompt unchanged); `workshop:replay` BYTE-IDENTICAL + `workshop:offline` clean (fused path untouched);
  transport guard TG3/TG4/TG5 green; the frozen scalar instrument carries no BAML dependency.

## Falsifiable-claim assessment (anti-hedge)

Claim: keying Layer A's `expected` on a declared `style` makes the *same build* yield *different* expected
roof/wall/opening under two styles. **It succeeds, deterministically and offline:** DG5/DG6 exhibit two
materially different grammars selected by the declared style, on a fixed build. The two named failure modes
did **not** fire — (1) recognition *can* surface a `style` (it is the pack id, surfaced honestly per the
ticket Note, not a fabricated richer signal); (2) rustic vs saltcrag are **not** near-identical reskins —
they diverge on roof material, ridge treatment, wall construction (timber-frame vs limewash+cobble+quoins),
and available idioms.

**The honest boundary (recorded, not hidden):** the *deterministic* proof is on the **input** the judge
forms `expected` from (the rendered `style_profile`/palette differ by declared style). Whether the *model's*
emitted `expected` prose then differs in practice is a live-call question; that — and whether the per-style
judge **improves a measurable score** on a clean×wrong-style fixture — is **S-166's** referee, not this
ticket. This ticket delivers the mechanism + the genuinely-different suites; S-166 proves the gradient bites.

## Test coverage & gaps

- **Covered (in `npm test`):** DG5 (suites genuinely differ — the AC2 gradient), DG6 (selection by declared
  style + pack-id fallback), DG1–DG4 (serializer content/determinism/single-source); the recognition strip
  guard (FX-R1 protection, committed schema keeps `style`); FX-DB1 (golden byte-identity + grammar block
  pinned); FX-DB2 (parse); TG3/TG5 (transport/gate isolation); FX-R1/replay/offline (frozen + fused paths
  unchanged); committed barn/cottage programs still validate; offline reproduces byte-identically.
- **Gaps / not automated:** the **live witness was not run** (`diagnose:smoke`) — spend caution, and the
  T-164-01 precedent that the smoke is evidence, not a gating test. The deterministic DG5/DG6 profile-diff
  is the AC2 witness here. A reviewer wanting the live `expected`-differs-by-style witness can run
  `npm run diagnose:smoke` (barn/rustic today; a saltcrag pass needs `--pack` support the smoke does not yet
  expose). The committed barn program record still **lacks** `style` (it predates the stamp); diagnose falls
  back to the pack id, so the golden is unchanged — re-recognizing barn would add `style` to the record (a
  metered run, deferred; not required for this ticket).

## Open concerns / for the next ticket (T-165-02)

1. **The genuinely-DIFFERENT style is T-165-02's job.** rustic and saltcrag differ enough to prove the
   mechanism, but both are rustic-*family* vernacular. S-165's "second, genuinely different style" / the
   S-166 clean×wrong-style crater is where the gradient must *measurably* bite.
2. **Suite = pack today.** The "suite" is the pack's derived grammar; if a future style needs expectations
   the pack vocabulary cannot express (a grammar the schema can't speak), *that gap is the finding* and
   routes to a generator epic (E-39's named failure mode).
3. **Style is the pack id.** If a richer style signal (sub-styles within a pack) is ever needed, the
   optional `style` field is the seam — but inventing one now was explicitly out of scope (ticket Note).

## Risk

Low. The only schema change is an optional, stripped-from-prompt field; recognition is byte-identical
(FX-R1) and reproduces offline byte-identically; the fused path and frozen instrument are untouched
(replay/offline/TG4). Reverting the diagnose golden + the `style_profile` input restores the T-164-01 Layer
A; the pure `styleProfileBlock` and the optional schema field are inert without it.
