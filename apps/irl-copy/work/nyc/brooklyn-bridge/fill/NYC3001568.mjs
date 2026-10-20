import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 30 Middagh Street, Brooklyn Heights: c.1824 Federal-style two-family rowhouse.
// Brick shell on a stone base course, stone lintels and sills, flat stone cornice,
// one central entrance on the street (z-min) face, sash windows in 2-block storeys.
// Interior cells are solid (no floating floor slabs); the shell carries the facade.
const dir = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${dir}/NYC3001568.cells.json`, "utf8"));

const W = 6, H = 21, D = 8;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
let minX = Infinity, maxX = -Infinity, minZ = Infinity, maxZ = -Infinity;
for (const [x, z, gr, roof] of cells) {
  const ground = Math.round(gr);
  // Two-family rowhouse: about four storeys of two blocks plus a cornice.
  const topEx = Math.min(Math.max(Math.round(roof), ground + 4), 19);
  map.set(key(x, z), { gr: ground, topEx });
  minX = Math.min(minX, x); maxX = Math.max(maxX, x);
  minZ = Math.min(minZ, z); maxZ = Math.max(maxZ, z);
}

const put = (x, y, z, id, props) => {
  if (y < 0 || y >= H) return;
  if (props) g.set(x, y, z, id, props);
  else g.set(x, y, z, id);
};

const missing = (x, z) => ({
  n: !map.has(key(x, z - 1)), // street (z-min) face
  s: !map.has(key(x, z + 1)),
  w: !map.has(key(x - 1, z)),
  e: !map.has(key(x + 1, z)),
});

for (const [x, z] of cells) {
  const { gr, topEx } = map.get(key(x, z));
  const n = topEx - gr;

  // Foundation: solid from y0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const f = missing(x, z);
  const faceCount = (f.n ? 1 : 0) + (f.s ? 1 : 0) + (f.w ? 1 : 0) + (f.e ? 1 : 0);

  // Facade role for single-face cells.
  let face = null, j = 0, L = 1, front = false, zFace = false;
  if (faceCount === 1) {
    if (f.n || f.s) {
      zFace = true;
      j = x - minX;
      L = maxX - minX + 1;
      front = f.n;
      face = f.n ? "n" : "s";
    } else {
      zFace = false;
      j = z - minZ;
      L = maxZ - minZ + 1;
      face = f.w ? "w" : "e";
    }
  }
  const isWin = j >= 1 && j <= L - 2 && j % 2 === 1;
  const dj = Math.floor((L - 1) / 2);
  const isDoorCol = front && j === dj;
  const sideIdx = { n: 0, s: 1, w: 2, e: 3 }[face] ?? 0;

  for (let o = 0; o < n; o++) {
    const y = gr + o;

    // Base course and cornice on every cell.
    if (o === 0) { put(x, y, z, "stone_bricks"); continue; }
    if (o === n - 1) { put(x, y, z, "smooth_stone"); continue; }

    // Interior: solid mass with floors carried by the fill.
    if (faceCount === 0) { put(x, y, z, "stone"); continue; }

    // Corner piers.
    if (faceCount >= 2) { put(x, y, z, "brick"); continue; }

    // Entrance: two-block oak door on the street face.
    if (isDoorCol && o === 1) {
      put(x, y, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
      continue;
    }
    if (isDoorCol && o === 2) {
      put(x, y, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
      continue;
    }

    if (o % 2 === 1) {
      if (isWin) {
        const floor = (o - 1) >> 1;
        const lit = (floor + j + sideIdx) % 3 === 0;
        const id = lit ? "yellow_stained_glass_pane" : "glass_pane";
        const props = zFace
          ? { east: "true", west: "true", north: "false", south: "false", waterlogged: "false" }
          : { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };
        put(x, y, z, id, props);
      } else {
        put(x, y, z, "brick");
      }
    } else {
      // Spandrel row: stone lintels and sills at window columns.
      put(x, y, z, isWin ? "stone_bricks" : "brick");
    }
  }
}

// Brick chimney on the roof of a rear cell, if present.
const chim = cells.find(([x, z]) => x === minX + 1 && z === maxZ - 1);
if (chim) {
  const { topEx } = map.get(key(chim[0], chim[1]));
  put(chim[0], topEx, chim[1], "brick");
  put(chim[0], topEx + 1, chim[1], "brick");
  put(chim[0], topEx + 2, chim[1], "stone_brick_slab", { type: "bottom", waterlogged: "false" });
}

g.save(`${dir}/NYC3001568.nbt`);
