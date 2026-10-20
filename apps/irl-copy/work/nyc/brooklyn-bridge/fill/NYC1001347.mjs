import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const cells = JSON.parse(readFileSync(`${DIR}/NYC1001347.cells.json`, "utf8"));

const W = 9, H = 26, D = 16;
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const map = new Map();
for (const c of cells) {
  const x = c[0], z = c[1];
  const gr = Math.max(0, Math.round(c[2]));
  const r = Math.round(c[3]);
  const top = Math.min(H - 2, Math.max(gr + 6, Math.round(r / 2) * 2));
  map.set(key(x, z), { gr, top });
}
const has = (x, z) => map.has(key(x, z));

const normals = [[0, -1], [0, 1], [-1, 0], [1, 0]];
function faceOf(x, z) {
  for (const [dx, dz] of normals) if (!has(x + dx, z + dz)) return [dx, dz];
  return null;
}

// Main entrance on the -z face, centred along x
const frontXs = [];
for (const k of map.keys()) {
  const [x, z] = k.split(",").map(Number);
  const f = faceOf(x, z);
  if (f && f[0] === 0 && f[1] === -1) frontXs.push(x);
}
let doorX = null;
if (frontXs.length) {
  const mid = Math.round((Math.min(...frontXs) + Math.max(...frontXs)) / 2);
  doorX = frontXs.includes(mid) ? mid : frontXs[0];
}

const brick = "bricks";
const stone = "stone_bricks";
const deck = "smooth_stone";
const found = "stone_bricks";
const glazing = "gray_stained_glass_pane";

for (const [k, { gr, top }] of map) {
  const [x, z] = k.split(",").map(Number);
  const face = faceOf(x, z);
  const exterior = face !== null;

  const floors = [];
  for (let y = gr; y + 2 <= top - 2; y += 3) floors.push(y);
  const floorOf = (y) => {
    let f = null;
    for (const fl of floors) if (fl <= y) f = fl;
    return f;
  };
  const floorIndex = (f) => floors.indexOf(f);

  // Foundation up to ground
  for (let y = 0; y < gr; y++) g.set(x, y, z, found);

  // Floor slabs and roof deck
  for (const fl of floors) g.set(x, fl, z, exterior ? stone : deck);
  g.set(x, top - 1, z, exterior ? stone : deck);

  if (!exterior) continue;

  // Parapet cap and cornice course
  g.set(x, top, z, brick);
  if (top - 2 > gr && !floors.includes(top - 2)) g.set(x, top - 2, z, stone);

  let i;
  if (face[1] !== 0) i = x; else i = z;
  const bay = i % 4;
  const isWindowCol = bay === 1 || bay === 2;

  for (let y = gr; y < top - 1; y++) {
    const f = floorOf(y);
    if (f === null) continue;
    if (floors.includes(y)) continue;
    const band = y - f;
    if (band < 1 || band > 2) continue;
    if (y === top - 2) continue; // cornice course already set

    g.set(x, y, z, brick);

    if (isWindowCol) {
      g.set(x, y, z, glazing);
      const inX = x - face[0], inZ = z - face[1];
      const lit = ((i + floorIndex(f)) % 4 === 1) && band === 1;
      if (lit && has(inX, inZ)) {
        const interior = normals.every(([dx, dz]) => has(inX + dx, inZ + dz));
        if (interior) g.set(inX, y, inZ, "glowstone");
      }
    }
  }

  // Entrance: stone surround, oak door, lantern
  if (face[0] === 0 && face[1] === -1 && x === doorX && gr + 2 < top - 2) {
    g.set(x, gr + 1, z, "oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
    g.set(x, gr + 2, z, "oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
    for (const px of [x - 1, x + 1]) {
      if (has(px, z)) g.set(px, gr + 3, z, stone);
    }
    if (has(x - 1, z)) g.set(x - 1, gr + 2, z, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/NYC1001347.nbt`);
