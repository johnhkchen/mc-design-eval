import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86597.cells.json`, "utf8"));

// Footprint 4 x 10. Five-storey early-20th-century clay-brick commercial block:
// stone base, polished andesite string courses and cornice, glazed bays on the
// long sides, a framed entrance with pilasters and shopfront at z = 0, a roof deck
// with a parapet and a small plant box.
const W = 4, H = 19, D = 10;
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  const r = Math.min(Math.max(Math.round(roof), ground + 3), H - 2);
  map.set(`${x},${z}`, { gr: ground, r });
}

const isFacade = (x, z) => x === 0 || x === W - 1 || z === 0 || z === D - 1;
const paneNS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const paneEW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

// Pass 1: solid massing for every cell.
for (const [key, { gr, r }] of map) {
  const [x, z] = key.split(",").map(Number);
  const facade = isFacade(x, z);
  const top = r - 1;

  // Foundation from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  // Walls, base course, string courses, cornice and roof deck.
  for (let y = gr; y <= top; y++) {
    const k = y - gr;
    let id = "bricks";
    if (facade && k === 0) id = "stone_bricks";                        // base course
    if (k > 0 && k % 2 === 0 && y < top) id = facade ? "polished_andesite" : "bricks"; // storey lines
    if (y === top) id = facade ? "polished_andesite" : "smooth_stone";   // cornice / roof deck
    g.set(x, y, z, id);
  }

  // Parapet capping the perimeter.
  if (facade) g.set(x, r, z, "stone_bricks");
}

// Roof plant: a small mechanical box on the interior cells near the back.
for (const [x, z] of [[1, 6], [2, 6]]) {
  const c = map.get(`${x},${z}`);
  if (c) {
    g.set(x, c.r, z, "iron_block");
  }
}

// Pass 2: carve glazing, air gaps behind glass, entrance, shopfront and lights.
for (const [key, { gr, r }] of map) {
  const [x, z] = key.split(",").map(Number);
  if (!isFacade(x, z)) continue;
  const top = r - 1;

  for (let y = gr + 1; y <= top - 2; y++) {
    const k = y - gr;
    if (k % 2 === 0) continue; // window rows sit between string courses

    // Long side facades: glazed bays on odd z.
    if ((x === 0 || x === W - 1) && z >= 1 && z <= 7 && z % 2 === 1) {
      g.set(x, y, z, "glass_pane", paneNS);
      const ix = x === 0 ? 1 : W - 2;
      if ((z + k) % 4 === 0) g.set(ix, y, z, "glowstone");
      else g.set(ix, y, z, "air");
    }

    // Rear street end (z = D-1): windows across the two inner columns.
    if (z === D - 1 && (x === 1 || x === 2)) {
      g.set(x, y, z, "glass_pane", paneEW);
      const lit = (x + k) % 4 === 0;
      g.set(x, y, D - 2, lit ? "glowstone" : "air");
    }

    // Entrance end (z = 0): upper windows above the entrance zone.
    if (z === 0 && (x === 1 || x === 2) && k >= 3) {
      g.set(x, y, z, "glass_pane", paneEW);
      g.set(x, y, 1, "air");
    }
  }

  // Ground-floor entrance frame at z = 0.
  if (z === 0 && gr + 2 <= top) {
    // Pilasters flanking the entrance bay.
    if (x === 0 || x === W - 1) {
      g.set(x, gr + 1, z, "polished_andesite");
      g.set(x, gr + 2, z, "polished_andesite");
    }
    // Shopfront glass beside the door.
    if (x === 2) {
      g.set(x, gr + 1, z, "glass_pane", paneEW);
      g.set(x, gr + 2, z, "glass_pane", paneEW);
      g.set(x, gr + 1, 1, "air");
      g.set(x, gr + 2, 1, "air");
    }
    // Entrance door with a lobby behind.
    if (x === 1) {
      g.set(x, gr + 1, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 2, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      g.set(x, gr + 1, 1, "air");
      g.set(x, gr + 2, 1, "air");
    }
  }
}

g.save(`${DIR}/DC86597.nbt`);
