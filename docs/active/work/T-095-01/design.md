# T-095-01 challenge-milestone — Design

Goal: one named `npm run` per subject (cottage, gatehouse, church) running shell-integrity →
concept-derived zones → E-24 full-shell skin → multi-angle gate, end-to-end, reproducibly, with
the church entering via registry data only. Decisions below are grounded in research.md.

## D1 — Orchestration shape: one new composing runner + a spawned gate

**Chosen:** new impure runner `benchmarks/sculpture/challenge-milestone.mjs`
(`npm run challenge:cottage|gatehouse|church`) that composes, **in-process**, the existing pure
cores for the deterministic stretch — provision (church only, data-gated) → shell-integrity cores
(componentStrip → rebuildArtifact → census/openings → fillVoids → plugClosure → closureCheck) →
exported `buildSkin(def)` — then **spawns the existing gate runner**
(`node multi-angle-gate.mjs --subject <s> --label challenge --artifact challenge/<s>/artifact.json`).

- In-process composition for the deterministic stretch lets ONE double-run byte-equality proof
  cover the whole chain (provision+shell+skin), the E-24 Rule 2 idiom. `buildSkin` reads
  `def.build` from disk, so the runner writes its shell output first — file seams stay inspectable.
- Spawning the gate (rather than re-implementing) keeps the metered judge, the frozen contract
  (E-25 Rule 4: no flags can weaken it), its record schema, its sheet, and its exit codes exactly
  as T-093 shipped them. The challenge runner relays the gate's outcome and exit code.

**Rejected:** (a) shell-spawning all four named runners — the per-ticket runners' registries pin
*witnessed* inputs (shell-integrity's cottage AC numbers are bound to the spray-paint artifact;
durable-skin's `build` is the unrepaired base), so chaining them as processes would either break
their pins or silently re-point their committed records; they remain untouched measurement
records. (b) Extending durable-skin.mjs with shell+gate stages — would regenerate/invalidate the
committed E-24 records and tangle two epics' evidence in one file (the exact collision T-091/T-092
avoided). (c) A bash/npm-chained script — no double-run proof across stage boundaries, no single
record.

## D2 — Church enters durable-skin's SUBJECTS as a full data entry

The gate registry spreads durable-skin `SUBJECTS`, and zone-map loops it — so the **one** place a
church registry entry unlocks the whole pipeline is `durable-skin.mjs SUBJECTS.church`. That is
precisely Rule 3's sanctioned mechanism ("the church enters via its registry entry only"); AC3's
grep allows registry entries and forbids code branches.

Entry shape (data only, gatehouse precedents cited inline):
- `build: "challenge/church/base-artifact.json"` — the provisioned base (D4), committed.
- `concept` / `glb` / `map`: the T-094 paths + `material-map/church.json` (D3).
- `valueSelectRecord: null` (gatehouse precedent: first run IS the result), `zoneMapRecord: null`
  (no committed derivation exists; D5), no `kitRecord` (kits are E-26; optional in `buildSkin`).
- `policy` / `legacy`: transcribed 1:1 from the committed material map's roles (the exact
  gatehouse precedent — "1:1 rule→block, the E-21 restored case"). The policy is the recorded
  FALLBACK + diff baseline, not the live path (the concept derivation is); transcription of the
  map is not tuning, and the entry comment will cite the map record it transcribes.
- `plasterInvariant: null`, `frontDir`/`sideDir` per the concept's canonical view.

