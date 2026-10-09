# What we learned — agent onboarding

*Written 2026-10-07 at project restart. Read this before anything else in `docs/`. It is the harvest
of June 2026 (E-01 … E-55, ~55 epics in two weeks), compressed for an agent picking the work back up.
Claims are tagged **[V]** verified in the repo record or **[I]** inference; evidence paths are given so
you can check rather than trust.*

---

## 0. TL;DR

1. **The facade system worked.** Model writes a design doc → model authors the JSON geometry directly →
   headless render → model revises against the doc. Strong 3/3 judge verdicts across five unrelated
   reference buildings for ~$1.50 a run. [V] §2
2. **The 3-D path (concept image → TRELLIS mesh → voxels → build) is what stalled the project.** Every
   surface *inherited* from the mesh failed; every surface *re-authored* from a recognized program
   passed. The last seven epics were spent tuning a judge to climb a mesh-derived seed that was broken
   at birth. [V] §3
3. **Representation decides success.** Use language for materials, the model for design intent,
   parametric code for precise placement, a VLM for judging renders. Don't route a decision through a
   representation that can't carry it (colour-matching can't tell brick from cobble; a 57k-voxel cloud
   overflows any context). [V] `pipeline-philosophy.md`
4. **The new direction (Oct 2026) is different:** *take a plain, functional build (e.g. a spruce-plank
   redstone hallway) and make it beautiful, without the user supplying every input.* It is a
   **transform** task, not a generation task, and it inherits the facade lessons almost directly. §5
5. **Watch the glance, not the metric.** Whenever a number and your eye disagreed, the eye was right.
   Many epics "moved the binding constraint" while the build stayed a D-. §4

---

## 1. Where the project stands

- **Paused 2026-06-18** after T-214 (E-55). Final state of the 3-D track: the gatehouse is still a dark
  closed box with a stepped cap and no gate, next to a concept that is a simple pale-stone gatehouse.
  Evidence: `docs/active/work/T-211-01/beside-kept.png`, `docs/active/work/T-214-01/verdict.md`. [V]
- **Restarted 2026-10-07** with a new motivating problem from the owner: *Opus 5.5 is excellent at
  redstone but builds plain, boxy structures. Prototyping redstone with it is hard because everything
  looks like a spruce box. We want a workflow a model can use to make a plain build beautiful
  without the user specifying everything.*
- **Governing docs from June** (`project-direction.md`, `anti-hedge-directive.md`, `milestones.md`,
  `pipeline-philosophy.md`) still describe the old framing: an eval-first portfolio artifact climbing
  toward a "Commissioned Village". Treat them as **history plus useful principles, not orders**. The
  owner sets the new direction. Anti-hedge (state how a direction could fail, run the attack, report it)
  and "glance beats gate" are worth keeping regardless.

---

## 2. What worked: the facade system (E-03 … E-08, June 4–5)

**Task.** "The full-quality FACADE of a TEMPLE, any style, colourful." Front elevation only, faces +Z,
relief into −Z. Code: `benchmarks/temple-facade/` (`run.mjs`, `task.mjs`, `judge.mjs`). [V]

**Representation.** One JSON `DesignArtifact` (`schema/design-artifact.schema.json`): `style`,
`palette.manifest` (block IDs), and ordered `placements[]` using four primitives: `voxel`, `line`,
`box`, `fill`. Last writer wins; **there is no air op**. The model authored the geometry itself, with
no brushes and no mesh. Expansion: `src/expand.mjs`. Validation: `src/artifact.mjs`. [V]

**Winning pipeline `vRefRevise-designdoc`** (three `claude -p` calls, `run.mjs` ~L862–945): [V]
1. Reference photo + brief → **design doc** (<400 words: lore, architectural logic, a 3–5-block palette
   with dominant/supporting/accent roles and a named harmony, motifs, proportion ratios).
2. Design doc → **artifact** at high resolution (~56 wide × 48 tall, relief depth up to ~24, full-width
   crown *required*).
3. Render → model sees **reference + its own render** → re-emits the whole artifact, anchored to the doc.

**Results** (judge: BAML categorical rubric, median of 3; `baml_src/judge.baml`): [V]

| Run | What changed | Overall | Notes |
|---|---|---|---|
| 001 | v0, plain prompt | 4.0 on old v1 numeric rubric | garish colour |
| 006 | lifted the size/relief caps | 3.0 → 4.0 | the model had been sitting exactly on the cap |
| 013 | reference = craft, brief = colour | competent | colour fixed; freestanding columns detached |
| **014** | + "a facade is ONE connected plane, no large flat fields" | **strong (3/3)** | hero: `pr/assets/frames/spine-r4-hero-oneplane-014.png` |
| 015 | same config | strong, all four dimensions strong | |
| 019 / 021 / 022 | off-domain refs (Hōryū-ji, Arc de Triomphe, mausoleum) | strong | generalizes |
| 020 | Sainte-Chapelle | competent | 2nd pass regressed |

26 runs in about two days at ~$0.76–2.18 each. Artifacts, design docs and prompts for every run are in
`benchmarks/temple-facade/runs/` (reference photos and raw transcripts are kept local only; the repo is
public). Principles P1–P15 are at the top of `docs/knowledge/design-learnings.md`.

### The rules it taught (all transfer to "beautify a plain build")

