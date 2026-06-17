# T-185-01 — FINDINGS (the T-184-01 verdict, read at full strength)

**Verdict: `DO-NOT-PROMOTE` (`recommendation.go = false`).** The recalibrated style-distance term, tested
against the S-183 decoupling corpus at **VOTES=6**, **tracks the PACK, not the concept image** — the T-182-01
confound generalizes to the population. **Branch B** (concept-image-conditioning localization + follow-on stub)
is the matching act. Source: `experiments/eval-alignment/results/style-agreement.json` (schema
`style-agreement/v1`, `labelSource: llm-proxy`, `licensing: false`).

## 1. Pack-vs-concept-image decomposition — the load-bearing result

The 2×2 over the 7 non-middle states (pack ∈ {matched, foreign} × picture ∈ {right, wrong}):

| cell | states | mean score |
|---|---|---|
| **matchedRight** (rustic pack, right picture) | gh-match, ct-match, bn-match | **53** |
| **matchedWrong** (rustic pack, WRONG picture) | gh-samepack-classical, gh-samepack-cottage, ct-samepack-gatehouse, bn-cross | **45** |
| **foreignRight** (guildhall pack, right picture) | gh-wrongpack, ct-wrongpack | **8** |
| **foreignWrong** | (none — corpus carries no such cell) | n/a |

- **conceptImageEffect = matchedRight − matchedWrong = 53 − 45 = `8`** — swapping the *picture* from right to
  wrong, holding the pack right, **barely moves the score**.
- **packEffect = matchedRight − foreignRight = 53 − 8 = `45`** — swapping the *pack* from matched to foreign,
  holding the picture right, **collapses the score**.
- `packEffect (45) ≫ conceptImageEffect (8) + NOISE (12)` → **PACK-DRIVEN**.

The single most damning datum: **`ct-wrongpack` scored a flat 0** (votes `[0,0,0,0,0,0]`) — a cottage built
*faithfully to its own concept image* but in the guildhall pack earns **zero**. The term reads the materials,
not the picture.

**Per-subject** (the confound is not an artifact of one subject):

| subject | conceptImageEffect | packEffect | note |
|---|---|---|---|
| gatehouse | **−12** | +31 | the WRONG-picture gh actually scored *higher* (59) than the right-picture gh (47) |
| cottage | +19 | +46 | pack effect more than double the picture effect |
| barn | +32 | n/a (no foreign cell) | the only subject where the picture effect is large — but no pack contrast to weigh it against |

Even where the picture effect is positive (cottage, barn), the pack effect dominates wherever it can be
measured. On the gatehouse the term is *inverted*.

## 2. Term-vs-label pairwise agreement (proxy labels; easy vs hard-middle SEPARATELY)

`overall 3/8 (0.38)` · `easy 2/3 (0.67)` · **`hardMiddle 1/5 (0.20)`** — far below the 0.70 bar.

The term disagrees with the labels even on the easy pairs, and the disagreements are *exactly* the pack
confound made concrete:

| pair | bucket | A (score) vs B (score) | termPick | label | proxyVotes |
|---|---|---|---|---|---|
| **E1** | easy | gh-match (47) vs gh-samepack-classical (61) | **B** | A | A,A,A,A,A,A |
| H3 | hard | gh-mid-gate (49) vs gh-samepack-classical (61) | **B** | A | A,A,A,A,A,A |
| H5 | hard | ct-mid-plain (23) vs ct-samepack-gatehouse (27) | **B** | A | A,A,A,A,A,A |

In E1 the term ranks the **wrong-picture classical concept (61) ABOVE the faithful gatehouse (47)** — because
the wrong-picture build still wears the rustic pack and scores well against the pack-derived spec. The proxy
(and intended) unanimously pick the faithful build. Same inversion in H3 and H5 (H5's "B" is a *wrong-subject*
build). The term agrees only where the pack and picture happen to co-vary (E2, E3, H1).

## 3. Inter-label self-consistency — the gate is NOT ill-posed

`interLabel: LABELABLE — hard-middle self-consistency 0.9 ≥ 0.67`. The proxy panel is near-unanimous on the
contested pairs (most 6/6). **This matters:** the disagreement in §2 is not the term losing to noise on
ill-posed pairs — it is the term **disagreeing with stable, labelable ground truth**. The negative is real,
not an artifact of an unanswerable gate.

`concordance: tau = −0.14 (C=3, D=4)` — the term's pairwise ranking is, if anything, *slightly anti-correlated*
with the labels.

## 4. The branch chosen, and why

**DO-NOT-PROMOTE → Branch B.** Three independent reasons, any one sufficient:
1. **PACK-DRIVEN** decomposition (packEffect 45 ≫ conceptImageEffect 8) — the pre-registered load-bearing
   failure from T-182, now confirmed across 3 subjects.
2. **Hard-middle agreement 0.20** — the term is wrong on the contested pairs, against labelable ground truth.
3. **Licensing** — proxy labels (`licensing:false`) can only refute, never license; even a positive result
   could not have promoted autonomously. Here the result is negative, so the point is moot — but the freeze was
   never on the table this loop ([[pin-guard-is-structural]]).

This is a **sharp, publishable negative** ([[anti-hedge-falsifiable-commitment]]): the E-45 recalibration fixed
the *mechanism* (replace→add, `replaceContrast +0.245`) but did **not** make the term read the picture. The
residual is named precisely in `LOCALIZATION.md`; the fix is scoped in the `T-186-01` / `E-47` follow-on stub.
**Nothing under `measurements/` is touched** — the term stays in `src/`, unpromoted.
</content>
