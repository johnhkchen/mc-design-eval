// DC86683: an early-20th-century Beaux-Arts office block on the Mall's edge. Granite plinth, pale limestone
// (calcite) walls, quartz string courses and cornice, a grey roof deck. Three storeys of 4 blocks on a 13-block
// shoulder, a 15-block setback ring and a 17-block tower core where the lidar roof rises. Hollow shell: exterior
// faces are wall, window panes sit in the wall with an air gap behind, floor plates at storey lines.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86683.cells.json`, "utf8"));

const W = 27, H = 29, D = 27;
const g = new Voxels([W, H, D]);

const PAL = {
  foundation: "stone_bricks",
  plinth: "polished_granite",
  wall: "calcite",
  stone: "smooth_quartz",     // string courses, cornice, parapet, lintels
  pier: "quartz_pillar",
  roof: "stone",
  floor: "smooth_stone",
  glass: "light_blue_stained_glass_pane",
  equip: "light_gray_concrete",
};
const FLOOR_LINES = [4, 8, 12];
const DIRS = [["north", 0, -1], ["south", 0, 1], ["west", -1, 0], ["east", 1, 0]];

// ---- per-cell ground and a smoothed roof tier (3x3 mean, then three flat tiers + a low wing) ----
const raw = new Map(cells.map(([x, z, gr, r]) => [`${x},${z}`, { gr: Math.max(0, Math.round(gr)), roof: r }]));
const info = new Map();
for (const [k, c] of raw) {
  const [x, z] = k.split(",").map(Number);
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    const o = raw.get(`${x + dx},${z + dz}`); if (o) { s += o.roof; n++; }
  }
  const m = s / n;
  const T = m < 6 ? 5 : m < 14.5 ? 13 : m < 16 ? 15 : 17;
  info.set(k, { x, z, g: c.gr, T });
}
const I = (x, z) => info.get(`${x},${z}`);

// a face of cell c at height y is exposed when the cell beside it is off the footprint or rises less high than y
// (a setback); a face covered by a neighbour's foundation is not exposed
function exposed(c, y) {
  return DIRS.filter(([, dx, dz]) => {
    const n = I(c.x + dx, c.z + dz);
    if (!n) return true;
    if (y < n.g) return false;
    return y >= n.T;
  });
}

// ---- door: the widest run of ground-band faces with the door on a non-pier bay, on the face with the most ----
const doorCands = new Map();
for (const c of info.values()) {
  if (c.g > 1) continue;
  const ex = exposed(c, c.g + 1);
  if (ex.length !== 1) continue;
  const [d, dx, dz] = ex[0];
  const i = dx ? c.z : c.x;
  if (i % 3 !== 1) continue;
  if (!doorCands.has(d)) doorCands.set(d, []);
  doorCands.get(d).push({ x: c.x, z: c.z, dir: d, i, dx, dz, g: c.g });
}
let door = null;
{
  let best = [];
  for (const list of doorCands.values()) if (list.length > best.length) best = list;
  if (best.length) {
    best.sort((a, b) => a.i - b.i);
    door = best[Math.floor(best.length / 2)];
  }
}

// ---- the building ----
const stats = { cells: 0, glass: 0, lights: 0, equip: 0 };
const tiers = {};
for (const c of info.values()) {
  stats.cells++;
  tiers[c.T] = (tiers[c.T] || 0) + 1;
  for (let y = 0; y < c.g; y++) g.set(c.x, y, c.z, PAL.foundation);

  for (let y = c.g; y < c.T; y++) {
    const ex = exposed(c, y);
    const top = y === c.T - 1;
    const cornice = y === c.T - 2;

    if (ex.length === 0) {                       // interior: roof deck, floor plates, air otherwise
      if (top) g.set(c.x, y, c.z, PAL.roof);
      else if (y === c.g || FLOOR_LINES.includes(y)) g.set(c.x, y, c.z, PAL.floor);
      continue;
    }

    if (top || cornice) { g.set(c.x, y, c.z, PAL.stone); continue; }   // parapet and cornice
    if (y === c.g) { g.set(c.x, y, c.z, PAL.plinth); continue; }        // base course
    if (FLOOR_LINES.includes(y)) { g.set(c.x, y, c.z, PAL.stone); continue; }  // string courses
    if (ex.length >= 2) { g.set(c.x, y, c.z, PAL.pier, { axis: "y" }); continue; }  // corner column

    const [d, dx, dz] = ex[0];
    const i = dx ? c.z : c.x;                     // position along the face
    const pier = i % 3 === 0;
    const isDoorCell = door && door.x === c.x && door.z === c.z && door.dir === d;

    if (isDoorCell && (y === c.g + 1 || y === c.g + 2)) {
      g.set(c.x, y, c.z, "dark_oak_door", {
        facing: d, half: y === c.g + 1 ? "lower" : "upper", hinge: "left", open: "false", powered: "false",
      });
      continue;
    }

    const ground = y < 4;
    const glassRow = ground ? y > c.g : (y % 4 === 1 || y % 4 === 2);
    const headRow = !ground && y % 4 === 3;

    if (pier) { g.set(c.x, y, c.z, PAL.pier, { axis: "y" }); continue; }
    if (glassRow) {
      // panes run along the wall: arms east-west on a north/south face, north-south on an east/west face
      const along = dz !== 0;
      g.set(c.x, y, c.z, PAL.glass, {
        north: String(!along), south: String(!along), east: String(along), west: String(along), waterlogged: "false",
      });
      stats.glass++;
      // warm light in the room behind some panes: an interior, non-shell cell straight in from the glass
      const ix = c.x - dx, iz = c.z - dz;
      const n = I(ix, iz);
      if (n && y >= n.g && y < n.T && exposed({ x: ix, z: iz, g: n.g, T: n.T }, y).length === 0 &&
          !FLOOR_LINES.includes(y) && (c.x * 7 + c.z * 3 + y) % 5 === 0) {
        g.set(ix, y, iz, ground ? "glowstone" : "shroomlight");
        stats.lights++;
      }
      continue;
    }
    if (headRow) { g.set(c.x, y, c.z, PAL.stone); continue; }   // window head / lintel
    g.set(c.x, y, c.z, PAL.wall);
  }

  // roof equipment on a sparse grid of interior roof cells: two-high plant boxes
  const topY = c.T - 1;
  if (c.x % 6 === 3 && c.z % 6 === 3 && exposed(c, topY).length === 0 && c.T >= 13) {
    g.set(c.x, c.T, c.z, PAL.equip);
    g.set(c.x, c.T + 1, c.z, PAL.equip);
    stats.equip++;
  }
}

const out = g.save(`${DIR}/DC86683.nbt`);
console.log("door:", door ? { x: door.x, z: door.z, dir: door.dir, g: door.g } : "none");
console.log("tiers:", tiers, "stats:", stats, "save:", out);
