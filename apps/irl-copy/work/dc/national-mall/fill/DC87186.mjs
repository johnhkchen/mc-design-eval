import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87186.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill/DC87186.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 5, H = 19, D = 12;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const inside = new Set(cells.map(([x, z]) => key(x, z)));
const groundOf = new Map();
const roofOf = new Map();
for (const [x, z, gr, rf] of cells) {
  groundOf.set(key(x, z), gr);
  roofOf.set(key(x, z), rf);
}

const safe = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const isEdge = (x, z, dx, dz) => !inside.has(key(x + dx, z + dz));
const minZ = Math.min(...cells.map(c => c[1]));
const minX = Math.min(...cells.map(c => c[0]));
const maxX = Math.max(...cells.map(c => c[0]));
const midX = (minX + maxX) / 2;
const ex = Math.round(midX);
const lowest = Math.min(...cells.map(c => c[2]));

for (const [x, z, ground, roofRaw] of cells) {
  const roof = roofRaw ?? (lowest + 7);
  const eaves = Math.max(ground + 4, roof - 3);

  // Foundation
  for (let y = 0; y < ground; y++) safe(x, y, z, "stone_bricks");

  const isEntranceCell = z === minZ && x === ex;
  const onWall = isEdge(x, z, -1, 0) || isEdge(x, z, 1, 0) || isEdge(x, z, 0, -1) || isEdge(x, z, 0, 1);
  const sideWall = isEdge(x, z, -1, 0) || isEdge(x, z, 1, 0);
  const endWall = isEdge(x, z, 0, 1) && z !== minZ;

  // Floor and base course
  if (onWall) {
    safe(x, ground, z, "stone_bricks");
  } else {
    safe(x, ground, z, "smooth_stone");
  }

  if (onWall) {
    // Brick walls with stone trim
    const pilaster = sideWall && (z % 4 === 0);
    for (let y = ground + 1; y < eaves; y++) {
      safe(x, y, z, pilaster ? "stone_bricks" : "bricks");
    }
    // Cornice course under the eave
    safe(x, eaves - 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
    // Stone string course at the storey line
    if (eaves - 3 > ground + 1) {
      safe(x, ground + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  } else {
    for (let y = ground + 1; y < eaves; y++) safe(x, y, z, "air");
  }

  // Gabled roof: ridge along z, solid core, outward stairs on slopes
  const d = Math.abs(x - midX);
  const ridgeOffset = Math.round(2 - d);
  const ytop = eaves + 1 + Math.max(0, Math.min(2, ridgeOffset));
  for (let y = eaves; y < ytop; y++) safe(x, y, z, "deepslate_tiles");
  if (x < midX) {
    safe(x, ytop, z, "deepslate_tile_stairs", { facing: "west", half: "bottom", shape: "straight", waterlogged: "false" });
  } else if (x > midX) {
    safe(x, ytop, z, "deepslate_tile_stairs", { facing: "east", half: "bottom", shape: "straight", waterlogged: "false" });
  } else {
    safe(x, ytop, z, "deepslate_tiles");
    // Ridge cap sitting on the solid top block
    safe(x, ytop + 1, z, "deepslate_tile_slab", { type: "bottom", waterlogged: "false" });
  }

  // Windows: glazed bays with stone sills and lintels
  if ((sideWall || endWall) && !isEntranceCell) {
    const bay = sideWall ? (z % 3 === 1 && z % 4 !== 0) : (x % 2 === 1);
    if (bay && ground + 3 < eaves - 1) {
      const pane = sideWall
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      safe(x, ground + 2, z, "glass_pane", pane);
      safe(x, ground + 3, z, "glass_pane", pane);
      // Stone sill below, stone lintel above
      safe(x, ground + 1, z, "stone_brick_slab", { type: "top", waterlogged: "false" });
      safe(x, ground + 4 <= eaves - 1 ? ground + 4 : eaves - 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
      // Warm glow behind some windows
      if ((z + x) % 2 === 0 && sideWall) {
        const ix = isEdge(x, z, -1, 0) ? x + 1 : x - 1;
        if (inside.has(key(ix, z))) safe(ix, ground + 2, z, "shroomlight");
      }
    }
  }
}

// Entrance on the street wall: stone jambs, lintel, double-height door, lanterns
const groundE = groundOf.get(key(ex, minZ)) ?? lowest;
const roofE = roofOf.get(key(ex, minZ)) ?? lowest + 7;
const eavesE = Math.max(groundE + 4, roofE - 3);
for (const dx of [-1, 1]) {
  if (inside.has(key(ex + dx, minZ))) {
    safe(ex + dx, groundE + 1, minZ, "stone_bricks");
    safe(ex + dx, groundE + 2, minZ, "stone_bricks");
  }
}
safe(ex, groundE + 1, minZ, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
safe(ex, groundE + 2, minZ, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
// Stone lintel over the door
if (groundE + 3 < eavesE) {
  for (const dx of [-1, 0, 1]) {
    if (inside.has(key(ex + dx, minZ))) {
      safe(ex + dx, groundE + 3, minZ, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
    }
  }
}
// Lanterns flanking the door, hanging from the lintel level
for (const dx of [-1, 1]) {
  if (inside.has(key(ex + dx, minZ + 1))) {
    safe(ex + dx, groundE + 1, minZ + 1, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// Belfry cross standing on the front ridge, supported by the roof
const frontYtop = eavesE + 3;
const crossBase = frontYtop + 2; // on top of the ridge cap slab
safe(ex, crossBase, minZ, "oak_fence");
safe(ex, crossBase + 1, minZ, "oak_fence");
safe(ex, crossBase + 2, minZ, "oak_fence");
safe(ex - 1, crossBase + 1, minZ, "oak_fence");
safe(ex + 1, crossBase + 1, minZ, "oak_fence");

g.save(OUT);
