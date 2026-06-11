# Milestones — the ladder, in plain terms

*Ratified 2026-06-11. Companion to `pipeline-philosophy.md` (the how); this is the where-to. Every
epic from E-31 onward names which rung it serves. Written plainly on purpose — if a rung can't be
explained to a layperson, it isn't a rung.*

## The North Star — M4: The Commissioned Village

> Someone gives us one sentence — *"a fishing village on a cold coast"* — and within a day,
> **unattended**, the system delivers a small Minecraft village: ten-ish buildings, streets, lanterns,
> the works. We post four screenshots to a Minecraft community with no explanation. The milestone is
> met when players respond to it as the work of a skilled human builder — and exceeded the day
> someone asks for the world download.

Why this is the bar: a layperson can check it (you look, you know); it cannot be gamed by us (the
judge is outside the system); it demonstrates the real claim (a world built from a sentence without
scaling human labor); and it forces every pipeline stage while needing none that don't exist.
Human hands touch the process exactly twice, both early: ratifying a style's taste, promoting the
factory's backlog. Operational form of the stranger test: a handful of Minecraft-literate viewers,
blind, one question — *"who do you think built this?"*

## The ladder

| Rung | Plain statement | Serves it |
|------|-----------------|-----------|
| **M1** | **One house that looks like its picture.** The cottage and barn, glance-test clean, gate-passed. | E-31 (pattern-book builder) |
| **M2** | **A style we invented in an afternoon.** A theme we've never built becomes a ratified style; the factory builds its missing brushes; one building stands in it. | E-32 (brush factory) |
| **M3** | **A street that belongs together.** Five or six buildings, one style, varied but coherent — the first screenshot a stranger might mistake for a human's. | the town composer (next epic) |
| **M4** | **The Commissioned Village.** The North Star above, including the stranger test and the unattended day. | the arc |
| **M5** | **The self-serve site** *(long-term)*. A public site where players type what they want and receive a quality build they couldn't generate on their own — and **vote on styles with their feet**: demand steers which styles get formed and which brushes the factory builds next. | the platform era |
| **M6** | **It builds in your world.** Commissions placed into live servers — terrain-fitted, neighbor-aware, repairable. | the far rungs (below) |
| **M7** | **The town's architect on call.** Region spec → function-typed, style-directed, multi-candidate paste-ready proposals. | the far rungs (below) |
| **M8** | **A city with a history.** Districts, eras, infrastructure — a city that reads like it grew. | the far rungs (below) |
| **M9** | **The resident world-designer.** A persistent world stewarded over months. | the far rungs (below) |
| **M10** | **The world compiler.** Any described or scanned place, built, in the medium of your choice. | the far rungs (below) |

**What M5 implies, noted early so nothing surprises us:** the factory becomes demand-driven (votes
prioritize the backlog); per-generation **cost and latency** become first-class metrics alongside
quality; the **delivery artifact** matters (world download / schematic export — Litematica was
deferred in Phase 1 and returns here); and the instrument becomes production QA — every served build
passed the gate before a user saw it. The moat is exactly what we've built: the quality pipeline and
the honest instrument behind it, which a casual user can't assemble — they bring the demand and the
taste votes; we serve the construction.

## The far rungs (ratified 2026-06-11; each climbs a new axis)

Discipline held throughout: **every rung's bar is checkable by a layperson in one look.** The moment
a rung needs our own instrument to verify, it's a ticket, not a milestone.

### M6 — "It builds in your world" *(axis: context)*
> You're playing on a live server. You stake a plot, type a commission in chat, and by morning the
> build is standing there — fitted to your terrain, matching your neighbors, in your town's style.

Everything through M5 builds on a blank canvas we control; M6 builds inside a world someone else
made: terrain to adapt to, neighbors to harmonize with, existing builds never to touch. The
structural read points outward at *their* world; the Phase-1 server/bot deferrals return because the
delivery artifact becomes **presence**, and the system must coexist with player edits.
**Bar:** the build *survives the players* — nobody tears it down, people build around it, the server
asks for more. Adoption is the verdict.

### M7 — "The town's architect on call" *(axis: personalization)*
> A user visits the site and pulls up the **design spec for their build region** — their town's
> palette, its biome, the materials they can source and want to use, its style identity. They decide
> the town needs a small health clinic, but it has to look colonial-revival, South America. A few
> buttons later the model pops out **several strong candidates — good enough to paste** as Litematica,
> each fitting their town.

What M7 adds, named: (a) the **region spec** as a living user-facing document — the diegetic material
story becomes *theirs*, driven by real survival economics (what they can farm and mine); (b)
**function-typed buildings** — a clinic, a smithy, a chapel: a program/function vocabulary on top of
styles; (c) **long-tail style formation on demand** — "colonial revival, South American" must form in
minutes, not an epic (the factory as a live service); (d) **multi-candidate generation** — several
genuinely *distinct* strong proposals, not jitter around one; (e) paste-ready fit without live server
access — the region spec carries the context M6 reads live.
**Bar — the paste test:** candidates don't just get downloaded, they get **pasted and kept**; a
town's build council picks one without modification.

### M8 — "A city with a history" *(axis: scale + time)*
> One sentence in, and out comes a city that looks like it *grew*: a crooked old town at the center,
> wealthier districts ringing it, a harbor doing harbor things, walls from an era the city has
> visibly outgrown. A stranger flying through believes a build team spent months.

The jump is hierarchy and time as design dimensions: districts with their own wealth, age, and
function under one civic identity; infrastructure logic (gates where roads enter, markets where they
cross); **age as a generation parameter** — the material story stretched across eras, old districts
in the old pattern book weathered. Engineering gets real about scale: millions of blocks, archetype
instancing as the only sane economics, interiors everywhere.
**Bar — navigate by story:** a player dropped in can orient without a map ("the old town is obviously
that way, the docks are down there"). Coherence you can navigate by is coherence that's real.

### M9 — "The resident world-designer" *(axis: stewardship)* — one-liner for now
> The system tends a persistent world over months: seasons, growth, repair, new districts answering
> player activity — time as an operating condition, not just a design dimension.

### M10 — "The world compiler" *(axis: medium)*
> Point it at any described or scanned place — a sentence, a drone survey of a corporate campus, a
> historian's brief for the Library of Alexandria — and get a built world in the medium of your
> choice: Minecraft, another engine, a glTF scene.

Honest about what transfers: the **methodology** transfers completely (staged pipeline, recognition
over reconstruction, diegetic materials, frozen instrument, factory); the **pattern book** does not —
every new target or source medium needs its own idiom library and instrument calibration. That's why
the rung is plausible at all: by M8 the factory *is* the product — the machine that builds pattern
books — so a new medium is a factory run, not a rewrite. The scan-to-build claim is sellable only
because of the anti-hallucination discipline: the honest resemblance instrument is what lets a client
trust that the twin is true.
**Bar — the expert signs off:** the facilities manager recognizes their campus; the historian calls
the reconstruction defensible; a paying client accepts delivery in a medium that isn't Minecraft.

## The confusion-prevention clauses (binding on planning)

1. **Numbers are diagnostics, never destinations.** Spike counts, coverage fractions, gap budgets
   tell us *where* to work. The moment a ticket's goal is "move the number," we've relapsed.
2. **The gate is QA; the stranger is the judge.** Internal verdicts gate promotion up the ladder;
   only outside eyes retire a milestone.
3. **If a rung passes the gate but fails the glance, the glance wins** — and the gap between them is
   itself a finding about the instrument.
