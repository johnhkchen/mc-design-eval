# T-181-01 — Design

Implement BOTH loci (T-180-01 decision): **S** = graded style-distance replacing the binary cap (the
load-bearing, unit-proven fix); **R** = a concept-conditional rule in the `DiagnoseBuild` prompt (contract
level; live efficacy is S-182). Two cleanly separable commits so a reviewer can accept S and weigh R apart.

## The S fix — graded style-distance (the core decision)

Replace the flat `min(score, 40)` with a **breadth-graded cap** and make the per-replace penalty
**severity-respecting**, reusing the two existing constants (no new key → BO7 stays green):

```
for it in items:
  if wrong-style:
     penalty += (PENALTY[severity] ?? PENALTY.major) + WRONG_STYLE.distance   // severity-respecting + 1 distance unit
     wrongStyleDepts.add(department ?? `__item${i}`)                          // breadth = DISTINCT departments
  else:
     penalty += PENALTY[severity] ?? minor
score = clamp(100 - penalty, 0, 100)
b = wrongStyleDepts.size
if b > 0:
   gradedCap = max(WRONG_STYLE.cap, 100 - b * WRONG_STYLE.distance)           // 88,76,64,52,40 for b=1..5
   score = min(score, gradedCap)
```

Two changes, both grounded:

1. **Severity-respecting per-replace.** Was forced `PENALTY.major + distance` (32) regardless of severity —
   the AUDIT names this severity-blind floor. Now `PENALTY[severity] + distance`: a `minor` wrong-style costs
   20, a `major` 32, missing-severity defaults to **major** (preserves BO9; wrong-style is inherently
   serious). Respects the judge's own severity signal.
2. **Graded cap by breadth.** `b` = count of **distinct wrong-style departments** (the sanctioned
   style-distance — "more wrong-style departments ⇒ lower"). `cap(b) = max(40, 100 - 12·b)`. With 5
   departments, `b∈[1,5]` → cap ∈ {88,76,64,52,40}: one off element sits near the ceiling; wrong-in-every-
   department hits the floor `WRONG_STYLE.cap` (40, now repurposed as the wrong-in-all anchor). Monotone
   non-increasing in `b` — the binary collapse is gone.

**`distance=12` does double duty**: one "style-distance unit" applied both per-item (the surcharge above
severity) and per-department-of-breadth (the cap grade step). Coupling them is principled — it's the *same*
quantity (how far one wrong department is) used in both terms — and avoids a second tunable that could drift.

### Worked numbers (the separation the claim needs)

| Build | items | OLD score | NEW score |
|---|---|---|---|
| **faithful-except-one** (1 major ROOF replace, else complete) | 1 | min(68,**40**)=**40** | min(68, cap1=88)=**68** |
| **two-wrong** (2 major replace, ROOF+WALL) | 2 | min(36,40)=**36** | min(36, cap2=76)=**36** |
| **wrong-in-all** (5 major replace, one/dept) | 5 | min(0,40)=**0** | min(0, cap5=40)=**0** |

- OLD: faithful **40** vs two-wrong **36** — the cap CRUSHED faithful's true 68 into the two-wrong band
  (compression). NEW: faithful **68** clearly above two-wrong **36** above wrong-in-all **0** (decompressed,
  monotone). Faithful-vs-wrong-in-all spread: 40 → **68**. This is the "binary-cap collapse gone" claim.
- The per-item penalty does most of the grading once the cap stops crushing it; the graded cap is the safety
  ceiling that no longer flattens the top of the range. Both AUDIT defects addressed.

### Backward-compat (why BO7/BO9/BO10/BO11/BO13 stay green)

- BO7 — WRONG_STYLE unchanged (`{cap:40,distance:12}`), no new key. ✓
- BO9 — matched=40 (no wrong-style, no cap); wrong-style 3 majors ROOF/WALL/OPENING → penalty 96, score 4,
  b=3, cap3=64, min(4,64)=**4**; spread 36≥30. All assertions hold (majors unchanged at 32). ✓
- BO10 — incomplete absent → 72, b=0, no cap. ✓  BO11/BO13 — `itemStyleClass` untouched. ✓

### `critiqueEvidence` (additive, safe — BO5 checks fields not deepEqual)

Add `wrongStyleBreadth` (distinct wrong-style departments) and `gradedCap` (the cap applied, or `null`) so
the crater harness/FINDINGS report the new mechanism. Keep `wrongStyleCapped = nWrongStyle>0` (= style-
distance term active) for back-compat; doc that under grading it may not BIND for low breadth.

## The R fix — concept-conditional `DiagnoseBuild` prompt

Add one sentence to the `kind`-tagging instruction:

> Treat a present element whose material is in the **same style family** as the expected one — only a
> within-style *detail* differs or is missing — as `add` (the missing detail), **not** `replace`. Reserve
> `replace` for an element built in a genuinely **wrong** material/style versus what the concept calls for.

This is the WALL fix: faithful stone with missing quoins → `add` (recoverable), not capping `replace`. The
ROOF (genuinely brown vs grey) stays `replace` — correct, and S's graded cap stops it flooring the build.

- Re-render `prompt.golden.txt` deterministically (`bamlBatch` render mode, no metered call); **record the
  prompt diff** in this work dir; re-pin the local golden **in this ticket** (preflight: only the diagnose
  golden changes; no live-record sha, [[recognition-prompt-embeds-program-schema]] is recognition-scoped).
- **Efficacy is S-182's** — the falsifiable claim's own hedge: if a concept-conditional prompt still can't
  stop Layer A tagging faithful material `replace`, it's the reading → hand to the judge model. Unit level
  proves only that the contract now carries the rule.

## Alternatives rejected

- **New tuned constant `capStep`** — breaks BO7's one-source deepEqual and adds a driftable second knob;
  reusing `distance` is more principled (same style-distance unit).
- **Breadth = raw wrong-style item count** — conflates completeness with style-distance; the module + AUDIT
  sanction DEPARTMENTS as the breadth measure (two OPENING replaces are one department of wrong-ness).
- **R fix in scoring via string-overlap of present/expected** — the module explicitly forbids brittle
  keyword/string matching; concept-conditioning needs the concept, which only the judge sees. R belongs in
  the prompt.
- **Re-vote to validate R** — metered, forbidden here; that's S-182's live two-sided crater.
- **S-only (skip R)** — the AUDIT concludes BOTH are required for the live crater; doing R now (cheaply, at
  contract level) sets up S-182. Kept in a separate commit so S stands alone if R is contested.

## Sensitivity (reported, per "principled over tuned")

`distance=12`: cap grade {88,76,64,52,40}. Larger → steeper grade (faithful rewarded more, mid-breadth
punished harder); smaller → flatter (toward the old near-binary). Floor `cap=40` is the wrong-in-all anchor
(unchanged from E-40). The term is NOT fit to this fixture — it's a monotone distance over breadth; it
separates ANY faithful-except-k from wrong-in-all for k<5, not just the gatehouse.
</content>
