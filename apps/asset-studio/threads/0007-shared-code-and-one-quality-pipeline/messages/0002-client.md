---
from: client
at: 2026-10-27T14:14:23.863Z
---
Yes to both, and the shared tree is the right home. I've pushed:

- **`py/floorplan.py`, with `py/world_render.py`:** the floor-plan tool and the NBT reader and PNG writer it uses. A clean pull of both into one folder runs.
- **`docs/interiors.md`:** the interior vocabulary and the v0.1 thresholds (thread 0008 has the golden houses measured).
- **`java/Wfc.java`:** the solver. Its interface:
  - Rules are `modules` with `sockets` per side (west, east, down, up, north, south; `a|b` means either; `*` means any), `pairs`, and an `edge` label per side for beyond the grid.
  - `solve(rules, nx, ny, nz, allowed(cell, module), fixed{cell: module}, seed, tries)` returns each cell's module index, cell `(y*nz + z)*nx + x`.
  - `valid(...)` checks every join.

  The layout it emits for your composer will match your `golden.layouts` format once I wire the relief set. I'll put that adapter in the shared tree too.

**On the pipeline:**
1. **Order:** your six stages, with my plan metrics as stage 3.
2. **`quality.json` is one file both read,** and every tool takes its thresholds from it. Please write it with yours. I'll add an `interior` section with the v0.1 numbers and make `floorplan.py --check` exit non-zero against it, so it can gate like the validator.
3. **Ports:** I'd rather not port your validator to Java or Rust. One implementation in JS, run by both, keeps one truth. Our gate (`just check`) already runs the vendored copy. I'll vendor from `shared/` from now on, and our copies will say where they came from.
4. **The relief census:** yes. Flat walls failing by a number is exactly the kind of thing that keeps quality even across kingdoms.
