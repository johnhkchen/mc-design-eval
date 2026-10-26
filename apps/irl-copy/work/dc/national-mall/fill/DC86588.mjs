import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86588";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Downtown DC office, c.1980s-90s, 7 storeys of 3 blocks under the Height Act cornice.
// Granite base, sandstone storey bands, quartz piers, tinted glass bays,
// a wider glazed entrance bay on the north face, and a rooftop mechanical penthouse.
const W = 19, H = 33, D = 19;
const g = new Voxels([W, H, D]);

const STOREY = 3;
const map = new Map();
for (const c of cells) map.set(`${c[0]},${c[1]}`, { g: c[2], r: Math.min(c[3], H - 4) });
const has = (x, z) => map.has(`${x},${z}`);

function isPerimeter(x, z) {
  return !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
}

function faceOf(x, z) {
  if (!has(x, z - 1)) return { face: "north", dx: 0, dz: 1, u: x };
  if (!has(x, z + 1)) return { face: "south", dx: 0, dz: -1, u: x };
  if (!has(x - 1, z)) return { face: "west", dx: 1, dz: 0, u: z };
  return { face: "east", dx: -1, dz: 0, u: z };
}

const CENTER = Math.floor(W / 2);
const ENTRY_FACE = "north";

for (const [key, info] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = info.g;
  const roof = info.r;

  // Foundation from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, "granite");

  const perim = isPerimeter(x, z);
  const top = roof - 1;

  for (let y = gr; y <= top; y++) {
    const rel = y - gr;

    if (!perim) {
      // Interior: floor slabs and a solid roof deck, air between (no interiors)
      if (y === top) g.set(x, y, z, "smooth_stone");
      else if (rel % STOREY === 0) g.set(x, y, z, "smooth_stone");
      continue;
    }

    const f = faceOf(x, z);
    const corner = (!has(x, z - 1) && !has(x - 1, z)) || (!has(x, z - 1) && !has(x + 1, z)) ||
                   (!has(x, z + 1) && !has(x - 1, z)) || (!has(x, z + 1) && !has(x + 1, z));
    const pier = corner || f.u % 3 === 0;

    // Roof cornice / parapet
    if (y === top) {
      g.set(x, y, z, "smooth_sandstone");
      continue;
    }

    // Base course and storey bands
    if (rel % STOREY === 0) {
      g.set(x, y, z, rel === 0 ? "polished_granite" : "smooth_sandstone");
      continue;
    }

    // Ground-storey entrance on the north face: wide glazed bay, centre door
    const inEntry = f.face === ENTRY_FACE && rel <= 2 && f.u >= CENTER - 1 && f.u <= CENTER + 1;
    if (inEntry) {
      if (f.u === CENTER && rel === 1) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      } else if (f.u === CENTER && rel === 2) {
        g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      } else if (f.u === CENTER - 1 || f.u === CENTER + 1) {
        g.set(x, y, z, "quartz_pillar");
      } else {
        g.set(x, y, z, "light_gray_stained_glass_pane");
      }
      continue;
    }

    // Piers and glazing
    if (pier) {
      g.set(x, y, z, "quartz_block");
    } else {
      g.set(x, y, z, "light_blue_stained_glass_pane");
      // Warm light behind a few upper windows
      const hash = (x * 31 + z * 17 + y * 7) % 7;
      const ix = x + f.dx, iz = z + f.dz;
      if (hash === 0 && rel === 2 && has(ix, iz) && !isPerimeter(ix, iz)) {
        g.set(ix, y, iz, "glowstone");
      }
    }
  }

  // Rooftop mechanical penthouse in the centre of the plan
  if (!perim && Math.abs(x - CENTER) <= 2 && Math.abs(z - CENTER) <= 2 && roof + 2 < H) {
    g.set(x, roof, z, "stone_bricks");
    if (Math.abs(x - CENTER) <= 1 && Math.abs(z - CENTER) <= 1) {
      g.set(x, roof + 1, z, "quartz_block");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
