# T-132-01 factory-milestone — Design

The end-to-end run is mostly *orchestration of committed, tested machinery* (T-130 formation,
T-131 backlog, T-127 chain + frozen gate). The only genuinely new code this ticket needs is
(a) pack parameterization of the pattern-book/workshop runners with collision-free record
namespacing, (b) the gap brushes the saltcrag backlog specifies (through the registry's single
door), and (c) a small deterministic receipts composer. Everything else is live runs +
journaling. Decisions below, each grounded in research.md.

## D1 — The new style is `saltcrag`; consume the sibling's pack if it lands, else form it

T-130's plan step 7 names saltcrag (the committed T-129 vernacular fixture) as the genuinely
new style, formed via `--story-replay vernacular` (stage 1 spend-free, deterministic) and
ratified provisionally. A sibling session was running steps 6–7 at 17:37. Decision: at
Implement start, re-check `packs/saltcrag.json` / `packs/drafts/saltcrag/`. If ratified —
consume it (the dependency delivered). If absent and no sibling activity in the last ~10
minutes of mtimes — run `npm run style:form -- --story-replay vernacular --slug saltcrag`
ourselves and ratify; the chain is committed and tested, and T-132's AC ("the T-130 new
style (ratified)") needs the *artifact*, not the author. If a sibling is visibly mid-flight
(fresh mtimes), wait/monitor rather than race (ticket-double-dispatch lesson).

**Ratification authority**: ratification is the E-32 Rule 4 human taste gate. This ticket
runs unattended; the planner's sanction is the ticket itself, whose AC orders the end-to-end
run. Decision: ratify with `--by "lisa/T-132-01 (planner sanction via ticket AC)"` and a
`--note` marking it **provisional pending a human taste pass** — exactly T-130 step 7's
"ratify provisional". The receipt records who/when honestly; nothing pretends a human looked.
Rejected: blocking the terminal milestone on an interactive approval (the workflow is
explicitly autonomous; the honest provisional note preserves the gate's meaning).

## D2 — Subject: `barn`, by substitution (program → realization), not a new building

The AC's path starts at "program". The committed barn recognition program is role-space;
`compileProgram(program, pack)` substitutes materials at compile time — this is the E-31
recognition+substitution thesis the epic builds on. Barn is also rustic's best (4/4
same-object, all-minor), so "new-style building vs rustic's best" becomes a true
like-for-like: same program, same budget, same gate contract, only the pack differs. The
reuse fraction is then measured on identical composition demand. Thematically the saltcrag
story (tarred boat-timber, beach-stone) fits a barn/boathouse mass.

Rejected: minting a brand-new subject (new concept image → sketch → recognition) — three
extra live seams (image gen, sketch, recognition asks), a new GLB, and the AC doesn't ask
for it; it starts the path at program. Rejected: cottage — its committed program fails the
gate by occlusion regardless of pack (coverage refusal, judge never called), so it cannot
yield the epic's judge call.

## D3 — Pack enters the chain as a flag; records namespace by style, rustic keeps its paths

`pattern-book.mjs` and `workshop.mjs` gain `--pack <rel>` (default `packs/rustic.json`,
preserving every committed behavior byte-for-byte). Record paths derive from a single shared
helper (new, in `src/workshop/seed.mjs` — both runners already import it):

```
packNs(packRel)  →  ""                      when packRel === "packs/rustic.json"
                 →  `--${slug(packRel)}`     otherwise   (slug from the pack filename)
```

applied to the *chain record namespaces only*:
`workshop/<key><ns>/program.json`, `workshop/<key><ns>.json` (ledger),
`workshop/<key><ns>/final-artifact.json`, `workshop/<key><ns>/component-plan.json`,
`pattern-book/<key><ns>.{json,md}`. Sketch/recognition inputs stay unsuffixed — they are the
committed upstream seam, consumed read-only. The workshop subject map derives rows per
invocation from the registry + the passed pack (still registry-only subject entry; no key,
no slug in any runner source — the slug arrives via argv/package.json, satisfying the
generalization grep).

The empty-suffix special case for rustic is deliberate: the alternative (always-suffixed
paths) would relocate T-127's committed records — rewriting committed pin paths and breaking
`patternbook:repro`'s byte-asserts, a re-roll by another name. The special case is one line,
commented, and pinned by the existing rustic repro suite plus a new unit test on `packNs`.

**Stage-2 subtlety (found in research):** `verifyRecognition` byte-compares the re-realized
program against the *committed* recognition artifact — which was realized under rustic.
Decision: stage 2 always verifies under the **pack of record of the committed recognition
seam** (rustic), while stage 3 seeds under the **target pack**. Two pack handles in the
runner: `seamPack` (fixed, rustic) and `buildPack` (--pack). This keeps the committed-seam
verification meaningful and lets substitution happen exactly once, at seed time.

**Repro modes**: `--repro`/`--offline` honor `--pack` and look for the namespaced chain;
the no-flag sweep (`patternbook:repro`) remains rustic-only — committed behavior untouched.
New npm scripts (flags encoded, the no-`--` convention):
`patternbook:barn:saltcrag`, `patternbook:saltcrag:repro`, `patternbook:saltcrag:offline`,
`gate:patternbook:barn:saltcrag` (gate label `patternbook-saltcrag`, artifact/plan at the
namespaced paths, `--reference recognition/barn.artifact.json` unchanged — the same-object
anchor is form, materials are labeled on the sheet).

