# T-116-01 fourth-subject-milestone — Plan

Each step is independently verifiable; commits are atomic per step (Lisa serializes via file
locking). Live env (`set -a; . ./.env; set +a`) for steps 2, 3, 5, 7–9. No re-rolls anywhere:
judge verdicts commit as they land; the T-114 reply policy (`gate:rejudge`) is the only sanctioned
follow-up and only for *unparsed* replies.

## Step 0 — Preflight (no commit)

- `npm test` green (expect 1514); working tree clean apart from Lisa runtime files.
- Key-collision grep: `grep -c "barn" benchmarks/sculpture/generated-milestone.mjs` must be 0
  (else fall back to key `tithebarn`, re-grep).
- `.gitignore`: confirm `challenge/`/`generated/`/render-PNG stanzas are pattern-based for a new
  subject dir; note any needed DATA extension for step 4's commit.
- Confirm `.env` exports GEMINI_API_KEY + MODAL_ENDPOINT_URL (names only, never values).

## Step 1 — Mint the concept (commit 1)

- `node benchmarks/sculpture/provision-concept.mjs --subject "a rectangular stone tithe barn with
  a steep gabled roof and large timber wagon doors"` → `runs/017-vBuilding-<slug>/`.
- Inspect `concept.png` against S-094: single building · clean background · canonical 3/4 view ·
  ≥3 readable material zones · readable silhouette · bulky, no thin features. If it fails:
  regenerate via `--run-dir runs/017-… --attached "<constraint>"` (attempts preserved). This is
  the ONLY stage where regeneration is legal.
- Write `concept-checklist.md` (church format): per-criterion verdicts + **the inn→barn fallback
  decision with the three code-grounded reasons** (no valley rung; D2 height-class merge; jetty =
  `mass-unsupported` prune). GLB sign-off fields left "pending step 2".
- **Commit 1**: run dir (prompt, design-doc, concept, attempts, checklist).
- Verify: files committed; checklist complete except GLB row.

## Step 2 — TRELLIS GLB + smoke (commit 2)

- `node benchmarks/sculpture/trellis-glb.mjs runs/017-…/concept.png glb/barn.glb` (Modal,
  unsandboxed). On 500: thin-subject failure mode — revisit concept (step 1 rules still apply
  since nothing is registered yet).
- `node benchmarks/sculpture/glb-smoke.mjs glb/barn.glb --scale 32` → require single 26-conn
  component, sane fill. Record result + `shasum -a 256 glb/barn.glb` in `concept-checklist.md`
  (the GLB itself stays gitignored).
- **Commit 2**: checklist update (smoke sign-off + sha pin). Concept + GLB are now REGISTERED-
  IMMUTABLE in spirit; registry paths land in step 4.
- Verify: smoke output clean; checklist has every criterion signed.

## Step 3 — Material map (commit 3)

