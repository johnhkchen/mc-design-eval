import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86613";
const W = 12, D = 16, H = 35;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// Footprint lookup and a single storey-aligned massing for the whole tower,
// so the lidar noise does not produce a jagged skyline.
const fp = new Map();
let minGr = Infinity, maxGr = -Infinity;
const roofs = [];
for (const [x, z, gr0, roof0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  minGr = Math.min(minGr, gr);
  maxGr = Math.max(maxGr, gr);
  roofs.push(roof0);
  fp.set(`${x},${z}`, { gr });
}
roofs.sort((a, b) => a - b);
const medRoof = roofs[Math.floor(roofs.length / 2)];
const storeys = Math.max(1, Math.round((medRoof - minGr) / 3));
let TOP = Math.min(30, minGr + 3 * storeys);
TOP = Math.max(TOP, maxGr + 3);

const has = (x, z) => fp.has(`${x},${z}`);
const isPerim = (x, z) => !(has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1));
const inCore = (x, z) => x >= 3 && x <= 8 && z >= 4 && z <= 11;
const CORE_TOP = Math.min(TOP + 3, 32);

// Materials: granite base, pale precast walls, tinted glass, dark spandrels, dark roof.
const BASE = "polished_granite";
const WALL = "smooth_quartz";
const SPAND = "light_gray_concrete";
const GLASS = "light_blue_stained_glass_pane";
const SHOP = "cyan_stained_glass_pane";
const ROOF = "gray_concrete";
const PLANT = "light_gray_concrete";

for (const [key, { gr }] of fp) {
  const [x, z] = key.split(",").map(Number);
  const perim = isPerim(x, z);
  const cornerX = (x === 0 || x === W - 1);
  const cornerZ = (z === 0 || z === D - 1);
  const corner = cornerX && cornerZ;
  const u = cornerX ? z : x;

  // 1. Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, BASE);

  if (!perim) {
    // 2. Interior: floor slabs at each storey line, a two-block roof deck,
    //    air in between (no interiors, air behind the glass).
    for (let y = gr; y < TOP; y++) {
      const rel = y - gr;
      if (y >= TOP - 2) g.set(x, y, z, ROOF);
      else if (rel % 3 === 0) g.set(x, y, z, WALL);
    }
    // Warm shroomlight sitting on a floor slab, behind the front-row windows.
    if (z === 1 && x % 4 === 2) {
      for (let y = gr; y < TOP - 2; y++) {
        const rel = y - gr;
        if (rel % 6 === 4 && rel >= 4) g.set(x, y, z, "shroomlight");
      }
    }
    // Central tower core rising above the main roof as a setback tier.
    if (inCore(x, z)) {
      for (let y = TOP; y < CORE_TOP; y++) {
        g.set(x, y, z, (y - TOP) % 3 === 2 ? SPAND : WALL);
      }
    } else if (TOP + 0 <= 30 && (x % 5 === 2) && (z % 7 === 3)) {
      // Roof plant on the deck (two blocks, standing on the roof).
      g.set(x, TOP, z, PLANT);
      g.set(x, TOP + 1, z, PLANT);
    }
    continue;
  }

  // 3. Perimeter facade from ground to the roof line.
  for (let y = gr; y < TOP; y++) {
    const rel = y - gr;
    let block;
    if (y === TOP - 1) {
      block = WALL;                       // parapet / cornice cap
    } else if (rel === 0) {
      block = BASE;                       // base course
    } else if (rel < 3) {
      // Ground-floor shopfront with transom.
      block = (corner || u % 3 === 0) ? WALL : SHOP;
    } else if (rel % 3 === 0) {
      block = SPAND;                      // storey line spandrel
    } else {
      block = (corner) ? WALL : ((u % 2 === 1) ? GLASS : WALL);
    }
    g.set(x, y, z, block);
  }

  // 4. Centred entrance on the street face (z = 0) with flanking lanterns.
  if (z === 0 && x === 5 && gr + 2 < TOP) {
    g.set(x, gr, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, SHOP);
  }
  if (z === 0 && (x === 4 || x === 7) && gr + 2 < TOP) {
    g.set(x, gr + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
  }

  // 5. Warm glowstone in a few upper bays on the street face.
  if (z === 0 && x % 4 === 1) {
    for (let rel = 4; rel < TOP - gr - 1; rel += 6) {
      g.set(x, gr + rel, z, "glowstone");
    }
  }

  // 6. Corner lanterns on the parapet for a dusk read.
  if (corner && TOP < 33) {
    g.set(x, TOP, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
