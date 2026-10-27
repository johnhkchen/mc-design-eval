---
from: client
at: 2026-10-27T13:47:24.132Z
---
John has split the work: you focus on detail, and I take procedural generation and scale. I'd like the part sets to drive a **wave-function-collapse (WFC) assembler** on our side. You design the parts and the adjacency rules; the solver composes them into buildings of any size, so no two houses on a street match while every one stays on-style and passes the validator. Here's the format I'm proposing for `timber.json` and every set after it. Push back on anything that fights how you build.

## Two layers, solved in order

1. **The plan** (interior, per storey): a 2D grid of rooms on the bay grid. Each storey solves to room tiles: `hall`, `hearth`, `stair`, `landing`, `chamber` (2 beds), `shop`, `work` (the trade's workstation) and `store`.
   - Fixed before solving: the door bay, a stair core stacked through every storey, and the bed count.
   - Rules: every `chamber` and `work` tile touches a `stair`, `landing` or `hall` tile; `stair` tiles stack vertically; one `hearth` per house, with the chimney stacked over it.
   - After solving, I check every route against the validator's walk. A layout that fails is solved again with the next seed.
2. **The shell:** facade bays, corner posts, roof modules, chimneys and dormers on the same grid, chosen to match the plan (a `chamber` behind a bay takes a window bay; the `hearth` bay takes the chimney breast; the door bay is fixed).

## A module

```json
{
  "id": "bay_window_upper",
  "part": "enterprise:lordaeron/part/timber/bay_window_upper",
  "size": [2, 5, 1],
  "layer": "shell",
  "where": {"storey": "upper", "face": ["front", "side"]},
  "sockets": {
    "left": "post", "right": "post",
    "down": "floor_line|jetty", "up": "eave|floor_line"
  },
  "behind": ["chamber", "hall", "landing"],
  "weight": 3,
  "roles": ["frame", "infill", "sill"]
}
```

- **`sockets`:** a face's label. Two faces may meet when their labels match, or when the set's `pairs` list allows them (for example `["jetty", "bracket"]`). `|` means any of.
- **`weight`:** how often the solver picks the module among those allowed. That's how you set a street's rhythm, e.g. plain bays common, oriels rare.
- **`behind`:** which room tiles may sit behind a shell bay. This is how the facade follows the plan.
- **`roles`:** palette roles, so palettes swap without new files.

## A set

```json
{
  "set": "lordaeron/timber",
  "grid": {"post": 1, "bay": 2, "storey": 5, "relief": 1},
  "pairs": [["jetty", "bracket"], ["floor_line", "floor_line"]],
  "limits": [
    {"module": "bay_door", "per": "front", "exactly": 1},
    {"module": "bay_oriel", "per": "house", "at_most": 1}
  ],
  "stacks": [["chimney_breast", "chimney_stack", "chimney_top"]],
  "rooms": {"chamber": {"beds": 2}, "work": {"workstation": "by_trade"}},
  "modules": []
}
```

- **`limits`** cap or fix how many of a module a front or a house may hold.
- **`stacks`** must continue vertically.
- **`rooms`** tell the census what each room holds.

## What you'd deliver

The parts as `.nbt` files, the set file, and **three or four reference houses** that the set must be able to reproduce: our golden tests. I'll write the solver as plain data in, blocks out, deterministic for a seed, with its own tests. It will run headless and turn out a street of 20 houses as a sheet. Each sheet comes back to you as a `results.json` plus renders, so you can tune weights and sockets rather than hand-build variants.

For scale, the solver makes the S2 to S4 question cheap. Once the set exists, a 7 x 7 with 2 storeys and an 11 x 9 with 3 are the same parts with different parameters, and we can put twenty of each on the test street.
