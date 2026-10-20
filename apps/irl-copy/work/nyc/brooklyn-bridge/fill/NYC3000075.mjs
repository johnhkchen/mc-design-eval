import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const CELLS = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000075.cells.json";
const OUT = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill/NYC3000075.nbt";

const cells = JSON.parse(readFileSync(CELLS, "utf8"));
const W = 6, H = 23, D = 23;
const g = new Voxels([W, H, D]);

// 1839 Federal / Greek Revival brick rowhouse with ground-floor commercial frontage.
const K = (x, z) => x + "," + z;
const map = new Map();
for (const [x, z, gr, rf] of cells) {
  const ground = Math.max(0, Math.round(gr));
  const roof = Math.min(H - 1, Math.max(ground + 4, Math.round(rf)));
  map.set(K(x, z), { ground, roof });
}
const has = (x, z) => map.has(K(x, z));
const faces = (x, z) => {
  const f = [];
  if (!has(x, z - 1)) f.push({ dx: 0, dz: -1, name: "north" });
  if (!has(x, z + 1)) f.push({ dx: 0, dz: 1, name: "south" });
  if (!has(x - 1, z)) f.push({ dx: -1, dz: 0, name: "west" });
  if (!has(x + 1, z)) f.push({ dx: 1, dz: 0, name: "east" });
  return f;
};
const isPerim = (x, z) => faces(x, z).length > 0;
const isCorner = (x, z) => faces(x, z).length >= 2 ||
  (faces(x, z).length === 1 && !has(x - 1, z) && !has(x + 1, z) && false);
// window bays: piers at every third bay along each face
const bayOk = (x, z, f) => ((f.dz !== 0 ? x : z) % 3) !== 0;

const cellList = [...map.keys()].map(k => k.split(",").map(Number));

// 1. foundations, walls, storey lines, cornice, roof cap, quoins
for (const [x, z] of cellList) {
  const { ground: gr, roof } = map.get(K(x, z));
  const perim = isPerim(x, z);
  const fc = faces(x, z);
  const corner = fc.length >= 2;

  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  if (perim) {
    for (let y = gr; y < roof; y++) {
      // quoins: alternating stone blocks on corner columns
      if (corner && y > gr + 2 && y % 2 === 0) g.set(x, y, z, "stone_bricks");
      else g.set(x, y, z, "bricks");
    }
  }

  const fls = [...new Set([gr + 3, gr + 5, gr + 7, roof - 2])]
    .filter(f => f > gr && f <= roof - 2);
  for (const fl of fls) {
    g.set(x, fl, z, perim ? "smooth_stone" : "oak_planks");
  }

  if (perim) {
    // projecting cornice band with a dentil course under the parapet
    g.set(x, roof - 2, z, "smooth_stone");
    g.set(x, roof - 1, z, (x + z) % 2 === 0 ? "stone_bricks" : "bricks");
  } else {
    g.set(x, roof - 1, z, "stone");
  }

  // ground storey: kickplate and stone fascia under the storefront
  if (perim) {
    g.set(x, gr, z, "stone_bricks");
    if (roof - 2 > gr + 2) g.set(x, gr + 2, z, "polished_andesite");
  }
}

// 2. chimneys / roof equipment on interior roof cap
for (const [x, z] of cellList) {
  const { roof } = map.get(K(x, z));
  if (isPerim(x, z)) continue;
  if ((x * 3 + z * 5) % 11 === 0 && roof + 2 < H) {
    g.set(x, roof, z, "bricks");
    g.set(x, roof + 1, z, "bricks");
  }
}

// 3. windows with stone sills, and warm light behind some panes
for (const [x, z] of cellList) {
  const { ground: gr, roof } = map.get(K(x, z));
  if (!isPerim(x, z)) continue;
  const fc = faces(x, z);

  // storefront glass on the ground floor
  if (fc.some(f => bayOk(x, z, f))) {
    g.set(x, gr + 1, z, "glass");
  }

  // upper storeys
  const fls = [gr + 3, gr + 5, gr + 7].filter(f => f < roof - 2 && f + 1 <= roof - 3);
  for (const fl of fls) {
    if (!fc.some(f => bayOk(x, z, f))) continue;
    g.set(x, fl + 1, z, "glass");
    const f0 = fc.find(f => bayOk(x, z, f));
    const nx = x - f0.dx, nz = z - f0.dz;
    // sparse lamps in some rooms, placed one storey back from the glass
    if (has(nx, nz) && !isPerim(nx, nz) && ((x * 5 + z * 7 + fl) % 7 === 0)) {
      g.set(nx, fl + 1, nz, "lantern", { hanging: "false", waterlogged: "false" });
    }
  }
}

// 4. entrance on the lowest-z street face (toward -z), else any face
const sorted = [...cellList].sort((a, b) => a[1] - b[1] || a[0] - b[0]);
let doorCell = null, doorFace = null;
for (const [x, z] of sorted) {
  if (!isPerim(x, z)) continue;
  const f = faces(x, z).find(ff => ff.dz === -1);
  if (f) { doorCell = [x, z]; doorFace = f; break; }
}
if (!doorCell) {
  for (const [x, z] of sorted) {
    if (!isPerim(x, z)) continue;
    doorCell = [x, z]; doorFace = faces(x, z)[0]; break;
  }
}
if (doorCell) {
  const [x, z] = doorCell;
  const { ground: gr } = map.get(K(x, z));
  g.set(x, gr, z, "oak_door", { facing: doorFace.name, half: "lower", hinge: "left", open: "false", powered: "false" });
  g.set(x, gr + 1, z, "oak_door", { facing: doorFace.name, half: "upper", hinge: "left", open: "false", powered: "false" });
}

g.save(OUT);
