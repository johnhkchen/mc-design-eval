# T-101-01 styled-milestone — Research

Terminal ticket of E-26 (story S-101). The claim to close: the cottage concept's recognizable
ingredients appear in the build *because the concept shows them*, end-to-end, by one named command,
accountably. This document maps what exists; it proposes nothing.

## 1. The stages exist; the composition does not

Every stage the AC names is shipped, unit-tested, and individually runnable — but **no single
command chains them**. Today's reality:

| Stage | Pure core | Runner / npm | Composed into a chain? |
|---|---|---|---|
| Kit extraction (T-096) | `src/form/kit.mjs` | `kit-extract.mjs` / `kit:extract` | No — one-time LLM record, committed (`kit/{cottage,gatehouse}.{json,raw.json,md}`) |
| Concept zones (T-092) | `src/color/band-profile.mjs`, `src/view/zone-map.mjs` | `zone-map.mjs` / `zone:map` | Yes — inside `buildSkin` (derived live, agreement-asserted vs committed record) |
| Value-true + kit overrides (T-086/T-096) | `src/color/value-select.mjs`, `kit.mjs` | — | Yes — `buildSkin` stage 1/1b, the ONE renaming point (`subK = substitution ∘ kit.overrides`) |
| Full-shell fill + coherence + terminal gates (T-090/T-087/T-088) | `src/view/zone-fill.mjs`, `surface-coherence.mjs`, `face-resemblance.mjs` | `durable-skin.mjs` / `skin:*` | Yes — `buildSkin` stages 2–9 |
| Shell integrity (T-091, E-25) | `src/view/shell-integrity.mjs` | — | Yes — `challenge-milestone.mjs` `shellStage()` |
| Grammar placement (T-098) | `src/form/placement-grammar.mjs`, `src/view/frame-lines.mjs` | `placement-grammar.mjs` / `grammar:{cottage,gatehouse}` | **No** — separate runner over the *committed* durable-skin artifact |
| Opening dressing (T-099) | `src/view/opening-dressing.mjs` | `dress-openings.mjs` / `dress:cottage` | **No** — separate runner, same input seam |
| Kit-presence check (T-100) | `src/form/kit-presence.mjs` | `kit-presence.mjs` / `presence:cottage` | Partially — wired *beside* the judge inside `multi-angle-gate.mjs` (`overall = aggregate AND presence`) |
| Multi-angle gate (T-093) | `src/form/multi-angle-gate.mjs` | `multi-angle-gate.mjs` / `gate:multi` | Yes — spawned by `challenge-milestone.mjs` via its own CLI (frozen contract) |

The two prior "terminal" runners are the composition precedents:

- **`challenge-milestone.mjs` (E-25, T-095)** — one command per subject: `[provision (data-gated)] →
  shellStage → buildSkin → spawn gate CLI`. Deterministic stretch runs TWICE in-process, byte-compared,
  sha256s recorded; `--repro` re-proves from a fresh process; `--offline` re-asserts the committed
  record. Honest failure: a throwing stage writes `{status: "pipeline-failed", stage, error}` and
  exits 1. Zero subject constants — subjects are registry data (`SUBJECTS` in `durable-skin.mjs`).
- **`kit-presence.mjs` (T-100)** — holds the exact composed-tail recipe T-101 needs: it builds its
  positive fixture as *committed grammar artifact + `dressOpenings(occ, apertures, treatments)` +
  `applyDressing(...)`* — i.e. the pipeline order durable-skin → grammar → T-099, composed in-process
  from pure cores (`benchmarks/sculpture/kit-presence.mjs:141-148`).

So the missing piece is mechanical: a chain that inserts **grammar → dressing** between `buildSkin`
and the gate, in the challenge-milestone idiom.

## 2. How each seam actually composes (verbatim from the runners)

