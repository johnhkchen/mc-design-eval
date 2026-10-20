import { readFileSync } from "node:fs";
import { Voxels } from "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/src/voxels.mjs";

// 1990s Xinyi-style mid-rise office block: four storeys on a granite plinth,
// white tiled piers, quartz and grey spandrels, blue-tinted glass, flat roof
// with a central plant penthouse and a lightning rod.
const DIR = "/Volumes/ext1/swe/repos/mc-design-eval/apps/irl-copy/work/taipei/xinyi/fill";
const ID = "OSMw587265920";
const W = 32, H = 33, D = 16;
const ROOF = 20;   // roof slab block row (about 21 blocks above lowest ground)
const NS = 4;      // storeys

const cells = JSON.parse(readFileSync(`${DIR}/${ID}.cells.json`, "utf8"));
const G = new Map();
for (const [x, z, gr] of cells) G.set(`${x},${z}`, gr);
const inF = (x, z) => G.has(`${x},${z}`);
const gnd = (x, z) => G.get(`${x},${z}`);

const g = new Voxels([W, H, D]);
const put = (x, y, z, b, p) => {
  if (x < 0 || z < 0 || y < 0 || x >= W || z >= D || y >= H) return;
  if (p) g.set(x, y, z, b, p);
  else g.set(x, y, z, b);
};

const edges = (x, z) => ({
  N: !inF(x, z - 1), S: !inF(x, z + 1), W: !inF(x - 1, z), E: !inF(x + 1, z),
});
const isPerim = (x, z) => {
  const e = edges(x, z);
  return e.N || e.S || e.W || e.E;
};

const xs = cells.map(c => c[0]), zs = cells.map(c => c[1]);
const minX = Math.min(...xs), maxX = Math.max(...xs);
const minZ = Math.min(...zs), maxZ = Math.max(...zs);
const cx = (minX + maxX) / 2, cz = (minZ + maxZ) / 2;

// Floor rows per cell: storeys stand on their own ground and meet the roof level.
const floorRow = (gc, s) => {
  if (s >= NS) return ROOF;
  return Math.round(gc + (ROOF - gc) * s / NS);
};

const GLASS_NS = { north: "false", south: "false", east: "true", west: "true", waterlogged: "false" };
const GLASS_EW = { north: "true", south: "true", east: "false", west: "false", waterlogged: "false" };

// Pass 1: foundations, plinth, floors, walls, roof, parapet
for (const [x, z, gc] of cells) {
  const e = edges(x, z);
  const per = e.N || e.S || e.W || e.E;
  const corner = [e.N, e.S, e.W, e.E].filter(Boolean).length >= 2;
  const alongX = e.N || e.S;           // facade runs east-west
  const bay = alongX ? x : z;
  const base = alongX ? minX : minZ;
  const pier = corner || (((bay - base) % 3) === 0);
  const glassProps = alongX ? GLASS_NS : GLASS_EW;

  // Foundation below ground
  for (let y = 0; y < gc; y++) put(x, y, z, "stone_bricks");

  for (let s = 0; s < NS; s++) {
    const f0 = floorRow(gc, s), f1 = floorRow(gc, s + 1);
    // Floor slab / string course at storey base
    if (per) {
      put(x, f0, z, s === 0 ? "polished_granite" : "smooth_quartz");
    } else {
      put(x, f0, z, "smooth_stone");
    }
    if (!per) continue;
    // Wall rows: windows and piers, spandrel at top of storey
    for (let y = f0 + 1; y <= f1 - 1; y++) {
      if (y === f1 - 1) {
        put(x, y, z, "light_gray_concrete");
      } else if (pier) {
        put(x, y, z, s === 0 ? "polished_granite" : "white_concrete");
      } else {
        put(x, y, z, "light_blue_stained_glass_pane", glassProps);
      }
    }
  }

  // Roof slab and parapet
  if (per) {
    put(x, ROOF, z, "smooth_quartz");
    put(x, ROOF + 1, z, "white_concrete");
  } else {
    put(x, ROOF, z, "light_gray_concrete");
  }
}

// Pass 2: lit windows (glowstone behind glass in interior cell)
for (const [x, z, gc] of cells) {
  const e = edges(x, z);
  if (!(e.N || e.S || e.W || e.E)) continue;
  const alongX = e.N || e.S;
  const bay = alongX ? x : z;
  const base = alongX ? minX : minZ;
  const corner = [e.N, e.S, e.W, e.E].filter(Boolean).length >= 2;
  if (corner || (((bay - base) % 3) === 0)) continue;

  let ix = x, iz = z;
  if (e.N) iz = z + 1;
  else if (e.S) iz = z - 1;
  else if (e.W) ix = x + 1;
  else if (e.E) ix = x - 1;
  if (!inF(ix, iz) || isPerim(ix, iz)) continue;

  for (let s = 0; s < NS; s++) {
    const f0 = floorRow(gc, s), f1 = floorRow(gc, s + 1);
    for (let y = f0 + 2; y <= f1 - 2; y++) {
      if (((x * 7 + z * 13 + y * 5) % 11) === 0) {
        put(ix, y, iz, "glowstone");
      }
    }
  }
}

// Pass 3: entrance on the front (north, -z) face, centred
const front = cells.filter(([x, z]) => edges(x, z).N).map(c => c[0]).sort((a, b) => a - b);
if (front.length) {
  const dx = front[Math.floor(front.length / 2)];
  const dz = minZ;
  const gc = gnd(dx, dz);
  const f0 = floorRow(gc, 0), f1 = floorRow(gc, 1);
  // Remove any glass in the door column is handled by overwriting
  put(dx, f0 + 1, dz, "dark_oak_door", { facing: "north", half: "lower", hinge: "left", open: "false", powered: "false" });
  put(dx, f0 + 2, dz, "dark_oak_door", { facing: "north", half: "upper", hinge: "left", open: "false", powered: "false" });
  // Hanging lantern under the entrance spandrel, if the storey height allows it
  if (f1 - 1 === f0 + 4) {
    put(dx, f0 + 3, dz, "lantern", { hanging: "true", waterlogged: "false" });
  }
  // Entrance plinth step
  put(dx, f0, dz, "polished_granite");
}

// Pass 4: rooftop plant penthouse and lightning rod, interior cells only
const pcx = Math.round(cx), pcz = Math.round(cz);
for (let x = minX; x <= maxX; x++) {
  for (let z = minZ; z <= maxZ; z++) {
    if (!inF(x, z) || isPerim(x, z)) continue;
    const dxp = Math.abs(x - cx), dzp = Math.abs(z - cz);
    if (dxp > 5 || dzp > 3) continue;
    const edgeCell = dxp >= 4.5 || dzp >= 2.5;
    for (let y = ROOF + 1; y <= ROOF + 3; y++) {
      if (edgeCell && y === ROOF + 2) put(x, y, z, "light_blue_stained_glass");
      else put(x, y, z, "light_gray_concrete");
    }
    put(x, ROOF + 4, z, "light_gray_concrete");
  }
}
if (inF(pcx, pcz) && !isPerim(pcx, pcz)) {
  for (let y = ROOF + 5; y <= ROOF + 7; y++) {
    put(pcx, y, pcz, "lightning_rod", { facing: "up", powered: "false", waterlogged: "false" });
  }
}

g.save(`${DIR}/${ID}.nbt`);
