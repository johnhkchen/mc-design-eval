# Automation checklist: what the crews still do by hand

**Status: parked for the week of 2026-10-19.** Written 2026-10-13 from the plantation-house run (in progress at the
time: 129 sessions, 51 min wall clock, 296 agent-minutes, $6.41) and the workers' waste notes across the lean runs
(707 notes from 14 runs in `benchmarks/plugin-baseline/runs/build-1/*/build-report.json`). Nothing here is started;
the owner decides the order. Lives outside `tickets/`, `stories/` and `work/`, so Lisa never schedules it.

How to re-measure any line: `node benchmarks/plugin-baseline/gantt.mjs <run>` (minutes, cost, concurrency),
`node benchmarks/plugin-baseline/cache-report.mjs <run>` (Haiku tokens), `node benchmarks/plugin-baseline/waste-report.mjs`
(the waste notes). The per-role split used here matches ledger rows to session tapes by start time, as gantt.mjs does.

## Where the time and money went (plantation, mid-run)

| Role | Sessions | Agent-min | Share | Wall span | Cost |
|---|---|---|---|---|---|
| Part and room builders (Haiku) | 70 | 129 | 44% | 7 min | $2.37 |
| Lamplighters (Haiku) | 32 | 100 | 34% | 18 min | $0.81 |
| Kit, shell, inspector (Haiku, root) | 8 | 40 | 14% | 24 min | $1.01 |
| Merge fixes (Haiku) | 13 | 12 | 4% | 2 min | $0.17 |
| Designers (Sonnet) | 4 | 7 | 2% | 18 min | $1.10 |
| Architect (Opus) | 1 | 5 | 2% | 5 min | $0.94 |

Waste notes by theme (a note can fall in several): coordinates or collisions worked out by hand 52%, furniture laid
out cell by cell 47%, helpers rewritten locally 36%, lights 33%, verification by eye 24%, build plumbing 20%,
facing and orientation 12%, checklist ticking 11%.

---

## Automatable now (no more data needed)

### [ ] 1. Deterministic lamplighting pass
- **Why:** 34% of agent-minutes and the run's critical path (an 18-minute wave after the parts merge, 32 sessions in
  the plantation, most rooms dark the first time). A third of waste notes mention lights.
- **What exists:** `mcd light` maps each room's floor light; `room-check.mjs suggestLights()` already picks lantern
  spots that lift the dark and dim cells, best first.
- **Build:** a `lightRooms(g, rooms, { style })` pass in `runParts` after the last part (like the trusses): per room
  type, pick fixtures that suit it (hanging lanterns on chains from the ceiling in halls and living rooms, a
  chandelier ring for a double-height room, wall lanterns or candles in bedrooms, lanterns on fence posts outside),
  placed at `suggestLights` spots until no floor cell is dark; air only; respects the fit check (nothing on a bottom
  slab, hanging lanterns hang from something).
- **Workflow:** send a lamplighter agent only for rooms still dark after the pass, or for rooms a designer marked
  "focal" (the agent adds taste, not coverage).
- **Done when:** a rerun of a lean build sends 0 to 3 lamplighters instead of ~30, every room has no dark floor
  cells, the fit check stays OK, and the owner sees no worse lighting in a side-by-side render.
- **Expected:** roughly 15 minutes and $0.80 off a large build.

### [ ] 2. Rule-based merge of overlapping parts
- **Why:** 13 fix sessions in the plantation (4% of minutes, $0.17); each one resolves writes a part made into an
  earlier part's cells.
- **Build:** classify each refused write at merge time: same block (drop silently), decor over structure (drop the
  decor, report it), structure over decor (move the decor one cell if free, else drop), structure over structure
  (a real conflict: only these go to a fix session).
- **Done when:** fix sessions are sent only for structure-on-structure conflicts, and the merged build's fit, walk
  and socket checks are unchanged.

### [ ] 3. `mcd tick`: checklist bookkeeping in one command
- **Why:** 11% of waste notes; workers Read plan.md and elements.md around each line, then Edit one line at a time to
  flip `[ ]` to `[x]` (up to ~12 tool calls a part).
- **Build:** `mcd tick plan.md elements.md --part "<part name>" [--item "<text>"]` flips the matching items; the
  part prompt says to use it.
- **Done when:** no waste note mentions ticking in the next three runs.

### [ ] 4. Build plumbing: confirm fixed, close the theme
- **Why:** 20% of waste notes, mostly "make.sh stops when roof.json is missing" and stale build.nbt files.
- **Status:** `runParts` now skips the roof with a notice when roof.json is absent; most notes predate that.
- **Do:** re-run waste-report on the newest runs only; fix anything still reported (stale-file checks in `mcd room`
  and `mcd plan`, which could default to the newest build file).

### [ ] 5. Facing and orientation helpers that take the wall side
- **Why:** 12% of waste notes are reasoning about which way stairs, trapdoors, beds, doors and wall signs face.
- **Done so far:** `bed(g, foot, facing)`, `shutter(g, at, face)`, `bannerWord(g, word, { center, face })`.
- **Build:** the rest by wall side, not by block facing: `seat(g, at, { backTo: "west" })` (a stair chair or bench
  with its back to a wall), `wallSign(g, at, { on: "north wall" })`, `door(g, at, { opensInto: "room" })`,
  `ladder(g, at, { on: "wall" })`, and a one-line facing rule in toolkit.md.
- **Done when:** facing mistakes stop appearing in the fit check and waste notes.

## Automatable once there is enough data

### [ ] 6. Room furnishing by layout solver plus furniture kits (the big one)
- **Why:** room builders are most of the 44% of builder minutes; 47% of waste notes are "furniture laid out cell by
  cell", 52% mention coordinates or collisions by hand.
- **Data we have:** ~140 furnished rooms across the lean runs (rooms.json boxes plus the built cells), the owner's
  walk-through rules (now `mcd fit`), and the walk and light checks as hard constraints.
- **Data we need:** owner-approved examples per room type; collect them as the owner reviews builds (a short
  thumbs-up or comment per room render). Bedrooms, kitchens and halls will get enough first.
- **Build:** furniture kits as small parametric pieces (a bed and nightstands, a dresser of barrels, a dining table
  with stair chairs, a kitchen run of counters, smoker and barrels, a hearth seating group), each with its footprint,
  its wall side and its clearances; a solver that places a room type's kits against its walls given the doors and
  windows from `mcd plan`, then checks walk, light and fit, and retries.
- **Workflow:** the solver furnishes every common room; an agent furnishes focal rooms (the vaulted living room, a
  master suite) and room types without enough examples, and may restyle a solved room.
- **Done when:** for a room type with enough examples, solver rooms pass walk, light and fit, and the owner rates
  them no worse than agent rooms in a blind side-by-side.

## Not worth automating (yet)

- **Planners (Opus, Sonnet):** 4% of minutes, about a third of the dollars; this is the design itself, and lean mode
  already plans once and builds many.
- **Shell and kit sessions:** too varied between buildings to template; revisit when several builds share a style.

## Related, found the same day

- [ ] Refit the Haiku 5.5 rates in `cache-report.mjs`: at its rates the plantation's Haiku sessions cost $3.00, billed
  $4.36 (122 sessions under 100K output billed $4.04 against $2.89 at the table's rates; one session at 106K output
  billed $0.32). The table understates current pricing by about 40%.
- [ ] Find which root session went over 100K output (06:18 UTC, 31 turns, 8 min) and why; keep Haiku sessions under it.
