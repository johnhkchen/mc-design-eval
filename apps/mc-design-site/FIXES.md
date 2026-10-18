# The fix system

Find what's wrong with catalog buildings, fix buildings with the same kind of issue together, and keep score of
which fixes work.

1. **Detect** — `node scripts/check.mjs` runs every catalog building through the toolkit's deterministic checks
   (fit, room walk, light, the street-to-door way in) and syncs the results to the site's issues. An issue the check
   stops finding becomes *fixed*; a waived one stays waived. People report what the checks can't see on `/issues`.
2. **Schedule** — on `/issues`, select the buildings in a group (one kind of issue) and schedule a fix, with an
   optional note on how to fix it. Needs the admin token (set on the board page) until Discord sign-in.
3. **Fix** — `node scripts/fixer.mjs` (on this machine: model calls stay local) takes the oldest queued job, sends
   each kit run one revision naming every listed building's issues, cuts the revised modules as candidates (colour
   variants re-skinned from their fixed base), checks them before and after, renders them and posts the result.
   `--model lean` for a Haiku revision, `--loop` to keep polling, `--dry` to test the pipeline without a model call.
4. **Review** — on `/issues`, accept or reject each job's candidates. `node scripts/fixer.mjs --apply` puts accepted
   candidates into the catalog, rebuilds it and re-checks.

The "What the fixes have done" table on `/issues` counts, per kind: jobs, buildings tried, buildings cleared, accepted
jobs and cost.

Cloud: the same API runs in the Worker over D1 (`migrations/0002_fixes.sql`); point the scripts at it with
`--to https://mc-design.b28.dev` and `MCD_ADMIN_TOKEN` in the environment (never committed). Candidate files go to
R2 under `fixes/<job>/`.
