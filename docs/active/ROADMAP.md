# Roadmap

**Where we are (2026-06-15).** Foundations → Measurement archived (E-01…E-38) at
`docs/archive/2026-06-15-foundations-through-measurement/`. Full retro:
`docs/findings/2026-06-15-sprint-retro-foundations-through-measurement.md`.

Walls are done (geometry closes dense + sparse; skin reads as construction). **The binding constraint
moved off the build and onto the measure and the roof.**

**Governing:** `docs/knowledge/project-direction.md` (the differentiator is the measurement, not prettier
builds) + `docs/knowledge/anti-hedge-directive.md` (every epic states how it can fail).

---

## Next epic line — structured, construction-addressed feedback (BAML)

*Why:* the eval is **within-family style-blind** (wrong-style probe: house-vs-koi → 3, but every building
sits 22–32, inside the noise). No gradient toward the concept's identity ⇒ everything homogenizes to one
rustic grammar. Fix the measure, not the generator.

- **Two layers, split** (the current `WorkshopReply` fuses them):
  - **Layer A — diagnostic judge, per-style.** Emits `{department, expected, present, missing, severity}`.
    `expected` carries the style knowledge → one BAML suite per style.
  - **Layer B — router, unified.** Maps each item to a construction *department*. `Department` enum is
    **derived from the idiom-registry** (single source of truth; the judge can only name buildable work).
- **Falsifiable bet:** split (diagnose → route) beats the fused judge on actionable, correct dispatch.
- **Keep the wall:** this is the *creation* loop; the frozen scalar instrument stays separate.

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
