import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC3001550.cells.json`, "utf8"));
const g = new Voxels([12, 24, 6]);

// Brooklyn Heights 1879 brownstone rowhouse: 4 storeys of 3 blocks, roof about 12 blocks.
const map = new Map();
for (const c of cells) {
  const [x, z, gr, roof] = c;
  if (x < 0 || x > 11 || z < 0 || z > 5) continue;
  map.set(`${x},${z}`, { x, z, gr, roof });
}
const has = (x, z) => map.has(`${x},${z}`);

const diffs = [...map.values()].map(c => c.roof - c.gr).sort((a, b) => a - b);
const med = diffs.length ? diffs[Math.floor(diffs.length / 2)] : 12;
const N = Math.min(6, Math.max(2, Math.round(med / 3)));

const put = (x, y, z, id, p) => {
  if (y < 0 || y > 23 || x < 0 || x > 11 || z < 0 || z > 5) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

const BRICK = "terracotta";       // warm brownstone-toned facade
const BASE = "stone_bricks";      // rusticated base, string courses, cornice
const FLOOR = "smooth_stone";     // interior floor slabs
const ROOF = "smooth_stone";      // roof deck, lighter than tar
const GLASS = "glass_pane";

// Choose the street face: the exposed side (min-z or max-z) with more cells, door nearest x=2.
let frontSide = "N";
let nN = 0, nS = 0;
for (const c of map.values()) {
  if (!has(c.x, c.z - 1)) nN++;
  if (!has(c.x, c.z + 1)) nS++;
}
if (nS > nN) frontSide = "S";
const doorCandidates = [...map.values()].filter(c =>
  frontSide === "N" ? !has(c.x, c.z - 1) : !has(c.x, c.z + 1));
doorCandidates.sort((a, b) => Math.abs(a.x - 2) - Math.abs(b.x - 2));
const doorCell = doorCandidates[0];
const doorKey = doorCell ? `${doorCell.x},${doorCell.z}` : null;
const doorFacing = frontSide === "N" ? "north" : "south";

for (const c of map.values()) {
  const { x, z, gr } = c;
  const top = gr + 3 * N;

  for (let y = 0; y < gr; y++) put(x, y, z, BASE);

  const exN = !has(x, z - 1);
  const exS = !has(x, z + 1);
  const exW = !has(x - 1, z);
  const exE = !has(x + 1, z);
  const edge = exN || exS || exW || exE;
  const corner = (exN || exS) && (exW || exE);

  let idx = 0, inDx = 0, inDz = 0, alongX = false, onEnd = false;
  if (exN) { idx = x; inDz = 1; alongX = true; }
  else if (exS) { idx = x; inDz = -1; alongX = true; }
  else if (exW) { idx = z; inDx = 1; }
  else if (exE) { idx = z; inDx = -1; }
  if (exN || exS) onEnd = false;

  for (let s = 0; s < N; s++) {
    const base = gr + 3 * s;
    put(x, base, z, edge ? BASE : FLOOR);
    if (!edge) continue;

    for (const dy of [1, 2]) {
      const y = base + dy;
      if (corner) { put(x, y, z, BRICK); continue; }

      const isFrontFace = (frontSide === "N" && exN) || (frontSide === "S" && exS);
      const isDoor = isFrontFace && `${x},${z}` === doorKey && s === 0;
      if (isDoor) {
        const half = dy === 1 ? "lower" : "upper";
        put(x, y, z, "dark_oak_door", { facing: doorFacing, half, hinge: "left", open: "false", powered: "false" });
        continue;
      }

      const win = idx % 3 !== 0 && idx > 0 && !(alongX ? x === 11 : z === 5);
      if (win) {
        const p = alongX
          ? { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, GLASS, p);
      } else {
        put(x, y, z, BRICK);
      }
    }

    // Warm light behind some windows.
    if (idx % 3 !== 0 && idx > 0 && ((idx + s) % 4 === 1) && (inDx || inDz) && has(x + inDx, z + inDz)) {
      put(x + inDx, base + 1, z + inDz, "glowstone");
    }
  }

  // Cornice, roof deck, parapet.
  if (edge) {
    put(x, top, z, BASE);
    put(x, top + 1, z, "stone_brick_slab", { type: "bottom", waterlogged: "false" });
  } else {
    put(x, top, z, ROOF);
  }
}

// Entrance hood over the door: a dark oak slab canopy on the outside of the door line,
// and a lantern beside the door on the storey line.
if (doorCell) {
  const { x, z, gr } = doorCell;
  put(x, gr + 3, z, "dark_oak_slab", { type: "bottom", waterlogged: "false" });
  // Lantern on the wall next to the door (the neighbouring front cell, if present).
  const side = [[x - 1, z], [x + 1, z]].find(([nx, nz]) => has(nx, nz) && (frontSide === "N" ? !has(nx, nz - 1) : !has(nx, nz + 1)));
  if (side) put(side[0], gr + 2, side[1], "lantern", { hanging: "false", waterlogged: "false" });
}

// Chimney stack on the roof.
if (has(9, 1)) {
  const c = map.get("9,1");
  const top = c.gr + 3 * N;
  for (let y = top + 1; y <= top + 3; y++) put(9, y, 1, "bricks");
  put(9, top + 4, 1, "stone_brick_slab", { type: "top", waterlogged: "false" });
}

g.save(`${DIR}/NYC3001550.nbt`);
