# T-091-01 shell-integrity-and-debris — Plan

Four commits, each independently verifiable. `npm test` baseline: full suite green (~1035 unit tests +
the AJV self-test). All paths relative to repo root.

## Step 1 — pure cores + tests (commit 1)

1. `src/view/surface-pattern.mjs`: extract the private heap + priority-flood into exported
   `spillLevels(valueMap)`; `regularizeRoofCourses` delegates. No other signature changes.
2. `src/view/shell-integrity.mjs`: implement `componentStrip`, `rebuildArtifact`, `openingRegions`,
   `inRegion`, `fillVoids`, `closureCheck`, `plugClosure` per structure.md.
3. `src/view/shell-integrity.test.mjs`: the ~12 synthetic-occupancy tests from structure.md.

Verify:
- `node --test src/view/shell-integrity.test.mjs src/view/surface-pattern.test.mjs` green.
- `npm test` fully green (course tests pin the extraction).

Commit: `feat(E-25 T-091-01): shell-integrity pure cores (component strip, void basin-fill, 6-dir closure)`

## Step 2 — witnessed-artifact runner + live records (commit 2)

1. `benchmarks/sculpture/shell-integrity.mjs` per structure.md (SUBJECTS cottage/gatehouse, double-run
   determinism, `--offline`, renders, frames, record md/json).
2. `package.json`: `shell:cottage`, `shell:gatehouse` scripts.
3. `.gitignore`: shell-integrity PNG stanza.

Verify (live, GL):
- `npm run shell:cottage` — MUST print/record: 23 → 1 components, 126 cells stripped (hard-asserted in
  the runner), closure `closed:true`, double-run byte-identical, renders written.
- `npm run shell:gatehouse` — strip report (expected 0 stripped — single component), void repair
  patches the upper-right cavity, arch preserved (door region in the allow-list), closure `closed:true`.
- Inspect `shell-integrity/*/view-*` before/after renders: cavity gone, arch open, no sky through the
  shell at 135°/225°; debris gone from the cottage silhouette.
- `npm run shell:cottage -- --offline` and `shell:gatehouse -- --offline` exit 0.
- `npm test` unchanged-green (runner is not under the test glob).

Commit: `feat(E-25 T-091-01): shell-integrity runner — cottage 23→1 components, gatehouse cavity repaired`

## Step 3 — durable pipeline wiring + regenerated records (commit 3)

1. `benchmarks/sculpture/durable-skin.mjs`: strip stage (post-substitution, with rebuild +
   `assertArtifact`), pre-seal `openingRegions`, `fillVoids` stage (post-seal, zones recomputed after),
   `plugClosure` + terminal `closureCheck` gate (THROW on not-closed), record `shell` section, extended
   `--offline` checks, md section.
2. Live `npm run skin:cottage` and `npm run skin:gatehouse` — both must pass every gate (coverage,
   bands, plaster, closure) and regenerate `durable-skin/*.{json,md}` + artifacts + frames.
3. `npm run skin:cottage -- --offline` / `skin:gatehouse -- --offline` exit 0 against the new records.

Verify: console shows strip/void/plug/closure lines; final artifacts report 1 (cottage) /
largest+grounded (gatehouse) components; oblique renders show no sky through the shell; `npm test`
unchanged-green.

Commit: `feat(E-25 T-091-01): shell-integrity stages wired into durable-skin (strip → void repair → closure gate)`

## Step 4 — RDSPI artifacts (commit 4)

`docs/active/work/T-091-01/{research,design,structure,plan,progress,review}.md` committed.

Commit: `docs(E-25 T-091-01): RDSPI artifacts — shell integrity research→review`

## Testing strategy

- **Unit (pure)**: every new export tested on synthetic occupancies (Step 1); determinism asserted by
  re-running `rebuildArtifact` and comparing JSON. Existing `surface-pattern` tests pin `spillLevels`.
- **Integration (live, not in `npm test`)**: the two runners ARE the integration tests — double-run
  byte-equality, hard-coded AC expectations (cottage 23/126), terminal gates that throw, `--offline`
  re-assertion for CI-less reproducibility.
- **Visual evidence**: committed frames (`pr/assets/frames/shell-*`) + runner renders at the witnessed
  angles (front/135°/225°/top); AC4's "no sky through the shell" is eyeballed on the oblique afters and
  described in the record.

## Verification criteria (ticket ACs → checks)

| AC | Check |
|---|---|
| Component strip pure + tested; cottage 23→1, −126 | unit tests; runner hard-assert; record |
| Void repair pure + tested; gatehouse cavity repaired, arch preserved | unit tests; before/after frames; allow-list includes the ±x door region |
| 6-dir closure pure + tested; cottage+gatehouse pass after repair; loud pipeline gate | unit tests; both runners + durable-skin THROW on not-closed |
| Named npm runs, no hand-edits, no subject constants, oblique renders clean, `npm test` green | `shell:*`/`skin:*` scripts; policies/thresholds are op params or census-derived; frames; full suite |

## Deviation rule

If a live run contradicts a design assumption (e.g. `minDepth=3` flattens intended cottage detail, or
plug volume explodes), stop, record the measurement in progress.md, adjust the op *parameter at the
call site* (data, not code constants), and re-run — never hand-edit an artifact (E-24 Rule 1).
