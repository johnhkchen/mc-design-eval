import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1042397473";
const W = 23, H = 38, D = 18;

// Footprint cells: [x, z, ground]
const raw = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const list = Array.isArray(raw) ? raw : (raw.cells ?? []);

const ground = new Map();
for (const c of list) {
  const [x, z, gy] = Array.isArray(c) ? c : [c.x, c.z, c.ground];
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  ground.set(`${x},${z}`, Math.max(0, Math.min(H - 1, gy | 0)));
}

const key = (x, z) => `${x},${z}`;
const has = (x, z) => ground.has(key(x, z));
const interior = (x, z) => has(x, z) && has(x - 1, z) && has(x + 1, z) && has(x, z - 1) && has(x, z + 1);

// Lowest ground under the footprint; roof sits 26 blocks above it.
const G0 = Math.min(...ground.values());
const ROOF = G0 + 26;      // parapet top
const DECK = ROOF - 1;     // roof deck / cornice level (top of storey 5)

const g = new Voxels([W, H, D]);
const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || y < 0 || y >= H || z < 0 || z >= D) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// Main entrance: middle cell of the street-facing (north, min z) edge.
const northEdge = [...ground.keys()]
  .map((k) => k.split(",").map(Number))
  .filter(([x, z]) => !has(x, z - 1))
  .sort((a, b) => a[0] - b[0]);
const doorCell = northEdge.length ? northEdge[Math.floor(northEdge.length / 2)] : null;
const doorX = doorCell ? doorCell[0] : -1;
const doorZ = doorCell ? doorCell[1] : -1;

for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);

  // Foundation from y 0 up to this cell's ground, base course on top.
  for (let y = 0; y <= gy; y++) {
    put(x, y, z, y === gy ? "smooth_stone" : "stone_bricks");
  }

  if (interior(x, z)) {
    // Interior: no rooms, only a floor slab per storey and the roof deck.
    for (let y = gy + 1; y <= DECK; y++) {
      if (y === DECK) put(x, y, z, "light_gray_concrete");
      else if (y > G0 && (y - G0) % 5 === 0) put(x, y, z, "stone");
    }
    continue;
  }

  // Perimeter facade.
  const onX = !has(x, z - 1) || !has(x, z + 1); // on a north/south face
  const onZ = !has(x - 1, z) || !has(x + 1, z); // on an east/west face

  for (let y = gy + 1; y <= ROOF; y++) {
    const rel = y - G0;
    const storey = Math.floor(rel / 5);
    const off = rel % 5;

    if (y === ROOF) { put(x, y, z, "quartz_block"); continue; }            // parapet
    if (y === DECK) { put(x, y, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" }); continue; } // cornice
    if (off === 0) { put(x, y, z, "smooth_stone"); continue; }             // storey line
    if (off === 4) { put(x, y, z, "quartz_block"); continue; }             // spandrel

    // off 1..3: window zone
    let pier = false;
    let idx = 0;
    if (onX && onZ) pier = true;
    else if (onX) { idx = x; pier = x % 3 === 0; }
    else { idx = z; pier = z % 3 === 0; }

    // Entrance door on the ground floor, centre of the street face.
    if (storey === 0 && x === doorX && z === doorZ && (off === 1 || off === 2)) {
      const half = off === 1 ? "lower" : "upper";
      put(x, y, z, "dark_oak_door", { facing: "north", half, hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (pier) {
      put(x, y, z, "quartz_pillar", { axis: "y" });
      continue;
    }

    const glassProps = onX
      ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "light_blue_stained_glass_pane", glassProps);

    // Warm light behind some glass (in the air gap inside).
    if (off === 2 && idx % 6 === 1 && (storey === 0 || storey === 1 || storey === 3)) {
      let dx = 0, dz = 0;
      if (onX) dz = !has(x, z - 1) ? 1 : -1;
      else dx = !has(x - 1, z) ? 1 : -1;
      const ix = x + dx, iz = z + dz;
      if (interior(ix, iz) && ground.get(key(ix, iz)) < y) {
        put(ix, y, iz, storey === 0 ? "glowstone" : "shroomlight");
      }
    }
  }
}

// Roof plant on the deck: a water tank (typical of Taipei) and a small penthouse.
for (const [k, gy] of ground) {
  const [x, z] = k.split(",").map(Number);
  if (!interior(x, z) || gy >= DECK) continue;

  if (x >= 7 && x <= 9 && z >= 8 && z <= 10) {
    for (let y = ROOF; y <= ROOF + 3; y++) {
      put(x, y, z, y === ROOF + 3 ? "light_gray_concrete" : "white_concrete");
    }
  }
  if (x >= 13 && x <= 14 && z >= 6 && z <= 7) {
    for (let y = ROOF; y <= ROOF + 2; y++) {
      put(x, y, z, "light_gray_concrete");
    }
  }
}

g.save(`${DIR}/${ID}.nbt`);
