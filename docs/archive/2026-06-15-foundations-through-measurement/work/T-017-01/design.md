# T-017-01 — Design

Goal: every one of the 5 references, generated under the default variant C, must pass **both**
segmentation (cleanly isolable) and **resolution discipline** (no figures / text / filigree). The
round-0 audit found three leaks: arc (figures), mausoleum (nameplate text), chapelle (dark-on-dark
merge + minor gable filigree). Decide how to close them.

## What the round-0 audit tells us

The failures are not random — they are *categories the existing HARD LIMITS already name but word
too weakly to win against the design doc's own language*:

- The doc for an arc-de-triomphe describes statuary in its niches; "NO human figures" loses to a
  positive instruction the model reads as authoritative.
- The doc for a mausoleum describes an inscribed entrance tablet; "NO text" loses the same way.
- The segmentation clause forbids *black* blocks on the outline but says nothing about a *dim
  saturated* tone (chapelle's blue spires) nor about a *tinted* (navy) background.

So the fix is not a new mechanism — it is **sharper, more specific wording in the same clauses**,
plus a positive *replacement* instruction so the model has somewhere to put the suppressed motif.

## Options considered

### Option A — Tighten `FacadeConceptPrompt` wording (chosen)

Strengthen the three weak clauses in place: (1) figural suppression with an explicit
"even if the document mentions statues/figures, replace with a blank or rosette panel" override;
(2) text suppression naming the specific offender (nameplate / signboard / plaque / cartouche /
tablet above the entrance) with the same blank-or-rosette replacement; (3) the segmentation clause
extended to (a) demand a *pure* `#000000` background with no tint/gradient, and (b) forbid not just
black but any *dark or dim* tone on the **outermost** silhouette elements (spires, finials,
pinnacles, roof crest), requiring them in the lightest palette member.

- **Pros:** exactly the lever the ticket prescribes ("tighten `FacadeConceptPrompt` until both hold
  everywhere"). One file, one regen. Keeps C's structural advantages. Addresses every observed leak
  at its root (the prompt), not per-reference. Cheap to re-confirm.
- **Cons:** non-deterministic generation means a tightened prompt still can't *guarantee* a clean
  draw every time; verification is eyeball + occasional redraw. Over-tightening risks bleaching the
  build (e.g. forcing all edges light could flatten palette). Mitigated by scoping the
  light-edge rule to the *outermost* elements only, and by keeping the doc-palette-wins clause.

### Option B — Per-reference doc edits (rejected)

Edit each design-doc.md to delete the niche-statue / inscription language so the model has nothing
to copy.
- **Rejected:** the docs are champion-era inputs shared with the build/judge stages (run dirs feed
  `run.mjs`); editing them changes a fixture for unrelated experiments and is out of this ticket's
  scope. It also doesn't generalize — a 6th reference with statuary would leak again. The prompt is
  the correct single point of control.

### Option C — Post-process the image (crop figures, recolor edges, hard-key the bg) (rejected)

Add an image pass that floods the bg to pure black and masks figures.
- **Rejected:** stage-2 already owns background removal (rembg); duplicating it here is the wrong
  layer. Masking figures programmatically is unreliable and invents a new pipeline stage the ticket
  doesn't ask for. The ticket is explicitly a *prompt-tightening* task.

### Option D — Switch model to Pro for the hard references (rejected)

- **Rejected:** the ticket pins Flash ("Flash, eyeball-only"). Model is held constant; the variable
  is the prompt. Out of scope.

## Decision

**Option A.** Tighten `FacadeConceptPrompt` in three targeted spots, regenerate the BAML client,
regenerate all 5 C concepts, and re-view. This is precisely the ticket's prescribed lever and the
only one that fixes the leaks at their root while preserving C's locked advantages.

## How each leak is closed (mapping fix → failure)

| failure (round-0)              | clause edited                | wording change                                                   |
|--------------------------------|------------------------------|-----------------------------------------------------------------|
| arc — human figures in niches  | HARD LIMIT #1 (figures)      | add "even if the document describes statues/figures/deities/soldiers in niches or panels, render that niche as a BLANK or ROSETTE panel — never a figure" |
| mausoleum — glyph nameplate    | HARD LIMIT #2 (text)         | add "no nameplate, signboard, plaque, cartouche, or inscribed tablet above the entrance; replace any such panel with a blank or bold rosette panel"      |
| chapelle — dark-on-dark merge  | segmentation clause          | (a) "PURE `#000000` black, no navy/blue/grey tint, no gradient, no vignette"; (b) extend no-dark-on-outline to "the OUTERMOST elements — spires, finials, pinnacles, roof crest — must be a LIGHT, high-contrast palette color, never a dark or dim tone (e.g. not dark/medium blue), so they never merge with the black field" |
| chapelle — gable finial filigree | HARD LIMIT #3 (filigree)    | reinforced implicitly by the same clause; if it persists after the figure/text/edge fixes, add "no star-burst or spiked finials finer than a few whole blocks" |

## Verification strategy (decision)

1. Edit prompt → `npm run baml:gen` (refresh `baml_client/`).
2. Regenerate all 5 C concepts via the *defaulted* command (no `--variant`).
3. VIEW all 5. Record per-reference segmentation + resolution pass/fail.
4. Any still-failing reference: if it's a one-off bad draw, redraw that `--ref` once (lottery vs.
   tendency, per the horyuji precedent); if it persists, tighten the wording further and loop from
   step 1. Stop when **no reference fails either property** (allowing for the inherent draw
   variance — a property is "held" if it is clean on a fresh draw and the prompt no longer *invites*
   the leak).
5. `npm test` (must stay green — prompt text is not under test, but regen touches `baml_client/`).
6. Commit the prompt diff + regenerated client + concepts; append the journal entry.

## Risks

- **Over-suppression flattening palette.** Scope the light-edge rule to outermost elements only;
  keep "the document's palette wins." Re-view taj/horyuji (already-passing) to confirm no regression.
- **Residual draw variance.** Accept that "held" means the prompt no longer invites the leak and a
  fresh draw is clean — not a statistical guarantee. Note any reference that needed a redraw.