| Rule | Why | Evidence |
|---|---|---|
| **Raise the bar, never cap** | The model lands exactly on whatever limit it's given (relief "4–6" → every build at 4–6). Before calling something a ceiling, check it isn't a prompt limit. | P1, P7; runs 006 vs 004 |
| **Colour needs a reason, not permission** | "Be colourful" → garish. A dominant/supporting/accent scheme with a named harmony → strong. | P2; run 003 |
| **Design doc first; anchor every revision to it** | A bare "improve it" drifts toward bland white/blue/gold. A doc-anchored revision keeps the identity. | P3, P4 |
| **Say which input owns which axis** | A white Taj reference silently overrode "colourful". "Reference = craft, brief = colour" fixed it on 4 of 4 pale refs. | P12; runs 010→013 |
| **Translate dimensionality explicitly** | Freestanding minarets copied literally became floating pillars. One clause ("one connected plane") turned the revision from net-negative to net-positive. | P13; 013→014 |
| **A second pass is a coin-flip unless fenced** | It helped 014/019/021/022 and hurt 013/017/020. Judge round-0 *and* the revision and keep the better one. That was never automated. | P14 |
| **One pass can't push every dimension** | A "detail push" crashed colour (4→2.67, near-monochrome micro-texture) and cost depth. Push dimensions in separate, fenced passes. | P9; run 007 |
| **Detail is whack-a-mole** | Naming a flat field fills it, and the blankness moves to the largest unnamed surface. Needs a whole-surface ornament pass (never built). | P15 |
| **State every enforced rule in the prompt** | Rules the model can't infer from schema + prompt burn the retry budget. Teach them or have the compiler absorb them. | P11; memory `same-prompt-seam-handle-dont-reject` |
| **Recess by exclusion** | No air op + last-writer-wins means a niche placed behind a solid fill is buried. Build the mass *minus* the cavity; frames stand proud by +1. | `runs/009-vRef-designdoc/_gen.mjs` |
| **Output failures were narration, not truncation** | The model wrapped its JSON in prose. Forbid preamble; keep brace-slice + retry as backstops. | P10; `src/sdk-binding.mjs` |

**Limits it had.** It's literally a face (flat back). Curves come out stepped. `detail` never reached a
reliable "strong". The judge couldn't rank within the strong band; best-of-4 cost 7× for no gain. [V]

---

## 3. What stalled: the 3-D path (E-09 … E-55)

**Why it started.** Text → JSON nailed palette and parts on organic sculptures (moai, koi) but lost
continuous form. Image → 3-D (TRELLIS on Modal) → voxelize was a real form win *for sculptures*
(+0.238 mean IoU on 7 of 7 subjects, E-16/17). It was then carried over to buildings unchecked. [V]

**Why it failed on buildings, ranked:**
1. **The mesh was used as substrate, so the build inherited its errors.** [V] TRELLIS surfaces are
   stair-stepped (facet normals read 45° roofs as flat: `trellis-facet-normals-lie`). Double skins
   voxelize hollow. Spikes enter at voxelization. Plans come out ragged, with phantom openings (barn:
   96 holes). Architectural detail (arches, ridges, slit windows) is gone before voxelization starts.
   Thin subjects return HTTP 500. Each fix moved the problem one stage downstream.
2. **Reconstruction was the wrong frame.** Resemblance comes from *recognizing* forms and substituting
   canonical ones ("that lump is a gable"), not from measuring them. A no-regress check against the
   mesh actually *forbade* straightening a wall, because that lowered IoU against the noise.
   Recognition + pattern-book construction (E-31) gave the first composite pass: the barn, same-object
   at all 4 views, on the *untuned seed*. [V] `design-learnings.md` E-34 table
3. **Construction-model bugs** (downstream, not ceilings): the roof was a solid prism dropped on a box,
   a single-box builder couldn't represent a 2-mass cottage, `gableRole` was declared but never used.
   Building walls from the program closed them (barn closure 0.701 → 1.000). [V]
4. **The ruler problem (E-38 … E-55)** became its own 17-epic quest: VLM votes swing 0–76 on the same
   render, the median discarded the strong minority vote, the score read the style pack not the
   picture. **But there was nothing to rank.** Every build was the same D- (E-38), so no ruler could
   have shown progress. "The gate is the build, not the measure" (E-42). [V/I]
5. **Process amplifiers:** four parallel build chains (a fix landed in the wrong one), a pin-guard that
   froze drafts, a "GL absent" false probe that stopped loops rendering for two sessions, `npm test`
   green while the live chain was broken, seven epics on one house before a stop-line. [V]

**The final seed** that E-48…E-55 tried to climb is `benchmarks/sculpture/generated/gatehouse/artifact.json`
(`experiments/eval-alignment/picture-climb.mjs:60`), which was fitted to the mesh on June 11 and already
failed with all four views "drifted". [V]

**Would newer models change this?** [I] Better image→3-D helps but still needs recognition. Native
voxel / part-structured 3-D generation could remove the step that broke. The biggest lever is the one
that already worked: **have the model author a parametric program or the geometry directly.** The
target gatehouse is ~200 blocks; ask early "could the model just write this?"

---

## 4. Anti-patterns (each cost us real epics)

1. **Inherit from evidence.** Meshes, photos and references are *evidence* for recognition, never the
   substrate you edit. Re-author; don't fit.
2. **Patch instead of replace.** Covering a defect (fill the hole, paint one block) raised the score by
   *concealment*. Replacing a noisy component with a cleanly constructed one is what actually climbed.
3. **Freeze creation with measurement discipline.** Creation is iterative and free; measurement is
   frozen and singular. Merging the two cost ~25 commits and moved the glance zero (`defreeze-creation-loop`).
4. **Build the ruler before there's anything to rank.** You need a quality-*varied* set first.
5. **Gate per move on one scalar from a high-variance judge.** Votes of 8/0/48 on one move. Use
   trimmed means, compare candidates pairwise, keep the better one.
6. **Gates whose orderings contradict** (form-before-detail vs. "no new major defect" rolled back the
   correct move, T-214).
7. **Treat a moving "binding constraint" as progress.** Roof → measure → form gate, while the glance
   stayed D-.
8. **Green tests as delivery.** Run the actual chain and *look at the render* every loop
   (`src/view/render-beside.mjs`, `npm run render:beside`).
9. **No stop-line.** Set the stop-line in epic 1, not epic 7.
10. **Elaborate to hit a metric.** The minimal toolset scored best; adding tools made results worse.
11. **Measure the property you mean.** `closureOf` (fraction of the perimeter present) beats `coverage`
    for watertightness; a colonnade has coverage ≈ 1 and is full of holes.
