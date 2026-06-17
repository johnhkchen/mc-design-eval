# T-189-01 — REVIEW: the roof-material hand is built and clears its named defect

**Verdict: the highest-leverage missing hand is built and demonstrably closes the eyes-vs-hands gap it
targets.** The S-188 climb's #1 EYES-ONLY defect — `ROOF·replace·major`, "the roof reads brown where the
concept shows grey stone," named every round and stopped on by the agent ("dark roof value … no tool
addresses it") — is now fixable: `recolor_roof` rebuilds the gable in the concept-true grey, and the
picture-critique's major roof-material item **fires on brown and clears on grey** (confirmed on the glance
AND in two metered DiagnoseBuild runs). Closure held (byte-identical roof geometry). The frozen instrument
is untouched and `npm test` is green (2319/0).

## What changed

| File | Change |
|---|---|
| `src/recognition/roof-material.mjs` | **NEW, pure.** `reconcileRoofMaterial` (program↔material-map join), `roofMaterialFamily` (semantic timber/stone), `materialMapRoofBlock`. |
| `src/recognition/roof-material.test.mjs` | **NEW.** RM1–RM6 — family classifier, roof-block lookup, the gatehouse correction, the matched no-op, graceful degradation, purity. |
| `src/workshop/climb-gate.mjs` (+test) | `TOOL_DEPARTMENTS.recolor_roof = ["ROOF"]` so `classifyInventory` records the roof hand. |
| `experiments/eval-alignment/picture-climb.mjs` | The `recolor_roof` occ→occ hand; `TOOLS`/`MENU`/agent enum; `MATERIAL_MAP_PATH` (+guard); `ROOF_MATERIAL_PROBE` (zero-spend triptych glance) + `ROOF_MATERIAL_DIAGNOSE` (metered critique-fires→clears proof). |
| `builds/gatehouse/picture-climb/roof-material/*.png` | The brown→grey glance (seed / brown gable / grey gable, each beside the concept). |

Commits: `1eab339` (pure core + dept), `f01565b` (runner lever + probe), `7b6fed8` (diagnose harness),
+ this docs commit. **`measurements/`, `compile.mjs`, the program/pack JSON, the seed artifact, and
`autonomy-loop.mjs` are all untouched** — the loop applies the fix; nothing is pre-corrected or hand-painted.

## 1. The diagnosis (where material identity is decided)

Recognition produced **two artifacts that disagreed at the roof and were never reconciled**: the program
(`roof.fieldRole:"roof.trim"` → `dark_oak_planks`, the "darken toward oak as the barn does" heuristic — a
mis-read for this grey-stone gatehouse) and the material-map (`roof` → `deepslate_tiles`, read straight off
the concept). The build's compile path consumes only the program; the material-map's concept-true roof
colour was ignored. `reconcileRoofMaterial` joins them **where identity is decided**: on a timber↔stone
family flip the material-map (which read the picture) wins. This is a recognition fix, not a brush — the AC's
"fix where the material identity is decided, not by hand-painting" is honoured literally.

Post-E-47 the concept image is the standard and the pack is a naming vocabulary only, so a concept-true
out-of-pack block (`deepslate_tiles`, not in the rustic pack) is a **match, not a `replace`** — exactly the
licence `diagnose.mjs:82` grants.

## 2. The verification — critique-fires → lever-applied → critique-clears

The AC asks the named defect to go fires→clears on its department without regressing closure or another
department. All four legs verified:

- **Fires.** Metered DiagnoseBuild on the brown gable (`apply_gable_roof`): ROOF `major/replace` —
  *"the dark roof value the concept shows; the whole covering reads light-wood instead of dark."* (Both runs.)
- **Lever applied.** `recolor_roof` rebuilds the gable with `FAMILY={field:deepslate_tiles, stairs:null,
  slab:null}` (honest grey cubes — the canonical non-pack-field realization, no `_stairs` name-derivation).
- **Clears.** On the grey gable that ROOF `major/replace` is **GONE** — only a `minor/add` eave-verge band
  remains (both runs). The agent's stop-reason defect is resolved.
- **Closure held.** `recolor_roof(occ)` cell **positions == `apply_gable_roof(occ)` positions** (8692 ==
  8692) — identical silhouette, only the block id differs. No air-op, no recess (the wedge is rebuilt).