**Rejected:** a standalone church-registry file (T-094's interim answer) — now that the pipeline
must actually consume the church, a parallel registry would need translation glue in every runner,
which IS new pipeline code; the real registry with complete data crashes nothing (T-094's
objection was *partial* entries). Also rejected: deriving `policy` at import time from the map
JSON (runtime magic in a frozen-data registry; harder to audit than a cited transcription).

## D3 — Church material map: generic `--subject` filter on material-map.mjs, run once, commit

Add a church row to `material-map.mjs` SUBJECTS + a generic `--subject <key>` filter so the
metered sweep can run one subject. Run `material:map -- --subject church` ONCE; commit
`material-map/church.{json,raw.json}`. That committed record is the **pin** for this LLM-authored
step (the established E-21 idiom — cottage/gatehouse maps are likewise one-time committed LLM
output; every downstream run is a pure function of the committed JSON).

**Rejected:** generating the map inside the challenge runner when absent (ensureMap-style) — it
puts a metered, non-deterministic call inside the run whose double-run proof claims determinism;
map provisioning is upstream data authorship, like concept generation. Rejected: no filter
(running the full sweep) — would regenerate cottage/gatehouse maps and break every downstream
record-agreement assert (research §3).

## D4 — Church base build: a data-gated provision stage inside the challenge runner

If `def.provision = { scale }` is present (church: 48, the smoke-checked working scale), the
runner builds the base in-process from the same pure cores T-074 used for cottage/gatehouse:
`parseGlbColoredSurface` → `decodeTexture` → `voxelizeGlb({scale})` → `sampleSurfaceColors` →
`classifyFeatures` → `assignFeatureBlocks(map)` → `keysToArtifact`, then writes
`challenge/church/base-artifact.json`. Cottage/gatehouse (`provision` absent) keep their committed
T-074 bases — re-provisioning them would silently replace audited inputs. The mechanism is
generic (any future subject with a GLB + map + scale); no church key appears in code.

**Rejected:** `concept-materials-ab.mjs --only church` — its emit() would overwrite the committed
4-subject A/B report with a 1-row file, and its colorimetric before-side + A/B metrics are baggage
(research §4). Rejected: committing the base under `concept-materials/church/` — that directory's
provenance is the T-074 A/B record; the challenge dir is the honest home.

## D5 — Zone-map agreement: uniformly dropped in the challenge chain, diff recorded instead

The committed `zone-map/<s>.json` records were derived from **unrepaired** builds; the challenge
chain derives zones on the **shell-repaired** build, where layer counts / floor anchoring can
legitimately shift. The challenge runner therefore passes `buildSkin` def copies with
`zoneMapRecord: null` — one uniform transform `{...def, build: shellPath, zoneMapRecord: null}`
for all subjects (no per-subject branch) — and instead **records** the derived bands plus a diff
vs the committed record (cottage/gatehouse) in the challenge record. Honesty is preserved
(divergence is visible, auditable), determinism is preserved (the derivation itself is pure), and
the committed durable-skin/zone-map records keep their own agreement contract untouched.

**Rejected:** re-pointing the canonical records at the repaired builds (invalidates E-24/T-092
committed evidence and resemblance's gating artifacts mid-epic); making the assert tolerant
(weaketns an existing gate — forbidden).

## D6 — Honest-failure recording without weakening gates

`buildSkin`'s terminal gates THROW (a failing skin writes no artifact). The milestone AC requires
failures be *recorded findings*. The challenge runner catches a deterministic-stage throw and
writes `challenge/<s>.json` with `status: "pipeline-failed"`, the stage, and the error — **no
artifact, no sheet, no pass** is produced (nothing is weakened; the record just names the gap,
Rule 6). When the chain completes, the gate's own record/sheet carry the verdict; the challenge
record embeds the gate outcome + per-view verdicts and the named gaps. Exit code = gate's
(0 PASS / 1 FAIL / 2 REFUSAL), or 1 on pipeline-fail.

## D7 — Reproducibility story (AC4)

- Deterministic stretch (provision → shell → skin): run twice in-process, final artifact (and
  base/shell intermediates) byte-compared; sha256 of all written artifacts recorded; `--offline`
  re-asserts hashes + gate-record well-formedness, GL/judge-free.
- LLM-authored steps, pinned: material maps + kit records = one-time committed records consumed
  read-only (regeneration is an explicit upstream act, never on this path); the judge = pinned
  model ID, single sample per view, verdicts committed in the gate record. A fresh re-run
  reproduces the artifact bytes exactly; judge verdicts can flap at the gap-budget edge (T-093
  finding) — recorded as the instrument's known variance, not smoothed.

## D8 — Before/after vs the E-23/E-24 state (AC5)

Registry field `e23Before` (cottage: `spray-paint/cottage/artifact.json`, gatehouse:
`building/best/artifact.json` — the grey-roofed / pink-patched witnessed states; church: none).
The runner renders that artifact and the challenge final at the same oblique angle and saves
`pr/assets/frames/challenge-<s>-{before,after}.png`, alongside the gate sheets
(`multi-angle-<s>-challenge.png`). Church gets `after` only (no prior state exists — stated).

## D9 — Docs + handoff (AC6)

`docs/knowledge/design-learnings.md` gains the **concept-faithful pipeline (E-25)** section
(full-shell lesson, concept-derived zoning vs priors, the multi-angle gate, the church
generalization result, over/under-reach). `pr/assets/challenge-milestone.md` is the E-12 handoff
(per-subject table: chain numbers, gate verdict, named gaps, frames), mirroring durable-skins.md.

## D10 — Naming

`challenge:*` scripts (the `milestone:*` prefix is taken by E-23's hollow-cottage milestone).
Output dir `benchmarks/sculpture/challenge/`; records `challenge/<s>.{json,md}`; artifacts
`challenge/<s>/{base,shell,}artifact.json` (committed); renders gitignored; frames committed.

## Expected-outcome stance (so Implement doesn't improvise)

Cottage/gatehouse plausibly still FAIL the judge on roof form (T-093 baseline); the church is
fully untested and may fall back to the prior map or fail coverage. Every such outcome is
recorded with its named angle/region/attribute and shipped as a finding; no gate, threshold, or
azimuth may be adjusted to manufacture a pass (Rules 4/6). The epic's DoD then rests with the
reviewer (accept the named gaps or route follow-ups), which the review.md will state explicitly.
