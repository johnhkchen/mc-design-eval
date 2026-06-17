# T-176-01 — Review: source treatments, close the critique→amplitude loop, generalize to roof + openings

**Story S-176 / epic E-43 (closing).** T-175-01 built the treatment grammar and proved it with a
*hand-authored* spec. This ticket removes the hand-authoring (source from recognition + pack), closes the
*feedback→construction* loop (critique drives an amplitude bump), and generalizes the edges-from-geometry
vocabulary to roof and openings — reporting honestly where it leaks. The render is the deliverable; the
busy-vs-rich call is made; the one metered number is the reviewer's confirmation.

## What changed

| path | change |
|---|---|
| `src/recognition/treatment-source.mjs` | **new** — `sourceTreatment(program, pack)` (roles→blocks via `roleBlock`, fail-loud no-op guard) + `refineAmplitude(spec, critique)` (department+kind → capped amplitude bumps; `replace`=wrong-material noted, never amplified). Pure. |
| `src/recognition/treatment-source.test.mjs` | **new** — TS1–TS8 on the real gatehouse program + rustic pack. |
| `src/view/treatment-grammar.mjs` | **extended (additive)** — `deriveRoofEdges`, `deriveOpeningEdges`, `composeRoofTreatment` (eave-overhang + ridge cap + verge through the registry door; closure-guarded over the roof band; the verge leak recorded in the layer report). |
| `src/view/treatment-grammar.test.mjs` | **extended** — TG14–TG20 (roof derivation on a synthetic gable box, opening edges, roof composition closure-with-teeth, purity). |
| `experiments/eval-alignment/treatment-sourced-beside.mjs` | **new** — impure runner: sources → asserts match to hand-authored → composes sourced/refined/roof → renders beside concept → asserts closure. |
| `docs/active/work/T-176-01/gatehouse.sourced.treatment.json` | **new (generated)** — the sourced spec (the on-disk proof it is not hand-authored). |
| `docs/active/work/T-176-01/{sourced,refined,roof}-beside.png` | **new (generated)** — the witness renders. |
| `docs/active/work/T-176-01/{research,design,structure,plan,progress,review}.md` + `FINDINGS.md` | **new** — RDSPI artifacts. |

**No existing production schema, pack, or instrument file was modified.** The only existing source touched is
`treatment-grammar.mjs`, **additively** (new exports; existing functions and their 13 tests unchanged). Frozen
instrument (`measurements/`, pin-guard, gate vocabulary) untouched — verified by `git status`.

## Acceptance criteria

- ✅ **Treatment specs sourced (not hand-authored); the critique drives an amplitude-refinement pass.**
  `sourceTreatment` derives the gatehouse spec from the program's roles + the rustic palette, reproducing the
  hand-authored T-175-01 materials byte-for-byte (TS1; runner asserts it). `refineAmplitude` bumps quoin
  `headerDepth` and cornice `courses` from a structured critique (the loop: see thin trim → amplify →
  re-render), recorded in `changes[]`; `replace` (wrong material) is noted, not amplified (TS7).
- ✅ **The same edge vocabulary applied to roof + openings, with a witness render for each.** `deriveRoofEdges`
  + `composeRoofTreatment` lay the eave/ridge/verge band (`roof-beside.png`); `deriveOpeningEdges` names the
  reveal/head and the opening reveal rides the sourced render. **The unification leak is reported** (raking
  verge = a sloped line, arch head = a curve — neither expressible as a wall row/corner), per the AC's "report
  where".
