// Part 1: masonry shell. Ground surfaces, brick walls, party walls, floors, partitions; every opening is left unbuilt
// (runParts locks air we write), so later parts place their doors, windows, piers and fascia into the gaps.
import { readFileSync } from "node:fs";
import { B } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/build.mjs";
import { rng } from "../vocab.mjs";
import { reservedCells } from "/Volumes/ext1/swe/repos/minecraft-design/tools/src/sockets.mjs";
import { fascia_board } from "../vocab.mjs";

const HOUSES = [
  { a: 1,  s0: 5,  lw: 5,  door: 3,  inner: 4,  well: [2, 3],   piers: [1, 5, 13], end: 1 },
  { a: 13, s0: 13, lw: 21, door: 23, inner: 22, well: [23, 24], piers: [13, 21, 25], end: null },
  { a: 25, s0: 25, lw: 33, door: 35, inner: 34, well: [35, 36], piers: [25, 33, 37], end: 37 },
];
const houseOf = (x) => (x >= 25 ? HOUSES[2] : x >= 13 ? HOUSES[1] : HOUSES[0]);
const WALL_COLS = new Set([1, 13, 25, 37]);

export function build(g) {
  const reserved = reservedCells(JSON.parse(readFileSync("sockets.json", "utf8")));
  const isRes = (x, y, z) => reserved.has(`${x},${y},${z}`) || !/(^|:)(cave_)?air$/.test(g.blockAt(x, y, z) || "air");
  const put = (x, y, z, block, state) => { if (!isRes(x, y, z)) g.set(x, y, z, block, state); };

  // ---- street: road, kerb, sidewalk
  const r = rng(7);
  for (let x = 0; x <= 38; x++) for (let z = 0; z <= 4; z++) g.set(x, 0, z, r() < 0.25 ? "andesite" : "cobblestone");
  for (let x = 0; x <= 38; x++) { g.set(x, 0, 5, "stone_bricks"); g.set(x, 1, 5, "stone_bricks"); }
  const endPier = (x) => x === 1 || x === 37;
  for (let x = 0; x <= 38; x++) for (let z = 6; z <= 7; z++) {
    if (endPier(x)) continue; // the end piers stand full height from y 1
    g.set(x, 1, z, "polished_andesite");
  }

  // ---- openings (cells left unbuilt)
  const isOpen = (h, x, y, z) => {
    const { a, s0, door } = h;
    if (z === 7) {
      if (x >= s0 && x <= s0 + 8 && y >= 2 && y <= 4) return true;            // open shopfront
      if (h.piers.includes(x) && y >= (endPier(x) ? 1 : 5) && y <= 17) return true; // pier columns
      if (x >= s0 + 1 && x <= s0 + 7 && y >= 5 && y <= 7) return true;       // fascia (board helper)
      if (x === door && y >= 2 && y <= 5) return true;                        // lobby door, fanlight, lintel
      const side = (x >= a + 2 && x <= a + 3) || (x >= a + 9 && x <= a + 10);
      const mid = x >= a + 5 && x <= a + 7;
      if ((side || mid) && y === 12) return true;                             // flat 1 lintels
      if ((side && y >= 10 && y <= 11) || (mid && y >= 9 && y <= 11)) return true;
      if ((side || mid) && y >= 15 && y <= 16) return true;
      if ((side || mid) && y === 17) return true;                             // flat 2 lintels
    }
    if (z === 8 && y >= 8) {
      const side = (x >= a + 2 && x <= a + 3) || (x >= a + 9 && x <= a + 10);
      const mid = x >= a + 5 && x <= a + 7;
      if ((side && y >= 10 && y <= 11) || (mid && y >= 9 && y <= 11)) return true; // glass cells
      if ((side || mid) && y >= 15 && y <= 16) return true;
    }
    // inner doors in the lobby partition
    if (x === h.lw && z === 22 && y >= 2 && y <= 3) return true;
    if (x === h.lw && z === 20 && y >= 9 && y <= 10) return true;
    if (x === h.lw && z === 11 && y >= 14 && y <= 15) return true;
    // rear door
    if (z === 24 && x === door && y >= 2 && y <= 3) return true;
    return false;
  };
  const rearWin = (h, x, y) => ((x >= h.a + 2 && x <= h.a + 3) || (x >= h.a + 9 && x <= h.a + 10)) && ((y >= 10 && y <= 11) || (y >= 15 && y <= 16));
  const endWin = (z, y) => z >= 13 && z <= 14 && ((y >= 10 && y <= 11) || (y >= 15 && y <= 16));

  const inWell = (h, x, y, z) =>
    (y === 8 && x >= h.well[0] && x <= h.well[1] && z >= 12 && z <= 17) ||
    (y === 13 && x === h.inner && z >= 16 && z <= 19) ||
    (y === 18 && x === h.inner && z === 10);

  // ---- the shell, cell by cell
  for (let x = 1; x <= 37; x++) for (let y = 1; y <= 18; y++) for (let z = 7; z <= 24; z++) {
    if (isRes(x, y, z)) continue;
    const h = houseOf(x);
    if (isOpen(h, x, y, z)) continue;
    const frontWall = z === 7 || (z === 8 && y >= 8);
    const outer = z === 24 || x === 1 || x === 37;
    const partition = x === h.lw && z >= 8 && z <= 23 && y <= 17;
    const wall = frontWall || z === 24 || WALL_COLS.has(x) || partition;
    if (wall) {
      if (z === 7 && y === 1 && x >= h.s0 && x <= h.s0 + 8) { g.set(x, y, z, "polished_andesite"); continue; }
      if (z === 24) {
        if (rearWin(h, x, y)) { g.set(x, y, z, "glass_pane"); continue; }
        if (x !== h.door && x >= h.a + 2 && (y === 12 || y === 17) && (rearWin(h, x, y - 1) || rearWin(h, x, y - 2))) { g.set(x, y, z, "smooth_sandstone"); continue; }
      }
      if ((x === 1 || x === 37) && z >= 8 && z < 24) {
        if (endWin(z, y)) { g.set(x, y, z, "glass_pane"); continue; }
        if ((y === 12 || y === 17) && z >= 13 && z <= 14) { g.set(x, y, z, "smooth_sandstone"); continue; }
      }
      if ((x === 1 || x === 37) && z === 24 && y >= 2 && y <= 17 && ((y - 2) >> 1) % 2 === 0) { g.set(x, y, z, "smooth_sandstone"); continue; }
      const plinth = y <= 2 && (outer || (z === 7 && x > h.s0 + 8 && x >= h.lw + 1 && x <= h.lw + 3) || (z === 7 && h.a === 1 && x <= 4));
      g.set(x, y, z, plinth ? "stone_bricks" : "bricks");
      continue;
    }
    // floors
    const floorY = y === 1 || y === 8 || y === 13 || y === 18;
    if (floorY && x > h.a && x < h.a + 12 && z >= 8 && z <= 23 && !inWell(h, x, y, z)) {
      // the service aisle (z 22..23 behind the socket back walls, with the back store) is sunk one block: its floor is the ground at y 0, so the
      // keeper stands at the sockets' service level (y 1) and steps down through the keeper's door
      const store = z >= 18 && z <= 21 && x >= (h.a === 1 ? 6 : h.a + 1) && x <= (h.a === 1 ? 8 : h.a + 3); // back store behind the shallow socket
      const aisle = store || (z >= 22 && (h.a === 1 ? x > h.lw : x < h.lw));
      if (y === 1) { if (!aisle) g.set(x, y, z, "polished_andesite"); }
      else g.set(x, y, z, "dark_oak_planks");
    }
  }
  // wall cells at x=13/25 are shared: houses' own floors stop at their walls, handled above.

  // the fascia board between the shop piers (dark oak, z 7 y 5..7)
  for (const h of HOUSES) fascia_board(g, h.s0);

  // ---- doors
  for (const h of HOUSES) {
    const towardLobby = h.a === 1 ? "east" : "west";
    const intoFlat = h.a === 1 ? "west" : "east";
    const door = (x, y, z, facing) => {
      g.set(x, y, z, ...B.door("dark_oak", facing, "lower"));
      g.set(x, y + 1, z, ...B.door("dark_oak", facing, "upper"));
    };
    door(h.lw, 2, 22, towardLobby);
    door(h.lw, 9, 20, intoFlat);
    door(h.lw, 14, 11, intoFlat);
    door(h.door, 2, 24, "south");
    g.set(h.door, 4, 24, "bricks");
  }
}
