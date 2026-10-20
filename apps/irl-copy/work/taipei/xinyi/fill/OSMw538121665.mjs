import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1970s-80s Taipei mixed-use block: two storeys over a shopfront ground floor,
// white tiled-concrete walls, glass shopfront, glazed upper bays, light-grey
// cornice and roof parapet, and a rooftop water tank.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw538121665";
const W = 16, H = 23, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr] of cells) map.set(key(x, z), Math.round(gr));
const has = (x, z) => map.has(key(x, z));

const B = Math.min(...map.values());   // lowest ground under the footprint
const TOP = B + 10;                    // top block; roof surface at B + 11

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward direction of a footprint cell (first missing neighbour), or null.
const DIRS = [
  { dx: 0, dz: -1, facing: "north" },
  { dx: 0, dz: 1, facing: "south" },
  { dx: -1, dz: 0, facing: "west" },
  { dx: 1, dz: 0, facing: "east" },
];
const outward = (x, z) => {
  for (const d of DIRS) if (!has(x + d.dx, z + d.dz)) return d;
  return null;
};
const isFacade = (x, z) => outward(x, z) !== null;

// Door: the south-facing facade cell nearest the mean x.
const meanX = cells.reduce((s, c) => s + c[0], 0) / cells.length;
const meanZ = cells.reduce((s, c) => s + c[1], 0) / cells.length;
let doorCell = null;
for (const [x, z] of cells) {
  const o = outward(x, z);
  if (o && o.facing === "south") {
    if (!doorCell || Math.abs(x - meanX) < Math.abs(doorCell[0] - meanX)) doorCell = [x, z];
  }
}

// 1. Foundation and building shell per footprint cell.
for (const [x0, z0, gr0] of cells) {
  const x = x0, z = z0;
  const gr = Math.min(Math.round(gr0), TOP);

  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const o = outward(x, z);
  const facade = o !== null;
  const c = o ? (o.dz !== 0 ? x : z) : 0;

  for (let y = gr; y <= TOP; y++) {
    const rel = y - B;

    if (y === TOP) { put(x, y, z, "light_gray_concrete"); continue; }
    if (y === gr) { put(x, y, z, facade ? "stone_bricks" : "smooth_stone"); continue; }
    if (y === B + 5) { put(x, y, z, "light_gray_concrete"); continue; }
    if (!facade) continue; // interior air gap

    // Facade wall
    if (rel >= 1 && rel <= 4) {
      if (rel === 4) { put(x, y, z, "light_gray_concrete"); continue; } // lintel band
      if (c % 4 === 0) put(x, y, z, "white_concrete");                  // pier
      else put(x, y, z, "glass");                                         // shopfront glazing
    } else if (rel >= 6 && rel <= 9) {
      if (rel === 9) { put(x, y, z, "light_gray_concrete"); continue; }   // head band
      if (c % 3 === 1) put(x, y, z, "glass_pane");                         // upper window
      else put(x, y, z, "white_concrete");                                 // mullion/pier
    } else {
      put(x, y, z, "white_concrete");
    }
  }
}

// 2. Warm light behind some upper windows (glowstone on the inner cell).
for (const [x, z] of cells) {
  const o = outward(x, z);
  if (!o) continue;
  const c = o.dz !== 0 ? x : z;
  if (c % 6 !== 1) continue;
  const ix = x - o.dx, iz = z - o.dz;
  if (!has(ix, iz) || isFacade(ix, iz)) continue;
  const gr = Math.min(map.get(key(ix, iz)), TOP);
  for (const rel of [7]) {
    const y = B + rel;
    if (y >= gr && y < TOP) put(ix, y, iz, "glowstone");
  }
}

// 3. Entrance on the south face: double-height door, glass transom, hanging lantern.
if (doorCell) {
  const [dx, dz] = doorCell;
  const lower = { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" };
  const upper = { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" };
  put(dx, B + 1, dz, "dark_oak_door", lower);
  put(dx, B + 2, dz, "dark_oak_door", upper);
  put(dx, B + 3, dz, "glass");
  put(dx, B + 4, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// 4. Rooftop water tank: 3x3 ring with a cap, only where the full 3x3 sits on the roof.
const cx = Math.round(meanX), cz = Math.round(meanZ);
let fits = true;
for (let dx = -1; dx <= 1; dx++)
  for (let dz = -1; dz <= 1; dz++) {
    const x = cx + dx, z = cz + dz;
    if (!has(x, z) || isFacade(x, z)) fits = false;
  }
if (fits && TOP + 3 <= H - 1) {
  for (let dx = -1; dx <= 1; dx++)
    for (let dz = -1; dz <= 1; dz++) {
      const x = cx + dx, z = cz + dz;
      const ring = !(dx === 0 && dz === 0);
      for (let y = TOP + 1; y <= TOP + 2; y++) {
        if (ring) put(x, y, z, "white_concrete");
      }
      put(x, TOP + 3, z, "light_gray_concrete");
    }
}

g.save(`${DIR}/${ID}.nbt`);
