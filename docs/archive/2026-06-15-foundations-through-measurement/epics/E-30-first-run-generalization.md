---
id: E-30
title: first-run-generalization
type: epic
status: open
priority: high
depends_on: [E-29]
spec: "§1, §5, §6, §9"
stories: [S-117, S-118, S-119, S-120, S-121, S-122]
---

## Background (read this first — self-contained)

**The project.** `mc-design-eval` measures an LLM's spatial/material *design* capability via styled
Minecraft builds. E-29 proved the generate-first inversion: a build authored entirely from fitted
parameters + kit (zero blob cells, machine-checked) is a **peer of the repair path on the judge** and
**strictly cleaner on the craft censuses**, and the church completes on it where the repair chain
refused.

**E-29's sharpest finding (T-116, 2026-06-11):** *first-run generalization is gated by the weakest
input-prep lens, not the strongest generator.* The fourth subject (tithe barn) registered clean and ran
the repair chain untuned end-to-end to honest verdicts (FAIL 12/2) — but **generate-first never
started**: the T-092 zone lens refused the concept (`no-field-cells` — the barn's cobblestone field
quantizes into `stone_bricks` at **ΔL 2.082**, zero cobble-dominant rows: the E-21 near-tone collapse,
fixed years ago in the material map, still living in the zone lens), kit-extract contractually requires
derived bands, and the generated runner requires kit (receipts: `zone-map/barn.json` refusal;
`kit.mjs:122`; `generated-milestone.mjs:476`). The contracts were correctly not relaxed — the stall is
the measurement. The barn's registry entry sits ready with `zoneMapRecord: null / kitRecord: null`,
waiting to flip on a successful derivation (the church-flip precedent).

**Folded in — the rest of the E-28/E-29 ledger:**

1. **Roof form is THE seam** — on every azimuth of every subject, both paths (T-115). The fits that
   exist are honest but not good enough: cottage gable ends accepted at faceRmse 1.541/1.116/1.038
   with a refused cross-lo; gatehouse `end-hip`×2 / `end-fit-insane` and an invalid ridge intersect
   (its 315° same-object **regressed** at T-111); church tower's pyramid hypothesis honestly refuted
   (flat top). Nobody has yet *analyzed what reads wrong* — the verdicts say "roof form," the records
   say which rungs refused, but no artifact compares the GLB's roof to the build's roof region by
   region.
2. **Pin rotation needs a policy** (T-116 concern 6). An attempted "cheap" reskin re-cut re-ran the
   **judge** and re-rolled three styled verdicts (the cottage 135° same-object hold flipped — the
   known budget-edge flap); it was correctly reverted and every pin restored byte-identically. Plus an
   incident: a missing `--` swept the three legacy kit pins (caught, restored). The pins are
   load-bearing and nothing structurally protects them: re-cutting must be impossible without an
   explicit, verdict-owning act.
3. **Registration gates the wrong things** (T-116 concern 2). The S-094 checklist gates *geometry*
   (single building, bulky, clean background) but not *lens readability* — the barn passed the
   checklist, spent the TRELLIS budget, and was then refused by the zone lens. And glb-smoke's strict
   single-component gate over-fires on sub-speck debris (the barn failed it at every scale on ONE
   mesh cell, largest fraction ≥0.9813).

## Goal

A new subject's first run **actually runs**: every input-prep lens as robust as the generator it feeds,
the roof-form seam attacked with analysis before construction, the verdict pins structurally protected
— proven by `generated:barn` completing end-to-end against the already-pinned bar.

```
concept (immutable)
  ─▶ ZONE LENS, ROLE-AWARE      bands classified against the material-map roles (near-tones disambiguated), not raw color dominance
  ─▶ kit-extract ─▶ generate    the bootstrap chain the barn stalled on — unblocked at its root
  ─▶ ROOF-FORM SEAM             region-diff the build's roof vs the GLB's per azimuth → name what reads wrong → targeted rungs
  ─▶ PROTECTED PINS             read-only distillation by construction; pin rotation only via an explicit verdict-owning act
  ─▶ REGISTRATION SMOKE         lens readability checked BEFORE the TRELLIS spend; speck-tolerant component gate
```

## Rules of engagement (binding)

1. **Fix the lens, not the contract.** The zone-lens fix makes the lens *see* what the material map
   already encodes (brick ≠ cobble at ΔL 2.082); kit-extract's derived-bands requirement and the
   generator's kit requirement stay exactly as strict. Relaxing a contract to pass a subject is
   tuning-to-pass (E-25 Rule 3) and fails this epic.
2. **Analysis before construction on the form seam.** No new roof rungs until a region-level diff
   artifact (build roof vs GLB roof, per azimuth) names what reads wrong. Rungs built blind at this
   fit quality is how `end-fit-insane` happens.
3. **Distillation never judges.** A read-only distillation mode re-derives records from committed
   outputs and is **incapable of spawning the judge** (by construction, tested). Pin rotation —
   adopting new verdicts as canonical — happens only inside a ticket that explicitly owns verdicts,
   one judge run per view, no re-rolls (E-28 Rule 4 unchanged).
4. **Gate inputs before spending.** Registration runs the (fixed) zone lens and kit-extract dry
   against the concept **before** the TRELLIS/GLB spend; a refusal at registration is cheap and named.
   The component smoke tolerates declared sub-speck debris instead of failing on one mesh cell.
5. **Inherited in full:** frozen instrument (thresholds/azimuths/judge), E-24 durability, E-25
   anti-tuning, E-26 kit accountability, E-27/E-28 fit-don't-invent + cage, E-29 zero-blob on the
   generated path.

