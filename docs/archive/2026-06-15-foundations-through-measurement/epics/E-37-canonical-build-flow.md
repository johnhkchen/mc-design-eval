---
id: E-37
title: canonical-build-flow
type: epic
status: open
priority: high
depends_on: [E-36]
spec: "§1, §5, §6, §9"
stories: [S-154, S-155, S-156, S-157, S-158]
---

## Background (read this first — self-contained)

**The pain (reviewer, 2026-06-14): "we've tried many different approaches, which led to confusion
because work is strewn about."** The scan confirms it — **~58 artifact directories** under
`benchmarks/sculpture/`, and **four live "build a subject" chains**, each with its own runner, its own
artifact tree, and its own gate invocation:

| Chain | Runner | Writes to | From |
|---|---|---|---|
| pattern-book / workshop | `patternbook:*` | `workshop/`, `recognition/`, `pattern-book/` | E-31/33/34 |
| generate-first | `generated:*` | `generated/<subj>/` | E-29/30 |
| styled kit | `styled:*` | `styled/` | E-26 |
| challenge / reconstruction | `challenge:*` | `challenge/`, `reconstructed/` | E-27/28 |

The same barn is a different artifact, with different bytes, in seven places. **The symptom that proves
the cost:** T-150-01's gable/overhang fix landed in *generate-first*, but the barn that gets *measured*
is the *workshop* one — we fixed the construction in a chain that isn't the one being judged. **Root
cause:** every new approach *added* a chain instead of *replacing* the last; the pipeline philosophy
unified the **concept** (Stage 0→6) but nothing ever unified the **code**.

**The decisions (reviewer, 2026-06-14):**
1. **Canonical spine = unify into one chain: generate-seed → workshop.** Generate-first stops being a
   terminal chain and **becomes Stage 4** (the clean parametric seed builder) feeding the **Stage 5
   workshop** (where the model iterates — the capability we measure). One realizer, one iterate loop.
2. **Archive the retired trees** to `_archive/` (history preserved; live tree reads clean).
3. **The anti-confusion guardrails ride inside this epic** (not a separate effort).

## The canonical flow (one chain, mapped to the philosophy stages)

```
Stage 3  recognize     concept + GLB → building program (+ facade grammar)
Stage 4  GENERATE SEED  generate-first's parametric realizer (GLB-fit + kit, gable-as-wall,
                        overhang, articulation) → the clean seed
Stage 5  WORKSHOP       model critiques 4-azimuth renders, revises via tools, ledgered,
                        a judge-free render every round (E-36) → final
Stage 6  gate           SEPARATE explicit step — frozen, billed, NOT part of `build`
```

One entry point: `npm run build:<subject>` runs Stage 3→5. One artifact home: `builds/<subject>/`.

## Why this prevents the *next* confusion (the principle)

Autonomous coding runs start with **thin context** — the ticket + CLAUDE.md + what they grep, not the
seven epics of history. Documentation *informs* such an agent; it does not *bind* one. The project
already trusts **structure, not discipline** for the build (the 4-can palette, the registry-as-only-
door, the workshop that *cannot* call the judge). **This epic points that same lens at the codebase
topology**: make the wrong organizational move structurally impossible, so a thin-context agent can't
fix the wrong chain, build on dead code, freeze a draft, or strew output into a new location.

Five guardrails, all riding inside (S-157 unless noted):
1. **One authoritative map, kept current as part of done** — `STRUCTURE.md`: Stage → owning module →
   artifact → entry point → what's archived. Any ticket that changes a stage updates the map in the
   same commit (a stale map is worse than none).
2. **Location encodes status** — `builds/` = drafts (freely regenerated, E-36 free zone);
   `measurements/` = frozen records (pin-guarded — the E-36 allowlist becomes *by location*);
   `_archive/` = superseded (never imported by the live spine).
3. **Conformance guardrails that fail loudly** — tests that go red on a topology violation: a second
   "build a subject" entry point; a live-spine import from `_archive/`; a draft written outside
   `builds/`; the map naming a module that doesn't exist (or a stage module absent from the map).
4. **Done = delivered, not compiled** — a creation ticket isn't done until the canonical artifact is
   regenerated and **rendered beside the concept** (E-36 makes this automatic). Green tests + a visibly
   closer render — never green tests alone.
5. **Replace, don't accrete** — a ticket that supersedes an approach **archives the old one in the
   same ticket**; a shared dependency gets its own upstream ticket, never a "share X" note in two
   sibling roots ([[parallel-roots-duplicate-shared-deps]]). Plus a checkable lisa **claim** so a
   second thread sees the first instead of racing ([[lisa-same-ticket-concurrency]], [[ticket-double-dispatch]]).

## Goal

