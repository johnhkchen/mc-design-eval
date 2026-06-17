# T-186-01 — REVIEW (handoff)

**One line:** the style-distance term now reads the **picture** instead of the **pack** — the E-46
confound collapsed ~4× and term-vs-label agreement went 0.20 → **1.00** on the hard middle — but the
decomposition lands **MIXED** (picture *leads* the pack, 18 vs 12, yet one noise band short of the
PICTURE-DRIVEN bar). Honest **split → DO-NOT-PROMOTE (INCONCLUSIVE)**. `measurements/` untouched.

## What changed

**Product code (committed `87cdae6`):**
- `baml_src/department.baml` — `DiagnoseBuild` prompt re-framed: the **concept image is the sole
  standard**; the style/material blocks are a **naming vocabulary** to describe departures, not the
  target. Added the inverting instruction (matches-its-picture = correct even in the wrong pack;
  wrong-picture = wrong even in the right pack). `replace`/`add` re-keyed to build-render-vs-image.
- `src/workshop/diagnose.mjs` — `styleProfileBlock` header re-framed to NAMING VOCABULARY; doc-comments
  on `styleProfileBlock`/`diagnoseRenderArgs` updated to the new contract. **Body (role→block / idiom
  lists) unchanged** — the block still differs per pack, it just stops being the standard.
- `src/baml/fixtures/diagnose/{inputs.json, prompt.golden.txt}` — re-pinned from the **production**
  serializer/render (program/palette body byte-identical; only `style_profile` + prompt prose changed).
- `src/workshop/diagnose.test.mjs` — **DG8** tripwire (header is vocabulary, not the standard) +
  DG5/DG7 intent comments. `src/baml/fixtures.test.mjs` — FX-DB1 content regex updated.
- `baml_client/**` — regenerated (`.gitignore`d; rebuilt by `pretest`/`baml:gen`).

**Not touched (by design):** `src/workshop/bakeoff-score.mjs` (scoring arithmetic — the *standard*
moved, not the math), `style-agreement.mjs`/`style-agreement-run.mjs` (the gate — re-run only),
`critique.mjs` (fused path / `paletteBlock`), the `Critique`/`CritiqueItem` schema, the corpus, and
**all of `measurements/`**.

**Experiments output (uncommitted until this artifact commit):**
`experiments/eval-alignment/results/style-agreement.json` — the re-gate result (overwrites the T-185
run; it is an experiments artifact, not the frozen instrument).

## The re-gate result (full detail in `RE-GATE.md`)

| axis | T-185 (E-46) | **T-186 (E-47)** | bar | pass? |
|---|---|---|---|---|
| decomposition | PACK-DRIVEN (pack 45 ≫ pic 8) | **MIXED** (pic 18 ≥ pack 12) | PICTURE-DRIVEN (pic > pack+12) | ❌ short by 6 |
| hard-middle agreement | 0.20 (1/5) | **1.00 (5/5)** | ≥ 0.70 | ✅ |
| rank concordance | τ −0.14 | **τ +1** | — | ✅ |
| crux `*-wrongpack` | ct 0 | **ct 16 ↑** (gh still 1) | rise | ◑ partial |
| crux `*-samepack-*` | 61 / 27 | **1 / 1 ↓** | fall | ✅ |
| matched builds | 53 | **21** | no regress | ❌ compressed |

Two of three axes pass emphatically; the headline decomposition lands one noise band short because
**matched builds compressed** (53→21): picture-anchoring grades blocky renders against concept ART, so
even a faithful voxel build diverges in 2–3 departments and floors near ~20, shrinking the margin. The
ordering is right; the scale collapsed. **Per the AC, a split is DO-NOT-PROMOTE.**

## Test coverage

- `npm test` **green (2303)**. New: **DG8** pins the re-frame (header is vocabulary, asserts the
  standard is the concept image). FX-DB1 byte-matches the re-pinned golden; FX-DB2 + the critique
  contract test confirm the `Critique` schema is unchanged. DG1–DG7 (serializer content) still pass on
  the unchanged block bodies.
- **Gap (inherent):** no unit test proves the term is *picture-driven* — that is only testable by the
  metered re-gate (a live LLM judges renders vs art; it cannot be mocked). The re-gate ran at VOTES=6
  and is the falsifiable evidence; `RE-GATE.md` records it at full strength.

## Open concerns / successor scope (for E-47's next ticket, NOT this one)

1. **Matched-build compression is the binding residual.** A voxel-vs-art tolerance — the judge should
   not flag a blocky-but-faithful element as wrong-style — would restore matched headroom (toward the
   old ~53) and widen the effect margin past NOISE. This is the single highest-leverage successor lever
   (`RE-GATE.md` §3.1).
2. **`gh-wrongpack` stayed floored (1)** while `ct-wrongpack` recovered to 16 — the lone unrecovered
   foreign cell. Worth isolating: synthetic `GATEHOUSE_PROGRAM` grounding vs a genuine render-vs-art
   gap (`RE-GATE.md` §3.2).
3. **NOISE=12 vs a compressed scale.** With the dynamic range now ~21, a fixed ±12 noise band is a
   large fraction of the signal; the successor may need to revisit the band or the score scaling, not
   just the term.

## Promotion status

**DO-NOT-PROMOTE.** `recommendation.go = null` (INCONCLUSIVE; proxy labels are non-licensing). Nothing
staged, no `promote.mjs` invoked, `measurements/` untouched. A freeze remains gated on a clean
PICTURE-DRIVEN re-gate **and** human sign-off — neither is met. This loop is a sharp directional
positive (the term now reads the picture) that honestly falls short of the strict gate; the path
forward is the named residual, not a promotion on a split.

## Reviewer checklist

- [ ] `RE-GATE.md` — agree the split reads DO-NOT-PROMOTE (agreement passes, decomposition MIXED)?
- [ ] `department.baml` prompt — is the picture-as-standard framing strong/unambiguous enough, or does
      the lingering pack vocabulary still over-anchor (the gh-wrongpack residue)?
- [ ] Confirm `measurements/` untouched and the results JSON is the only experiments-output change.
- [ ] Successor lever #1 (voxel-vs-art tolerance) — accept as the E-47 next-ticket scope?
