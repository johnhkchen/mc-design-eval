// Westpac, Auckland CBD (way 23919431): a late-20th-century office block, eleven storeys on 4-block storeys, a 44-block
// roof above its lowest ground. Concrete frame with pale precast piers and spandrels, blue-tinted glass, a dark volcanic
// (polished blackstone) plinth, and a shopfront storey at street level. The lidar roof is smoothed to 4-block tiers: the
// wings step down to 8-36 and the tower stands at 40-44, with two setbacks cut into its top two tiers. A structural grid
// of columns every 4 blocks holds each floor plate, so every storey stands on the one below; interiors are air behind the
// glass with a lamp here and there on the floor.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23919431.cells.json", "utf8"));
const X = 60, Y = 56, Z = 46, STOREY = 4, GRID = 4;
const PLINTH = "polished_blackstone", PIER = "smooth_quartz", SPANDREL = "light_gray_concrete", GLASS = "gray_stained_glass_pane";
const ROOF = "gray_concrete", CORNICE = "smooth_quartz", FASCIA = "smooth_quartz", COLUMN = "light_gray_concrete";
const POST = "polished_blackstone", CANOPY = "smooth_quartz", PLANT = "light_gray_concrete", DOOR = "iron_door";
const LAMPS = ["glowstone", "glowstone", "shroomlight"];
// [side, dx, dz, run]: the outward step of a side, and the axis the wall runs along on it
const DIRS = [["north", 0, -1, "x"], ["south", 0, 1, "x"], ["east", 1, 0, "z"], ["west", -1, 0, "z"]];
const FACING = { north: "south", south: "north", east: "west", west: "east" };   // a door faces back into the building
const K = (x, z) => `${x},${z}`;
const hash = (x, y, z) => ((x * 73856093) ^ (y * 19349663) ^ (z * 83492791)) >>> 0;

const fp = new Map();
for (const [x, z, , R] of cells) fp.set(K(x, z), { x, z, R, depth: 0, T: 0 });
const at = (x, z) => fp.get(K(x, z));

// depth: 1 on the outside edge of the footprint, then 2, 3... inwards (breadth-first)
const queue = [];
for (const c of fp.values()) if (DIRS.some(([, dx, dz]) => !at(c.x + dx, c.z + dz))) { c.depth = 1; queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i];
  for (const [, dx, dz] of DIRS) { const o = at(c.x + dx, c.z + dz); if (o && !o.depth) { o.depth = c.depth + 1; queue.push(o); } }
}

// the lidar roof, averaged over a 5 x 5 window of footprint cells, snapped to a 4-block storey line (8 to 44)
for (const c of fp.values()) {
  let s = 0, n = 0;
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) { const o = at(c.x + dx, c.z + dz); if (o) { s += o.R; n++; } }
  c.T = Math.min(44, Math.max(8, STOREY * Math.round(s / n / STOREY)));
}

// setbacks on the tall tiers: the top two storeys step in 2 cells, then 4 (monotone in y, so every column is a solid stack from y 0)
const inset = (c, y) => (c.T >= 40 ? (y >= c.T - 4 ? 4 : y >= c.T - 8 ? 2 : 0) : 0);
const inM = (x, y, z) => { const c = at(x, z); return !!c && y >= 0 && y < c.T && c.depth >= inset(c, y); };
for (const c of fp.values()) { let h = 0; while (inM(c.x, h, c.z)) h++; c.H = h; }
const exposed = (x, y, z) => DIRS.filter(([, dx, dz]) => !inM(x + dx, y, z + dz));

// the entrance: the longest straight run of street-level wall whose outward steps stay inside the grid (three cells for the door bay)
let entrance = null;
for (const [name, dx, dz, run] of DIRS) {
  const a = run === "x" ? [1, 0] : [0, 1];
  const ok = (x, z) => inM(x, 0, z) && !inM(x + dx, 0, z + dz) && x + dx >= 0 && x + dx < X && z + dz >= 0 && z + dz < Z;
  for (const c of fp.values()) {
    if (!ok(c.x, c.z) || !ok(c.x + a[0], c.z + a[1]) || !ok(c.x - a[0], c.z - a[1])) continue;
    const score = [...fp.values()].filter((o) => ok(o.x, o.z) && (run === "x" ? o.z === c.z : o.x === c.x)).length;
    if (!entrance || score > entrance.score) entrance = { name, dx, dz, a, x: c.x, z: c.z, score };
  }
}
// the door sits in the middle of a three-cell bay: its posts and canopy stand one step out, in front of the wall
const bayCentre = { x: entrance.x, z: entrance.z };

