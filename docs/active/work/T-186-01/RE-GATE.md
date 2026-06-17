# T-186-01 — RE-GATE (the concept-image-anchored term, judged at VOTES=6)

**Verdict: `DO-NOT-PROMOTE` (`recommendation.go = null`, INCONCLUSIVE) — but a SHARP, decoupling
improvement, not a flat negative.** The picture re-frame collapsed the E-46 pack confound (~4×) and
**flipped term-vs-label agreement from 0.20 → 1.00 on the hard middle**, yet the decomposition lands
**MIXED** (the picture effect now *leads* the pack effect but does not clear the +NOISE margin). This
is a **split** (agreement passes, decomposition does not) — and the AC is explicit: *do not promote on
a split.* `measurements/` untouched; nothing staged.

Source: `experiments/eval-alignment/results/style-agreement.json` (`style-agreement/v1`, VOTES=6,
`labelSource: llm-proxy`, `licensing: false`). Compare against T-185-01 `FINDINGS.md`.

## 1. Pack-vs-concept-image decomposition — the confound collapsed, the ordering reversed

| cell | states | **T-186 mean** | T-185 mean |
|---|---|---|---|
| **matchedRight** (rustic pack, right picture) | gh/ct/bn-match | **21** | 53 |
| **matchedWrong** (rustic pack, WRONG picture) | gh-samepack-classical, gh-samepack-cottage, ct-samepack-gatehouse, bn-cross | **3** | 45 |
| **foreignRight** (guildhall pack, right picture) | gh-wrongpack, ct-wrongpack | **9** | 8 |

- **conceptImageEffect = 21 − 3 = `18`** (T-185: 8) — swapping the *picture* now moves the score
  **2.25× more** than before. The term reads the picture.
- **packEffect = 21 − 9 = `12`** (T-185: **45**) — swapping the *pack* now costs **¼** of what it did.
  The pack-material confound largely collapsed.
- **The ordering REVERSED**: T-185 was `packEffect 45 ≫ conceptImageEffect 8` (PACK-DRIVEN); T-186 is
  `conceptImageEffect 18 ≥ packEffect 12` — the picture *leads*. But 18 − 12 = 6 < `NOISE(12)`, so the
  verdict is **MIXED**, not PICTURE-DRIVEN. The bar (`conceptImageEffect > packEffect + 12`) is missed
  by 6 points.

**Per-subject** (the reversal is not one subject):

| subject | conceptImageEffect | packEffect | T-185 CIE / PE |
|---|---|---|---|
| gatehouse | 14 | 17 | −12 / +31 |
| cottage | 18 | 3 | +19 / +46 |
| barn | 21 | n/a (no foreign cell) | +32 / n/a |

The gatehouse **un-inverted** (CIE −12 → +14: the wrong-picture build no longer outscores the
faithful one) but still carries the only residual pack lead (PE 17 > CIE 14 — see §3). Cottage now
reads almost purely by picture (PE 3). Barn unchanged (no pack contrast).

## 2. The crux cells moved the RIGHT way (real decoupling, not re-coupling)

The claim's stated failure mode — *"picture effect rises only by re-coupling to the pack"* — is
**refuted**. The decoupling cells moved as predicted:

| crux state | cell | **T-186** | T-185 | moved |
|---|---|---|---|---|
| **ct-wrongpack** (faithful cottage, guildhall pack) | foreignRight | **16** | **0** | ✅ rose off the floor |
| gh-samepack-classical (rustic pack, WRONG picture) | matchedWrong | **1** | 61 | ✅ collapsed |
| ct-samepack-gatehouse (rustic pack, WRONG picture) | matchedWrong | **1** | 27 | ✅ collapsed |
| bn-cross (rustic pack, WRONG picture) | matchedWrong | **4** | — | ✅ floored |
| **gh-wrongpack** (faithful gatehouse, guildhall pack) | foreignRight | **1** | 0 | ❌ stayed floored |

