// Old Arts Building (way 23893967), Auckland. Read from the lidar record: a 14-20 block main body (about four to five
// storeys of 4 blocks), a 26-30 block podium wing, and a 41-46 block tower mass near the middle with a clock stage.
// Reads as an interwar academic block: red brick walls, cream stone bands, a volcanic-stone plinth, a flat parapet
// roof, and a copper-capped belfry on the tower. Hollow shell: exterior walls, one floor slab per storey, air between.
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const cells = JSON.parse(readFileSync("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893967.cells.json", "utf8"));
const W = 54, H = 59, D = 115;
const STOREY = 4;

const ground = new Map(); // "x,z" -> lowest ground under the cell
for (const [x, z, g] of cells) ground.set(`${x},${z}`, g);
const lidarRoof = new Map();
for (const [x, z, , r] of cells) lidarRoof.set(`${x},${z}`, r);
const inFoot = (x, z) => ground.has(`${x},${z}`);

// Roof tiers: a 5x5 median of the lidar roof (noise out), then snapped to the storey grid so every tier is flat.
const top = new Map(); // "x,z" -> roof surface height (y of the first air block above the roof)
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const rs = [];
  for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) {
    const k = `${x + dx},${z + dz}`; if (lidarRoof.has(k)) rs.push(lidarRoof.get(k));
  }
  rs.sort((a, b) => a - b);
  const med = rs[Math.floor(rs.length / 2)];
  top.set(key, Math.min(48, Math.max(g + STOREY, STOREY * Math.round(med / STOREY))));
}
const topOf = (x, z) => top.get(`${x},${z}`) ?? -1;

const DIRS = [[0, -1, "north"], [1, 0, "east"], [0, 1, "south"], [-1, 0, "west"]];
// exterior faces: the neighbour is outside the footprint or stands lower (a step riser)
const facesOf = (x, z, t) => DIRS.filter(([dx, dz]) => topOf(x + dx, z + dz) < t);
const paneState = (dx) => (dx !== 0
  ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }   // x-facing: the pane runs along z
  : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });  // z-facing: runs along x
const along = (dx, x, z) => (dx !== 0 ? z : x);     // position along a face
const OFFSET = { north: [0, -1], east: [1, 0], south: [0, 1], west: [-1, 0] };

const v = new Voxels([W, H, D]);
const S = (x, y, z, b, st) => v.set(x, y, z, b, st);

// 1. columns: plinth under ground, a stone roof, floors every storey, hollow interior, brick walls with windows outside
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const t = top.get(key);
  const fs = facesOf(x, z, t);
  for (let y = 0; y < g; y++) S(x, y, z, "polished_andesite");
  for (let y = g; y < t; y++) {
    if (y === t - 1) { S(x, y, z, fs.length ? "smooth_quartz" : "stone"); continue; }   // roof slab (cornice on the edge)
    const floor = y % STOREY === 0;
    if (fs.length === 0) { if (floor) S(x, y, z, "stone_bricks"); continue; }          // interior: floor slab only
    if (y === g) { S(x, y, z, "polished_andesite"); continue; }                        // base course on the plinth
    if (floor) { S(x, y, z, "smooth_quartz"); continue; }                              // string course at each storey line
    const F = y - (y % STOREY);
    const win = fs.length === 1 && [1, 2].includes(along(fs[0][0], x, z) % 4);
    if (win && y === F + 3) S(x, y, z, "smooth_quartz");                               // lintel over the window
    else if (win) S(x, y, z, "glass_pane", paneState(fs[0][0]));
    else S(x, y, z, "bricks");
  }
  if (fs.length) S(x, t, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" }); // parapet coping
}

