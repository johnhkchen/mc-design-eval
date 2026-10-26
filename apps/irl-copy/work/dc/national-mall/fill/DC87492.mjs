import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/dc/national-mall/fill";
const cells = JSON.parse(readFileSync(`${DIR}/DC87492.cells.json`, "utf8"));

const W = 16, H = 27, D = 16;
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// footprint lookup
const map = new Map();
for (const c of cells) map.set(`${c[0]},${c[1]}`, c);
const has = (x, z) => map.has(`${x},${z}`);

// distance from a footprint cell to the nearest missing position (1 = wall cell)
const distOf = (x, z) => {
  let best = 99;
  for (let a = -1; a <= W; a++) for (let b = -1; b <= D; b++) {
    if (!has(a, b)) best = Math.min(best, Math.abs(x - a) + Math.abs(z - b));
  }
  return best;
};

// entrance: middle of the street-facing (lowest z) row
const zMin = Math.min(...cells.map(c => c[1]));
const front = cells.filter(c => c[1] === zMin);
const xs = front.map(c => c[0]);
const midX = (Math.min(...xs) + Math.max(...xs)) / 2;
const entrance = front.reduce((best, c) => Math.abs(c[0] - midX) < Math.abs(best[0] - midX) ? c : best);
const [ex, ez] = entrance;

// Vacant brick commercial block, c. 1910s: stone base, brick walls with stone lintel
// bands each storey, parapet with stone cornice. 3 blocks per storey, air gap behind
// the glass, solid core inside, floor slabs on the ring between.
for (const [x, z, grRaw, roofRaw] of cells) {
  const gr = Math.round(grRaw);
  // smooth lidar roof into whole storeys above this cell's ground
  const n = Math.max(1, Math.round((Math.round(roofRaw) - gr) / 3));
  const top = Math.min(H - 1, gr + 3 * n);

  // foundation from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const d = distOf(x, z);

  // deep core: solid mass carrying the floors
  if (d >= 3) {
    for (let y = gr; y < top; y++) put(x, y, z, y === top - 1 ? "stone_bricks" : "stone");
    continue;
  }

  // inner ring: one air gap, floor slab per storey, roof cap
  if (d === 2) {
    for (let y = gr; y < top; y++) {
      if ((y - gr) % 3 === 0 || y === top - 1) put(x, y, z, "smooth_stone");
    }
    continue;
  }

  // wall cell (d === 1): facade
  const edgeZ = !has(x, z - 1) || !has(x, z + 1);
  const idx = edgeZ ? x : z;
  const pier = idx === 0 || idx === W - 1;
  const winCol = (k) => (k === 0 ? !pier : !pier && (idx % 4 === 1 || idx % 4 === 2));
  const isEntrance = x === ex && z === ez;

  for (let y = gr; y < top; y++) {
    const k = Math.floor((y - gr) / 3);
    const rel = (y - gr) % 3;

    // parapet and cornice
    if (y === top - 1) { put(x, y, z, "stone_bricks"); continue; }
    if (y === top - 2) { put(x, y, z, "bricks"); continue; }

    // street entrance, recessed in the ground storey
    if (k === 0 && isEntrance) {
      if (rel === 0) { put(x, y, z, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" }); continue; }
      if (rel === 1) { put(x, y, z, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" }); continue; }
      put(x, y, z, "glass_pane", { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" });
      continue;
    }

    if (rel === 0) {
      put(x, y, z, k === 0 ? "stone_bricks" : "bricks");
      continue;
    }
    if (rel === 2) {
      put(x, y, z, "stone_bricks");
      continue;
    }

    // rel === 1: window row
    if (!winCol(k)) { put(x, y, z, "bricks"); continue; }

    // vacancy: some upper windows boarded, a few lit
    const boarded = k >= 1 && (idx + k * 3 + (edgeZ ? 0 : 5)) % 7 === 0;
    if (boarded) { put(x, y, z, "spruce_planks"); continue; }
    const lit = k >= 1 && (idx * 3 + k * 5 + x + z) % 13 === 0;
    if (lit) { put(x, y, z, "glowstone"); continue; }

    const paneProps = edgeZ
      ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
      : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
    put(x, y, z, "glass_pane", paneProps);
  }
}

g.save(`${DIR}/DC87492.nbt`);
