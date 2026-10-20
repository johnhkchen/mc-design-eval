import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Record: no name. 15 x 17 footprint, roof ~11 blocks above lowest ground.
// Read as a two-storey, cream-tiled commercial block of the 1980s-90s Xinyi
// fringe: granite base course, shopfront on the ground storey, a band of
// light-blue glass windows above, a quartz cornice and a flat roof with plant.

const SRC = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1156915708";
const W = 15, H = 23, D = 17;

const raw = JSON.parse(readFileSync(`${SRC}/${ID}.cells.json`, "utf8"));
const cells = raw
  .map((c) => Array.isArray(c)
    ? { x: c[0], z: c[1], g: c[2] }
    : { x: c.x, z: c.z, g: c.ground ?? c.g ?? c[2] })
  .filter((c) => Number.isInteger(c.x) && Number.isInteger(c.z)
    && c.x >= 0 && c.x < W && c.z >= 0 && c.z < D)
  .map((c) => ({ x: c.x, z: c.z, g: Math.max(0, Math.min(H - 12, Math.round(c.g ?? 0))) }));

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => { if (y >= 0 && y < H) g.set(x, y, z, b, p); };

const map = new Map(cells.map((c) => [`${c.x},${c.z}`, c.g]));
const has = (x, z) => map.has(`${x},${z}`);
const base = Math.min(...cells.map((c) => c.g));
const top = base + 10;          // roof deck / cornice (roof ~11 above lowest ground)
const floor2 = base + 5;        // second-floor slab, storey line
const expo = (x, z) => ({
  N: !has(x, z - 1), S: !has(x, z + 1), W: !has(x - 1, z), E: !has(x + 1, z),
});
const faceOf = (e) => (e.N ? "N" : e.S ? "S" : e.W ? "W" : e.E ? "E" : null);

// Front door: the north-facing perimeter cell nearest the footprint's mean x.
const northCells = cells.filter((c) => !has(c.x, c.z - 1));
const meanX = cells.reduce((s, c) => s + c.x, 0) / cells.length;
const doorCell = (northCells.length ? northCells : cells)
  .reduce((best, c) => (!best || Math.abs(c.x - meanX) < Math.abs(best.x - meanX) ? c : best), null);
const doorX = doorCell ? doorCell.x : -1;
const doorZ = doorCell ? doorCell.z : -1;

const lights = [];

for (const c of cells) {
  const { x, z, g: g0 } = c;
  const e = expo(x, z);
  const perim = e.N || e.S || e.W || e.E;

  // Foundation: solid from y 0 up to this cell's ground.
  for (let y = 0; y < g0; y++) put(x, y, z, "stone_bricks");

  if (!perim) {
    // Interior: solid mass with a slab per storey, air gap in the upper storey.
    for (let y = g0; y <= top; y++) {
      let b = null;
      if (g0 > floor2) b = y < top ? "stone" : "light_gray_concrete";
      else if (y < floor2) b = "stone";
      else if (y === floor2) b = "smooth_quartz";
      else if (y === top) b = "light_gray_concrete";
      if (b) put(x, y, z, b);
    }
    continue;
  }

  // Perimeter wall: facade chosen by the first exposed side (N, S, W, E).
  const face = faceOf(e);
  const t = face === "N" || face === "S" ? x : z;
  const isDoorCell = x === doorX && z === doorZ;
  const inAwning = face === "N" && Math.abs(x - doorX) <= 1 && has(x, z) && !has(x, z - 1);

  for (let y = g0; y <= top; y++) {
    const r = y - base;
    const dy = y - g0;
    let b, p;
    if (y === top) {
      b = "smooth_quartz";                              // cornice
    } else if (r === 9) {
      b = "white_concrete";                             // frieze band
    } else if (r >= 6 && r <= 8) {
      if (t % 3 === 0) b = "white_concrete";            // window mullions
      else { b = "light_blue_stained_glass"; if (r === 7 && t % 6 === 1) lights.push({ x, z, face, y }); }
    } else if (r === floor2) {
      b = "smooth_quartz";                              // storey line
    } else if (y === g0) {
      b = "polished_granite";                           // base course
    } else if (isDoorCell && (dy === 1 || dy === 2)) {
      b = "dark_oak_door";
      p = dy === 1
        ? { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }
        : { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" };
    } else if (inAwning && dy === 3) {
      b = "red_concrete";                               // awning band over the entrance
    } else if (r < floor2) {
      b = t % 3 === 0 ? "stone_bricks" : "glass";       // shopfront with piers
    } else {
      b = "white_concrete";
    }
    put(x, y, z, b, p);
  }
}

// Warm lights in some upper windows, placed in the air behind the glass.
for (const L of lights) {
  const dx = L.face === "W" ? 1 : L.face === "E" ? -1 : 0;
  const dz = L.face === "N" ? 1 : L.face === "S" ? -1 : 0;
  const ix = L.x + dx, iz = L.z + dz;
  if (!has(ix, iz)) continue;
  if (expo(ix, iz).N || expo(ix, iz).S || expo(ix, iz).W || expo(ix, iz).E) continue;
  put(ix, L.y, iz, "shroomlight");
}

// Roof plant: two rooftop units and a small box on the deck.
const roofCells = (x0, x1, z0, z1) => {
  for (let x = x0; x <= x1; x++) for (let z = z0; z <= z1; z++) {
    if (!has(x, z)) continue;
    if (expo(x, z).N || expo(x, z).S || expo(x, z).W || expo(x, z).E) continue;
    put(x, top + 1, z, "light_gray_concrete");
  }
};
roofCells(4, 6, 6, 7);
roofCells(9, 10, 6, 7);
roofCells(4, 5, 11, 12);

g.save(`${SRC}/${ID}.nbt`);
