// Way 360119694: a 1920s-30s red-brick and cream-plaster commercial block, four storeys on the uphill side and
// two on the downhill side, a timber shopfront at street level, a stepped roof of three tiers, and roof plant.
// Its footprint and heights come from the cells file (lidar ground and roof per cell).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const FILL = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill";
const cells = JSON.parse(readFileSync(`${FILL}/way_360119694.cells.json`, "utf8"));
const W = 27, D = 12, H = 29;

// the lidar roof height snapped to three flat tiers (2, 3 and 4 storeys), so the massing steps in rather than wobbling
const tierOf = (r) => (r <= 10 ? 8 : r <= 13 ? 12 : 16);
const raw = new Map();
for (const [x, z, g, r] of cells) raw.set(`${x},${z}`, { g, T: tierOf(r) });
// then each cell takes the majority tier of itself and its present neighbours (ties keep its own), so the tiers
// are whole blocks of roof and not a stair of single cells
const col = new Map();
for (const [key, { g, T }] of raw) {
  const [x, z] = key.split(",").map(Number), votes = { [T]: 1 };
  for (let dz = -1; dz <= 1; dz++) for (let dx = -1; dx <= 1; dx++) {
    const n = raw.get(`${x + dx},${z + dz}`); if (n && (dx || dz)) votes[n.T] = (votes[n.T] ?? 0) + 1;
  }
  const best = Object.entries(votes).sort((a, b) => b[1] - a[1] || (+a[0] === T ? -1 : +b[0] === T ? 1 : 0))[0];
  col.set(key, { g, T: +best[0] });
}
const at = (x, z) => col.get(`${x},${z}`);
const DIRS = [[0, -1, "north"], [0, 1, "south"], [-1, 0, "west"], [1, 0, "east"]];
const k3 = (x, y, z) => `${x},${y},${z}`;
const cellsOf = () => [...col].map(([k, c]) => [...k.split(",").map(Number), c]);

// the faces of a voxel that look into air: off the footprint, or above the neighbouring cell's top
const exposed = (x, z, y) => DIRS.filter(([dx, dz]) => { const n = at(x + dx, z + dz); return !n || y >= n.T; });
// a solid voxel with no face in the air: a room-side cell that can back an air gap behind the glass
const core = (x, z, y) => { const c = at(x, z); return !!c && y >= c.g && y < c.T && exposed(x, z, y).length === 0; };
const lit = (x, y, z) => (x * 5 + z * 3 + y * 7) % 6 === 0;

// pass 1: the glazing, the air gap behind each pane (glowstone in some), and the entrance
const win = new Map();   // "win" upper glazing, "shop" ground-floor glazing
const slot = new Map();  // the air gap behind a pane: "air" or "glow"
for (const [x, z, { g, T }] of cellsOf()) {
  for (let y = g; y < T; y++) {
    const ex = exposed(x, z, y), o = y % 4;
    if (ex.length !== 1 || (o !== 1 && o !== 2)) continue;   // glass sits in the two middle rows of a storey
    const [dx, dz] = ex[0], s = dz ? x : z, shop = y < 4;
    if (!(shop ? s % 4 !== 0 : [1, 2].includes(s % 4))) continue;   // upper bays 2 wide, shopfront bays 3 wide
    const ix = x - dx, iz = z - dz;
    if (!core(ix, iz, y)) continue;
    win.set(k3(x, y, z), shop ? "shop" : "win");
    slot.set(k3(ix, y, iz), o === 1 && lit(x, y, z) ? "glow" : "air");
  }
}

// the street is the face with the most single-face cells at street level
const count = Object.fromEntries(DIRS.map(([, , n]) => [n, 0]));
for (const [x, z, { g }] of cellsOf()) { const ex = exposed(x, z, g + 1); if (ex.length === 1) count[ex[0][2]]++; }
const street = Object.entries(count).sort((a, b) => b[1] - a[1])[0][0];
// the entrance: on the street face, near the middle, with a core cell behind it for the lobby
let door = null;
for (const [x, z, { g }] of cellsOf()) {
  const ex = exposed(x, z, g);
  if (ex.length !== 1 || ex[0][2] !== street || g > 2) continue;
  const [dx, dz] = ex[0], ix = x - dx, iz = z - dz;
  if (!core(ix, iz, g) || !core(ix, iz, g + 1)) continue;
  if (!door || Math.abs(x - 13) < Math.abs(door.x - 13)) door = { x, z, g, name: street, ix, iz };
}
if (door) { slot.set(k3(door.ix, door.g, door.iz), "air"); slot.set(k3(door.ix, door.g + 1, door.iz), "air"); }
const inDoor = (x, y, z) => door && x === door.x && z === door.z;

