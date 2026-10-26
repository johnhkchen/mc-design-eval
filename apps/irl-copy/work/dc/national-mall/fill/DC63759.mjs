import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC63759.cells.json`, "utf8"));

const W = 18, H = 32, D = 25;
const g = new Voxels([W, H, D]);

// Footprint map: "x,z" -> { g: ground, r: roof top (absolute, above y0) }
const raw = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = Array.isArray(c) ? c : [c.x, c.z, c.ground, c.roof];
  raw.set(`${x},${z}`, { g: gr, r: rf });
}
const B = Math.min(...[...raw.values()].map((c) => c.g));

// Quantise roofs into clean 4-block storey tiers (smooths lidar noise, no floating tiers)
const map = new Map();
for (const [k, c] of raw) {
  const tiers = Math.round((c.r - B) / 4);
  let r = B + tiers * 4;
  r = Math.max(r, c.g + 8);
  r = Math.min(r, H - 3);
  map.set(k, { g: c.g, r });
}

const has = (x, z) => map.has(`${x},${z}`);
const isPerim = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const DOOR_X = [Math.floor(W / 2) - 1, Math.floor(W / 2)];

// Palette: Indiana-limestone-like Beaux-Arts palazzo
const STONE = "smooth_quartz";
const TRIM = "calcite";
const BASE = "stone_bricks";
const BASE2 = "cracked_stone_bricks";
const BAND = "polished_andesite";

function glassProps(x, z) {
  const alongX = !has(x, z - 1) || !has(x, z + 1);
  return alongX
    ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
    : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
}

function inwardOffset(x, z) {
  let dx = 0, dz = 0;
  if (!has(x - 1, z)) dx = 1;
  else if (!has(x + 1, z)) dx = -1;
  if (!has(x, z - 1)) dz = 1;
  else if (!has(x, z + 1)) dz = -1;
  return [dx, dz];
}

function doorBlock(x, y, z, c) {
  const k = y - c.g;
  const hinge = x === DOOR_X[0] ? "left" : "right";
  if (k === 0 || k === 1) {
    g.set(x, y, z, "dark_oak_door", {
      facing: "north", half: k === 0 ? "lower" : "upper", hinge,
      open: "false", powered: "false",
    });
  } else if (k === 2) {
    // carved lintel over the doorway, with a lantern-lit keystone
    g.set(x, y, z, BAND);
  } else {
    g.set(x, y, z, TRIM);
  }
}

function wall(x, y, z, c) {
  const top = c.r - 1;
  const rel = y - B;
  const k = y - c.g;
  const u = x + z;
  const front = !has(x, z - 1);

  // Entrance on the street (north, z=0) face: a two-bay door with a stone surround
  if (front && DOOR_X.includes(x) && k <= 2) {
    doorBlock(x, y, z, c);
    return;
  }
  if (front && (x === DOOR_X[0] - 1 || x === DOOR_X[1] + 1) && k <= 2) {
    g.set(x, y, z, TRIM); // door surround jambs
    return;
  }

  // Cornice: projecting band, dentil course, top slab
  if (y === top) {
    g.set(x, y, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    return;
  }
  if (y === top - 1) { g.set(x, y, z, TRIM); return; }
  if (y === top - 2) { g.set(x, y, z, BAND); return; }

  // Rusticated base course: plinth, rusticated courses, glazed bays, string course
  if (rel <= 3) {
    if (rel === 0) { g.set(x, y, z, BASE); return; }
    if (rel === 3) { g.set(x, y, z, BAND); return; }
    if (u % 3 === 1) { g.set(x, y, z, "glass_pane", glassProps(x, z)); return; }
    g.set(x, y, z, (u + rel) % 2 === 0 ? BASE : BASE2);
    return;
  }
  if (rel === 4) { g.set(x, y, z, BAND); return; }

  // Piano nobile and upper storeys: pilasters, sills and lintels, glazed bays
  const kk = (rel - 5) % 4;
  if (u % 3 === 0) { g.set(x, y, z, TRIM); return; }          // pilasters
  if (kk === 0) { g.set(x, y, z, TRIM); return; }              // sill course
  if (kk === 3) { g.set(x, y, z, STONE); return; }             // spandrel / lintel course
  g.set(x, y, z, "glass_pane", glassProps(x, z));

  // Warm light set just inside some windows (in the air gap behind the glass)
  if (kk === 1 && u % 5 === 0) {
    const [dx, dz] = inwardOffset(x, z);
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      const ic = map.get(`${ix},${iz}`);
      if (y >= ic.g && y < ic.r - 1) g.set(ix, y, iz, "glowstone");
    }
  }
}

for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);

  // Foundation from y0 up to this cell's ground
  for (let y = 0; y < c.g; y++) g.set(x, y, z, BASE);

  const per = isPerim(x, z);
  for (let y = c.g; y < c.r; y++) {
    const top = c.r - 1;
    const rel = y - B;
    if (per) {
      wall(x, y, z, c);
    } else {
      // Interior: only floor slabs at storey lines and the roof deck; air otherwise
      if (y === top) g.set(x, y, z, "smooth_stone");
      else if (rel > 0 && rel % 4 === 0) g.set(x, y, z, "smooth_stone");
    }
  }

  // Balustrade on the parapet: posts on alternate cells, corners always
  if (per) {
    const corner = (!has(x - 1, z) || !has(x + 1, z)) && (!has(x, z - 1) || !has(x, z + 1));
    if (corner || (x + z) % 2 === 0) {
      g.set(x, c.r, z, "stone_brick_wall", {
        up: "true", north: "none", south: "none", east: "none", west: "none", waterlogged: "false",
      });
    }
  }
}

g.save(`${DIR}/DC63759.nbt`);
