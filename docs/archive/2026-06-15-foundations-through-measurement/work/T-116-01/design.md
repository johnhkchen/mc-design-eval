# T-116-01 fourth-subject-milestone — Design

## Decision 0 — Pin the bracketed targets (the ticket's guard)

T-111-01's committed record is the pin source (research §2–3). Pinned here:

**AC 2 target (first-run milestone bar):** the fourth subject's single `generated:<key>` run is
measured against **the cottage's T-111 verdict profile**: kit presence **PASS**, multi-angle
**≥2 of 4 azimuths same-object**, **gapCount ≤ 10 / budget 2**. Context bar (what generate-first
itself achieved on the cottage): 12/2 with 1 same-object azimuth. Convention: full pass is the
target; the recorded fallback is honestly named residuals with the fit errors that explain them
(E-28 Rule 4) — verdicts committed as judged, no re-rolls.

**AC 3 list (T-111 residuals, routed):**
1. *Gatehouse 4/4-drifted / per-mass membership* → **not closable under the frozen gates**; its fix
   is roof-form fitting coverage — the seam every T-115 record names. Routed: journaled as E-29's
   named under-reach + next-epic address. No instrument change (frozen).
2. *Spike-census declared-cell ledger* → **records/journal path**: the generated-path records
   already census beside declared cells; close by writing the like-for-like caveat + per-subject
   declared-cell numbers into the E-29 learnings section and the epic sheet, so E-12 reads the
   ledger, never the naive census.
3. *Church verdicts* → **already closed**: settle by T-113 (vocabulary authority; 1 iteration),
   challenge 225° REFUSAL by T-114 (decided FAIL). Routed: cite both closures in the journal.
4. *Stale `component-skin/<subj>.json` distillation pins* → **live path**: re-cut via
   `npm run reskin:{cottage,gatehouse,church}` against the current styled milestone shas (the
   "cheap, named" re-cut T-111 deferred).

## Decision 1 — The fourth subject: rectangular tithe barn (the ticket's fallback)

**Chosen:** *a rectangular tithe barn* — single rectangular mass, one steep gabled roof, ≥3 material
zones supplied by the concept design (stone walls, dark roof, large timber wagon doors + trim).

**Rejected: the L-plan coaching inn with jettied upper storey** — the pre-authorized fallback
condition holds, with code-grounded reasons (research §6):
- `component-decompose.mjs` D2 splits masses by protrusion + **height class**; two same-height
  L-wings are one height class, one 4-connected plan component ⇒ one mass.
- The `provision-fit.mjs` roof ladder has rungs gable-pair → hip-cap → flat-cap; **no valley rung
  exists**. One L-footprint mass cannot carry two perpendicular ridges, so the main roof lands on
  `flat-cap` *by construction* — the first-run milestone would measure a known-missing rung, not
  generate-first transfer.
- The jetty overhang is precisely the geometry `provision-generate`'s support check prunes
  (`mass-unsupported`) — the second test feature would be silently absent from the build.
- The milestone's question is "does the chain transfer to an unseen subject", which requires a
  subject inside the component set's expressive envelope; the barn is the cleanest such subject
  that is still new to every pipeline file.

The decision + these reasons are recorded in the run dir beside the concept checklist and in the
journal (AC 1 "decision + reason recorded").

**Key naming:** the registry key must not appear as a substring in `generated-milestone.mjs`
source (self-grep). Implement verifies `grep -c "<key>"` = 0 over the runner before registering;
candidate key `barn` (fallback `tithebarn` if the grep trips).

