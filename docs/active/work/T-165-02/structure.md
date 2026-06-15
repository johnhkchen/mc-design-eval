# T-165-02 — Structure

The file-level blueprint. Two artifacts created, one test extended, one doc. No production `.mjs` changes —
the mechanism (`styleProfileBlock`/`diagnoseRenderArgs`) already consumes any validated pack (T-165-01);
this ticket supplies *data* + a *pin* + the *finding*.

## Files

### CREATE `packs/guildhall.json` — the second style (the `expected` profile)
A `style-pack/v1` document. Must pass `loadStylePack` (schema gate + `validateStylePack` semantic). Full
field spec below. Slug `guildhall`. No `ratification` (optional; honest — eval-only profile).

### CREATE `docs/active/work/T-165-02/FINDINGS.md` — the honest record (AC3)
The roof-form ceiling, stated as the finding, scoping the generator epic (new non-pitched roof idioms).
Plus the deferred-to-S-166 list (live crater + matched concept render) and the existing stand-in concept.
This is the AC3 deliverable a reviewer reads.

### MODIFY `src/workshop/diagnose.test.mjs` — add DG7 (the wrong-style fixture, AC2)
Loads `packs/guildhall.json`; over the SAME synthetic barn `PROGRAM` already in the file, asserts the
guildhall `style_profile` carries grammar rustic lacks and lacks grammar rustic carries — the wrong-style
`missing`/`present` signal, deterministic. Mirrors DG5/DG6.

### (no change) `src/pack/style-pack.test.mjs`, `src/baml/fixtures.test.mjs`
Untouched — they pin `rustic`/`barn` by explicit path; a new pack file is invisible to them.

## `packs/guildhall.json` — full spec

```jsonc
{
  "schema": "style-pack/v1",
  "style": "guildhall",
  "provenance": {
    "setting": "A prosperous wool-market town's square — the guild's hall and the merchant houses around it,
                raised in dressed limestone ashlar by masons to a polite classical order, not by carpenters
                in the vernacular. Money is spent on a formal frontage: pilastered bays, a round-arched
                ground arcade, worked quoins, and a shallow lead roof.",
    "sources": {
      "dressed-limestone-ashlar":   "geology — limestone from the town quarry, squared and coursed by masons (abundant for a market town) — walls, full height",
      "fine-coursed-ashlar":        "geology — finer, closer-jointed courses for the upper storey and chimney shaft",
      "polished-freestone":         "geology — a pale freestone dressed and rubbed smooth for the pilaster order and string courses (costly, the frontage's pride)",
      "worked-quoin-stone":         "wealth_class — crisply worked corner stones, voussoirs and a moulded chimney cap, cut where a clean classical edge must turn",
      "imported-lead-and-slate":    "trade — lead and grey slate landed and carted in for a shallow prestige roof (imported) — the polite low pitch",
      "riven-stone-slate-courses":  "trade — stone-slate laid in graded courses up the shallow pitch",
      "panelled-hardwood-joinery":  "timber — seasoned hardwood for a panelled town door, the one fine timber on a stone frontage",
      "crown-glass":                "trade — real crown-glass panes set in the windows, the mark of a town house over a cottage (imported)",
      "wrought-iron-work":          "trade — a little wrought iron for a door lantern bracket and area railings"
    },
    "wealthClass": "Burgess wealth — a market town that can afford masons and a classical frontage: dressed
                    ashlar throughout (not rubble-and-frame), a pilaster order, round-arched openings, and
                    glazed sash windows. The polite language is the point; nothing is left in the vernacular.",
    "roofingEconomy": "A shallow lead-and-slate roof — the prestige low pitch a town frontage wears, laid in
                       graded stone-slate courses. No steep timber gable; the roof is masonry's quiet partner."
  },
  "palette": [
    // band base — dominant + quoin preserve
    { role:"wall.field.ground", block:"smooth_stone",          prov:["dressed-limestone-ashlar"], zone:{base,dominant}, vc:cube stone [65.491,-0.002,0] },
    { role:"wall.dressing.quoin", block:"chiseled_stone_bricks",prov:["worked-quoin-stone"],       zone:{base,preserve}, vc:cube stone [50.148,0.578,-0.414] },
    // band upper — dominant + pilaster preserve
    { role:"wall.field.upper",  block:"stone_bricks",          prov:["fine-coursed-ashlar"],      zone:{upper,dominant}, vc:cube stone [51.223,-0.002,0] },
    { role:"wall.pilaster",     block:"polished_diorite",      prov:["polished-freestone"],       zone:{upper,preserve}, vc:cube stone [78.121,0.368,-1.002] },
    // band roof — dominant + course preserves
    { role:"roof.field",        block:"deepslate_tiles",       prov:["imported-lead-and-slate"],  zone:{roof,dominant},  vc:cube stone [23.069,-0.001,0] },
    { role:"roof.course.stairs",block:"stone_brick_stairs",    prov:["riven-stone-slate-courses"],zone:{roof,preserve},  vc:fixture inTable:false family:"stone" },
    { role:"roof.course.slab",  block:"stone_brick_slab",      prov:["riven-stone-slate-courses"],zone:{roof,preserve},  vc:fixture inTable:false family:"stone" },
    // openings (no zone)
    { role:"opening.arch.voussoir", block:"stone_bricks",      prov:["worked-quoin-stone"],       vc:cube stone [51.223,-0.002,0] },
    { role:"door.main",         block:"dark_oak_door",         prov:["panelled-hardwood-joinery"],vc:fixture inTable:false family:null },
    { role:"window.glazing",    block:"glass_pane",            prov:["crown-glass"],              vc:rail inTable:false family:null },
    // chimney (no zone)
    { role:"chimney.stack",     block:"stone_bricks",          prov:["fine-coursed-ashlar"],      vc:cube stone [51.223,-0.002,0] },
    { role:"chimney.cap",       block:"chiseled_stone_bricks", prov:["worked-quoin-stone"],       vc:cube stone [50.148,0.578,-0.414] }
  ],
  "idioms": [
    { name:"roof.hip", params:{ pitch:0.5, blocks:{ field:"deepslate_tiles", stairs:"stone_brick_stairs", slab:"stone_brick_slab" } } },
    { name:"surface.roof-courses" },
    { name:"pilaster" }, { name:"quoin" },
    { name:"plinth", params:{ courses:1, block:"chiseled_stone_bricks" } },
    { name:"course.slab", params:{ block:"stone_brick_slab" } },
    { name:"eave-overhang" },
    { name:"arch", params:{ block:"stone_bricks" } },
    { name:"opening-dressing" },
    { name:"chimney", params:{ block:"stone_bricks", cap:"crown", capBlock:"chiseled_stone_bricks" } },
    { name:"hollow" }, { name:"floorplan" }
  ],
  "proportions": {
    "storeyHeight": { min:4, max:6 },
    "pitchClasses": [0.5, 1],
    "openingRhythm": { minSpacing:2, maxSpacing:4 },
    "articulation": { memberPeriod:{min:3,max:5}, maxOverhang:1, maxJettyDepth:1, maxQuoinRun:3 }
  },
  "decoration": [
    { item:"door-lantern", block:"lantern", where:["door"] },
    { item:"area-railings", block:"iron_bars", where:["base"] }
  ],
  "conformance": { "checks":["courses-even","symmetry-held","openings-rhythm","palette-in-pack","watertight","single-component"] }
}
```

