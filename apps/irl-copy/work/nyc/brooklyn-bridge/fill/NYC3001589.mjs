import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/nyc/brooklyn-bridge/fill";
const ID = "NYC3001589";
const W = 9, H = 24, D = 6;

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const g = new Voxels([W, H, D]);

const put = (x, y, z, id, p) => {
  if (x < 0 || x >= W || z < 0 || z >= D || y < 0 || y >= H) return;
  if (p) g.set(x, y, z, id, p);
  else g.set(x, y, z, id);
};

// footprint lookup
const map = new Map();
for (const [x, z, gr, roof] of cells) map.set(`${x},${z}`, { g: gr, r: roof });
const has = (x, z) => map.has(`${x},${z}`);

// one flat roof tier for the whole building: median of lidar roof heights
const roofs = cells.map(c => c[3]).sort((a, b) => a - b);
const TOP = roofs[Math.floor(roofs.length / 2)];

// street face = z-minimum; entrance on the cell nearest the middle
const minZ = Math.min(...cells.map(c => c[1]));
let doorKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    if (z !== minZ) continue;
    if (x === 0 || x === W - 1) continue;
    const d = Math.abs(x - (W - 1) / 2);
    if (d < best) { best = d; doorKey = `${x},${z}`; }
  }
}

// chimney on the interior cell nearest the centre
let chimneyKey = null;
{
  let best = Infinity;
  for (const [x, z] of cells) {
    const perim = !has(x, z - 1) || !has(x, z + 1) || !has(x - 1, z) || !has(x + 1, z);
    if (perim) continue;
    const d = Math.hypot(x - (W - 1) / 2, z - (D - 1) / 2);
    if (d < best) { best = d; chimneyKey = `${x},${z}`; }
  }
}

for (const [x, z, gr] of cells) {
  const R = TOP - gr;                  // rows above this cell's ground to the flat roof
  const N = !has(x, z - 1), S = !has(x, z + 1);
  const Wf = !has(x - 1, z), E = !has(x + 1, z);
  const zFace = N || S, xFace = Wf || E;
  const perim = zFace || xFace;
  const corner = zFace && xFace;
  const doorCell = doorKey === `${x},${z}` && N;

  // foundation: solid from y0 up to this cell's ground
  for (let y = 0; y < gr; y++) put(x, y, z, "stone_bricks");

  for (let r = 0; r < R; r++) {
    const y = gr + r;

    // top cornice and dentil course
    if (r === R - 1) {
      put(x, y, z, perim ? "smooth_sandstone" : "smooth_stone");
      continue;
    }
    if (r === R - 2) {
      if (perim) {
        if (!corner && (x % 2 === 0 || z % 2 === 0)) put(x, y, z, "brown_terracotta");
        else put(x, y, z, "smooth_sandstone");
      }
      continue;
    }
    // plinth course
    if (r === 0) {
      put(x, y, z, perim ? "stone_bricks" : "smooth_stone");
      continue;
    }

    // storeys: k=0 band (string course / lintel / sill), k=1 and k=2 window rows
    const k = (r - 1) % 3;

    // interior: floor slab at each storey line, air otherwise
    if (!perim) {
      if (k === 0) put(x, y, z, "smooth_stone");
      continue;
    }

    // window columns on each face (piers at corners and even bays)
    let win = false;
    if (!corner) {
      if (zFace) win = x % 2 === 1 && x !== 0 && x !== W - 1;
      else if (xFace) win = z % 2 === 1 && z !== 0 && z !== D - 1;
    }

    // entrance: oak door, hood above, lanterns on the flanking piers
    if (doorCell && (r === 1 || r === 2)) {
      put(x, y, z, "oak_door", {
        facing: "south",
        half: r === 1 ? "lower" : "upper",
        hinge: "left",
        open: "false",
        powered: "false",
      });
      continue;
    }
    if (doorCell && r === 3) {
      put(x, y, z, "smooth_sandstone");
      continue;
    }

    if (k === 0) {
      put(x, y, z, "smooth_sandstone");   // continuous band at each floor line
      continue;
    }

    // window rows (k = 1, 2): tall glass between brownstone piers
    if (corner || !win) {
      put(x, y, z, "brown_terracotta");
    } else {
      // warm light in some windows on the upper row
      const lit = k === 2 && (x + z + r) % 4 === 0;
      put(x, y, z, lit ? "glowstone" : "glass");
    }
  }

  // lanterns on the piers flanking the entrance, one block above the door
  if (doorCell) {
    const lanternRow = gr + 2;
    if (x - 1 >= 0 && !(x - 1 === 0)) {
      // handled by neighbour cells below
    }
  }

  // chimney stack on the chosen interior cell
  if (chimneyKey === `${x},${z}`) {
    put(x, TOP, z, "bricks");
    put(x, TOP + 1, z, "bricks");
  }
}

// lanterns beside the door, on the piers either side (hanging from the hood)
if (doorKey) {
  const [dx, dz] = doorKey.split(",").map(Number);
  const cell = map.get(doorKey);
  const gr = cell.g;
  for (const lx of [dx - 1, dx + 1]) {
    if (!has(lx, dz)) continue;
    const pg = map.get(`${lx},${dz}`).g;
    // a lantern sits on the sill course, one block in front of the wall
    put(lx, gr + 1, dz, "lantern", { hanging: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
