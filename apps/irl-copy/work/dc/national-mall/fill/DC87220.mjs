import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87220.cells.json`, "utf8"));

// Commercial-Office-Large, 730 15th St NW: 1960s-80s speculative office block,
// pale stone-clad facade, ribbon glazing with full-height stone mullions, plinth, cornice, parapet.
const W = 19, H = 32, D = 6;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(`${x},${z}`, { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => map.has(`${x},${z}`);
const isEdge = (x, z) => !has(x - 1, z) || !has(x + 1, z) || !has(x, z - 1) || !has(x, z + 1);
const isCorner = (x, z) => (x === 0 || x === W - 1) && (z === 0 || z === D - 1);

const GLASS_LONG = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_END = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Main massing: foundation, body, cornice, parapet, roof deck, equipment.
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const gr = Math.max(0, Math.min(H - 1, c.gr));
  // Smooth lidar roof into even tiers, minimum four blocks of body, max 30 so the parapet fits.
  const R = Math.min(30, Math.max(gr + 4, Math.round(c.rf / 2) * 2));
  const edge = isEdge(x, z);
  const corner = isCorner(x, z);
  const longFace = z === 0 || z === D - 1;
  const cw = longFace ? x : z; // coordinate along the wall, for mullion rhythm

  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "polished_andesite");

  // Body
  for (let y = gr; y < R; y++) {
    const rel = y - gr;
    const s = Math.floor(rel / 2);
    const within = rel % 2;

    // Cornice / roof deck
    if (y === R - 1) {
      put(x, y, z, edge ? "polished_andesite" : "light_gray_concrete");
      continue;
    }

    // Interior: air gap with a floor slab per storey, no interior fit-out
    if (!edge) {
      if (within === 0) put(x, y, z, "smooth_quartz");
      continue;
    }

    // Facade corners run full height
    if (corner) {
      put(x, y, z, "polished_andesite");
      continue;
    }

    if (rel === 0) {
      // Base course / plinth
      put(x, y, z, "polished_andesite");
      continue;
    }

    // Full-height stone mullion columns give the facade its vertical grid
    if (cw % 3 === 0) {
      put(x, y, z, "polished_andesite");
      continue;
    }

    if (within === 0) {
      // Spandrel band at each floor line
      put(x, y, z, "smooth_quartz");
      continue;
    }

    // Window row: sparse warm light behind glass, otherwise glass panes
    if (((cw * 5 + s * 3) % 13) === 0) {
      put(x, y, z, "shroomlight");
    } else {
      put(x, y, z, "glass_pane", longFace ? GLASS_LONG : GLASS_END);
    }
  }

  // Parapet and roof equipment
  if (edge) {
    put(x, R, z, corner ? "polished_andesite" : "smooth_quartz");
  } else if (x % 5 === 2 && z === 2) {
    put(x, R, z, "iron_block"); // rooftop HVAC unit
  }
}

// Entrance on the street face (z = 0), centred on the frontage
if (has(9, 0)) {
  const gr = map.get("9,0").gr;
  // Stone surround so the recessed door reads at street level
  put(8, gr, 0, "polished_andesite");
  put(10, gr, 0, "polished_andesite");
  put(8, gr + 1, 0, "polished_andesite");
  put(10, gr + 1, 0, "polished_andesite");
  put(9, gr, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(9, gr + 1, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Lintel and small stone canopy over the door
  put(8, gr + 2, 0, "smooth_stone");
  put(9, gr + 2, 0, "smooth_stone");
  put(10, gr + 2, 0, "smooth_stone");
  // Warm lanterns flanking the entrance
  for (const lx of [7, 11]) {
    if (has(lx, 0)) put(lx, map.get(`${lx},0`).gr + 1, 0, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/DC87220.nbt`);
