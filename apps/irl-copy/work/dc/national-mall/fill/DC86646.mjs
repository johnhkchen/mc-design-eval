import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC86646.cells.json`, "utf8"));

const W = 13, H = 30, D = 10;
const g = new Voxels([W, H, D]);

// Footprint lookup. Lidar roof heights are quantised to whole storeys (3 blocks)
// so the skyline reads as clean tiers instead of noise.
const cm = new Map();
for (const [x, z, gr, roof] of cells) {
  const ground = Math.max(0, Math.round(gr));
  let top = Math.round(Math.round(roof) / 3) * 3;
  top = Math.max(top, ground + 6);
  top = Math.min(top, H - 4);
  cm.set(`${x},${z}`, { gr: ground, roof: top });
}
const has = (x, z) => cm.has(`${x},${z}`);

const SLAB_BOTTOM = { type: "bottom", waterlogged: "false" };
const DOOR_LOWER = { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" };
const DOOR_UPPER = { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };

// Pass 1: foundation and solid core up to each cell's roof.
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  for (let y = 0; y < c.roof; y++) {
    g.set(x, y, z, y < c.gr ? "stone" : "light_gray_concrete");
  }
}

// Facade block choice for one exposed face at height y.
const facadeBlock = (y, u, c, face) => {
  const { gr, roof } = c;
  if (y === roof) return ["stone_brick_slab", SLAB_BOTTOM];           // parapet cap
  if (y === roof - 1) return ["stone_bricks", undefined];             // cornice
  if (y === gr) return ["polished_granite", undefined];               // base course

  if (y < gr + 3) {                                                   // ground-floor commercial zone
    const entry = face === "north" && (u === 5 || u === 6 || u === 7);
    if (entry) {
      if (u === 6 && y === gr + 1) return ["oak_door", DOOR_LOWER];
      if (u === 6 && y === gr + 2) return ["oak_door", DOOR_UPPER];
      return ["stone_bricks", undefined];                              // entrance surround
    }
    if (u % 4 === 0) return ["polished_andesite", undefined];         // shopfront piers
    return ["tinted_glass", undefined];
  }

  if (y % 3 === 0) return ["light_gray_concrete", undefined];         // storey floor line
  if (u % 3 === 0) return ["light_gray_concrete", undefined];         // window pier
  return ["gray_stained_glass_pane", undefined];                      // office glazing
};

const inwardOf = (face, x, z, d) => {
  if (face === "north") return [x, z + d];
  if (face === "south") return [x, z - d];
  if (face === "west") return [x + d, z];
  return [x - d, z];
};

// A cell is interior if all four neighbours are footprint cells.
const isInterior = (x, z) => has(x, z - 1) && has(x, z + 1) && has(x - 1, z) && has(x + 1, z);

const airGaps = [];
const lights = [];

// Pass 2: facades on exposed faces, record air gaps and warm lights behind glass.
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  const faces = [];
  if (!has(x, z - 1)) faces.push("north");
  if (!has(x, z + 1)) faces.push("south");
  if (!has(x - 1, z)) faces.push("west");
  if (!has(x + 1, z)) faces.push("east");
  if (faces.length === 0) continue;
  const face = faces[0];
  const u = face === "north" || face === "south" ? x : z;

  for (let y = c.gr; y <= c.roof; y++) {
    const [id, props] = facadeBlock(y, u, c, face);
    g.set(x, y, z, id, props);

    if (id === "gray_stained_glass_pane" || (id === "oak_door" && y === c.gr + 1)) {
      // Air gap one block behind the glazing, only where the cell behind is interior.
      const [ix, iz] = inwardOf(face, x, z, 1);
      if (has(ix, iz) && isInterior(ix, iz) && y < c.roof - 1) airGaps.push([ix, y, iz]);
    }
    if (id === "gray_stained_glass_pane" && y > c.gr + 2) {
      // Sparse warm lights, two blocks behind the glass, only in interior cells.
      const [lx, lz] = inwardOf(face, x, z, 2);
      if (has(lx, lz) && isInterior(lx, lz) && (u * 7 + y * 5 + x + z) % 13 === 0) {
        lights.push([lx, y, lz]);
      }
    }
  }

  // Entrance vestibule: air behind the door, warm light just inside.
  if (face === "north" && u === 6 && c.gr === cm.get(`${x},${z}`).gr) {
    const [ix, iz] = inwardOf(face, x, z, 1);
    if (has(ix, iz) && isInterior(ix, iz)) {
      airGaps.push([ix, c.gr + 1, iz], [ix, c.gr + 2, iz]);
      const [lx, lz] = inwardOf(face, x, z, 2);
      if (has(lx, lz)) lights.push([lx, c.gr + 1, lz]);
    }
  }
}

for (const [x, y, z] of airGaps) g.set(x, y, z, "air");
for (const [x, y, z] of lights) g.set(x, y, z, "glowstone");

// Pass 3: roof plant on a few interior cells, standing on the roof surface.
for (const [key, c] of cm) {
  const [x, z] = key.split(",").map(Number);
  if (!isInterior(x, z)) continue;
  if ((x * 3 + z) % 7 === 0 && c.roof + 2 < H) {
    g.set(x, c.roof, z, "light_gray_concrete");
    g.set(x, c.roof + 1, z, "smooth_stone_slab", SLAB_BOTTOM);
  }
}

g.save(`${DIR}/DC86646.nbt`);
