// Fenestration and front (part 5): glazing for every OPENINGS row, doors and hoods, the portico, the stoops, area and
// stoop railings, the second-floor window boxes and the lanterns by the front doors. Coordinates are plan.md's; C is
// mirrored from A about x=15 (C x = 30 - A x), written out so each opening reads in the plan's own numbers.
import {
  windowDress, doorFit, doorHood, portico, stoop, areaRailing, windowBox,
  CUT_SANDSTONE, SMOOTH_QUARTZ, WARPED_DOOR, DARK_OAK_DOOR, CRIMSON_DOOR, GLASS_PANE, POLISHED_BLACKSTONE_WALL,
} from "../vocab.mjs";

const SKIPPED = [];
const note = (what, res) => { if (res && res.skipped && res.skipped.length) SKIPPED.push([what, res.skipped.length]); };

// A pane run in a wall plane: `conn` gives the connection states (a front or back row connects east-west, a side wall
// north-south, as the wall runs).
function pane(g, x, y, z, conn) {
  g.set(x, y, z, GLASS_PANE, { north: conn.north, south: conn.south, east: conn.east, west: conn.west });
}

// Connections for a pane in the front or back plane (the wall runs along x).
const ROW = { north: "false", south: "false", east: "true", west: "true" };
// Connections for a pane in a side plane (the wall runs along z).
const SIDE = { north: "true", south: "true", east: "false", west: "false" };

// A window with no sill (the window box is its sill): panes only. The head is the shell's brick course at y1+1 (the
// shell is locked, so no lintel is written over it here).
function windowNoSill(g, x, y0, y1, z, w) {
  for (let y = y0; y <= y1; y++) for (let i = 0; i < w; i++) pane(g, x + i, y, z, ROW);
}

// The canted bay's glazing: the front row z=10 (x8..9) and the cants at z=11 (x7 and x10), y3..5 and y8..10.
// Each pane connects to the glass beside it in the same run; the cant cells at z=10 stay air.
function bayGlass(g, x0) {
  const cells = [];
  for (const [y0, y1] of [[3, 5], [8, 10]]) {
    for (let y = y0; y <= y1; y++) {
      cells.push([x0 + 1, y, 10], [x0 + 2, y, 10], [x0, y, 11], [x0 + 3, y, 11]);
    }
  }
  const has = new Set(cells.map(([x, y, z]) => `${x},${y},${z}`));
  for (const [x, y, z] of cells) {
    const at = (dx, dz) => has.has(`${x + dx},${y},${z + dz}`) ? "true" : "false";
    pane(g, x, y, z, { north: at(0, -1), south: at(0, 1), east: at(1, 0), west: at(-1, 0) });
  }
}