## Scope

**In:** (a) the **role-aware zone lens** — band classification against the committed material-map
roles with near-tone disambiguation (the map already separates brick/cobble; the lens must too), barn
records flipped on success; (b) the **roof-form seam, analysis-first** — a per-azimuth roof-region
diff artifact vs the GLB, then targeted fit/construction work on what it names (cottage gable ends,
gatehouse ridge, the 315° regression); (c) **pin protection** — read-only distillation mode +
pin-rotation policy; (d) **registration hardening** — pre-spend lens smoke in the S-094 checklist +
speck-tolerant glb-smoke; (e) the **proof milestone** — `generated:barn` end-to-end against the pinned
bar, legacy subjects re-judged once after the form work.

**Out:** new subjects beyond the barn; organic/sculpture; interiors; TRELLIS quality; any gate
threshold/azimuth/judge change; the brief/rubric (immutable).

## Candidate stories & DAG

```
S-117 role-aware-zone-lens ──┬─▶ S-120 registration-hardening ─┐
S-118 roof-form-seam ────────┼─────────────────────────────────┼─▶ S-121 barn-proof-milestone
S-119 pin-protection ────────┴─────────────────────────────────┘
```

- **S-117 — role-aware-zone-lens.** The T-092 band derivation classifies against the **material-map
  roles** (near-tone pairs disambiguated the way E-21 disambiguated the map itself) instead of raw
  color-dominance quantization. The barn's cobble field becomes a cobble-dominant band; the refusal
  records flip to derivations; committed zone maps for the legacy subjects re-verify (regenerate
  byte-identical or the diff is named and justified).
- **S-118 — roof-form-seam.** Analysis first (Rule 2): a **roof-region diff artifact** — build vs GLB
  at the four gate azimuths, region-by-region (gable ends, ridge, slopes, eaves) — that converts
  "major: form @ roof" into named, measurable deltas. Then targeted work on what it names: the
  cottage gable-end residual, the gatehouse ridge (invalid intersect + the 315° regression), refit
  under the cage. The diff artifact becomes a standing instrument (it rides beside the gate, GL-free
  where possible).
- **S-119 — pin-protection.** The read-only **distillation mode** (re-derive records from committed
  outputs; judge-spawning impossible by construction, tested) + the **pin-rotation policy** (canonical
  verdicts change only via an explicit verdict-owning ticket act, recorded with the old pin retired by
  name). Closes T-111 residual 4 properly; the T-116 revert and the kit-sweep incident are the
  motivating fixtures.
- **S-120 — registration-hardening.** The S-094 checklist gains a **pre-spend lens smoke**: zone lens
  + kit-extract dry-run against the concept *before* TRELLIS; refusals are cheap, named, and block
  registration. glb-smoke gains a **declared sub-speck tolerance** (the barn's one-cell failure mode)
  with the strict gate retained above the tolerance. Runs after S-117 (the smoke must run the fixed
  lens).
- **S-121 — barn-proof-milestone (terminal).** `generated:barn` end-to-end — the stalled proof run —
  against the **already-pinned bar** (the T-116 pin: kit presence PASS, ≥2/4 same-object azimuths,
  ≤10/2 gaps). Legacy subjects re-judged **once** after the S-118 form work (this ticket owns
  verdicts; T-114 reply policy governs malformed replies only). Honest outcomes per subject; journal +
  E-12.

## Definition of done

- **The bootstrap chain is unblocked at its root:** the barn's zone map derives (cobble-dominant band
  present), its kit extracts, `zoneMapRecord`/`kitRecord` flip from `null`, and `generated:barn` runs
  to verdicts — no contract relaxed anywhere (Rule 1).
- **The form seam is named, then moved:** the roof-region diff artifact exists for all subjects and
  azimuths; the targeted refits land under the cage; the re-judged verdicts move or the residuals are
  named with the diff deltas that explain them.
- **Pins are safe by construction:** distillation cannot judge (tested); pin rotation has a recorded
  policy and the stale-skin residual is closed through it.
- **Registration can't waste a spend:** a lens-refusable concept is caught before TRELLIS; sub-speck
  debris no longer fails a clean GLB.
- **The milestone bar:** `generated:barn` meets the pinned bar, or misses it with named causes —
  recorded either way. Durable, registry-only, reproducible; `npm test` green; journal + E-12.

## Orchestration notes (for the autonomous run)

- S-117, S-118, S-119 are mutually independent (disjoint seams: zone lens / roof cores + a new diff
  instrument / distillation-policy code) and can run in parallel. S-120 follows S-117. S-121 is
  terminal and **owns all judge runs** — no other ticket judges (the T-110/T-111 concurrency lesson;
  S-118's diff artifact is render-side analysis, not a judge call).
- **Legacy zone maps are pinned evidence**: S-117 must re-verify them byte-identical through the lens
  change, or name and justify every diff (the behavior-preserving-migration discipline from T-113).
- **GL-free where it counts:** the role-aware classifier, diff metrics, distillation, and smoke logic
  are pure/deterministic, unit-tested on synthetic inputs; renders and the single re-judge are the
  metered edges.
- **Honesty.** If the barn's bar is missed, if a legacy re-judge regresses (the budget-edge flap is a
  known instrument property), or if the roof diffs name something the fit ladder can't express, those
  are recorded findings — the epic's value is that first-run generalization becomes *diagnosable*, not
  that every number moves.
