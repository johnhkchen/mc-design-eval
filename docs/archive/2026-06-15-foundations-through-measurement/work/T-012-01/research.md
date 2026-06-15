# Research — T-012-01: ground-on-mausoleum (cumulative-progress on the founding reference)

Descriptive map of the code, data, and prior results this ticket touches. No solutions here.

## What the ticket asks (restated)

Re-run the **champion** `vRefRevise-designdoc` pipeline on `references/sys_mausoleum.JPG` (the **Sun
Yat-sen Mausoleum** sacrificial hall) and measure **how far the accumulated technique has moved this one
fixed reference**. This is the **sixth** run-the-test (E-08 / S-012 / spec §7, §11), gated on `T-011-01`.

What makes this ticket different from the other generalization runs: the mausoleum is **the reference that
first proved grounding** (run 008, `vRef-designdoc`). Run 008 *predates every technique discovered since* —
the craft/color split (P12), the one-plane rule (P13), NO-LARGE-FLAT-FIELDS, the high-res deep-relief
build, the constrained 2nd pass (P14) — **and** it was scored on the now-retired **v1 numeric (1–5 mean)**
rubric, not the current **v2 categorical (median-of-3)** judge. So this is **not** a "does X generalize to
a new massing" probe like 010/019/020/021; it is a **cumulative-progress measurement on a held-fixed
reference**: same image, same brief, same seed — only the accumulated pipeline differs from run 008.

Generalization/measurement run, not a tuning run: champion config **as-is**, record any minimal diff only
if a principle visibly fails. Rubric (`judge.*`) and brief (`task.mjs`) immutable (AC).

## The reference (`references/sys_mausoleum.JPG`, ~466 KB JPG) — inspected directly

A daylight front-on view of the **Sun Yat-sen Mausoleum 祭堂 (sacrificial hall)**, Nanjing. What it shows:
- **Massing: a tall white granite memorial-hall block under a DOUBLE-EAVED (two stacked) blue hipped
  roof**, flanked by two massive **battered (inward-sloping) white stone wing-walls / pylon-buttresses**
  that step down to either side. The base is pierced by a **triple round-arched gate** (three arched
  portals). A monumental ceremonial **stairway** sweeps up to the portals. So the silhouette is: stacked
  tiered roof on top, columnar/wall body in the middle, arcaded battered base below — a **vertically
  layered, axially symmetric** mass, unlike the Taj dome, the Hōryū-ji pagoda tower, the Gothic vessel, or
  the Arc's single void.
- **Palette: cobalt/Prussian BLUE glazed-tile roofs + WHITE granite walls**, with small **gold** inscription
  tablets over the arches, under blue sky. This is a **genuinely two-tone, mildly-colorful** reference —
  materially different from the four *pale near-monochrome* references that came before (white Taj /
  dark-timber Hōryū-ji / pale-stone Sainte-Chapelle / cream-limestone Arc). The blue roof is a real
  saturated hue. **This is the closest the chain has come to the long-sought "reference and brief AGREE on
  color" condition** that runs 020/021 wanted but never got — though it is only a *partial* agreement:
  blue+white is a restrained cool two-hue scheme, not the brief's full dominant/supporting/accent
  polychrome. So P12 is tested here under a **mild-agreement** palette, a genuinely new P12 condition.
- **The flat-field structure is, again, the whole point of the detail read.** The facade is dominated by
  **broad smooth white fields**: the two battered wing-walls are large plain ashlar planes; the wall band
  between the arches and the lower roof is a wide smooth register; the body walls under the upper roof are
  plain. Relief is concentrated in: the **multi-course entablature / dougong bracket band** under each
  eave, the **arched portal surrounds**, and the **inscription tablets**. So the mausoleum is the same
  concentrate-relief-on-flat-field grammar as the Arc — large smooth planes punctuated by dense bands.

