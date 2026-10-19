// 3 East 52nd Street, Midtown Manhattan: a 1920 mixed residential and commercial building, a 4-storey brick block
// with limestone storey courses and quoins, a shopfront on the ground floor of the street front (the high-z side, z 26)
// and the Fifth Avenue side (x 0), and plain punched windows above. The lidar gives a 16-block west spine on the Fifth
// Avenue edge, a 12-block body behind it, a one-block lower deck across the north half, and a notch out of the south-east
// corner (footprint cells x 6, z 22 to 26 are not in the record). Roofs are median-smoothed over 3x3 and snapped to
// clean tiers (1, 12, 16). Every column is solid from y 0 up to its tier, so nothing hangs. Windows are glass panes set
// in the outer wall with an air pocket behind them, a limestone course at each storey line; some pockets hold glowstone
// and the shop windows shroomlight. A small two-cell mechanical house with a smooth-stone cap sits on the body roof.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1035708.cells.json`, "utf8"));   // [x, z, ground, roof]
const W = 7, D = 27, H = 28;

const MAT = {
  base: "polished_andesite", brick: "bricks", trim: "calcite", cornice: "smooth_stone", roof: "stone", core: "stone",
  shopPier: "dark_oak_planks", glass: "glass_pane", lamp: "glowstone", warm: "shroomlight",
};
const DOOR_X = 3;                                    // the entrance sits on the centre bay of the 6-wide street front
const STREET_Z = D - 1;                              // the street is the high-z side (uptown is low z)
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };

// Lidar roof -> clean tier: a 1-block deck, 12 for the body (11 to 14 read as one tier), 16 for the spine.
const snap = (v) => (v <= 1 ? 1 : v < 9 ? Math.round(v / 3) * 3 : v < 14.5 ? 12 : 16);
const median = (a) => { a = [...a].sort((p, q) => p - q); return a[a.length >> 1]; };
const lidar = new Map(cells.map(([x, z, , r]) => [`${x},${z}`, r]));
const TOP = new Map();
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const v = [];
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const r = lidar.get(`${x + dx},${z + dz}`); if (r !== undefined) v.push(r);
  }
  TOP.set(`${x},${z}`, snap(median(v)));
}
// Roof equipment: a two-cell mechanical house on the body roof, one storey, set in from the street.
for (const [x, z] of [[2, 22], [3, 22], [2, 23], [3, 23]]) TOP.set(`${x},${z}`, 15);

const top = (x, z) => TOP.get(`${x},${z}`) ?? 0;     // outside the footprint (the notch) is no building
const solid = (x, y, z) => y >= 0 && y < top(x, z);
const exposed = (x, y, z) => Object.entries(DIRS).filter(([, [dx, dz]]) => !solid(x + dx, y, z + dz)).map(([f]) => f);

const K = (x, y, z) => `${x},${y},${z}`;
const plan = new Map();
const put = (x, y, z, block, state) => plan.set(K(x, y, z), { block, state });
const pockets = [];                                  // [x, y, z, lamp, warm] air behind the glass, carved after the shell

// Shell: every solid cell, facade or core.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  const t = top(x, z);
  for (let y = 0; y < t; y++) {
    const ex = exposed(x, y, z);
    if (!ex.length) { put(x, y, z, y === t - 1 ? MAT.roof : MAT.core); continue; }

    const face = ex.includes("S") ? "S" : ex.includes("W") ? "W" : ex.includes("E") ? "E" : "N";
    const zFace = face === "S" || face === "N";
    const u = zFace ? x : z;                         // position along the face: the bay index
    const along = zFace ? [[1, 0], [-1, 0]] : [[0, 1], [0, -1]];
    const isEnd = along.some(([dx, dz]) => !solid(x + dx, y, z + dz));   // a corner: a limestone quoin
    const shopfront = y <= 2 && (face === "S" || face === "W");

    if (face === "S" && z === STREET_Z && x === DOOR_X && (y === 1 || y === 2)) {
      put(x, y, z, "dark_oak_door", { facing: "south", half: y === 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      put(x, y, z - 1, "air");                       // the vestibule behind the door
      continue;
    }
    let block;
    if (y === 0) block = MAT.base;                   // a polished plinth on the ground
    else if (t >= 4 && y === t - 1) block = MAT.cornice;
    else if (y % 3 === 0) block = MAT.trim;          // limestone storey course (3, 6, 9 ...)
    else if (isEnd) block = MAT.trim;
    else if (shopfront) block = u % 2 === 0 ? MAT.shopPier : MAT.glass;
    else block = u % 2 === 1 ? MAT.glass : MAT.brick;

    if (face === "S" && y === 3 && (x === 2 || x === 3 || x === 4) && z === STREET_Z) {
      put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });   // the entrance canopy band
      continue;
    }
    put(x, y, z, block);

    // A window: air behind the glass, when the inner cell is solid core (a one-cell-thick wall).
    if (block === MAT.glass && y % 3 !== 0) {
      const [dx, dz] = DIRS[face];
      const ix = x - dx, iz = z - dz;
      if (solid(ix, y, iz) && !exposed(ix, y, iz).length) {
        const lamp = y % 3 === 1 && (x * 5 + z * 3 + Math.floor(y / 3)) % 4 === 0;
        pockets.push([ix, y, iz, lamp, shopfront && !lamp && (x + z) % 3 === 0]);
      }
    }
  }
}
// The one-block lower deck gets a low smooth-stone parapet on its open edges, so it reads as a terrace, not a slab.
for (const [x, z] of cells.map(([x, z]) => [x, z])) {
  if (top(x, z) === 1 && exposed(x, 0, z).length) put(x, 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
}
for (const [x, y, z, lamp, warm] of pockets) {
  put(x, y, z, "air");
  if (lamp) put(x, y, z, MAT.lamp);
  else if (warm) put(x, y, z, MAT.warm);
}

// Glass panes connect to any non-air neighbour, so the bands read as continuous glazing rather than posts.
const PANE = (x, y, z) => { const e = plan.get(K(x, y, z)); return !!e && e.block !== "air"; };
for (const [k, e] of plan) {
  if (e.block !== MAT.glass) continue;
  const [x, y, z] = k.split(",").map(Number);
  e.state = { east: String(PANE(x + 1, y, z)), north: String(PANE(x, y, z - 1)), south: String(PANE(x, y, z + 1)), west: String(PANE(x - 1, y, z)), waterlogged: "false" };
}

const g = new Voxels([W, H, D]);
for (const [k, { block, state }] of plan) {
  const [x, y, z] = k.split(",").map(Number);
  g.set(x, y, z, block, state);
}
const out = g.save(`${DIR}/NYC1035708.nbt`);
const maxY = Math.max(...[...plan.keys()].map((k) => Number(k.split(",")[1])));
console.log(JSON.stringify({ blocks: out.blocks, palette: out.palette, maxY }));
