import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// Mid-rise Taipei commercial block (c. 1980s-90s): granite base, white-tile
// piers, glazed bays with storey lines, flat roof, parapet and rooftop plant.
// Lowest ground is y 0; flat roof slab at y 25, parapet to 27, plant to 33.

const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const cells = JSON.parse(readFileSync(`${DIR}/OSMw1042397474.cells.json`, "utf8"));

const W = 22, H = 38, D = 17;
const ROOF = 25;       // roof slab y
const PARAPET = 27;    // top of parapet
const g = new Voxels([W, H, D]);

const key = (x, z) => `${x},${z}`;
const ground = new Map();
for (const [x, z, gr] of cells) {
  ground.set(key(x, z), Math.min(ROOF - 1, Math.max(0, Math.round(gr))));
}
const has = (x, z) => ground.has(key(x, z));
const exposed = (x, z) => ({
  n: !has(x, z - 1), s: !has(x, z + 1),
  w: !has(x - 1, z), e: !has(x + 1, z),
});
const isEdge = (x, z) => {
  const e = exposed(x, z);
  return e.n || e.s || e.w || e.e;
};

const put = (x, y, z, block, props) => {
  if (x < 0 || z < 0 || x >= W || z >= D || y < 0 || y >= H) return;
  if (props) g.set(x, y, z, block, props);
  else g.set(x, y, z, block);
};

// Entrance: edge cell on a north or south face nearest the middle of the block.
let entrance = null;
{
  let best = Infinity;
  for (const [k, gr] of ground) {
    const [x, z] = k.split(",").map(Number);
    const e = exposed(x, z);
    if (!(e.n || e.s)) continue;
    const d = Math.abs(x - W / 2) + (e.n ? 0 : 0.5);
    if (d < best) { best = d; entrance = { x, z, gr, face: e.n ? "north" : "south" }; }
  }
  if (!entrance) {
    for (const [k, gr] of ground) {
      const [x, z] = k.split(",").map(Number);
      const e = exposed(x, z);
      if (e.w || e.e) { entrance = { x, z, gr, face: e.w ? "west" : "east" }; break; }
    }
  }
}
const isEntrance = (x, z) => entrance && entrance.x === x && entrance.z === z;

// 1. Foundations: solid from y 0 up to each cell's ground.
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  for (let y = 0; y < gr; y++) put(x, y, z, "stone");
}

// 2. Shell, floors, roof, parapet and glowstone light placement.
const lightCells = [];
for (const [k, gr] of ground) {
  const [x, z] = k.split(",").map(Number);
  const ex = exposed(x, z);
  const edge = isEdge(x, z);
  const useZAxis = ex.n || ex.s;                 // north/south faces: bays run along x
  const u = useZAxis ? x : z;
  const corner = (ex.n || ex.s) && (ex.w || ex.e);
  const pier = corner || (u % 3 === 0);

  for (let y = gr; y <= 29; y++) {
    const k5 = Math.floor(y / 5);
    const r = y % 5;

    // Roof surface across the whole footprint.
    if (y === ROOF) { put(x, y, z, "light_gray_concrete"); continue; }

    if (!edge) {
      // Interior: air gap, with a floor slab per storey.
      if (y < ROOF && y > 0 && y % 5 === 0) put(x, y, z, "light_gray_concrete");
      continue;
    }

    // Exterior shell.
    if (y < ROOF) {
      if (k5 === 0) {
        if (y === gr) put(x, y, z, "polished_granite");
        else if (r === 4) put(x, y, z, "smooth_quartz");
        else put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      } else {
        if (r === 0) put(x, y, z, "smooth_quartz");
        else if (r === 4) put(x, y, z, "white_concrete");
        else put(x, y, z, pier ? "white_concrete" : "light_blue_stained_glass");
      }
    } else if (y === 26) {
      put(x, y, z, "white_concrete");
    } else if (y === PARAPET) {
      put(x, y, z, "smooth_quartz");
    }

    // Warm light behind some window glass, in the interior cell.
    if (!edge || y >= ROOF) continue;
    if (k5 >= 0 && r === 2 && !pier && !isEntrance(x, z) && (u + k5) % 4 === 0) {
      let dx = 0, dz = 0;
      if (ex.n) dz = 1; else if (ex.s) dz = -1;
      else if (ex.w) dx = 1; else if (ex.e) dx = -1;
      const ix = x + dx, iz = z + dz;
      if (has(ix, iz) && !isEdge(ix, iz)) lightCells.push([ix, y, iz]);
    }
  }
}

for (const [x, y, z] of lightCells) put(x, y, z, "glowstone");

// 3. Entrance: double door with glazed transom above.
if (entrance) {
  const { x, z, gr, face } = entrance;
  const props = { facing: face, hinge: "left", open: "false", powered: "false" };
  put(x, gr, z, "dark_oak_door", { ...props, half: "lower" });
  put(x, gr + 1, z, "dark_oak_door", { ...props, half: "upper" });
  put(x, gr + 2, z, "light_blue_stained_glass");
  put(x, gr + 3, z, "light_blue_stained_glass");
  put(x, gr + 4, z, "smooth_quartz");
}

// 4. Rooftop plant room with louvred parapet walls, roof and lightning rod.
const PX0 = 7, PX1 = 14, PZ0 = 5, PZ1 = 11;
for (let x = PX0; x <= PX1; x++) {
  for (let z = PZ0; z <= PZ1; z++) {
    if (!has(x, z)) continue;
    const perim = x === PX0 || x === PX1 || z === PZ0 || z === PZ1;
    for (let y = 26; y <= 28; y++) {
      if (perim) {
        const louvre = (x + z + y) % 2 === 0 && y === 27;
        put(x, y, z, louvre ? "iron_bars" : "light_gray_concrete");
      }
    }
    put(x, 29, z, "smooth_stone");
  }
}
const mx = Math.round((PX0 + PX1) / 2), mz = Math.round((PZ0 + PZ1) / 2);
if (has(mx, mz)) {
  for (let y = 30; y <= 33; y++) put(mx, y, mz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
}

g.save(`${DIR}/OSMw1042397474.nbt`);
