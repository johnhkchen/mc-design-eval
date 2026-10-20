import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001569.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3001569.nbt";

const W = 7, H = 23, D = 12;
const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const g = new Voxels([W, H, D]);

const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { g: gr, r: roof });
const has = (x, z) => map.has(`${x},${z}`);

function edge(x, z) {
  const missX = !has(x - 1, z) || !has(x + 1, z);
  const missZ = !has(x, z - 1) || !has(x, z + 1);
  return {
    perim: missX || missZ,
    corner: missX && missZ,
    xFacade: missX && !missZ,
    zFacade: missZ && !missX,
  };
}

function put(x, y, z, id, props) {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
}

// One flat roof tier for the whole building: median lidar roof, rounded to an even
// storey line, and never lower than four blocks above the highest ground.
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const medianRoof = roofs[Math.floor(roofs.length / 2)];
const maxGround = Math.max(...cells.map(c => c[2]));
const TOP = Math.min(21, Math.max(maxGround + 4, Math.round(medianRoof / 2) * 2));

// Front door: street-facing wall at max z, nearest to x = 3
let maxZ = -1;
for (const c of cells) maxZ = Math.max(maxZ, c[1]);
let door = null;
for (const c of cells) {
  const [x, z] = c;
  if (z !== maxZ) continue;
  const e = edge(x, z);
  if (!e.zFacade) continue;
  if (!door || Math.abs(x - 3) < Math.abs(door.x - 3)) door = { x, z };
}

for (const [x, z, gr] of cells) {
  const e = edge(x, z);

  // Foundation
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let y = gr; y <= TOP - 1; y++) {
    if (!e.perim) {
      if (y === gr) put(x, y, z, "stone_bricks");
      else if (y === TOP - 1) put(x, y, z, "smooth_stone");
      else if (y % 2 === 0) put(x, y, z, "oak_planks");
      continue;
    }
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }      // base course
    if (y === TOP - 1) { put(x, y, z, "stone_bricks"); continue; } // cornice
    if (y % 4 === 0) { put(x, y, z, "stone_bricks"); continue; }   // storey belt
    if (e.corner) { put(x, y, z, "bricks"); continue; }            // pilaster
    if (y % 2 === 0) { put(x, y, z, "bricks"); continue; }         // brick course
    const along = e.xFacade ? z : x;
    if (along % 2 === 1) {
      const props = e.xFacade
        ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
        : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
      put(x, y, z, "glass_pane", props);
    } else {
      put(x, y, z, "bricks");
    }
  }

  // Parapet on the exterior edge
  if (e.perim && TOP <= 21) {
    put(x, TOP, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  }
}

// Warm lights behind some windows
for (const [x, z, gr] of cells) {
  const e = edge(x, z);
  if (!e.perim || e.corner) continue;
  const along = e.xFacade ? z : x;
  if (along % 2 !== 1) continue;
  for (let y = gr + 1; y <= TOP - 3; y += 2) {
    if ((x + z + y) % 4 !== 0) continue;
    let ix = x, iz = z;
    if (e.xFacade) ix = x === 0 ? 1 : x - 1;
    else iz = z === 0 ? 1 : z - 1;
    if (!has(ix, iz)) continue;
    if (edge(ix, iz).perim) continue;
    put(ix, y, iz, "shroomlight");
  }
}

// Entrance: stone jambs and lintel framing a two-high oak door
if (door) {
  const gr = map.get(`${door.x},${door.z}`).g;
  for (const jx of [door.x - 1, door.x + 1]) {
    if (!has(jx, door.z)) continue;
    put(jx, gr, door.z, "stone_bricks");
    put(jx, gr + 1, door.z, "stone_bricks");
    put(jx, gr + 2, door.z, "stone_bricks");
  }
  put(door.x, gr + 2, door.z, "stone_bricks");
  put(door.x, gr, door.z, "oak_door", {
    facing: "south", half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, gr + 1, door.z, "oak_door", {
    facing: "south", half: "upper", hinge: "left", open: "false", powered: "false",
  });
}

g.save(OUT);