T-185's single most damning datum — `ct-wrongpack` flat **0** (a faithful build in the wrong pack) —
is **fixed**: it now scores **16**, on par with matched builds. The wrong-picture builds all
collapsed. Only **gh-wrongpack** failed to recover (§3).

## 3. Where the residual lives (the successor scope)

Two mechanisms keep the decomposition at MIXED rather than PICTURE-DRIVEN:

1. **Matched-build compression (the dominant cause).** `matchedRight` fell **53 → 21**: picture-
   anchoring grades blocky Minecraft renders against *concept ART*, and a faithful voxel build still
   diverges from the painting in 2–3 departments (it is blocky; the art is not). So even the right
   answer floors near ~20, **shrinking the dynamic range** — the margin that must clear `NOISE(12)`.
   The ordering is correct; the *scale* is compressed. Per-state votes confirm it (gh-match
   `[32,40,16,20,0,0]`, bn-match `[0,0,32,0,40,76]`): high variance, no headroom. **The successor
   lever:** a voxel-vs-art tolerance so a blocky-but-faithful element is not flagged wrong-style —
   restoring matched headroom and widening the margin.
2. **gh-wrongpack floored (1).** The faithful gatehouse in the guildhall pack stays at ~1 while
   ct-wrongpack recovered to 16. The gatehouse render evidently still reads as diverging from its
   concept under the guildhall vocabulary — the one place a pack residue may persist. Worth a targeted
   look (is it the synthetic GATEHOUSE_PROGRAM grounding, or a genuine render-vs-art gap?).

## 4. Agreement — the axis that PASSED, decisively

`overall 8/8 (1.00)` · `easy 3/3 (1.00)` · **`hardMiddle 5/5 (1.00)`** · `tau = +1 (C=8, D=0)`.

T-185 was `overall 3/8`, **`hardMiddle 1/5 (0.20)`**, `tau −0.14`. The re-frame **inverted every
disagreement**, including the three T-185 called out:

| pair | T-185 termPick / label | **T-186 termPick / label** | fixed |
|---|---|---|---|
| **E1** gh-match vs gh-samepack-classical | B / A (term ranked wrong-picture 61 > faithful 47) | **A / A** (18 > 1) | ✅ |
| H3 gh-mid-gate vs gh-samepack-classical | B / A | **A / A** (3 > 1) | ✅ |
| H5 ct-mid-plain vs ct-samepack-gatehouse | B / A | **A / A** (10 > 1) | ✅ |

The term now ranks the faithful build above the wrong-picture build on **every** pair. Inter-label
self-consistency `0.9 ≥ 0.67` (LABELABLE) — the agreement is against stable ground truth, not noise.

## 5. The verdict, read against the claim

The falsifiable claim **does not clear its own bar**: it required PICTURE-DRIVEN
(`conceptImageEffect > packEffect + NOISE`) AND hard-middle ≥ 0.70 AND crux cells moving right.

- crux cells moved right ✅ · hard-middle agreement 1.00 ≫ 0.70 ✅ · matched builds **regressed** (53→21,
  a stated failure trigger — though as *compression*, not *inversion*) · decomposition **MIXED**, not
  PICTURE-DRIVEN ❌ (missed by 6 points, inside the noise band).

Two of three pass emphatically; the headline decomposition lands one noise-band short. Per the AC
(*"a result that does not flip the decomposition is the result; do not promote on a split"*): the
honest call is **DO-NOT-PROMOTE (INCONCLUSIVE)**. `licensing:false` (proxy) makes this `go=null`
regardless — a proxy can refute or recommend, never license; the human gate is untouched and was never
on the table this loop ([[pin-guard-is-structural]]).

**This is a publishable, directional result** ([[anti-hedge-falsifiable-commitment]]): E-45 fixed the
mechanism; **E-47 made the term read the picture** — confound ¼'d, agreement perfected, every E-46
inversion reversed — but the *measurement scale collapsed* under voxel-vs-art grading, so the effect
margin sits one noise band short of the strict gate. The named residual (matched-build compression +
gh-wrongpack) is the successor's scope. **Nothing under `measurements/` is touched; the term stays in
`src/`, unpromoted.**