- **No department regressed on the build.** `recolor_roof` only touches y ≥ eave; the walls/openings are
  **byte-identical** between the brown and grey builds. On the glance the roof stays a distinct dark mass
  (the material-map chose `deepslate_tiles` darker than the wall stone precisely so the roof recedes — it
  does; no collapse into the grey walls).

The glance (`builds/gatehouse/picture-climb/roof-material/`, gitignored; tracked copies committed in this
work dir as `roof-{seed,gable-brown,recolored-grey}-beside.png`): the brown gable reads orange-brown against the
grey walls (the eyes-but-no-hands wall — the best the existing hands reach); the grey gable reads dark-grey,
matching the concept's dark-grey roof.

## 3. The honest finding — the hand works, the climb's SCALAR gate cannot see it (S-190 input)

The roof defect clears on the **department-grained qualitative critique**, but the **whole-build
`styleFidelityScore` does not credit it**, and this is worth stating at full strength:

- The scalar is **noise-dominated**: the same two builds scored brown 60 / grey 32 in run A and brown 24 /
  grey 44 in run B — a 24↔60 swing on an unchanged build (the 0–76 vote variance T-187 measured). At VOTES=3
  the median is not a reliable steering signal.
- **Attention-shift, not regression**: `nMajor` stays at 1 because once the ROOF major clears, the judge
  promotes a **pre-existing** WALL item (the cobble rubble-quoin contrast — named `minor/add` on the *brown*
  build too) to `major/replace`. The graded-breadth cap then pins the scalar low while any major remains.
  The wall did not change (byte-identical); the critique's *ranking* moved to the next real divergence.

So if `recolor_roof` were gated by `acceptsRound` on the median scalar **as-is**, the correct grey fix could
be **rolled back** despite clearing the roof defect. That is precisely the epic's named risk — *"the gradient
is good enough to rank but too coarse to steer"* and *"the accept-gate is the sub-problem"* — now located
with evidence. **This is S-190's problem (a department-aware or less-noisy accept signal), not a defect in
the hand.** It also corroborates T-188's closing note: *"the picture critique steers at a finer grain
(form vs material) than the hands or the inventory resolve."*

## 4. Generality (named, not forced — E-49 input)

`reconcileRoofMaterial` is general: any (program, pack, material-map). RM4 proves the **no-op on a matched
timber subject** (program roof timber + concept roof timber → `corrected:false`, program block kept) and RM5
the graceful path (no material-map roof entry, or an `other`-family roof → conservative no-op). So the hand
fixes the gatehouse and stays silent where there is nothing to fix. **Multi-subject demonstration is E-49**,
named not forced (the AC's "named for E-49, not forced").

## 5. Test coverage & gaps

- **Unit (in `npm test`, 6 new + 1 assertion):** the reconcile *decision* — the highest-leverage thing to
  get right — is fully covered without GL/LLM (RM1–RM6 + the `TOOL_DEPARTMENTS` assertion). 2319/0 green.
- **Geometry no-regress:** the positions-identical check (Step-5 smoke) is run manually, not in `npm test`
  (it needs the seed occ + the roof brushes — heavier than a unit). Documented here and reproducible via the
  smoke in `plan.md` Step 5. A candidate to harden into a fixture test if the hand graduates into `src/`.
- **Glance + metered:** out of `npm test` (GL + metered), like every `experiments/` sibling. The renders are
  committed; `ROOF_MATERIAL_DIAGNOSE` re-runs the metered proof.

## 6. Open concerns for the human reviewer

1. **The scalar gate (§3) is the binding constraint on the climb now, not the hands** — the most important
   takeaway. S-190 must make the accept signal department-aware or less noisy, or `recolor_roof` won't
   survive a real climb despite being correct. **This is the headline.**
2. **`recolor_roof` lives in the `experiments/` runner**, not `src/`. The *decision* is in `src/` and tested;
   the occ-rebuild lever is a near-clone of `apply_gable_roof` and shares its provenance. If the climb
   formalizes, both roof hands should graduate together into a tested `src/` brush.
3. **`deepslate_tiles` renders correctly** (verified on the glance) and is a real 1.20 block; the grey roof
   is honest cubes (no stair/slab members), faithful to the voxel medium (T-187 tolerance), which reads as
   grey, not as a divergence.
4. **The next eyes-vs-hands item is WALL quoin-contrast** (the new dominant major) — `construct_walls`'
   territory, a hand that exists; a candidate for the next climb round, out of scope here.
