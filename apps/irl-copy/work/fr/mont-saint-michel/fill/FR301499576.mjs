import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/fr/mont-saint-michel/fill";
const W = 16, H = 23, D = 24;

// [x, z, ground, roof] per footprint cell
const raw = JSON.parse(readFileSync(`${DIR}/FR301499576.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Two-storey stone town house, c.1800, Normandy granite with slate roof.
// Storey lines relative to each cell's ground gr:
//   gr      plinth (polished granite)
//   gr+1..3 lower windows, gr+4 string course
//   gr+5    upper floor line, gr+6..8 upper windows
//   gr+9    cornice, wt = wall top (>= gr+9)
// Roof: lidar median sets the height; outer ring steps out with stairs,
// inner plateau is slate at wt+2.

const roofs = raw.map(c => c[3]).sort((a, b) => a - b);
const Rb = Math.round(roofs[Math.floor(roofs.length / 2)]);

function place(x, y, z, id, p) {
  if (y < 0 || y >= H || x < 0 || x >= W || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
}

// Edge distance: 0 on the outer ring
const ringD = (x, z) => Math.min(x, W - 1 - x, z, D - 1 - z);

const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

// Glass pane positions on the facades (door excluded, door surround stone)
function paneAt(x, z) {
  if ((z === 0 || z === D - 1) && x >= 1 && x <= 14) {
    const i = x - 1;
    if (z === 0 && x >= 6 && x <= 8) return false; // entrance bay
    return i % 3 !== 0;
  }
  if ((x === 0 || x === W - 1) && z >= 1 && z <= D - 2) {
    const i = z - 1;
    return i % 3 !== 0;
  }
  return false;
}

// Outer neighbour (facade cell) of a ring-1 cell
function outer(x, z) {
  if (z === 1) return [x, 0];
  if (z === D - 2) return [x, D - 1];
  if (x === 1) return [0, z];
  if (x === W - 2) return [W - 1, z];
  return null;
}

const isWin = (y, gr) => (y >= gr + 1 && y <= gr + 3) || (y >= gr + 6 && y <= gr + 8);

function outwardFacing(x, z) {
  if (z === 1) return "north";
  if (z === D - 2) return "south";
  if (x === 1) return "west";
  return "east";
}

function blockAt(x, y, z, gr, d, wt) {
  // foundation below the cell's ground
  if (y < gr) return ["cobblestone"];

  if (d === 0) {
    // plinth
    if (y === gr) return ["polished_granite"];
    // corner quoins run full height
    if (isCorner(x, z)) return ["stone_bricks"];
    // string course and cornice
    if (y === gr + 4 || y === gr + 9) return ["chiseled_stone_bricks"];

    // entrance: stone surround, door, lintel hood (north face, x=7)
    if (z === 0 && x >= 6 && x <= 8 && y >= gr + 1 && y <= gr + 3) {
      if (y === gr + 3) return ["polished_granite"];
      if (x === 7 && y === gr + 1) return ["oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (x === 7 && y === gr + 2) return ["oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
      return ["stone_bricks"];
    }

    // glazing with framed panes; stone mullions between
    if (isWin(y, gr) && paneAt(x, z)) {
      if (z === 0 || z === D - 1) {
        return ["glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }];
      }
      return ["glass_pane", { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }];
    }
    // mullion pillars (stone bricks) against plain stone walls
    if (isWin(y, gr)) return ["stone_bricks"];
    return ["stone"];
  }

  if (d === 1) {
    if (y === wt + 1) {
      return ["deepslate_tile_stairs", { facing: outwardFacing(x, z), half: "bottom", shape: "straight", waterlogged: "false" }];
    }
    if (isWin(y, gr)) {
      const o = outer(x, z);
      if (o && paneAt(o[0], o[1])) {
        // warm light behind some panes; air gap otherwise
        return (x + z + y) % 7 === 0 ? ["glowstone"] : null;
      }
    }
    // entrance hall stays open behind the door
    if (z === 1 && x >= 6 && x <= 8 && y >= gr + 1 && y <= gr + 2) return null;
    return ["stone"];
  }

  // inner solid core with flat slate top
  if (y === wt + 1 || y === wt + 2) return ["deepslate_tiles"];
  return ["stone"];
}

for (const [x, z, gr] of raw) {
  const d = ringD(x, z);
  const wt = Math.max(gr + 9, Rb - 2);
  const top = d === 0 ? wt : d === 1 ? wt + 1 : wt + 2;
  const chim = d >= 2 && ((x === 5 && z === 8) || (x === 10 && z === 15));
  const maxY = Math.min(chim ? wt + 4 : top, H - 1);

  for (let y = 0; y <= maxY; y++) {
    if (chim && y === wt + 3) { place(x, y, z, "stone_bricks"); continue; }
    if (chim && y === wt + 4) { place(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; }
    const b = blockAt(x, y, z, gr, d, wt);
    if (b) place(x, y, z, b[0], b[1]);
  }
}

g.save(`${DIR}/FR301499576.nbt`);