**Why this reference is the load-bearing cumulative test:** run 008's v1 judge named **two specific
failures** — *"the columned portico is shallow"* and *"the wide blank base register feels under-detailed."*
Those are exactly a **relief-depth** failure and a **flat-field** failure. Every technique invented since
008 targets precisely those two: the high-res build *requires* deep relief + a full-width crown; the
NO-LARGE-FLAT-FIELDS clause targets blank registers; the one-plane clause keeps masses bonded. So the
sharpest, most direct cumulative-progress question this run can answer is: **did the accumulated pipeline
resolve the two weaknesses run 008's own judge named?** That is a render-grounded yes/no, independent of
the rubric change.

## The three reads (from the ticket Context + AC #2)

1. **008-vs-now comparison (the headline).** How far did the accumulated technique move this reference?
   Care is required because the **rubrics are incommensurable**: 008 = v1 numeric mean (proportion 4 /
   color 4 / detail 3 / fidelity 4 / **overall 4**, all out of 5, "same band as v4", noise ≈0.4); now = v2
   categorical (`weak/competent/strong/exceptional`, median-of-3). A "4/5 → strong" numeric-to-categorical
   mapping is **not** valid. The honest comparison is **qualitative + failure-named**: did the build fix
   008's *shallow portico* and *blank base register*, and what do the new categorical scores read on a
   reference whose v1 ceiling was already high?
2. **P12 — color from the brief, on a *mildly colorful* reference.** First non-pale reference in the chain.
   Does color still come from the brief's invented scheme, or does the model lean on the reference's own
   blue+white (which, note, *worked* under v1 run 008 — it derived "blue-white-gold" and scored color 4)?
3. **P13 — proportion on a double-eaved stacked roof + battered wings.** Stacked roof tiers (cf. Hōryū-ji
   pagoda, P13 vertical case) plus flanking battered buttress-walls (bonded, not freestanding like Taj
   minarets). Does the model fold the two roof tiers into a coherent crown and keep the wings engaged, or
   detach a tier / float a wing? Plus the P14 double-edge: 008 had **no 2nd pass** — this run adds one, so
   the round-0→render A/B shows whether the revision helps or hurts *on this reference*.

## The pipeline (`benchmarks/temple-facade/run.mjs`, approach `vRefRevise-designdoc`)

Three live `claude -p` calls (spec §4), each via `src/sdk-binding.mjs`. The `vRefRevise-designdoc` handler
is at L881:
1. **Stage 1 — reference-grounded design doc** (`composeReferenceDesignDocPrompt`, L369;
   `requestTextWithImage` w/ ref). Carries P12 inline (reference = craft, not color).
2. **Stage 2 — high-res build** (`composeHighResBuildPrompt`, L263; build prompt at L910). Deep relief +
   full-width crown; caps width ~56 / height ~48 / depth ~24. Renders `round-0.png` (pre-revision, L918).
3. **Stage 3 — reference-compared 2nd pass** (`composeRefRevisionPrompt`, L408; revise prompt at L920).
   Carries the principles under test: the **P12 color-hold**, the **P13 one-plane block**, and the
   **detail / NO LARGE FLAT FIELDS** clause (L429). Produces final `artifact.json` → `render.png`.

`main()` (L1085): `--ref` selects the reference; note **`DEFAULT_REF` is already `sys_mausoleum.JPG`**
(L27), so the ticket's explicit `--ref` is belt-and-suspenders, not a change. `nextSeq()` (L1037) =
`max(parseInt(dirname[:3])) + 1`; runs 001–021 present → **next id = 022-vRefRevise-designdoc**. `main`
auto-judges **`render.png`** only (median-of-3, L1114), writes `summary.json`, regenerates the README
gallery. **`round-0.png` is NOT auto-judged** — that needs the helper (below), required by AC #1 / P14.

## The judge (`judge.mjs` → `baml-judge.mts`, rubric `v2-categorical-baml`)