// 2. warm lights behind some windows: a glowstone or a lantern on the floor slab, in the air gap inside the glass
for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  const fs = facesOf(x, z, t);
  if (fs.length !== 1) continue;
  const [dx, dz] = fs[0];
  for (let yy = ground.get(key) + 1; yy < t - 1; yy++) {
    const F = yy - (yy % STOREY);
    if (yy !== F + 1 || ![1, 2].includes(along(dx, x, z) % 4)) continue;
    const h = (x * 31 + z * 17 + yy * 7) % 6;
    if (h !== 0 && h !== 3) continue;
    const ix = x - dx, iz = z - dz;
    if (!inFoot(ix, iz) || topOf(ix, iz) <= yy || facesOf(ix, iz, topOf(ix, iz)).length) continue;
    if (h === 0) S(ix, yy, iz, "glowstone"); else S(ix, yy, iz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// 3. the entrance: a portal bay on the lowest street-level face of the outline, nearest the footprint's middle
const cx = cells.reduce((a, c) => a + c[0], 0) / cells.length, cz = cells.reduce((a, c) => a + c[1], 0) / cells.length;
let door = null;
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);
  const t = top.get(key);
  const fs = facesOf(x, z, t);
  if (fs.length !== 1 || topOf(x + fs[0][0], z + fs[0][1]) !== -1 || g > 0) continue;
  const [dx, dz] = fs[0], a = along(dx, x, z);
  const ok = [-1, 1].every((s) => {
    const nx = dx ? x : x + s, nz = dx ? z + s : z;
    return inFoot(nx, nz) && facesOf(nx, nz, topOf(nx, nz)).some(([ddx, ddz]) => ddx === dx && ddz === dz);
  });
  if (!ok) continue;
  const d = Math.hypot(x - cx, z - cz);
  if (!door || d < door.d) door = { x, z, g, dx, dz, a, d, t };
}
if (door) {
  const { x, z, g, dx, dz } = door;
  const bay = [-1, 0, 1].map((s) => (dx ? [x, z + s] : [x + s, z]));
  for (const [bx, bz] of bay) {
    for (let y = g; y <= g + 2; y++) S(bx, y, bz, "smooth_quartz");                           // portal pilasters + lintel
    S(bx, g + 3, bz, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });       // canopy over the bay
  }
  // the door faces inward: the front points back into the building
  const facing = { north: "south", south: "north", east: "west", west: "east" }[DIRS.find(([ddx, ddz]) => ddx === dx && ddz === dz)[2]];
  const doorState = (half) => ({ facing, half, hinge: "left", open: "false", powered: "false" });
  S(x, g, z, "dark_oak_door", doorState("lower"));
  S(x, g + 1, z, "dark_oak_door", doorState("upper"));
  // inside the bay, a warm lantern sits on the floor just behind the door
  const ix = x - dx, iz = z - dz;
  if (inFoot(ix, iz)) S(ix, g + 1, iz, "lantern", { hanging: "false", waterlogged: "false" });
  console.log("entrance", { x, z, g, face: [dx, dz] });
}

// 4. roof plant: brick flues on the flat roofs, away from the belfry
// the belfry stands on the highest tier that has a flat 5x5 site, nearest the middle of that tier
const tiersDesc = [...new Set(top.values())].sort((a, b) => b - a);
let belfry = null, tm = 0;
for (const t of tiersDesc) {
  const sites = [...top].filter(([, tt]) => tt === t).map(([k]) => k.split(",").map(Number)).filter(([x, z]) => {
    for (let dz = -2; dz <= 2; dz++) for (let dx = -2; dx <= 2; dx++) if (topOf(x + dx, z + dz) !== t) return false;
    return true;
  });
  if (!sites.length) continue;
  const mx = sites.reduce((a, c) => a + c[0], 0) / sites.length, mz = sites.reduce((a, c) => a + c[1], 0) / sites.length;
  const [x, z] = sites.reduce((a, c) => (Math.hypot(c[0] - mx, c[1] - mz) < Math.hypot(a[0] - mx, a[1] - mz) ? c : a));
  belfry = { x, z, d: 0 }; tm = t; break;
}
const inBelfry = (x, z) => belfry && Math.abs(x - belfry.x) <= 2 && Math.abs(z - belfry.z) <= 2;
for (const [key, t] of top) {
  const [x, z] = key.split(",").map(Number);
  if (facesOf(x, z, t).length || t < 16 || inBelfry(x, z)) continue;
  if ((x * 5 + z * 3) % 97 !== 0) continue;
  S(x, t, z, "bricks"); S(x, t + 1, z, "bricks");
}

// 5. the clock belfry on the tower: a 5x5 stage of pillars, openings and a copper cap, standing on the tower roof
if (belfry) {
  const { x: bx0, z: bz0 } = belfry;
  for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) {
    const x = bx0 + i, z = bz0 + j, ring = Math.abs(i) === 2 || Math.abs(j) === 2, corner = Math.abs(i) === 2 && Math.abs(j) === 2;
    if (ring) {
      if (corner) for (let y = tm; y <= tm + 2; y++) S(x, y, z, "polished_andesite");
      else {
        const a = Math.abs(i) === 2 ? j : i;
        S(x, tm, z, "smooth_quartz");
        S(x, tm + 2, z, "smooth_quartz");
        if (Math.abs(a) <= 1) S(x, tm + 1, z, "air"); else S(x, tm + 1, z, "bricks");
      }
    } else for (let y = tm; y <= tm + 2; y++) S(x, y, z, "air");
    S(x, tm + 3, z, "smooth_quartz");
    S(x, tm + 4, z, "oxidized_cut_copper_slab", { type: "bottom", waterlogged: "false" });
  }
  S(bx0, tm, bz0, "lantern", { hanging: "false", waterlogged: "false" });
}

const info = v.save("/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nz/auckland/fill/way_23893967.nbt");
const tiers = {};
for (const t of top.values()) tiers[t] = (tiers[t] || 0) + 1;
console.log("cells", cells.length, "tiers", JSON.stringify(tiers), "belfry", belfry, "blocks", info.blocks, "palette", info.palette);
