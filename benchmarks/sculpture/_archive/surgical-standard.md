# Surgical refine-to-standard — the E-15 loop + GLB form target on the high-res building (T-069-01)

The E-20 quality bar. The placed + clean high-res building (T-068-01) re-run through the E-15 surgical
revision loop with the building's **GLB as the form target** (region → diagnose → bounded tweak →
**accept-if-improved**, P14-safe), bounded rounds, toward the categorical judge's **Strong+** verdict.
The purpose is to find WHERE quality tops out — so a sub-Strong ceiling is measured + explained, not hidden.

Subject: building. Standard bar: **strong+**. Schema `surgical-standard/v1`.

## Outcome (AC#3 — stated honestly)

**Topped out at `weak`** (best @ round 0) — did NOT reach strong+. The specific detail the loop could not fix: region `{"where":"top","fraction":0.22}` (final per-region IoU 0.596, 1 attempt(s), 0 kept).

## Judge-verdict trajectory (AC#2)

| round | overall | whole-object IoU |
| ----- | ------- | ---------------- |
| 0 (baseline) | weak | 0.929 |
| 1 | weak | 0.929 |

## Per-region edit trace (AC#2 — procedural vs LLM, kept/rolled-back)

| region | route | kind | tweak | IoU before→after | kept? | reason |
| ------ | ----- | ---- | ----- | ---------------- | ----- | ------ |
| `{"where":"top","fraction":0.22}` | llm-edit | llm | noop | 0.596→0.596 | ✗ | rolled-back |
| `{"where":"front","fraction":0.3}` | llm-edit | llm | noop | 0.723→0.723 | ✗ | rolled-back |
| `{"where":"left","fraction":0.28}` | llm-edit | llm | noop | 0.635→0.635 | ✗ | rolled-back |
| `{"where":"right","fraction":0.28}` | llm-edit | llm | noop | 0.75→0.75 | ✗ | rolled-back |

Net form-IoU gain over accepted regions: **0**.

## P14-safety (AC#2 — no accepted region later altered; non-improving tweaks rolled back)

**SAFE** ✓ — 0 accepted region(s), all disjoint, every kept edit strictly improved.

## Findings (where/why quality tops out)

- The per-region LLM block-edit route FAILED on 4/4 attempt(s) — the baml-revise subprocess exited non-zero, its stderr reporting a "prompt too long" BamlError (~1.25M tokens vs the 1M limit). A high-res building region's placement list (tens of thousands of blocks at scale 64) exceeds the model's context. The E-15 surgical LLM-edit path — validated on ~32-block sculptures (hundreds of placements) — does NOT scale to the high-res building's region density; the loop cannot propose a form edit, so every region rolls back unchanged (the cage held).
- Compounding cause: the TRELLIS GLB form target (T-067) already lost the defining details (arch ring, gable ridge line, 1×3 slit windows), so even a working editor has no per-region signal pulling toward those features — the form target cannot reward detail it does not itself contain.
- Representative edit-proposal error (region -27,32,-27|26,63,26): "baml-revise exited 1".

> _Note:_ The accept-gate is the DETERMINISTIC GLB per-region form-IoU compare (a hill-climb cannot tolerate a non-deterministic gate — the E-15/T-073 lesson); the categorical judge is the OUTER measurement of where quality tops out, not the inner gate. P14-safety (no accepted region later altered; non-improving tweaks rolled back) is the loop's structural guarantee — checkP14 MEASURES it. Absolute IoU is bounded by the TRELLIS GLB reconstruction (T-067); the relative trajectory is the signal. Judge caveat: the JudgeFacade prompt frames a temple facade head-on; the subject is a gatehouse at 3/4 view (enum + dims transfer; the framing is a recorded residual).