**Scale:** `generated: {scale: 32}` and `provision: {scale: 32}` — identical by construction
(T-115's registry-scale alignment; its concern #5 is exactly a provision/generated scale split).
32 matches the cottage anchor (the bar being compared against) and the barn's simple massing;
48 buys nothing for a single box-and-gable form.

## Decision 2 — Bootstrap order: the church precedent, verbatim

The kit→zone→build cycle (research §5) is broken the way the church broke it. Sequence:

1. `provision-concept.mjs --subject "a rectangular stone tithe barn with a steep gabled roof and
   large timber wagon doors"` → `runs/017-vBuilding-…/`. Judge against the S-094 checklist; run
   `glb-smoke` after step 2 and record the single-mass sign-off in `concept-checklist.md` (church
   format). Regenerate via `--run-dir`/`--attached` only *pre-registration* (attempts preserved).
2. `trellis-glb.mjs runs/017-…/concept.png glb/barn.glb` (MODAL_ENDPOINT_URL; seed 42 pinned) +
   `glb-smoke.mjs glb/barn.glb --scale 32` (26-conn single component).
3. `material-map.mjs --subject barn` (after adding the barn DATA entry to its SUBJECTS list) →
   `material-map/barn.{json,raw.json}`. Registry `policy`/`legacy` transcribed 1:1 from this map
   (church precedent: map roles → NAMED-space zone policy).
4. Register in `durable-skin.mjs` SUBJECTS: concept/glb/map paths, `build:
   "challenge/barn/base-artifact.json"`, `valueSelectRecord: null`, `zoneMapRecord: null` (flipped
   in step 6), `kitRecord: "kit/barn.json"` (exists after step 7), `plasterInvariant: null`,
   `frontDir "+z"`, `sideDir "+x"`, `provision/generated` scales 32. Plus the two sibling DATA
   lists (kit-extract.mjs, material-map.mjs) and package.json `challenge:barn`, `generated:barn`.
5. `npm run challenge:barn` — mints `challenge/barn/base-artifact.json` (provision stage, first;
   stage-resume keeps it even if a later stage refuses). The rest of the run is kept as the
   **untuned repair-path comparator** for the head-to-head sheet — a bonus row, not a milestone
   input; its verdicts (or its refusal) are committed as they land, E-25-style.
6. `npm run zone:map -- --subject barn --no-render` → `zone-map/barn.json`; flip registry
   `zoneMapRecord`.
7. `npm run kit:extract --subject=barn` → `kit/barn.{json,raw.json,md}`.
8. **The milestone:** `npm run generated:barn` — ONE run; then `--repro` (fresh process) and
   `--offline`. Self-grep + double-run byte-equality land in the record automatically.

**Rejected alternatives for the cycle:** relaxing `bandRefsFromZoneRecord` or making kit optional
(pipeline-code changes — violates AC 1's "registry entries only"); hand-authoring a zone-map
(violates concept-derived provenance, `source: "concept"` is asserted); running generated first
without kit (hard precondition, lines 475–478).

## Decision 3 — What "close the residuals" ships

Per the AC-3 pin above: (a) `reskin:*` ×3 re-cut commits; (b) the declared-cell ledger caveat +
numbers in journal/epic sheet; (c) closure citations for the church items; (d) the gatehouse
membership residual journaled as named under-reach. No gate code, no census code, no judge prompt
changes — the instrument stays frozen and `instrument.diffs: []` stays the receipt on any run this
ticket makes.

## Decision 4 — Journal + E-12 handoff (AC 4)

`design-learnings.md` gains **“Generate-first (E-29)”** modeled on the E-28 section structure:
- the inversion thesis (blob = evidence/target only; zero blob cells machine-checked);
- the head-to-head table — extend `pr/assets/generate-first.md` with two barn columns (gen-first,
  untuned repair comparator from step 5);
- the fourth subject's first-run result vs the eleven-epic cottage arc, against the pinned bar;
- which path scales, honest over/under-reach (roof form THE seam; judge-flap caveat; censuses won);
- the residual ledger (Decision 3) and E-12 handoff: contact sheets + gate sheets in
  `pr/assets/frames/`, kit report `kit/barn.md`, the comparison sheet.

## Risks, accepted

- **TRELLIS/concept roulette**: checklist + glb-smoke gate regeneration happens pre-registration
  only; after registration the concept/GLB are immutable even if imperfect.
- **Judge flap at the budget edge** (cottage 11↔12 precedent): one run per view, committed as
  judged; the pinned bar is profile-based, not a single brittle number — the journal names the flap.
- **Challenge chain may refuse mid-run on barn** (church precedent): acceptable — only
  base-artifact.json is a bootstrap dependency; a refusal becomes an honest comparator row.
- **Zone-map may fall back to prior** (concept unreadable): generation then paints from `policy`
  (named `bandSource.used=false`); kit-extract however *requires* concept-derived bands — if
  zone:map lands `source: "prior-fallback"`, the bootstrap stalls and the honest record is a
  named registration failure → regenerate concept pre-registration (checklist criterion "≥3
  zones readable" exists for exactly this).
- **Live cost**: 1 design-doc LLM + 1–2 Gemini images + 1 TRELLIS call + 1 material-map LLM +
  1 kit LLM + 2 judged chains (challenge, generated). All within standing per-ticket precedent
  (T-110/T-115 each ran comparable sweeps).