12. **Colour-match materials.** Mean-colour matching collapses near-tone materials (stone brick vs.
    cobble). Material identity is *semantic*: pick by role and story (`material-identity-is-semantic`).

---

## 5. The new direction: beautify a plain build

**Problem (owner, 2026-10-07):** given a plain, functional build (spruce-plank hallway, the housing of
a redstone contraption), produce a beautiful version with human-builder-grade detail, inferring the
inputs a user would otherwise have to supply (style, palette, motifs).

**Why this is more tractable than the 3-D path** [I]: the input is already clean, rectilinear and
correct, so there's no noisy evidence to inherit. The task is *recognition + substitution + ornament*
on a known form, which is exactly what worked (facades; E-31 recognition). And it can be checked at a
glance, before vs. after.

**What carries over:**

| June lesson | Implication for beautify |
|---|---|
| Design doc first | Infer a design doc from the build + context (biome, purpose, nearby builds) *before* placing anything. That doc is how the model "fills in the inputs the user didn't give". |
| Colour needs a reason | Palette by role (dominant/supporting/accent) with a named harmony and a diegetic story ("a mine-cart station in a spruce taiga"). |
| Raise the bar, never cap | Ask for depth and layering explicitly (pillars proud by 1–2, recessed panels, ceiling beams, floor inlays). The model will under-detail to whatever bar it infers. |
| Recess by exclusion / last-writer-wins | Decoration must never overwrite a protected cell. Build *around* the function. |
| Reference owns craft, brief owns colour | If the user gives a reference image, say which axis it owns. |
| Fenced passes, keep-the-better | Structure pass (pillars, arches, beams) → material pass → detail/ornament pass, each judged against the previous result, with rollback. |
| Brushes for precise repetition | Repeating bays (every N blocks: pillar + arch + lantern) are what parametric code is good at. Let the model design the bay; let code tile it. |
| Glance beats gate | Before/after renders from the player's eye height inside the hallway, not just exterior 3/4 views. |

**New constraint the June work never faced: preserve function.** [I] Redstone builds have hard
invariants: dust and repeater lines, observer faces, piston push clearance, quasi-connectivity,
slime/honey adjacency, and blocks that conduct or block power (solid vs. transparent, so glass vs.
stone *changes behaviour*). Any beautify workflow needs a **protected-cell mask** plus a
**clearance/adjacency rule set** that decoration can't violate, and ideally a functional check. A
simulated redstone tick isn't in this repo, so that would be new work. Decorating *outside* the
functional volume (a shell around it) is the safe first scope.

**Cheapest first experiments** [I]:
1. Hand-author a plain spruce hallway artifact (~5×5×20) and ask the current model, with the facade
   prompt discipline (design doc → build → render → revise), to beautify it with no other input.
   Judge the before/after renders at a glance.
2. Same, with a marked protected volume (a redstone line along the floor), and check zero protected
   cells were touched.
3. Only after 1–2 show where it breaks: add brushes or a bay-tiling step for the failure you saw.

---

## 6. Harvestable code (works without the 3-D path)

| Area | Where | Notes |
|---|---|---|
| Headless render (no server) | `render/` (`world.mjs`, `render.mjs`, `camera.mjs`, `orbit*.mjs`) | prismarine-viewer + node gl. Postinstall patches the viewer's stairs bug (`patch-viewer-lens.mjs`; `lens-guard.mjs` throws if the patch is missing). MC 1.20.1. |
| Multi-view / beside renders | `src/view/multi-angle.mjs`, `src/view/render-beside.mjs`, `src/render-supersample.mjs` | Fail-loud GL check. |
| Artifact contract | `schema/design-artifact.schema.json`, `src/artifact.mjs`, `src/expand.mjs` | ajv; 4 primitives; block states for stairs/slabs. |
| Block vocabulary / colour | `src/form/block-vocab.json`, `src/color/*` | CIELAB tables (fine for "which block", wrong for material identity). |
| Model seam | `src/sdk-binding.mjs`, `src/config.mjs` | `claude -p` stream-json shim. `MC_MODEL_ID` / `MC_JUDGE_MODEL_ID` override builder/judge models. |
| Facade benchmark | `benchmarks/temple-facade/`, `baml_src/{facade,judge}.baml` | `npm run bench:temple-facade -- --approach vRefRevise-designdoc --ref references/<img>` |
| Brushes (construction) | `src/view/{wall-generate,wall-skin,roof-generate,arch-frame,opening-dressing,surface-relief,treatment-grammar}.mjs`, `src/form/idiom-constructs.mjs`, `src/pack/idiom-registry.mjs` | Pure code, well tested. `npm run brush:catalog`. |
| Style packs | `packs/*.json`, `src/pack/{style-pack,formation}.mjs`, `palettes/` | Material story → palette → proportions. |
| Judge robustness | `src/form/judge-reply.mjs`, `src/baml/reply-policy.mjs`, `src/workshop/climb-gate.mjs` | Malformed ≠ verdict; bounded re-asks; vote aggregators (trimmedMean won). |
| Workshop loop | `src/workshop/{loop,actions,replay}.mjs` | Ledgered, replayable revise rounds; works on any artifact. |

**Leave behind:** `src/form/glb-*`, the `*-fit.mjs` modules, `benchmarks/sculpture/` chain scripts
(`build:*`, `sketch:*`, `skin:*`, …), `src/sculptor/`, `src/revise/`. They are mesh-path code.

---

## 7. Opus 5.5 rerun of the facade benchmark (2026-10-07)

*Builder `claude-opus-5-5`, judge pinned to `claude-opus-4-8` (the June judge) so only the builder changed.*

Same prompts, same references, same harness as June. Only the builder model changed. [V]

![June vs October facades](assets/facade-june-vs-oct.png)

