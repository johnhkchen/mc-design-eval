# The fix system

Run like a bakery: a cake that comes out wrong in a way code can repair is repaired; one that can't is tagged, and the
tagged ones of a kind are studied together for why the recipe keeps making them. The recipe (the plugin's prompts,
planner, crews and toolkit, or the check itself) is what gets fixed.

1. **Detect** — `node scripts/check.mjs` runs every catalog building through the deterministic checks (fit, room walk,
   light, the street-to-door way in) and syncs the results to the site's issues. An issue the check stops finding
   becomes *fixed*; a waived one (intended, not an error) stays waived. People report what the checks can't see.
2. **Fix by code** — a kind the toolkit can repair (`minecraft-design` `tools/src/autofix.mjs`, also `mcd fix`) gets a
   *Fix N by code* button on `/issues`. No model. A building's fix is kept only if the checks show the issue cleared
   and nothing else got worse; the candidates are rendered, and *Accept into the catalog* puts them in (rebuilds the
   catalog and re-checks). What code couldn't fix is tagged for study.
3. **Study** — every other kind, person reports, and code's failures are *tagged*. A study looks at every build that
   ever came out this way (fixed ones count; waived ones don't):
   - *Gather the evidence* (code, no model): each occurrence with its kit run and plot, the plan's rooms and parts for
     that plot, the run's files, failed code fixes, and the plugin files that made and found it, as `packet.md`.
   - *Ask Haiku why* (cap $0.50) / *Ask Sonnet why* (cap $2): only on a person's click. The model reads the evidence
     with read-only tools via `claude -p --bare` (authenticated only by `ANTHROPIC_API_KEY` from `.env.local`, which is
     git-ignored, so it's billed to the API), with a hard `--max-budget-usd` cap, and answers in a fixed shape: where
     (brief, form, planner, crews, toolkit, inspector, check is wrong, intended), why, evidence, the smallest recipe
     change, whether a code fixer could do it, and whether the check is right.
   - *Accept* makes it a **recipe change to make** in the plugin, listed on `/issues`. Making it is plugin work, done
     on request. A diagnosis that says a code fixer could do it is how a kind moves from step 3 to step 2.
4. **Score** — the *By kind* table: buildings ever, open, fixed by code, tagged, studies, study cost.

Models never edit a building here: fix jobs are code only (the API refuses a fix job at a model tier). A building's
revision by a model is a revision on a person's comment, on the board.

Running jobs: on the dev server a click runs the job (`scripts/fixer.mjs`, one at a time). For the cloud site, run
`node scripts/fixer.mjs --to https://mc-design.b28.dev --loop` on this machine with `MCD_ADMIN_TOKEN` in the
environment (never committed); it runs queued jobs and applies accepted fixes. Candidate files go to R2 under
`fixes/<job>/`. The cloud store is D1 (`migrations/0002_fixes.sql`, not yet applied remotely).