## D4 — Gap brushes first, building second; promotion recorded in-place

Order: form/ratify pack → run backlog factory → promote gap-brush drafts → implement brushes
(registry grows through the single door: entry + technique fn + paramsSchema + tests +
preview, `validateBrushRegistry` green) → then the building run. Rationale: the epic's
narrative is "the factory specifies, AI coding implements once, the building composes from
the registry"; building first would measure reuse against a registry the factory hadn't
grown yet. Also, if the formed pack's `idioms[]` references a brush the registry lacks,
compile/conformance fails — implementing first removes the failure mode instead of
discovering it mid-spend.

**Promotion (E-32 Rule 3 reconciliation):** the rule forbids the *system scheduling its own
work* — the factory may never move a draft into lisa's scan dirs. This ticket, however, was
planner-authored and its AC explicitly orders "gap brushes implemented off **promoted**
drafts". Decision: promotion happens as the documented human flow *minus the lisa dispatch*:
each promoted draft gets its frontmatter stamped (`promoted_by: planner-sanction/T-132-01`,
date, `ticket: T-132-01`) and a row in the backlog README rework log; implementation happens
under THIS ticket (no new ticket files are created — creating tickets mid-run would invite
double-dispatch and block on external scheduling). Any divergence between the draft's spec
and what implementation actually required is recorded as **rework** — T-131's quality metric,
which its review left pending. Honest framing in the journal: promotion was ticket-sanctioned,
not factory-initiated. Scope guard: implement the saltcrag **new-brush work items** (rustic's
4 unpromoted drafts stay; they're T-131's open human pass, noted in review).

If the backlog yields zero new-brush items (everything demoted to parametrization notes),
that is itself a receipt — reuse fraction 100%, named in the table; the run proceeds.

## D5 — The frozen gate runs as-is; the expected palette divergence is a named finding

No gate changes, no new judge mode, no fresh concept generation. The saltcrag barn is judged
against barn's committed concept — the only target the frozen instrument has. Palette-attribute
gaps are expected **by construction** (diegetic substitution); the AC pre-authorizes recording
the verdict "honestly either way" with causes. The named finding will separate: form/same-object
(should hold — same program) from material attributes (diverge by design). Comparison vs
rustic's best via the existing pure composer (`src/form/head-to-head.mjs`) — extended use, not
modification; the compare script stays outside the isolation scan. Rejected: switching the
judge to a plausibility prompt or generating a saltcrag concept image — both modify the frozen
instrument's meaning mid-epic (creation is free, measurement is frozen); a follow-up epic owns
any gate-policy change (T-127 review concern 3 precedent).

All gate/chain writes are **first writes** (new namespaced paths, new label) — pin rotation
should not fire; `preflightPins` runs before every spend (T-119 discipline honored, which is
what the AC's "T-119 pin rotation" means in practice; T-127 set this precedent: "every
milestone record was a first write").

## D6 — Receipts: a small deterministic composer, one table

New `scripts/factory-receipts.mjs` (pure read + compose, no model, no GL; deliberately
*outside* the isolation scan like pattern-book-compare.mjs since it reads verdict records):
reads the registry (count + names), `packs/rustic.json` + `packs/saltcrag.json` (idiom sets),
the backlog records (items/notes/demotions), the promoted drafts' rework frontmatter, the
formation/backlog/workshop/gate ledgers (model calls per stage), and the two gate records —
emits `benchmarks/sculpture/factory/receipts.{json,md}`: **one table** — registry
before/after, reuse fraction (shared vs newly built), draft-rework measure, cost shape
(calls per stage), verdict beside conformance. Byte-deterministic given its inputs (sorted
keys; no timestamps beyond what records carry), so re-running it is the replay. "Before"
registry count is captured as the pre-implementation `brushNames()` snapshot recorded in
progress.md at the moment of measurement and embedded as data in the receipts record with
its git ref — not re-derived later (it changes when the brushes land).

## D7 — Spend discipline

Probe the shim with one minimal `claude -p` before each spending stage-group (spend-limit
lesson: zero-token notices burn re-ask budgets). Live spends, in order: formation (≤3 stages
× ≤3 asks, stage 1 replayed free), backlog (1×≤3), workshop (≤6 rounds), gate (4 views ×
≤3) — each preflighted, each ledgered. If the limit re-trips mid-sequence: commit what
landed, record the refusal honestly in progress.md, and stop at a clean stage boundary
(every stage is independently committed — the artifact-insurance property).

## What is explicitly out of scope

- Modifying the judge, the gate contract, or any committed record (no re-rolls, no rotations
  planned).
- Promoting/implementing rustic's four backlog drafts (T-131's open human pass — noted, not
  raced).
- Consolidating `ask.mjs` vs `reply-policy.mjs` (T-130's named cleanup ticket).
- Any GLB/texture input anywhere in formation (no-optics is pinned by FG1–FG3; nothing here
  touches it).
