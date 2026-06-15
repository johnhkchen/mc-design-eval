# T-166-01 — FINDINGS (the honest record, AC3)

**This ticket closes E-39 by measuring the epic's own bet. Both falsifiable claims landed on the
*embarrassing* side — which the ticket names as the most portfolio-worthy outcome. Nothing is softened.**

Two claims, two live runs (metered, `claude -p` strong tier, NOT the frozen instrument). Lead with how
each fails.

---

## Claim 2 — the within-family crater: **DID NOT CRATER** (the headline negative)

**Claim:** a *clean* build scored against a same-family **wrong-style** concept must score far below the
same build against its **matched-style** concept, under the per-style Layer-A judge — a spread well outside
the eval's noise, where the E-38 probe (on a defective build) left it flat at 22–32.

**Run** (`experiments/eval-alignment/clean-wrong-style.mjs`, 4 conditions × 2 votes; build = the clean
rustic gatehouse `builds/gatehouse/new-roof`, program held fixed). Derived 0–100 = `100 − Σ(major 20 /
minor 8)`:

| cond | concept | style profile | mean score |
|------|---------|---------------|-----------:|
| A MATCHED | rustic gatehouse | rustic | **52** |
| B WRONG | classical arch (arc-A) | guildhall | **46** |
| B2 WRONG | Gothic cathedral (chapelle) | guildhall | **40** |
| C CONTROL | classical arch (arc-A) | **rustic** | **58** |

Spreads: **A−B = 6, A−B2 = 12** — *inside* the E-38 ±12 noise band. **No crater.** Worse for the claim:
**C (58) ≥ A (52)** — holding the profile at rustic, swapping the concept from the matched gatehouse to a
*classical arch* moved the score by **zero** (actually slightly up). The score is indifferent to whether
the concept matches the build.