const g = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => g.set(x, y, z, block, state);

// a pane joins its neighbours along the wall (glass, piers and spandrels are all solid there)
const paneState = (x, y, z, run) => {
  const a = run === "x" ? [1, 0] : [0, 1];
  const e = inM(x + a[0], y, z + a[1]) ? "true" : "false", w = inM(x - a[0], y, z - a[1]) ? "true" : "false";
  return run === "x" ? { north: "false", south: "false", east: e, west: w } : { north: w, south: e, east: "false", west: "false" };
};

let lamps = 0, glass = 0;
const heightOf = (x, z) => at(x, z)?.H ?? 0;
for (const c of fp.values()) {
  const { x, z } = c;
  for (let y = 0; y < c.H; y++) {
    const sides = exposed(x, y, z);
    const cap = y === c.H - 1;
    if (sides.length && cap) {                                  // the top of a wall: a cornice with a parapet above
      put(x, y, z, CORNICE); put(x, y + 1, z, CORNICE);
    } else if (sides.length) {
      const [, dx, dz, run] = sides[0];
      const u = run === "x" ? x : z;
      const k = Math.floor(y / STOREY), yr = y % STOREY;
      const pier = sides.length > 1 || u % 3 === 0;             // corners and every third cell are piers
      if (y === 0) put(x, y, z, PLINTH);
      else if (k === 0 && yr === 3) put(x, y, z, FASCIA);
      else if (yr === 0) put(x, y, z, SPANDREL);
      else if (pier) put(x, y, z, PIER);
      else {
        put(x, y, z, GLASS, paneState(x, y, z, run)); glass++;
        // a warm light on the floor just inside some upper windows: the air gap is behind the glass
        const ix = x - dx, iz = z - dz;
        const iy = y, inward = inM(ix, iy, iz) && iy < heightOf(ix, iz) - 1 && !(ix % GRID === 2 && iz % GRID === 2);
        if (k > 0 && yr === 1 && inward && hash(x, y, z) % 9 === 0) {
          put(ix, iy, iz, LAMPS[hash(z, y, x) % LAMPS.length]); lamps++;
        }
      }
    } else if (cap) {
      put(x, y, z, ROOF);
    } else if (y % STOREY === 0) {
      put(x, y, z, SPANDREL);                                  // a floor plate per storey, on the column grid
    } else if (x % GRID === 2 && z % GRID === 2) {
      put(x, y, z, COLUMN);
    }                                                          // otherwise air behind the glass
  }
}

// the entrance: a three-cell door bay with a canopy on two posts, one step out from the wall
{
  const { a, dx: ox, dz: oz, x: bx, z: bz } = entrance;
  const door = (y, half) => put(bx, y, bz, DOOR, { facing: FACING[entrance.name], half, hinge: "left", open: "false", powered: "false" });
  door(0, "lower"); door(1, "upper");
  for (const s of [-1, 1]) for (let y = 0; y < 4; y++) put(bx + s * a[0] + ox, y, bz + s * a[1] + oz, POST);
  for (const s of [-1, 0, 1]) put(bx + s * a[0] + ox, 4, bz + s * a[1] + oz, CANOPY);
}

// the roof plant: a solid box on the tower's top tier, sitting only where the tier is full height
{
  const tower = [...fp.values()].filter((c) => c.H === 44 && c.depth >= 6);
  const cx = Math.round(tower.reduce((s, c) => s + c.x, 0) / tower.length);
  const cz = Math.round(tower.reduce((s, c) => s + c.z, 0) / tower.length);
  for (let z = cz - 4; z <= cz + 4; z++) for (let x = cx - 6; x <= cx + 6; x++) {
    const c = at(x, z);
    if (!c || c.H !== 44 || c.depth < 6) continue;
    for (let y = 44; y < 48; y++) put(x, y, z, PLANT);
    put(x, 48, z, CORNICE);
  }
}

const out = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23919431.nbt";
const info = g.save(out);
console.log(JSON.stringify({ footprint: fp.size, tiers: [...new Set([...fp.values()].map((c) => c.T))].sort((a, b) => a - b), glass, lamps, entrance: { side: entrance.name, x: bayCentre.x, z: bayCentre.z }, ...info }));
