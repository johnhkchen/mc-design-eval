# T-052-01 — Progress

## Status: complete (all RDSPI phases done; live run committed; `npm test` green 514/514)

## Commits (on `main`)
1. `1fc0dca` feat(E-16 T-052-01): glb-voxel-surgical harness (skeleton + critic + P14 reporter) + sibling
   main-guard + `.gitignore`.
2. `83b13ae` feat(E-16 T-052-01): live surgical run on glb-voxel koi+heart (record committed) + corrected
   verdict gloss/headline.

## What shipped (vs plan.md)
- **Step 1+2 merged** — wrote `benchmarks/sculpture/glb-voxel-surgical.mjs` whole (skeleton + live wiring
  in one file; the split was bookkeeping, not separable work). `node --check` + a pure critic/overlap
  sanity test passed before any live run.
- **Step 3** — `.gitignore` line for `glb-voxel-surgical/**/*.png` (renders image-heavy/derived; `.json`/
  `.md` are the durable record). Confirmed via `git add -n` that only the `.json`/`.md` track.
- **Step 4 (the deliverable)** — live run on koi + heart. Both subjects ran (no skips). GL render +
  `claude -p` (LLM `curve` region) + deterministic `relief` region all executed.
- **Step 5** — `npm test` → 514/514 (unchanged from the T-051-01 baseline; zero `src/` change). `--offline`
  regen reproduces the table from committed numbers.
- **Step 6** — this file + `review.md`.

## Deviations from structure.md / plan.md (documented)
1. **Touched a T-049-01 file (`glb-formtarget-ab.mjs`).** structure.md said "no change". Reason: that file
   calls `main()` at top level, so importing its `export`ed `formVerdictOf` would have executed its live
   A/B run as an import side-effect. Added the standard **main-guard**
   (`if (process.argv[1] === fileURLToPath(import.meta.url))`) so its exports import cleanly. This is a
   correct, behavior-preserving fix (running it directly is unchanged) and is the *right* way to honor DRY
   (reuse the export, don't clone it — the parallel-roots-duplicate-shared-deps lesson). Verified: importing
   the sibling no longer triggers a run; running it directly still does.
2. **Did NOT reuse the sibling's `VERDICT_GLOSS`; defined a LOCAL one.** The sibling's gloss calls
   `regressed` "impossible under the rollback gate (an alarm)" — true there because its accept-gate and its
   verdict measure the *same* quantity. **Here they differ**: the loop's accept-gate is the *per-region*
   IoU; the verdict is the *whole-object* IoU. So a per-region clean that doesn't transfer can genuinely
   lower whole-object IoU — `regressed` is a REAL outcome, not an alarm. I still reuse the pure classifier
   `formVerdictOf` (it's correct); only the human-facing gloss is localized.
3. **Budget `maxIterations: 8`** (plan said "8 headroom") with two regions × `perRegion: 1` per subject.

## The honest result (the point of the ticket)
| subject | per-region accept-gate | whole-object IoU | verdict | P14 |
|---|---|---|---|---|
| koi | curve region cleaned: **0.513→0.528 (accepted+locked)**; relief rolled back | **0.622→0.614** | regressed | ✓ |
| heart | both regions rolled back (0/2) | 0.877→0.877 | held | ✓ |

- **koi** — the LLM block-edit (3 ops, 3 applied, 0 rejected) *did* clean the targeted caudal-fin region
  against the GLB (per-region IoU up, kept + locked). But the clean **did not transfer** to the whole
  object — whole IoU fell 0.008. A genuine, honest divergence: a single-view per-region accept signal can
  reward a local edit the whole-object silhouette does not. The proposed candidate render (`proposed-0.png`,
  whole IoU 0.614) == the after (the edit was kept). **Not a gate bug** — P14 holds (the region locked; the
  relief region that followed rolled back).
- **heart** — already at 0.877; neither the LLM arch edit (8 ops applied, but per-region IoU unchanged
  0.566→0.566 → rolled back) nor the relief pass (0.730→0.728 → rolled back) beat the target. A clean
  **held**: the cage left the near-perfect build untouched. The almost-closed-arch artifact was **not**
  cleaned by a local edit at this view/scale.

## P14 verified (AC #3)
`p14Report` (read from the loop's own `locked`+`trace`): both subjects `ok: true`, zero violations. koi's
accepted curve region is present in `locked` (1) and the subsequent relief region did not overlap it (no
re-edit). heart locked nothing (0 accepts) — every non-improving tweak rolled back. The build was never
mutated except by an accepted, improving (per-region) edit.

## Sanity checks run
- `node --check` on both the new harness and the modified sibling.
- Sibling import is side-effect-free (no live run on import); `formVerdictOf` returns the four categories.
- `git check-ignore` confirms PNGs ignored; `git add -n` stages only `.json`/`.md`.
- No `regressed` from a target/baseline *mix* (the T-049-01 trap): the verdict is GLB-after vs GLB-before
  throughout; koi's `regressed` is a true whole-object drop, not a cross-target artifact.

## Not done / out of scope
- No new `src/**/*.test.mjs` (the only test glob): the loop's P14 cage is unit-tested in `loop.test.mjs`,
  the form-target math in `form-target.test.mjs`; this harness adds only GL+metered glue + reused logic.
- No orientation/axis calibration (inherited honesty caveat); n=2.
