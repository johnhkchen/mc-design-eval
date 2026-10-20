import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw541456406";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Footprint 19 x 9. Two-storey mid-century commercial block in Xinyi: pale
// painted concrete piers, light blue tinted glass bands, granite base,
// a stone cornice and a parapet with a rooftop plant box.
const W = 19;
const D = 9;

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const has = (x, z) => G.has(`${x},${z}`);

const maxG = Math.max(...cells.map((c) => c[2]));
const H = Math.max(23, maxG + 12);
const minX = Math.min(...cells.map((c) => c[0]));
const maxX = Math.max(...cells.map((c) => c[0]));
const minZ = Math.min(...cells.map((c) => c[1]));
const maxZ = Math.max(...cells.map((c) => c[1]));

const FOUND = "stone_bricks";
const BASE = "polished_granite";
const PIER = "white_concrete";
const FASCIA = "polished_andesite";
const STOREY = "smooth_stone";
const CORNICE = "stone_bricks";
const PARAPET = "white_concrete";
const WIN = "light_blue_stained_glass_pane";
const SHOP = "glass_pane";
const GLOW = "glowstone";
const PLANT = "light_gray_concrete";

const g = new Voxels([W, H, D]);

const paneX = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const paneZ = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

const doorI = (() => {
  const L = maxX - minX + 1;
  let d = Math.floor(L / 2);
  if (d % 3 === 0) d++;
  return d;
})();

for (const [x, z, gr] of cells) {
  // Foundation up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, FOUND);

  // Floor slabs and roof deck for every footprint cell.
  g.set(x, gr, z, STOREY);
  g.set(x, gr + 5, z, STOREY);
  g.set(x, gr + 9, z, CORNICE);

  const ex = {
    n: !has(x, z - 1),
    s: !has(x, z + 1),
    w: !has(x - 1, z),
    e: !has(x + 1, z),
  };
  const zFace = ex.n || ex.s;
  const xFace = ex.w || ex.e;
  if (!zFace && !xFace) {
    // Interior cell: rooftop plant box in the middle of the roof.
    if (x >= minX + 6 && x <= minX + 10 && z >= minZ + 3 && z <= minZ + 5) {
      g.set(x, gr + 10, z, PLANT);
      g.set(x, gr + 11, z, PLANT);
    }
    continue;
  }

  const corner = zFace && xFace;
  let i, L;
  if (zFace) {
    i = x - minX;
    L = maxX - minX + 1;
  } else {
    i = z - minZ;
    L = maxZ - minZ + 1;
  }
  const pier = corner || i === 0 || i === L - 1 || i % 3 === 0;
  const isDoor = ex.s && !corner && !pier && i === doorI;
  const paneProps = zFace ? paneX : paneZ;

  // Base course.
  g.set(x, gr, z, BASE);

  // Shopfront / ground floor.
  if (pier) {
    for (let r = 1; r <= 3; r++) g.set(x, gr + r, z, PIER);
  } else if (isDoor) {
    g.set(x, gr + 1, z, "dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 3, z, SHOP, paneProps);
  } else {
    for (let r = 1; r <= 3; r++) g.set(x, gr + r, z, SHOP, paneProps);
  }

  // Fascia / canopy band over the shopfront.
  if (isDoor) {
    g.set(x, gr + 4, z, "dark_oak_stairs", { facing: "south", half: "top", shape: "straight", waterlogged: "false" });
  } else {
    g.set(x, gr + 4, z, FASCIA);
  }

  // Storey line between floors.
  g.set(x, gr + 5, z, STOREY);

  // Upper floor windows.
  for (let r = 6; r <= 8; r++) {
    if (pier) {
      g.set(x, gr + r, z, PIER);
    } else if (r === 7 && i % 4 === 1) {
      g.set(x, gr + r, z, GLOW);
    } else {
      g.set(x, gr + r, z, WIN, paneProps);
    }
  }

  // Cornice and parapet.
  g.set(x, gr + 9, z, CORNICE);
  g.set(x, gr + 10, z, PARAPET);
}

g.save(`${DIR}/${ID}.nbt`);
