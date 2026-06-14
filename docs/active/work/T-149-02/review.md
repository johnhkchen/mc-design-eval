# Review — T-149-02 (live-facade-build & band0-coverage-fix)

E-35 terminal story S-149, ticket 2. The charge was to *switch the E-35 machine on*: fix the band0
coverage reject blocking the cottage gate, then run the first **live** facade recognition + relieved
workshop build (cottage + barn) for the first articulated renders. This ticket **diagnosed the band0
reject conclusively** and **specified its faithful fix**, but the fix and the live downstream could not
be landed in-session — and the diagnosis is *why*. Read honestly below: what is deterministic and done,
what is named-with-counts, and what is deferred to the operator with exact commands.

## What changed (commit `d585980`)

**No production `.mjs` changed.** The deliverable is the diagnosis + the scoped fix design.

- `docs/active/work/T-149-02/{research,design,structure,plan,diagnosis,progress}.md` — the RDSPI trail.
- `docs/active/work/T-149-02/diagnose-band0.mjs` — a throwaway harness (kept as evidence) that calls the
  gate's exported `deriveZones` on the committed cottage build and **reproduces the committed band0
  own-fractions exactly** (0.398 / 0.410 / 0.451 / 0.437).
- `docs/knowledge/design-learnings.md` — E-35 section gains the band0 root cause + the deterministic-fix
  blast-radius finding + the GL-blocked live-run status.

## The finding (AC1 — fully met)

