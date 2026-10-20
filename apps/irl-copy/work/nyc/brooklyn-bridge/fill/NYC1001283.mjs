import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 166 William Street, 1900. Mixed residential over commercial, six storeys in brick
// on a stone base with a stone cornice. Ground floor is a shopfront with a central
// entrance. Upper floors have a window row alternating with a stone belt course.
// A penthouse sits on the roof centre.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1001283";
const W = 10, D = 14, H = 27;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const map = new Map();
for (const [x, z, gr, rf] of cells) map.set(`${x},${z}`, { ground: gr, roof: rf });
const has = (x, z) => map.has(`${x},${z}`);

// Global storey base: lowest ground under the footprint.
let B = Infinity;
for (const c of map.values()) B = Math.min(B, c.ground);
if (!isFinite(B)) B = 0;

// One flat roof level: median of the lidar roof heights, so the tops read as clean tiers.
const roofs = [...map.values()].map(c => Math.round(c.roof)).sort((a, b) => a - b);
const flatRoof = roofs.length ? roofs[Math.floor(roofs.length / 2)] : 15;

const g = new Voxels([W, H, D]);
const lights = [];
const setB = (x, y, z, id, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

// Per-cell geometry
const info = new Map();
for (const [key, c] of map) {
  const [x, z] = key.split(",").map(Number);
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wd = !has(x - 1, z), E = !has(x + 1, z);
  const per = N || S || Wd || E;
  const corner = (N || S) && (Wd || E);
  const ground = Math.max(0, Math.min(H - 6, Math.round(c.ground)));
  let top = flatRoof;
  top = Math.max(top, ground + 4);
  top = Math.min(top, H - 1);
  info.set(key, { x, z, N, S, Wd, E, per, corner, ground, top });
}

// Main massing, walls, floors, belts, windows and shopfront
for (const [, c] of info) {
  const { x, z, N, S, per, corner, ground: gr, top } = c;
  const along = (N || S) ? x : z;

  // Stone foundation up to each cell's own ground
  for (let y = 0; y < gr; y++) setB(x, y, z, "stone_bricks");

  for (let y = gr; y < top; y++) {
    const rel = y - B;

    // Parapet/cornice: stone cap on the perimeter, smooth roof surface inside
    if (y === top - 1) {
      setB(x, y, z, per ? "stone_bricks" : "smooth_stone");
      continue;
    }
    // Cornice band just under the parapet
    if (per && y === top - 2) {
      setB(x, y, z, "smooth_stone");
      continue;
    }

    // Interior: floor slabs only, air otherwise (no interiors)
    if (!per) {
      if (rel === 0 || (rel >= 3 && rel % 2 === 1)) setB(x, y, z, "smooth_stone");
      continue;
    }

    // Perimeter facade
    let blk;
    if (corner) blk = "stone_bricks";
    else if (rel <= 0) blk = "stone_bricks";                                   // shop bulkhead
    else if (rel === 1) blk = (along % 3 === 0) ? "dark_oak_planks" : "glass_pane"; // shopfront glass
    else if (rel === 2) blk = "dark_oak_planks";                               // transom
    else if (rel === 3) blk = "stone_bricks";                                  // belt over shop
    else if (rel % 2 === 0) blk = (along % 2 === 0) ? "bricks" : "glass_pane"; // window row, piers
    else blk = "stone_bricks";                                                 // belt course

    setB(x, y, z, blk);

    // Warm light behind some glass: glowstone in the adjacent interior cell
    if (blk === "glass_pane" && !corner) {
      const ox = N ? 0 : (S ? 0 : (c.Wd ? 1 : -1));
      const oz = N ? 1 : (S ? -1 : 0);
      const ix = x + ox, iz = z + oz;
      const ik = `${ix},${iz}`;
      if (has(ix, iz) && info.get(ik) && !info.get(ik).per && ((along * 5 + y * 3) % 7 === 0)) {
        lights.push([ix, y, iz]);
      }
    }
  }
}

// Rooftop penthouse, centred and set back from the street front
for (const [, c] of info) {
  if (!c.per && c.x >= 3 && c.x <= 6 && c.z >= 4 && c.z <= 9 && c.top + 3 < H) {
    const ring = c.x === 3 || c.x === 6 || c.z === 4 || c.z === 9;
    for (let y = c.top; y <= c.top + 1; y++) {
      setB(c.x, y, c.z, ring ? "bricks" : "smooth_stone");
    }
    setB(c.x, c.top + 2, c.z, "stone_bricks");
  }
}

// Entrance on the street front (lowest z row), near the centre
let doorZ = Infinity;
for (const [, c] of info) if (c.N) doorZ = Math.min(doorZ, c.z);
let doorX = -1, bestD = Infinity;
for (const [, c] of info) {
  if (c.N && c.z === doorZ && !c.corner) {
    const d = Math.abs(c.x - 4);
    if (d < bestD) { bestD = d; doorX = c.x; }
  }
}
if (doorX >= 0) {
  const dc = info.get(`${doorX},${doorZ}`);
  const yLow = dc.ground + 1;
  // Light oak door in a stone surround, so the entrance reads at street level
  for (let dx = -1; dx <= 1; dx++) {
    const cx = doorX + dx;
    if (has(cx, doorZ) && dx !== 0) {
      setB(cx, yLow, doorZ, "smooth_stone");
      setB(cx, yLow + 1, doorZ, "smooth_stone");
    }
  }
  g.set(doorX, yLow, doorZ, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(doorX, yLow + 1, doorZ, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Awning fascia over the entrance on the belt row
  for (let dx = -1; dx <= 1; dx++) {
    const cx = doorX + dx;
    if (has(cx, doorZ)) setB(cx, yLow + 2, doorZ, "black_wool");
  }
  // Warm lanterns flanking the door
  if (has(doorX - 1, doorZ)) setB(doorX - 1, yLow + 1, doorZ, "glowstone");
  if (has(doorX + 1, doorZ)) setB(doorX + 1, yLow + 1, doorZ, "glowstone");
}

// Apply deferred lights last so they are not overwritten
for (const [x, y, z] of lights) {
  if (y < H) setB(x, y, z, "glowstone");
}

g.save(`${DIR}/${ID}.nbt`);
