# T-093-01 — multi-angle-same-object-gate — Review

## What changed

**Created**
- `src/form/multi-angle-gate.mjs` — pure core: the fixed per-view judge prompt
  (concept | mesh@azimuth | build@azimuth; the concept explicitly does not rotate), the
  `multi-angle-verdict/v1` parser (E-22's frozen VERDICTS/GAP_ATTRS; "same object" may carry only
  MINOR gaps, "drifted"/"different object" require a MAJOR one; ≤3 gaps/view; throws precisely on
  violations), `aggregateMultiAngle` (REFUSE on missing view/unparsed verdict — no partial
  verdicts; DECIDE pass ⇔ all coverage passed ∧ all same-object ∧ Σ gaps ≤ budget; coverage-failed
  views are decided FAILs whose judge was never called), and `viewOutcomeLabel`.
- `src/form/multi-angle-gate.test.mjs` — 21 tests: full parser contract, the aggregation matrix
  (incl. the AC's refuse-on-missing-view and gap-budget boundary cases), captions, sheet math.
- `benchmarks/sculpture/multi-angle-gate.mjs` (`npm run gate:multi`) — the impure runner: 4 config
  azimuths at the 512² contract lens (no flags can change the set/elevation/resolution — E-25
  Rule 4), per-view T-088 coverage on each view's own visible skin via the existing diagonal
  projection census, one judge call per surviving view, pure aggregation, labeled contact sheet
  (the verdict artifact), exit 0/1/2 = pass/fail/refusal, `--offline` re-assert. Includes the
  GATE_SUBJECTS registry = pipeline `SUBJECTS` + the clearly-labeled synthetic-positive fixture.
- `benchmarks/sculpture/multi-angle/fixtures/hut/` — the synthetic positive (artifact + committed
  concept render of that artifact + material map). Ground truth same-object by construction.
- Proof records + sheets: `multi-angle/{cottage-baseline,cottage-current,gatehouse-current,
  synthetic-hut-current}.{json,md}` + `pr/assets/frames/multi-angle-*.png`.

**Modified**
- `src/config.mjs` — `MULTI_ANGLE_GATE` (frozen azimuth set + gap budget).
- `src/form/resemblance.mjs` — `composeSheet` (N-panel); `composeTriptych` delegates with its
  exactly-3 contract intact (byte-identical output asserted by test).
- `package.json` (`gate:multi`), `.gitignore` (gate renders ignored; fixture inputs un-ignored).

Commits: `cb14d67`, `1006ecd`, `3cb629b`, `4acef49`.

## Acceptance criteria

- **4 fixed azimuths, config-held, refuse on missing view** — yes: `MULTI_ANGLE_GATE` is frozen
  config; the runner exposes no angle/resolution flag; a failed render or unparsed verdict yields
  a REFUSAL record (decided:false) and exit 2 — no pass/fail is produced (unit-tested).
- **Per-view categorical judgement + per-view E-24 coverage precondition** — yes: each azimuth's
  visible skin is censused by the existing diagonal projection (`surfaceZoneHistogram(faces:
  [angle])`) → `coverageGate`; on failure the judge is not called and the record shows it (the
  T-088 short-circuit, asserted by `--offline`). The judge reuses E-22's vocabulary, triptych
  shape, model pin, and `claude -p` seam.
- **Contact sheet as the verdict artifact** — yes: concept | 4 labeled views (angle + outcome per
  panel), saved per run and committed under `pr/assets/frames/`.
- **Aggregate pass rule unit-tested** — yes: pass at 0 and at exactly 2 gaps, fail at 3
  (`gap-budget`), drifted/different/coverage failures named per angle, refusals for missing view
  and unparsed verdict, exact-set contract (duplicate/unknown angle throws).
- **Proof both ways, recorded** — yes: the committed grey-roof cottage FAILS on every non-front
  azimuth (coverage 0-1% roof dominant); the synthetic positive PASSES (4× same-object, 2 minor
  gaps). Additionally the current durable skins were gated and honestly FAIL (below).
- **`npm test` green; no weakening of E-22** — 1105/1105; `resemblance.mjs` runner and
  `resemblance-consolidation.mjs` have zero diff; v1 prompt/parser/schema untouched; the only v1
  change is `composeTriptych` delegating to `composeSheet` with its contract pinned by test.

## THE FINDINGS (need human attention)

1. **The durable skins fail the multi-angle judge while passing coverage.** Cottage: drifted at
   all 4 azimuths — the consistently named major gap is **roof form/massing** (at the 30° contract
   elevation the views are roof-dominated; the voxel roof reads as a dark beam jumble vs the
   concept's clean courses). Gatehouse: 3× drifted + 1× different-object (rough silhouette, busy
   wall zoning). This is precisely the divergence the ticket said the single-angle gate rewards
   hiding — the gate now names it. These sheets are S-095's honest baseline; the gaps route to
   roof-form/coherence (S-087/S-090 successors) and shell roughness (S-091), not to gate tuning.
2. **The pass leg is synthetic.** No real subject currently passes, so the AC's sanctioned
   fallback was used: a committed fixture whose concept is a render of its own artifact. It proves
   the instrument's pass path; it does not claim any pipeline output passes today.

## Test coverage and gaps

- Pure core fully covered (parser, aggregation, captions, sheet math). Runner verified by the four
  recorded runs + `--offline` re-asserts (repo-standard seam; never under the test glob).
- Not covered: judge variance (single sample per view — re-runs may flip borderline minor gaps;
  the synthetic PASS sat exactly at the budget, so a chatty judge could flip it to gap-budget FAIL
  on a re-run); the labeled sheet's caption drawing (cosmetic, node-canvas fallback path untested).

## Open concerns / limitations

1. **Judge severity calibration is the gate's soft spot**: "minor vs major" and gap-counting are
   model judgement; the budget boundary makes PASS sensitive to verbosity. If this flaps in S-095,
   consider multi-sample voting per view (the E-22 `samples` seam exists) — a follow-on.
2. **The contract elevation (30°) over-weights roofs** for squat buildings; that is arguably the
   right bias for "reads as a roof from anywhere", but it is a property S-095 should know.
3. Per-view coverage uses the four ground diagonals' projection skins; ortho-face defects hidden
   from all four diagonals would pass coverage (the judge still sees them in the renders).
4. The zone derivation is re-run inside the gate (same committed inputs as the pipeline, but no
   cross-assert against `zone-map/<subj>.json`); a divergence would be a wiring bug the durable
   runner would catch first.