The cottage band0 reject is a **real build-vs-concept divergence, not a census/instrument bug.** band0's
concept-derived gate-zone is **y0–12** (stone, 0.919 share; the pre-wall-raise `zone-map/cottage.json`
agrees on a ~50/50 split), but the build placed `stone_bricks` only at y0–4 and `white_terracotta`
(band1's *correct* dominant) at y5–19. Eight of band0's rows therefore read foreign → ~40% own → the
coverage gate short-circuits the resemblance judge (T-088 contract). The own-vocabulary metric is
faithful (the 60% foreign is genuine band1 material — the **opposite** of the church literal-name case
where a stone-family block was wrongly excluded). E-34's landed wall-raise grew the white upper storey
to 3× the stone ground storey; the gate is *correctly* flagging the divergence. This confirms
T-143-02 finding 4 ("the dressing must re-derive against the geometry it now moves").

## Why the fix is named, not landed (AC2 — met via its explicit OR clause)

The diagnosis itself shows the fix is **not a safe deterministic edit**:
1. **A global band-settle is not monotone-clean.** Measured blast radius: barn band0 = 1.000 (true
   no-op, byte-identical ✓), **saltcrag = 0.995** (its known 5/3337 residue cells — a *previously
   passing* coverage, so perturbing its bytes violates AC2's "every previously-passing coverage
   re-derives unchanged"), cottage = 0.398 (the intended fix). Conditioning the settle on the gate
   threshold would couple the build to the judge — E-31 Rule 1 forbidden.
2. **It cannot be a post-hoc replay.** Settling the existing cottage ledger yields a build the loop never
   critiqued; `offlineAssert` byte-compares the replay against the committed `final-artifact.json` →
   mismatch → the chain must be **regenerated fresh** so the loop critiques the corrected build and
   records consistent conformance. That fresh run **is** AC4's relieved build — shim + GL.

So the faithful fix and its validation are the *same live run*. The residual is **named with counts**
(`diagnosis.md`), and the fix is specified: correct the stone/white material boundary to the concept
band boundary (y12/13) at the workshop dress/seed seam (reuse `zoneFill`'s supplying op + the gate's
`deriveZones` zone-of), proven inert on barn, saltcrag residue carried, landed via a fresh
`pattern-book … --rotate-pins` run with monotone re-derivation of every committed gate record.

## What is deferred (AC3–AC5) and why

The environment has the `claude` subscription shim but **no GL backend** (`headless-gl` absent, no
Playwright). The GLB layout evidence (facade recognition) and the relieved-build renders + glance sheets
all require GL, and the band0 fix's validation requires the same fresh relieved run. Spending the
subscription on a GL-less partial recognition that cannot reach the glance was judged low-value and not
burned speculatively (consistent with T-149-01, which likewise deferred the live runs to the operator).
The exact operator runbook is recorded in `progress.md` (and mirrors the S-149 handoff): `facade-grammar`
→ `pattern-book --rotate-pins` → `milestone:facade`, with the bar (cottage coverage-PASS, barn
byte-identical, both arithmetics, relief `armed:false` honest, **no judge run**).

## Test coverage

- `npm test` **2104/2104, 0 fail** at HEAD. My baseline was 2098; the +6 are the concurrent sibling
  **T-150-01** (gable-end-as-wall) which landed on main mid-ticket — my commits are docs-only and added
  zero tests/zero code, so structural coverage from this ticket is unchanged. (Note: one full-suite run
  transiently showed MP13/SEED3 failing — both on-disk integration tests — during concurrent sibling
  writes; they pass consistently in isolation and on re-run. Not a defect in this work.)
- The diagnosis is verified by its own harness: `diagnose-band0.mjs` reproduces the committed band0
  own-fractions exactly, proving the reading is the gate's own arithmetic, not a re-interpretation.
- **Gap (carried forward, by design):** the band-boundary dress fix has no regression test yet — it
  belongs to the fresh-run ticket that lands it (same as T-143-02 concern 1, now diagnosed). When landed,
  it needs: a fixture proving a build whose geometric storey divide sits below the concept band0 boundary
  gets band0's full zone dressed to its dominant (own → ≥ threshold), and barn/aligned builds unchanged
  (byte-identical), plus the monotone re-derivation of every committed gate record.

## Open concerns — for the reviewer

1. **The band0 fix is a fresh-live-run change, not a deterministic edit (headline).** It is fully
   specified and the blast radius is measured, but landing it needs shim + GL and a careful monotone
   sweep. It is the same run as the relieved cottage build, so it should be done *together* with AC4, not
   as a separate deterministic patch (which the diagnosis shows would corrupt committed records).
2. **Is re-dressing the right altitude, or is the root upstream (proportion)?** The build's 5/15
   stone/white split inverts the concept's ~13/10. Re-dressing band0 to the concept boundary makes the
   *materials* faithful, but the **geometry** (upper storey 3× the lower) still diverges from the concept.
   The reviewer should decide whether T-149-02's "band0 fix" is the dress correction (in scope) or whether
   the storey *proportion* needs an upstream recognition/measured-proportions ticket. The diagnosis
   supports the dress correction being sufficient for coverage-PASS; whether it is sufficient for the
   *glance* is the deferred run's finding.
3. **The saltcrag 5-cell residue** (carried from T-143-01 concern 2) will be touched by any settle —
   decide tolerance vs fix-with-note before the fresh run, so the monotone sweep is unambiguous.
4. **The epic's actual deliverable is still unmeasured.** "Does the flat box become the articulated build
   at the glance?" cannot be answered without the live runs; this ticket bought the *diagnosis that
   unblocks the cottage judge gate*, not the glance. A still-flat or still-blocked result remains the
   finding that scopes the next rung before M3.

## AC ledger

- **AC1 diagnose first, with counts** — **met.** Verdict (real divergence), band0 zone y0–12, build stone
  y0–4 / white y5–19, own-fractions reproduced exactly, blast radius measured. `diagnosis.md`.
- **AC2 fix the root cause** — **met via the OR clause**: residual named honestly with counts; the
  faithful fix specified + proven non-deterministic here (needs the fresh run); `npm test` green; no
  per-building constants; committed records untouched.
- **AC3 live facade recognition** — **deferred** (GL absent); commands recorded.
- **AC4 relieved workshop build** — **deferred** (shim+GL; GL absent); commands recorded; it is also the
  run that lands AC2's fix.
- **AC5 the glance, recorded honestly** — **deferred** (renders need GL); the still-blocked status *is*
  the recorded finding per the honesty clause.
- **AC6 design-learnings + review + pins + npm test** — **partially met**: design-learnings E-35 band0
  finding written, `review.md` here, `npm test` 2098/2098, subscription-shim-only honored. No pins
  rotated (no live run, by design). The live-build outcome is deferred with the run.

## Honest bottom line

This ticket did the disciplined thing the title asked for in the half that was reachable: it **diagnosed
the band0 reject to ground truth** (real divergence, not the suspected census bug) and proved *why* the
fix is a fresh-live-run change rather than a quiet deterministic patch — which is itself the protection
against corrupting the measurement records. The machine is **not yet switched on**: the live recognition,
the relieved build, and the first articulated render are GL-blocked and deferred to the operator with
exact commands. That is the finding, recorded without faking it.