- **Grammar over skin** (`placement-grammar.mjs:92-161` `runGrammar`): needs the skin *record*
  (`durable-skin/<subj>.json`) for `zoneMap.bands`, `fill.policy` (SHIPPED space), and
  `valueTrue.substitution`; geometry re-read from the artifact (`artifactOccupancy` →
  `structuralZones(occ, def.zoneOpts)` → `zonesFromBands`). Gates: frame binding must exist,
  `frameRefilled === 0`, frame-in-preserve per band, binding-agrees-with-policy, then T-088 coverage
  + T-090 band evidence re-asserted on the painted output (all THROW). Output applied with
  `applyPaint`. Note: in an in-process chain, `buildSkin`'s return value carries the same fields the
  record does (challenge-milestone already consumes `r1.skin.fill.policy` etc.), so the
  record-on-disk seam is not load-bearing.
- **Dressing over grammar** (`kit-presence.mjs:117-148`): `apertures = extractApertures(occupancy of
  def.build)` — the **raw pre-seal reference build**, whose openings the concept declared (T-099's
  ref); `treatments = treatmentsFromKit(kitRec)`; `dressOpenings` is deterministic and idempotent;
  `applyDressing` merges (last-write-wins re-opens sealed panes). Throws if apertures are empty.
- **Gate + presence** (`multi-angle-gate.mjs`, post-T-100): accepts `--subject <key> --label <label>
  --artifact <rel>`; computes kit presence deterministically *before* the judge (kit verbatim,
  apertures from the reference build, same fixpoint composition as the presence runner); renders the
  4 frozen azimuths (45/135/225/315°); T-088 coverage precondition per view short-circuits the judge;
  composes `overall = aggregate AND presence`; exit 0 PASS / 1 FAIL / 2 REFUSAL; writes
  `multi-angle/<subj>-<label>.{json,md}` + contact sheet to `pr/assets/frames/multi-angle-<subj>-<label>.png`.
- **Kit-presence fixpoint** (`src/form/kit-presence.mjs`): an ingredient is present at its sites iff
  re-running the supplying op is a no-op there (grammar paints 0; per-slot dressing places 0; fill
  repaints 0 *foreign* cells — own-vocabulary sub-minRun residue is tolerated and counted). Gaps come
  back named: `missing: <block> <feature> @ <sites>`.

## 3. Subject state of the world (current, on disk)

| | cottage | gatehouse | church |
|---|---|---|---|
| Concept / GLB / material-map | ✓ / ✓ / ✓ | ✓ / ✓ / ✓ | ✓ / ✓ / ✓ |
| zone-map record (T-092) | ✓ | ✓ | **none** (`zoneMapRecord: null` — first contact by design) |
| Kit record (T-096) | ✓ (7 ingredients; smooth_sandstone band1; trapdoor/door/lantern fixtures; fence declared unidentified → species-derived) | ✓ | **none** (`kitRecord: null`) |
| durable-skin artifact | ✓ | ✓ | — (challenge provisions base at scale 48) |
| Grammar artifact (T-098) | ✓ (321 frame cells, frameRefilled 0) | ✓ (187 painted) | — |
| Dressing record (T-099) | ✓ (6/6 windows infill+shutters, 9/12 shutter sides, no door-kind opening) | — (T-098: openings bind to ∅ — gatehouse kit ships no fixture/rail entries) | — |
| Kit-presence proof (T-100) | ✓ (negative fails named; composed positive passes, 0 gaps) | — | — |
| Challenge (E-25) outcome | gated, **gate FAIL, 8 gaps** | gated, **gate FAIL, 12 gaps** | **pipeline-failed at skin**: `coverage gate FAILED on the final skin: band0 stone=0.332 < 0.5` |

Key tensions with the AC, found in the records:

1. **AC2 (both gates pass on the cottage) is empirically open.** The kit-aware half is proven (T-100
   positive). The resemblance half has never been run *on the styled build* — every committed
   multi-angle verdict (current/baseline/challenge) judged kit-less skins, and all FAIL with
   roof-form gaps at obliques (T-100 review: "cottage needs BOTH the E-26 pipeline output AND a
   roof-form fix"). Whether frame + dressed openings move the judge across "same-object, ≤2 minor
   gaps" is unknown until the styled chain runs. Honest-failure rules (E-25 Rule 6) apply if not.
2. **Church cannot reach kit extraction today.** `kit-extract.mjs` requires a committed zone-map
   record (`bandRefsFromZoneRecord`), and its `SUBJECTS` data list contains only cottage + gatehouse.
   Church additionally fails the E-25 chain *before* any styling (skin coverage gate). AC3 anticipates
   this: fail-with-named-gaps is a valid finding, but epic-done needs pass or explicit reviewer
   acceptance.
3. **Gatehouse dressing is a structural no-op** — its kit binds no opening treatments (`treatment: ∅`
   per the T-098 record), so `treatmentsFromKit` reports unfulfilled slots and presence records skips.
   The untuned path still *runs*; the result is named, not silent.
4. **Post-dressing fill residue** (T-100 open concern): 6 own-vocabulary residual fill placements on
   the composed cottage are tolerated by the checker; the dressing breaks kept runs. Flagged as an
   S-101 candidate cleanliness pass, not a gate blocker.

## 4. Reproducibility idiom (AC4's "state how")

Established across every E-24+ runner and directly reusable: (a) LLM-authored inputs (material maps,
kits) are **one-time committed records consumed read-only** — the verbatim model reply is pinned as
`kit/<subj>.raw.json`, and `kit-extract --offline` reproduces `<subj>.json` byte-identically from it;
(b) the deterministic stretch is a pure function of committed inputs, run **twice in-process**,
byte-compared, sha256s recorded; (c) `--repro` re-runs the chain in a fresh process and compares shas
(judge NOT re-run — its pin is the committed gate record, single pinned-model sample per view);
(d) `--offline` re-asserts committed records + artifact hashes with no recompute; (e) GL renders are
evidence, never decision inputs (memory: `reproducibility-excludes-gl-from-decisions`).

## 5. Evidence + docs conventions

- `pr/assets/frames/` naming: `<stage>-<subj>-{before,after}.png` (durable-, grammar-, dress-,
  challenge-) and `multi-angle-<subj>-<label>.png` for gate contact sheets. AC2 wants the contact
  sheet + a **kit report** in `pr/assets/`, beside a before/after vs the *kit-less* build (= the
  durable-skin artifact, the kit-presence negative).
- `docs/knowledge/design-learnings.md`: epic sections are `## <epic title> (E-NN) — <claim> (S-NNN,
  T-NNN-01) · <date>` appended chronologically (E-24 at line 2071, E-25 at 2164 is the tail). AC5's
  E-26 section must cover: the five-whys (color-role contract vs block recognition), recognize-don't-
  match, the fixture path, the kit-aware gate, over/under-reach, and the E-12 handoff.
- npm script conventions: per-subject scripts (`challenge:cottage`, `grammar:gatehouse`), runner
  flags `--subject/--label/--artifact/--offline/--repro`.

## 6. Constraints and assumptions surfaced

- **E-25 Rule 3 (generalization)**: the new runner may contain no subject keys/constants/branches —
  subjects come from the `SUBJECTS` registry; church's missing kit/zone-map must be handled as
  nullable registry data, not a branch on `"church"`.
- **E-24 Rule 1 (no inline/hand edits)**: every placement must come from a recorded op.
- **Frozen contracts**: gate azimuths/judge/prompt are config, reused via the gate's own CLI
  (challenge precedent — never re-implemented); the kit is immutable input at gate time.
- **Grammar requires** a concept-derived zone map (`source === "concept"`) and a kit with a
  trim-tagged cube entry — both THROW otherwise; on church both preconditions currently fail.
- **`npm test` runs no GL/LLM** — chain runners stay out of the test suite; pure cores carry tests.
- Suite is green at 1215/1215 as of T-100 (dfefcea).
