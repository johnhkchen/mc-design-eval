import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Low-rise Xinyi commercial block, 2 storeys on a 5-block module.
// Pale tiled/concrete facade, quartz bands, shopfront glass at street level,
// glass-and-pillar window bays above, a parapet, and a small roof penthouse.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1071343648";
const W = 18, H = 23, D = 18;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(key(x, z), Math.round(gr));
const has = (x, z) => ground.has(key(x, z));
const minG = Math.min(...ground.values());

const ROOF = minG + 10;   // roof deck / top cornice course
const PARAPET = minG + 11; // top of perimeter parapet

const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward faces of a footprint cell (cells missing a neighbour).
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push([0, -1, "north"]);
  if (!has(x, z + 1)) f.push([0, 1, "south"]);
  if (!has(x + 1, z)) f.push([1, 0, "east"]);
  if (!has(x - 1, z)) f.push([-1, 0, "west"]);
  return f;
};

const isPerim = (x, z) => faces(x, z).length > 0;

// Entrance: the south-face cell nearest the middle of that face.
const southCells = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (faces(x, z).some((f) => f[2] === "south")) southCells.push([x, z]);
}
let doorCell = null;
if (southCells.length) {
  const mid = southCells.reduce((s, c) => s + c[0], 0) / southCells.length;
  doorCell = southCells.reduce((best, c) =>
    Math.abs(c[0] - mid) < Math.abs(best[0] - mid) ? c : best);
}

// Penthouse footprint: cells with a full 5x5 of footprint around them.
const penthouse = (x, z) => {
  for (let dx = -2; dx <= 2; dx++)
    for (let dz = -2; dz <= 2; dz++)
      if (!has(x + dx, z + dz)) return false;
  return true;
};

// ---- Pass 1: foundations, interior slabs, perimeter facades ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const fs = faces(x, z);
  const perim = fs.length > 0;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");

  if (!perim) {
    // Interior: air gap, with a floor slab at each storey line.
    for (const L of [minG, minG + 5, ROOF]) {
      if (L >= gr && L < H) put(x, L, z, "smooth_stone");
    }
    continue;
  }

  const corner = fs.length > 1;
  const [, , face] = fs[0];
  const t = face === "north" || face === "south" ? x : z;
  const pillar = corner || t % 3 === 0;
  const isDoor = doorCell && doorCell[0] === x && doorCell[1] === z && face === "south";

  for (let y = gr; y <= PARAPET; y++) {
    let b = null, p = null;

    if (y === minG) {
      b = "polished_andesite"; // base course
    } else if (y <= minG + 4) {
      // Ground floor: shopfront.
      if (isDoor && y <= minG + 2) {
        b = "dark_oak_door";
        p = {
          facing: "south",
          half: y === minG + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        };
      } else if (y === minG + 4) {
        b = "white_concrete"; // fascia
      } else if (pillar) {
        b = "smooth_quartz";
      } else {
        b = "glass_pane";
      }
    } else if (y === minG + 5) {
      b = "smooth_quartz"; // storey line
    } else if (y <= minG + 9) {
      // Upper storey: window bays.
      b = pillar ? "white_concrete" : "glass_pane";
    } else if (y === ROOF) {
      b = "smooth_quartz"; // cornice
    } else {
      // Parapet cap.
      b = "smooth_quartz_slab";
      p = { type: "bottom", waterlogged: "false" };
    }

    if (b) put(x, y, z, b, p);
  }

  // Warm light behind some glass, on the inward (interior) cell.
  if (!corner && !isDoor && !pillar) {
    const [nx, nz] = [fs[0][0], fs[0][1]];
    const ix = x - nx, iz = z - nz;
    if (has(ix, iz) && !isPerim(ix, iz)) {
      const ig = ground.get(key(ix, iz));
      // Ground floor: hanging lanterns under the storey slab.
      if (t % 3 === 1 && ig <= minG + 4) {
        put(ix, minG + 4, iz, "lantern", { hanging: "true", waterlogged: "false" });
      }
      // Upper floor: glowstone at some windows.
      const yU = minG + 7;
      if (((t + yU) % 4 === 0) && ig <= yU) {
        put(ix, yU, iz, "glowstone");
      }
    }
  }
}

// ---- Pass 2: roof equipment and penthouse ----
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (isPerim(x, z) || gr > ROOF) continue;

  if (penthouse(x, z)) {
    put(x, PARAPET, z, "light_gray_concrete");
    put(x, PARAPET + 1, z, "light_gray_concrete");
    put(x, PARAPET + 2, z, "smooth_quartz_slab", { type: "bottom", waterlogged: "false" });
  } else if (x % 5 === 2 && z % 5 === 2) {
    // Small AC plant on the roof.
    put(x, PARAPET, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
