import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw826989986";
const W = 17, H = 38, D = 16;
const TOP = 26;            // roof slab top (exclusive of parapet/penthouse), from lidar record

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gy] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, gy);
}
const has = (x, z) => ground.has(`${x},${z}`);
const B = Math.max(...ground.values());          // common floor level: highest footprint ground
const h = Math.floor((TOP - B) / 5);             // storey height, ~5 blocks
const fb = (k) => B + k * h;                     // floor line of storey k (k = 0..4)

const g = new Voxels([W, H, D]);

const DIRS = [
  { dx: 0, dz: -1, name: "north" },
  { dx: 0, dz: 1, name: "south" },
  { dx: 1, dz: 0, name: "east" },
  { dx: -1, dz: 0, name: "west" },
];
const exposures = (x, z) => DIRS.filter((d) => !has(x + d.dx, z + d.dz));

const paneProps = (d) =>
  d.dx !== 0
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// ---- choose entrance: a single-exposure wall cell closest to the centre, preferring north, then south, west, east
let entrance = null;
for (const name of ["north", "south", "west", "east"]) {
  let best = null;
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    const ex = exposures(x, z);
    if (ex.length === 1 && ex[0].name === name) {
      const dist = Math.abs(x - W / 2) + Math.abs(z - D / 2);
      if (!best || dist < best.dist) best = { x, z, d: ex[0], dist };
    }
  }
  if (best) { entrance = best; break; }
}

// ---- main shell
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposures(x, z);
  const perim = ex.length > 0;
  const single = ex.length === 1 ? ex[0] : null;

  // foundation / plinth: solid from y 0 up to the common floor level
  for (let y = 0; y < B; y++) g.set(x, y, z, "stone_bricks");

  // storey slabs (full footprint); ground-floor base course on the perimeter
  for (let k = 0; k < 5; k++) {
    const y = fb(k);
    if (y >= TOP - 1) continue;
    if (k === 0 && perim) g.set(x, y, z, "polished_granite");
    else g.set(x, y, z, "light_gray_concrete");
  }

  // roof slab / cornice
  g.set(x, TOP - 1, z, perim ? "smooth_quartz" : "light_gray_concrete");

  // exterior walls, glazing, piers, lintels, parapet
  if (perim) {
    for (let y = B + 1; y <= TOP - 2; y++) {
      if (y === TOP - 2) { g.set(x, y, z, "white_concrete"); continue; } // parapet course
      const rel = y - B;
      const s = Math.min(4, Math.floor(rel / h));
      if (fb(s) === y) continue; // floor line already set
      const r = rel - s * h;
      if (r >= h - 1) { g.set(x, y, z, "white_concrete"); continue; }   // lintel band
      const idx = single && single.dx !== 0 ? z : x;
      const pier = idx % 3 === 0 || !single;
      if (pier) g.set(x, y, z, "white_concrete");
      else g.set(x, y, z, "light_blue_stained_glass_pane", paneProps(single));
    }
  } else {
    // interior: air gap, floor slabs already placed; roof slab above
  }
}

// ---- entrance: double door with lintel above, facing outward
if (entrance) {
  const { x, z, d } = entrance;
  const facing = d.name;
  g.set(x, B, z, "oak_door", { facing, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, B + 1, z, "oak_door", { facing, half: "upper", hinge: "left", open: "false", powered: "false" });
  g.set(x, B + 2, z, "white_concrete");
}

// ---- warm lights behind some windows (air gap inside the wall)
for (const key of ground.keys()) {
  const [x, z] = key.split(",").map(Number);
  const ex = exposures(x, z);
  if (ex.length !== 1) continue;
  const d = ex[0];
  const ix = x - d.dx, iz = z - d.dz;
  if (!has(ix, iz) || exposures(ix, iz).length > 0) continue;
  const idx = d.dx !== 0 ? z : x;
  if (idx % 3 === 0) continue;
  for (let s = 0; s < 5; s++) {
    const r = 2;
    const y = fb(s) + r;
    if (y >= TOP - 2) continue;
    if (((x * 5 + z * 3 + s) % 4) !== 0) continue;
    g.set(ix, y, iz, (x + z + s) % 2 ? "glowstone" : "shroomlight");
  }
}

// ---- roof plant room (penthouse) on the centre of the roof, then antenna
const px0 = 5, px1 = 11, pz0 = 5, pz1 = 10;
let rodPlaced = false;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
    for (let y = TOP; y <= TOP + 2; y++) {
      g.set(x, y, z, edge ? "white_concrete" : "light_gray_concrete");
    }
    g.set(x, TOP + 3, z, "light_gray_concrete");
    if (!rodPlaced && x === 8 && z === 7) {
      for (let y = TOP + 4; y <= TOP + 6; y++) g.set(x, y, z, "lightning_rod");
      rodPlaced = true;
    }
  }
}
if (!rodPlaced) {
  for (const key of ground.keys()) {
    const [x, z] = key.split(",").map(Number);
    if (x >= px0 && x <= px1 && z >= pz0 && z <= pz1) {
      for (let y = TOP + 4; y <= TOP + 6; y++) g.set(x, y, z, "lightning_rod");
      break;
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