`judgeRender({ imagePath, brief, samples = 3 })` shells to the BAML categorical judge, returns a
**median-of-3** per-dimension verdict: `proportion / color / detail / fidelity / overall`, each in
`{weak, competent, strong, exceptional}`, plus `perSample` + `notes`. **Frozen** for this ticket. The
`exceptional` tier was recently sharpened (commit 0fd091d); **weak/competent/strong boundaries unchanged**,
so the new categorical scores stay comparable to runs 010–021 (but NOT to run 008's v1 numbers).

## Round-0 judging helper (already exists, reusable)

`docs/active/work/T-006-01/judge-round0.mjs` (copied into T-007-01/T-008-01/T-011-01): scores any PNG via
the same `judgeRender` seam, median-of-3, against `TEMPLE_FACADE_TASK.goal`. CLI: `node …/judge-round0.mjs
<path.png>`. Copy it into this ticket's work dir to A/B `round-0.png` vs `render.png` (P14). Same relative-
import depth (`../../../../benchmarks/temple-facade/…`) — no path edit.

## The journal / attempt-log (the substantive deliverable)

`docs/knowledge/design-learnings.md` — "**Attempt log (newest last)**". The log currently ends at the
**run 020** (Sainte-Chapelle / T-008-01) entry — note run **021 (Arc / T-011-01) has no journal entry and
its run dir is incomplete** (only `round-0.png`; no render/summary), so T-011-01 did not finish despite its
`done` frontmatter. That is upstream state, not this ticket's scope; this ticket appends the **022 /
mausoleum** entry. Lisa auto-injects this file, so entries feed forward. AC #2/#3 require a dated entry:
per-dimension A/B scores, an explicit **008-vs-now comparison**, P12/P13 held/failed notes, any diff
recorded, `npm test` green.

## Champion-config state (the inherited baseline)

- The working tree is **clean vs HEAD** on `run.mjs` at session start (`git diff --stat HEAD` empty) — same
  as T-008-01/T-011-01. So **no revert is needed**: HEAD already *is* the champion.
- HEAD's committed champion = the **015 "NO LARGE FLAT FIELDS" menu** detail bullet (L429); the P12
  color-hold and P13 one-plane blocks are the committed champion text.
- The two upstream detail experiments (S-006 panel grammar, S-010 texture grain) **did not promote**; HEAD
  reflects that. The detail dimension is read here with the P15 noise caveat, not as a tuned lever.

## Reference baseline for the comparison

| run | ref | rubric | proportion | color | detail | fidelity | overall |
|-----|-----|--------|-----------|-------|--------|----------|---------|
| **008** | **Mausoleum** | **v1 numeric** | **4/5** | **4/5** | **3/5** | **4/5** | **4/5** ("same band as v4"; notes: shallow portico, blank base register) |
| 014 | Taj | v2 cat | competent→strong | strong | competent | strong | **strong (3/3)** |
| 019 | Hōryū-ji | v2 cat | strong→strong | strong | competent | strong | **strong (3/3)** both rounds |
| 020 | Sainte-Chapelle | v2 cat | strong→competent | strong | competent | strong→competent | **strong→competent** (2nd-pass regressed) |

Pattern: across the v2 chain, P12 (color) reached `strong` off every *pale* reference; `detail` stayed
`competent` everywhere (the holdout); the 2nd pass is a coin-flip (held 014/019, regressed 013/017/020).
The mausoleum is the **first non-pale** reference and the **only one with a v1 008 baseline to compare
against** — so it carries both a fresh P12 condition (mild color-agreement) and the chain's only true
cumulative-progress anchor.

## Constraints & assumptions

- **Frozen:** `task.mjs` (brief/seed=11/view), `judge.*` (rubric). Confirmed by AC.
- **Live & metered:** one `vRefRevise` run ≈ 3 model calls, ~10–15 min wall, ~$1.5–2.1 (runs 014–020).
- **`claude -p` knobs:** no `--temperature`; `--effort`/`--system-prompt` available but out of scope.
- **Determinism:** seed fixed (11) but `claude -p` is not deterministic; generation noise is real (esp.
  `detail`). Color is structural/low-variance; a single high-quality render answers P12 reliably.
- **Rubric incommensurability is the key analytical hazard:** 008's v1 numbers and the new v2 categorical
  scores live on different scales; the 008-vs-now comparison must be qualitative + failure-named, never a
  numeric-to-categorical equation.
- **`npm test`** (133 tests, confirmed green at session start) guards only artifact validation; a
  prompt-string edit has no unit test. Tests must stay green if any minimal generalizing edit is made.
