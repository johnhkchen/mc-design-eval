# T-188-01 — RESEARCH: wire the picture-critique as the climb gradient, discover where it stalls

Descriptive map of the machinery this ticket must *wire together* (not build): the E-47 picture-anchored
`DiagnoseBuild` critique as the workshop loop's gradient, an accept-gate, a restraint/stopping rule, and
the eyes-vs-hands inventory. Everything below already exists; the ticket composes it on the gatehouse.
No solutions here — those are `design.md`.

## 1. The gradient: the E-47 picture-anchored `DiagnoseBuild` (the "eyes")

The critique is the steering proxy. The full term, end-to-end, is captured **verbatim** in one small
function — `experiments/eval-alignment/score-gatehouse-selfconcept.mjs::diagnose()` (`:72`) — which is
the natural fork point:

```
diagnoseRenderArgs({program, pack, azimuths})            // src/workshop/diagnose.mjs:104 — serialize prompt inputs
  → bamlRender({fn:"DiagnoseBuild", args, images:{concept, renders}})   // src/baml/bridge.mjs → baml_src/department.baml:51
  → runTieredOp({tier:"strong", prompt, images})          // src/model-tier.mjs:57 — the claude -p strong-tier judge
  → bamlParse({fn:"DiagnoseBuild", text})                 // → Critique
  → {critiqueEvidence, itemStyleClass, styleFidelityScore}  // src/workshop/bakeoff-score.mjs
```

- **Inputs** (`diagnoseRenderArgs`): `program` (recognized building program — per-mass intent),
  `pack` (loaded style pack — used as a *naming vocabulary only* after T-186/T-187), `azimuths`
  (`MULTI_ANGLE_GATE.azimuths` = `["+x+z","+x-z","-x-z","-x+z"]`, the 45/135/225/315° diag views).
  The images passed to `bamlRender` are `concept` (one PNG) + `renders` (the four azimuth PNGs), all base64.
