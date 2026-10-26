import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// DC86654 - 1100 17th St NW (Commercial-Office-Large)
// Mid-century/1970s-80s office block: light stone-clad frame, ribbon glass,
// granite base, quartz spandrels, cornice ring, recessed entrance with canopy,
// roof plant penthouse. ~18 blocks tall.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86654";
const W = 14, H = 30, D = 17;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  map.set(key(x, z), { g: Math.round(gr), r: Math.round(rf) });
}

// Smooth lidar noise: snap roofs within 2 blocks of the median to one flat tier.
const roofs = cells.map((c) => Math.round(c[3])).sort((a, b) => a - b);
const median = roofs[Math.floor(roofs.length / 2)];
for (const c of map.values()) {
  if (Math.abs(c.r - median) <= 2) c.r = median;
  c.r = Math.min(Math.max(c.r, c.g + 5), H - 4);
}

const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
const isEdge = (x, z) => DIRS.some(([dx, dz]) => !map.has(key(x + dx, z + dz)));

// Front = street side: the edge row with the smallest z; entrance sits nearest the centre.
const cx = Math.floor(W / 2);
let frontZ = Infinity;
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z) && z < frontZ) frontZ = z;
}
let frontX = null;
for (const [k] of map) {
  const [x, z] = k.split(",").map(Number);
  if (z === frontZ && isEdge(x, z)) {
    if (frontX === null || Math.abs(x - cx) < Math.abs(frontX - cx)) frontX = x;
  }
}
const frontCell = frontX !== null ? map.get(key(frontX, frontZ)) : null;

// Entrance canopy: a granite lintel band across the door bay, one row above the door.
const isCanopyCell = (x, z) =>
  frontX !== null && z === frontZ && Math.abs(x - frontX) <= 1 && map.has(key(x, z)) && isEdge(x, z);

// Pass 1: foundation, base course, facade, roof deck, floor slabs.
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  const edge = isEdge(x, z);

  for (let y = 0; y < c.g; y++) g.set(x, y, z, "stone");

  const top = c.r - 1;
  for (let y = c.g; y < c.r; y++) {
    const rel = y - c.g;
    let id = null;

    if (y === top) {
      id = edge ? "smooth_quartz" : "stone_bricks"; // parapet cap / roof deck
    } else if (rel === 0) {
      id = edge ? "polished_granite" : "smooth_stone"; // base course / floor slab
    } else if (edge) {
      if (rel <= 2) {
        // Ground-floor shopfront band
        if (z === frontZ && x === frontX) {
          if (rel === 1) {
            g.set(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
            continue;
          }
          if (rel === 2) {
            g.set(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
            continue;
          }
        }
        // Granite posts flank the entrance; lanterns sit on them at rel 2.
        if (isCanopyCell(x, z) && Math.abs(x - frontX) === 1) {
          if (rel === 1) { g.set(x, y, z, "polished_granite"); continue; }
          if (rel === 2) { g.set(x, y, z, "lantern", { hanging: "false", waterlogged: "false" }); continue; }
        }
        id = (x + z) % 2 === 0 ? "polished_granite" : "light_blue_stained_glass_pane";
      } else if ((rel - 3) % 2 === 0) {
        // Frieze / spandrel course; the canopy lintel reads as granite over the door bay
        id = isCanopyCell(x, z) && rel === 3 ? "polished_granite" : "smooth_quartz";
      } else {
        // Window row: mullions alternate with glass
        id = (x + z) % 2 === 0 ? "light_gray_concrete" : "light_blue_stained_glass_pane";
      }
    } else {
      // Interior: only floor slabs at storey lines, otherwise air
      if (rel >= 3 && (rel - 3) % 2 === 0) id = "smooth_stone";
    }

    if (id) g.set(x, y, z, id);
  }
}

// Pass 2: cornice ring. A projecting stone-slab band one row below the roof cap on
// edge cells, so the parapet reads as a finished top rather than a flat stripe.
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  const top = c.r - 1;
  if (top - 1 >= c.g + 1) {
    g.set(x, top - 1, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Pass 3: warm light behind some lit window panes (glowstone inside, one cell in).
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  if (!isEdge(x, z)) continue;
  for (let y = c.g + 4; y < c.r - 1; y += 2) {
    const rel = y - c.g;
    if ((rel - 3) % 2 !== 1) continue;
    if ((x + z) % 2 === 0) continue;
    if ((x * 5 + z * 3 + y) % 9 !== 0) continue;
    for (const [dx, dz] of DIRS) {
      const nx = x + dx, nz = z + dz;
      const nb = map.get(key(nx, nz));
      if (!nb || isEdge(nx, nz)) continue;
      if (y > nb.g && y < nb.r - 1) {
        g.set(nx, y, nz, "glowstone");
        break;
      }
    }
  }
}

// Pass 4: roof plant penthouse on the interior roof, set back from the parapet.
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x < 4 || x > 9 || z < 5 || z > 11) continue;
  if (c.r + 2 > H) continue;
  g.set(x, c.r, z, "light_gray_concrete");
  g.set(x, c.r + 1, z, "light_gray_concrete");
}

// Roof-top plant: a vent stack on the penthouse.
for (const [k, c] of map) {
  const [x, z] = k.split(",").map(Number);
  if (isEdge(x, z)) continue;
  if (x === 6 && z === 8 && c.r + 2 <= H - 1) {
    g.set(x, c.r + 2, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
