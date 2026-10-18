# The fix system

Find what's wrong with catalog buildings, fix buildings with the same kind of issue together, and keep score of
which fixes work.

1. **Detect** — `node scripts/check.mjs` runs every catalog building through the toolkit's deterministic checks
   (fit, room walk, light, the street-to-door way in) and syncs the results to the site's issues. An issue the check
   stops finding becomes *fixed*; a waived one stays waived. People report what the checks can't see on `/issues`.
2. **Schedule** — on `/issues`, select the buildings in a group (one kind of issue) and schedule a fix, with an
   optional note on how to fix it. Needs the admin token (set on the board page) until Discord sign-in.
3. **Fix** — `node scripts/fixer.mjs` takes the oldest queued job and runs it at the job's tier (below), checks each
   candidate before and after, renders it and posts the result. `--loop` keeps polling; `--dry` tests the model tiers
   without a model call.
4. **Review** — on `/issues`, accept or reject each job's candidates. `node scripts/fixer.mjs --apply` puts accepted
   candidates into the catalog, rebuilds it and re-checks.

## Escalation protocol

Fixes are code first. A model is used only when a person asks for one, with a cost cap.

| Tier | Who fixes | When | Cost |
|---|---|---|---|
| **auto** (every job starts here) | the toolkit's deterministic fixers (`minecraft-design` `tools/src/autofix.mjs`, also `mcd fix`) | always first | none |
| **haiku** | one lean revision per kit run, on the Anthropic API | a person clicks *Escalate to Haiku* | cap, default $1 |
| **sonnet** | one Sonnet revision per kit run, on the Anthropic API | a person clicks *Escalate to Sonnet* | cap, default $4 |

- **auto** keeps a building's fix only if the checks show the issue cleared and no other kind of issue got worse;
  otherwise the building is listed with the reason ("no deterministic fixer", "the fix didn't clear it", "made X
  worse") and the job goes to *escalate* (or to *review*, with the rest listed, when some buildings were fixed).
- Code fixers today: floating shutter, stairs end short, on a bottom slab, floating decor, dark room. A kind that keeps
  being escalated is the next fixer to write: the study table's "left for escalation" column says which.
- The model tiers need `ANTHROPIC_API_KEY` in `apps/mc-design-site/.env.local` (git-ignored) on the runner's machine;
  the key is passed only to that revision's process. The cap is checked against the run's ledger afterwards and
  flagged on the job when it's exceeded.
- Every fix, code or model, still goes to *review*: checks can't see design (the first code fix of Polarton's
  "floating shutters" flattened eave fascias the check had misread; the check was fixed, but the accept step stays).

The "What the fixes have done" table on `/issues` counts, per kind: jobs, buildings tried, cleared by code, cleared by a
model, left for escalation, accepted jobs and model cost.

Cloud: the same API runs in the Worker over D1 (`migrations/0002_fixes.sql`); point the scripts at it with
`--to https://mc-design.b28.dev` and `MCD_ADMIN_TOKEN` in the environment (never committed). Candidate files go to
R2 under `fixes/<job>/`.