```
ONE CHAIN        recognize → generate-seed (generate-first) → workshop → gate; one `build:<subject>`
ONE HOME         builds/ (drafts) · measurements/ (frozen) · _archive/ (dead) — location is status
ARCHIVED         the ~50 retired trees + superseded runners moved out of the live tree
GUARDRAILS       the map + conformance tests + done=rendered + replace-don't-accrete, enforcing it all
PROVEN           barn AND cottage built end-to-end through the ONE chain, rendered beside concepts
```

## Rules of engagement (binding)

1. **Frozen measurement records migrate under identity-class discipline.** Moving gate records,
   baselines, and milestones to `measurements/` updates *paths*, never *bytes*: baselines are **never
   re-banked**, every committed verdict re-derives unchanged, the judge contract is unmoved
   (T-095/T-110/T-119/T-144 precedent). This is the delicate seam — monotone proof required.
2. **Archive is a move, not a delete; reference-checked first.** Every committed test/record reference
   to a moved tree is updated or the move is refused. `_archive/` stays in git history and may be
   restored; the live spine must not import it (enforced by S-157).
3. **Replace in the superseding ticket.** No "clean it up later." The chain unification archives the
   chains it replaces; the guardrails land with the consolidation, not after.
4. **Depends on E-36** (the de-freeze): the unification touches the same runners E-36 re-scopes
   (pin-guard, render-in-loop). Merge the chains once, on de-frozen ground — so `builds/` is the free
   zone and `measurements/` is the allowlist *by construction*.
5. **Inherited in full:** the philosophy's stage assignment (architecture of record, unchanged — this
   epic realizes it in code, it does not re-derive it); the frozen judge contract; the `claude -p`
   subscription shim (light tier via `--model`, never the metered API); secrets only in `.env`; run on
   main; `npm test` green.

## Candidate stories & DAG

```
                ┌─▶ S-155 one-artifact-home ─┐
S-154 unify-chain ┼─▶ S-156 archive-retired ──┼─▶ S-157 topology-guardrails ─▶ S-158 proof (terminal)
                └────────────────────────────┘
```

- **S-154 — unify-chain.** Generate-first's parametric realizer becomes the **Stage-4 seed** consumed
  by the **Stage-5 workshop** (replacing pattern-book's rougher seed brushes); one `build:<subject>`
  entry point runs recognize → generate-seed → workshop → final. The gate stays a separate explicit
  step. First cut of `STRUCTURE.md` (the canonical map) lands here.
- **S-155 — one-artifact-home.** `builds/<subject>/` (program, seed, ledger, final, renders);
  `measurements/` for frozen records; `_archive/` for dead. Migrate the live chain outputs; **migrate
  the frozen measurement records under identity-class** (paths only, baselines never re-banked, monotone
  proof). Location-encodes-status is established here.
- **S-156 — archive-retired.** Move the ~50 retired-epic trees **and** the superseded standalone
  runners (`styled-milestone`, `challenge-milestone`, `generated-milestone`-as-terminal,
  `pattern-book`-as-separate) to `_archive/`, after checking every committed test/record reference. Kit
  recognition folds into the Stage-4 skin; reconstruction/regularize (E-27/28) archives — superseded by
  generate-first ("the blob never becomes the build").
- **S-157 — topology-guardrails.** The five mechanisms as enforcement: `STRUCTURE.md` made
  authoritative + kept-current test; the conformance suite (single entry point / no `_archive/` import
  / no draft outside `builds/` / map↔modules agree); the done=rendered check; the replace-don't-accrete
  + lisa-claim convention. Tests that fail loudly on a topology violation.
- **S-158 — proof (terminal).** Barn **and** cottage built end-to-end through the **one** chain
  (`build:barn`, `build:cottage`), rendered beside their concepts; the canonical-flow narrative added to
  `design-learnings.md` + the philosophy realization-map cross-link; E-12 handoff; story review.

## Definition of done

- One `build:<subject>` chain (generate-seed → workshop); the four old chains gone from the live tree.
- `builds/` / `measurements/` / `_archive/` established; frozen records migrated identity-class (every
  committed verdict re-derives, baselines never re-banked).
- `STRUCTURE.md` authoritative and kept-current-enforced; the conformance guardrails red on violation;
  done=rendered live.
- Barn + cottage proven end-to-end through the one chain, rendered beside concepts; `npm test` green;
  the philosophy's stage assignment unchanged (realized, not re-derived).

## Orchestration notes

- The epic **depends on E-36** (in flight) — its root ticket gates on the E-36 tickets so the merge
  lands on de-frozen ground.
- S-155 (home) and S-156 (archive) follow S-154 (the chain must exist to home/archive around it); both
  feed S-157 (guardrails enforce the conventions they establish); S-158 is terminal and proves it.
- **This is a consolidation, not a redesign.** The philosophy doc is the architecture of record and is
  *unchanged*; E-37 makes the code match it. If a stage's canonical module is genuinely ambiguous,
  resolve it by the philosophy's stage definition, not by inventing a new approach — inventing one is
  the exact thing this epic exists to stop.
