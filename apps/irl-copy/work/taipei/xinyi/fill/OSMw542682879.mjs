import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542682879";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const key = (x, z) => `${x},${z}`;
const G = new Map(cells.map(([x, z, g]) => [key(x, z), g]));
const has = (x, z) => G.has(key(x, z));

// Exterior faces of each footprint cell (neighbour missing = facade).
function faces(x, z) {
  return {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
}
function info(x, z) {
  const f = faces(x, z);
  const edge = f.n || f.s || f.w || f.e;
  const corner = (f.n || f.s) && (f.w || f.e);
  let dir = null, u = 0, alongX = false;
  if (edge && !corner) {
    if (f.n) { dir = "north"; alongX = true; }
    else if (f.s) { dir = "south"; alongX = true; }
    else if (f.w) { dir = "west"; alongX = false; }
    else if (f.e) { dir = "east"; alongX = false; }
    u = alongX ? x : z;
  }
  return { edge, corner, dir, u, alongX, f };
}
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Door: south-facing single-face cell near the middle, on a cell whose ground leaves 2 storey-1 blocks.
let doorCell = null;
{
  let best = Infinity;
  for (const [x, z, gc] of cells) {
    const i = info(x, z);
    if (!i.edge || i.corner || i.dir !== "south") continue;
    if (gc + 2 > 4) continue;
    const d = Math.abs(x - 8.5);
    if (d < best) { best = d; doorCell = { x, z, gc, dir: "south" }; }
  }
  if (!doorCell) {
    for (const [x, z, gc] of cells) {
      const i = info(x, z);
      if (!i.edge || i.corner || gc + 2 > 4) continue;
      doorCell = { x, z, gc, dir: i.dir };
      break;
    }
  }
}

// Pre-pass: warm lamps behind some lit window bays (only where the cell behind is in the footprint).
const lamps = new Set();
for (const [x, z, gc] of cells) {
  const i = info(x, z);
  if (!i.edge || i.corner || i.dir === null) continue;
  const [dx, dz] = INWARD[i.dir];
  if (!has(x + dx, z + dz)) continue;
  for (let y = 0; y <= 9; y++) {
    if (y <= gc || y === 5 || y === 9 || y === 4 || y === 10) continue;
    const isGlass = y > gc && y < 5 ? y >= gc + 1 && y <= 3 : y >= 6 && y <= 8;
    if (!isGlass) continue;
    if ((i.u + y) % 5 === 0) lamps.add(`${x + dx},${y},${z + dz}`);
  }
}

// Ground-level base floor: 1 block deep foundation down to 0 under each cell.
const g = new Voxels([18, 23, 14]);

const TOP_DECK = 10;   // roof deck / cornice level
const PARAPET = 11;    // top of parapet (roof reads ~11 blocks)

for (const [x, z, gc] of cells) {
  const i = info(x, z);

  // Foundation: solid from 0 up to this cell's ground.
  for (let y = 0; y < gc; y++) g.set(x, y, z, "stone_bricks");

  for (let y = gc; y <= PARAPET; y++) {
    // Floor slabs at each storey line and the first floor.
    if (y === gc) {
      g.set(x, y, z, i.edge ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === 5) {
      g.set(x, y, z, i.edge ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === TOP_DECK) {
      g.set(x, y, z, i.edge ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (y === PARAPET) {
      if (i.edge) {
        if (i.corner) g.set(x, y, z, "stone_bricks");
        else g.set(x, y, z, "white_concrete");
      }
      continue;
    }

    // Storeys between the slab lines.
    const inGround = y > gc && y <= 4;
    const inUpper = y >= 6 && y <= 9;
    if (!inGround && !inUpper) continue;

    if (!i.edge) {
      // Interior: air behind the glass, with warm lamps where marked.
      if (lamps.has(`${x},${y},${z}`)) g.set(x, y, z, "glowstone");
      continue;
    }

    // Door (two blocks tall at the bottom of the ground storey).
    if (doorCell && doorCell.x === x && doorCell.z === z && (y === gc + 1 || y === gc + 2)) {
      g.set(x, y, z, "dark_oak_door", {
        facing: doorCell.dir,
        half: y === gc + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }

    // Lintels and spandrels.
    if (inGround && y === 4) { g.set(x, y, z, "stone_bricks"); continue; }
    if (inUpper && y === 9) { g.set(x, y, z, "white_concrete"); continue; }

    // Piers at corners and every third column; glass bays between.
    const pier = i.corner || i.u % 3 === 0;
    if (pier) {
      g.set(x, y, z, inGround ? "stone_bricks" : "quartz_block");
      continue;
    }
    if (inGround && y === gc + 1 && (i.u % 3 !== 0)) {
      // Shopfront glass bays
    }
    const pane = i.alongX
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    g.set(x, y, z, "light_blue_stained_glass_pane", pane);
  }

  // Shroomlight beacons on the parapet corners.
  if (i.edge && i.corner) g.set(x, PARAPET + 1, z, "shroomlight");
}

// Roof equipment: a central penthouse, and a pair of plant boxes on the roof.
for (const [x, z, gc] of cells) {
  const i = info(x, z);
  if (i.edge) continue;
  if (gc > TOP_DECK) continue;
  if (x >= 6 && x <= 11 && z >= 4 && z <= 9) {
    for (let y = PARAPET; y <= 13; y++) {
      g.set(x, y, z, y === 13 ? "smooth_stone" : "light_gray_concrete");
    }
  } else if (x >= 2 && x <= 3 && z >= 2 && z <= 3) {
    g.set(x, PARAPET, z, "iron_block");
  }
}

// Short mast on the penthouse.
if (has(8, 6) || has(9, 6)) {
  const mx = has(8, 6) ? 8 : 9;
  for (let y = 14; y <= 17; y++) g.set(mx, y, 6, "iron_bars");
}

g.save(`${DIR}/${ID}.nbt`);
