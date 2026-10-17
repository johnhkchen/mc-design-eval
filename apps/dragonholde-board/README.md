# Dragonholde board

Construction board for the owner's server: towns, projects (with their client), every cannon job and todo with a
status you tick off, a cannon yard and an estimated schedule with the critical path.

    npm install
    npm run dev        # http://localhost:5178, and on your LAN (phone) via the Network address Vite prints

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
