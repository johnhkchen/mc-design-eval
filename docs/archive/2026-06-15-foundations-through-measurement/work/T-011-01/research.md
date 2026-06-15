# Research — T-011-01: ground-on-arc (triumphal-arch generalization)

Descriptive map of the code, data, and prior results this ticket touches. No solutions here.

## What the ticket asks (restated)

Run the **champion** `vRefRevise-designdoc` pipeline on `references/arc_de_triomph.JPG` (the Arc de
Triomphe) and record whether the principles derived on the Taj/Hōryū-ji/Sainte-Chapelle arc hold on a
**massing unlike any prior reference**: a Roman triumphal arch whose identity is a **single colossal
opening**. This is the **fifth** run-the-test (E-08 / S-011 / spec §7, §11), gated on `T-008-01`. There
was an earlier strong run (009) — re-run under the *current* champion to measure cumulative progress.

Three explicit reads (from the ticket Context + AC #2):
1. **P13 — proportion/rhythm on "one giant arch".** Does the champion give a single-opening massing a
   coherent bay rhythm / proportion, or does the lone arch produce a top-heavy or hollow silhouette?
2. **P12 — color from the brief.** The Arc is **pale cream limestone** (near-monochrome) — a *fourth*
   pale reference. Does color still come from the brief, not the stone?
3. **Detail lever (S-006/S-010, P15) — the sharp test.** Does the detail clause fill the arch's broad
   flat **attic** (upper band) and **spandrel** fields — the *classic flat-field failure*? The Arc is
   mostly flat field with concentrated relief, so this is the toughest flat-field stress in the chain.

Generalization run, not a tuning run: champion config **as-is**, record any minimal diff only if a
principle visibly fails. Rubric (`judge.*`) and brief (`task.mjs`) immutable (AC).

## The reference (`references/arc_de_triomph.JPG`, ~59 KB JPG) — inspected directly

A daylight 3/4 front view of the **Arc de Triomphe de l'Étoile**, Paris. What it shows:
- **Massing: a single rectangular pier-block pierced by ONE colossal round-arched opening**, roughly
  square in outline (the real arch is ~50 m tall × ~45 m wide). No towers, no minarets, no tiered
  pagoda, no Gothic vessel — the antithesis of every prior reference's silhouette. A smaller transverse
  opening is visible through the pier but the **front identity is the one great arch**.
- **Palette: pale cream / warm-grey limestone**, near-monochrome, under blue sky. This is the **fourth
  pale reference** in the chain (white Taj / dark-timber Hōryū-ji / pale-stone Sainte-Chapelle / now
  cream limestone) — another P12 *conflict* condition (pale ref vs the brief's "COLORFUL" demand), **not**
  the still-untested genuine-agreement (polychrome image) case.
- **The flat-field structure is the whole point.** The facade is dominated by **broad flat fields**: the
  tall **spandrel panels** flanking the arch (each carrying ONE deep high-relief sculptural group — the
  *Départ de 1792* / "La Marseillaise" and companions), and the **massive attic band** above the cornice
  (a row of shallow shield/medallion reliefs over an otherwise plain wall). Between those concentrated
  relief zones, the stone is **plain ashlar**. A heavy multi-course **entablature/cornice** caps the
  pier; the arch soffit is **deeply coffered**. So the Arc is exactly the build pattern P15 names as the
  holdout: large flat planes punctuated by isolated relief — the literal "attic and spandrel flat
  fields" the ticket calls out.

**Why this is the sharpest detail test yet:** unlike the Taj (all-over brick texture), Hōryū-ji (timber
bracketing) or the Gothic chapel (all-over tracery), the Arc's *correct* surface is mostly **smooth
ashlar with a few dense relief panels**. The model must (a) reproduce that concentrate-relief-on-flat-
field grammar AND (b) avoid the failure where the broad attic/spandrels render as inert blank walls. The
detail clause ("NO LARGE FLAT FIELDS: any wall plane wider than ~6 blocks must carry layered relief")
points the opposite way from the reference's actual smooth ashlar — a genuine tension to observe.

**P13 nuance:** P13 ("a facade is ONE connected plane; borrow rhythm not 3-D standalone parts") was
authored against *lateral* freestanding parts (Taj minarets) and generalized to *vertical* ones (Hōryū-ji
pagoda tiers). The Arc has **no standalone parts at all** — it is already a single connected block. So the
P13 *detachment* hazard is near-absent here; the proportion read is instead "does a single-opening massing
get a coherent silhouette and bay rhythm" (the ticket's phrasing), a different stress than the prior runs.

## The pipeline (`benchmarks/temple-facade/run.mjs`, approach `vRefRevise-designdoc`)

Three live `claude -p` calls (spec §4), each via `src/sdk-binding.mjs`:

1. **Stage 1 — reference-grounded design doc** (`composeReferenceDesignDocPrompt`, L369;
   `requestTextWithImage` w/ ref). Writes `design-doc.md`. Carries P12 inline (reference = craft, not
   color; color from the brief even if the reference is pale).
2. **Stage 2 — high-res build** (`composeHighResBuildPrompt`, L263; `requestDesignArtifact`). Deep relief
   + full-width crown; caps width ~56 / height ~48 / depth ~24. Renders `round-0.png` (pre-revision).
3. **Stage 3 — reference-compared 2nd pass** (`composeRefRevisionPrompt`, L408;
   `requestDesignArtifactWithImage` w/ ref + round-0). Carries the principles under test: the **P12
   color-hold** (L412–414 + L433–436), the **P13 one-plane block** (L419–423), and the **detail / NO
   LARGE FLAT FIELDS** clause (L429–432). Produces final `artifact.json` → `render.png`.

`main()` (L1085): `--ref` selects the reference (default `sys_mausoleum.JPG`); the run lands in
`runs/<NNN-approach>/` (**next id = 021-vRefRevise-designdoc** — runs 001–020 present, none use the Arc).
`main` auto-judges **`render.png`** only (median-of-3, L1114), writes `summary.json`, regenerates the
README gallery. **`round-0.png` is NOT auto-judged** — that needs the helper (below), required by AC #1 /
P14.

## The judge (`judge.mjs` → `baml-judge.mts`, rubric `v2-categorical-baml`)

`judgeRender({ imagePath, brief, samples = 3 })` shells to the BAML categorical judge, returns a
**median-of-3** per-dimension verdict: `proportion / color / detail / fidelity / overall`, each in
`{weak, competent, strong, exceptional}`, plus `perSample` + `notes`. **Frozen** for this ticket. The
`exceptional` tier was recently sharpened (commit 0fd091d, rightfully-rare apex); **weak/competent/strong
boundaries unchanged**, so scores stay comparable to runs 010–020.

## Round-0 judging helper (already exists, reusable)

`docs/active/work/T-006-01/judge-round0.mjs` (also copied into T-007-01 and T-008-01): scores any PNG via
the same `judgeRender` seam, median-of-3, against `TEMPLE_FACADE_TASK.goal`. CLI: `node …/judge-round0.mjs
<path.png>`. Copy the same helper into this ticket's work dir to A/B `round-0.png` vs `render.png`
(P14: judge both rounds, don't assume the 2nd pass is better). Same relative-import depth — no path edit.

## The journal / attempt-log (the substantive deliverable)

`docs/knowledge/design-learnings.md` — "**Attempt log (newest last)**". The log currently ends at the
**run 020** (Sainte-Chapelle / T-008-01) entry. Lisa auto-injects this file, so entries feed forward. AC
#2/#3 require a dated entry: per-dimension A/B scores (round-0 vs render), held/failed verdict for **P12
and P13 on this massing**, and **specifically whether the detail lever resolved the attic/spandrel flat
fields**. Any diff recorded; `npm test` green.

## Champion-config state (the inherited baseline)

- The working tree is **clean vs HEAD** on `run.mjs` at session start (`git diff --stat HEAD` empty) —
  same as T-008-01, unlike T-007-01 (which had S-010's un-promoted texture-grain edit to revert). So **no
  revert is needed**: HEAD already *is* the champion.
- HEAD's committed champion = the **015 "NO LARGE FLAT FIELDS" menu** detail bullet (L429–432; runs
  014/015 `overall=strong`). The P12 color-hold (L412–414, L433–436) and P13 one-plane (L419–423) blocks
  are the committed champion text.
- The two upstream detail experiments (S-006 panel grammar, S-010 texture grain) **did not promote**;
  HEAD reflects that. The detail dimension is read here with the P15 noise caveat, not as a tuned lever.

## Reference baseline for the A/B (prior champion generalization runs)

| run | ref | proportion (r0→render) | color | detail | fidelity | overall |
|-----|-----|------------------------|-------|--------|----------|---------|
| 014 | Taj | competent→**strong** | strong | competent | strong | **strong (3/3)** |
| 015 | Taj | strong | strong | strong | strong | **strong (3/3)** |
| 019 | Hōryū-ji | strong→strong | strong | competent | strong | **strong (3/3)** both rounds |
| 020 | Sainte-Chapelle | **strong**→competent | strong | competent | **strong**→competent | **strong→competent** (2nd-pass regressed) |

Pattern: P12 (color) reached `strong` off all three pale references; `detail` stayed `competent`
everywhere (the holdout); the 2nd pass is a coin-flip (held 014/019, regressed 013/017/020). `detail` is
boundary-noisy (P15 caveat) — a single generation's `detail` score is not over-credited. **Color (P12)
is structural/low-variance; proportion (P13) the secondary structural read; detail the noisy read with
the sharpest qualitative test here (attic/spandrel flat fields).**

## Constraints & assumptions

- **Frozen:** `task.mjs` (brief/seed=11/view), `judge.*` (rubric). Confirmed by AC.
- **Live & metered:** one `vRefRevise` run ≈ 3 model calls, ~10–15 min wall, ~$1.5–2.1 (runs 014–020).
- **`claude -p` knobs:** no `--temperature`; `--effort`/`--system-prompt` available but out of scope
  (generalization run, champion as-is). `claude` v2.1.165 on PATH; `node` v22.22.
- **Determinism:** seed fixed (11) but `claude -p` is not deterministic; generation noise is real (esp.
  `detail`). Color is structural/low-variance — a single high-quality render answers P12 reliably; a
  single `detail` score is read with the P15 caveat.
- **`npm test`** (133 tests, confirmed green at session start) guards only artifact validation; a
  prompt-string edit has no unit test. Tests must stay green if any minimal generalizing edit is made.