- Add the barn DATA entry to `material-map.mjs` SUBJECTS (shape copied from church's entry).
- `node benchmarks/sculpture/material-map.mjs --subject barn` → `material-map/barn.{json,raw.json}`.
- Verify: map parses, preserves near-tone-distinct materials (the runner's own check), roles cover
  ≥3 zones; `npm test` green (DATA-only edit).
- **Commit 3**: material-map.mjs entry + the two records.

## Step 4 — Register the subject (commit 4)

- `durable-skin.mjs` SUBJECTS: the full barn entry (structure §1), `policy`/`legacy` transcribed
  1:1 from `material-map/barn.json`, `zoneMapRecord: null` for now.
- `kit-extract.mjs` SUBJECTS DATA entry; `package.json` `challenge:barn` + `generated:barn`;
  any `.gitignore` DATA extension found in step 0.
- Verify: `npm test` green; `node -e 'import("./benchmarks/sculpture/durable-skin.mjs").then(m =>
  console.log(Object.keys(m.SUBJECTS)))'` lists barn; self-grep precondition re-checked.
- **Commit 4**: registration (registry entries only — the AC's zero-pipeline-code claim is this
  diff; record `git diff --stat` in progress.md).

## Step 5 — Challenge provision + untuned comparator (commit 5)

- `npm run challenge:barn`. Required outcome: `challenge/barn/base-artifact.json` exists (provision
  is the first stage). Everything after is the untuned repair-path comparator: if the chain refuses
  mid-way (church precedent), the refusal IS the comparator row; if it reaches the gate, the
  verdicts commit as judged.
- Verify: base-artifact validates (the chain asserts); note cells/manifest counts.
- **Commit 5**: challenge records (+ comparator verdicts/sheets if produced).

## Step 6 — Zone map (commit 6)

- `npm run zone:map -- --subject barn --no-render` → `zone-map/barn.{json,md}`.
- Gate: record must land `source: "concept"`. If `prior-fallback`: STOP the barn track — that is a
  named registration failure (concept zones unreadable post-registration); record it honestly in
  progress.md and proceed to steps 9–11 with the failure as the milestone result. (Checklist step 1
  exists to make this unlikely.)
- Flip `zoneMapRecord: "zone-map/barn.json"` in both durable-skin.mjs and kit-extract.mjs entries.
- **Commit 6**: zone records + the two flips. Verify `npm test` green.

## Step 7 — Kit (commit 7)

- `npm run kit:extract --subject=barn` → `kit/barn.{json,raw.json,md}`.
- Verify: kit/v1 asserts pass; `--offline` reproduces barn.json from the committed raw reply
  byte-identically (the runner's E-24 Rule 2 check); overrides reference real bands.
- **Commit 7**: kit records.

## Step 8 — THE MILESTONE: first generate-first run (commit 8)

- `npm run generated:barn` — one run: evidence → fit → generate (zero-blob + regenerate proofs) →
  skin → styledStretch → frozen gate (label `generated`) → cage evidence → instrument-diff →
  record. In-process double-run byte-equality is part of the runner.
- Then `npm run generated:barn -- --repro` (fresh-process MATCH) and `-- --offline` (re-assert).
- Verify against the pinned bar (design §0): kit presence, same-object azimuth count, gapCount;
  `instrument.diffs: []`; `zeroBlob` PASS; `subjectKeysInRunner: []`. Whatever lands, lands.
- **Commit 8**: generated records, multi-angle/barn-generated.*, gate sheets.

## Step 9 — Legacy residual closure (commit 9)

- `npm run reskin:cottage && npm run reskin:gatehouse && npm run reskin:church` — re-cut
  `component-skin/*.json` pins against current styled shas (residual 4).
- Verify each record's pins match the current styled milestone shas; `npm test` green.
- **Commit 9**: three re-cut records. (Residuals 1–3 are journal items — step 10.)

## Step 10 — Journal + epic sheet + E-12 handoff (commit 10)

- `pr/assets/generate-first.md`: barn gen-first + barn untuned-challenge columns; fourth-subject
  paragraph (first-run result vs the pinned cottage bar vs the eleven-epic arc).
- `docs/knowledge/design-learnings.md`: **Generate-first (E-29)** section (E-28's structure):
  inversion thesis · head-to-head table · fourth-subject first-run vs the cottage arc · which path
  scales, over/under-reach honest · residual ledger (R1 routed to roof-form epic; R2 declared-cell
  caveat + numbers, E-12 must read the ledger; R3 closure citations T-113/T-114; R4 re-cut shas) ·
  E-12 handoff list (sheets, kit reports, comparison table).
- **Commit 10**: docs + sheet.

## Step 11 — Close out

- Full `npm test`; final reproducibility spot: `generated:barn -- --offline` green.
- progress.md final state; review.md (changes, coverage, concerns). No frontmatter edits.

## Testing strategy

No new unit tests (data-only executable edits; live stages are suite-excluded by project rule).
Regression net = the 1514-test suite incl. the S-113 conformance sweep, green at EVERY commit.
Live acceptance = each runner's embedded proofs (checklist, smoke, byte-equality, `--repro`,
`--offline`, instrument-diff, self-grep), all landing inside committed records.

## Contingencies

- TRELLIS 500 / smoke fragmentation → iterate at step 1–2 (pre-registration only).
- Challenge chain refusal → comparator row; barn track proceeds (only base-artifact is needed).
- Zone map prior-fallback → named registration failure path (step 6).
- Judge unparsed reply → `gate:rejudge` per T-114 policy (bounded, same-prompt); never a re-roll.
- Suite red at any boundary → fix the data entry or stop and record; never patch pipeline code
  under this ticket's AC.