- ⚠️ **Gatehouse re-scored (style-aware): lift vs 42 + busy-vs-rich.** The **busy-vs-rich call is made on the
  render** (FINDINGS §3): sourced hd2 is rich-not-busy; refined hd3 overshoots toward busy → the glance
  overrules to hd2 (the epic's named overshoot, observed). The **numeric lift vs 42 was NOT measured** — it is
  a live metered `DiagnoseBuild` and was not spent in this autonomous pass (documented deviation,
  `progress.md`); the direction is argued from the mechanism and named as the reviewer's one metered command.
  **This is the one AC not fully closed — flagged for human attention.**
- ✅ **`npm test` green; closure not regressed; frozen instrument untouched.** 2277/2277 (was 2262; +15). Every
  composed build asserts `recessClosureGuard.ok` (1.0000→1.0000, 0 dropped on all of sourced/refined/roof).

## Test coverage

15 new unit tests, all green, pure (no GL/LLM), fast:
- **Sourcing (TS1–TS4):** materials reproduce the hand-authored spec (TS1, load-bearing); roof edge≠field
  (TS2); no-op guard trips (TS3); schema/amplitude defaults + JSON round-trip (TS4).
- **The loop (TS5–TS8):** WALL·add bumps quoins + ensures plinth (TS5); OPENING·add ensures the opening
  (TS6); ROOF·replace noted-not-amplified (TS7); caps + purity (TS8).
- **Generalization (TG14–TG20):** roof derivation on a synthetic gable, ridge-axis x AND z (TG14–15, proves
  it's geometric not assumed-x); roof composition all-layers-place + closure ok (TG16); **closure has teeth**
  on a roof-band carve (TG17); opening edges flat vs arch (TG18–19); purity (TG20).

**Gaps (named):**
- The gatehouse renders are **not** unit tests (they need GL + the faithful build); they are evidence,
  reproduced by `node experiments/eval-alignment/treatment-sourced-beside.mjs`. The runner machine-checks
  closure (exit 2 on regression) and the sourced↔hand-authored material match (exit 3), so the invariants are
  asserted on the real subject even though the glance is human-judged.
- The **live numeric re-score is unspent** (see AC #3 above). The mechanism that would produce it is wired by
  pattern (the runner renders; `score-gatehouse-selfconcept.mjs` diagnoses), not as a new committed runner —
  a deliberate scope call to avoid unverified metered dead code (`progress.md` deviation).
- `composeRoofTreatment`'s verge is the **leaky** layer by design — it treats gable-end columns, not the
  sloped rake. Tested for placement + closure, not for rake-fidelity (which the wall vocabulary cannot
  express; that's the reported leak, not a missing test).

## Open concerns / limitations (for the human reviewer + S-176 follow-on)

1. **The numeric lift vs 42 is the one open AC.** A reviewer with metered budget should render the refined
   azimuths and run the diagnose pattern to confirm the figure. The roof being already-correct-material means
   no wrong-style cap from the roof, so the expected movement is up — but that is reasoning, not a measurement.
2. **Refined hd3 overshoots for this concept.** The loop amplified correctly (the critique said thin), but the
   glance prefers the sourced hd2. The critique→amplitude mapping is right; the *taste ceiling* for this
   subject is hd2. If the loop should stop earlier, the cap or a glance-in-the-loop is the lever — a policy
   call, not a bug.
3. **The unification leaks are real and scoped, not solved.** The raking verge needs a per-column sloped-line
   derivation; the voussoir arch head needs an arch-curve brush. Both are follow-on work; this ticket
   delivers the clean parts (eave band, ridge cap, opening reveal) + the honest map of the boundary.
4. **`refineAmplitude`'s WALL sub-routing uses a small fixed keyword set** (quoin/plinth/cornice) on the
   `missing` text to pick the wall layer. Department+kind are the typed signal; the keyword routing is the one
   coarse edge — reported in the module header, bounded to a closed set, not general NLP.

## Handoff

Open `sourced-beside.png` then `refined-beside.png` (read left concept → right) for the busy-vs-rich call, and
`roof-beside.png` for the roof-band edge treatment + the verge leak. The engines are
`src/recognition/treatment-source.mjs` (sourcing + loop, 8 tests) and the additive extensions in
`src/view/treatment-grammar.mjs` (roof/opening, 7 tests). Reproduce all renders with
`node experiments/eval-alignment/treatment-sourced-beside.mjs`. The single open item is the live numeric
re-score (AC #3) — wired by pattern, unspent, flagged. Nothing here touches the frozen instrument.
</content>
