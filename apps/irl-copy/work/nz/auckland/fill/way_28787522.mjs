// City Works Depot (Auckland, Mt Eden side): a mid-century civic depot. A four-storey-class office block (lidar roof 10,
// setback plant room to 12) on the north side, and a single-height workshop with roller doors and a roof of sheet metal
// stepping down to 8. Massing is taken from the lidar roof, smoothed into flat tiers; the envelope is a closed 1-block shell
// over a solid foundation and floor slabs, with air inside (no interiors) and glass set in the shell.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const base = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_28787522";
const cells = JSON.parse(readFileSync(`${base}.cells.json`, "utf8"));

const X = 109, Y = 24, Z = 142;
const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, g, r] of cells) map.set(key(x, z), { x, z, g, r });
const at = (x, z) => map.get(key(x, z));
const all = [...map.values()];

// 1. Ground: the lidar DEM smoothed by a 3x3 mean over the footprint, so the floors step gently down the slope.
for (const c of all) {
  let s = 0, n = 0;
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = at(c.x + dx, c.z + dz); if (o) { s += o.g; n++; } }
  c.gs = Math.round(s / n);
}

// 2. Tiers: lidar roof <=9 is the workshop (8), 10 the office, >=11 the plant tier. Labels take the 3x3 majority
//    so the tiers come out flat; the plant room is only the interior of the office (>=2 cells in from the edge).
const lab = (r) => (r >= 11 ? "P" : r === 10 ? "O" : "S");
for (const c of all) c.lab = lab(c.r);
for (const c of all) {
  const count = {};
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) { const o = at(c.x + dx, c.z + dz); if (o) count[o.lab] = (count[o.lab] || 0) + 1; }
  const best = Object.entries(count).sort((a, b) => b[1] - a[1]);
  c.tier = best.length && best[0][1] > (count[c.lab] || 0) ? best[0][0] : c.lab;
}
const dist = new Map();
const queue = [];
for (const c of all) if (DIRS.some(([dx, dz]) => !at(c.x + dx, c.z + dz))) { dist.set(key(c.x, c.z), 1); queue.push(c); }
for (let i = 0; i < queue.length; i++) {
  const c = queue[i], d = dist.get(key(c.x, c.z));
  for (const [dx, dz] of DIRS) { const o = at(c.x + dx, c.z + dz); if (o && !dist.has(key(o.x, o.z))) { dist.set(key(o.x, o.z), d + 1); queue.push(o); } }
}
for (const c of all) {
  c.g = c.gs;
  c.T = c.tier === "S" ? 8 : c.tier === "O" ? 10 : dist.get(key(c.x, c.z)) >= 3 ? 12 : 10;
  c.floors = [c.g];
  if (c.T >= 10) for (let f = c.g + 4; f <= c.T - 2; f += 4) c.floors.push(f);
}

// 3. Walls: a cell is shell if it is on the footprint edge or stands above a lower neighbour. Its exposed face gives the
//    facade (windows and roller doors are set into the shell, with air behind them).
for (const c of all) {
  c.out = []; c.low = [];
  for (const [dx, dz] of DIRS) {
    const o = at(c.x + dx, c.z + dz);
    if (!o) c.out.push([dx, dz]); else if (o.T < c.T) c.low.push([dx, dz]);
  }
  c.wall = c.out.length > 0 || c.low.length > 0;
  c.face = c.out[0] || c.low[0] || null;
}

// The entrance: the office shell cell facing -z (or the nearest exposed office cell) with the smallest z.
const office = all.filter((c) => c.T >= 10 && c.out.length);
const ent = office.filter((c) => c.out.some(([dx, dz]) => dz === -1 && dx === 0)).sort((a, b) => a.z - b.z || a.x - b.x)[0]
  || office.sort((a, b) => a.z - b.z || a.x - b.x)[0];
const entKey = ent ? key(ent.x, ent.z) : null;

const G = new Voxels([X, Y, Z]);
const put = (x, y, z, block, state) => G.set(x, y, z, block, state);
const pane = { waterlogged: "false" };
const faceDir = (c) => c.face;

function facade(c, y, glowOK) {
  const { x, z, g, T, floors, face } = c;
  if (y === g) return put(x, y, z, "stone_bricks");                     // base course on the ground line
  const u = face && face[0] !== 0 ? z : x;                              // bay index along the face
  if (T === 8) {                                                        // workshop: roller doors below, clerestory above
    if (!face) return put(x, y, z, "light_gray_concrete");
    if (y <= 4) return u % 6 === 0 ? put(x, y, z, "light_gray_concrete") : put(x, y, z, "iron_block");
    if (y <= 6) return u % 3 !== 0 ? put(x, y, z, "light_blue_stained_glass_pane", paneState(face)) : put(x, y, z, "light_gray_concrete");
    return undefined;
  }
  const f = floors.filter((v) => v <= y).pop();                         // office: string course, two rows of glass, spandrel
  const rel = y - f;
  if (rel === 0) return put(x, y, z, "smooth_stone");
  if (rel === 1 || rel === 2) {
    if (face && f + 2 <= T - 2 && u % 4 !== 0) {
      put(x, y, z, "light_blue_stained_glass_pane", paneState(face));
      if (glowOK && rel === 1 && (x * 7 + z * 13 + y * 3) % 5 === 0) {  // warm light on the floor just inside the glass
        const inside = at(x - face[0], z - face[1]);
        if (inside && !inside.wall) put(inside.x, y, inside.z, "glowstone");
      }
      return;
    }
    return put(x, y, z, "white_concrete");
  }
  return put(x, y, z, "light_gray_concrete");
}
function paneState(face) {
  const along = face[0] !== 0 ? "north" : "east";
  const s = { north: "false", south: "false", east: "false", west: "false", ...pane };
  s[along] = "true"; s[along === "north" ? "south" : "west"] = "true";
  return s;
}

for (const c of all) {
  const { x, z, g, T, floors } = c;
  for (let y = 0; y < g; y++) put(x, y, z, "stone_bricks");              // solid foundation under the slope
  const top = T - 1;
  for (let y = g; y < top; y++) {
    if (c.wall) facade(c, y, true);
    else if (floors.includes(y)) put(x, y, z, "smooth_stone");          // floor slab per storey, air above
  }
  // roof cover
  const roofBlock = T === 8 ? (x % 2 ? "light_gray_concrete" : "gray_concrete") : T === 10 ? "stone" : "gray_concrete";
  put(x, top, z, roofBlock);
  if (T === 10 && c.out.length) put(x, T, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); // parapet
  if (T === 10 && !c.wall && x % 9 === 4 && z % 9 === 4) put(x, T, z, "iron_block");                   // roof plant
}

// Entrance: a recessed door in the shell, a canopy over it, and a lantern inside.
if (ent) {
  const [dx, dz] = ent.out.find(([a, b]) => b === -1) || ent.out[0];
  const facing = dz === -1 ? "north" : dz === 1 ? "south" : dx === 1 ? "east" : "west";
  const door = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  put(ent.x, ent.g + 1, ent.z, "iron_door", door("lower"));
  put(ent.x, ent.g + 2, ent.z, "iron_door", door("upper"));
  const inside = at(ent.x - dx, ent.z - dz);
  if (inside && !inside.wall) {
    put(inside.x, ent.g + 3, inside.z, "stone_bricks");                  // canopy, cantilevered from the shell
    put(inside.x, ent.g + 1, inside.z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

const stats = G.save(`${base}.nbt`);
console.log(JSON.stringify({ cells: all.length, entrance: entKey, ...stats }));