| Pair | June (Opus 4.8) | Oct (Opus 5.5) | Glance verdict |
|---|---|---|---|
| v0 one-shot, plain prompt | 001: 2,908 blocks, $0.76 | **028**: 2,319 blocks, 275 s, $0.78 | **Clearly better.** Coherent red/teal/gold East-Asian scheme, layered roofs, real bays, vs. June's garish, muddy front. The biggest jump, at the same cost. |
| Taj ref (`vRefRevise`) | 014: 10,013 blocks, 1,100 s, $1.64 | 027: 23,467 blocks, 881 s, $3.36 | More ambitious (capped minarets, dome, parapets, steps, arcaded plinth) but busier, with a narrower portal. More detail, not decisively better; 2× the cost. |
| Arc ref (`vRefRevise`) | 021: 12,696 blocks, 1,006 s, $2.13 | 029: 19,456 blocks, 887 s, $2.38 | **Better.** Real relief panels, an attic band, a dressed archivolt; reads more like the Arc. |

- **The judge saturated:** all three October runs scored "strong" on all five axes. The June rubric can
  no longer separate builds at this level. Use pairwise before/after comparison (and the human glance),
  not a categorical score.
- **Most important for the new direction:** the *plain one-shot* improved the most. A strong base model
  plus good prompt discipline gets most of the way without a heavy pipeline.

### Haiku 5.5 on the same benchmark (2026-10-08)

Same harness, judge still pinned to Opus 4.8. [V]

![June / Opus 5.5 / Haiku 5.5](assets/facade-haiku-55.png)

| Run | Time | Cost | Blocks | Judge (overall / detail) | Glance |
|---|---|---|---|---|---|
| 030 v0 | 165 s | **$0.019** | 2,639 | strong / competent | Competitive: coherent and colourful, cleaner than June's 001, less refined than Opus 5.5's 028 |
| 031 Taj | 542 s | **$0.061** | 2,819 | strong / competent | Behind: low, wide and sparse, thin relief. Opus built 10–23k blocks |
| 032 Arc | 412 s | **$0.058** | 2,312 | strong / competent | Weakest: a chunky gateway with crude, garish motifs |

- **Haiku 5.5 is 40–55× cheaper.** It holds up on short, simple tasks but **scales down** the long,
  reference-grounded high-res ones: it ignored "build big" and lost detail.
- The judge still says "strong" for everything; it can't separate these.
- **The plugin end-to-end test on Haiku** (`minecraft-design`, same hallway prompt): 5 min 2 s, **$0.044**, 0 function
  violations. It produced a sensible rock-cut mine identity, rougher than Opus 5.5 ($0.86): a busy mossy floor,
  leftover torches, a single round. A cheap decorator is viable for iterating; Opus for the final pass.

### Model and effort sweep: Opus / Sonnet / Haiku 5.5 (2026-10-08)

Same harness, judge pinned to Opus 4.8. [V]

![facade sweep](assets/facade-model-sweep.png)

| | Opus 5.5 | **Sonnet 5.5** | Haiku 5.5 | Haiku 5.5, `--effort max` |
|---|---|---|---|---|
| v0 one-shot | $0.78 · 4.6 min | **$0.29 · 2.8 min** | $0.02 · 2.8 min | (034 ran at default effort: harness bug, now fixed) |
| Taj reference | $3.36 · 15 min · 23k blocks | **$0.97 · 7 min · 10k** | $0.06 · 9 min · 2.8k | $0.30 · **67 min** · 1.3k · judge "competent" |
| Arc reference | $2.38 · 15 min · 19k | **$0.81 · 6 min · 5.8k** | $0.06 · 7 min · 2.3k | stopped after 36 min |
| Plugin hallway e2e | $0.86 · 2.6 min | $0.41 · 4.6 min | $0.044 · 5 min | $0.67 · 11 min · 55 turns |

![hallway sweep](assets/hallway-model-sweep.png)

- **Sonnet 5.5 is the price/quality sweet spot** for single builds: its Taj is close to Opus at about ⅓ the cost.
- **Max effort did not help Haiku on single-shot generation.** It emitted 535k output tokens over 67 minutes for a
  smaller, flatter facade. It **did** help on the agentic plugin task: two rounds, a pairwise keep, and a form
  change (a gabled roof), at near-Opus cost and 4× the time. Effort pays when the model iterates with tools, not
  when it writes one big artifact.
- **The categorical judge still can't separate the models.** Everything scores "strong" except Haiku-max's Taj.
- The `v0-facade` approach silently ignored `--effort` before this sweep; it's fixed in `run.mjs`.

### Sonnet 5.5 effort sweep on a new subject (old west saloon, 2026-10-08)

Concept builds (concept → doc → build → revise) from one shared concept image, with the judge changed to Opus 5.5:
a categorical grade per build, plus 3 blind shuffled rankings of all 8 builds (4 efforts × 2 rounds). [V]

![saloon sweep](../../benchmarks/concept-builds/saloon-effort-sweep.png)

| Effort | Cost | Time | Mean rank (r0 / r1, of 8) |
|---|---|---|---|
| low | $0.76 | 4 min | 4.0 / **3.0** |
| medium | $0.90 | 6 min | 4.0 / 3.7 |
| high | $1.12 | 8 min | 3.7 / 7.0 |
| xhigh | $2.39 | 18 min | 5.0 / 5.7 |

- **Effort isn't the lever.** xhigh cost 3× low and took 4.5× as long for no visible gain; every build got a
  "competent" grade. Use low or default effort for Sonnet on this pipeline.
- **The blind rankings disagreed wildly across shuffles** (xhigh r0 came 1st in one and 6th in another): the builds
  really are about the same quality, and no judge can rank a flat field. Judging needs clearly separated builds or
  a human glance.
- The shared concept was the old scene-style prompt. The bigger lever is probably the reference-sheet concept
  (see the concept bake-off).

### Nether temple: the reference-sheet concept + Sonnet low/medium/high + Opus high (2026-10-08)

Same pipeline and Opus 5.5 judge as the saloon sweep, but the shared concept is a **Nano Banana 2.1 builder's
reference sheet**. [V]

![nether temple sweep](../../benchmarks/concept-builds/nether-temple-sweep.png)

