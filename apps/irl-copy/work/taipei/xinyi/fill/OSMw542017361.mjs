import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw542017361";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 26, H = 23, D = 14;
const g = new Voxels([W, H, D]);

// Footprint lookup: "x,z" -> ground
const gmap = new Map();
for (const [x, z, gr] of cells) gmap.set(`${x},${z}`, gr);
const has = (x, z) => gmap.has(`${x},${z}`);

// Shared floor datum = highest ground under the footprint, so all storeys are level.
const baseY = Math.max(...cells.map((c) => c[2]));
const STOREY = 5;               // two storeys of 5 blocks
const ROOF = baseY + 10;        // roof slab / cornice level
const TOP = baseY + 11;         // parapet top, about 11 above datum
if (TOP >= H) throw new Error(`roof ${TOP} exceeds grid height ${H}`);

const put = (x, y, z, id, props) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (!has(x, z)) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Outward normals for each face: [dx, dz, facing]
const FACE = {
  N: [0, -1, "north"],
  S: [0, 1, "south"],
  W: [-1, 0, "west"],
  E: [1, 0, "east"],
};

// Classify cells
const info = cells.map(([x, z, gr]) => {
  const miss = Object.keys(FACE).filter((k) => {
    const [dx, dz] = FACE[k];
    return !has(x + dx, z + dz);
  });
  return { x, z, gr, miss, ext: miss.length > 0, face: miss[0] };
});

// 1. Foundation and podium: solid from y=0 up to the datum under every cell.
for (const c of info) {
  for (let y = 0; y < baseY; y++) put(c.x, y, c.z, "stone_bricks");
}

// 2. Floor slabs at the storey line and roof slab for every footprint cell.
for (const c of info) {
  put(c.x, baseY + STOREY, c.z, "smooth_stone");
  put(c.x, ROOF, c.z, "light_gray_concrete");
}

// Helper: position along a face
const along = (c) => (c.face === "N" || c.face === "S" ? c.x : c.z);
const isWindow = (t) => t % 3 === 1;

// 3. Facades
for (const c of info) {
  if (!c.ext) continue;
  const t = along(c);
  const win = isWindow(t);

  // Plinth
  put(c.x, baseY, c.z, "stone_bricks");

  // Ground floor: shopfront glazing between piers
  for (let y = baseY + 1; y <= baseY + 3; y++) {
    put(c.x, y, c.z, win ? "glass_pane" : "white_concrete");
  }
  put(c.x, baseY + 4, c.z, "red_terracotta");           // storey line

  // Upper storey: sill, framed window, pier
  put(c.x, baseY + 5, c.z, "smooth_quartz");
  for (let y = baseY + 6; y <= baseY + 8; y++) {
    put(c.x, y, c.z, win ? "glass_pane" : "white_concrete");
  }
  put(c.x, baseY + 9, c.z, "red_terracotta");           // lintel band

  // Cornice and parapet
  put(c.x, ROOF, c.z, "smooth_quartz");
  put(c.x, TOP, c.z, "white_concrete");
}

// 4. Entrance on the north (street) face, near the middle, on a window column.
const northCells = info.filter((c) => c.ext && c.miss.includes("N"));
let door = null;
if (northCells.length) {
  const avg = northCells.reduce((s, c) => s + c.x, 0) / northCells.length;
  const pref = northCells.filter((c) => isWindow(c.x));
  const pool = pref.length ? pref : northCells;
  door = pool.reduce((best, c) => (Math.abs(c.x - avg) < Math.abs(best.x - avg) ? c : best));
  const facing = "north";
  put(door.x, baseY + 1, door.z, "dark_oak_door", {
    facing, half: "lower", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, baseY + 2, door.z, "dark_oak_door", {
    facing, half: "upper", hinge: "left", open: "false", powered: "false",
  });
  put(door.x, baseY + 3, door.z, "white_concrete");     // entrance lintel
}

// 5. Warm light behind some glazed bays (glowstone just inside the glass)
for (const c of info) {
  if (!c.ext || c.face === undefined) continue;
  const t = along(c);
  if (!isWindow(t)) continue;
  const [dx, dz] = FACE[c.face];
  const ix = c.x - dx, iz = c.z - dz;      // inward neighbour
  const inner = info.find((q) => q.x === ix && q.z === iz);
  if (!inner || inner.ext) continue;
  if ((t + 1) % 2 === 0) put(ix, baseY + 7, iz, "glowstone");
  else if ((t + 2) % 4 === 0) put(ix, baseY + 2, iz, "glowstone");
}

// 6. Rooftop plant: a few units on the interior roof
for (const c of info) {
  if (c.ext) continue;
  if (c.x < 3 || c.x > W - 4 || c.z < 3 || c.z > D - 4) continue;
  if ((c.x * 3 + c.z * 5) % 11 === 0) put(c.x, TOP, c.z, "iron_block");
}

g.save(`${DIR}/${ID}.nbt`);
