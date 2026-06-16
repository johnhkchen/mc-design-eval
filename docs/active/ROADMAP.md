# Roadmap

**Where we are (2026-06-16).** Foundations → Measurement archived (E-01…E-38) at
`docs/archive/2026-06-15-foundations-through-measurement/`. Retro:
`docs/findings/2026-06-15-sprint-retro-foundations-through-measurement.md`.

Walls done (geometry closes dense + sparse; skin reads as construction). **E-39 done** — built the
two-layer structured-feedback machinery and ran the referee, which **refuted both headline bets** and
localized the real gate. The binding constraint is now precisely **the scalar scoring step**, plus the
roof.

**Governing:** `docs/knowledge/project-direction.md` (the differentiator is the measurement, not prettier
builds) + `docs/knowledge/anti-hedge-directive.md` (every epic states how it can fail).

---

## E-39 outcome (done) — the machinery works; the scalar is the gate

Built: typed `Department` contract (generated from the idiom-registry), split Layer A (per-style diagnose)
/ Layer B (unified route), a declared `style`, and a genuinely-different second style (guildhall). The
referee (T-166-01) then landed **both bets NEGATIVE — the valuable result**:

- **Clean × wrong-style did NOT crater:** matched 52, wrong-style 46/40, control 58 — inside the ±12
  noise. *But not cosmetic:* the per-style judge reads style correctly (names guildhall quoins/pilasters/
  voussoirs). The blindness is in **severity → scalar** — the score counts *missing-element presence*, not
  *style distance*; a present-but-wrong-style element isn't scored as a major defect.
- **Split did NOT beat fused on dispatch** (split 3/6, fused 6/6) — but under-powered (2 states) and the
  one miss is a genuinely contestable worst-defect; the verdict was *adapter-sensitive*, which is an
  argument **for** the typed dispatch.

Both negatives converge on the same place: **scoring, not reading.**

## E-40 outcome (done) — the term over-caps; root cause certain

Built the labeled corpus + the style-distance severity term + the referee. Result, **third honest
negative in a row, each sharper than the last**:

- **Did NOT crater — it COLLAPSED.** Matched=2, wrong=0/2 (E-39 baseline was 52/46/40/58). The term floors
  *everything*, including a build against its own concept.
- **Root cause is mechanical and certain:** the structural `itemStyleClass` calls an item "wrong-style"
  whenever live Layer A emits a non-empty `present` AND `missing` — which is *almost every* item. The cap
  fires on correct builds. **Recommendation: DO NOT PROMOTE; re-calibrate via a typed `kind` discriminator
  from Layer A** (the scoring core is already wired to read it; Layer A doesn't emit it yet).
- **Agreement:** easy 3/4 by ordering, one inversion; the **contested middle is untestable** here (corpus
  excludes its only contested pair) — stated, not averaged away.
- **Second finding (a named failure mode fired):** the "matched" gatehouse scores 2 *against its own
  concept* — the build is materially unfaithful (plank/log siding, no cobblestone). The ceiling is on the
  floor because the **build itself is wrong**, not just the metric.

## Active — E-41 typed-critique-kind (drafted), then E-42 build-faithfulness (queued)

The decision: **A then B.** Both drafted; A runs first (E-42's first ticket depends on E-41's last).

- **E-41 (active) — typed `kind`.** Layer A emits `kind ∈ {add, replace, remove}` per `CritiqueItem` (the
  scoring core already reads it); the structural `present∧missing` heuristic that over-capped is replaced by
  a judged tag. Chain: **T-170-01** emit kind + re-pin prompt → **T-170-02** crater re-run. *Wrinkle baked
  into the proof:* a correct judge still caps the gatehouse (it's genuinely material-wrong vs its concept) —
  so A fixes the over-cap of incomplete-but-right builds, and hands the crater-separation to E-42.
- **E-42 (queued) — build faithfulness.** Give the build materials + a roof faithful to its concept so the
  crater can finally separate. Chain: **T-171-01** material faithfulness (gatehouse program → cobblestone,
  not plank) → **T-172-01** roof-as-construction + multi-ridge (kill the 72% plank prism; cottage's two
  gables) → **T-173-01** re-run E-41's crater on the faithful build — it separates, or the residual gate
  (term scale vs build pipeline) is localized.
- **E-43 (queued) — surface-treatment grammar.** Fixes the *oversimplification* (faithful but plain builds:
  token quoins, void-like arch, no trim band). A **compositional treatment spec** — base / recess-by-
  exclusion / field-pattern / **edges-derived-from-geometry** (corners→quoins, top→cornice, opening→reveal/
  arch) — at **readable amplitude**, one vocabulary across walls/roofs/openings. Promotes E-35's flat
  articulation-pass list into a structured grammar; the brushes become layer primitives. Chain:
  **T-174-01** spec+compositor engine → **T-175-01** layer primitives + hand-authored gatehouse proof (does
  it *read*?) → **T-176-01** source specs (recognition/style pattern-book) + close the E-39 critique→amplify
  loop + generalize to roof/openings.

This is the E-38 → … → E-43 arc: probe found style-blindness → structured feedback → style-distance term →
typed kind → faithful build → **articulation that reads** (the glance, not just the score).

- **A style-distance severity term:** present-but-wrong-style = MAJOR, so a clean wrong-style build is
  capped, not waved through. This is the term that should have made the fixture crater.
- **A consensus-labeled ≥8–10-state, multi-department defect corpus** — the bake-off was under-powered at
  2 states; a real corpus is needed to judge split-vs-fused and any new severity term.
- **Cleaner builds (the roof line below) to lift the matched ceiling** — matched only scored 52 because
  the build itself is defective, masking the style spread.
- **Keep the wall:** still the *creation* loop; the frozen scalar instrument stays separate.

## Then, in priority order

1. **Roof as construction** — kill the plank-prism; multi-ridge per `masses[]` (the cottage's two gables).
   (was S-150 / deferred T-160-03.)
2. **More than one architectural language** — recognition must *declare style*; schema must express
   non-rustic grammars; need ≥2 genuinely different styles. Prereq for per-style judging above.
3. **Price of admission — volume & longevity** — delete the per-subject `SUBJECTS` map, drive purely from
   recognised programs; run across many subjects, unattended. (was S-162.)
4. **Eval human-validation on the contested middle** — its missing test asset: a *clean* build scored
   against a *same-family wrong-style* concept, expected to crater. (was S-161, sharpened.)

## Owed

- Combined re-run of the wall skin + footprint registration to confirm the sparse-shell barn recovers
  from −37 and to get honest fresh deltas.

---

*Carry-forward: the generator only knows one style because the metric never punished using the wrong one.
Teach the measure to care about fidelity to the spec, then let the agent climb that.*
