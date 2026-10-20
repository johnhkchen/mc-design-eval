import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw456299351";
const W = 14, H = 23, D = 67;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

// ground lookup for footprint cells
const ground = new Map();
for (const [x, z, gr] of cells) ground.set(`${x},${z}`, gr);
const has = (x, z) => ground.has(`${x},${z}`);

const SET = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// exterior face of an edge cell: w/e/n/s, or null for interior cells
function faceOf(x, z) {
  if (!has(x - 1, z)) return "w";
  if (!has(x + 1, z)) return "e";
  if (!has(x, z - 1)) return "n";
  if (!has(x, z + 1)) return "s";
  return null;
}

// pane connections so a run of panes reads as one continuous window band
function paneProps(face) {
  if (face === "w" || face === "e")
    return { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
  return { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" };
}

// inward neighbour for placing interior light behind glass
function inward(face, x, z) {
  if (face === "w") return [x + 1, z];
  if (face === "e") return [x - 1, z];
  if (face === "n") return [x, z + 1];
  return [x, z - 1];
}

const lights = [];

// Facade material for an edge cell at height y.
// Bands (absolute, lowest ground = 0): ground floor gr..4, storey line 5,
// upper storey 6..9 (sill 6, head 9), cornice/parapet at top.
function facade(face, x, z, y, gr) {
  const u = (face === "w" || face === "e") ? z : x;
  const bay = ((u % 4) + 4) % 4;
  const pier = bay === 0;

  if (y === gr) return { block: "stone_bricks" };          // base course
  if (y === 5) return { block: "light_gray_concrete" };    // storey line

  if (y < 5) {
    // ground floor: commercial shopfront
    if (face === "w" && u === 33 && gr + 2 < 5 && (y === gr + 1 || y === gr + 2)) {
      const half = y === gr + 1 ? "lower" : "upper";
      return {
        block: "oak_door",
        props: { facing: "west", half, hinge: "left", open: "false", powered: "false" },
      };
    }
    if (pier) return { block: "white_concrete" };
    if (y === 4) return { block: "light_gray_concrete" };  // lintel
    if (bay === 2 && y === gr + 1) {
      const [ix, iz] = inward(face, x, z);
      lights.push({ x: ix, y, z: iz, block: "glowstone" });
    }
    return { block: "glass_pane", props: paneProps(face) };
  }

  // upper storey
  if (pier) return { block: "white_concrete" };
  if (y === 6 || y === 9) return { block: "light_gray_concrete" };
  if (y === 7 && u % 12 === 2) {
    const [ix, iz] = inward(face, x, z);
    lights.push({ x: ix, y, z: iz, block: "shroomlight" });
  }
  return { block: "glass_pane", props: paneProps(face) };
}

// ---- main pass over footprint cells ----
for (const [x, z, gr0] of cells) {
  const gr = Math.max(0, Math.round(gr0));
  const topY = Math.max(10, gr);

  // foundation fill from y 0 up to the cell's ground
  for (let y = 0; y < gr; y++) SET(x, y, z, "stone_bricks");

  const face = faceOf(x, z);
  const edge = face !== null;

  for (let y = gr; y <= topY; y++) {
    if (y === topY) {
      // roof: parapet on the edge, flat gravel-grey roof inside
      SET(x, y, z, edge ? "smooth_quartz" : "gray_concrete");
      continue;
    }
    if (!edge) {
      // interior: a floor slab per storey, air elsewhere
      if (y === gr || y === 5) SET(x, y, z, "light_gray_concrete");
      continue;
    }
    const b = facade(face, x, z, y, gr);
    SET(x, y, z, b.block, b.props);
  }

  // roof equipment on a few interior cells
  if (!edge && (x === 4 || x === 9) && z % 12 === 6) {
    SET(x, topY + 1, z, "iron_block");
    if (x === 4) SET(x, topY + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

// ---- interior lights behind glass (after floors are placed) ----
for (const l of lights) {
  if (!has(l.x, l.z)) continue;
  const gr = Math.max(0, Math.round(ground.get(`${l.x},${l.z}`)));
  const topY = Math.max(10, gr);
  if (l.y === gr || l.y === 5 || l.y === topY) continue;
  SET(l.x, l.y, l.z, l.block);
}

g.save(`${DIR}/${ID}.nbt`);
