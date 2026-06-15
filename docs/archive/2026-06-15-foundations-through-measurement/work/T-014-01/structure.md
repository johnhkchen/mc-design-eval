# Structure — T-014-01: consolidate-overnight-run

The blueprint: exact edits to the one file this ticket changes. No code; the "shape" of the journal edits.

## Files

| file | change |
|------|--------|
| `docs/knowledge/design-learnings.md` | **MODIFIED** — 1 new top banner, 4 per-principle verdict lines, 1 new tail log entry |
| `docs/active/work/T-014-01/*.md` | **CREATED** — RDSPI artifacts (this ticket's process record) |
| everything else | **UNTOUCHED** — frozen rubric/brief; no source change |

No files created or deleted in the repo proper besides the work-dir artifacts. No `summary.json` edits, no
run-dir changes (the runs are durable evidence; consolidation reads them, never rewrites them).

## Edit 1 — `🌅 Morning brief` banner (insert in *Principles (distilled)*)

**Location:** immediately **after** the existing `🎯 Rubric update` blockquote and **before** the
`⚠️ Measured correction (rubric v1 …)` blockquote — i.e. at the top of the current-state banner stack, so it
is the first thing read. Anchor string for the Edit: the line beginning `> **🎯 Rubric update —`'s closing,
or insert before `> **⚠️ Measured correction (rubric `v1`…`.

**Shape (blockquote so it reads as a banner):**

```
> **🌅 Morning brief — overnight chain S-006…S-009 consolidated (2026-06-05, T-014-01).**
> **Champion: UNCHANGED** (committed HEAD, the 015 "NO LARGE FLAT FIELDS" menu, `vRefRevise-designdoc`).
> No lever promoted. Categorical band (median-of-3): overall **strong (3/3)** · proportion **strong** ·
> color **strong** · fidelity **strong** · **detail competent** (the lone holdout / climb target).
> Exemplar render run 014 (Taj); re-confirmed off-domain on 019/021/022.
> **What moved:** nothing in the champion — a *confirmation* night. P12 (color) + P13 (one plane)
> generalized to four new references (019 Hōryū-ji, 020 Sainte-Chapelle, 021 Arc, 022 mausoleum), holding
> overall strong 3/3; P12 got its first partial *colorful-reference* datum (022 two-tone).
> **What didn't:** detail (still competent; both detail levers failed — 016 flat, 017 regressed
> proportion); the persona (S-013) and effort (S-009) A/Bs are **unfinished** (only control arms ran);
> P14 regressed once (020). **Spot-check:** 020 round-0 vs render (P14 regression), 021 render (the lone
> detail lift = whack-a-mole), 022 vs 008 render (cumulative progress).
> **Next experiment (single):** a **whole-facade fenced ornament pass** (the P15 cure) — a detail-only
> revision auditing every plane wider than ~6 blocks. Cheap cleanup first: finish the persona-ON + effort-
> HIGH arms (wiring already in the tree). Run IDs: 014/016/017/019/020/021/022/023/024/025.
```

## Edit 2 — four per-principle verdict lines

Append one bold-tagged sentence to the **end of each principle's body** (P12, P13, P14, P15). Anchor on the
last sentence already present in each principle (verified to be unique in Research).

- **P12** — after the current `**Scope: load-bearing across FOUR pale conflict references AND
  near-neutral-but-protective on ONE two-tone agreement reference (mausoleum, run 022).**` add:
  `**Chain verdict (T-014-01): PROMOTE/reinforce — four off-domain confirmations in one night (019/020/021/022), color=strong every time; the only open scope is the still-untested fully-polychrome reference (022 was two-tone).**`

- **P13** — after `…it is a rule about dimensionality, not about minarets.` add:
  `**Chain verdict (T-014-01): PROMOTE/reinforce — held across pagoda tiers (019), Gothic verticality (020), single colossal opening (021), and stacked roof-eaves + battered walls (022); proportion never regressed *from* the rule. Caveat: the detachment hazard itself was un-exercised on 021/022 (no freestanding parts), so the headline is corroborated, not re-stressed, there.**`

- **P14** — after the last sentence of P14 (currently ending `…unless fenced.`) add:
  `**Chain verdict (T-014-01): SCOPE — reference-dependent ≈coin-flip; this chain held/lifted 019/021/022 and regressed 020 (strong→competent, a recessed portal+rose traded for a flat gold slab). Running tally helped 014/019/021/022, regressed 013/017/020. "Judge both rounds, keep the better" is now strongly indicated (symmetric: keeps render on 021, round-0 on 020).**`

- **P15** — after the last sentence of P15 (currently ending `…not a clause that lists example fields the
  model can satisfy locally while opening a new one elsewhere.`) add:
  `**Chain verdict (T-014-01): REINFORCED; both dedicated detail levers DISCARDED — S-006 relief panels (run 016) left detail competent; S-010 texture grain (run 017) left detail competent AND regressed proportion strong→competent. Neither met the robust-lift promotion bar; champion unchanged. The cure remains a whole-facade fenced ornament pass, not another menu clause.**`

## Edit 3 — consolidation tail entry (append to *Attempt log*)

**Location:** end of file, after the run-022 entry (the log is "newest last").

**Shape (~45 lines):**

```
### Consolidation · overnight chain S-006…S-009 · 2026-06-05 (T-014-01, not a trial)
[1–2 line framing: synthesis pass, no new trials, champion unchanged]

**Champion (unchanged, for the next chain to start from):** [the band block, run IDs]

**Detail levers — BOTH DISCARDED (the night's hard negative).**
- S-006 / run 016 (relief panels): [scores] — non-promotion, never committed.
- S-010 / run 017 (texture grain): [scores incl. proportion regression] — non-promotion, reverted.
  [one line: why neither promoted; champion stays the 015 menu; ties to P15]

**Generalization runs — P12/P13 held 4×, P14 mixed (already journaled in full above).**
[one-line pointer per run 019/020/021/022 with its headline; no re-statement of the full entries]

**Knob A/Bs — BOTH INCONCLUSIVE (incomplete experiments, honest record).**
- Persona (S-013): OFF=023 strong 3/3; ON=025 built round-0, never rendered/scored. No verdict.
- Effort (S-009): DEFAULT=024 strong 3/3; HIGH never launched. No verdict.
  [one line: the wiring DID land — `--system-prompt`/`system` + `--effort`, additive, inert by default,
   uncommitted in the working tree; finishing each is one command + a judge]

**Why runs 016/017/023/024/025 have no standalone entries above:** [one line — non-promotions / incompletes,
recorded here by reference instead, per the consolidation’s proportional-record decision]

**Net + next:** [confirmation night; detail is the sole climb target; single next experiment = whole-facade
fenced ornament pass; cheap cleanup = finish the two knob arms]
```

## Ordering & interfaces

1. Edit 1 (banner) → 2. Edit 2 (four verdict lines) → 3. Edit 3 (tail entry). Order is independent (no edit
   depends on another's anchor), but doing the banner first front-loads the read-first payload.
2. **Interface invariant:** every prior categorical score string in the file is left byte-identical — no
   re-scoring, no renumbering of principles, no touching P1–P11. New text is purely *additive*.
3. **Verification interface:** after edits, `grep` for each new tag (`🌅 Morning brief`, `Chain verdict
   (T-014-01)` ×4, `### Consolidation ·`) confirms all six insertions landed; `npm test` confirms no source
   regression; the cited run IDs all resolve to real `summary.json` files (reproducibility AC).
