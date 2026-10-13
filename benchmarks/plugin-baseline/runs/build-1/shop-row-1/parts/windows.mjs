// Part "windows and doors" (parts/windows.mjs): the flats' sash windows, two oriel bays with caps, the flats' street door
// with hood and FLATS sign, the stair-bay windows, the rear doors and windows, and the doors off the corridor. Every
// write goes into the air the shell left open (plan.md OPENINGS); the shell's bricks and trim are never touched, so a
// trim lintel or surround the shell already closed is skipped (see plan.md Notes).
import { sashWindow, oriel, streetDoor } from "../vocab.mjs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";

// Pane connections: in a z-wall (front or rear) a pane runs along x, so it joins east and west.
const PANE_EW = { north: "false", east: "true", south: "false", west: "true" };

export function build(g) {
  const isAir = (x, y, z) => /(^|:)(cave_)?air$/.test(g.blockAt(x, y, z)) && !g.protected?.has(`${x},${y},${z}`);
  // Write one cell only if it is air; returns whether it was written.
  const put = (x, y, z, block, state) => { if (!isAir(x, y, z)) return false; g.set(x, y, z, block, state); return true; };
  const each = (x0, x1, y0, y1, fn) => { for (let x = x0; x <= x1; x++) for (let y = y0; y <= y1; y++) fn(x, y); };
  const glassEW = (x0, x1, y0, y1, z) => each(x0, x1, y0, y1, (x, y) => put(x, y, z, "glass_pane", PANE_EW));
  // A single door, two halves; `facing` is the side it faces out of the house.
  const door = (x, y0, z, facing, hinge = "left") => {
    put(x, y0, z, ...B.door("dark_oak", facing, "lower", hinge));
    put(x, y0 + 1, z, ...B.door("dark_oak", facing, "upper", hinge));
  };
  const sill = (x, y, z) => put(x, y, z, ...B.slab("smooth_sandstone", "bottom"));
  // The roof's soffit course runs along z 20 at y 21, so the oriel tops hold its stone (x 6, 8, 10, 14, 16, 18). The oriel
  // helper and the pane re-set write through this view: into air, or over this part's own glass only, never over stone.
  const own = (x, y, z) => isAir(x, y, z) || /glass_pane$/.test(g.blockAt(x, y, z));
  const local = new Proxy(g, {
    get(t, p) {
      if (p === "set") return (x, y, z, b, s, n) => { if (own(x, y, z)) t.set(x, y, z, b, s, n); return local; };
      const v = Reflect.get(t, p);
      return typeof v === "function" ? v.bind(t) : v;
    },
  });

  // ---- flats' street door (x 23..24, y 7..8, z 19) with hood, fanlight and FLATS sign ----
  streetDoor(g, 23, 7, 19, { out: 1, sign: "FLATS" });

  // ---- stair-bay front windows (x 23..24, y 15..17 and 19..21, z 19), sills below at z 20 ----
  glassEW(23, 24, 15, 17, 19);
  glassEW(23, 24, 19, 21, 19);
  for (const y of [14, 18]) for (const x of [23, 24]) sill(x, y, 20);

  // ---- flats' sash windows: 1 wide x 3 tall at x 5, 11, 13, 19; floor 1 at y 15, floor 2 at y 19; z 19 ----
  for (const x of [5, 11, 13, 19]) {
    sashWindow(g, x, 15, 19, { out: 1 });
    sashWindow(g, x, 19, 19, { out: 1 });
  }

  // ---- oriel bays over units 1 and 2: caps, posts, apron and head from the vocab; glass re-set with its connections ----
  for (const [x0, x1] of [[6, 10], [14, 18]]) {
    oriel(local, x0, x1, 19, { facing: "south", y0: 14 });
    // the vocab's oriel glass has no connection states (a thin post); set them here over its own panes
    for (const y0 of [15, 19]) each(x0 + 1, x1 - 1, y0, y0 + 2, (x, y) => local.set(x, y, 20, "glass_pane", PANE_EW));
  }

  // ---- rear (north, z 2): keeper doors at x 7 and 15, stair-bay rear door at x 23 (y 7..8) ----
  for (const x of [7, 15]) door(x, 6, 2, "north", "left");   // keeper doors: feet at y 6, the aisle floor
  door(23, 7, 2, "north", "left");

  // ---- rear windows: 1 wide x 2 tall at y 15..16 and y 20..21 (no sills: plan gives the rear none) ----
  for (const x of [6, 10, 14, 18]) for (const y0 of [15, 20]) glassEW(x, x, y0, y0 + 1, 2);
  // stair-bay rear windows 2 x 2
  for (const y0 of [15, 20]) glassEW(23, 24, y0, y0 + 1, 2);

  // ---- doors off the corridor: stair hall (x 21, z 3) and flats (x 8 and 16, z 5) at y 14..15 and 19..20 ----
  for (const y0 of [14, 19]) {
    door(21, y0, 3, "east", "left");
    for (const x of [8, 16]) door(x, y0, 5, "south", "left");
  }
}
