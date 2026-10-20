import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw1153980394";
const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));

const W = 15, H = 23, D = 27;
const TOP = 11;          // parapet top, about 11 blocks above lowest ground
const CORNICE = [5, 10]; // storey lines / cornice bands

const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, Math.max(0, Math.round(gr)));
const has = (x, z) => G.has(`${x},${z}`);
const gAt = (x, z) => G.get(`${x},${z}`);

// Exterior faces of a footprint cell: [dx, dz] pointing out of the footprint.
function outwardOf(x, z) {
  const o = [];
  if (!has(x + 1, z)) o.push([1, 0]);
  if (!has(x - 1, z)) o.push([-1, 0]);
  if (!has(x, z + 1)) o.push([0, 1]);   // +z = south
  if (!has(x, z - 1)) o.push([0, -1]);  // -z = north
  return o;
}

// Main entrance: the middle cell of the south (+z) street face.
const southCells = cells
  .filter(([x, z]) => outwardOf(x, z).some(([dx, dz]) => dz === 1))
  .map(([x, z]) => x)
  .sort((a, b) => a - b);
const doorX = southCells.length ? southCells[Math.floor(southCells.length / 2)] : null;
const doorZ = doorX === null ? null : cells.find(([x, z]) => x === doorX && !has(x, z + 1))?.[1];

const g = new Voxels([W, H, D]);

// Perimeter facade block at height y (or null for air).
function facade(x, z, y, gr, outs) {
  if (y === gr) return ["stone_bricks", {}];
  if (y === TOP) return ["white_concrete", {}];
  if (CORNICE.includes(y)) return ["smooth_stone", {}];
  const isSouth = outs.some(([dx, dz]) => dz === 1);
  const pier =
    outs.length > 1 ||
    outs.some(([dx, dz]) => (dz !== 0 ? x % 3 === 0 : z % 3 === 0));
  // Shopfront on the south street face, ground storey only.
  if (isSouth && y <= gr + 2 && y > gr) {
    if (x === doorX && z === doorZ) {
      if (y === gr + 1) return ["dark_oak_door", { facing: "south", half: "lower", hinge: "left", open: "false", powered: "false" }];
      if (y === gr + 2) return ["dark_oak_door", { facing: "south", half: "upper", hinge: "left", open: "false", powered: "false" }];
    }
    if (!pier) return ["cyan_stained_glass", {}];
  }
  if (pier) return ["white_concrete", {}];
  return ["light_blue_stained_glass", {}];
}

for (const [x, z, gr0] of cells) {
  if (x < 0 || x >= W || z < 0 || z >= D) continue;
  const gr = gAt(x, z);
  const outs = outwardOf(x, z);
  const perim = outs.length > 0;

  // Foundation: solid from y 0 up to the cell's ground.
  for (let y = 0; y < gr; y++) g.set(x, y, z, "stone_bricks");

  const body = Math.min(gr, TOP - 1); // guard against ground above the body
  const top = body === gr ? TOP : body;

  if (perim) {
    for (let y = gr; y <= TOP && y < H; y++) {
      const [id, props] = facade(x, z, y, gr, outs);
      if (y === top && y !== TOP && !CORNICE.includes(y) && y !== gr) {
        // body top beyond ground: no-op, handled by full loop below
      }
      if (props && Object.keys(props).length) g.set(x, y, z, id, props);
      else g.set(x, y, z, id);
    }
  } else {
    // Interior: floor slabs at ground, storey line 5 and roof slab 10. Air otherwise.
    const levels = new Set([gr, 5, 10].filter((lv) => lv >= gr && lv <= 10));
    for (const lv of levels) g.set(x, lv, z, "light_gray_concrete");
  }
}

// Window-behind lights and roof equipment (second pass so ordering is clean).
for (const [x, z] of cells) {
  const gr = gAt(x, z);
  const outs = outwardOf(x, z);

  if (outs.length === 1) {
    const [dx, dz] = outs[0];
    const pier = dz !== 0 ? x % 3 === 0 : z % 3 === 0;
    const ix = x - dx, iz = z - dz;
    // Warm glow behind some second-storey windows.
    if (!pier && has(ix, iz) && outwardOf(ix, iz).length === 0 && (x + z) % 4 === 0 && gr < 7) {
      g.set(ix, 7, iz, "glowstone");
    }
  }

  // Roof plant on interior roof cells, sitting on the roof slab at y 10.
  if (outs.length === 0 && (x * 3 + z) % 7 === 0 && gr <= 10) {
    g.set(x, 11, z, "smooth_quartz");
  }
}

g.save(`${DIR}/${ID}.nbt`);
