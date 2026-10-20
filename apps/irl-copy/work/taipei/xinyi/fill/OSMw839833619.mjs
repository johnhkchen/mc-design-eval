import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no source. Read as a two-storey, flat-roofed mid-century/1980s Taipei
// commercial block: white concrete frame, grey storey bands, glass shopfronts
// on the ground floor, upper-floor ribbon windows, a red canopy over the entrance,
// a parapet with corner lanterns, and a small rooftop housing with a lightning rod.
// Roof deck at B+10 (B = lowest ground), parapet top at B+11.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw839833619";
const W = 17, H = 23, D = 19;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const ground = new Map(cells.map(([x, z, gr]) => [`${x},${z}`, gr]));
const has = (x, z) => ground.has(`${x},${z}`);
const groundOf = (x, z) => ground.get(`${x},${z}`);
const B = Math.min(...cells.map(c => c[2]));
const R = B + 10;                       // roof deck level
const floors = [B, B + 5].filter(f => f < R); // storey lines (2 storeys of ~5 blocks)

const put = (x, y, z, id, props) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Which outward faces of a footprint cell are exposed (neighbour outside footprint)
const exposed = (x, z) => {
  const e = [];
  if (!has(x, z - 1)) e.push("north");
  if (!has(x, z + 1)) e.push("south");
  if (!has(x + 1, z)) e.push("east");
  if (!has(x - 1, z)) e.push("west");
  return e;
};
const inward = { north: [0, 1], south: [0, -1], east: [-1, 0], west: [1, 0] };

// Entrance: a single-face north-exposed cell closest to the centre line
let door = null;
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  const e = exposed(x, z);
  if (e.length === 1 && e[0] === "north") {
    const d = Math.abs(x - 8);
    if (!door || d < door.d) door = { x, z, d, face: "north" };
  }
}
if (!door) {
  for (const [x, z] of cells.map(c => [c[0], c[1]])) {
    const e = exposed(x, z);
    if (e.length === 1) { door = { x, z, d: 0, face: e[0] }; break; }
  }
}

// ---- Foundations, floors, walls, windows ----
for (const [x, z, gr] of cells) {
  const e = exposed(x, z);
  const perimeter = e.length > 0;
  const corner = e.length >= 2;

  // Foundation: solid from y 0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  if (!perimeter) {
    // Interior: floor surfaces and slabs only, air elsewhere (no interiors)
    if (gr < R) put(x, gr, z, "smooth_stone");
    for (const F of floors) if (F > gr && F < R) put(x, F, z, "smooth_stone");
    put(x, R, z, "light_gray_concrete"); // roof deck
    continue;
  }

  // Perimeter shell from ground to just below the roof deck
  for (let y = gr; y < R; y++) put(x, y, z, "white_concrete");
  if (gr < R) put(x, gr, z, "stone_bricks");              // base course
  for (const F of floors) if (F > gr && F < R) put(x, F, z, "light_gray_concrete"); // storey line
  if (R - 1 > gr) put(x, R - 1, z, "light_gray_concrete"); // cornice band

  // Window / shopfront pattern
  const face = e[0];
  const idx = (face === "north" || face === "south") ? x : z;
  const windowable = e.length === 1 && idx % 3 !== 0;
  const isDoor = door && door.x === x && door.z === z;

  if (isDoor) {
    const dface = door.face;
    put(x, gr + 1, z, "dark_oak_door", { facing: dface, half: "lower", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 2, z, "dark_oak_door", { facing: dface, half: "upper", hinge: "left", open: "false", powered: "false" });
    put(x, gr + 3, z, "red_concrete"); // entrance canopy lintel
  }

  for (const F of floors) {
    for (let rel = 1; rel <= 3; rel++) {
      const y = F + rel;
      if (y < gr + 1 || y > R - 2) continue;
      if (isDoor && y <= gr + 3) continue;
      if (windowable) {
        put(x, y, z, "glass_pane");
        // Warm light behind some panes (interior neighbour is air otherwise)
        if (rel === 2 && (idx + F) % 3 === 1) {
          const [dx, dz] = inward[face];
          const nx = x + dx, nz = z + dz;
          if (has(nx, nz) && exposed(nx, nz).length === 0) {
            put(nx, y, nz, "glowstone");
          }
        }
      }
    }
  }

  // Parapet and cap on top of the roof deck
  put(x, R + 1, z, "white_concrete");
  if (corner) put(x, R + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  else put(x, R + 2, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

// ---- Roof deck (ensure every footprint cell is capped at R) ----
for (const [x, z] of cells.map(c => [c[0], c[1]])) {
  put(x, R, z, "light_gray_concrete");
}

// ---- Rooftop housing (small penthouse) if the footprint allows it ----
const box = { x0: 5, x1: 11, z0: 6, z1: 12 };
let boxOK = true;
for (let x = box.x0; x <= box.x1; x++)
  for (let z = box.z0; z <= box.z1; z++)
    if (!has(x, z)) boxOK = false;

if (boxOK) {
  for (let x = box.x0; x <= box.x1; x++) {
    for (let z = box.z0; z <= box.z1; z++) {
      const edge = x === box.x0 || x === box.x1 || z === box.z0 || z === box.z1;
      const cornerP = (x === box.x0 || x === box.x1) && (z === box.z0 || z === box.z1);
      if (edge) {
        put(x, R + 1, z, "white_concrete");
        if (!cornerP && (x + z) % 2 === 0) put(x, R + 2, z, "glass_pane");
        else put(x, R + 2, z, "white_concrete");
      }
      put(x, R + 3, z, "light_gray_concrete"); // housing cap
    }
  }
  // Warm lamps inside the housing behind the glass
  put(8, R + 2, 9, "sea_lantern");
  // Lightning rod on the cap
  put(8, R + 4, 9, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/${ID}.nbt`);