| Builder | Cost | Time | Mean blind rank (r0 / r1, of 8) |
|---|---|---|---|
| Sonnet low | $0.81 | 5 min | 8.0 / 4.7 |
| Sonnet medium | $1.41 | 9 min | 5.7 / 6.0 |
| Sonnet high | $1.23 | 13 min | 4.3 / **1.7** |
| Opus high | $3.89 | 17 min | 4.3 / **1.3** |

- **The concept is the biggest lever.** Every build is recognisably the concept (a stepped blackstone temple, lava
  moat, soul-fire pillars, gold, spire). In the saloon sweep they were generic boxes.
- **Effort pays only with a clear target.** On the vague saloon concept it did nothing; here Sonnet high clearly beat
  low and medium.
- **The judge separates real differences.** All 3 shuffled rankings put Opus-high r1 and Sonnet-high r1 first and
  second and Sonnet-low r0 last. The saloon scatter meant "these are equal".
- **Revise helped the high-effort runs** (r1 > r0). **Sonnet high is the value pick:** near Opus at ⅓ the cost.

### The Arc, again, with modern techniques (2026-10-08)

The same task and reference photo as runs 021/029/037/032, through two modern pipelines (Sonnet 5.5, high effort),
classic camera, classic judge (Opus 4.8). [V]

![old vs modern Arc](assets/arc-modern.png)

| Run | Pipeline | Cost | Time | Judge (overall / detail) |
|---|---|---|---|---|
| 021 | old, Opus 4.8 | $2.13 | 17 min | strong / strong |
| 029 | old, Opus 5.5 | $2.38 | 15 min | strong / strong |
| 037 | old, Sonnet 5.5 | $0.81 | 6 min | strong / competent |
| **038** | **modern harness** (`modern.mjs`): reference-sheet concept from the photo → doc reads sizes off the sheet → build *sees* the concept → matched-view critique → keep the better | $1.30 | 11.6 min | strong / strong |
| **039** | **minecraft-design plugin, agentic** (`claude -p --plugin-dir`): same concept, authored as code (mirror), rendered and compared, 2 rounds, kept the better | **$0.76** | **4.4 min** | strong / strong |

- **Both modern builds read unmistakably as the Arc de Triomphe**: a true open arch, the right proportions,
  sculpture groups on the piers, relief panels, frieze, cornice, attic. Every old-pipeline Arc was a wall with an
  arch-shaped panel and borrowed motifs.
- **What did it:** a concept that is a build spec (made from the photo), a builder that sees it or works against it,
  matched-view comparison, keep the better.
- **The plugin's agentic, code-authored path was the closest match and the cheapest and fastest.** That is the best
  evidence yet that the plugin's method is the right default.

### Gauntlet: the combined pipeline on a grocery store, the Taj Mahal and a dance hall (2026-10-08)

The combined pipeline (`benchmarks/gauntlet/run.mjs`) on Sonnet 5.5, high effort, with the three subjects run in
parallel, about 6 min and $1.24–1.39 each: [V]
1. a Nano Banana 2.1 reference sheet;
2. a spec measured off the sheet, with an exact **material map**;
3. the plugin's agentic code-authored build, two rounds, each with a matched-view self-critique;
4. an external Opus 5.5 keep-the-better pick.

![gauntlet](../../benchmarks/gauntlet/gauntlet.png)

- **The grocery store is a clear success.** Facade-led buildings now work, and the material map makes the materials match.
- **The Taj Mahal is recognisable but rough.** The dome is faceted and too small, and the walls read grey, not marble.
  **The dance hall is the weakest.** The vertical fins and stepped deco massing are missing; the agent said so itself.
- **The new limit is complex 3D form:** curved domes, setbacks, fin rhythm. Per-block authoring approximates them.
  Next: parametric shape brushes in the build library (domes from a profile, setbacks, cylinders and tapers),
  more rounds aimed at massing for complex subjects, and Opus for the hard ones.

### Shape brushes: Taj Mahal and dance hall rerun (2026-10-08)

Two Opus 5.5 subagents built shape brushes into the plugin: domes, cylinders, minarets and arches (curved), and
setbacks, gable/hip roofs, fins, parapets, cornices, false fronts and stepped gables (massing), each render-verified.
The reruns used the same concept + spec as the gauntlet. [V]

![before/after brushes](../../benchmarks/gauntlet/gauntlet-brushes.png)

| Run | Cost | Kept | Result |
|---|---|---|---|
| Taj, Sonnet high, before | $1.39 | r2 | faceted lumpy dome, odd minaret tops |
| Taj, Sonnet high, with brushes | $1.45 | r2 | a real onion dome on a drum, tiered minarets |
| Taj, Opus high, with brushes | $2.49 | **r1** (r2 got worse) | the cleanest dome and minarets |
| Dance hall, Sonnet high, before | $1.33 | r2 | decorated front, box behind |
| Dance hall, Sonnet high, with brushes | $1.10 | r2 | front ≈ same, roof closed, still a box |
| Dance hall, Opus high, with brushes | $1.95 | **r1** (r2 got worse) | tiered setback roof; the fins still don't read |

- **Brushes fix form when they are used.** Domes and minarets improved; only Opus used `setbacks`, and only it gained
  tiered massing.
- **Keep-the-better is essential**: both Opus second rounds regressed.
- **The remaining gaps are upstream in the spec**: the Taj reads grey, not marble, in every run (the material map
  over-weights the dark inlay), and the dance hall's vertical fins are lost the same way in every run. Next: a
  palette-tone check (concept vs rendered elevation, CIELAB), and naming which brush fits which concept feature.

### The dance hall mismatch: a spec that squashed the picture (2026-10-08)

The dance hall concept was solid but the builds hardly resembled it. Cause, found by measuring: the concept is drawn in
blocks at about 21 px per block, so it is about **27 wide by 30 tall**. The subject text said "22 wide, about 16 tall";
the spec followed the text ("heights are compressed to the stated 16"), and the build prompt called the spec binding.
Halving the height alone destroyed every vertical feature that makes art deco: fins, the tall window, the spire.
Nothing downstream could recover it. Rerun from the same concept (Sonnet high), `benchmarks/gauntlet/dance-hall-fidelity.png`:

