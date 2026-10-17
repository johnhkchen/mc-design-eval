# mc-design site

mc-design.b28.dev: the public catalog of approved buildings (thumbnails, then a 3-D view with a schematicannon
print scrubber on each building's page), case studies with a 3-D before/after scrubber, How it works, and the
construction board at /board. Astro pages with Svelte islands (src/components); 3-D views use deepslate, with block
models and textures fetched from misode's mcmeta at view time (src/lib/deepslate.js).

    npm install
    npm run dev        # http://127.0.0.1:5178 (also on the tailnet at :8443)
    npm run deploy     # astro build && wrangler deploy

Catalog entries come from approved kits: `node scripts/catalog.mjs <renders dir>` (renders from `mcd render --tiles`).
Case-study models are in public/models, listed in src/data/projects.js with the offset that aligns each pair.

## Data

Everything lives in `data/board.json`; the browser keeps nothing. The dev server reads and writes it
(`GET /api/board`, `PATCH /api/tasks/<id>` for `status`/`cannon`, `PATCH /api/pool`), and open pages reload whenever the
file changes on disk, so a plan script or Claude editing the file shows up live.

- `towns.<id>`: code, name. `projects.<id>`: code, name, client, town, stage, bbox (world x0 z0 x1 z1), exportCorner.
- `tasks.<id>`: project, stage (capture, plan, earthworks, buildings), seq, kind (`cannon` or `todo`), status
  (queued, loaded, running, done, dropped), and for cannon jobs: file, nbt (repo path), world corner, size, mode,
  work (blocks the cannon changes), materials, deps, cannon.
- `pool`: cannons, secPerBlock, setupMin, feed.

Plans write their jobs here with a script, keeping statuses already on the board: see
`benchmarks/plugin-baseline/runs/build-1/dh-02-swamp/scripts/to-board.mjs`.

## Structure preview (next)

`GET /api/nbt?file=<repo path>` serves a job's `.nbt` (only under `benchmarks/`), ready for an in-browser renderer.

## Cloud (Cloudflare)

Live at https://mc-design.b28.dev (custom domain; workers.dev is off): the Vite build as static assets, `worker/index.js` as the
API (the same contract as the dev server), D1 `dragonholde-board` for board state, R2 `dragonholde-assets` for files
(`<project>/<file>`, served at `/api/assets/<key>`). Viewing is public; changing the board needs the `ADMIN_TOKEN`
secret (stored on the build machine at `~/.config/dragonholde/admin-token`) until Discord login lands.

    npx wrangler d1 migrations apply dragonholde-board --remote   # schema: migrations/
    node scripts/push.mjs                                         # board.json rows → D1 (keeps statuses), .nbt → R2
    npx vite build && npx wrangler deploy

D1 holds the live statuses; `data/board.json` holds what plans write.