export function build(g) {
  const mx = (x) => 30 - x;

  // ---- A (west, x3..11) and C (east, mirror): front windows on z=12 ----
  for (const house of ["A", "C"]) {
    const m = house === "A" ? (x) => x : mx;
    // Bay glazing (panes only: the body and deck are the shell's and the roof's).
    bayGlass(g, house === "A" ? 7 : 20);

    // First-floor window over the door, y8..10.
    note(`${house} first-floor window`, windowDress(g, m(5), 8, 10, 12, 1, CUT_SANDSTONE));
    // Second floor: a single window over the door (its sill is the window box, so no sill slab) and a 2-wide window.
    windowNoSill(g, m(5), 13, 15, 12, 1);
    note(`${house} second-floor window`, windowDress(g, house === "A" ? 8 : 21, 13, 15, 12, 2, CUT_SANDSTONE));
    // Second-floor window box on the sill cell under the single window.
    windowBox(g, m(5), 12, 11);
  }

  // ---- B (centre, stucco, x11..19) front windows ----
  note("B ground windows", windowDress(g, 13, 3, 5, 12, 1, SMOOTH_QUARTZ));
  note("B ground windows", windowDress(g, 17, 3, 5, 12, 1, SMOOTH_QUARTZ));
  note("B first-floor windows", windowDress(g, 13, 8, 10, 12, 1, SMOOTH_QUARTZ));
  note("B first-floor windows", windowDress(g, 17, 8, 10, 12, 1, SMOOTH_QUARTZ));
  for (const x of [13, 15, 17]) {
    note("B second-floor windows", windowDress(g, x, 13, 15, 12, 1, SMOOTH_QUARTZ));
    note("B third-floor windows", windowDress(g, x, 18, 20, 12, 1, SMOOTH_QUARTZ));
  }

  // ---- Doors: A warped, B dark oak (with its French door), C crimson; all facing out (north) ----
  doorFit(g, 5, 12, WARPED_DOOR, "north");
  doorFit(g, 15, 12, DARK_OAK_DOOR, "north");
  doorFit(g, 15, 12, DARK_OAK_DOOR, "north", { y: 8 });
  doorFit(g, 25, 12, CRIMSON_DOOR, "north");

  // ---- Door hoods over A and C ----
  doorHood(g, 4, 11);
  doorHood(g, 24, 11);
  // Lanterns hang under each hood's slab, in the middle of the hood.
  g.set(5, 5, 11, "lantern", { hanging: "true" });
  g.set(25, 5, 11, "lantern", { hanging: "true" });

  // ---- Portico and B's stoop inside it; lanterns hang under the portico entablature either side of the door ----
  portico(g, 13, 9);
  stoop(g, 14, 9, 1, "south", { width: 3 });
  g.set(14, 6, 11, "lantern", { hanging: "true" });
  g.set(16, 6, 11, "lantern", { hanging: "true" });

  // ---- A and C stoops with their railings on the outer side ----
  stoop(g, 4, 9, 1, "south", { width: 3 });
  stoop(g, 24, 9, 1, "south", { width: 3 });
  for (const x of [3, 27]) {
    g.set(x, 2, 9, POLISHED_BLACKSTONE_WALL, { up: "true" });
    g.set(x, 3, 10, POLISHED_BLACKSTONE_WALL, { up: "true" });
    g.set(x, 3, 11, POLISHED_BLACKSTONE_WALL, { up: "true" });
  }

  // ---- Area railings along the front garden ----
  areaRailing(g, 7, 10, 1, 9);
  areaRailing(g, 20, 23, 1, 9);
  areaRailing(g, 12, 12, 1, 9);
  areaRailing(g, 18, 18, 1, 9);

  // ---- Side windows: A's west (x=3) and C's east (x=27) at z=15 and z=21, y3..5, 8..10, 13..15 ----
  for (const x of [3, 27]) {
    for (const z of [15, 21]) {
      for (const [y0, y1] of [[3, 5], [8, 10], [13, 15]]) {
        for (let y = y0; y <= y1; y++) pane(g, x, y, z, SIDE);
      }
    }
  }
  // B's side windows above the mansards, on the party walls x=11 and x=19, y19..20 at z=15 and z=21.
  for (const x of [11, 19]) {
    for (const z of [15, 21]) for (const y of [19, 20]) pane(g, x, y, z, SIDE);
  }

  // ---- Back windows (z=24, the wall runs along x): A, B and C; the back doors are the grounds part's ----
  const back = [
    [8, 9, [3, 5]], [5, 5, [8, 10]], [8, 9, [8, 10]], [5, 5, [13, 15]], [8, 9, [13, 15]],
  ];
  for (const [x0, x1, [y0, y1]] of back) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pane(g, x, y, 24, ROW);
  }
  // B's back windows
  for (const [x, ys] of [[13, [3, 5]], [17, [3, 5]], [13, [8, 10]], [15, [8, 10]], [17, [8, 10]],
    [13, [13, 15]], [15, [13, 15]], [17, [13, 15]], [13, [18, 20]], [15, [18, 20]], [17, [18, 20]]]) {
    for (let y = ys[0]; y <= ys[1]; y++) pane(g, x, y, 24, ROW);
  }
  // C's back windows: mirror of A's (x = 30 - x)
  for (const [x0, x1, [y0, y1]] of back) {
    for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++) pane(g, mx(x), y, 24, ROW);
  }

  if (SKIPPED.length) console.warn(`front: skipped cells (taken by earlier parts): ${JSON.stringify(SKIPPED)}`);
}
