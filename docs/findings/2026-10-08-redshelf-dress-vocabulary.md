# Dress vocabulary on redshelf: the beautify skill in generator mode (2026-10-08)

This is the first test of `/minecraft-beautify`'s ideas on a real procedural town: redshelf, from its looks
bench in `2026-10-08-redshelf-looks-bench/`. The redshelf code and the full proposal stay outside this public
repo, at `/Volumes/ext1/swe/incoming/redshelf/proposal/`. This file records what we learned.

## What was done

Six in-plane decoration "knobs" for the medium shophouse type (`shophouse-m`): plinth, first-floor band, upper
bands, cornice, window jambs and corner quoins. They follow redshelf's own pattern:
- each knob defaults to off for the whole town;
- positions are computed from the design, not from placed blocks;
- each knob only ever replaces the building's own wall block.

It was verified with redshelf's own loop: snapshot, diff, checks, compare sheets. Result: 47 of 47 town checks
pass, including the one new check. The diff shows only shophouse-m changed, plus shared walls. Three variants
were judged on redshelf's street-view sheets.

## Lessons for the skill

1. **Generator mode is real, and in a procedural town it's the only mode that holds.** Beautifying one house
   instance gets overwritten at the next build. The skill's output there is knobs in the host's cascade, not
   edited blocks. So the skill must detect which mode it's in: an instance build (an `.nbt`, an operator room)
   or a generator (a town).
2. **Host rules change the vocabulary.** Redshelf fronts must keep 2 cells clear up to the eave. That rules
   out projecting relief, the very lesson from June ("relief must be construction"). In-plane articulation
   still reads: bands, quoins, jambs and a cornice, provided the trim contrasts with the wall. The skill has to
   read the host's constraints before choosing techniques.
3. **Contrast decides whether trim reads at all.**

   | Wall | Dressing | Result |
   |---|---|---|
   | yellow terracotta | brown terracotta | reads |
   | light blue terracotta | calcite | reads |
   | yellow terracotta | smooth sandstone | too faint |
   | white concrete | polished andesite | barely visible |
   | yellow terracotta | white terracotta | reads as pink |

   The trim choices needed rendered A/B comparisons; reasoning alone didn't settle them.
4. **First drafts over-decorate.** v1 put a band on every floor and quoins every other course, which read as
   stripes and a checkerboard. Restraint (one band, quoins in pairs) won on the glance. Same as June's E-43
   amplitude overshoot.
5. **A rule that fails first caught my own bug.** I deleted the reserve guard on purpose, and none of the 46
   existing checks noticed. So I wrote a differential check, building with and without the decoration. On my
   v2 it found 40 socket-wall cells my plinth had leaked into, through party cells that were also reserved. It
   also surfaced a question about redshelf's already-shipped party-wall knob. That's the strongest argument for
   the fails-first discipline in the skill.
6. **The glance sometimes overrules the rule.** Turning upper bands off lost the blank-walls note on four
   3-storey sides but looked better. The choice goes to the owner, not to the metric.

## Open

- White-concrete houses need a darker dressing.
- Colour coherence across a street.
- Front relief would need the host's clearance rule extended.
- Running it on the server.

## Addendum: design-first vs function-first, and the contract between them

- **Design-first on #66's envelope** was clearly the best looking (`benchmarks/shophouse-design/`), but it
  ignored the reserve.
- **Trim knobs inside the fixed massing** barely registered.
- **A designed type program inside the contract**: a timber frame, a stone cornice, gable collars. It reached
  about half of the design-first look in 3 passes. Pass 1 over-framed into a dark box, and passes 2 and 3
  restored the infill. Still 47 of 47 checks.
- **The gap is the contract, not effort.** Three function-side terms cost most of the look:
  1. a red-wool reserve placeholder visible on every shopfront (a render-only what-if with dark oak closes much
     of the gap);
  2. no projections at all in the 2-cell street clearance;
  3. every face cell must be solid, so windows can't be recessed.
- **The general lesson for the skill.** Function and form shouldn't take turns. Function declares a machine-
  checked contract (reserve, clearance, solidity); design works design-first inside it, in parallel; and when
  the look is blocked, the skill names the contract term that blocks it, so the owner can trade it. It doesn't
  quietly settle for less.
