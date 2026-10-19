// 159 West 53rd Street, 1968 mixed residential and commercial building: a 6 x 26 lot with a shopfront on the street
// and brick residential floors above. Massing follows the lidar roof read as clean 3-block storeys (median-smoothed,
// tiers rounded to storey lines): a 2-storey shop wing at the north end, a 9-storey tower stub on the NW corner, a
// 10-storey slab through the middle and a 7-storey wing at the south end. Brick piers and stone storey lines frame
// ribbon windows of glass panes, a polished granite base and a shopfront on the ground floor, a door on the south
// front, a parapet, and a white-concrete penthouse on the roof. Glowstone sits behind some panes. Solid shell and
// floor slabs with air behind the glass (no interiors).
import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/rockefeller-center/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1023166.cells.json`, "utf8"));
const X = 6, Z = 26, Y = 45;

// Lidar roof per cell; 0 = no return. No-return cells take the median of their lit neighbours.
const lidar = Array.from({ length: X }, () => Array(Z).fill(0));
for (const [x, z, , roof] of cells) lidar[x][z] = roof;
const inFoot = (x, z) => x >= 0 && z >= 0 && x < X && z < Z;
const median = (a) => { const s = [...a].sort((p, q) => p - q); return s[Math.floor(s.length / 2)]; };
const window3 = (arr, x, z) => {
  const out = [];
  for (let dx = -1; dx <= 1; dx++) for (let dz = -1; dz <= 1; dz++) {
    if (inFoot(x + dx, z + dz) && arr[x + dx][z + dz]) out.push(arr[x + dx][z + dz]);
  }
  return out;
};
const filled = lidar.map((col, x) => col.map((r, z) => (r ? r : median(window3(lidar, x, z).length ? window3(lidar, x, z) : [6]))));
const smooth = filled.map((col, x) => col.map((_, z) => median(window3(filled, x, z))));

// Storey tiers: every roof on a 3-block line, at least one storey.
const H = smooth.map((col) => col.map((h) => Math.max(3, 3 * Math.round(h / 3))));
console.log("roof tiers (z down, x across):");
for (let z = 0; z < Z; z++) console.log(String(z).padStart(2), Array.from({ length: X }, (_, x) => String(H[x][z]).padStart(3)).join(""));

const hAt = (x, z) => (inFoot(x, z) ? H[x][z] : 0);
const perim = (x, z) => x === 0 || z === 0 || x === X - 1 || z === Z - 1;
const NB = [[1, 0], [-1, 0], [0, 1], [0, -1]];
// A shell cell: outside wall at every height, or an inner cell that a lower neighbour leaves exposed.
const exposed = (x, z, y) => NB.some(([dx, dz]) => hAt(x + dx, z + dz) <= y);

const g = new Voxels([X, Y, Z]);
const occ = new Map();           // "x,y,z" -> block, for the connection pass and the support check
const key = (x, y, z) => `${x},${y},${z}`;
const put = (x, y, z, block, state) => {
  if (!g.inBounds(x, y, z)) throw new Error(`outside the box: ${x},${y},${z}`);
  g.set(x, y, z, block, state);
  occ.set(key(x, y, z), block);
};

// The face a perimeter cell looks out of: k runs along the face, n is its length, inward points into the building.
const faceOf = (x, z) => {
  if (x === 0) return { k: z, n: Z, inward: [1, 0], axis: "z" };
  if (x === X - 1) return { k: z, n: Z, inward: [-1, 0], axis: "z" };
  if (z === 0) return { k: x, n: X, inward: [0, 1], axis: "x" };
  return { k: x, n: X, inward: [0, -1], axis: "x" };
};
const DOOR = { x: 2, z: Z - 1 };   // the entrance: south front, ground floor

const facade = (x, y, z, h) => {
  const s = Math.floor(y / 3), r = y % 3;
  if (y === 0) return put(x, y, z, "polished_granite");
  if (y === h - 1) return put(x, y, z, "bricks");                 // attic band under the parapet
  if (r === 0) return put(x, y, z, "smooth_stone");                // storey line
  const corner = (x === 0 || x === X - 1) && (z === 0 || z === Z - 1);
  const f = corner ? null : faceOf(x, z);
  const k = f ? f.k : 0;
  if (s === 0 && !corner && DOOR.x === x && DOOR.z === z) {        // door, lower and upper halves
    const st = (half) => ({ facing: "south", half, hinge: "left", open: "false", powered: "false" });
    return r === 1 ? put(x, y, z, "dark_oak_door", st("lower")) : put(x, y, z, "dark_oak_door", st("upper"));
  }
  const pier = corner || k % 3 === 0;                              // brick or polished-stone piers between bays
  if (s === 0) return put(x, y, z, pier ? "polished_andesite" : "glass");
  return put(x, y, z, pier ? "bricks" : "light_blue_stained_glass_pane", pier ? undefined : { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" });
};

for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  const h = H[x][z], p = perim(x, z);
  for (let y = 0; y < h; y++) {
    if (p) { facade(x, y, z, h); continue; }
    if (y === h - 1) put(x, y, z, "stone");                       // roof surface over the inner cells
    else if (y === 0) put(x, y, z, "stone");                      // ground course
    else if (exposed(x, z, y)) put(x, y, z, y % 3 === 0 ? "smooth_stone" : "bricks");
    else if (y % 3 === 0) put(x, y, z, "stone");                  // floor slab in each storey
  }
  if (p) put(x, h, z, "smooth_stone");                            // parapet
}

// Warm glowstone behind some panes, one block inside the glass, in the air gap.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  if (!perim(x, z) || (x === 0 && z === 0) || (x === X - 1 && z === 0) || (x === 0 && z === Z - 1) || (x === X - 1 && z === Z - 1)) continue;
  const f = faceOf(x, z);
  for (let y = 1; y < H[x][z]; y++) {
    const s = Math.floor(y / 3), r = y % 3;
    if (r === 0 || y === H[x][z] - 1) continue;
    if (occ.get(key(x, y, z)) !== "light_blue_stained_glass_pane" && occ.get(key(x, y, z)) !== "glass") continue;
    if ((f.k + s) % 4 !== 1) continue;
    const ix = x + f.inward[0], iz = z + f.inward[1];
    if (!occ.has(key(ix, y, iz))) put(ix, y, iz, "glowstone");
  }
}

// Panes join along the face to whatever is beside them (panes, piers, glass), as vanilla panes do.
for (let x = 0; x < X; x++) for (let z = 0; z < Z; z++) {
  for (let y = 0; y < Y; y++) {
    if (occ.get(key(x, y, z)) !== "light_blue_stained_glass_pane") continue;
    const alongZ = x === 0 || x === X - 1;
    const ends = alongZ ? [["north", 0, -1], ["south", 0, 1]] : [["west", -1, 0], ["east", 1, 0]];
    const st = { north: "false", south: "false", east: "false", west: "false", waterlogged: "false" };
    for (const [name, dx, dz] of ends) if (occ.has(key(x + dx, y, z + dz))) st[name] = "true";
    g.set(x, y, z, "light_blue_stained_glass_pane", st);
  }
}

// Roof penthouse on the tallest tier, a white-concrete box with a glass band.
const PH = { x0: 2, x1: 3, z0: 11, z1: 14 };
const base = H[PH.x0][PH.z0];
for (let x = PH.x0; x <= PH.x1; x++) for (let z = PH.z0; z <= PH.z1; z++) {
  if (H[x][z] !== base) throw new Error(`penthouse sits on uneven roof at ${x},${z}`);
  for (let y = base; y < base + 3; y++) {
    const ring = x === PH.x0 || x === PH.x1 || z === PH.z0 || z === PH.z1;
    if (ring && y === base + 1) put(x, y, z, "light_blue_stained_glass");
    else put(x, y, z, "white_concrete");
  }
  put(x, base + 3, z, "smooth_stone");
}

// Support check: every block stands on something below or beside it at its own height.
let floating = 0;
for (const k of occ.keys()) {
  const [x, y, z] = k.split(",").map(Number);
  if (y === 0) continue;
  const under = occ.has(key(x, y - 1, z));
  const beside = NB.some(([dx, dz]) => occ.has(key(x + dx, y, z + dz)));
  if (!under && !beside) floating++;
}
console.log(`support check: ${floating} floating blocks`);

const out = `${DIR}/NYC1023166.nbt`;
const stats = g.save(out);
console.log(`saved ${out}: ${stats.blocks} blocks, ${stats.palette} palette entries`);
