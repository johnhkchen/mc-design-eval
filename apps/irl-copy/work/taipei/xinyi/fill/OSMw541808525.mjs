import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541808525";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 11, H = 23, D = 15;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground y
const ground = new Map();
for (const [x, z, gy] of cells) ground.set(`${x},${z}`, gy);
const has = (x, z) => ground.has(`${x},${z}`);

// Outward directions: N = -z, S = +z, W = -x, E = +x
const DIRS = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
const exposed = (x, z) =>
  Object.keys(DIRS).filter(k => !has(x + DIRS[k][0], z + DIRS[k][1]));

// Wall material for a perimeter cell at height y
function wallBlock(x, z, y, base, ex) {
  // Storey lines, lintels, parapet: solid quartz bands
  if (y === base + 4 || y === base + 5 || y === base + 9 || y === base + 10) {
    return ["smooth_quartz"];
  }
  // Base course
  if (y === base) return ["polished_andesite"];

  // Corner columns
  if (ex.length >= 2) return ["quartz_pillar"];

  // Bays along the wall: pillar every third cell, glazing between
  const alongX = ex.includes("N") || ex.includes("S");
  const u = alongX ? x : z;
  if (u % 3 === 0) return ["quartz_pillar"];

  const ground = y <= base + 3;
  return ground ? ["glass"] : ["light_blue_stained_glass"];
}

for (const [x, z, gy] of cells) {
  const base = gy;

  // Foundation from y 0 up to the ground under this cell
  for (let y = 0; y < base; y++) g.set(x, y, z, "stone_bricks");

  const ex = exposed(x, z);
  const perimeter = ex.length > 0;

  // Floor slabs and roof deck (interior)
  g.set(x, base, z, perimeter ? "polished_andesite" : "smooth_stone");
  g.set(x, base + 5, z, perimeter ? "smooth_quartz" : "smooth_stone");
  g.set(x, base + 10, z, perimeter ? "smooth_quartz" : "smooth_stone");

  if (!perimeter) continue;

  // Facade: walls, glazing, pillars and bands
  for (const y of [base, base + 1, base + 2, base + 3, base + 4,
                   base + 5, base + 6, base + 7, base + 8, base + 9]) {
    const [id] = wallBlock(x, z, y, base, ex);
    g.set(x, y, z, id, id === "quartz_pillar" ? { axis: "y" } : undefined);
  }
}

// Entrance: front (south-facing) perimeter cell nearest the centre
const front = cells
  .filter(([x, z]) => exposed(x, z).includes("S"))
  .sort((a, b) => Math.abs(a[0] - 5) - Math.abs(b[0] - 5));
if (front.length) {
  const [dx, dz, dgy] = front[0];
  const b = dgy;
  const doorProps = { facing: "south", hinge: "left", open: "false", powered: "false" };
  g.set(dx, b + 1, dz, "dark_oak_door", { ...doorProps, half: "lower" });
  g.set(dx, b + 2, dz, "dark_oak_door", { ...doorProps, half: "upper" });
  // Hanging lantern over the entrance, fixed to the lintel band
  g.set(dx, b + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
}

// Warm light: glowstone on interior cells behind some windows
for (const [x, z, gy] of cells) {
  const ex = exposed(x, z);
  if (ex.length !== 1) continue; // plain wall cells only
  const [dir] = ex;
  const [ox, oz] = DIRS[dir];
  const ix = x - ox, iz = z - oz;
  if (!has(ix, iz)) continue;
  const alongX = dir === "N" || dir === "S";
  const u = alongX ? x : z;
  if (u % 3 === 0) continue; // pillars, not glass

  const base = gy;
  // Upper storey, mid row, every other bay
  if ((u + base) % 2 === 0) {
    g.set(ix, base + 7, iz, "glowstone");
  }
  // Ground shopfront, a few bays
  if ((u + base) % 4 === 1) {
    g.set(ix, base + 2, iz, "glowstone");
  }
}

// Roof equipment: a central plant block on the roof, interior cells only
for (const [x, z, gy] of cells) {
  if (exposed(x, z).length > 0) continue;
  if (x >= 3 && x <= 7 && z >= 4 && z <= 10) {
    g.set(x, gy + 11, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
