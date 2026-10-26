// DC56802: New Hampshire Ave NW (Dupont Circle), a 1910s red-brick commercial block: a low wing at the SE, a
// 6-block (3-storey) podium on the W and S, and an 8-block (4-storey) tower on a stone-banded core, stepping in
// with a terrace ring. Solid massing with 1-deep air pockets behind the windows; storeys are 2 blocks (stone band
// on even rows, window row on odd rows); the street (north) face has a shopfront and a door.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56802.cells.json", "utf8"));

// lidar roof height -> storey-aligned tier (2-block storeys): smooths the noise into three clean masses
const tier = (r) => (r <= 3 ? 2 : r <= 6 ? 6 : 8);
const DIRS = { north: [0, -1], south: [0, 1], west: [-1, 0], east: [1, 0] };
const key = (x, y, z) => `${x},${y},${z}`;

const F = new Map();
for (const [x, z, , r] of cells) F.set(`${x},${z}`, { x, z, H: tier(r) });
const at = (x, z) => F.get(`${x},${z}`);
// a face is exposed at row y when it has no neighbour, or the neighbour is lower and the row is above its roof
const exposed = (c, d, y) => { const [dx, dz] = DIRS[d]; const nb = at(c.x + dx, c.z + dz); return !nb || (nb.H < c.H && y >= nb.H); };
const exposures = (c, y) => Object.keys(DIRS).filter((d) => exposed(c, d, y));

// the street front: the north face of the tower, the door at the middle of it
const doorCell = [...F.values()]
  .filter((c) => c.H >= 6 && exposures(c, 0).length === 1 && exposures(c, 0)[0] === "north")
  .sort((a, b) => Math.abs(a.x - 9.5) - Math.abs(b.x - 9.5))[0];

// pass 1: window bays and the air pockets behind them (one block deep, inside the solid massing)
const windows = new Map(), pockets = new Set(), lit = new Set();
for (const c of F.values()) {
  for (let y = 1; y < c.H; y += 2) {
    const ex = exposures(c, y);
    if (ex.length !== 1 || c === doorCell) continue;
    const d = ex[0], [dx, dz] = DIRS[d];
    const bay = d === "north" || d === "south" ? c.x : c.z;
    const ic = at(c.x - dx, c.z - dz);
    if (bay % 3 === 0 || !ic || ic.H <= y) continue;   // pier, or no room behind
    const kind = y === 1 && d === "north" ? "shop" : "pane";
    windows.set(key(c.x, y, c.z), { d, kind });
    const pk = key(ic.x, y, ic.z); pockets.add(pk);
    if ((bay + y) % 4 === 1) lit.add(pk);
  }
}

const g = new Voxels([16, 20, 16]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);
const cnt = { walls: 0, windows: windows.size, lit: lit.size, roof: 0 };

for (const c of F.values()) {
  const H = c.H;
  for (let y = 0; y <= H + 1; y++) {
    const ex = exposures(c, y);
    const k = key(c.x, y, c.z);
    if (y === H + 1) {                                  // coping over the parapet, or HVAC plant on the core roof
      if (ex.length) put(c.x, y, c.z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      else if (H === 8 && (c.x * 3 + c.z * 7) % 9 === 0) { put(c.x, y, c.z, "iron_block"); cnt.roof++; }
      continue;
    }
    if (y === H) {                                      // parapet on the edges, roof deck or terrace inside
      put(c.x, y, c.z, ex.length ? "stone_bricks" : "smooth_stone");
      continue;
    }
    if (pockets.has(k)) { if (lit.has(k)) put(c.x, y, c.z, "glowstone"); continue; }
    if (c === doorCell && y <= 1) {
      put(c.x, y, c.z, "dark_oak_door", { facing: "north", half: y === 0 ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (!ex.length) { put(c.x, y, c.z, "smooth_stone"); continue; }       // solid inside, out of sight
    cnt.walls++;
    if (y === 0) { put(c.x, y, c.z, "stone_bricks"); continue; }    // limestone base course
    if (ex.length >= 2 || y % 2 === 0) { put(c.x, y, c.z, "bricks"); continue; }   // corners and storey lines stay brick
    const w = windows.get(k);                           // odd rows: windows in bays, brick piers between
    if (!w) { put(c.x, y, c.z, "bricks"); continue; }
    if (w.kind === "shop") { put(c.x, y, c.z, "glass"); continue; }
    const along = w.d === "north" || w.d === "south" ? ["east", "west"] : ["north", "south"];
    put(c.x, y, c.z, "glass_pane", {
      north: "false", south: "false", east: "false", west: "false",
      [along[0]]: "true", [along[1]]: "true", waterlogged: "false",
    });
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC56802.nbt";
const saved = g.save(out);
console.log(JSON.stringify({ ...cnt, door: doorCell && [doorCell.x, doorCell.z], saved }));
