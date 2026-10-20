import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw540298917";

// Footprint: [x, z, ground] per cell. Accept array or object form.
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const W = 13, H = 23, D = 23;
const g = new Voxels([W, H, D]);

const ground = new Map();
for (const c of raw) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  ground.set(`${x},${z}`, Math.max(0, Math.min(9, Math.round(gr ?? 0))));
}
const inside = (x, z) => ground.has(`${x},${z}`);
const gAt = (x, z) => ground.get(`${x},${z}`);

// Record-based design: a 2-storey mid-rise shophouse, cream-tiled concrete
// (1970s-80s Taipei), ground-floor shopfronts, a cornice and roof parapet.
// Storey line y=5, window band y=6..8, lintel y=9, cornice y=10, cap y=11.
const WALL = "smooth_quartz";
const TRIM = "light_gray_concrete";
const BASE = "polished_andesite";
const FOUND = "stone_bricks";
const DECK = "smooth_stone";
const FLOOR = "smooth_quartz";
const CAP = "smooth_quartz_slab";
const TOP_WALL = 11;
const STOREY = 5;

const put = (x, y, z, id, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Facade face for each perimeter cell
function faceOf(x, z) {
  if (!inside(x, z + 1)) return "south";
  if (!inside(x, z - 1)) return "north";
  if (!inside(x + 1, z)) return "east";
  if (!inside(x - 1, z)) return "west";
  return null; // interior
}

// Interior offset (one block in from the facade)
const inward = { south: [0, -1], north: [0, 1], east: [-1, 0], west: [1, 0] };

// Door: south-face cell nearest the centre of that face
const southCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !inside(x, z + 1));
const cxS = southCells.reduce((s, [x]) => s + x, 0) / southCells.length;
const door = southCells.reduce((best, c) =>
  Math.abs(c[0] - cxS) < Math.abs(best[0] - cxS) ? c : best
);
const [doorX, doorZ] = door;
const doorGround = gAt(doorX, doorZ);

// 1. Foundations, and per-cell walls / floors / roof
for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  // Foundation: solid from y=0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, FOUND);

  const face = faceOf(x, z);

  if (face) {
    const idx = face === "north" || face === "south" ? x : z;
    const bay = idx % 4;
    const isPost = bay === 0 || bay === 3;
    const paneProps = (face === "north" || face === "south")
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

    for (let y = gr; y <= TOP_WALL; y++) {
      if (y === TOP_WALL) { put(x, y, z, CAP, { type: "bottom", waterlogged: "false" }); continue; }
      if (y === 10 || y === 9 || y === STOREY) { put(x, y, z, TRIM); continue; }
      if (y === gr) { put(x, y, z, BASE); continue; }
      if (y < STOREY) {
        // Ground-floor shopfront
        if (isPost) put(x, y, z, WALL);
        else put(x, y, z, "glass_pane", paneProps);
        continue;
      }
      // Second-storey window band y=6..8
      if (isPost) put(x, y, z, WALL);
      else put(x, y, z, "glass_pane", paneProps);
    }

    // Door and entrance light on the south (street) face
    if (face === "south" && x === doorX && z === doorZ) {
      const base = doorGround + 1;
      put(x, base, z, "oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" });
      put(x, base + 1, z, "oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" });
    }

    // Warm light behind some second-floor windows (shroomlight just inside the glass)
    if (!isPost && face && (idx % 3 === 0) && y0ok(gr)) {
      const [dx, dz] = inward[face];
      const ix = x + dx, iz = z + dz;
      if (inside(ix, iz) && faceOf(ix, iz) === null) put(ix, 7, iz, "shroomlight");
    }
  } else {
    // Interior cell: floor slab at storey line, roof deck at top
    if (gr <= STOREY) put(x, STOREY, z, FLOOR);
    if (gr <= 10) put(x, 10, z, DECK);
  }
}

function y0ok(gr) { return gr <= 6; }

// 2. Entrance lantern just inside the door
if (inside(doorX, doorZ - 1) && faceOf(doorX, doorZ - 1) === null) {
  put(doorX, doorGround + 1, doorZ - 1, "lantern", { hanging: "false", waterlogged: "false" });
}

// 3. Roof equipment: two condenser plant blocks on the deck
const roofCells = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => faceOf(x, z) === null && gAt(x, z) <= 10);
const rxs = roofCells.map(([x]) => x), rzs = roofCells.map(([, z]) => z);
const minX = Math.min(...rxs), maxX = Math.max(...rxs);
const minZ = Math.min(...rzs), maxZ = Math.max(...rzs);
const unitCells = [
  [minX + 2, minZ + 3], [minX + 3, minZ + 3], [minX + 2, minZ + 4], [minX + 3, minZ + 4],
  [minX + 2, maxZ - 4], [minX + 3, maxZ - 4], [minX + 2, maxZ - 3], [minX + 3, maxZ - 3],
];
for (const [x, z] of unitCells) {
  if (inside(x, z) && faceOf(x, z) === null && gAt(x, z) <= 10) {
    put(x, 11, z, "iron_block");
  }
}

g.save(`${DIR}/${ID}.nbt`);