| Run | Size | Cost | Result |
|---|---|---|---|
| before (`*1605*-rerun`) | 22 × 16 | $1.10 | squat box; reads as a different building |
| A: "the sheet wins" spec (`*-respec`) | 42 × 50 (pitch mismeasured, about 1.6× too big) | $1.73 | **closest look**: thin separate fins, stepped marquee crown, spire |
| B: same + block-grid tracing (`*-respec-trace`) | 27 × 30 (exact) | $1.43 | right silhouette and proportions; fins merge into 2-wide blue slabs, wing detail thin |

- **When the text and the picture disagree, the picture must win**, and nothing may squash one axis. Both rules are now in the gauntlet's spec and build prompts.
- **Models misread block pitch.** Told to count, the spec model measured 13 px per block, not 21. A traced grid (`--trace x,y,w,h,cols,rows`: box-downsample the front elevation to cols × rows, as `trace.png` plus `trace.txt`) fixes the count exactly.
- **Resolution is a design choice.** At true scale a 1-px fin is blurred by the downsample into its neighbour; the accidentally oversized build had room for detail. Next: trace at true scale for proportions, then build at an integer multiple (2×) when the detail is finer than a block, and find the elevation box automatically instead of measuring it by hand.

### Automatic tracing, and building at 2× (2026-10-08)

