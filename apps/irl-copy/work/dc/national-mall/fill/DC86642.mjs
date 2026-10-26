import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86642";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// 1030 15th St NW: 1960s-70s Modernist office block, ~10 storeys of 2-block bays
// over a 3-block shopfront/base course, precast white piers, grey spandrels,
// tinted blue-glass window bands, stone foundation and cornice, lit interior glow.
// Revision: stone entrance surround with lanterns under a wider canopy,
// glowing shopfront interiors, and a more varied window rhythm.
const W = 28, D = 21, H = 32;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const DIRS = [[0, -1], [0, 1], [1, 0], [-1, 0]]; // outward normals: north(front), south, east, west

const cmap = new Map();
for (const [x, z, ground, roof] of cells) {
  cmap.set(key(x, z), { x, z, ground: Math.round(ground), roof: Math.round(roof) });
}

const outsOf = (x, z) => DIRS.filter(([dx, dz]) => !cmap.has(key(x + dx, z + dz)));
const isExt = (x, z) => outsOf(x, z).length > 0;

// Smooth lidar roofs into one main roof level with lower wings
const roofs = [...cmap.values()].map(c => c.roof).sort((a, b) => a - b);
const mainRoof = clamp(roofs[Math.floor(roofs.length / 2)], 8, H - 5);

for (const c of cmap.values()) {
  let t = c.roof >= mainRoof - 1 ? mainRoof : c.roof;
  t = Math.max(t, c.ground + 4);
  c.top = clamp(t, 4, H - 4);
}

// Main massing pass
for (const c of cmap.values()) {
  const { x, z, ground, top } = c;

  // Stone foundation up to each cell's own ground
  for (let y = 0; y < ground; y++) g.set(x, y, z, "stone_bricks");

  const outs = outsOf(x, z);
  if (outs.length === 0) {
    // Interior: floor slabs per storey and roof membrane only; air between
    for (let y = ground; y < top; y++) {
      const rel = y - ground;
      if (y === top - 1) { g.set(x, y, z, "gray_concrete"); continue; }
      if (rel === 0 || (rel >= 3 && (rel - 3) % 2 === 0)) g.set(x, y, z, "light_gray_concrete");
    }
    continue;
  }

  // Exterior shell
  const corner = outs.length >= 2;
  const axisIdx = outs[0][1] !== 0 ? x : z;       // position along the face
  const pier = corner || axisIdx % 3 === 0;
  const front = outs.some(([dx, dz]) => dx === 0 && dz === -1);
  const ix = x - outs[0][0], iz = z - outs[0][1]; // inward neighbour
  const inwardOk = cmap.has(key(ix, iz)) && !isExt(ix, iz);

  for (let y = ground; y < top; y++) {
    const rel = y - ground;

    // Roof cornice
    if (y === top - 1) { g.set(x, y, z, "smooth_stone"); continue; }

    // Entrance: double dark-oak doors on the front, stone surround, lanterns, canopy
    if (front && (x === 13 || x === 14) && rel <= 1) {
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half: rel === 0 ? "lower" : "upper",
        hinge: x === 13 ? "left" : "right",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (front && (x === 11 || x === 16) && rel === 2) {
      g.set(x, y, z, "lantern", { hanging: "true", waterlogged: "false" });
      continue;
    }
    if (front && (x === 11 || x === 16) && rel === 1) { g.set(x, y, z, "stone_bricks"); continue; }
    if (front && x >= 12 && x <= 15 && rel === 2) { g.set(x, y, z, "stone_bricks"); continue; }
    if (front && x >= 10 && x <= 17 && rel === 3) {
      g.set(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Base course
    if (rel === 0) { g.set(x, y, z, "stone_bricks"); continue; }

    // Shopfront zone (ground floor, 3 blocks)
    if (rel < 3) {
      if (pier) g.set(x, y, z, "light_gray_concrete");
      else {
        g.set(x, y, z, "light_blue_stained_glass");
        // Warm shop light behind some ground-floor glass
        if (axisIdx % 4 === 2 && inwardOk && rel === 1) g.set(ix, y, iz, "glowstone");
      }
      continue;
    }

    // Upper storeys: 2-block bays, spandrel then window row
    const s = rel - 3;
    if (s % 2 === 0) { g.set(x, y, z, "light_gray_concrete"); continue; }   // spandrel band
    if (pier) { g.set(x, y, z, "white_concrete"); continue; }               // precast pier
    g.set(x, y, z, "light_blue_stained_glass");

    // Warm light behind some upper glass
    if (rel >= 4 && !corner && axisIdx % 6 === 1 && inwardOk) {
      g.set(ix, y, iz, "glowstone");
    }
  }
}

// Roof penthouse on the core, and rooftop mechanical units
for (const c of cmap.values()) {
  const { x, z, top } = c;

  if (x >= 8 && x <= 19 && z >= 6 && z <= 14) {
    const edge = x === 8 || x === 19 || z === 6 || z === 14;
    g.set(x, top, z, "light_gray_concrete");
    if (edge) {
      g.set(x, top + 1, z, (x + z) % 2 === 0 ? "light_blue_stained_glass" : "light_gray_concrete");
    }
    g.set(x, top + 2, z, "smooth_stone");
  }

  if (x >= 22 && x <= 24 && z >= 3 && z <= 5) {
    g.set(x, top, z, "gray_concrete");
    g.set(x, top + 1, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
