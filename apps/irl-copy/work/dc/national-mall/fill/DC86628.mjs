import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86628.cells.json`, "utf8"));

// 1602 L St NW: 1980s-era downtown office, five storeys of tinted glazing between
// granite base, light concrete spandrels and a stone cornice and parapet.
const W = 13, H = 27, D = 4;
const g = new Voxels([W, H, D]);

const put = (x, y, z, b, p) => {
  if (y < 0 || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

// Smooth the lidar roof into one flat tier: median of the footprint roofs,
// clamped so roof plant still fits inside the 27-block volume.
const roofs = cells.map(([, , , r]) => Math.round(r)).sort((a, b) => a - b);
const ROOF = Math.min(roofs[Math.floor(roofs.length / 2)], H - 4);

for (const [x, z, groundRaw] of cells) {
  const ground = Math.round(groundRaw);
  const roof = ROOF;
  const edge = z === 0 || z === 3 || x === 0 || x === 12;

  // Foundation / plinth up to this cell's ground.
  for (let y = 0; y < ground; y++) put(x, y, z, "stone_bricks");

  for (let y = ground; y < roof; y++) {
    const dy = y - ground;

    // Top deck course: granite cornice on the facade, slab inside.
    if (y === roof - 1) {
      put(x, y, z, edge ? "polished_granite" : "smooth_stone");
      continue;
    }
    // Base course / ground floor slab.
    if (dy === 0) {
      put(x, y, z, edge ? "polished_granite" : "smooth_stone");
      continue;
    }
    // Floor lines and spandrels every third course.
    if (dy % 3 === 0) {
      put(x, y, z, edge ? "light_gray_concrete" : "smooth_stone");
      continue;
    }
    // Interior: open air gap behind the glazing.
    if (!edge) continue;

    // Facade window band.
    if (x % 3 === 0) {
      put(x, y, z, "light_gray_concrete"); // mullion / pier
    } else if ((x + z + dy) % 9 === 4) {
      put(x, y, z, "yellow_stained_glass"); // warm-lit office behind tinted glass
    } else {
      put(x, y, z, "gray_stained_glass_pane");
    }
  }

  // Parapet on the perimeter.
  if (edge) put(x, roof, z, "stone_brick_wall");
}

// Lobby entrance on the north (z = 0) face, centre bay.
const doorGround = cells.find(([x, z]) => x === 6 && z === 0);
if (doorGround) {
  const gr = Math.round(doorGround[2]);
  put(6, gr + 1, 0, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(6, gr + 2, 0, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Stone lintel above the door, flanked by hanging lanterns.
  put(6, gr + 3, 0, "stone_brick_slab", { type: "top", waterlogged: "false" });
  put(5, gr + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
  put(7, gr + 3, 0, "lantern", { hanging: "true", waterlogged: "false" });
}

// Roof plant: a modest mechanical penthouse on the interior of the flat deck.
for (const [x, z] of cells) {
  if (x >= 4 && x <= 8 && (z === 1 || z === 2)) {
    put(x, ROOF, z, "light_gray_concrete");
    put(x, ROOF + 1, z, "iron_bars");
  }
}

g.save(`${DIR}/DC86628.nbt`);
