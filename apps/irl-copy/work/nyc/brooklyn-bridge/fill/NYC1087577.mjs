import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 24 Peck Slip, South Street Seaport: 2004 mixed-use infill in brick with stone trim.
// Lower storey: shopfronts with a sign band. Above: red brick piers, stone belt
// courses at each floor, glass windows, stone cornice and a gravel roof.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC1087577";
const W = 6, H = 31, D = 22;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, block, props) => {
  if (x < 0 || y < 0 || z < 0 || x >= W || y >= H || z >= D) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

const K = (x, z) => `${x},${z}`;
const cellMap = new Map();
for (const c of cells) {
  const [x, z, gr, rf] = c;
  cellMap.set(K(x, z), { gr: Math.round(gr), rf: Math.round(rf) });
}
const has = (x, z) => cellMap.has(K(x, z));

// Flat roof tier: smooth lidar noise to the footprint median roof height.
const rfs = [...cellMap.values()].map((c) => c.rf).sort((a, b) => a - b);
const T = Math.min(H - 3, rfs[Math.floor(rfs.length / 2)]);

// Per-cell parameters: ground, top (exclusive), storey belt rows.
const info = new Map();
for (const [key, c] of cellMap) {
  const top = Math.min(H - 3, Math.max(T, c.gr + 9));
  const belts = new Set();
  // Ground storey is 4 high; upper storeys pitch 3 (belt, two window rows).
  for (let L = c.gr + 4; L + 2 <= top - 3; L += 3) belts.add(L);
  info.set(key, { gr: c.gr, top, belts });
}

// Entrance: on the lowest-z street face, near x=1.
let zMin = Infinity;
for (const k of cellMap.keys()) zMin = Math.min(zMin, Number(k.split(",")[1]));
let doorX = 1;
if (!has(1, zMin)) {
  for (const k of cellMap.keys()) {
    const [x, z] = k.split(",").map(Number);
    if (z === zMin) { doorX = x; break; }
  }
}
const doorZ = zMin;
const doorFacing = doorZ === 0 ? "north" : "south";

for (const [key, c] of info) {
  const [x, z] = key.split(",").map(Number);
  const { gr, top, belts } = c;

  // Foundation from y 0 up to this cell's ground.
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  const exX = !has(x - 1, z) || !has(x + 1, z);
  const exZ = !has(x, z - 1) || !has(x, z + 1);
  const perim = exX || exZ;

  if (!perim) {
    // Interior: floor slabs only, air between, gravel roof.
    put(x, gr, z, "smooth_stone");
    for (const L of belts) put(x, L, z, "smooth_stone");
    put(x, top - 1, z, "gravel");
    // A few rooftop plant boxes, kept sparse so the roofline stays calm.
    if (x === 2 && z % 7 === 3) {
      put(x, top, z, "stone_bricks");
      put(x, top + 1, z, "chiseled_stone_bricks");
    }
    continue;
  }

  // Corners and every third bay on the faces are brick piers.
  const pier = exX && exZ
    ? true
    : exX
      ? z % 3 === 0
      : (x === 0 || x === 5 || x % 3 === 0);
  const glassProps = exX
    ? { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" }
    : { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };

  for (let y = gr; y < top; y++) {
    if (y === gr) { put(x, y, z, "stone_bricks"); continue; }

    if (y <= gr + 3) {
      if (y === gr + 3) {
        // Sign band above the shopfronts, stone-trimmed at the piers.
        put(x, y, z, pier ? "stone_bricks" : "dark_oak_planks");
        continue;
      }
      // Shopfront, with the entrance door at (doorX, doorZ).
      if (x === doorX && z === doorZ) {
        put(x, y, z, "dark_oak_door", {
          facing: doorFacing,
          half: y === gr + 1 ? "lower" : "upper",
          hinge: "left",
          open: "false",
          powered: "false",
        });
        continue;
      }
      if (pier) put(x, y, z, "stone_bricks");
      else put(x, y, z, "glass_pane", glassProps);
      continue;
    }

    // Cornice and roof cap.
    if (y >= top - 2) { put(x, y, z, "smooth_stone"); continue; }

    // Storey belt courses.
    if (belts.has(y)) { put(x, y, z, "smooth_stone"); continue; }

    // Window rows sit between a belt and the next one, below the cornice.
    const isWinRow = (belts.has(y - 1) || belts.has(y - 2)) && y <= top - 3;
    if (isWinRow && !pier) put(x, y, z, "glass_pane", glassProps);
    else put(x, y, z, "bricks");
  }

  // Warm light behind a few upper windows, placed in the room cell inside the glass.
  for (let y = gr + 4; y <= top - 3; y++) {
    if (!belts.has(y - 1) || pier) continue;
    if (((x * 3 + z * 5 + y) % 7) !== 0) continue;
    let ix = x, iz = z;
    if (exX) ix = x === 0 ? 1 : x - 1;
    else iz = z === 0 ? 1 : z - 1;
    const nk = K(ix, iz);
    if (!info.has(nk)) continue;
    if (!info.get(nk).belts.has(y - 1)) continue;
    put(ix, y, iz, "lantern");
  }
}

g.save(`${DIR}/${ID}.nbt`);
