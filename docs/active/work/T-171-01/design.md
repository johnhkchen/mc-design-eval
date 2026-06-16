# T-171-01 — Design

Decisions, with rationale grounded in Research. The ticket is a **witness/proof**, not a new material
system: reuse the existing recognition → compile → realize chain that already lowers roles→blocks; the
gap is coverage (run it for the gatehouse) + a measurement.

## Decision 1 — How to author the program: LIVE recognition (chosen)

**Options:**

- **(A) Live recognition** — `recognize.mjs --subject gatehouse --ticket T-171-01`. The model reads
  concept + sketch and authors the `building-program/v1`; the chain compiles+realizes a faithful build.
- **(B) Hand-authored program** — write `recognition/gatehouse.program.json` by hand as data, then
  `--offline`-style compile+realize to an artifact.
- **(C) Edit `roof-generate.mjs` / generate-first to consume roles** — fix the program-less path in place.

**Chosen: (A) live recognition, with (B) as a documented fallback.**

Rationale: (A) is the *canonical* pipeline path (pipeline-philosophy: "VLM recognition for the building
program"), is exactly how barn/cottage got their programs, produces a genuinely model-authored program
(so "the gatehouse HAS a recognition program" is true in the honest sense, not a faked artifact), and
**requires zero source changes** — it is pure coverage, satisfying "no per-subject constants" by
construction (the runner is subject-blind; the program is data). It also yields the byte-replay seam
(`recognize:offline`) for free. (C) is out of scope and is literally the wrong fix: E-42's thesis is
that faithfulness comes from *consuming the recognized program*, not from patching the program-less
path; (C) would also collide with S-172's roof rewrite. (B) loses the model-authored honesty and adds a
maintained data fixture, but is deterministic and cheap — kept as the fallback **iff** live recognition
refuses within budget or the metered call is unavailable (documented deviation in `progress.md`).

**Risk on (A) and the mitigation:** the model could misread the masonry and emit a timber-frame
program (`wall.infill.upper → white_terracotta`), which would NOT be cobblestone-faithful. Mitigation:
inspect the emitted program + the realized block distribution *before* claiming the win (AC #2). If the
model picks timber-frame infill, that is itself an honest, reportable result (recognition-coverage is
harder than application — the S-171 failure mode "producing a faithful program per subject is the hard
part"); I do not silently overwrite it to force cobblestone.

## Decision 2 — Where the new build's renders come from

`runLive` already renders 4 azimuths as `recognition/view-gatehouse-<azimuth>.png` (evidence). Two uses
need renders: the beside-concept PNG (AC #2) and the diagnose scorer (Decision 3).

**Chosen:** reuse the recognition run's own renders. They are the authentic output of the same artifact;
re-rendering would duplicate GL work and risk drift. The beside-PNG is produced with
`renderBesideConcept(artifact, conceptAbs, outAbs)` (`src/view/render-beside.mjs`, the judge-free S-152
path) pointed at the **new** recognition artifact — this is the cleanest "render beside concept"
(concept panel + azimuth panels, one sheet), and `assertGlAvailable()` makes a genuine GL-less host loud
(it is not). The scorer reads `recognition/view-gatehouse-<az>.png` directly (the naming carries the
subject key — the scorer accounts for it).

Rejected: routing the new artifact through `npm run render:beside -- --subject gatehouse`. That command
prefers `generated/<key>/artifact.json` else `def.build` (= the OLD concept-materials build); pointing
it at the recognition artifact would mean editing `def.build` (a per-subject constant) or adding a
`generated/gatehouse/` copy. Calling `renderBesideConcept` directly from a tiny work-dir script avoids
touching the registry.

## Decision 3 — Measuring the self-concept score

AC #2 asks for the self-concept score vs the ~2 floor; AC #3 says record honestly if still capped.

**Chosen:** a small **witness scorer** under `experiments/eval-alignment/` (NOT in `npm test`, NOT the
frozen instrument) that mirrors the corpus-referee's `diagnose()` for ONE condition — the matched
self-concept: rustic pack + gatehouse concept + the **new** program + the **new** build's renders →
`styleFidelityScore`, VOTES=2, no re-ask (a zero-token notice reply only burns budget — the established
pattern). It prints the mean score and the per-item `styleClass`/`kind` breakdown so a capped result is
*attributable* (roof-prism → S-172, or term → E-40/E-41). This is the smallest honest measurement;
reusing the corpus-referee directly is rejected because it is hardwired to the OLD `CRATER_BUILD` and the
synthetic stand-in program, and editing it would disturb the E-40 baseline.

Rationale for passing the **new** program to diagnose (not the synthetic stand-in): the diagnose prompt
embeds the program block (`diagnoseRenderArgs`); scoring the new build against a program that actually
describes it is the faithful measurement. The synthetic stand-in existed only because no real gatehouse
program did — now one does.

**Cost guard:** the scorer is a single metered op (2 votes). If the metered path is unavailable, the
materially-faithful **render** (AC #2, the glance) is the primary deliverable and the score is reported
as "not run, blocked on metered access" — honest, not fabricated.

## Decision 4 — Pack and program shape (what "faithful" means here)

The matched style is **rustic** (`MATCHED_PACK` in the referee; `DEFAULT_PACK_REL` in recognition). The
concept is a stone gatehouse: thick masonry walls, peaked gable roof, arched gate. A faithful program
therefore should carry a **stone wall role on both storeys** (`wall.field.ground` cobblestone and/or
`wall.dressing` stone_bricks; NO `timber-frame` treatment, NO `wall.infill.upper`), a `roof.gable` with
a pitch class in `[1,2]`, and an arched gate opening (`head: "arch"`, `headRole: wall.dressing`). I do
not encode this as a constant — the live model authors it from the concept; I assert it post-hoc against
the realized block distribution. Expected faithful outcome: **cobblestone-dominant walls** replacing the
35.8% polished_basalt. The roof remains spruce (rustic `roof.field`) but constructed as a gable covering,
not a 52.8% prism — the prism is generate-first-only and does not exist on the compile path.

## What success looks like (and what it is not)

- **Win:** `recognition/gatehouse.program.json` exists (model-authored, conforms or fails-recorded); the
  realized artifact's walls are cobblestone/stone (not polished_basalt); beside-concept render shows
  stone; self-concept score lifts off ~2 (any lift is reportable; a large lift is the strong claim).
- **Honest partial:** walls go stone but the score stays capped → attribute to the roof (S-172) or the
  term (E-41), with the per-item breakdown as evidence. Still a valid ticket outcome (AC #3).
- **Honest refutation:** the model emits a non-stone (timber-frame) program → recognition-coverage is
  the real wall (named, per the falsifiable claim), reported, not papered over.

## Out of scope (named, deferred)

- Roof-as-construction / killing the prism / multi-ridge → **S-172** (the compile path already avoids
  the prism, but tuning the roof is not this ticket).
- Broad program coverage across the whole roster → the volume line, not this witness (ticket Notes).
- Re-running the full E-41 crater on the faithful build → **T-173-01**.
