# T-165-02 — Plan

Ordered, independently-verifiable steps. Each ends green; commits are atomic. Frozen instrument untouched
throughout (no `src/` production change — data + test + docs only).

## Step 1 — Author `packs/guildhall.json`
Write the pack per structure.md (real `valueCheck` triples; idioms ∈ registry; zone seats balanced; no
`ratification`).
- **Verify:** a throwaway `node` run calls `loadStylePack("packs/guildhall.json")` and prints
  `ok=true` + the derived `styleProfileBlock`. Fix any thrown semantic error (stale Lab, missing dominant,
  unknown idiom, provenance gap) before moving on. Eyeball the printed profile: WALL line names
  `pilaster`/`quoin` and NOT `timber-frame`; OPENING line names `arch` and NOT `head.flat`; ROOF line names
  `roof.hip` + `deepslate_tiles`.
- **Commit:** `feat(T-165-02): guildhall — a polite/classical second style (Layer-A expected profile)`.

## Step 2 — Add DG7 wrong-style fixture to `src/workshop/diagnose.test.mjs`
Load `packs/guildhall.json`; assert the grammar-level wrong-style signal over the existing barn `PROGRAM`
(the assertion block in structure.md). Reuse the file's `RUSTIC`, `PROGRAM`, `AZ` constants.
- **Verify:** `node --test src/workshop/diagnose.test.mjs` — DG1–DG7 green. DG7 fails loud if the pack
  can't load or the grammar doesn't differ.
- **Commit:** `test(T-165-02): DG7 pins guildhall wrong-style grammar vs rustic`.

## Step 3 — Full suite + the untouched-pin checks
- **Verify:**
  - `npm test` — all green (~2215 + DG7). Confirms no pack-enumeration or count assertion broke.
  - Spot the protected pins are byte-identical (they reference rustic/barn by path, so they must not move):
    FX-DB1 (diagnose golden), FX-R1 (recognition prompt sha), `workshop:replay` byte-identity,
    `workshop:offline`. These need no code from this ticket; the check is that adding a *file* changed none.
- **No commit** (verification only) unless a fixup is needed.

## Step 4 — Write `FINDINGS.md` (AC3, the honest record)
State the result split: WALL+OPENING grammar genuinely differs (fixture-proven, not a reskin); the ROOF
axis is capped at "pitched" by the registry → scope the generator epic (new roof idioms
`roof.flat`/`roof.parapet`/`roof.mansard`/`roof.dome`, each = brush + paramsSchema + departmentOf=ROOF).
List what is deferred to S-166 (live crater + house-scale matched concept render) and the existing stand-in
concept (`arc-A-flash.png`). Lead with how the claim *fails*, per anti-hedge.
- **Verify:** reads as calibrated honesty — no inflation ("a whole new style family!") and no false
  brutality ("the registry is useless"). Names the exact next gate.
- **Commit:** `docs(T-165-02): FINDINGS — wall/opening grammar real, roof-form ceiling → generator epic`.

## Step 5 — RDSPI artifacts + review
`progress.md` tracks Steps 1–4 with any deviations; `review.md` is the handoff (changes, coverage, open
concerns, AC status). These are committed with the work or in a trailing `docs(T-165-02)` commit.

## Testing strategy

- **Unit (in `npm test`):** DG7 — deterministic, pure (no GL/IO/Date/random beyond the committed-file read
  `loadStylePack` does, same purity class as DG1–DG6). It is the **provable T-165-02 witness** for AC1+AC2:
  the pack validates and the SAME build yields genuinely different (grammar-level) `expected` under
  guildhall vs rustic.
- **Pack validation:** exercised by `loadStylePack` inside DG7 (schema + all six semantic checks). A bad
  pack fails the test, not production.
- **Not automated (named, deferred — mirrors T-165-01):** the live `diagnose:smoke` `expected`-prose diff
  and S-166's clean×wrong-style crater + matched render. The smoke does not yet expose `--pack guildhall`;
  wiring it is S-166 territory (the bake-off harness), not this ticket. Recorded in FINDINGS + review, not
  silently skipped.

## Verification criteria (done = all true)

1. `packs/guildhall.json` loads via `loadStylePack` (schema + semantic, fail-loud) — proven by DG7.
2. Its `style_profile` differs from rustic's at the **idiom** level on WALL (`pilaster`/`quoin` vs
   `timber-frame`) and OPENING (`arch` vs `head.flat`) — DG7 asserts both directions.
3. `FINDINGS.md` records the ROOF-form ceiling as the finding and scopes the generator epic (AC3).
4. `npm test` green; FX-DB1 / FX-R1 / replay / offline / frozen instrument all unchanged (AC4).

## Rollback

Delete `packs/guildhall.json` + DG7 + FINDINGS.md. Nothing else references them; the mechanism
(`styleProfileBlock`) is inert without a pack passed to it. Zero production-code surface to revert.
</content>
