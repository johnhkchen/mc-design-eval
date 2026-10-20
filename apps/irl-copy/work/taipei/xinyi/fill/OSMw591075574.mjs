import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw591075574";
const W = 7, H = 20, D = 17;

// Record-driven massing: no record, so a low 1990s Taiwanese mid-rise commercial block.
// Two storeys (ground shopfront + upper floor), tiled white facade, tinted glass,
// parapet roof with rooftop plant. Roof slab at y=8 (lidar: ~8 above lowest ground).
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const ground = new Map();
for (const [x, z, gr] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(12, Math.round(gr))));
}

const inFp = (x, z) => ground.has(`${x},${z}`);
const isPerim = (x, z) =>
  !inFp(x - 1, z) || !inFp(x + 1, z) || !inFp(x, z - 1) || !inFp(x, z + 1);
const isEdgeX = (x) => x === 0 || x === W - 1;
const isEdgeZ = (z) => z === 0 || z === D - 1;

const g = new Voxels([W, H, D]);

// Pane with connection states derived from neighbouring perimeter cells.
function pane(x, y, z) {
  const conn = (dx, dz) => (inFp(x + dx, z + dz) && isPerim(x + dx, z + dz) ? "true" : "false");
  g.set(x, y, z, "cyan_stained_glass_pane", {
    north: conn(0, -1),
    south: conn(0, 1),
    east: conn(1, 0),
    west: conn(-1, 0),
    waterlogged: "false",
  });
}

function groundFacade(x, y, z, gr) {
  const front = z === 0;
  const corner = isEdgeX(x) && isEdgeZ(z);

  if (front) {
    // Shopfront: piers at the two front corners, fascia band at top of ground floor.
    if (y === 3) { g.set(x, y, z, "white_concrete"); return; }
    if (isEdgeX(x)) { g.set(x, y, z, "white_concrete"); return; }
    if (x === 3 && gr + 2 <= 3 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      g.set(x, y, z, "dark_oak_door", {
        facing: "north",
        half,
        hinge: "left",
        open: "false",
        powered: "false",
      });
      return;
    }
    g.set(x, y, z, "glass");
    return;
  }

  // Sides and back: base course, then windows with piers every 3 blocks.
  if (y === gr + 1) { g.set(x, y, z, "stone_bricks"); return; }
  const idx = isEdgeX(x) ? z : x;
  if (corner || idx % 3 === 0) { g.set(x, y, z, "white_concrete"); return; }
  pane(x, y, z);
}

function upperFacade(x, y, z) {
  const corner = isEdgeX(x) && isEdgeZ(z);
  const idx = isEdgeX(x) ? z : x;
  if (corner || idx % 3 === 0) { g.set(x, y, z, "white_concrete"); return; }
  pane(x, y, z);
}

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const p = isPerim(x, z);

  // Foundation from y=0 up to this cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");
  // Floor slab at this cell's ground.
  g.set(x, gr, z, p ? "stone_bricks" : "smooth_stone");

  for (let y = gr + 1; y <= 7; y++) {
    // Storey line / floor slab between the two storeys.
    if (y === 4) {
      g.set(x, y, z, p ? "light_gray_concrete" : "light_gray_concrete");
      continue;
    }
    if (!p) continue; // interior stays air behind the glass
    if (y <= 3) groundFacade(x, y, z, gr);
    else upperFacade(x, y, z);
  }

  if (gr < 8) {
    // Roof slab at y=8: cornice on the perimeter, plain roof inside.
    g.set(x, 8, z, p ? "white_concrete" : "light_gray_concrete");
    if (p) g.set(x, 9, z, "white_concrete"); // parapet
  }
}

// Warm lights behind the upper-floor glass on the west and east sides.
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  if (isPerim(x, z) || gr >= 6) continue;
  if ((x === 1 || x === W - 2) && z % 6 === 3) g.set(x, 6, z, "shroomlight");
}

// Warm lantern hanging inside the shopfront bay.
if (inFp(3, 1) && !isPerim(3, 1) && (ground.get("3,1") ?? 9) < 3) {
  g.set(3, 3, 1, "lantern", { hanging: "true", waterlogged: "false" });
}

// Rooftop plant box on the roof, standing on the roof slab.
for (let x = 2; x <= 4; x++) {
  for (let z = 6; z <= 9; z++) {
    if (!inFp(x, z) || isPerim(x, z)) continue;
    const gr = ground.get(`${x},${z}`);
    if (gr >= 8) continue;
    g.set(x, 9, z, "light_gray_concrete");
    g.set(x, 10, z, "light_gray_concrete");
  }
}

g.save(`${DIR}/${ID}.nbt`);
