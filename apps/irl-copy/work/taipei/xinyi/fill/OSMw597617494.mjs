import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw597617494";
const W = 20, H = 43, D = 18;

// Footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const rows = Array.isArray(raw) ? raw : (raw.cells ?? raw.footprint ?? []);
const ground = new Map();
for (const c of rows) {
  const [x, z, gr] = Array.isArray(c) ? c : [c.x, c.z, c.ground ?? c.g ?? 0];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.min(Math.max(0, Math.round(gr ?? 0)), 20));
}
const has = (x, z) => ground.has(`${x},${z}`);

// Block plan: key "x,y,z" -> { name, props }
const B = new Map();
const put = (x, y, z, name, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  B.set(`${x},${y},${z}`, { name, props });
};
const at = (x, y, z) => B.get(`${x},${y},${z}`);

// Castle-block residence, c. 1990s-2000s Taipei: cream tiled concrete frame,
// stone-clad plinth, cyan tinted glazing with piers, storey lines every 5 blocks,
// crenellated corner parapets, a lobby on the south (front) face.
const FRONT_X0 = 8, FRONT_X1 = 11;

for (const [key, gr] of ground) {
  const [x, z] = key.split(",").map(Number);
  const n = !has(x, z - 1), s = !has(x, z + 1);
  const w = !has(x - 1, z), e = !has(x + 1, z);
  const nExp = [n, s, w, e].filter(Boolean).length;
  const perim = nExp > 0;
  const corner = nExp >= 2;
  const along = (n || s) ? x : z;
  const pier = corner || (perim && along % 3 === 0);

  // Foundation: stone plinth from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  // Floor slabs at every storey line (y = 0, 5, ..., 30); storey lines on the perimeter
  for (let k = 0; k <= 6; k++) {
    const sy = 5 * k;
    if (sy >= gr) put(x, sy, z, perim ? "light_gray_concrete" : "white_concrete");
  }

  // Storeys: windows in y+1..y+3, spandrel band at y+4
  for (let k = 0; k <= 5; k++) {
    const base = 5 * k;
    if (perim) {
      for (let y = base + 1; y <= base + 3; y++) {
        if (y < gr) continue;
        if (pier) put(x, y, z, "white_concrete");
        else put(x, y, z, "cyan_stained_glass_pane", { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
      }
      if (base + 4 >= gr) put(x, base + 4, z, "white_concrete");
    }
  }

  // Warm lanterns standing on interior floors behind the glazing
  if (!perim) {
    for (let k = 0; k <= 5; k++) {
      const base = 5 * k;
      if (base >= gr && base + 1 >= gr && (x * 3 + z * 5 + k) % 4 === 0) {
        put(x, base + 1, z, "lantern", { hanging: "false", waterlogged: "false" });
      }
    }
  }

  // Ground-storey base course on the perimeter
  if (perim && gr <= 4) put(x, gr, z, "polished_andesite");

  // South (front) lobby: glazed entrance bay with frame and canopy
  if (perim && s && x >= FRONT_X0 && x <= FRONT_X1) {
    const frame = x === FRONT_X0 || x === FRONT_X1;
    for (const y of [1, 2]) {
      if (y >= gr) put(x, y, z, frame ? "polished_andesite" : "glass");
    }
    if (3 >= gr) put(x, 3, z, "stone_bricks");
  }

  // Parapet and crenellated corners
  if (perim) {
    put(x, 31, z, "white_concrete");
    if (corner) put(x, 32, z, "stone_brick_wall");
  }

  // Roof plant on interior cells of the roof slab
  if (!perim && 30 >= gr && x % 5 === 2 && z % 5 === 2) {
    put(x, 31, z, "light_gray_concrete");
    put(x, 32, z, "light_gray_concrete");
  }
}

// Connect glass panes to neighbouring panes and solids (same y, same footprint plane)
for (const [key, v] of B) {
  if (!v.name.endsWith("glass_pane")) continue;
  const [x, y, z] = key.split(",").map(Number);
  const conn = (dx, dz) => (at(x + dx, y, z + dz) ? "true" : "false");
  v.props = {
    north: conn(0, -1),
    south: conn(0, 1),
    east: conn(1, 0),
    west: conn(-1, 0),
    waterlogged: "false",
  };
}

// Write into the voxel grid
const g = new Voxels([W, H, D]);
for (const [key, v] of B) {
  const [x, y, z] = key.split(",").map(Number);
  if (v.props) g.set(x, y, z, v.name, v.props);
  else g.set(x, y, z, v.name);
}

g.save(`${DIR}/${ID}.nbt`);