(`vc:` shorthand above expands to the real `valueCheck` objects; cubes carry the exact `lab` from the
committed block-Lab table, fixtures/rails carry `formClass`+`inTable`+`family` and **no** `lab` — per
`validateStylePack` step 3. All Lab triples were derived by running the validator's own
`loadBlockTable`/`familyOf`/`derivedFormClass`.)

## Validation invariants the pack honors

- **Idioms ∈ registry** (step 2): every name above is in `IDIOM_REGISTRY`; `params` match each idiom's
  `paramsSchema` (`roof.hip` pitch+blocks; `plinth` courses+block; `course.slab` block; `arch` block;
  `chimney` block+cap+capBlock).
- **Provenance closure** (step 1): every `prov` key is a `sources` key.
- **valueCheck truth** (step 3): cubes in-table with exact Lab + `family:"stone"`; `stone_brick_*` fixtures
  `family:"stone"`; `dark_oak_door` fixture `family:null`; `glass_pane` rail `family:null`. No excluded
  candidates.
- **proportions** (step 4): `min≤max`; `pitchClasses [0.5,1] ⊆ {0.5,1,2,3}`.
- **conformance** (step 5): all six names ∈ `CONFORMANCE_CHECK_NAMES`.
- **zone seats** (step 6): base→dominant `wall.field.ground` + preserve quoin; upper→dominant
  `wall.field.upper` + preserve pilaster; roof→dominant `roof.field` + preserve courses. One dominant/band.

## DG7 (the fixture) — assertion shape

```
const GUILDHALL = loadStylePack(.../packs/guildhall.json);   // throws if the pack is invalid
const g = styleProfileBlock({ pack: GUILDHALL });
const r = styleProfileBlock({ pack: RUSTIC });
// guildhall carries classical grammar rustic LACKS (wrong-style MISSING):
assert.match(g, /pilaster/); assert.match(g, /quoin/);
assert.match(g, /arch/);     assert.doesNotMatch(g, /head\.flat/);
assert.match(g, /roof\.hip/);
// guildhall LACKS the vernacular grammar rustic leans on (wrong-style PRESENT-but-forbidden):
assert.doesNotMatch(g, /timber-frame/);
assert.match(r, /timber-frame/);
// it is genuine grammar, not a recolor: a WALL idiom (pilaster) + an OPENING idiom (arch) differ, not just blocks
assert.match(g, /deepslate_tiles/);   // lead-grey stone roof, not warm timber
assert.doesNotMatch(g, /spruce_planks/);
// suite selection by declared style (same build, two styles → different expected)
const asGuild = diagnoseRenderArgs({ program:{...PROGRAM, style:"guildhall"}, pack:GUILDHALL, azimuths:AZ });
assert.equal(asGuild.style, "guildhall");
assert.notEqual(asGuild.style_profile, diagnoseRenderArgs({program:{...PROGRAM,style:"rustic"},pack:RUSTIC,azimuths:AZ}).style_profile);
// self-grep discipline: no subject names baked in
for (const s of ["barn","cottage","synthetic","gatehouse","church"]) assert.doesNotMatch(g, new RegExp(s));
```

## Ordering

1. Write `packs/guildhall.json`.
2. Validate it in isolation (a throwaway `loadStylePack` run) — fix any `valueCheck`/zone error loudly.
3. Add DG7 to `diagnose.test.mjs`.
4. `npm test` green.
5. Write `FINDINGS.md` (AC3).
</content>
