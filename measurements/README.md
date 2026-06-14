# measurements/ — the FROZEN home

**Location encodes status (E-37 / T-155-01).** Everything under `measurements/` is part of the **frozen
instrument**: a committed measurement, or an input-of-record to one. These are **pins** — they change
only inside a ticket that owns them, behind the explicit `--rotate-pins` flag (see
`docs/knowledge/pin-rotation-policy.md`).

`measurements/` IS the pin-guard allowlist. The guard (`src/form/pin-guard.mjs`) freezes a path iff it is
**git-tracked AND** matches one of exactly two prefixes:

1. `measurements/` — this home.
2. ratified `packs/*.json` (excluding `packs/drafts/`) — the other already-location-encoded frozen home.

That replaces E-36's five-entry hand-list with a path prefix: status is now visible in the tree, not
buried in a match-function list.

What lives here:

```
measurements/
  multi-angle/        # gate verdicts — the frozen judge's committed records (E-28/E-31)
  pattern-book/       # facade + proportion baselines & milestones
  reconstructed/<s>/  # e26 baselines per subject
  visibility/         # cottage visibility baseline
  milestones/         # the *-milestone.md prose (M-rung receipts)
  kit/                # the ratified building-block kit (input-of-record to every verdict)
  retired-pins.json   # the pin-rotation registry
  *-baseline.{json,md}# root-level cleanliness / form baselines
```

Drafts (regenerable creation artifacts) live under `builds/` and `benchmarks/sculpture/`; dead code lives
under `_archive/`. The architecture of record: `docs/knowledge/pipeline-philosophy.md` — **creation is
free, measurement is frozen.**
