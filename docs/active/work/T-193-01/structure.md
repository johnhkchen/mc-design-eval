# T-193-01 — STRUCTURE: artifacts, not code

S-193 ships **no source changes**. The frozen instrument and the runner are untouched (the runner already
carries the T-191 override and all seven hands incl. the S-192 three). The "structure" of this ticket is the
set of **run outputs and judgement artifacts** produced under the work dir. This blueprint fixes their shape
and provenance so a reviewer can audit the capstone without re-running the metered climb.

## Files CREATED (all under `docs/active/work/T-193-01/`)

| File | Producer | Contents |
|---|---|---|
| `research.md` | this pass | map of runner, hands, gate, prior runs, constraints |
| `design.md` | this pass | the three run/judge/record decisions + rejected options |
| `structure.md` | this pass | this blueprint |
| `plan.md` | this pass | the ordered run + judge + record steps |
| `trajectory.json` | the climb (`CLIMB_OUT`) | schema `picture-climb/v1`: per-round score/evidence/items/pick/gate/dept-counts + `inventory` + `verdict` |
| `run.log` | the climb (stderr) | full console trace: per-round KEPT/ROLLED-BACK, dept signals, per-hand notes (frame_arch perOpening, articulate_walls recolor count), final trend + verdict |
| `first-beside.png` | copied from `round-0/beside-concept.png` | the seed beside the concept (AC-1 "first") |
| `best-beside.png` | copied from the highest-scoring round's `beside-concept.png` | best beside the concept (AC-1 "best") |
| `final-beside.png` | copied from the terminal kept build's `beside-concept.png` | final beside the concept (AC-1 "final") |
| `progress.md` | Implement | what ran, deviations, the actual trajectory |
| `review.md` | Review | the handoff: changes (none to source), the glance verdict, autonomy cost, residual→E-49, test status |

## Files MODIFIED / DELETED
- **None.** No source, no test, no measurements/, no pack, no schema. (If `npm test` or the run surfaces a
  real defect in a lever, that becomes an E-49 finding recorded in `review.md`, NOT a fix in this ticket.)

## Provenance / scratch (NOT work-dir artifacts, not committed as deliverables)
- `builds/gatehouse/picture-climb/round-{0..N}/` — the runner's per-round render scratch (4 views + beside).
  The chosen first/best/final beside PNGs are **copied** into the work dir so the deliverables are stable
  even though `builds/` is volatile scratch (T-191 left a stale round-4 there; treat `builds/` as ephemeral).

## The run invocation (fixed, single command)
```
CLIMB_OUT=docs/active/work/T-193-01/trajectory.json \
  node experiments/eval-alignment/picture-climb.mjs 2> docs/active/work/T-193-01/run.log
```
- `CLIMB_OUT` redirects the trajectory into the work dir (the runner defaults it to T-188's dir).
- stderr → `run.log` (the runner logs to `console.error`; stdout is empty).
- No `GUARD_ONLY` / `ROOF_MATERIAL_*` env — those are the zero-spend probes, not the completion run.

## Ordering that matters
1. `GUARD_ONLY=1` pre-flight (done this session — GL up, seam clean) **before** any spend. ✔
2. The metered run writes `trajectory.json` + `run.log` + all `round-{n}/` renders.
3. Glance judgement reads concept + first/best/final beside renders → copies the three into the work dir.
4. `npm test` (green; trivially, no source changed) — the only gate that must pass.
5. `progress.md` then `review.md`.

## Interfaces touched (read-only)
- `picture-climb.mjs` — invoked, not edited. Honors `CLIMB_OUT`.
- The beside renders — read via the Read tool (PNGs render visually) for the glance verdict.
- `trajectory.json` — parsed for the score trend, gate decisions, and `inventory.verdict` (reported as
  evidence beside the glance, never as the verdict).

No module boundaries change. No new public interface. The deliverable is evidence + judgement.
