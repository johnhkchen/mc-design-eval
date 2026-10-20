import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1147304844";
const W = 48, H = 38, D = 27;
const TOP = 25;            // parapet top at y=25, so the body is 26 blocks above y0
const STOREY = 5;          // five storeys of five blocks each

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, g] of cells) {
  if (x >= 0 && x < W && z >= 0 && z < D) ground.set(`${x},${z}`, Math.min(Math.max(0, g), TOP));
}
const has = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);
const perim = (x, z) => has(x, z) && (!has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1));

const g = new Voxels([W, H, D]);

const GLASS = "light_blue_stained_glass";
const FRAME = "white_concrete";
const SLAB = "light_gray_concrete";
const PLINTH = "polished_granite";
const SIGN = "gray_concrete";
const FOUND = "stone_bricks";

// Shell, floors, facade
for (const [key, base] of ground) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < base; y++) g.set(x, y, z, FOUND);

  const isPerim = perim(x, z);

  // face and outward normal
  const N = !has(x, z - 1), S = !has(x, z + 1), Wf = !has(x - 1, z), E = !has(x + 1, z);
  let face = null, dx = 0, dz = 0;
  if (N) { face = "north"; dz = -1; }
  else if (S) { face = "south"; dz = 1; }
  else if (Wf) { face = "west"; dx = -1; }
  else if (E) { face = "east"; dx = 1; }
  const along = (N || S) ? x : z;
  const corner = (N || S) && (Wf || E);
  const pil = isPerim && (corner || along % 4 === 0);
  const inX = x - dx, inZ = z - dz;
  const entranceCell = isPerim && face === "south" && (x === 23 || x === 24);

  for (let y = base; y <= TOP; y++) {
    const band = Math.floor(y / STOREY);
    const row = y % STOREY;

    // roof deck and parapet
    if (y === TOP) {
      g.set(x, y, z, isPerim ? FRAME : SLAB);
      continue;
    }

    if (!isPerim) {
      // interior: floor slabs only, air elsewhere (no interiors)
      if (y % STOREY === 0 || y === base) g.set(x, y, z, SLAB);
      continue;
    }

    // perimeter facade
    if (y === base) { g.set(x, y, z, PLINTH); continue; }

    if (band === 0) {
      if (pil) { g.set(x, y, z, FRAME); continue; }
      if (entranceCell && y <= base + 1 && y <= 4) {
        g.set(x, y, z, "dark_oak_door", {
          facing: face,
          half: y === base ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (y === 4) { g.set(x, y, z, SIGN); continue; }
      g.set(x, y, z, GLASS);
      continue;
    }

    // upper storeys: storey line, glazing rows, transom
    if (row === 0 || row === 4) { g.set(x, y, z, FRAME); continue; }
    if (pil) { g.set(x, y, z, FRAME); continue; }
    g.set(x, y, z, GLASS);

    // warm light behind selected windows, in the air gap just inside
    if (row === 2 && ((x * 13 + z * 7 + band * 5) % 6 === 0)
        && has(inX, inZ) && !perim(inX, inZ)) {
      g.set(inX, y, inZ, "glowstone");
    }
  }
}

// Roof plant room, inset from the parapet
const px0 = 12, px1 = 35, pz0 = 7, pz1 = 19;
for (let x = px0; x <= px1; x++) {
  for (let z = pz0; z <= pz1; z++) {
    if (!has(x, z)) continue;
    const edge = x === px0 || x === px1 || z === pz0 || z === pz1;
    const bayPil = x % 4 === 0 || z % 4 === 0;
    g.set(x, 26, z, edge ? FRAME : SLAB);          // plant floor / sill
    if (edge) {
      for (let y = 27; y <= 30; y++) {
        const glazed = (y === 27 || y === 28);
        g.set(x, y, z, glazed && !bayPil ? GLASS : FRAME);
      }
    }
    g.set(x, 31, z, "smooth_stone");               // cap
  }
}
// Mast on the plant room
if (has(24, 13)) {
  for (let y = 32; y <= 35; y++) g.set(24, y, 13, "lightning_rod");
}

g.save(`${DIR}/${ID}.nbt`);
