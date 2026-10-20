import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Footprint 84 x 48. Roof about 11 blocks above lowest ground.
// Read as a two-storey, early-1990s Taipei commercial block: granite base course,
// white-tiled concrete frame with quartz mullions, aluminium-look pane windows,
// stone cornice and parapet, a shopfront ground floor with a central entrance
// and canopy, and a flat roof with plant housing.
const W = 84, H = 23, D = 48;
const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834857.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill/OSMw662834857.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Number.isFinite(c[2]) ? c[2] : 0;
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr))));
}

const inside = (x, z) => ground.has(`${x},${z}`);
const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Outward face of a footprint cell (null if interior).
function outward(x, z) {
  if (!inside(x, z - 1)) return "north";
  if (!inside(x, z + 1)) return "south";
  if (!inside(x + 1, z)) return "east";
  if (!inside(x - 1, z)) return "west";
  return null;
}
const INWARD = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };
const FACE_DOOR_X = [Math.floor(W / 2) - 1, Math.floor(W / 2)];

// Pane connection props: panes run along the facade.
function paneProps(face) {
  const ew = face === "north" || face === "south";
  return {
    north: ew ? "false" : "true",
    south: ew ? "false" : "true",
    east: ew ? "true" : "false",
    west: ew ? "true" : "false",
    waterlogged: "false",
  };
}

const PANE = "light_blue_stained_glass_pane";
const DOOR = "oak_door";

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const face = outward(x, z);
  const ring = face !== null;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!ring) {
    // Interior: storey floor slab, air gap, roof deck, and roof plant.
    if (gr <= 5) put(x, 5, z, "smooth_quartz");
    if (gr <= 10) put(x, 10, z, "light_gray_concrete");
    if (x % 16 >= 6 && x % 16 <= 9 && z % 16 >= 6 && z % 16 <= 9 && gr <= 10) {
      put(x, 11, z, "iron_block");
    }
    continue;
  }

  const along = (face === "north" || face === "south") ? x : z;
  const bay = along % 6;
  const isDoorCol = face === "north" && FACE_DOOR_X.includes(along);
  const isCanopyCol = face === "north" && along >= FACE_DOOR_X[0] - 2 && along <= FACE_DOOR_X[1] + 2;
  const [ix, iz] = INWARD[face];
  const inwardInside = inside(x + ix, z + iz);

  // Interior lights behind glass.
  if (inwardInside) {
    if (along % 12 === 3 && 7 >= gr) put(x + ix, 7, z + iz, "glowstone");
    if (along % 12 === 9 && gr <= 3) put(x + ix, gr, z + iz, "lantern", { hanging: "false", waterlogged: "false" });
  }

  for (let y = gr; y <= 11; y++) {
    if (y === gr) {
      // Granite base course; doors stand on it.
      if (isDoorCol && (along === FACE_DOOR_X[0] || along === FACE_DOOR_X[1])) {
        // handled below
      } else {
        put(x, y, z, "stone_bricks");
      }
      continue;
    }
    if (y === 5) { put(x, y, z, "smooth_quartz"); continue; }      // storey string course
    if (y === 9) { put(x, y, z, "white_concrete"); continue; }     // upper spandrel
    if (y === 10) { put(x, y, z, "stone_bricks"); continue; }      // cornice
    if (y === 11) {                                                 // parapet
      const ew = face === "north" || face === "south";
      put(x, y, z, "stone_brick_wall", {
        up: "true",
        north: ew ? "none" : "low",
        south: ew ? "none" : "low",
        east: ew ? "low" : "none",
        west: ew ? "low" : "none",
        waterlogged: "false",
      });
      continue;
    }

    // Canopy band over the entrance.
    if (isCanopyCol && y === gr + 2) {
      put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
      continue;
    }

    // Doors (two blocks high) on the central entrance.
    if (isDoorCol && (along === FACE_DOOR_X[0] || along === FACE_DOOR_X[1]) && (y === gr + 1 || y === gr)) {
      const hinge = along === FACE_DOOR_X[0] ? "left" : "right";
      put(x, y, z, DOOR, {
        facing: face,
        half: y === gr ? "lower" : "upper",
        hinge,
        open: "false",
        powered: "false",
      });
      continue;
    }

    if (bay === 0) { put(x, y, z, "quartz_pillar", { axis: "y" }); continue; } // mullion
    if (y > gr && (y < 5 || (y > 5 && y < 9))) {
      put(x, y, z, PANE, paneProps(face));                                      // glazing
      continue;
    }
    put(x, y, z, "white_concrete");
  }

  // Top deck over ring cells is the cornice; interior roof deck handled above.
}

// Roof deck over interior cells, already placed. Ensure a level deck over ring
// cells too so the roof reads closed from the air.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (gr <= 10 && outward(x, z) !== null) put(x, 10, z, "stone_bricks");
}

g.save(OUT);