- **The prompt** (`baml_src/department.baml:51`, `DiagnoseBuild`): post-T-186/T-187 it anchors on the
  **concept image** ("THE STANDARD IS THE CONCEPT IMAGE, NOT THE VOCABULARY"), and carries the T-187
  **VOXEL MEDIUM** tolerance clause (blockiness / stair-stepping / sub-grid ornament are the medium, not
  divergence — don't tag `replace`/`major` for them). The pack is demoted to a vocabulary to *name* blocks.
- **Output** — `Critique { items: CritiqueItem[] }`, where `CritiqueItem` (`department.baml:31`) =
  `{ department ∈ {ROOF,WALL,OPENING,CHIMNEY,ROOM}, expected, present, missing,
  kind ∈ {add,replace,remove}, severity ∈ {minor,major} }`. This is the **E-39 structured critique**.
  `add` = element absent; `replace` = present but built genuinely UNLIKE the picture; `remove` = present
  but the concept doesn't show it.
- **The scalar** (`styleFidelityScore`, `bakeoff-score.mjs:187`): `score = clamp(100 − Σpenalty)`, where a
  `replace`/wrong-style item costs `PENALTY[sev]+12` and triggers a graded breadth cap
  `max(40,100−12·breadth)`; an `add`/`remove` item costs only `PENALTY[sev]` (no cap).
  `critiqueEvidence` (`:209`) bundles the qualitative crater: `{score, nItems, nMajor, departments,
  missing[], nWrongStyle, wrongStyleBreadth, gradedCap}`. **This is the toward/away signal**: a round
  moves *toward* the concept iff the score rises (or the departments/missing list shrinks).

This is the creation-loop critique, NOT the frozen instrument. The frozen instrument is the gated corpus
run in `style-agreement-run.mjs` + `measurements/` — untouched here.

## 2. The climb skeleton: `experiments/eval-alignment/autonomy-loop.mjs` (the "loop")

The E-38 agentic climb already has the exact render→eval→pick→apply→re-render shape. T-188 reuses the
shape but **swaps the gradient** and **adds two missing pieces**.

- **`evalBuild(occ, template, round)` (`:119`)** — the CURRENT gradient. It renders ONE view (`["+x+z"]`)
  via `renderViews(rebuildArtifact(occ, template), …)` and runs a **defect-dominated single-axis** quality
  eval (`worstDefect{axis,what}` + `quality 0-100`, N=3 median vote, modal axis). This is the *ad-hoc*
  judge T-188 replaces with the **structured, multi-view, picture-anchored `DiagnoseBuild`** from §1
  (four azimuths, `Critique` items, `styleFidelityScore`).
- **`agentPick(verdict, history)` (`:141`)** — a sonnet agent reads the verdict + a history of
  `{tool, qBefore→qAfter, improved}` and picks ONE tool from a 4-option `MENU` (`:112`):
  `apply_gable_roof | construct_walls | add_timber_framing | done`. It already has a weak "don't repeat a
  tool that didn't help" rule — but **no rollback** and **no convergence/restraint** beyond `done`.
- **`runSubject(key)` (`:163`)** — the loop: for `round<ROUNDS(3)`: eval → (record history) → pick → if
  `done` break → `occ = TOOLS[pick.tool](occ)`. Critically: **`occ` keeps the mutation unconditionally** —
  there is NO accept-gate. A tool that *lowers* quality still advances the build; `history.improved` only
  informs the next pick, it never rolls back. This is the gap T-188 fills.
- **`SUBJECTS.gatehouse` (`:37`)**: artifact `benchmarks/sculpture/generated/gatehouse/artifact.json`
  (verified present), concept `…/runs/015-…gatehouse…/concept.png`, `eaveY:18`, `ridgeAxis:"z"`. Writes
  per-round renders to `builds/gatehouse/autonomy/round-N/` (round-0..3 already on disk from E-38) and a
  trajectory to `results/autonomy-gatehouse.json` (already exists — the OLD defect-dominated run).

## 3. The hands: the three construction tools (the "hands" inventory baseline)

`TOOLS` (`autonomy-loop.mjs:111`), each `occ → occ`, no new ones this ticket ("no new construction hands"):

| tool | what it does | departments it can move |
|---|---|---|
| `apply_gable_roof` (`:53`) | replace roof ≤eaveY with a crisp parametric gable (`gableRecord`+`generateRoof`) | ROOF (form/presence) |
| `construct_walls` (`:89`) | rebuild the wall envelope (`constructWalls`) + skin it as construction (`wallSkin`: per-storey material, quoins, clinker, plinth, **dressed openings** via `dressOpenings`) | WALL (structure+material), some OPENING (dressing rides the skin) |
| `add_timber_framing` (`:101`) | E-35 `infillPanel` studs+plaster on the upper storey | WALL/OPENING material-contrast (half-timber) |

**No hand exists for**: CHIMNEY (no tool at all), standalone OPENING reconstruction (window/door form,
shutters, reveals — only the skin's incidental dressing touches openings), ROOM (interior), fine
trim/dressing finer than the tools' fixed amplitude, and any `replace`-material the skin doesn't cover.
The T-187 session's recorded gatehouse critique (memory 19036/next-steps) already names exactly this
spread — missing dense timber studwork (→ `add_timber_framing`, hand exists), missing shuttered window
reveals (→ partial, skin only), **missing chimney** (→ NO hand), infill color + ground-storey texture
(→ `construct_walls` skin). So the eyes-vs-hands gap is *predictable* but must be **discovered by running**,
not asserted (the ticket forbids a speculative fix list).

## 4. The two pieces T-188 adds (named by the ticket, prior art located)

### 4a. Accept-gate (keep a round only if it moves toward the concept)
No accept-gate exists in `autonomy-loop.mjs` (§2). The toward/away signal is `styleFidelityScore` (§1).
Prior no-regress patterns in the repo: the E-15 surgical-edit **no-regress cage** and the per-region
accept-gate ([[per-region-vs-whole-object-iou-diverge]], [[surface-paint-respects-run-rule]]); the
roof-climb / `rank-rounds.mjs` round-keeping. The pattern is: render → score `occ_candidate`; keep iff
`score(candidate) ≥ score(prev)` beyond a noise margin, else roll back to `prev`. **The crux** (T-187
research §2a): the picture-critique score is **noisy** (matched-build votes swing 0–76); a single sample
can mis-gate. The vote-median pattern (N samples → median, as `evalBuild` already does, and as
`score-gatehouse-selfconcept.mjs` does with `VOTES`) is the existing noise control.

### 4b. Restraint / stopping rule (converge, don't oscillate)
The named failure: **T-176's amplitude loop overshot** — `refineAmplitude` correctly bumped trim
amplitude on a "trim thin" critique, but `hd3` (amplitude 3) was **glance-overruled back to hd2**; the
loop amplified right but the taste ceiling for that subject was hd2 (T-176 review §"Open concerns" 2;
[[proportion-loop-bent-ruler]]). So a climb that always "does more" oscillates. The restraint levers
present in the codebase: `AMPLITUDE_CAPS` (`treatment-source.mjs:35`, caps the bump), the `done` action,
and the no-repeat-failed-tool rule. A stopping rule combines them: stop when no available tool raises the
score beyond noise for K rounds, or the agent picks `done`, or a round-count cap.

### 4c. The alternate hands path (T-176 critique→amplitude) — available, likely out of scope
`src/recognition/treatment-source.mjs` is the *other* critique→action machinery:
`sourceTreatment(program, pack)` (`:56`) derives a relief spec from roles; **`refineAmplitude(spec,
critique)` (`:131`)** maps `department+kind` → capped amplitude bumps (`add`+keyword → bump
quoin/plinth/cornice/roof-edge; `replace` → noted, never amplified). It already *consumes a `Critique`* —
so it is a ready-made "hand" for trim amplitude. But it operates on treatment SPECS (relief overlays via
`treatment-grammar.mjs`, rendered by `treatment-sourced-beside.mjs`), a different construction substrate
than the occupancy-mutating `TOOLS`. Whether the climb uses the 3 occ-tools, the amplitude path, or both
is a `design.md` decision; both are existing hands (no new construction).

## 5. Render seam, metering, constraints

- **Render**: `renderViews(artifact, [...MULTI_ANGLE_GATE.azimuths], {outDir,width:512,height:512})`
  (`src/view/multi-angle.mjs:77`) writes `view-<name>.png` for the four diag azimuths — exactly the
  `renders` DiagnoseBuild wants. `rebuildArtifact(occ, template)` (`shell-integrity.mjs`) turns an
  occupancy back into a renderable artifact. GL must be present — `assertGlAvailable`
  ([[render-every-loop-pattern]], [[gl-probe-nested-render-project]]); GL lives under `render/`.
- **Metering**: each round = the four renders (GL, free) + `DiagnoseBuild` strong-tier votes (LLM, paid).
  At VOTES×rounds×(maybe candidate-and-prev) this is the cost. Discipline from prior metered runs:
  **asset-guard before any spend**, a `GUARD_ONLY=1` dry probe, **no re-ask on a malformed/zero-token
  reply** ([[spend-limit-reply-failure-mode]], [[judge-reply-policy-seam]]).
- **Frozen instrument untouched**: `measurements/` is the pin-guard prefix ([[location-encodes-status]],
  [[pin-guard-is-structural]]); this loop writes only to `builds/gatehouse/…` and the work dir. The
  accept-gate is a *climb* mechanism, not a freeze — the [[defreeze-creation-loop]] caution is about not
  letting measurement discipline freeze creation; an accept-gate that rolls back a *regressing* round is
  the opposite (it lets the build climb), so it is in-bounds.
- **`npm test` green**; the loop is an `experiments/` runner (like `autonomy-loop.mjs`), **not** in
  `npm test`; any new *pure* helper (accept-gate / stopping predicate) gets unit tests.
- **Glance is the evidence**: per-round **beside-concept renders** + the picture-critique trend are the
  deliverable; the score is the steering proxy, the human glance is the judge ([[milestone-ladder]],
  [[calibrated-honesty-not-hype-or-brutality]]).

## 6. Open questions for Design (grounded, not assumed)

1. **Which hands**: the 3 occ-`TOOLS` only, or also the `refineAmplitude` amplitude path? (3 tools is the
   minimal reuse; amplitude adds a finer lever for the trim critiques the gatehouse will surface.)
2. **Gate signal granularity**: gate on the `styleFidelityScore` scalar alone, or also on
   department-coverage / `missing[]` shrink (the scalar is noisy and cap-dominated)?
3. **Votes vs cost**: how many `DiagnoseBuild` votes per round to median out the 0–76 swing without
   blowing the metered budget — and do we score BOTH candidate and prev each round (rollback needs prev's
   score under the same noise) or carry prev's prior score?
4. **Driver**: keep the sonnet `agentPick` (agent chooses the tool from the named worst department), or a
   deterministic department→tool map? (The ticket centers EYES-BUT-NO-HANDS, so the *honest* record of
   "critique named X, no tool" matters more than who picks.)
