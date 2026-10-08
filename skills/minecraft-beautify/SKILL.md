---
name: minecraft-beautify
description: Turn a plain, functional Minecraft build (a structure .nbt — hallway, room, house row, road, machine housing) into one with skilled-human-builder detail, inferring style and palette from context, without breaking its function. Use when a build "works but looks bad", when the user says /minecraft-beautify, or when an agent busy with layout/redstone/procedural generation wants decor handled in parallel by a subagent.
---

# minecraft-beautify

You are the decor pass. Someone else (a user, or an agent focused on redstone or procedural layout)
made something that **works** and looks like a plain box. Your job is to make it look like a
skilled human builder made it, **without breaking what it does**, and **without asking the user for
inputs you can infer**.

These rules come from a project that measured what works (`docs/knowledge/what-we-learned.md` in
mc-design-eval). Follow them in order.

## Inputs and outputs (subagent contract)

- **In:** a structure `.nbt` path, plus whatever context you have: what the build is for, where it
  sits (biome, neighbours, base materials), who uses it. One sentence is enough; infer the rest.
- **Out:** a new `.nbt` (never overwrite the input), before/after renders, the `check.mjs` report, and
  a ≤8-line summary: brief, palette, what changed, any violations, and time taken.
- **Do not ask questions.** If something is ambiguous, pick the reading most consistent with the
  context and state it in the summary.

## Toolkit (`scripts/`, Node 20+, uses the mc-design-eval `render/` package)

```js
import { loadStructure, Grid } from "<skill>/scripts/nbt.mjs";
const g = await loadStructure("in.nbt");          // Grid: g.size, g.get/set/fill/unset, g.isAir, g.census()
g.set(x, y, z, "spruce_stairs", { facing: "east", half: "top" });
g.fill([x0,y0,z0], [x1,y1,z1], "polished_andesite");
await g.save("out.nbt");
```
- `node scripts/check.mjs in.nbt` → census, **flat fields** (largest blank surfaces), circulation.
- `node scripts/check.mjs in.nbt out.nbt` → the above plus **function violations** (exit 1 on any).
- `node scripts/render.mjs file.nbt outDir --prefix after` → `exterior-45/225`, `cutaway`, `eye`
  (player's-eye view; pass `--eye x,y,z --look x,y,z` for rooms, keeping `--look` inside the build).
  Read the PNGs: **the render is the evidence, not your intention.**

## Procedure

1. **Read the build.** Run `check.mjs` and `render.mjs` on the input and look at the renders. Identify
   the function (redstone, rails, doors, storage, walk paths), the volume you may use, and the
   surfaces a player actually sees. For interiors, that means the eye view.
2. **Write a design brief** (≤150 words, in your reasoning or a `brief.md`):
   - **Identity in one line,** derived from context: "a taiga mine-workshop corridor: dark spruce
     frame, stone footing, warm lantern rhythm". **Never default to generic medieval cobble-and-oak.**
     If the context says desert, nether, modern, Create-industrial, or coastal, the palette and
     motifs must say so too.
   - **Palette by role:** dominant (~60%), supporting (~30%), accent (~10%), plus a named relationship
     ("dark wood / pale stone / brass"). 3–5 core blocks; texture variants only as deliberate accents.
     Each choice has a *reason* (what's local, what the room is for). Colour needs a reason, not
     permission.
   - **Rhythm:** the bay length (e.g. a structural frame every 4 blocks) and what repeats in each bay.
   - **Base / middle / top:** for interiors, floor / walls / ceiling; for exteriors, plinth / body /
     roofline. Each gets a different treatment.
3. **Lock the function.** Everything `check.mjs` lists as protected stays byte-identical; cells above
   redstone lines stay air; walk paths stay walkable (≥2 high, and as wide as the use needs: ≥3 for a
   main corridor). Never place a block that would conduct, power, or re-route a circuit. When unsure,
   decorate further away from it. You may frame or **showcase** the function (a glass-floored channel,
   a trim strip beside the line) as long as the cells themselves are untouched.
4. **Author as code, not coordinates.** Write one generator script that loads the input, edits a
   `Grid`, and saves. **Design ONE bay as a function, then tile it** along the rhythm; mirror for
   symmetry. Don't type hundreds of coordinates by hand: coordinate bookkeeping is where the time and
   the errors go.
5. **Work in fenced passes**, rendering after each, in this order:
   1. **Structure:** frames, pillars, beams, arches, buttresses, which break the box into bays and
      create depth. Pillars stand proud of the wall by 1; panels recess by 1. Carve recesses by *not
      placing* the wall block there (there is no air op in the mental model; last write wins).
   2. **Materials:** apply the palette by role. Floors get a border plus a field; walls get a
      footing/base course; ceilings get beams or coffers.
   3. **Depth and detail:** sub-block pieces carry the craft: stairs (upside-down for corbels and
      brackets), slabs, trapdoors (as panels and shutters), walls and fences (as posts and railings),
      buttons (as rivets), chains, lanterns, candles, pots, barrels, bookshelves, banners.
      **Every flat field larger than ~3×3 gets something:** relief, a panel, trim, or a change of
      material. Re-run `check.mjs` and treat the largest remaining flat field as the next problem.
   4. **Light and life:** light sources on the rhythm (hidden or featured, not random torches),
      a few plants or props that say who uses the space.
6. **Raise the bar; never cap.** Aim for a showcase build a skilled human would post, using the full
   depth available. Models under-detail to whatever bar they infer.
7. **Compare and keep the better.** After each pass, compare against the previous render. If a pass
   made it worse (busier, muddier, broke rhythm), revert that pass; don't patch over it. At most 2
   revision rounds after the first full version.
8. **Verify and report.** `check.mjs in out` must be `ok`. Render the final. Write the summary.

## Failure modes to avoid (each one observed)

- **Style collapse:** every build becomes the same rustic grammar. Derive identity from context.
- **Over-decoration:** extra courses and noise texture read as busy. Leave rest areas; rhythm needs gaps.
- **Recolour instead of construction:** swapping a wall's block isn't detail. Relief (things standing
  proud, things recessed) is what reads.
- **Floating details:** everything attaches to something. Columns are engaged in the wall, not floating
  in front of it.
- **Concealment:** covering a defect is not fixing it.
- **Breaking function:** zero protected-cell violations, always.

## Domain notes

- **Corridors and interiors:** judge from the eye view. Bays of frame + panel + light; a floor border
  that guides the eye; ceiling beams on the bay rhythm. Keep the walk line clear.
- **House rows:** variety within coherence: shared palette and base course, varied rooflines, door
  positions, and accents per house.
- **Roads and highways:** edges carry the design (kerbs, barriers, lamp rhythm), plus supports and
  embankments where the deck meets terrain.
- **Machine housings / operator rooms:** frame the machine as a feature; give the operator a place to
  stand and look; route cables or pipes visibly and in an orderly way.
