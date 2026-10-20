import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542020185";
const W = 8, H = 23, D = 12;

// Footprint: [x, z, ground] per cell. Accept a bare array or {cells: [...]}.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);
const ground = new Map();
for (const c of list) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.max(0, Math.round(gr)));
}
const has = (x, z) => ground.has(`${x},${z}`);
const G = (x, z) => ground.get(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const face = (x, z) => {
  if (!has(x, z - 1)) return "north";
  if (!has(x, z + 1)) return "south";
  if (!has(x - 1, z)) return "west";
  return "east";
};
const INWARD = { north: [0, 1], south: [0, -1], west: [1, 0], east: [-1, 0] };

// Front = northern (minimum z) edge; door sits about 3 cells in from its west end.
const zMin = Math.min(...[...ground.keys()].map((k) => Number(k.split(",")[1])));
const frontXs = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([, z]) => z === zMin)
  .map(([x]) => x);
const xMinFront = Math.min(...frontXs);
const doorX = has(xMinFront + 3, zMin) ? xMinFront + 3 : xMinFront;

const v = new Voxels([W, H, D]);

// Storey plan relative to each cell's ground g:
// dy0 base, dy1-3 shopfront, dy4 canopy band, dy5 storey line,
// dy6-9 upper windows, dy10 cornice/roof cap, dy11 parapet.
for (const [key, g] of ground) {
  const [x, z] = key.split(",").map(Number);

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g; y++) v.set(x, y, z, "stone_bricks");

  if (!isEdge(x, z)) {
    // Interior: floor slabs per storey and roof deck; air gap otherwise.
    v.set(x, g, z, "smooth_stone");
    v.set(x, g + 5, z, "smooth_stone");
    v.set(x, g + 10, z, "smooth_stone");
    if (x >= 3 && x <= 4 && z >= 5 && z <= 6) {
      // Small roof plant box.
      v.set(x, g + 11, z, "light_gray_concrete");
    }
    continue;
  }

  const f = face(x, z);
  const i = f === "north" || f === "south" ? x : z;
  const pier = i % 2 === 0;
  const isFront = f === "north" && z === zMin;
  const isDoor = isFront && x === doorX;
  const canopy = isFront && x >= doorX - 1 && x <= doorX + 2;

  // Base course.
  v.set(x, g, z, "stone_bricks");

  // Shopfront, dy1-3.
  for (let dy = 1; dy <= 3; dy++) {
    const y = g + dy;
    if (isDoor) {
      if (dy === 3) v.set(x, y, z, "glass");
      else
        v.set(x, y, z, "oak_door", {
          facing: "south",
          half: dy === 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
    } else if (pier) {
      v.set(x, y, z, "polished_andesite");
    } else {
      v.set(x, y, z, "glass");
    }
  }

  // Canopy band over the entrance, plain band elsewhere.
  v.set(x, g + 4, z, canopy ? "dark_oak_planks" : "white_concrete");

  // Storey line.
  v.set(x, g + 5, z, "smooth_stone");

  // Upper storey windows with mullion piers.
  for (let dy = 6; dy <= 9; dy++) {
    v.set(x, g + dy, z, pier ? "white_concrete" : "glass");
  }

  // Cornice and parapet.
  v.set(x, g + 10, z, "stone_bricks");
  v.set(x, g + 11, z, "white_concrete");

  // Warm light: glowstone in the air gap behind some upper windows.
  if (!pier && i % 4 === 1) {
    const [dx, dz] = INWARD[f];
    const ix = x + dx, iz = z + dz;
    if (has(ix, iz) && !isEdge(ix, iz)) {
      const gi = G(ix, iz);
      const y = g + 7;
      if (y >= gi + 1 && y <= gi + 9) v.set(ix, y, iz, "glowstone");
    }
  }
}

v.save(`${DIR}/${ID}.nbt`);
