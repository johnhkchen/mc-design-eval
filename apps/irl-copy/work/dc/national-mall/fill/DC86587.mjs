import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const ID = "DC86587";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

// Army and Navy Club, 1627 I St NW (Hornblower & Marshall, 1911-12): a Beaux-Arts
// masonry club/office block. Pale limestone-clad walls on a base course, storey
// bands, pier-and-window bays, a heavy cornice and a parapet with a roof terrace.
const W = 14, H = 32, D = 20;
const g = new Voxels([W, H, D]);

const FLOORS = [4, 8, 12, 16];
const PANE_NS = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
const PANE_EW = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

const key = (x, z) => `${x},${z}`;
const byKey = new Map();
for (const [x, z, gr, rf] of cells) byKey.set(key(x, z), { gr, rf });
const inside = (x, z) => byKey.has(key(x, z));

const put = (x, y, z, id, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const expo = (x, z) => ({
  W: !inside(x - 1, z),
  E: !inside(x + 1, z),
  N: !inside(x, z - 1), // -z = north = I Street front
  S: !inside(x, z + 1),
});
const isExposed = (x, z) => {
  const e = expo(x, z);
  return e.W || e.E || e.N || e.S;
};

// Entrance: the north-facing cell nearest the middle of the front.
let door = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (!expo(x, z).N) continue;
    const d = Math.abs(x - Math.floor(W / 2));
    if (d < best) { best = d; door = { x, z }; }
  }
}

// Clean per-cell roof tier: lidar roof height rounded to even blocks.
const roofOf = (gr, rf) => Math.min(H - 5, Math.max(gr + 8, Math.round(rf / 2) * 2));

// Foundations: solid from y 0 up to each cell's ground.
for (const [x, z, gr] of cells) {
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");
}

// Pass 1: interior. Solid mass with floor slabs and a roof deck; cells touching
// the facade keep a one-block air gap behind the glass (between the floor slabs).
for (const [x, z, gr, rf] of cells) {
  if (isExposed(x, z)) continue;
  const R = roofOf(gr, rf);
  const floorsHere = FLOORS.filter((f) => f < R - 1);
  const depth1 =
    inside(x - 1, z) && isExposed(x - 1, z) ||
    inside(x + 1, z) && isExposed(x + 1, z) ||
    inside(x, z - 1) && isExposed(x, z - 1) ||
    inside(x, z + 1) && isExposed(x, z + 1) ||
    !inside(x - 1, z) || !inside(x + 1, z) || !inside(x, z - 1) || !inside(x, z + 1);

  for (let y = gr; y <= R - 2; y++) {
    if (y === gr || floorsHere.includes(y)) { put(x, y, z, "smooth_stone"); continue; }
    const F = Math.floor(y / 4) * 4;
    const rel = y - F;
    if (depth1 && (rel === 1 || rel === 2)) continue; // air behind glass
    put(x, y, z, "stone");
  }
  put(x, R - 1, z, "smooth_stone"); // roof deck
}

// Pass 2: facade cells.
for (const [x, z, gr, rf] of cells) {
  const e = expo(x, z);
  if (!(e.W || e.E || e.N || e.S)) continue;
  const R = roofOf(gr, rf);
  const ex = e.W || e.E;
  const ez = e.N || e.S;
  const corner = ex && ez;
  const floorsHere = FLOORS.filter((f) => f < R - 1);
  const isDoorCell = door && door.x === x && door.z === z;
  const flankDoor = door && e.N && z === door.z && Math.abs(x - door.x) === 1;

  let inDx = 0, inDz = 0;
  if (!corner) {
    if (e.W) inDx = 1; else if (e.E) inDx = -1;
    else if (e.N) inDz = 1; else if (e.S) inDz = -1;
  }

  for (let y = gr; y <= R + 1; y++) {
    // Entrance portal on the street face.
    if (isDoorCell && (y === gr + 1 || y === gr + 2)) {
      put(x, y, z, "dark_oak_door", {
        facing: "north",
        half: y === gr + 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (isDoorCell && y === gr + 3) { put(x, y, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" }); continue; }
    if (flankDoor && y >= gr + 1 && y <= gr + 3) { put(x, y, z, "chiseled_stone_bricks"); continue; }

    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }     // base course
    if (y === R + 1) { put(x, y, z, "smooth_stone_slab", { type: "bottom", waterlogged: "false" }); continue; } // cap
    if (y === R) { put(x, y, z, "calcite"); continue; }           // parapet
    if (y === R - 1) { put(x, y, z, "smooth_stone"); continue; } // cornice
    if (floorsHere.includes(y)) { put(x, y, z, "smooth_stone"); continue; }

    const F = Math.floor(y / 4) * 4;
    const rel = y - F;
    if (rel === 0 || rel === 3) { put(x, y, z, "calcite"); continue; }

    const a = ex ? z : x;
    const isWin = !corner && a % 3 === 1 && (rel === 1 || rel === 2);
    if (!isWin) { put(x, y, z, "calcite"); continue; }

    put(x, y, z, "glass_pane", ex ? PANE_EW : PANE_NS);

    // Warm light in a scattering of windows, just inside the glass.
    if (rel === 1 && !corner) {
      const storey = F / 4;
      if ((a + storey) % 4 === 1) {
        const ix = x + inDx, iz = z + inDz;
        if (inside(ix, iz)) put(ix, y, iz, "glowstone");
      }
    }
  }

  // Rooftop: the parapet reads as one course; no extra blocks on top.
}

g.save(`${DIR}/${ID}.nbt`);