`benchmarks/gauntlet/sheet-trace.mjs` replaces the hand-measured box. `--trace auto[:scale]` works in two steps:
- **Find the front view:** Gemini (`gemini-3.1-pro-preview`) gives its bounding box. My pixel-only detector cut off the Taj's minarets and plinth (white on white, graph paper) and the grocery store's parapet. Asked for block counts, Gemini was off by up to 2×, so it is only trusted for the box.
- **Measure the block size:** an autocorrelation of the edges inside the box. Blocks are square, so when x and y differ by a whole multiple (the grocery's brick courses read as half-blocks) the larger wins. Results: dance hall 21.5 px (26 × 30), Taj 11 px (58 × 56), grocery 37 px (15 × 17).

Sonnet high, same concepts (`dance-hall-trace-2x.png`, `taj-trace.png`, newest row last):
- **Dance hall, traced at 2× (52 × 60), $2.20, 11 min:** truest tower yet (thin separate fins, the open-arch spire frame, the stepped gold crown). The wings are plainer than in the oversized run, and the roof terraces are shallow from 3/4.
- **Taj, traced at 1× (58 × 56), $1.50, 5 min:** **the grey-tone problem is gone.** The traced colours anchored the palette to white marble, with black only as frame lines. The proportions are right too (drum, pishtaq, slim minarets). The dome is still blocky and stubby; at this size it needs the `dome` brush's onion profile.
- **The builder used the tracing as a check without being asked:** the Taj agent counted silhouette cells it lacked against the tracing (79 → 36 between rounds). That suggests making a silhouette/colour diff against the tracing a built-in check.

Takeaways: the tracing is now the strongest lever after the concept itself. It fixes size, proportions and tone in one step, at no model cost beyond one Gemini call. Use 2× when the concept draws detail finer than a block, and when the building is small (the grocery's 15-wide tracing is too coarse at 1×).

### Right-sizing without 2× (2026-10-08)

The owner's point: 2× is not a design answer; the build must be the right size. Two arms at the true 26 × 30, Sonnet
high, both with a "thin-block" guide (detail finer than a block goes into slabs, stairs, walls, panes and trapdoors;
separate neighbours by depth). Grid in `benchmarks/gauntlet/dance-hall-true-size.png` (2× reference, A, B):

| Arm | Cost | Result |
|---|---|---|
| A: blur tracing at 26 × 30 + thin-block guide | $1.68 | right size and silhouette; the fins are heavy blue slabs; murky colours where the blur mixed cells |
| B: Nano Banana redraw at 26 × 30, traced + thin-block guide | $1.81 | **cleanest right-sized front**: crisp spire, crown, marquee, clear colour zones; the fins are still wide blue bands |

- **The redraw is the better tracing source.** An image model simplifies by design; a blur filter only averages.
- **A "sprite" prompt works far better than "redraw on a grid".** "Make a W×H pixel sprite and show it nearest-neighbour enlarged" holds the grid; "redraw on a grid of W×H blocks" drew grid lines at the target pitch and then painted half-size cells inside them (secretly 2×).
- **Grid fidelity varies by draw.** Score = how flat each cell is on the best-fitting grid (`fitGrid`). One sprite scored 7.4, but this run's three scored 27–31, so keep generating several candidates and pick by score.
- **The fins did not come back.** At 26 wide, the concept's cluster of four navy and four cream lines per side cannot be drawn in whole blocks. Every redraw merged it into one wide blue band, and the builders followed. The thin-block guide was used elsewhere (wall reeds, end rods, stair crowns) but not to rebuild the fins from panes or walls. That needs naming per feature, not a general guide.
- **The real fix is upstream: design for the size.** This concept was drawn with about 52-block detail. A concept generated at the target size from the start (the reference-sheet prompt with a block grid and a minimum feature of one block, checked by `fitGrid`) would never ask for what cannot fit.

### Designing the concept at the build size (2026-10-08)

`--native 26x30` generates the reference sheet as a block drawing at the target size (4 candidates), measures the
size each was really drawn at, and traces the pick 1:1. Grid: `benchmarks/gauntlet/dance-hall-native.png`.

- **The concepts changed in kind.** They used fewer, bolder elements (full-block fins, a big sunburst arch, a simple marquee): the right instinct for the size.
- **The image model hits the size about half the time.** Two of four came out near 24 × 28; two were about 31 × 38. The first pick used only the grid-flatness score, which searches near the target and cannot see a wrong size, so it chose a 31 × 38 concept. Fixed: measure the real size from the block pitch, prefer the closest, then break ties on flatness.
- **The builds were worse than the redraw run,** even from the correctly sized concept (24 × 27, $1.32). The crown lost its stepped cream fins and became a flat sandstone mass; the wing sunbursts shrank; the massing went boxy.
- **Why: a tracing records colour, not relief.** The redraw dance hall's character is colour (navy fins on cream), and tracing carries that. These concepts' character is relief (cream fins stepped on cream, deep reveals, a stepped crown), which is all one colour in a flat elevation. The tracing shows a uniform cream area, and the builder fills it flat.
- **Next lever:** carry depth as well as colour. Options: have the image model draw a depth or relief map of the front alongside the elevation; read the 3/4 view for depth per region; or have the spec assign a depth to every traced region. The redraw route plus thin blocks remains the best right-sized result so far.

### Side elevation + depth map (2026-10-08)

The owner's observation: almost all the effort goes into the front and very little into the sides. `views.mjs`
(`--views`) has the image model draw, from the concept, a **side elevation** sprite (depth × height) and a **depth
map** of the front (five greys: +2 forward to −2 recessed). Three candidates each are made, picked by measured size,
and traced; the depth map is quantised to numbers (`depth.txt`). The spec and the builder get both, and the builder
compares `right-elevation.png` with the side tracing each round. Grid: `benchmarks/gauntlet/dance-hall-views.png`
(concept | front | 3/4 | side, then the drawn side view; each pair is without views, then with).

- **The drawings are usable.** The side views match the concept's 3/4 (piers, tall windows, the stepped top at the front, the marquee's profile). The side came out deeper than the 0.9 × width guess, so the side drawing sets the depth. The depth maps read correctly: fins +2, windows −1/−2, marquee +2, doors deep.
- **The sides gained real structure.** Both builds' side walls now have the drawn rhythm and roof profile. With the redraw concept, the side shows the tower rising at the front and the terraces stepping down the side, which matches the concept's 3/4 far better than the plain wall before.
- **Depth came back partly.** Concept #2's crown regained vertical fins and steps from the depth map (+2 cells), where before it was a flat mass.
- **Copying cell for cell exposes the drawing's noise.** The side sprites are low-fidelity designs; traced literally, they give blotchy window patterns. Better: take the side's silhouette, storey lines and bay rhythm from it, and keep the craft (window frames, piers) to the builder.
- **The fronts did not improve,** and the redraw arm's marquee got cruder. More inputs compete for attention in one agentic session. Splitting the work (front pass, then side and depth pass) may help.
- Cost unchanged: $1.66 and $1.91 for Sonnet high, plus 6 image calls.

### Two passes: front, then sides, back and roof (2026-10-08)

`--two-pass` runs two fresh builder sessions. Pass 1 builds the volume and puts all its care into the front (tracing +
depth map), with the front in its own function. Pass 2 designs the sides, back and roof from the side view's
silhouette, band lines and bay rhythm (no longer cell for cell) and must leave the front unchanged. The keep-better
pick now also sees the reference side and the build's side elevation. Grid: `benchmarks/gauntlet/two-pass.png`
(dance hall one-pass vs two-pass; grocery store pass 1 vs pass 2).

| Run | Cost | Time | Result |
|---|---|---|---|
| Dance hall, two-pass | $2.61 | 14.5 min | **best right-sized dance hall so far**: the stepped gold marquee with jewels is back, fins thinner; the side follows the drawn side (tower at the front, the roof stepping back, windows, bands) |
| Grocery store, two-pass (second subject) | $2.79 | 16 min | front faithful (awnings, sign, flower boxes, recessed door); pass 2's side had artifacts, so the judge kept pass 1 |

- **Splitting the attention works.** With the front as the only job, pass 1 rebuilt the marquee faithfully; the one-pass run with the same inputs had made it crude. Pass 2 left the front cell-identical in both runs.
- **The side view is only as good as its drawing.** The grocery's drawn side was weak (a narrow brick wall, the chimney as a strip), and pass 2 added noise. The judge catching that and keeping pass 1 is the safety net working.
- **Mirror trap found (by the grocery builder).** The front faces north, so a person on the street looks south and their left is world +x: tracing column c is world x = W−1−c. Symmetric subjects hide it; the grocery came out mirrored until the builder noticed. It is now stated in the build prompt. The shape brushes write in world coordinates too, which made pass 2 avoid them.
- About $1 more and twice the time of one pass; worth it for fidelity, a cost to weigh for drafts.

### A detail phase, with a vocabulary Haiku chose (2026-10-09)

The owner's points: detailing (stairs vs slab vs mixed) is too early for the form passes; Haiku 5.5 may detail well
given constraints and a vocabulary that calls scripts; work in rows, columns and faces; let Haiku write light
code-like instructions, see what notation it prefers, then have a stronger model write the interpreter.

What was built (plugin 328ba46):
- **`mcd features` / `mcd detail`:** named exterior features (band, wall-top, pier, field, opening, ...) and about a dozen scripted operations (cornice, cap, stairify, sill, lintel, frame, mix, stripe, project, recess, attach). They handle facing, the stairs/slab/wall form of a material (closest colour when none exists), function protection and box growth.
- **`mcd faces`:** each face as rows × columns seen from outside, one letter per block, plus a depth map.
- **Elicitation:** 9 samples (3 builds × 3, $0.14 total, `benchmarks/detail-lang/corpus/`). Haiku converged on one rule language without coordination: `FACE rows a..b cols c..d where <letter> [depth>=n] [directly above X] -> block [stairs|slab top|bottom] [out 1]`, plus parity and `mod` patterns, `keep`, `for each k` loops, and rules applied in order.
- **`mcd paint`:** an interpreter for that language, written by an Opus subagent from the corpus. 78% of Haiku's free-form rule lines run unchanged; the misses are mostly prose inside the rule block. 49 plugin tests pass.

Detail passes with Haiku 5.5 (high effort), judged by an Opus keep-better pick (`detail-baseline.png`, `detail-lang.png`):

| Arm | Dance hall | Grocery | Taj | Cost / time each |
|---|---|---|---|---|
| Feature ops (`mcd detail`) | kept detail (barely visible) | kept detail (arched heads, lintels, plinth) | - | ~$0.29, ~2 min |
| Face-map rules (`mcd paint`) | **kept input** (speckle on the wings) | **kept input** (speckled roof) | kept detail (framed wing bays) | ~$0.29, 2-5 min |

- **The phase works and is cheap,** but the visible effect is small at these sizes, and **texture mixes are the main source of noise** in both arms.
- **The high-value treatments are under-used:** relief, profiles, a real cornice. In the agentic run Haiku wrote only 9-10 rules, against 13-20 in the free elicitation.
- **Next:** give the detailer a target, not a blank brief. A stronger model (or the critique step) names 5-8 specific detail opportunities against the concept ("the parapet needs a stepped stair coping", "window bays need projecting sills"), and Haiku writes the rules for each. Make mixes opt-in, with a low ratio.

### Deterministic treatments + detail jobs (2026-10-09)

The owner's direction: the tools Haiku reaches for should be cheap to call and deterministic to run; a gradient or
wall variation needs no LLM. What Haiku reached for, across 185 rule lines: texture/variation 25, copings 19,
cornices 16, frames 15, lintels 12, patterns 10, plinths 9, sills 6. Built from that (plugin 8b231f6):
- **Material families:** clean-to-worn variants of each material, its trim material and its stairs/slab/wall forms.
- **Treatments:** `vary` (blue-noise spacing, never two variants touching, default 12%), `gradient` (ordered dither, monotonic), `weather` (wear hugging the ground and corners), `courses`, `quoins`, `cornice simple|stepped|bracketed|deep`, `coping`, `plinth`, `sills`, `lintels flat|hood|arch`, `frames`, `pilasters every n`.
- **First-class selectors:** `openings`, `wall tops`, `ground row`, `corners`, `top row`.
- **`mix` now warns on speckle.** 59 plugin tests pass.
- **On a plain brick box, 7 lines produce a dressed building** (`minecraft-design/examples/detailing/compare.png`).

Then Sonnet named 5-8 detail jobs per build and Haiku wrote rules for them ($0.44-0.62 per build;
`benchmarks/gauntlet/detail-jobs.png`). **The judge kept the undetailed build on all three.** The grocery store got
busy (pilasters across the awnings, frames over the shutters, a coursing band), the dance hall's roofline went
notched, and the Taj changed little.

- **The treatments work on plain surfaces and clutter crafted ones.** These builds had already been detailed by the form passes; the detail pass stacked a second layer of craft on the first. The demo house was plain, and there the same treatments read as skilled.
- **So the experiment the owner proposed has not been run yet:** form passes told NOT to detail (full blocks, openings, massing only), then the detail phase. That is the setup the treatments were made for.
- **Two cheap guards to add:**
  - treatments by default touch only PLAIN cells (full blocks in a uniform neighbourhood; skip cells next to existing stairs, slabs, panes or ornaments);
  - the jobs step must list what is already detailed and only propose jobs for plain surfaces, at most five.

## Why the good-looking approach is slow (from the transcripts)

Measured on 014 and 027. [V]
- **Wall-clock ≈ output tokens ÷ ~75–115 tok/s.** 014's build call: 26k tokens, 339 s.
- **Most tokens aren't the build.** 014's artifact is ~8k tokens of JSON; its build call emitted 26k.
  The rest is coordinate reasoning: every pillar, frame and recess placed so it stays symmetric,
  aligned and correctly layered. **Detail = many mutually constrained coordinates.** A rough functional
  pass (big boxes, few constraints) is fast for exactly this reason.
- **Each revision re-emits the whole artifact** rather than a diff.
- **Unplanned agentic detours:** in 014 the revise call spent 10 shell calls discovering how to render,
  wrote a generator, rendered itself, then returned prose instead of JSON. That cost ~6.5 min and $1.66
  and forced a retry. In 027 the build call did the same (15 turns, ~7 min).
- **The tell:** given tools, the model wrote *code*, not coordinates (`runs/014-…/_gen.mjs`: fill /
  delete / mirror helpers, carve by exclusion, greedy-meshed into fills).
- **Implication:** give the model a helper vocabulary (mirror, tile-a-bay, pillar, arch, frame, carve),
  revise by patch, and pre-wire the render tool. Then cost scales with design decisions, not block count.

### Next: the `/minecraft-beautify` skill (proposal, 2026-10-07)

A standalone agent skill, usable wherever an agent already has a build in context (a row of template
houses, a highway, a redstone hallway). It packages this doc's lessons as:
- **Doctrine** (`SKILL.md`): infer a brief → design doc with palette roles → protect function → fenced
  passes (structure → materials → depth → ornament → light/landscape) → render → keep the better.
- **Toolkit:** I/O adapters → canonical voxel grid; analysis (surfaces, bays, symmetry, flat-field
  census); protected-cell mask; helper vocabulary; patch-based edits; a portable renderer; cheap lints.
- **Playbooks:** per domain (interiors, house rows, roads, bridges, walls, redstone housings) plus a
  palette library.

Failure modes to test for: style collapse (everything turns cobble-and-oak), over-decoration, broken
function, too slow. Fixture set: plain hallway, template-house row, highway segment, redstone housing,
bridge, judged pairwise before/after. Open question: which I/O format the redstone session produces.

---

## 8. Pointers

- Setup: `README.md` → "Setup on a fresh clone".
- Architecture of record (June): `docs/knowledge/pipeline-philosophy.md`.
- Full journal (262 KB, chronological): `docs/knowledge/design-learnings.md`. Grep it; don't read it.
- Retro + findings: `docs/findings/2026-06-15-*.md`, `docs/active/ROADMAP.md`.
- Archived epics/tickets E-01…E-38: `docs/archive/2026-06-15-foundations-through-measurement/`.
- E-39…E-55 work dirs: `docs/active/work/T-*`.
