# T-165-02 — Design

**Decision in one line:** ship a **second, genuinely non-rustic style — `guildhall`, a polite/classical
dressed-ashlar town building** — as a validated pack whose WALL and OPENING grammar differ from rustic at
the *idiom* level (pilaster/quoin/arch, not timber-frame/flat-lintel), pin the wrong-style signal with a
deterministic fixture, and **record honestly** that the ROOF axis can only differ *within* the pitched
family — the orthogonal-roof gap is the finding, scoped to a generator epic.

## Options considered

### A. A third rustic-family variant (REJECTED — it is the reskin the ticket forbids)
E.g. a "moorland croft" with different stone blocks but the same gable + timber-frame + flat-lintel grammar.
Cheap, passes validation, and would make S-166 pass meaninglessly. The ticket's Notes call this out
explicitly: "A reskin masquerading as a second style would make S-166 pass meaninglessly — the bar is
*different grammar*." Rejected on the bar.

### B. An exotic style needing new roof idioms — flat-roofed Mediterranean / domed mausoleum (REJECTED as the *whole* answer)
Maximally different, but `validateStylePack` step 2 rejects any idiom not in the registry, and there is no
flat/dome/parapet idiom. Authoring this style *honestly* is impossible today: the pack would fail to
validate, or I'd have to fake an idiom the builder can't realize (faking breadth — forbidden). This is not
a style I can ship; it is the **shape of the finding** — recorded in AC3, not built.

### C. A polite/classical dressed-ashlar style within the registry (CHOSEN)
The deepest contrast to rustic that the registry can express *honestly*:

| axis | rustic (vernacular) | `guildhall` (polite/classical) | idiom-level diff? |
|------|---------------------|-------------------------------|-------------------|
| WALL | `timber-frame` + `jetty`; rubble ground (`cobblestone`) + plaster-on-frame upper | `pilaster` + `quoin` + `plinth`; full-height dressed ashlar (`smooth_stone`/`stone_bricks`), **no** `timber-frame` | **YES** — different construction system |
| OPENING | `head.flat` + `opening-dressing`; oak lattice | `arch` + `opening-dressing`; round-arched dressed `stone_bricks`, **no** `head.flat` | **YES** — round arch vs flat lintel |
| ROOF | `roof.gable`/`hip`/`pyramid`, steep (`pitchClasses [1,2]`), warm `spruce_planks` timber | `roof.hip`, shallow (`pitchClasses [0.5,1]`), lead-grey `deepslate_tiles` stone courses | **partial** — different idiom (hip) + pitch + material, **but still pitched** |

WALL and OPENING are genuine *grammar* differences (different idioms, not recolors). ROOF differs on idiom
(hip vs gable), pitch (shallow vs steep) and material (stone vs timber) — but remains a pitched roof,
because that is the registry ceiling. This is exactly the "push it as far as real idioms allow, then name
the wall you hit" posture the anti-hedge directive demands.

## Why `guildhall` is a different *family*, not a reskin

rustic and saltcrag are **vernacular** — built by local tradition out of what the land gives (timber frame,
rubble, tarred board). `guildhall` is **polite/classical** — built by masons to architectural orders:
pilastered bays, round-arched arcade, dressed ashlar throughout, money spent on a formal frontage. That is
a real art-historical family boundary (vernacular vs polite architecture), and it surfaces as *different
idioms*, not different paint on the same idioms. DG5 already shows rustic≠saltcrag; the new DG7 will show
`guildhall` carries `pilaster`/`quoin`/`arch` that **neither** rustic nor saltcrag has, and lacks the
`timber-frame`/`head.flat` both vernacular styles lean on.

## The honest ceiling (AC3 — the finding, recorded not hidden)

The falsifiable claim **succeeds on WALL+OPENING and is capped on ROOF**:

- **Succeeds:** a rustic build (timber-frame, steep gable, flat-head wagon doors) critiqued under
  `guildhall` yields wrong-*style* `missing` (pilasters, quoins, round arches, dressed-ashlar full-height
  walls) and `present` (timber-frame the classical style forbids; steep timber gable; flat-head openings) —
  not "wrong colour". AC2 met.
- **Capped:** the single most legible style signal — roof *form* — cannot go orthogonal. Flat/parapet,
  mansard, dome, deep-eave (the things that make a Mediterranean, a pagoda, a Beaux-Arts mansard read
  instantly) have **no idiom**. `guildhall`'s roof is "a shallow stone-coursed hip" — distinguishable from
  rustic's steep timber gable, but both are pitched. **A truly orthogonal roof language needs new
  constructs → a generator epic** (new roof idioms: `roof.flat`/`roof.parapet`/`roof.mansard`/`roof.dome`,
  each with a brush + paramsSchema + departmentOf=ROOF). This ticket names that epic; it does not fake it.

This is the *most* portfolio-worthy outcome the anti-hedge memory asks for: the claim is split into the
part the registry can honor (wall/opening grammar — real, fixture-proven) and the part it cannot (roof
form — named, scoped), with no inflation either way.

## Provable witness vs deferred

- **Provable in `npm test` (this ticket):** `packs/guildhall.json` passes `loadStylePack` (schema +
  semantic), and a deterministic fixture (DG7) shows the SAME barn program yields a guildhall `style_profile`
  whose WALL/OPENING grammar genuinely differs from rustic's — wrong-style `missing`/`present` material.
  This mirrors T-165-01's posture: the deterministic profile-diff is the witness; the live `expected`-prose
  diff is a metered call.
- **Deferred to S-166 (named, not silently dropped):** the live clean×wrong-style **crater** (does the
  model's emitted critique actually tank?) and the house-scale **matched concept render** (S-166 AC2 owns
  "renders beside both concepts"). An existing stand-in concept (`benchmarks/temple-facade/concepts/
  arc-A-flash.png` — dressed stone + round arch) is referenced; a perfectly matched house-scale image is a
  metered image-gen call I will not fire unprompted.

## Concrete pack shape (full spec in structure.md)

- **style:** `guildhall`. **No `ratification`** (optional; honest — an unratified eval-only `expected`
  profile, like rustic predates the formation chain).
- **provenance:** a prosperous wool-market town; masons not carpenters; dressed limestone ashlar, polished
  freestone pilasters, worked quoins, imported lead/slate roof, crown glass, panelled joinery. Every
  `palette[].provenance` key present in `provenance.sources`.
- **palette (all valueChecks derived & verified):** full-height ashlar (`smooth_stone` ground / `stone_bricks`
  upper), `polished_diorite` pilasters, `chiseled_stone_bricks` quoins+cap, `deepslate_tiles` roof field
  with `stone_brick_stairs`/`stone_brick_slab` courses, `stone_bricks` arch voussoirs, `dark_oak_door`,
  `glass_pane`, `stone_bricks` chimney.
- **idioms (registry-real):** ROOF `roof.hip` + `surface.roof-courses`; WALL `pilaster`,`quoin`,`plinth`,
  `course.slab`,`eave-overhang`; OPENING `arch`,`opening-dressing`; ROOM `hollow`,`floorplan`; CHIMNEY
  `chimney`. **No** `timber-frame`,`jetty`,`head.flat`,`roof.gable`.
- **proportions:** `storeyHeight {4,6}` (tall classical storeys), `pitchClasses [0.5,1]` (shallow),
  `openingRhythm {2,4}` (regular bays); optional `articulation` (pilaster `memberPeriod`).
- **conformance:** the shared check vocabulary.

## Risk

Low and contained. Additive: one new pack file + one new test; no existing pin moves (FX-DB1, FX-R1,
replay, offline, the frozen instrument all untouched). The only way this regresses is a bad `valueCheck`
snapshot → `loadStylePack` throws loudly in the new test, caught before commit.
</content>