**But it is NOT simply "cosmetic" — the nuance matters (and it's good news for one layer):** the per-style
`expected` *does* change the **qualitative content** of the critique. Under the guildhall profile the judge
correctly named guildhall-specific gaps — *"chiseled_stone_bricks quoins, polished_diorite pilasters,
plinth course… stone_bricks voussoir dressing around the arch… deepslate_tiles roof field"* — none of which
appear under the rustic profile (which names *"dark_oak_log timber frame, spruce_door, eave overhang"*).
This is exactly DG7's deterministic result, now **confirmed live**: the style-aware judge *reads* the right
grammar and asks for the right elements.

**Where the blindness actually lives:** in the **severity → scalar**, not the reading. The judge always
finds ~2–3 *major* construction gaps regardless of concept/style (the clean gatehouse has the same number
of "missing element" gaps whether it's measured against a rustic cottage-grammar or a classical
ashlar-grammar), so the derived score sits at 40–58 across the board. The measure counts **"how many
construction elements are missing"**, not **"how far is this build's style from the target's identity."**
A *present-but-wrong-style* element (a rustic timber gable where a classical hipped ashlar roof is wanted)
is not scored as a major style **defect** — it's scored as "a roof is present." That is the precise,
localized blindness.

**A second, honest confound (named, not hidden):** the clean build is not clean *enough*. The matched
baseline is only **A = 52**, not ~85 — the per-style judge finds 2 majors (missing arch dressing, missing
frame, missing eave overhang) even against the build's own concept. A low ceiling compresses the spread
available to any crater. So two prerequisites are entangled: a cleaner build *and* a style-distance metric.

### Claim-2 next gate (localized)
A **deeper-measurement epic**: replace the defect-*count* severity with a **style-distance** term — a
present-but-wrong-style element must register as a MAJOR style defect (the Layer-A `present` already names
the wrong idiom; the severity rule must penalize it), or add a dedicated style-fidelity axis orthogonal to
"is each element present." The per-style `expected` **reading** is sound (claim of S-165 holds); the
**scoring** is what's style-blind. Plus a cleaner build (S-160 geometry) to lift the matched ceiling so a
crater has room to open. Evidence: `results/clean-wrong-style.json`, beside-concept PNGs
(`clean-vs-matched.png`, `clean-vs-wrongstyle.png`, `clean-vs-wrongstyle-2.png`).

---

## Claim 1 — split beats fused on dispatch: **NOT SUPPORTED** (fused ties-or-wins; under-powered)

**Claim:** the split path (diagnose→route) routes to the worst defect's correct **department** more often
than the fused `WorkshopReply`.

**Run** (`experiments/eval-alignment/bakeoff.mjs`, 2 states × 3 votes):

| state | ground (analyst) | split (dispatch[0]) | fused (region→dept) |
|-------|------------------|---------------------|---------------------|
| barn-r1 (roofless shell) | ROOF (high conf) | **ROOF** ✓ ×3 | **ROOF** ✓ ×3 |
| cottage-newroof (holey upper walls) | WALL (med conf) | CHIMNEY ✗ ×3 | **WALL** ✓ ×3 ("upper storey walls") |

**Result: split 3/6, fused 6/6 → the split did NOT beat fused** (it lost on this sample). The split's
two-call cost buys no dispatch gain here; per the ticket that routes to *"collapse the split — report"* —
**unless** re-tested on a properly powered corpus (below), because the sample is genuinely too weak to be
decisive:

1. **Two states, one of them ambiguous.** On the *unambiguous* state (barn ROOF) the paths **tie** — both
   nail it 3/3. The verdict hinges entirely on the *one* ambiguous state. There, the "worst defect" is
   genuinely contestable: the cottage concept **has a prominent chimney the build lacks** (split's CHIMNEY
   is a *real* defect, consistently chosen 3/3), the upper-storey half-timber is **missing** (fused's WALL
   is also real and matches the analyst label). Both paths found a true defect; they ranked different ones
   worst. "Split wrong" is partly an artifact of the analyst choosing WALL over CHIMNEY.
2. **The result was adapter-sensitive — and that sensitivity is itself a finding.** The fused path emits a
   free-text `region`; scoring it needs a lossy `region→department` adapter. As first written, the adapter
   filed `"upper storey walls"` to **ROOM** (the keyword `"storey"` outranked `"walls"`), giving a **TIE
   (3/3, 3/3)**. The defensible fix — a region that says *walls* is a WALL defect; "storey" is an envelope
   level, not a room — flips it to **fused 6/6**. A free-text channel that a keyword-precedence choice can
   swing between TIE and 6/6 is a structural argument **for** the typed dispatch the split emits *by
   construction* (the split needed no adapter). So the split's value, if any, is the **typed contract + the
   per-style critique content** (claim 2 showed that content really does change), **not** dispatch accuracy.

### Claim-1 next gate (localized)
The dispatch bake-off **cannot be settled on a 2-state, soft-labeled corpus.** Prerequisite: a
**consensus-labeled multi-department defect corpus** — ≥8–10 (concept, build) states spanning all five
departments, each worst-defect labeled by majority vote (not one analyst), excluding states where the
worst defect is contestable. Our build corpus could not supply this today: early rounds are **roofless
(ROOF-clustered)**, later builds are **otherwise-complete** (no single glaring department defect), and the
one roofless gatehouse has only **one** saved azimuth (can't feed the 4-render gate) — all excluded and
logged in `results/bakeoff.json`. Secondarily, once idiom-**appliers** exist (the generator gap T-164-02
named), score on **loop outcome** (did the dispatch make the build climb?), not dispatch-vs-label.

---

## Bottom line for E-39

The epic's two bets, measured against themselves: **(1) the split does not beat the fused judge on dispatch
correctness** on the evidence available — collapse it, or re-test on a powered corpus; its defensible value
is the typed contract and the per-style critique *content*, not routing accuracy. **(2) The per-style
`expected` reads style correctly but does not yet produce a within-family *scalar* gradient** — the
blindness moved from "the judge can't see style at all" (E-38) to "the judge sees style but scores element
*presence*, not style *distance*." Both are honest negatives that **localize the next gate precisely** — a
style-distance severity term and a powered, consensus-labeled corpus — which is exactly what a referee
ticket is for. The frozen instrument was never touched; everything here is the creation loop.
</content>
