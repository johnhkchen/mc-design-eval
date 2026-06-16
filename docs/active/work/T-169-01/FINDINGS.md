# T-169-01 FINDINGS — the style-distance term, refereed on live data

Three sections, read against the falsifiable claim, **leading with how each failed**. Evidence:
`experiments/eval-alignment/results/corpus-referee.json` (full per-item triples persisted). Tier
`strong` (claude-opus-4-8), `VOTES=2`, noise band ±12. The headline: **the term does not crater — it
COLLAPSES both conditions to the floor.** This is the F1/F3 failure mode realized at full scale, and it
is the most valuable outcome this ticket could produce.

---

## 1. CRATER (AC #1) — COLLAPSED, not cratered

| condition | E-39 (severity-only) | **E-40 (new term)** | nWrongStyle/nItems (live) |
|---|---|---|---|
| A-matched (rustic build vs rustic concept) | 52 | **2** | 3/3, 4/4 |
| B-arc (vs classical arch) | 46 | **0** | 4/5, 5/5 |
| B2-chapelle (vs gothic) | 40 | **2** | 4/5, 3/3 |
| C-control (classical concept + rustic pack) | 58 | **0** | 5/5, 4/4 |

Spread **A−B = 2**, deep inside the ±12 noise. The E-39 scalar tied everything near ~50 ("DID NOT
CRATER"); the E-40 term ties everything near **~0**. It did not separate matched from wrong — it
**floored both**.

**Why (the load-bearing observation):** live Layer A emits a non-empty `present` AND a non-empty
`missing` for **every divergent department**, in every condition — including the MATCHED one. Its
diagnostic register is "here is what the build has, here is what the style wants." So `itemStyleClass`
returns `"wrong-style"` for nearly every item (3–5 of every 3–5), the cap fires, and the breadth penalty
(`32` per wrong-style item) drives the pre-cap score below the floor. The clean matched gatehouse — a
build that reads correctly as its own concept — scores **2/100**.

Proof, verbatim from the matched A condition (the build is correct; the term still capped it):
> `[WALL/major] class=wrong-style present:"Thin ragged dark vertical-plank walls…" missing:"Cobblestone
> field, stone_brick quoins…"` — the model described the build's actual walls (present) **and** what the
> rustic style wants (missing). Structurally identical to a wrong-material replace. The classifier cannot
> tell them apart without reading content (the AC-forbidden brittle path) or a typed `kind` tag.

This is exactly **BO11's pinned F1 boundary** ("present-but-detail-incomplete is structurally
indistinguishable from wrong-material replace") — not an edge case, the **dominant** case on live output.

---

## 2. CORPUS AGREEMENT (AC #2) — 3/4 easy pairs ordered right, but on collapsed magnitudes; contested middle untestable

| pair (all confidence `high` ⇒ "easy") | matched | wrong | margin | ordering agrees? |
|---|---|---|---|---|
| gatehouse-vs-arc | 2 | 0 | +2 | yes (barely) |
| gatehouse-vs-chapelle | 18 | 2 | +16 | **yes (clean)** |
| cottage-vs-arc | 0 | 2 | **−2** | **NO — matched scored BELOW wrong** |
| cottage-vs-chapelle | 8 | 4 | +4 | yes (barely) |

**Easy bucket: 3/4 ordered correctly. Contested bucket: EMPTY by construction** — the S-167 corpus
deliberately excludes its only contested pair (`cottage-cream-vs-pink`, sub-threshold same-style noise),
so *agreement on the contested middle cannot be tested here*. That is the honest answer to AC #2's
"separately," not a dodge: we can confirm the easy pairs, we have nothing to say about the middle.

**The honest read of the 3/4:** only **one** pair (gatehouse-vs-chapelle, +16) separates beyond noise.
The other three margins are ±2–4 — ordering of floored noise, not signal. And on `cottage-vs-arc` the
term **inverts** the human label: it floored the matched cottage (0) *below* the wrong-style arc-A (2).
So the term agrees with the human only on gross, lucky orderings and **mis-orders a clean pair** — it
captures gross style distance weakly and inconsistently, exactly the claim's "captures only gross errors
— say so," compounded by the over-penalty from §1.

---

## 3. BAKE-OFF (AC #3) — split vs fused now discriminates; SPLIT edges ahead (reverses E-39)

On the corpus's **4 single states** (8 votes), dispatch correctness vs the analyst ground-truth
department:

| state | ground | split | fused |
|---|---|---|---|
| barn-roofless | ROOF | ROOF, ROOF ✓✓ | ROOF, ROOF ✓✓ |
| barn-holey-walls | WALL | OPENING✗, WALL✓ | WALL, WALL ✓✓ |
| cottage-plain-upper | WALL | WALL, WALL ✓✓ | WALL✓, ROOF✗ |
| gatehouse-gaping-gate | OPENING | OPENING✓, WALL✗ | WALL✗, ROOF✗ |

**split 6/8 (75%) · fused 5/8 (62.5%) ⇒ SPLIT WINS.** This **reverses** the E-39 result (split 3/6,
fused 6/6, "FUSED WINS") — but note E-39 ran only 2 states and the cottage split mis-routed WALL→CHIMNEY
all three votes. With ≥8 states the verdict can finally move, and it moves to split — **marginally** (one
row apart). The decisive cell is `gatehouse-gaping-gate`: the typed split path names OPENING; the fused
free-text region path never calls the gate the worst defect (WALL, ROOF) — the typed `department` buys
the dispatch the free-text `region` misses.

**Caveat, stated plainly:** the style-distance term (§1/§2) does **not** touch dispatch routing — this
section tests whether a bigger state set has the power to separate split from fused, not the term. It
belongs to the E-39 claim-1 thread; reported here because the S-167 corpus is what made ≥8 states
possible. Margin is one row; do not over-read it.

---

## How it landed vs the falsifiable claim

The claim listed four failure modes. We landed squarely in **"craters but disagrees with the human
(over-penalizes a close style → recommend graded re-calibration, NOT promotion)"** — and worse than the
claim anticipated: it does not even crater (separate), it **collapses both** to the floor, and on one
easy pair it inverts the human label. The term is **reading-blind in the way the scalar can't fix**: the
blindness the E-39 retro located "in severity→scalar" was real, but the E-40 structural fix traded
under-penalization for **indiscriminate over-penalization**, because the live `present` field — which the
new term keys on — is populated for every item, not just replacements. The recommendation follows.