// pass 2: the blocks
const v = new Voxels([W, H, D]);
for (const [x, z, { g, T }] of cellsOf()) {
  for (let y = 0; y < T; y++) {
    const kk = k3(x, y, z), ex = exposed(x, z, y), sl = slot.get(kk);
    if (sl) { if (sl === "glow") v.set(x, y, z, "glowstone"); continue; }   // the air gap: glowstone or nothing
    if (inDoor(x, y, z) && y >= door.g && y <= door.g + 1) {
      v.set(x, y, z, "dark_oak_door", { facing: door.name, half: y === door.g ? "lower" : "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (inDoor(x, y, z) && (y === door.g + 2 || y === door.g + 3)) { v.set(x, y, z, "dark_oak_planks"); continue; }   // the timber fascia over the door
    if (y < g) { v.set(x, y, z, ex.length ? "stone_bricks" : "stone"); continue; }   // foundation, plinth on the downhill side
    if (!ex.length) { v.set(x, y, z, y === T - 1 ? "smooth_stone" : "stone"); continue; }   // solid core; flat roof lid on top
    const o = y % 4, shop = y < 4, [dx, dz] = ex[0] ?? [0, 0], s = dz ? x : z;
    let b;
    if (ex.length > 1) b = y === 0 ? "stone_bricks" : "smooth_quartz";   // quoins at the corners
    else if (y === 0) b = "stone_bricks";                                 // base course
    else if (win.has(kk)) b = shop ? "glass" : "glass_pane";             // glazing in its frame
    else if (shop) b = "dark_oak_planks";                                 // shopfront piers and fascia
    else if (o === 0) b = "smooth_quartz";                                // storey string course
    else if (o === 3) b = [1, 2].includes(s % 4) ? "smooth_quartz" : "bricks";   // window head over a bay
    else b = "bricks";
    v.set(x, y, z, b);
  }
  // a cornice on the top edge of each tier, where the tier is open to the air
  if (exposed(x, z, T - 1).length) v.set(x, T, z, "smooth_quartz");
}

// glass panes need their connections set, or they draw as posts: a side connects to any block there
const conn = (x, y, z) => { const b = v.get(x, y, z); return !!b; };
for (const [key, kind] of win) {
  if (kind !== "win") continue;
  const [x, y, z] = key.split(",").map(Number);
  v.set(x, y, z, "glass_pane", { north: String(conn(x, y, z - 1)), south: String(conn(x, y, z + 1)), west: String(conn(x - 1, y, z)), east: String(conn(x + 1, y, z)), waterlogged: "false" });
}

// roof plant on the top tier: a condenser plinth and a stair-core bulkhead, both on the flat roof lid
const top = (x, z) => { const c = at(x, z); return !!c && c.T === 16 && !exposed(x, z, 15).length; };
for (let x = 4; x <= 6; x++) for (let z = 3; z <= 4; z++) if (top(x, z)) { v.set(x, 16, z, "light_gray_concrete"); v.set(x, 17, z, "light_gray_concrete"); }
for (let x = 9; x <= 10; x++) for (let z = 3; z <= 4; z++) if (top(x, z)) { v.set(x, 16, z, "bricks"); v.set(x, 17, z, "bricks"); v.set(x, 18, z, "bricks"); v.set(x, 19, z, "smooth_quartz"); }

const out = `${FILL}/way_360119694.nbt`;
const stats = v.save(out);
console.log(`street ${street}, door ${door ? `${door.x},${door.z}` : "none"}, glazed ${win.size}, air gaps ${slot.size}, ${JSON.stringify(stats)}`);
