# Progress — T-009-01: effort-ab-on-champion

Live tracker for the Implement phase. Commits are left to Lisa (the repo's shared-branch convention —
prior tickets' work artifacts and run dirs are likewise uncommitted in the tree).

## Steps

| # | Step | State |
|---|------|-------|
| 0 | Probe legal `--effort` token | ✅ `claude --help` lists `low, medium, high, xhigh, max`; `high` valid; default = omit flag |
| 1 | Wire `effort` → `requestDesignArtifact` | ✅ guarded `--effort` push after `--model` + JSDoc |
| 2 | Wire `effort` → `requestDesignArtifactWithImage` | ✅ same guarded push + JSDoc |
| 3 | `npm test` green (gate wiring) | ✅ 133/133 |
| 4 | Thread `--effort` flag in run.mjs | ✅ parseArgs + ctx + summary.effort + 3 stage calls; `node --check` clean; 133/133 |
| 5 | Copy `judge-round0.mjs` | ✅ from T-006-01 (same import depth) |
| 6 | Run DEFAULT arm (LIVE) | ✅ run **024** (`effort: null`), overall strong, 723s |
| 7 | Run HIGH arm (LIVE) | ✅ run **026** (`effort: high`), overall strong, 946s |
| 8 | Fill A/B scoreboard | ✅ below |
| 9 | Journal entry + verdict | ✅ appended to design-learnings.md; verdict NOT A REAL LEVER |
| 10 | review.md | ✅ written |

(Run **025** between them is a *concurrent* T-013-01 persona-ON run from another Lisa thread — not part of
this ticket. My arms are 024/DEFAULT and 026/HIGH.)

## Wiring diff (Steps 1–4) — confirmed against the AC

`src/sdk-binding.mjs` — one guarded line added to each of the two artifact functions, mirroring the line
already in `requestText` (L455). `effort === undefined` ⇒ args byte-identical ⇒ default path unchanged:
```js
if (effort) args.push("--effort", String(effort));   // after `if (model) …`, before `if (system) …`
```
- `requestDesignArtifact` — `effort` added to params + JSDoc.
- `requestDesignArtifactWithImage` — `effort` added to params + JSDoc.
- `requestText` / `requestTextWithImage` — UNCHANGED (already had `effort`).

`benchmarks/temple-facade/run.mjs`:
- `parseArgs` — `--effort` branch + `effort: undefined` default.
- `main` — destructure `effort`; thread into `run(...)` ctx; `summary.effort = effort ?? null`.
- `vRefRevise-designdoc` — `const effort = ctx.effort;` + `effort` passed to all three stage calls
  (stage 1 already accepted it; stages 2–3 newly do).

**AC #1 satisfied:** `--effort` confirmed wired through `src/sdk-binding.mjs`, diff recorded above,
`npm test` green (133/133).

## A/B scoreboard (to fill from summary.json + judge-round0.mjs)

Rubric: categorical `weak < competent < strong < exceptional`, median-of-3. Round-0 = build (stages 1–2);
Render = 2nd pass (stage 3).

| arm | run id | round | proportion | color | detail | fidelity | overall | wall-clock |
|-----|--------|-------|-----------|-------|--------|----------|---------|-----------|
| DEFAULT | 024 | round-0 | strong | strong | competent | strong | strong | — |
| DEFAULT | 024 | render  | strong | strong | competent | strong | strong | 723319ms |
| HIGH    | 026 | round-0 | strong | strong | **strong** | strong | strong | — |
| HIGH    | 026 | render  | strong | strong | **strong** | strong | strong | 946380ms |

**Deltas:** only `detail` moved (competent→strong, both rounds); proportion/color/fidelity/overall flat.
Wall-clock +223s (+31%, 1.31×); output tokens 53,970→71,208 (+32%); ops 121→163 (build), 147→202 (2nd pass).

**Verdict (pre-registered Decision D): NOT A REAL LEVER / not worth the latency.** 1 of 4 dims moved =
below the ADOPT bar (≥2 dims, none regressed); the moved dim is the P15-down-weighted noisy one; and the
*independent* persona A/B (025) flipped the **same** lone `detail` via the same more-output mechanism —
the "busier-reads-as-detail" generation-noise signature, not a deliberation effect. No default changed.

## Deviations from plan

- **No per-step git commits.** The repo convention (observed: T-006…T-013 artifacts and all `runs/` dirs
  are untracked/uncommitted in the working tree) is that Lisa commits, not the per-ticket agent. Following
  that convention; the plan's commit steps are recorded but deferred to Lisa.
