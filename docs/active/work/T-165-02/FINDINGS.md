# T-165-02 — FINDINGS (the honest record, AC3)

**Lead with how the claim fails.** The falsifiable claim was: a non-rustic style profile makes Layer A
describe a *materially different* `expected` (different roof idiom, wall grammar, opening treatment) — and
it **fails if** the only `expected` we can author still resolves to rustic idioms, because the
idiom-registry/grammar can't express a second language → then real differentiation needs a
grammar-expressing schema + new idioms (a generator epic), and *that* is the finding.

**It lands as a SPLIT, and both halves are recorded here without inflation or false brutality.**

## What genuinely differs (the claim SUCCEEDS — WALL + OPENING grammar)

`guildhall` is a **polite/classical** style, not a third **vernacular** reskin. It differs from rustic (and
saltcrag) at the **idiom** level — different construction systems, not different paint on the same idioms:

| axis | rustic / saltcrag (vernacular) | guildhall (polite/classical) | difference |
|------|-------------------------------|------------------------------|------------|
| WALL | `timber-frame` + `jetty`; rubble ground + plaster-on-frame upper | `pilaster` + `quoin` + `plinth`; full-height dressed ashlar, **no** `timber-frame` | **different idioms** — an applied classical order vs a structural timber frame |
| OPENING | `head.flat` + `opening-dressing`; oak lattice | `arch` + `opening-dressing`; round-arched dressed voussoirs, **no** `head.flat` | **different idiom** — round arch vs flat lintel |

DG7 proves this deterministically: a rustic barn critiqued under guildhall's `expected` reads as wrong
*grammar* — **missing** pilasters/quoins/round arches/dressed-ashlar walls; **presenting** the
`timber-frame` + flat-head openings the classical style forbids. That is the wrong-*style* `missing`/
`present` signal AC2 asked for, **not** "wrong colour". This is a real second language the registry *can*
speak — vernacular framing vs the classical order is a genuine art-historical family boundary, and it
surfaces as distinct idioms.

## What does NOT differ — the registry ceiling (the FINDING)

The single most legible style signal — **roof form** — cannot go orthogonal to "pitched". Every roof idiom
in `IDIOM_REGISTRY` is a pitched roof:

```
roof.gable  roof.gable.steep  roof.hip  roof.pyramid  roof.thatch  dormer  surface.roof-courses
```

There is **no** `roof.flat`, `roof.parapet`, `roof.mansard`, `roof.gambrel`, `roof.dome`, `roof.vault`, or
deep-eave idiom. `validateStylePack` (style-pack.mjs:129) rejects any pack idiom not in the registry, so I
**cannot** author a flat-roofed Mediterranean, a parapeted Georgian, a mansarded Beaux-Arts, a domed
mausoleum, or a deep-eaved pagoda *honestly* — the pack would fail to validate, and faking an idiom the
builder can't realize is exactly the "fake breadth with a recolor" the ticket forbids.

So guildhall's roof differs from rustic's on **idiom** (`roof.hip` vs `roof.gable`), **pitch** (shallow
`[0.5,1]` vs steep `[1,2]`), and **material** (lead-grey `deepslate_tiles` stone vs warm `spruce_planks`
timber) — a real, fixture-asserted difference — **but it is still a pitched roof.** The things that make a
flat-roofed townscape, a pagoda, or a domed monument read *instantly* are out of reach.

### The scoped generator epic (what closes this gap)

Real roof-form differentiation needs **new constructs**, not a new pack. The epic:

1. **New roof idioms** — `roof.flat` / `roof.parapet` (flat deck + parapet course),
   `roof.mansard` (double-pitch), `roof.dome` / `roof.vault` (curved), `roof.deep-eave` (East-Asian
   bracketed overhang). Each = a brush in `src/view/` + a `paramsSchema` + registration through the brush
   door + `departmentOf` → `ROOF` (it starts with `roof.`, so the partition already routes it).
2. **Generator support** so the build path can realize them (the workshop/seed roof stage currently assumes
   a pitched prism — out of scope for an *eval* `expected` profile, but the prerequisite for a *built*
   non-pitched style).
3. **`pitchClasses` becomes optional / roof-form-tagged** — a flat roof has no pitch class; the proportion
   schema's `pitchClasses` (required, `⊆{0.5,1,2,3}`) is currently pitched-only.

Until that epic lands, **WALL and OPENING are where a second style's grammar genuinely bites; ROOF form is
capped at "which pitched roof".** That is the registry's honest reach, named — not hidden.

## Deferred to S-166 (named, not silently dropped)

T-165-02's *provable* witness is the deterministic DG7 profile-diff + the validated pack (the same posture
as T-165-01: the input the judge forms `expected` from genuinely differs). Two things this ticket does
**not** settle, owned by S-166's referee:

- **The live crater.** Whether the *model's emitted critique* actually tanks a clean rustic build scored
  against a guildhall (wrong-style) concept — S-166 AC2's clean×wrong-style spread. If it does **not**
  crater, the per-style `expected` is cosmetic and the blindness is in the model's reading (S-166's most
  important negative result) — not something T-165-02 can or should claim.
- **The matched house-scale concept render.** S-166 AC2 owns "renders beside both concepts". An existing
  stand-in concept with the right *grammar* is on disk: `benchmarks/temple-facade/concepts/arc-A-flash.png`
  (dressed stone + round arch). It is a monument, not a house-scale guildhall; a perfectly matched image is
  an outward/metered image-gen call I did not fire unprompted. The `diagnose:smoke` runner does not yet
  expose `--pack guildhall`; wiring that is the S-166 bake-off harness, not this ticket.

## Bottom line

A second, genuinely different (polite/classical, not vernacular) style **is** expressible and **does**
produce a wrong-style grammar signal on the **WALL** and **OPENING** axes — fixture-proven, not a reskin.
The **ROOF-form** axis hits the registry ceiling: every roof idiom is pitched, so the most legible style
signal can't go orthogonal — a generator epic (new non-pitched roof idioms) is the named next gate. The
within-family blindness can now be *disproven* on two of three axes today; the third is scoped, not faked.
</content>
